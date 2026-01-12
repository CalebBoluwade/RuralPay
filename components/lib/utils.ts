import * as SQLite from "expo-sqlite";
import { SQLiteDatabase } from "expo-sqlite";

export const getDatabase = async (
  db: SQLiteDatabase | null
): Promise<SQLiteDatabase | null> => {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync("nfc_payments.db");

      await db.execAsync("PRAGMA journal_mode = WAL");
      await db.execAsync("PRAGMA foreign_keys = ON");
      
      // Initialize tables
      await initializeTables(db);
    } catch (error) {
      console.warn("SQLite not available:", error);

      return null;
    }
  }
  return db;
};

const initializeTables = async (db: SQLiteDatabase) => {
  await db.execAsync(
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
            )`);
};
