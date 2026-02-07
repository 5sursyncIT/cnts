import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, DB_VERSION } from "./schema";

const DB_NAME = "cnts_agent.db";

let _db: SQLite.SQLiteDatabase | null = null;

/** Ouvre (ou crée) la base SQLite locale et applique les migrations. */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrency
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  // Check current version
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);"
  );
  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1"
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion < DB_VERSION) {
    // Fresh install: create all tables
    await db.execAsync(CREATE_TABLES_SQL);

    // Incremental migrations for existing databases
    if (currentVersion >= 1 && currentVersion < 2) {
      await db.execAsync(
        "ALTER TABLE donneurs ADD COLUMN photo_uri TEXT;"
      );
    }

    if (currentVersion === 0) {
      await db.runAsync(
        "INSERT INTO schema_version (version) VALUES (?)",
        DB_VERSION
      );
    } else {
      await db.runAsync(
        "UPDATE schema_version SET version = ?",
        DB_VERSION
      );
    }
  }

  _db = db;
  return db;
}

/** Récupère l'instance de base existante (throws si pas encore ouverte). */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error("Base de données non initialisée. Appelez openDatabase() d'abord.");
  return _db;
}
