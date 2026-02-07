import type { SQLiteDatabase } from "expo-sqlite";
import { generateUUID } from "../../utils/uuid";

export interface SyncCursorRow {
  pull_cursor: string | null;
  last_pull_at: string | null;
  device_id: string;
}

/** Récupère ou crée la ligne de curseur de sync (singleton). */
export async function getSyncCursor(
  db: SQLiteDatabase
): Promise<SyncCursorRow> {
  const row = await db.getFirstAsync<SyncCursorRow>(
    "SELECT pull_cursor, last_pull_at, device_id FROM sync_cursors WHERE id = 1"
  );
  if (row) return row;

  // Première utilisation : créer la ligne avec un device_id unique
  const deviceId = `mobile-${generateUUID()}`;
  await db.runAsync(
    "INSERT INTO sync_cursors (id, device_id) VALUES (1, ?)",
    deviceId
  );
  return { pull_cursor: null, last_pull_at: null, device_id: deviceId };
}

/** Met à jour le curseur de pull après un pull réussi. */
export async function updatePullCursor(
  db: SQLiteDatabase,
  cursor: string | null
): Promise<void> {
  await db.runAsync(
    "UPDATE sync_cursors SET pull_cursor = ?, last_pull_at = datetime('now') WHERE id = 1",
    cursor
  );
}
