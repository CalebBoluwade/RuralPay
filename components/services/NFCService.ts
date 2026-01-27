import NetInfo from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import * as Keychain from "react-native-keychain";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { getDatabase } from "../../lib/utils";
import { BankTransferService } from "./BankTransferService";
import ToastService from "./ToastService";

// NFCPaymentService handles NFC-based payments with offline support

// APDU Commands
const APDU_COMMANDS = {
  // SELECT PPSE (Proximity Payment System Environment)
  SELECT_PPSE: [
    0x00, 0xa4, 0x04, 0x00, 0x0e, 0x32, 0x50, 0x41, 0x59, 0x2e, 0x53, 0x59,
    0x53, 0x2e, 0x44, 0x44, 0x46, 0x30, 0x31, 0x00,
  ],

  // SELECT Application (Visa)
  SELECT_VISA: [
    0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x03, 0x10, 0x10,
    0x00,
  ],

  // SELECT Application (Mastercard)
  SELECT_MASTERCARD: [
    0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x04, 0x10, 0x10,
    0x00,
  ],

  // Get Processing Options
  GPO: [0x80, 0xa8, 0x00, 0x00, 0x02, 0x83, 0x00, 0x00],

  // Read Record (template - update P1, P2 for different records)
  READ_RECORD: [0x00, 0xb2, 0x01, 0x0c, 0x00],
};

class NFCService {
  isInitialized: boolean = false;
  currentCard: CardInfo | null = null;

  isReading: boolean = false;

  offlineQueue: Transaction[] = [];
  private cardAIDsCache: { name: string; aid: number[] }[] | null = null;

  async initialize() {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        this.isInitialized = true;
        ToastService.success("NFC initialized");
        return true;
      }
      ToastService.error("NFC not supported");
      return false;
    } catch (error) {
      console.warn("NFC initialization failed:", error);
      ToastService.error("Failed to initialize NFC");
      return false;
    }
  }

  async loadOfflineQueue(): Promise<void> {
    try {
      const db = await getDatabase(null);
      if (!db) {
        this.offlineQueue = [];
        return;
      }

      await db
        .getAllAsync<Transaction>(
          "SELECT * FROM transactions WHERE synced = 0 ORDER BY timestamp ASC",
          [],
        )
        .then((queue) => {
          this.offlineQueue = queue;
          console.log(
            `Loaded ${this.offlineQueue.length} offline transactions`,
          );
        });
    } catch (error) {
      console.warn("Failed to load offline queue:", error);
      this.offlineQueue = [];
    }
  }

  generateCardId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  async isSupported() {
    try {
      return await NfcManager.isSupported();
    } catch {
      return false;
    }
  }

  async isEnabled() {
    try {
      return await NfcManager.isEnabled();
    } catch {
      return false;
    }
  }

  async readCardInfo(
    useIsoDep: boolean = false,
    skipCancel: boolean = false,
  ): Promise<CardInfo> {
    if (!useIsoDep) {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      try {
        const tag = await NfcManager.getTag();
        if (!tag) throw new Error("No NFC tag detected");

        ToastService.info(`NFC Tag detected: ${tag.type}`);

        return {
          cardId: tag.id || this.generateCardId(),
          balance: 0,
          counter: 0,
          dailyLimit: 0,
          singleTxLimit: 0,
        };
      } finally {
        if (!skipCancel) {
          await NfcManager.cancelTechnologyRequest();
        }
      }
    }

    // ISO-DEP
    await NfcManager.requestTechnology(NfcTech.IsoDep);

    try {
      const CARD_AIDS = this.getCardAIDs();
      let selectResponse: number[] | null = null;
      let cardScheme = "";

      for (const { name, aid } of CARD_AIDS) {
        try {
          selectResponse = await Promise.race([
            NfcManager.isoDepHandler.transceive(aid),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 3000),
            ),
          ]);

          const sw1 = selectResponse.at(-2);
          const sw2 = selectResponse.at(-1);

          if (sw1 === 0x90 && sw2 === 0x00) {
            cardScheme = name;
            ToastService.info(`${name} Card detected`);
            break;
          }
        } catch (e) {
          console.error("AID failed:", name, e);
        }
      }

      if (!selectResponse || !cardScheme) {
        throw new Error(
          "Unsupported card. Supported: " +
            CARD_AIDS.map((a) => a.name).join(", "),
        );
      }

      // GET CARD INFO
      const getInfoCommand = [0x80, 0xca, 0x00, 0x00, 0x00];
      const infoResponse =
        await NfcManager.isoDepHandler.transceive(getInfoCommand);

      const cardInfo: CardInfo = {
        cardId: this.bytesToHex(infoResponse.slice(0, 16)),
        balance: this.bytesToInt64(infoResponse.slice(16, 24)),
        counter: this.bytesToInt32(infoResponse.slice(24, 28)),
        dailyLimit: this.bytesToInt64(infoResponse.slice(28, 36)),
        singleTxLimit: this.bytesToInt64(infoResponse.slice(36, 44)),
      };

      return cardInfo;
    } finally {
      if (!skipCancel) {
        await NfcManager.cancelTechnologyRequest();
      }
    }
  }

  async loadCardCredentials(cardId: string): Promise<Credentials> {
    const credentials = await Keychain.getGenericPassword({
      service: `nfc-card-${cardId}`,
    });

    if (!credentials) {
      throw new Error("Card not registered on this device");
    }

    const data = JSON.parse(credentials.password);
    return {
      cardId: cardId,
      cak: data.cak,
      cek: data.cek,
      accountId: data.accountId,
    };
  }

  async authenticateCard(credentials: Credentials): Promise<boolean> {
    // Generate random nonce (8 bytes)
    const nonceMobile = this.generateNonce(8);

    // GET CHALLENGE from card
    const challengeCmd = [0x80, 0x84, 0x00, 0x00, 0x08];
    const challengeResponse =
      await NfcManager.isoDepHandler.transceive(challengeCmd);
    const nonceCard = challengeResponse.slice(0, 8);

    // Compute MAC
    const timestamp = Math.floor(Date.now() / 1000);
    const macData = [
      ...nonceMobile,
      ...nonceCard,
      ...this.int64ToBytes(timestamp),
    ];

    const mac = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.bytesToHex([...macData, ...this.hexToBytes(credentials.cak)]),
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    const macBytes = this.hexToBytes(mac);

    // MUTUAL AUTHENTICATE
    const authCmd = [
      0x80,
      0x82,
      0x00,
      0x00,
      nonceMobile.length + macBytes.length,
      ...nonceMobile,
      ...macBytes,
      0x00,
    ];

    const authResponse = await NfcManager.isoDepHandler.transceive(authCmd);

    // Check response
    if (authResponse.at(-2) !== 0x90 || authResponse.at(-1) !== 0x00) {
      return false;
    }

    // Verify card's MAC
    const cardMAC = authResponse.slice(0, 32);
    const expectedMAC = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.bytesToHex([
        ...nonceCard,
        ...nonceMobile,
        ...this.hexToBytes(credentials.cak),
      ]),
      { encoding: Crypto.CryptoEncoding.HEX },
    );

    return this.bytesToHex(cardMAC) === expectedMAC;
  }

  async processPayment(
    merchantId: string,
    amount: number,
    currency: string = "NGN",
    isCredit: boolean = false,
  ): Promise<PaymentResult> {
    try {
      ToastService.info("Hold Card Near Device...");

      if (amount <= 0) {
        throw new Error("Invalid amount");
      }

      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        throw new Error("NFC is not supported on this device");
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "NFC is disabled. Please enable NFC in device settings",
        );
      }

      const cardInfo = await this.readCardInfo(true, true);
      // const credentials = await this.loadCardCredentials(cardInfo.cardId);

      // const authSuccess = await this.authenticateCard(credentials);
      // if (!authSuccess) {
      //   throw new Error("Card Authentication Failed");
      // }

      console.log(cardInfo);

      if (!isCredit) {
        await this.checkTransactionLimits(cardInfo, amount);
      }

      const transaction = isCredit
        ? await this.createCreditTransaction(cardInfo, amount, currency)
        : await this.createTransaction(cardInfo, merchantId, amount, currency);

      // await this.signTransaction(transaction, credentials);

      // const newBalance = await this.updateCardBalance(
      //   cardInfo,
      //   credentials,
      //   isCredit ? -amount : amount,
      // );

      await this.storeTransaction(transaction);

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await this.syncTransaction(transaction);
      }

      const message = isCredit
        ? `Card topped up ₦${(amount / 100).toFixed(2)}`
        : `Payment of ₦${(amount / 100).toFixed(2)} successful!`;

      ToastService.success(message);
      return {
        success: true,
        transaction: transaction,
        newBalance: 0,
        offline: !netState.isConnected,
      };
    } catch (error) {
      console.error("Payment failed:", error);
      ToastService.error(
        error instanceof Error ? error.message : "Payment failed",
      );
      throw error;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log(e);
      }
    }
  }

  async makePayment(
    merchantId: string,
    amount: number,
    currency: string = "NGN",
  ): Promise<PaymentResult> {
    return this.processPayment(merchantId, amount, currency, false);
  }

  async creditCard(
    amount: number,
    currency: string = "NGN",
  ): Promise<PaymentResult> {
    return this.processPayment("CREDIT_TOP_UP", amount, currency, true);
  }

  // private async executeDbTransaction<T>(
  //   callback: (db: any) => Promise<T>
  // ): Promise<T | undefined> {
  //   const db = await getDatabase(null);
  //   if (!db) return undefined;
  //   return await db.withTransactionAsync(() => callback(db));
  // }

  // async updateLocalCard(
  //   cardId: string,
  //   balance: number,
  //   counter: number
  // ): Promise<void> {
  //   await this.executeDbTransaction(async (db) => {
  //     await db.runAsync(
  //       `UPDATE cards SET balance = ?, counter = ? WHERE card_id = ?`,
  //       [balance, counter, cardId]
  //     );
  //   });
  // }

  async checkTransactionLimits(
    cardInfo: CardInfo,
    amount: number,
  ): Promise<boolean> {
    // Check single transaction limit
    if (amount > cardInfo.singleTxLimit) {
      throw new Error(
        `Amount exceeds single transaction limit of ${
          cardInfo.singleTxLimit / 100
        }`,
      );
    }

    // Check balance
    if (amount > cardInfo.balance) {
      throw new Error("Insufficient balance");
    }

    // Check daily limit
    const todaySpent = await this.getTodaySpending(cardInfo.cardId);
    if (todaySpent + amount > cardInfo.dailyLimit) {
      throw new Error(
        `Transaction would exceed daily limit of ${cardInfo.dailyLimit / 100}`,
      );
    }

    return true;
  }

  async getTodaySpending(cardId: string): Promise<number> {
    const db = await getDatabase(null);
    if (!db) return 0;

    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const TodaySpending = await db.getFirstAsync<number>(
      `SELECT SUM(amount) as total 
           FROM transactions 
           WHERE card_id = ? 
           AND timestamp >= ? 
           AND status != 'FAILED'`,
      [cardId, todayStart],
    );

    return TodaySpending || 0;
  }

  private createTransactionBase(
    cardInfo: CardInfo,
    merchantId: string,
    amount: number,
    currency: string,
    txType: "DEBIT" | "CREDIT",
  ): Transaction {
    return {
      version: 1,
      txId: BankTransferService.generateTransactionId(),
      timestamp: Math.floor(Date.now() / 1000),
      cardId: cardInfo.cardId,
      merchantId,
      amount,
      status: "PENDING",
      currency,
      counter: cardInfo.counter + 1,
      txType,
      signature: "",
      fees: 0,
    };
  }

  async createTransaction(
    cardInfo: CardInfo,
    merchantId: string,
    amount: number,
    currency: string,
  ): Promise<Transaction> {
    return this.createTransactionBase(
      cardInfo,
      merchantId,
      amount,
      currency,
      "DEBIT",
    );
  }

  async createCreditTransaction(
    cardInfo: CardInfo,
    amount: number,
    currency: string,
  ): Promise<Transaction> {
    return this.createTransactionBase(
      cardInfo,
      "CREDIT_TOP_UP",
      amount,
      currency,
      "CREDIT",
    );
  }

  async signTransaction(
    transaction: Transaction,
    credentials: Credentials,
  ): Promise<void> {
    // Canonical serialization
    const data = [
      transaction.version,
      ...this.stringToBytes(transaction.txId),
      ...this.int64ToBytes(transaction.timestamp),
      ...this.hexToBytes(transaction.cardId),
      ...this.stringToBytes(transaction.merchantId),
      ...this.int64ToBytes(transaction.amount),
      ...this.stringToBytes(transaction.currency),
      ...this.int32ToBytes(transaction.counter),
      ...this.stringToBytes(transaction.txType),
    ];

    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.bytesToHex([...data, ...this.hexToBytes(credentials.cak)]),
      { encoding: Crypto.CryptoEncoding.HEX },
    );

    transaction.signature = signature;
  }

  async updateCardBalance(
    cardInfo: CardInfo,
    credentials: Credentials,
    amount: number,
  ): Promise<number> {
    const newBalance = cardInfo.balance - amount;
    const newCounter = cardInfo.counter + 1;

    // Encrypt new balance
    const plaintext = [
      ...this.int64ToBytes(newBalance),
      ...this.int32ToBytes(newCounter),
      ...this.int32ToBytes(newBalance ^ newCounter), // Checksum
    ];

    // Create nonce
    const nonce = [
      ...this.int32ToBytes(newCounter),
      ...this.int64ToBytes(Math.floor(Date.now() / 1000)),
    ];

    // Encrypt using AES (simplified for expo-crypto)
    const plaintextHex = this.bytesToHex(plaintext);
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      plaintextHex + credentials.cek + this.bytesToHex(nonce),
      { encoding: Crypto.CryptoEncoding.HEX },
    );

    const ciphertext = [...nonce, ...this.hexToBytes(encrypted)];

    // UPDATE BALANCE command
    const updateCmd = [
      0x80,
      0xd0,
      0x00,
      0x00,
      ciphertext.length,
      ...ciphertext,
      0x00,
    ];

    const updateResponse = await NfcManager.isoDepHandler.transceive(updateCmd);

    if (updateResponse.at(-2) !== 0x90 || updateResponse.at(-1) !== 0x00) {
      throw new Error("Failed to update card balance");
    }

    return newBalance;
  }

  async storeTransaction(transaction: Transaction): Promise<void> {
    // await this.executeDbTransaction(async (db) => {
    //   await db.runAsync(
    //     `INSERT INTO transactions
    //      (tx_id, card_id, merchant_id, amount, currency, counter, timestamp, signature, status, synced)
    //      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 0)`,
    //     [
    //       transaction.txId,
    //       transaction.cardId,
    //       transaction.merchantId,
    //       transaction.amount,
    //       transaction.currency,
    //       transaction.counter,
    //       transaction.timestamp,
    //       transaction.signature ?? "",
    //     ]
    //   );
    //   this.offlineQueue.push(transaction);
    // });
  }

  async syncWithBackend(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    ToastService.info(`Syncing ${this.offlineQueue.length} transactions...`);

    try {
      const response = await fetch(
        "https://api.example.com/transactions/batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactions: this.offlineQueue,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const result = await response.json();

      for (const tx of result.processed) {
        await this.markTransactionSynced(tx.txId);
      }

      await this.loadOfflineQueue();

      ToastService.success("Transactions synced");
    } catch (error) {
      console.error("Sync failed:", error);
      ToastService.error("Failed to sync transactions");
    }
  }

  async syncTransaction(transaction: Transaction): Promise<void> {
    try {
      const response = await fetch("https://api.example.com/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          transaction: transaction,
        }),
      });

      if (response.ok) {
        await this.markTransactionSynced(transaction.txId);
        console.log("Transaction synced immediately");
      }
    } catch (error) {
      console.log("Immediate sync failed, will retry later:", error);
    }
  }

  async markTransactionSynced(txId: string): Promise<void> {
    // await this.executeDbTransaction(async (db) => {
    //   await db.runAsync(
    //     "UPDATE transactions SET synced = 1 WHERE tx_id = ?",
    //     [txId]
    //   );
    // });
  }

  // Utility functions
  generateNonce(length: number): number[] {
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array);
  }

  bytesToHex(bytes: number[]): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(Number.parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  private bytesToInt(bytes: number[], size: number): number {
    let value = 0;
    for (let i = 0; i < size; i++) {
      value = value * 256 + bytes[i];
    }
    return value;
  }

  private intToBytes(value: number, size: number): number[] {
    const bytes = [];
    for (let i = size - 1; i >= 0; i--) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  bytesToInt64(bytes: number[]): number {
    return this.bytesToInt(bytes, 8);
  }

  bytesToInt32(bytes: number[]): number {
    return this.bytesToInt(bytes, 4);
  }

  int64ToBytes(value: number): number[] {
    return this.intToBytes(value, 8);
  }

  int32ToBytes(value: number): number[] {
    return this.intToBytes(value, 4);
  }

  stringToBytes(str: string): number[] {
    return Array.from(str).map((c) => c.charCodeAt(0));
  }

  getCardAIDs(): { name: string; aid: number[] }[] {
    if (this.cardAIDsCache) return this.cardAIDsCache;

    const envAIDs = process.env.EXPO_PUBLIC_NFC_CARD_AIDS;

    if (!envAIDs) {
      this.cardAIDsCache = [
        {
          name: "Mastercard",
          aid: [
            0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x04, 0x10,
            0x10, 0x00,
          ],
        },
        {
          name: "Visa",
          aid: [
            0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x03, 0x10,
            0x10, 0x00,
          ],
        },
        {
          name: "Maestro",
          aid: [
            0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x04, 0x30,
            0x60, 0x00,
          ],
        },
        {
          name: "Verve",
          aid: [
            0x00, 0xa4, 0x04, 0x00, 0x07, 0xa0, 0x00, 0x00, 0x00, 0x03, 0x71,
            0x00, 0x00,
          ],
        },
      ];
      return this.cardAIDsCache;
    }

    this.cardAIDsCache = envAIDs.split(",").map((entry) => {
      const [name, hexAid] = entry.split(":");
      return { name: name.trim(), aid: this.hexToBytes(hexAid.trim()) };
    });

    return this.cardAIDsCache;
  }

  async stopNFC() {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.warn("Error stopping NFC:", error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.stopNFC();
      if (this.isInitialized) {
        await NfcManager.unregisterTagEvent();
      }
    } catch (error) {
      console.warn("Cleanup error:", error);
    }
  }

  async readCard() {
    try {
      this.isReading = true;

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.IsoDep);

      console.log("Card detected, reading...");

      // Step 1: Select PPSE
      const ppseResponse = await this.sendAPDU(APDU_COMMANDS.SELECT_PPSE);
      const applications = this.parsePPSE(ppseResponse);

      if (!applications || applications.length === 0) {
        throw new Error("No payment applications found on card");
      }

      console.log("Found applications:", applications);

      // Step 2: Select first available application
      const selectedApp = applications[0];
      const selectAppResponse = await this.selectApplication(selectedApp.aid);

      console.log(
        "APPLICATIONS",
        applications,
        "selectedApp",
        selectedApp,
        selectAppResponse,
      );

      // Step 3: Get Processing Options
      const gpoResponse = await this.sendAPDU(APDU_COMMANDS.GPO);
      const processingOptions = this.parseGPO(gpoResponse);

      // Step 4: Read application data
      const cardData = await this.readApplicationData(processingOptions);

      // Step 5: Parse card information
      const cardInfo = this.parseCardData(cardData);

      this.currentCard = cardInfo;

      return {
        success: true,
        cardData: cardInfo,
      };
    } catch (error: any) {
      console.error("Card reading error:", error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.isReading = false;
      await this.cleanup();
    }
  }

  async sendAPDU(command: number[]): Promise<number[]> {
    try {
      const response = await NfcManager.isoDepHandler.transceive(command);

      // Check status words (last 2 bytes)
      const sw1 = response[response.length - 2];
      const sw2 = response[response.length - 1];

      if (sw1 !== 0x90 || sw2 !== 0x00) {
        console.warn(
          `APDU warning: SW1=${sw1.toString(16)}, SW2=${sw2.toString(16)}`,
        );
      }

      return response;
    } catch (error) {
      console.error("APDU command error:", error);
      throw error;
    }
  }

  parsePPSE(response: number[]): { aid: number[]; label: string }[] {
    // Parse PPSE response to extract AIDs
    const applications: { aid: number[]; label: string }[] = [];

    try {
      const tlvData = this.parseTLV(response);

      // Look for FCI Template (Tag 6F)
      const fciTemplate = tlvData["6F"];
      if (fciTemplate) {
        // Look for FCI Proprietary Template (Tag A5)
        const fciProprietaryBytes = this.hexStringToBytes(fciTemplate);
        const fciProprietary = this.parseTLV(fciProprietaryBytes)["A5"];
        if (fciProprietary) {
          // Look for Directory Entry (Tag 61)
          const fciProprietaryBytes2 = this.hexStringToBytes(fciProprietary);
          const directoryEntries = this.findAllTags(fciProprietaryBytes2, "61");

          directoryEntries.forEach((entry) => {
            const entryData = this.parseTLV(entry);
            // AID is Tag 4F
            if (entryData["4F"]) {
              applications.push({
                aid: this.hexStringToBytes(entryData["4F"]),
                label: entryData["50"]
                  ? this.hexToString(entryData["50"])
                  : "Unknown",
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("PPSE parsing error:", error);
    }

    return applications;
  }

  async selectApplication(aid: number[]): Promise<number[]> {
    // Build SELECT command with AID
    const command = [0x00, 0xa4, 0x04, 0x00, aid.length, ...aid, 0x00];

    return await this.sendAPDU(command);
  }

  parseGPO(response: number[]): { afl?: string; aip?: string } {
    // Parse GPO response
    try {
      const tlvData = this.parseTLV(response);

      return {
        afl: tlvData["94"], // Application File Locator
        aip: tlvData["82"], // Application Interchange Profile
      };
    } catch (error) {
      console.error("GPO parsing error:", error);
      return {};
    }
  }

  async readApplicationData(processingOptions: { afl?: string; aip?: string }) {
    const records: any[] = [];

    if (!processingOptions.afl) {
      return records;
    }

    // AFL format: [SFI, first record, last record, # offline records]
    const afl = this.hexStringToBytes(processingOptions.afl);

    // Process each AFL entry (4 bytes each)
    for (let i = 0; i < afl.length; i += 4) {
      const sfi = afl[i] >> 3; // Short File Identifier
      const firstRecord = afl[i + 1];
      const lastRecord = afl[i + 2];

      // Read each record
      for (let recordNum = firstRecord; recordNum <= lastRecord; recordNum++) {
        const readCommand = [0x00, 0xb2, recordNum, (sfi << 3) | 0x04, 0x00];
        const recordData = await this.sendAPDU(readCommand);
        records.push(recordData);
      }
    }

    return records;
  }

  parseCardData(records: any[]): any {
    const cardInfo = {
      pan: "",
      expiryDate: "",
      cardholderName: "",
      applicationLabel: "",
      track2: "",
      applicationCryptogram: "",
      cvr: "",
      atc: "",
    };

    // Combine all records
    const allData = records.reduce((acc, record) => [...acc, ...record], []);
    const tlvData = this.parseTLV(allData);

    // Extract key fields

    // PAN (Tag 5A)
    if (tlvData["5A"]) {
      cardInfo.pan = this.parsePAN(tlvData["5A"]);
    }

    // Expiry Date (Tag 5F24)
    if (tlvData["5F24"]) {
      cardInfo.expiryDate = this.parseExpiryDate(tlvData["5F24"]);
    }

    // Cardholder Name (Tag 5F20)
    if (tlvData["5F20"]) {
      cardInfo.cardholderName = this.hexToString(tlvData["5F20"]).trim();
    }

    // Application Label (Tag 50)
    if (tlvData["50"]) {
      cardInfo.applicationLabel = this.hexToString(tlvData["50"]).trim();
    }

    // Track 2 Equivalent Data (Tag 57)
    if (tlvData["57"]) {
      const track2Data = this.parseTrack2(tlvData["57"]);
      cardInfo.track2 = track2Data ? JSON.stringify(track2Data) : "";

      // Extract PAN and expiry from Track 2 if not already found
      if (track2Data && !cardInfo.pan) {
        cardInfo.pan = track2Data.pan;
      }
      if (track2Data && !cardInfo.expiryDate) {
        cardInfo.expiryDate = track2Data.expiryDate;
      }
    }

    // Application Cryptogram (Tag 9F26)
    if (tlvData["9F26"]) {
      cardInfo.applicationCryptogram = tlvData["9F26"];
    }

    // Card Verification Results (Tag 9F27)
    if (tlvData["9F27"]) {
      cardInfo.cvr = tlvData["9F27"];
    }

    // Application Transaction Counter (Tag 9F36)
    if (tlvData["9F36"]) {
      cardInfo.atc = tlvData["9F36"];
    }

    return cardInfo;
  }

  parseTLV(data: number[]) {
    const result: { [key: string]: string } = {};
    let i = 0;

    while (i < data.length) {
      // Get tag
      let tag = data[i].toString(16).padStart(2, "0").toUpperCase();
      i++;

      // Check if tag is multi-byte
      if ((data[i - 1] & 0x1f) === 0x1f) {
        tag += data[i].toString(16).padStart(2, "0").toUpperCase();
        i++;
      }

      // Get length
      let length = data[i];
      i++;

      // Check if length is multi-byte
      if (length & 0x80) {
        const numLengthBytes = length & 0x7f;
        length = 0;
        for (let j = 0; j < numLengthBytes; j++) {
          length = (length << 8) | data[i];
          i++;
        }
      }

      // Get value
      const value = data.slice(i, i + length);
      i += length;

      // Store as hex string
      result[tag] = Array.from(value)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    return result;
  }

  findAllTags(data: number[], tag: string) {
    // Find all occurrences of a tag in data
    const results = [];
    let i = 0;

    while (i < data.length) {
      const currentTag = data[i].toString(16).padStart(2, "0").toUpperCase();
      i++;

      let length = data[i];
      i++;

      if (length & 0x80) {
        const numLengthBytes = length & 0x7f;
        length = 0;
        for (let j = 0; j < numLengthBytes; j++) {
          length = (length << 8) | data[i];
          i++;
        }
      }

      const value = data.slice(i, i + length);
      i += length;

      if (currentTag === tag.toUpperCase()) {
        results.push(value);
      }
    }

    return results;
  }

  parsePAN(hexString: string): string {
    // Remove padding (F)
    return hexString.replace(/F/g, "");
  }

  parseExpiryDate(hexString: string): string {
    // Format: YYMMDD
    const year = hexString.substring(0, 2);
    const month = hexString.substring(2, 4);
    return `${month}/20${year}`;
  }

  parseTrack2(
    hexString: string,
  ): { pan: string; expiryDate: string; serviceCode: string } | null {
    // Track 2 format: PAN=YYMM...
    const parts = hexString.split("D");

    if (parts.length < 2) {
      return null;
    }

    const pan = parts[0].replace(/F/g, "");
    const expiryYear = parts[1].substring(0, 2);
    const expiryMonth = parts[1].substring(2, 4);

    return {
      pan: pan,
      expiryDate: `${expiryMonth}/20${expiryYear}`,
      serviceCode: parts[1].substring(4, 7),
    };
  }

  hexToString(hexString: string): string {
    let result = "";
    for (let i = 0; i < hexString.length; i += 2) {
      const byte = Number.parseInt(hexString.substr(i, 2), 16);
      if (byte !== 0) {
        // Skip null bytes
        result += String.fromCharCode(byte);
      }
    }
    return result;
  }

  hexStringToBytes(hexString: string): number[] {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(Number.parseInt(hexString.substr(i, 2), 16));
    }
    return bytes;
  }
}

export default new NFCService();
