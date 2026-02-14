import * as Crypto from "expo-crypto";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { getDatabase } from "../../lib/utils";
import NFCPaymentService from "./NFCService";

class P2PTransferService {
  async initiateSendMoney(
    recipientId: string,
    amount: number,
    currency: string = "USD",
  ): Promise<InitiateResponse> {
    try {
      console.log(`Initiating P2P transfer: ${amount} to ${recipientId}`);

      // Step 1: Validate P2P limits
      await this.validateP2PLimits(amount);

      // Step 2: Debit sender's card
      const senderTx = await this.debitSenderCard(
        recipientId,
        amount,
        currency,
      );
      console.log("Sender debited:", senderTx.txId);

      // Step 3: Store pending transfer
      const P2PTransfer = await this.storePendingTransfer(
        senderTx,
        recipientId,
      );

      if (P2PTransfer === null)
        return {
          success: false,
          status: "FAILED",
          transferId: "",
          message: "Failed to Initiate P2P Transfer",
          senderTx: senderTx,
        };

      // Step 4: Wait for recipient to present card
      return {
        success: true,
        transferId: P2PTransfer.transferId,
        senderTx: senderTx,
        status: "PENDING_RECIPIENT",
        message: "Ask recipient to tap their card",
      };
    } catch (error) {
      console.error("P2P initiation failed:", error);
      throw error;
    }
  }

  async completeSendMoney(transferId: string): Promise<CompleteResponse> {
    try {
      console.log(`Completing P2P transfer: ${transferId}`);

      // Step 1: Get pending transfer
      const transfer = await this.getPendingTransfer(transferId);

      if (!transfer) {
        throw new Error("Transfer not found");
      }

      if (transfer.status !== "PENDING_RECIPIENT") {
        throw new Error("Transfer already completed or cancelled");
      }

      // Step 2: Credit recipient's card
      const recipientTx = await this.creditRecipientCard(
        transfer.senderTx.cardId,
        transfer.amount,
        transfer.currency,
      );

      console.log("Recipient credited:", recipientTx.txId);

      // Step 3: Update transfer status
      await this.updateTransferStatus(transferId, "COMPLETED");

      // Step 4: Link transactions
      await this.linkTransactions(transfer.senderTx.txId, recipientTx.txId);

      return {
        success: true,
        transferId: transferId,
        senderTx: transfer.senderTx,
        recipientTx: recipientTx,
        status: "COMPLETED",
      };
    } catch (error) {
      console.error("P2P completion failed:", error);
      // Mark transfer as failed
      await this.updateTransferStatus(transferId, "FAILED");
      throw error;
    }
  }

  async debitSenderCard(
    recipientId: string,
    amount: number,
    currency: string,
  ): Promise<Transaction> {
    // Request NFC
    await NfcManager.requestTechnology(NfcTech.IsoDep);

    try {
      // Read sender's card
      const cardInfo = await NFCPaymentService.readCardInfo();

      // Load credentials
      const credentials = await NFCPaymentService.loadCardCredentials(
        cardInfo.cardId,
      );

      // Authenticate
      const authSuccess = await NFCPaymentService.authenticateCard(credentials);
      if (!authSuccess) {
        throw new Error("Card authentication failed");
      }

      // Check balance
      if (cardInfo.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Create transaction
      const transaction = await NFCPaymentService.createTransaction(
        cardInfo,
        `P2P:${recipientId}`, // Merchant ID format
        amount,
        currency,
      );

      // Add P2P metadata
      transaction.txType = "P2P_DEBIT";
      transaction.recipientId = recipientId;

      // Sign transaction
      await NFCPaymentService.signTransaction(transaction, credentials);

      // Update card balance
      await NFCPaymentService.updateCardBalance(cardInfo, credentials, amount);

      // Store locally
      await this.storeP2PTransaction(transaction);

      return transaction;
    } finally {
      await NfcManager.cancelTechnologyRequest();
    }
  }

  async creditRecipientCard(
    senderId: string,
    amount: number,
    currency: string,
  ): Promise<Transaction> {
    // Request NFC
    await NfcManager.requestTechnology(NfcTech.IsoDep);

    try {
      // Read recipient's card
      const cardInfo = await NFCPaymentService.readCardInfo();

      // Load credentials
      const credentials = await NFCPaymentService.loadCardCredentials(
        cardInfo.cardId,
      );

      // Authenticate
      const authSuccess = await NFCPaymentService.authenticateCard(credentials);
      if (!authSuccess) {
        throw new Error("Card authentication failed");
      }

      // Create credit transaction
      const transaction: Transaction = {
        version: 1,
        txId: this.generateTransactionId(),
        timestamp: Math.floor(Date.now() / 1000),
        cardId: cardInfo.cardId,
        merchantId: `P2P:${senderId}`,
        amount: amount,
        currency: currency,
        counter: cardInfo.counter + 1,
        status: "PENDING",
        txType: "P2P_CREDIT",
        senderId: senderId,
        fees: 0,
      };

      // Sign transaction
      await NFCPaymentService.signTransaction(transaction, credentials);

      // Update card balance (add money)
      // const newBalance = await this.creditCard(cardInfo, credentials, amount);

      // Store locally
      await this.storeP2PTransaction(transaction);

      return transaction;
    } finally {
      await NfcManager.cancelTechnologyRequest();
    }
  }

  async creditCard(
    cardInfo: CardInfo,
    credentials: Credentials,
    amount: number,
  ): Promise<number> {
    const newBalance = cardInfo.balance + amount; // Add money
    const newCounter = cardInfo.counter + 1;

    // Encrypt new balance using the same logic as NFCPaymentService
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

  async validateP2PLimits(amount: number): Promise<boolean> {
    // P2P specific limits (stricter than merchant)
    const P2P_SINGLE_LIMIT = 5000; // $50.00
    const P2P_DAILY_LIMIT = 10000; // $100.00
    const P2P_WEEKLY_LIMIT = 30000; // $300.00

    if (amount > P2P_SINGLE_LIMIT) {
      throw new Error(
        `Amount exceeds P2P single transaction limit ($${
          P2P_SINGLE_LIMIT / 100
        })`,
      );
    }

    // Check daily P2P volume
    const todayP2P = await this.getTodayP2PVolume();
    if (todayP2P + amount > P2P_DAILY_LIMIT) {
      throw new Error(
        `Would exceed daily P2P limit ($${P2P_DAILY_LIMIT / 100})`,
      );
    }

    // Check weekly P2P volume
    const weekP2P = await this.getWeekP2PVolume();
    if (weekP2P + amount > P2P_WEEKLY_LIMIT) {
      throw new Error(
        `Would exceed weekly P2P limit ($${P2P_WEEKLY_LIMIT / 100})`,
      );
    }

    return true;
  }

  async storePendingTransfer(
    senderTx: Transaction,
    recipientId: string,
  ): Promise<P2PTransfer | null> {
    const db = await getDatabase(null);
    const transferId = this.generateTransferId();
    const createdAt = Math.floor(Date.now() / 1000);

    if (!db) return null;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO p2p_transfers 
           (transfer_id, sender_tx_id, sender_card_id, recipient_id, amount, currency, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'PENDING_RECIPIENT', ?)`,
        [
          transferId,
          senderTx.txId,
          senderTx.cardId,
          recipientId,
          senderTx.amount,
          senderTx.currency,
          createdAt,
        ],
      );
    });

    return {
      transferId,
      senderTx,
      recipientId,
      status: "PENDING_RECIPIENT",
      amount: senderTx.amount,
      currency: senderTx.currency,
    };
  }

  async getPendingTransfer(transferId: string): Promise<P2PTransfer | null> {
    const db = await getDatabase(null);

    if (!db) return null;

    const P2PTransfer = await db.getFirstAsync<P2PTransfer>(
      "SELECT * FROM p2p_transfers WHERE transfer_id = ?",
      [transferId],
    );

    if (P2PTransfer == null) return null;
    const transaction = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE tx_id = ?",
      [P2PTransfer.sender_tx_id!],
    );

    if (transaction == null) return null;

    P2PTransfer.senderTx = transaction;

    return P2PTransfer;
  }

  async updateTransferStatus(
    transferId: string,
    status: TransferStatus,
  ): Promise<void> {
    const db = await getDatabase(null);

    if (!db) return;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "UPDATE p2p_transfers SET status = ?, completed_at = ? WHERE transfer_id = ?",
        [status, Math.floor(Date.now() / 1000), transferId],
      );
    });
  }

  async linkTransactions(
    senderTxId: string,
    recipientTxId: string,
  ): Promise<void> {
    const db = await getDatabase(null);

    if (!db) return;

    // Update sender transaction with recipient link
    // Update recipient transaction with sender link
    await db.withTransactionAsync(async () => {
      await db
        .runAsync("UPDATE transactions SET linked_tx_id = ? WHERE tx_id = ?", [
          recipientTxId,
          senderTxId,
        ])
        .then(async () => {
          await db.runAsync(
            "UPDATE transactions SET linked_tx_id = ? WHERE tx_id = ?",
            [recipientTxId, senderTxId],
          );
        });
    });
  }

  async storeP2PTransaction(transaction: Transaction): Promise<void> {
    const db = await getDatabase(null);

    if (!db) return;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO transactions 
           (tx_id, card_id, merchant_id, amount, currency, counter, timestamp, signature, status, txType)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
        [
          transaction.txId,
          transaction.cardId,
          transaction.merchantId,
          transaction.amount,
          transaction.currency,
          transaction.counter,
          transaction.timestamp,
          transaction.signature ?? "",
          transaction.txType,
        ],
      );
    });
  }

  async getTodayP2PVolume(): Promise<number> {
    const db = await getDatabase(null);
    if (!db) return 0;

    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const P2PVolume = await db.getFirstAsync<number>(
      `SELECT SUM(amount) as total 
           FROM transactions 
           WHERE txType = 'P2P_DEBIT' 
           AND timestamp >= ? 
           AND status = 'COMPLETED'`,
      [todayStart],
    );

    return P2PVolume || 0;
  }

  async getWeekP2PVolume(): Promise<number> {
    const db = await getDatabase(null);
    if (!db) return 0;

    const weekStart = Math.floor(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000,
    );

    const P2PWeeklyVolume = await db.getFirstAsync<number>(
      `SELECT SUM(amount) as total 
           FROM transactions 
           WHERE txType = 'P2P_DEBIT' 
           AND timestamp >= ? 
           AND status = 'COMPLETED'`,
      [weekStart],
    );

    return P2PWeeklyVolume || 0;
  }

  generateTransferId(): string {
    return `P2P-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  generateTransactionId(): string {
    return `TX-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  // Utility methods for encryption
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

  hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(Number.parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }
}

export default new P2PTransferService();
