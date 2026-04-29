import * as Crypto from "expo-crypto";
import * as Keychain from "react-native-keychain";
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

import { ErrorHandler } from "../utils/ErrorHandler";
import EncryptionService from "./EncryptionService";
import { integrityService } from "./IntegrityService";
import PaymentService from "./PaymentService";
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

        return true;
      }

      ToastService.error("NFC Not Supported on Device");
      return false;
    } catch (error) {
      await ErrorHandler.handle(error as Error, {
        action: "nfc_initialize",
      });
      ToastService.error("Failed to initialize NFC");
      return false;
    }
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

  // TapToPayShareAndroid = async (content: string) => {
  //   if (Platform.OS !== "android") {
  //     if (__DEV__) console.warn("HCE is Only Supported on Android");
  //     return;
  //   }
  //   try {
  //     const HCE = await import("react-native-hce");
  //     const {
  //       NFCTagType4,
  //       NFCTagType4NDEFContentType,
  //       default: HCEDefault,
  //     } = HCE;

  //     const tag = new NFCTagType4({
  //       type: NFCTagType4NDEFContentType.Text,
  //       content,
  //       writable: false,
  //     });

  //     const hceSession = new HCEDefault.HCESession();
  //     hceSession.setApplication(tag);
  //     hceSession.setEnabled(true);
  //     if (__DEV__)
  //       console.log("HCE Session Active: Phone is now acting as a tag");
  //   } catch (error) {
  //     if (__DEV__) console.error("HCE Error:", error);
  //   }
  // };

  ReceiveSharedData = async () => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (!tag) {
        throw new Error("No NFC tag detected");
      }
      ToastService.info(`NFC Tag detected: ${tag.type}`);

      if (tag.ndefMessage) {
        const rawData = tag.ndefMessage[0].payload;
        if (__DEV__) console.log(rawData);
        const sessionUrl = this.decodeSharedDataPayload(rawData); // e.g., "my-app://transfer/12345"

        // Extract ID and call your API
        // const sessionId = sessionUrl.split('/').pop();
        // await confirmTransferWithServer(sessionId);
      }
    } finally {
      await NfcManager.cancelTechnologyRequest();
      NfcManager.cancelTechnologyRequest();
    }
  };

  // private decodeSharedDataPayload = (payload: any) => {
  //   // NDEF Text records have a 'Status Byte' at index 0
  //   // which holds the language code length.
  //   const languageCodeLength = payload[0] & 0x3f;
  //   const text = Ndef.util.decodeBytes(payload.slice(languageCodeLength + 1));
  //   return text;
  // };

  private decodeSharedDataPayload = (payload: number[]): string => {
    if (!payload || payload.length === 0) return "";

    // NDEF Text Record: The first byte is the "status byte"
    // Bit 7: 0 = UTF-8, 1 = UTF-16
    // Bits 5-0: length of the language code (e.g., "en")
    const languageCodeLength = payload[0] & 0x3f;

    // Slice off the status byte and the language code to get the actual data
    const actualData = payload.slice(1 + languageCodeLength);

    // Use bytesToString which is available in the Ndef utility
    return Ndef.util.bytesToString(actualData);
  };

  // async readCardInfo(
  //   useIsoDep: boolean = false,
  //   skipCancel: boolean = false,
  // ): Promise<CardInfo> {
  //   if (!useIsoDep) {
  //     await NfcManager.requestTechnology(NfcTech.Ndef);

  //     try {
  //       const tag = await NfcManager.getTag();
  //       if (!tag) throw new Error("No NFC tag detected");

  //       ToastService.info(`NFC Tag detected: ${tag.type}`);

  //       return {
  //         cardId: tag.id || this.generateCardId(),
  //         balance: 0,
  //         counter: 0,
  //         dailyLimit: 0,
  //         singleTxLimit: 0,
  //       };
  //     } finally {
  //       if (!skipCancel) {
  //         await NfcManager.cancelTechnologyRequest();
  //       }
  //     }
  //   }

  //   // ISO-DEP
  //   await NfcManager.requestTechnology(NfcTech.IsoDep);

  //   try {
  //     const CARD_AIDS = this.getCardAIDs();
  //     let selectResponse: number[] | null = null;
  //     let cardScheme = "";

  //     for (const { name, aid } of CARD_AIDS) {
  //       try {
  //         selectResponse = await Promise.race([
  //           NfcManager.isoDepHandler.transceive(aid),
  //           new Promise<never>((_, reject) =>
  //             setTimeout(() => reject(new Error("Timeout")), 3000),
  //           ),
  //         ]);

  //         const sw1 = selectResponse.at(-2);
  //         const sw2 = selectResponse.at(-1);

  //         if (sw1 === 0x90 && sw2 === 0x00) {
  //           cardScheme = name;
  //           ToastService.info(`${name} Card detected`);
  //           break;
  //         }
  //       } catch (e) {
  //        if (__DEV__) console.error("AID failed:", name, e);
  //       }
  //     }

  //     if (!selectResponse || !cardScheme) {
  //       throw new Error(
  //         "Unsupported card. Supported: " +
  //           CARD_AIDS.map((a) => a.name).join(", "),
  //       );
  //     }

  //     // GET CARD INFO
  //     const getInfoCommand = [0x80, 0xca, 0x00, 0x00, 0x00];
  //     const infoResponse =
  //       await NfcManager.isoDepHandler.transceive(getInfoCommand);

  //     const cardInfo: CardInfo = {
  //       cardId: this.bytesToHex(infoResponse.slice(0, 16)),
  //       balance: this.bytesToInt64(infoResponse.slice(16, 24)),
  //       counter: this.bytesToInt32(infoResponse.slice(24, 28)),
  //       dailyLimit: this.bytesToInt64(infoResponse.slice(28, 36)),
  //       singleTxLimit: this.bytesToInt64(infoResponse.slice(36, 44)),
  //     };

  //     return cardInfo;
  //   } finally {
  //     if (!skipCancel) {
  //       await NfcManager.cancelTechnologyRequest();
  //     }
  //   }
  // }

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

  /**
   * Generates an ISO 9564-1 Format 0 PIN Block.
   * This is required for ISO 8583 Field 52.
   * * @param pin The PIN entered by user (e.g. "1234")
   * @param pan The Full PAN from the card (e.g. "5399...")
   */
  formatISO0Block(pin: string, pan: string): string {
    // 1. Prepare PIN Block (Block A)
    // Format: 0 + Len(1 digit) + PIN + Padding(F)
    // e.g. PIN 1234 -> 04 12 34 FF FF FF FF FF
    const pinLen = pin.length;
    const pinPayload = `0${pinLen}${pin}`.padEnd(16, "F");
    const pinBytes = this.hexToBytes(pinPayload);

    // 2. Prepare PAN Block (Block B)
    // Format: 0000 + 12 rightmost digits of PAN (excluding the check digit)
    // e.g. PAN 5123456789012345 -> Take "45678901234" -> 000045678901234
    // Logic: Remove last digit, then take last 12 chars
    const panClean = pan.replace(/[^0-9]/g, "");
    const panForBlock = panClean.slice(0, -1).slice(-12);
    const panPayload = `0000${panForBlock}`;
    const panBytes = this.hexToBytes(panPayload);

    // 3. XOR Block A and Block B
    const blockBytes = this.xorBytes(pinBytes, panBytes);

    return this.bytesToHex(blockBytes);
  }

  async RetrieveNFCCardDetails({
    merchantId,
    amount,
    cardPIN,
  }: {
    merchantId: string;
    amount: number;
    cardPIN: string;
  }): Promise<CardDetailsResult> {
    try {
      const compromised = await integrityService.isDeviceCompromised();
      if (compromised) {
        return {
          success: false,
          BIN: "",
          message: "Payment Rejected: device security compromised",
        };
      }

      ToastService.info("Hold Card Near Device...");

      if (amount <= 0) {
        throw new Error("Invalid amount");
      }

      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        return {
          BIN: "",
          success: false,
          message: "NFC is Not Supported on this Device",
        };
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "NFC is Disabled. Please Enable NFC in Device Settings",
        );
      }

      const cardInfo = await this.readCard();

      if (!cardInfo.success || !cardInfo?.PAN || !cardInfo?.BIN) {
        ToastService.error("Failed to Read Card 1");
        throw new Error("Failed to Read Card 1");
      }

      // Format PIN block (ISO Format 0) only if PIN is provided
      let pinBlock = "";
      if (cardPIN) {
        pinBlock = this.formatISO0Block(cardPIN, cardInfo.PAN);
      }

      // ENCRYPT BEFORE SAVING TO DB
      const securePAN = await EncryptionService.EncryptPII(cardInfo.PAN);
      const securePIN = cardPIN
        ? await EncryptionService.EncryptPII(pinBlock)
        : "";

      cardInfo.PAN = securePAN;
      cardInfo.PIN = securePIN;

      const transaction: NFCCardTransaction = {
        transactionID: PaymentService.generateTransactionId("CARD"),
        transactionDate: Math.floor(Date.now() / 1000),
        merchantId,
        amount,
        paymentMode: "CARD",
        cardInfo: cardInfo,
        txType: "DEBIT",
        // cardInfo: {
        //   currency: "0566", // Naira
        //   pan: cardInfo.cardData.pan,
        //   expiry: cardData.expiryDate,
        //   pinBlock: pinBlock, // <--- This goes to Field 52 in Backend
        //   cryptogram: cardData.applicationCryptogram, // Tag 9F26
        //   atc: cardData.atc, // Tag 9F36
        //   iad: cardData.issuerAppData || "", // Tag 9F10 (You must extract this from GPO/ReadRecord)
        //   nonce: cardData.nonce || "",
        // },
      };

      return {
        success: true,
        BIN: cardInfo.BIN,
        message: "Card Processed Successfully",
        transaction: transaction,
      };
    } catch (error) {
      await ErrorHandler.handle(error as Error, {
        action: "Process_NFC_Payment",
        metadata: { merchantId, amount },
      });

      return {
        success: false,
        BIN: "",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        if (__DEV__) console.log(e);
      }
    }
  }

  /**
   * Reads card data without requiring PIN - used for initial card tap
   */
  async ReadNFCCardOnly(): Promise<CardDetailsResult> {
    try {
      const compromised = await integrityService.isDeviceCompromised();
      if (compromised) {
        return {
          success: false,
          BIN: "",
          message: "Payment Rejected: device security compromised",
        };
      }

      ToastService.info("Hold Card Near Device...");

      const isSupported = await NfcManager.isSupported();
      if (!isSupported) {
        return {
          BIN: "",
          success: false,
          message: "NFC is Not Supported on this Device",
        };
      }

      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "NFC is Disabled. Please Enable NFC in Device Settings",
        );
      }

      const cardInfo = await this.readCard();

      if (!cardInfo.success || !cardInfo?.PAN || !cardInfo?.BIN) {
        if (__DEV__) console.log("Card Read Failed:", cardInfo);
        ToastService.error("Card Read Failed");
        throw new Error("Card Read Failed:");
      }

      // Just return the card info without PIN processing
      return {
        success: true,
        BIN: cardInfo.BIN,
        message: "Card Read Successfully",
        cardInfo: cardInfo, // Return raw card info for later use with PIN
      };
    } catch (error) {
      await ErrorHandler.handle(error as Error, {
        action: "Read_NFC_Card",
      });

      return {
        success: false,
        BIN: "",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        if (__DEV__) console.log(e);
      }
    }
  }

  /**
   * Processes card with PIN using previously read card data
   * No additional NFC tap needed
   */
  async ProcessCardWithPIN({
    merchantId,
    amount,
    cardPIN,
    cardInfo,
  }: {
    merchantId: string;
    amount: number;
    cardPIN: string;
    cardInfo: CardInfo;
  }): Promise<CardDetailsResult> {
    try {
      if (amount <= 0) {
        throw new Error("Invalid amount");
      }

      if (!cardPIN) {
        throw new Error("PIN is required");
      }

      // Format PIN block (ISO Format 0)
      const pinBlock = this.formatISO0Block(cardPIN, cardInfo.PAN);

      // ENCRYPT BEFORE SAVING TO DB
      const securePAN = await EncryptionService.EncryptPII(cardInfo.PAN);
      const securePIN = await EncryptionService.EncryptPII(pinBlock);

      cardInfo.PAN = securePAN;
      cardInfo.PIN = securePIN;

      const transaction: NFCCardTransaction = {
        transactionID: PaymentService.generateTransactionId("CARD"),
        transactionDate: Math.floor(Date.now() / 1000),
        merchantId,
        amount,
        paymentMode: "CARD",
        cardInfo: cardInfo,
        txType: "DEBIT",
      };

      return {
        success: true,
        BIN: cardInfo.BIN!,
        message: "Card Processed Successfully",
        transaction: transaction,
      };
    } catch (error) {
      await ErrorHandler.handle(error as Error, {
        action: "Process_Card_PIN",
        metadata: { merchantId, amount },
      });

      return {
        success: false,
        BIN: "",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }
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

  // async checkTransactionLimits(
  //   cardInfo: CardInfo,
  //   amount: number,
  // ): Promise<boolean> {
  //   // Check single transaction limit
  //   if (amount > cardInfo.singleTxLimit) {
  //     throw new Error(
  //       `Amount exceeds single transaction limit of ${
  //         cardInfo.singleTxLimit / 100
  //       }`,
  //     );
  //   }

  //   // Check balance
  //   if (amount > cardInfo.balance) {
  //     throw new Error("Insufficient balance");
  //   }

  //   // Check daily limit
  //   const todaySpent = await this.getTodaySpending(cardInfo.cardId);
  //   if (todaySpent + amount > cardInfo.dailyLimit) {
  //     throw new Error(
  //       `Transaction would exceed daily limit of ${cardInfo.dailyLimit / 100}`,
  //     );
  //   }

  //   return true;
  // }

  async signTransaction(
    transaction: NFCCardTransaction,
    credentials: Credentials,
  ): Promise<void> {
    // Canonical serialization
    const data = [
      ...this.stringToBytes(transaction.transactionID),
      ...this.int64ToBytes(transaction.transactionDate),
      ...this.hexToBytes(transaction.cardInfo.PAN),
      ...this.stringToBytes(transaction.merchantId),
      ...this.int64ToBytes(transaction.amount),
      ...this.stringToBytes(transaction.txType),
    ];

    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.bytesToHex([...data, ...this.hexToBytes(credentials.cak)]),
      { encoding: Crypto.CryptoEncoding.HEX },
    );

    transaction.signature = signature;
  }

  // Utility functions
  generateNonce(length: number): number[] {
    return Array.from(Crypto.getRandomBytes(length));
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
    } catch {
      if (__DEV__) console.log("No Active NFC request to Cancel");
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.stopNFC();
      if (this.isInitialized) {
        await NfcManager.unregisterTagEvent();
      }
    } catch (error) {
      await ErrorHandler.handle(
        error as Error,
        {
          action: "nfc_cleanup",
        },
        false,
      );
    }
  }

  async readCard(): Promise<CardInfo> {
    try {
      const compromised = await integrityService.isDeviceCompromised();
      if (compromised) {
        throw new Error("NFC read blocked: device security compromised");
      }

      if (this.isReading) {
        throw new Error("Card Reading Already in Progress");
      }

      this.isReading = true;

      // Ensure cleanup before starting
      await this.stopNFC();

      // Request NFC technology with timeout
      await Promise.race([
        NfcManager.requestTechnology(NfcTech.IsoDep),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("NFC timeout - no card detected")),
            8000,
          ),
        ),
      ]);

      ToastService.info("Card Detected, Reading...");

      // Step 1: Try direct AID selection first (fast)
      let applications: { aid: number[]; label: string }[] = [];

      const CARD_AIDS = this.getCardAIDs();

      for (const { name, aid } of CARD_AIDS) {
        try {
          // Small delay to give card time to respond
          await new Promise((resolve) => setTimeout(resolve, 50));

          const aidBytes = aid.slice(5); // Remove SELECT command prefix
          const selectResponse = await this.selectApplication(aidBytes);

          const sw1 = selectResponse?.at(-2);
          const sw2 = selectResponse?.at(-1);

          if (sw1 === 0x90 && sw2 === 0x00) {
            applications.push({ aid: aidBytes, label: name });
            if (__DEV__) ToastService.info(`Found ${name} Processor`);
            break; // Use first successful AID
          }
        } catch (error: any) {
          if (__DEV__)
            console.log(`${name} AID failed:`, error?.message || error);
          // Continue trying other AIDs
        }
      }

      // Step 1B: If no AID worked, try PPSE as fallback
      if (!applications || applications.length === 0) {
        if (__DEV__) console.log("No AIDs detected, trying PPSE...");
        try {
          const ppseResponse = await this.sendAPDU(APDU_COMMANDS.SELECT_PPSE);
          applications = this.parsePPSE(ppseResponse);
        } catch (ppseError) {
          if (__DEV__) console.log("PPSE also failed:", ppseError);
        }
      }

      if (!applications || applications.length === 0) {
        throw new Error("No Payment Provider Found on Card");
      }

      // Step 3: Select application — reuse the response from discovery to avoid double-select
      const selectedApp = applications[0];
      // We already successfully selected this AID during discovery.
      // Re-selecting resets card state on some cards and causes GPO 6985.
      // Instead, re-select once and capture the FCI for PDOL extraction.
      const selectAppResponse = await this.selectApplication(selectedApp.aid);

      // Extract PDOL from FCI if present (tag 9F38 inside A5 inside 6F)
      let pdolHex: string | undefined;
      try {
        const fciTlv = this.parseTLV(selectAppResponse.slice(0, -2));
        const a5Hex = fciTlv["6F"]
          ? this.parseTLV(this.hexStringToBytes(fciTlv["6F"]))["A5"]
          : undefined;
        if (a5Hex) {
          pdolHex = this.parseTLV(this.hexStringToBytes(a5Hex))["9F38"];
        }
        if (__DEV__) console.log("PDOL:", pdolHex ?? "none");
      } catch (e) {
        if (__DEV__) console.log("PDOL extraction failed:", e);
      }

      // Step 4: Get Processing Options — build GPO with correct PDOL data
      let processingOptions: { afl?: string; aip?: string } = {};
      let cardData: number[][] = [selectAppResponse];

      try {
        // Build PDOL response data if card provided a PDOL
        const pdolData = pdolHex ? this.buildPDOLData(pdolHex) : [];
        const pdolLen = pdolData.length;
        // GPO: CLA=80 INS=A8 P1=00 P2=00 Lc=len+2 83=tag len=pdolLen data Le=00
        const gpoCommand = [
          0x80,
          0xa8,
          0x00,
          0x00,
          pdolLen + 2,
          0x83,
          pdolLen,
          ...pdolData,
          0x00,
        ];
        const gpoResponse = await this.sendAPDU(gpoCommand);
        if (__DEV__) console.log("GPO response:", gpoResponse);
        processingOptions = this.parseGPO(gpoResponse);
        if (__DEV__) console.log("GPO parsed:", processingOptions);

        if (processingOptions.afl) {
          const aflData = await this.readApplicationData(processingOptions);
          if (aflData.length > 0) cardData = aflData;
        } else {
          if (__DEV__) console.log("No AFL, attempting brute-force SFI read");
          const bruteRecords = await this.bruteForceReadRecords();
          if (bruteRecords.length > 0) cardData = bruteRecords;
        }
      } catch (gpoError) {
        if (__DEV__) console.log("GPO failed:", gpoError);
        try {
          const bruteRecords = await this.bruteForceReadRecords();
          if (bruteRecords.length > 0) cardData = bruteRecords;
        } catch (bruteError) {
          if (__DEV__)
            console.log("Brute-force SFI read also failed:", bruteError);
        }
      }

      // Step 6: Parse card information
      const cardInfo = this.parseCardData(cardData);
      cardInfo.schemeLabel = selectedApp.label;

      // Step 7: Generate AC (cryptogram) if CDOL1 is available from parsed records
      // parseTLV on the raw stream to find CDOL1 (tag 8C)
      try {
        const rawStream: number[] = [];
        cardData.forEach((record) => {
          const clean =
            record[record.length - 2] === 0x90 ? record.slice(0, -2) : record;
          const fb = clean[0];
          if (fb === 0x70 || fb === 0x77 || fb === 0x6f) {
            let off = 1;
            const l = clean[1];
            off += l > 0x7f ? 1 + (l & 0x7f) : 1;
            rawStream.push(...clean.slice(off));
          } else if (fb !== 0x80) {
            rawStream.push(...clean);
          }
        });
        const tlv = this.parseTLV(rawStream);
        const cdol1 = tlv["8C"];
        if (cdol1) {
          const txResult = await this.performTransaction(cdol1, 0);
          cardInfo.cryptogram = txResult.cryptogram;
          cardInfo.issuerAppData =
            txResult.issuerAppData || cardInfo.issuerAppData;
          cardInfo.ATC = txResult.atc
            ? parseInt(txResult.atc, 16)
            : cardInfo.ATC;
          // Re-extract CVR from fresh IAD
          if (cardInfo.issuerAppData && cardInfo.issuerAppData.length >= 10) {
            cardInfo.CVR = cardInfo.issuerAppData.substring(4, 10);
          }
        }
      } catch (genACError) {
        if (__DEV__) console.log("GENERATE AC skipped:", genACError);
      }

      if (__DEV__) console.log(">>>>>", cardData, cardInfo);
      this.currentCard = cardInfo;

      return cardInfo;
    } catch (error) {
      if (__DEV__) console.log(error);
      await ErrorHandler.handle("Error Reading Card", {
        action: "Read User Card",
        // metadata: error,
      });

      return {
        success: false,
        schemeLabel: "",
        errorMessage: error instanceof Error ? error.message : "",
        BIN: "",
        last4: "",
        PAN: "",
        PIN: "",
        expiryDate: "",
        ATC: 0,
        cryptogram: "",
        issuerAppData: "",
        CVR: "",
        currencyCode: "",
        countryCode: "",
      };
    } finally {
      this.isReading = false;
      await this.cleanup();
    }
  }

  async sendAPDU(command: number[]): Promise<number[]> {
    try {
      const response = await NfcManager.isoDepHandler.transceive(command);

      if (!response || response.length < 2) {
        throw new Error("Invalid APDU response");
      }

      return response;
    } catch (error: any) {
      if (__DEV__)
        console.error("APDU command error:", error?.message || error);
      throw error;
    }
  }

  async selectApplication(aid: number[]): Promise<number[]> {
    // Build SELECT command with AID
    const command = [0x00, 0xa4, 0x04, 0x00, aid.length, ...aid, 0x00];

    return await this.sendAPDU(command);
  }

  private async readApplicationData(processingOptions: {
    afl?: string;
    aip?: string;
  }) {
    const records: number[][] = [];

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

  // Fallback: try common SFI (1-3) and record (1-3) combinations when GPO/AFL unavailable
  private async bruteForceReadRecords(): Promise<number[][]> {
    const records: number[][] = [];
    for (let sfi = 1; sfi <= 3; sfi++) {
      for (let rec = 1; rec <= 3; rec++) {
        try {
          const cmd = [0x00, 0xb2, rec, (sfi << 3) | 0x04, 0x00];
          const data = await this.sendAPDU(cmd);
          const sw1 = data[data.length - 2];
          const sw2 = data[data.length - 1];
          if (sw1 === 0x90 && sw2 === 0x00) {
            records.push(data);
          }
        } catch {
          // Record doesn't exist, continue
        }
      }
    }
    if (__DEV__) console.log(`Brute-force found ${records.length} records`);
    return records;
  }

  private parsePPSE(response: number[]): { aid: number[]; label: string }[] {
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
      if (__DEV__) console.error("PPSE parsing error:", error);
    }

    return applications;
  }

  private parseCardData(records: number[][]): CardInfo {
    try {
      // 1. UNWRAP THE RECORDS
      // We must strip the 0x70 (Template) tag and the Status Words (SW)
      const rawDataStream: number[] = [];

      records.forEach((record) => {
        // Step A: Remove Status Words (last 2 bytes, usually 144, 0)
        let cleanRecord = record;
        if (record.length >= 2) {
          const sw1 = record[record.length - 2];
          if (sw1 === 0x90) {
            cleanRecord = record.slice(0, -2);
          }
        }

        // Step B: Unwrap known EMV template tags (0x70, 0x77, 0x6F, 0x80)
        const firstByte = cleanRecord[0];
        const isTemplate =
          firstByte === 0x70 || firstByte === 0x77 || firstByte === 0x6f;

        if (isTemplate) {
          let offset = 1; // Skip Tag byte
          const len = cleanRecord[1];
          if (len > 0x7f) {
            const byteCount = len & 0x7f;
            offset += 1 + byteCount;
          } else {
            offset += 1;
          }
          rawDataStream.push(...cleanRecord.slice(offset));
        } else if (firstByte === 0x80) {
          // Format 1 primitive: skip tag + length, rest is AIP+AFL (not card data fields)
          // Do not push — GPO Format 1 is handled in parseGPO, not here
        } else {
          rawDataStream.push(...cleanRecord);
        }
      });

      // 2. PARSE THE UNWRAPPED STREAM
      const tlvData = this.parseTLV(rawDataStream);

      const cardInfo: CardInfo = {
        BIN: "",
        last4: "",
        success: true,
        PAN: "",
        PIN: "",
        expiryDate: "",
        schemeLabel: "",
        cryptogram: "",
        issuerAppData: "",
        CVR: "",
        ATC: 0,
        currencyCode: "",
        countryCode: "",
      };

      // Track 2 Equivalent Data (Tag 57) - This contains PAN + Expiry
      if (tlvData["57"]) {
        const track2Data = this.parseTrack2(tlvData["57"]);

        if (track2Data) {
          cardInfo.PAN = track2Data.pan;
          cardInfo.last4 = track2Data.pan.slice(-4);
          cardInfo.BIN = track2Data.pan.slice(0, 6);
          cardInfo.expiryDate = track2Data.expiryDate;
        }
      }

      // PAN (Tag 5A) - Fallback if not in Track 2
      if (!cardInfo.PAN && tlvData["5A"]) {
        cardInfo.PAN = this.parsePAN(tlvData["5A"]);
      }

      // Expiry Date (if not found in Track 2)
      if (!cardInfo.expiryDate && tlvData["5F24"]) {
        cardInfo.expiryDate = this.parseExpiryDate(tlvData["5F24"]);
      }

      // Cardholder Name (Tag 5F20)
      // if (tlvData["5F20"]) {
      //   cardInfo.cardholderName =
      //     this.hexToString(tlvData["5F20"]).trim() || "N/A";
      // }

      // Application Label (Tag 50)
      if (tlvData["50"]) {
        cardInfo.schemeLabel = this.hexToString(tlvData["50"]).trim();
      }

      // Application Preferred Name (Tag 9F12) - Alternative label
      if (!cardInfo.schemeLabel && tlvData["9F12"]) {
        cardInfo.schemeLabel = this.hexToString(tlvData["9F12"]).trim();
      }

      // Application Cryptogram (Tag 9F26)
      if (tlvData["9F26"]) {
        cardInfo.cryptogram = tlvData["9F26"];
      }

      // Issuer Application Data - Try multiple tags
      cardInfo.issuerAppData =
        tlvData["9F10"] || tlvData["90"] || tlvData["92"] || "";

      // Application Transaction Counter (ATC) - Tag 9F36 not present, try 9F4A
      cardInfo.ATC = tlvData["9F36"]
        ? Number.parseInt(tlvData["9F36"], 16)
        : tlvData["9F4A"]
          ? Number.parseInt(tlvData["9F4A"], 16)
          : 0;

      // Issuer Country Code — BCD-encoded decimal string, strip leading zeros ("0566" -> "566")
      cardInfo.countryCode = tlvData["5F28"]
        ? tlvData["5F28"].replace(/^0+/, "")
        : "";

      // Currency Code — same BCD stripping
      const rawCurrency = tlvData["5F2A"] || tlvData["9F42"] || "";
      cardInfo.currencyCode = rawCurrency ? rawCurrency.replace(/^0+/, "") : "";

      // Card Verification Results (CVR) — Tag 9F34 is CVM List (not CVR).
      // CVR lives inside Issuer Application Data (9F10), bytes 3-5.
      // Extract it only if IAD is present and long enough.
      if (cardInfo.issuerAppData && cardInfo.issuerAppData.length >= 10) {
        // IAD structure: 06 [length] [CVR 3 bytes] ...
        // CVR starts at byte offset 2 (after 06 + length byte), 3 bytes = 6 hex chars
        cardInfo.CVR = cardInfo.issuerAppData.substring(4, 10);
      } else {
        cardInfo.CVR = tlvData["9F34"] || tlvData["8E"] || "";
      }

      // cardInfo.cardNonce = tlvData["9F37"] || "";

      return cardInfo;
    } catch {
      const cardInfo: CardInfo = {
        success: false,
        BIN: "",
        last4: "",
        PAN: "",
        PIN: "",
        expiryDate: "",
        schemeLabel: "",
        cryptogram: "",
        issuerAppData: "",
        CVR: "",
        ATC: 0,
        currencyCode: "",
        countryCode: "",
      };

      return cardInfo;
    }
  }

  private parseGPO(response: number[]): { afl?: string; aip?: string } {
    try {
      // 1. Safety Check
      if (!response || response.length < 2) return {};

      // 2. Remove Status Words (SW1, SW2) from the end
      const data = response.slice(0, -2);

      // 3. Helper to convert bytes to Hex String
      const toHex = (bytes: number[]) =>
        bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

      // 4. Decode the outer TLV (Tag + Length) to get the Body
      let offset = 1; // Skip Tag byte
      let len = data[1];

      // Handle EMV multi-byte length (if length > 127)
      if (len > 0x7f) {
        const byteCount = len & 0x7f;
        offset += 1 + byteCount; // Skip Length bytes
      } else {
        offset += 1; // Skip single Length byte
      }

      const body = data.slice(offset);
      const tag = data[0];

      // --- CASE 1: Format 2 (0x77) - Nested TLV ---
      if (tag === 0x77) {
        // We must search inside the body for Tags 0x82 (AIP) and 0x94 (AFL)
        const tlvData = this.parseTLV(body);
        return {
          aip: tlvData["82"],
          afl: tlvData["94"],
        };
      }

      // --- CASE 2: Format 1 (0x80) - Raw Data ---
      else if (tag === 0x80) {
        // In Format 1, there are NO internal tags.
        // Byte 1-2: AIP
        // Byte 3-End: AFL
        if (body.length < 2) return {}; // Invalid data

        const aipBytes = body.slice(0, 2);
        const aflBytes = body.slice(2);

        return {
          aip: toHex(aipBytes),
          afl: toHex(aflBytes),
        };
      }

      return {};
    } catch (error: any) {
      if (__DEV__) console.error("GPO parsing error:", error?.message || error);
      return {};
    }
  }

  private parseTLV(data: number[]): Record<string, string> {
    const result: Record<string, string> = {};
    let i = 0;

    while (i < data.length) {
      // Parse tag (can be 1 or 2 bytes)
      let tag = data[i].toString(16).padStart(2, "0").toUpperCase();
      i++;

      // Check if it's a multi-byte tag (first byte has bit 5 set)
      if ((data[i - 1] & 0x1f) === 0x1f && i < data.length) {
        tag += data[i].toString(16).padStart(2, "0").toUpperCase();
        i++;
      }

      if (i >= data.length) break;

      // Parse length
      let length = data[i];
      i++;

      // Handle multi-byte length
      if (length & 0x80) {
        const numLengthBytes = length & 0x7f;
        length = 0;
        for (let j = 0; j < numLengthBytes && i < data.length; j++) {
          length = (length << 8) | data[i];
          i++;
        }
      }

      if (i + length > data.length) {
        length = data.length - i;
      }

      // Extract value
      const value = data.slice(i, i + length);
      result[tag] = value.map((b) => b.toString(16).padStart(2, "0")).join("");

      i += length;
    }

    return result;
  }

  private findAllTags(data: number[], tag: string) {
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

  // Helper: Parse the PAN (Tag 5A)
  // EMV stores PAN as "Packed BCD" (e.g., 0x12 0x34 -> "1234")
  private parsePAN(hexString: string): string {
    let pan = hexString.replace(/F/g, ""); // 'F' is padding in BCD
    return pan;
  }

  // Helper: Parse Track 2 Data (Tag 57)
  // Structure: [PAN] + [Separator 'D'] + [Expiry YYMM] + [Service Code]
  private parseTrack2(
    hexString: string,
  ): { pan: string; expiryDate: string } | null {
    try {
      // Clean the hex string
      const raw = hexString.toUpperCase().replace(/F/g, "");

      // The separator in Track 2 Hex is usually 'D' (or sometimes '=' in text representations)
      const separatorIndex = raw.indexOf("D");

      if (separatorIndex === -1) return null;

      const pan = raw.substring(0, separatorIndex);
      const expiryRaw = raw.substring(separatorIndex + 1, separatorIndex + 5); // Next 4 chars are YYMM

      // Format Expiry as MM/YY for display
      const yy = expiryRaw.substring(0, 2);
      const mm = expiryRaw.substring(2, 4);
      const expiryDate = `${mm}/${yy}`;

      return { pan, expiryDate };
    } catch {
      return null;
    }
  }

  // Helper: Parse Expiry Date (Tag 5F24) if Track 2 is missing
  // Format is usually YYMMDD in BCD
  private parseExpiryDate(hexString: string): string {
    const raw = hexString.replace(/F/g, "");
    if (raw.length < 4) return raw;

    const yy = raw.substring(0, 2);
    const mm = raw.substring(2, 4);
    return `${mm}/${yy}`;
  }

  // Helper: Convert Hex String to Normal String (e.g. Cardholder Name)
  private hexToString(hexString: string): string {
    let str = "";
    for (let i = 0; i < hexString.length; i += 2) {
      const code = Number.parseInt(hexString.substr(i, 2), 16);
      if (code !== 0) str += String.fromCharCode(code);
    }
    return str;
  }

  private hexStringToBytes(hexString: string): number[] {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(Number.parseInt(hexString.substr(i, 2), 16));
    }
    return bytes;
  }

  // Helper: Convert Number Array to Hex String
  bytesToHex(bytes: number[]): string {
    return bytes
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join("");
  }

  // Helper: XOR two byte arrays
  xorBytes(a: number[], b: number[]): number[] {
    return a.map((byte, i) => byte ^ b[i]);
  }

  /**
   * 1. PARSE CDOL1 (Card Risk Management Data Object List 1)
   * The card tells us: "I need these 5 fields to generate a signature."
   * CDOL is a string of Tags and Lengths: "9F0206 9F0306 9F1A02..."
   */
  private parseCDOL(cdolHex: string): { tag: string; length: number }[] {
    const fields = [];
    let i = 0;
    while (i < cdolHex.length) {
      let tag = cdolHex.substr(i, 2);
      i += 2;
      if ((parseInt(tag, 16) & 0x1f) === 0x1f) {
        tag += cdolHex.substr(i, 2);
        i += 2;
      }
      const len = parseInt(cdolHex.substr(i, 2), 16);
      i += 2;
      fields.push({ tag, length: len });
    }
    return fields;
  }

  // Build PDOL response data from PDOL tag list using same terminal values as CDOL
  private buildPDOLData(pdolHex: string): number[] {
    const fields = this.parseCDOL(pdolHex);
    const now = new Date();
    const dateYYMMDD = now.toISOString().slice(2, 10).replace(/-/g, "");
    const [b0, b1, b2, b3] = Crypto.getRandomBytes(4);
    const nonce = (((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0)
      .toString(16)
      .padStart(8, "0")
      .toUpperCase();

    let hex = "";
    for (const { tag, length } of fields) {
      switch (tag.toUpperCase()) {
        case "9F66":
          hex += "B6204000".padStart(length * 2, "0");
          break; // TTQ
        case "9F02":
          hex += "000000000000".slice(-(length * 2));
          break; // Amount
        case "9F03":
          hex += "000000000000".slice(-(length * 2));
          break; // Amount Other
        case "9F1A":
          hex += "0566".slice(-(length * 2));
          break; // Terminal Country
        case "5F2A":
          hex += "0566".slice(-(length * 2));
          break; // Currency
        case "9A":
          hex += dateYYMMDD.slice(-(length * 2));
          break; // Date
        case "9C":
          hex += "00".padStart(length * 2, "0");
          break; // Tx Type
        case "9F37":
          hex += nonce.slice(-(length * 2));
          break; // Unpredictable Number
        case "9F35":
          hex += "22".padStart(length * 2, "0");
          break; // Terminal Type
        case "9F45":
          hex += "0000".slice(-(length * 2));
          break; // Data Auth Code
        case "9F4C":
          hex += "0000000000000000".slice(-(length * 2));
          break; // ICC Dynamic Number
        case "9F34":
          hex += "000000".slice(-(length * 2));
          break; // CVM Results
        default:
          hex += "00".repeat(length);
      }
    }
    return this.hexToBytes(hex);
  }

  /**
   * 2. CONSTRUCT THE DATA PACKET
   * Fills the CDOL requirements with actual transaction data.
   */
  private buildTransactionData(
    cdolFields: any[],
    amount: number,
  ): { hex: string; nonce: string } {
    let dataPacket = "";
    // Generate a 4-byte random nonce (Unpredictable Number)
    const [b0, b1, b2, b3] = Crypto.getRandomBytes(4);
    const nonce = (((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0)
      .toString(16)
      .padStart(8, "0")
      .toUpperCase();

    const now = new Date();
    const dateYYMMDD = now.toISOString().slice(2, 10).replace(/-/g, "");

    cdolFields.forEach((field) => {
      switch (field.tag.toUpperCase()) {
        case "9F02": // Amount, Authorized (Numeric, 6 bytes)
          dataPacket += amount.toString().padStart(12, "0");
          break;
        case "9F03": // Amount, Other (Cashback)
          dataPacket += "000000000000";
          break;
        case "9F1A": // Terminal Country Code (0566 = Nigeria)
          dataPacket += "0566";
          break;
        case "5F2A": // Transaction Currency Code (0566 = Naira)
          dataPacket += "0566";
          break;
        case "9A": // Transaction Date (YYMMDD)
          dataPacket += dateYYMMDD;
          break;
        case "9C": // Transaction Type (00 = Purchase)
          dataPacket += "00";
          break;
        case "9F37": // Unpredictable Number (The Nonce)
          dataPacket += nonce;
          break;
        default:
          // Fill unknown fields with zeros to avoid breaking the card
          dataPacket += "0".repeat(field.length * 2);
      }
    });

    return { hex: dataPacket, nonce };
  }

  /**
   * 3. EXECUTE: The "GENERATE AC" Command
   */
  private async performTransaction(
    cdol1Raw: string,
    amount: number,
  ): Promise<EmvTransactionResult> {
    try {
      // A. Prepare Data
      const cdolStructure = this.parseCDOL(cdol1Raw);
      const { hex: dataBody, nonce } = this.buildTransactionData(
        cdolStructure,
        amount,
      );

      // B. Build APDU Command
      // CLA=80, INS=AE (Gen AC), P1=80 (ARQC), P2=00
      const commandBytes = [
        0x80,
        0xae,
        0x80,
        0x00,
        dataBody.length / 2, // Lc (Length of data)
        ...this.hexToBytes(dataBody),
        0x00, // Le (Expected length of response)
      ];

      // C. Send to Card
      const response = await this.sendAPDU(commandBytes);

      // D. Parse Response — unwrap 0x77 (Format 2) or 0x80 (Format 1) before TLV parsing
      const sw1 = response[response.length - 2];
      const clean = sw1 === 0x90 ? response.slice(0, -2) : response;
      const firstByte = clean[0];

      let tlv: Record<string, string>;
      if (firstByte === 0x77) {
        // Format 2: nested TLV inside 77 template
        let off = 1;
        const l = clean[1];
        off += l > 0x7f ? 1 + (l & 0x7f) : 1;
        tlv = this.parseTLV(clean.slice(off));
      } else if (firstByte === 0x80) {
        // Format 1: raw bytes — [CID(1)] [ATC(2)] [AC(8)] [IAD(variable)]
        let off = 1;
        const l = clean[1];
        off += l > 0x7f ? 1 + (l & 0x7f) : 1;
        const body = clean.slice(off);
        tlv = {
          "9F27": body
            .slice(0, 1)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
          "9F36": body
            .slice(1, 3)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
          "9F26": body
            .slice(3, 11)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
          "9F10": body
            .slice(11)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""),
        };
      } else {
        tlv = this.parseTLV(clean);
      }

      if (!tlv["9F26"]) {
        throw new Error("Transaction Declined: No Cryptogram returned");
      }

      return {
        cryptogram: tlv["9F26"],
        issuerAppData: tlv["9F10"] || "",
        atc: tlv["9F36"] || "",
        unpredictableNumber: nonce,
        transactionDate: new Date().toISOString(),
        transactionAmount: amount.toString(),
      };
    } catch (e) {
      if (__DEV__) console.error("GENERATE AC Failed", e);
      throw e;
    }
  }
}

export default new NFCService();
