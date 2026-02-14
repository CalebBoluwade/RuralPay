import * as SQLite from "expo-sqlite";

export interface OfflineTransaction {
  merchantId: string;
  amount: string;
  currency: string;
  pan: string;
  expiry: string;
  pinBlock: string;
  cryptogram: string;
  atc: string;
  iad: string;
  nonce: string;
  timestamp: string;
}

interface Transaction {
  txId: string;
  cardId: string;
  merchantId: string;
  amount: number;
  currency: string;
  counter: number;
  timestamp: number;
  signature?: string;
  status?: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private offlineQueue: Transaction[] = [];

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync("offline_payments.db");
    await this.db.execAsync(
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_id TEXT UNIQUE,
        card_id TEXT,
        merchant_id TEXT,
        amount TEXT,
        currency TEXT,
        pan TEXT,
        expiry TEXT,
        pin_block TEXT,
        cryptogram TEXT,
        atc TEXT,
        iad TEXT,
        nonce TEXT,
        counter INTEGER,
        timestamp INTEGER,
        signature TEXT,
        status TEXT DEFAULT 'PENDING',
        synced INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`
    );
  }

  async storeTransaction(transaction: Transaction): Promise<void> {
    if (!this.db) await this.initialize();
    
    await this.db!.runAsync(
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
    );
  }

  async saveTransaction(txData: OfflineTransaction): Promise<boolean> {
    if (!this.db) await this.initialize();

    try {
      await this.db!.runAsync(
        `INSERT INTO transactions 
         (merchant_id, amount, currency, pan, expiry, pin_block, cryptogram, atc, iad, nonce, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txData.merchantId,
          txData.amount,
          txData.currency,
          txData.pan,
          txData.expiry,
          txData.pinBlock,
          txData.cryptogram,
          txData.atc,
          txData.iad,
          txData.nonce,
          new Date().toISOString(),
        ]
      );
      console.log("Transaction saved offline");
      return true;
    } catch (error) {
      console.error("DB Save Error:", error);
      return false;
    }
  }

  async loadOfflineQueue(): Promise<void> {
    if (!this.db) await this.initialize();

    try {
      const queue = await this.db!.getAllAsync<Transaction>(
        "SELECT * FROM transactions WHERE synced = 0 ORDER BY timestamp ASC"
      );
      this.offlineQueue = queue;
      console.log(`Loaded ${this.offlineQueue.length} offline transactions`);
    } catch (error) {
      console.error("Load queue error:", error);
      this.offlineQueue = [];
    }
  }

  async getPendingTransactions(): Promise<any[]> {
    if (!this.db) await this.initialize();

    try {
      return await this.db!.getAllAsync(
        "SELECT * FROM transactions WHERE synced = 0"
      );
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async markAsUploaded(ids: number[]): Promise<void> {
    if (!this.db) await this.initialize();

    const placeholders = ids.map(() => "?").join(",");
    await this.db!.runAsync(
      `UPDATE transactions SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.runAsync("DELETE FROM transactions");
  }

  async getTodaySpending(cardId: string): Promise<number> {
    if (!this.db) await this.initialize();

    const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    const result = await this.db!.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount) as total 
       FROM transactions 
       WHERE card_id = ? 
       AND timestamp >= ? 
       AND status != 'FAILED'`,
      [cardId, todayStart]
    );

    return result?.total || 0;
  }

  async syncWithBackend(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    try {
      const response = await fetch(
        "https://api.example.com/transactions/batch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactions: this.offlineQueue }),
        }
      );

      if (!response.ok) throw new Error("Sync failed");

      const result = await response.json();
      const ids = result.processed.map((tx: any) => tx.id);
      
      if (ids.length > 0) {
        await this.markAsUploaded(ids);
      }

      await this.loadOfflineQueue();
      console.log("Transactions synced");
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }

  async syncTransaction(transaction: Transaction): Promise<void> {
    try {
      const response = await fetch("https://api.example.com/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction }),
      });

      if (response.ok) {
        console.log("Transaction synced immediately");
      }
    } catch (error) {
      console.log("Immediate sync failed, will retry later:", error);
    }
  }
}

export default DatabaseService.getInstance();
