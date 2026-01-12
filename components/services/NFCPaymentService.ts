import NetInfo from "@react-native-community/netinfo";
import CryptoJS from "crypto-js";
import * as Keychain from "react-native-keychain";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { getDatabase } from "../lib/utils";

// NFCPaymentService handles NFC-based payments with offline support

class NFCPaymentService {
  isInitialized: boolean = false;
  currentCard: CardInfo | null = null;
  offlineQueue: Transaction[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if NFC is supported
      const isSupported = await NfcManager.isSupported();

      if (isSupported) {
        await NfcManager.start();
        console.log("NFC Manager initialized successfully");
      } else {
        console.warn("NFC is not supported on this device");
      }
    } catch (error) {
      console.warn("NFC initialization failed:", error);
    }

    // Try to initialize database
    // await this.initializeDatabase();
    await this.loadOfflineQueue();

    this.isInitialized = true;
  }

  async initializeDatabase(): Promise<void> {
    try {
      const db = await getDatabase(null);
      if (!db) {
        console.warn("Database not available, continuing without persistence");
        return;
      }

      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              tx_id TEXT UNIQUE NOT NULL,
              txType TEXT NOT NULL,
              card_id TEXT NOT NULL,
              merchant_id TEXT NOT NULL,
              amount INTEGER NOT NULL,
              currency TEXT NOT NULL,
              counter INTEGER NOT NULL,
              timestamp INTEGER NOT NULL,
              signature TEXT NOT NULL,
              status TEXT DEFAULT 'PENDING',
              synced INTEGER DEFAULT 0,
              created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
        []
      );

      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS cards (
                  card_id TEXT PRIMARY KEY,
                  account_id TEXT NOT NULL,
                  balance INTEGER NOT NULL,
                  counter INTEGER NOT NULL,
                  daily_limit INTEGER NOT NULL,
                  single_tx_limit INTEGER NOT NULL,
                  last_sync INTEGER DEFAULT 0,
                  status TEXT DEFAULT 'ACTIVE'
                )`,
        []
      );
    } catch (error) {
      console.warn("Database initialization failed:", error);
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
          []
        )
        .then((queue) => {
          this.offlineQueue = queue;
          console.log(
            `Loaded ${this.offlineQueue.length} offline transactions`
          );
        });
    } catch (error) {
      console.warn("Failed to load offline queue:", error);
      this.offlineQueue = [];
    }
  }

  // Credit card with amount
  async creditCard(amount: number, currency: string = "NGN"): Promise<PaymentResult> {
    try {
      console.log("Starting card credit flow...");

      if (amount <= 0) {
        throw new Error("Invalid credit amount");
      }

      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        throw new Error("NFC is not supported on this device");
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        throw new Error("NFC is disabled. Please enable NFC in device settings");
      }

      await NfcManager.requestTechnology(NfcTech.IsoDep);
      console.log("NFC technology acquired for credit");

      const cardInfo = await this.readCardInfo();
      const credentials = await this.loadCardCredentials(cardInfo.cardId);
      
      const authSuccess = await this.authenticateCard(credentials);
      if (!authSuccess) {
        throw new Error("Card authentication failed");
      }

      const transaction = await this.createCreditTransaction(cardInfo, amount, currency);
      await this.signTransaction(transaction, credentials);
      
      const newBalance = await this.updateCardBalance(cardInfo, credentials, -amount); // Negative for credit
      await this.storeTransaction(transaction);

      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await this.syncTransaction(transaction);
      }

      return {
        success: true,
        transaction: transaction,
        newBalance: newBalance,
        offline: !netState.isConnected,
      };
    } catch (error) {
      console.error("Card credit failed:", error);
      throw error;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log(e);
      }
    }
  }

  // async updateLocalCard(): Promise<void> {
  //   try {
  //     const mockCardInfo: CardInfo = {
  //       cardId: "card_4829",
  //       balance: 50000, // $500.00
  //       counter: 1,
  //       dailyLimit: 100000, // $1000.00
  //       singleTxLimit: 50000, // $500.00
  //     };
      
  //     this.currentCard = mockCardInfo;
  //     console.log("Local card updated:", mockCardInfo);
  //   } catch (error) {
  //     console.error("Failed to update local card:", error);
  //   }
  // }

    async updateLocalCard(
    cardId: string,
    balance: number,
    counter: number
  ): Promise<void> {
    const db = await getDatabase(null);
    if (!db) return;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE cards 
           SET balance = ?, counter = ? 
           WHERE card_id = ?`,
        [balance, counter, cardId]
      );
    });
  }

  // Main payment flow
  async makePayment(
    merchantId: string,
    amount: number,
    currency: string = "NGN"
  ): Promise<PaymentResult> {
    try {
      console.log("Starting payment flow...");

      // Step 1: Validate amount
      if (amount <= 0) {
        throw new Error("Invalid amount");
      }

      // Check if NFC is available
      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        throw new Error("NFC is not supported on this device");
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "NFC is disabled. Please enable NFC in device settings"
        );
      }

      // Step 2: Request NFC
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      console.log("NFC technology acquired");

      // Step 3: Read card information
      const cardInfo = await this.readCardInfo();
      console.log("Card info:", cardInfo);

      // Step 4: Load card credentials
      const credentials = await this.loadCardCredentials(cardInfo.cardId);

      // Step 5: Authenticate with card
      const authSuccess = await this.authenticateCard(credentials);
      if (!authSuccess) {
        throw new Error("Card authentication failed");
      }
      console.log("Card authenticated");

      // Step 6: Check balance and limits
      await this.checkTransactionLimits(cardInfo, amount);

      // Step 7: Create transaction
      const transaction = await this.createTransaction(
        cardInfo,
        merchantId,
        amount,
        currency
      );
      console.log("Transaction created:", transaction.txId);

      // Step 8: Sign transaction
      await this.signTransaction(transaction, credentials);

      // Step 9: Update card balance
      const newBalance = await this.updateCardBalance(
        cardInfo,
        credentials,
        amount
      );
      console.log("New balance:", newBalance);

      // Step 10: Store transaction locally
      await this.storeTransaction(transaction);

      // Step 11: Try to sync with backend
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await this.syncTransaction(transaction);
      }

      return {
        success: true,
        transaction: transaction,
        newBalance: newBalance,
        offline: !netState.isConnected,
      };
    } catch (error) {
      console.error("Payment failed:", error);
      throw error;
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.log(e);
        // Ignore cleanup errors
      }
    }
  }

  async readCardInfo(): Promise<CardInfo> {
    // SELECT application
    const selectAID = [
      0x00,
      0xa4,
      0x04,
      0x00, // SELECT
      0x07, // Length
      0xa0,
      0x00,
      0x00,
      0x00,
      0x03,
      0x10,
      0x10, // AID
      0x00, // Le
    ];

    const selectResponse = await NfcManager.isoDepHandler.transceive(selectAID);

    if (selectResponse.at(-2) !== 0x90 || selectResponse.at(-1) !== 0x00) {
      throw new Error("Failed to select application");
    }

    // GET CARD INFO
    const getInfoCommand = [0x80, 0xca, 0x00, 0x00, 0x00];
    const infoResponse = await NfcManager.isoDepHandler.transceive(
      getInfoCommand
    );

    // Parse response
    // Format: CardID(16) | Balance(8) | Counter(4) | Limits(16)
    const cardId = this.bytesToHex(infoResponse.slice(0, 16));
    const balance = this.bytesToInt64(infoResponse.slice(16, 24));
    const counter = this.bytesToInt32(infoResponse.slice(24, 28));
    const dailyLimit = this.bytesToInt64(infoResponse.slice(28, 36));
    const singleTxLimit = this.bytesToInt64(infoResponse.slice(36, 44));

    return {
      cardId,
      balance,
      counter,
      dailyLimit,
      singleTxLimit,
    };
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
      cak: data.cak, // Card Authentication Key
      cek: data.cek, // Card Encryption Key
      accountId: data.accountId,
    };
  }

  async authenticateCard(credentials: Credentials): Promise<boolean> {
    // Generate random nonce (8 bytes)
    const nonceMobile = this.generateNonce(8);

    // GET CHALLENGE from card
    const challengeCmd = [0x80, 0x84, 0x00, 0x00, 0x08];
    const challengeResponse = await NfcManager.isoDepHandler.transceive(
      challengeCmd
    );
    const nonceCard = challengeResponse.slice(0, 8);

    // Compute MAC
    const timestamp = Math.floor(Date.now() / 1000);
    const macData = [
      ...nonceMobile,
      ...nonceCard,
      ...this.int64ToBytes(timestamp),
    ];

    const mac = CryptoJS.HmacSHA256(
      CryptoJS.lib.WordArray.create(macData),
      CryptoJS.enc.Hex.parse(credentials.cak)
    );
    const macBytes = this.hexToBytes(mac.toString());

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
    const expectedMAC = CryptoJS.HmacSHA256(
      CryptoJS.lib.WordArray.create([...nonceCard, ...nonceMobile]),
      CryptoJS.enc.Hex.parse(credentials.cak)
    );

    return this.bytesToHex(cardMAC) === expectedMAC.toString();
  }

  async checkTransactionLimits(
    cardInfo: CardInfo,
    amount: number
  ): Promise<boolean> {
    // Check single transaction limit
    if (amount > cardInfo.singleTxLimit) {
      throw new Error(
        `Amount exceeds single transaction limit of ${
          cardInfo.singleTxLimit / 100
        }`
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
        `Transaction would exceed daily limit of ${cardInfo.dailyLimit / 100}`
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
      [cardId, todayStart]
    );

    return TodaySpending || 0;
  }

  async createTransaction(
    cardInfo: CardInfo,
    merchantId: string,
    amount: number,
    currency: string
  ): Promise<Transaction> {
    const txId = this.generateTransactionId();
    const timestamp = Math.floor(Date.now() / 1000);
    const newCounter = cardInfo.counter + 1;

    return {
      version: 1,
      txId: txId,
      timestamp: timestamp,
      cardId: cardInfo.cardId,
      merchantId: merchantId,
      amount: amount,
      status: "PENDING",
      currency: currency,
      counter: newCounter,
      txType: "DEBIT",
      signature: "",
      fees: 0,
    };
  }

  async createCreditTransaction(
    cardInfo: CardInfo,
    amount: number,
    currency: string
  ): Promise<Transaction> {
    const txId = this.generateTransactionId();
    const timestamp = Math.floor(Date.now() / 1000);
    const newCounter = cardInfo.counter + 1;

    return {
      version: 1,
      txId: txId,
      timestamp: timestamp,
      cardId: cardInfo.cardId,
      merchantId: "CREDIT_TOP_UP",
      amount: amount,
      status: "PENDING",
      currency: currency,
      counter: newCounter,
      txType: "CREDIT",
      signature: "",
      fees: 0,
    };
  }

  async signTransaction(
    transaction: Transaction,
    credentials: Credentials
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

    const signature = CryptoJS.HmacSHA256(
      CryptoJS.lib.WordArray.create(data),
      CryptoJS.enc.Hex.parse(credentials.cak)
    );

    transaction.signature = signature.toString();
  }

  async updateCardBalance(
    cardInfo: CardInfo,
    credentials: Credentials,
    amount: number
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

    // Encrypt using AES-CBC (GCM not available in CryptoJS)
    const key = CryptoJS.enc.Hex.parse(credentials.cek);
    const plaintextWordArray = CryptoJS.lib.WordArray.create(plaintext);

    const encrypted = CryptoJS.AES.encrypt(plaintextWordArray, key, {
      iv: CryptoJS.lib.WordArray.create(nonce.slice(0, 4)), // Use first 16 bytes as IV
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ciphertext = [
      ...nonce,
      ...this.hexToBytes(encrypted.ciphertext.toString()),
    ];

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

    // Update local database
    await this.updateLocalCard(cardInfo.cardId, newBalance, newCounter);

    return newBalance;
  }

  async storeTransaction(transaction: Transaction): Promise<void> {
    const db = await getDatabase(null);
    if (!db) return;

    await db.withTransactionAsync(async () => {
      await db
        .runAsync(
          `INSERT INTO transactions 
           (tx_id, card_id, merchant_id, amount, currency, counter, timestamp, signature, status, synced) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 0)`,
          [
            transaction.txId,
            transaction.cardId,
            transaction.merchantId,
            transaction.amount,
            transaction.currency,
            transaction.counter,
            transaction.timestamp,
            transaction.signature ?? "",
          ]
        )
        .then(() => this.offlineQueue.push(transaction));
    });
  }

  async syncWithBackend(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      console.log("No transactions to sync");
      return;
    }

    console.log(`Syncing ${this.offlineQueue.length} transactions...`);

    try {
      const response = await fetch(
        "https://api.example.com/transactions/batch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await this.getAuthToken()}`,
          },
          body: JSON.stringify({
            transactions: this.offlineQueue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const result = await response.json();

      // Update local database
      for (const tx of result.processed) {
        await this.markTransactionSynced(tx.txId);
      }

      // Reload queue
      await this.loadOfflineQueue();

      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  async syncTransaction(transaction: Transaction): Promise<void> {
    try {
      const response = await fetch("https://api.example.com/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`,
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
    const db = await getDatabase(null);
    if (!db) return;

    await db.withTransactionAsync(async () => {
      await db.runAsync("UPDATE transactions SET synced = 1 WHERE tx_id = ?", [
        txId,
      ]);
    });
  }

  async getAuthToken(): Promise<string> {
    const credentials = await Keychain.getGenericPassword({
      service: "nfc-payment-auth",
    });

    if (!credentials) {
      throw new Error("Not authenticated");
    }

    return credentials.password;
  }

  // Utility functions
  generateNonce(length: number): number[] {
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array);
  }

  generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `TX-${timestamp}-${random}`;
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

  bytesToInt64(bytes: number[]): number {
    let value = 0;
    for (let i = 0; i < 8; i++) {
      value = value * 256 + bytes[i];
    }
    return value;
  }

  bytesToInt32(bytes: number[]): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      value = value * 256 + bytes[i];
    }
    return value;
  }

  int64ToBytes(value: number): number[] {
    const bytes = [];
    for (let i = 7; i >= 0; i--) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  int32ToBytes(value: number): number[] {
    const bytes = [];
    for (let i = 3; i >= 0; i--) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  stringToBytes(str: string): number[] {
    return Array.from(str).map((c) => c.charCodeAt(0));
  }

  async cleanup(): Promise<void> {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.warn("Error during NFC cleanup:", error);
    }
  }
}

export default new NFCPaymentService();
