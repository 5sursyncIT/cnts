import type { SQLiteDatabase } from "expo-sqlite";
import { generateUUID } from "../../utils/uuid";

export interface LocalDon {
  local_id: string;
  server_id: string | null;
  donneur_local_id: string;
  donneur_server_id: string | null;
  din: string | null;
  date_don: string;
  type_don: string;
  statut_qualification: string;
  idempotency_key: string | null;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonCreateInput {
  donneur_local_id: string;
  date_don: string;
  type_don: string;
}

export interface ListDonsOpts {
  donneurLocalId?: string;
  dateDon?: string;
  dateFrom?: string;
  dateTo?: string;
  query?: string;
  limit?: number;
}

export async function listDons(
  db: SQLiteDatabase,
  opts?: ListDonsOpts
): Promise<LocalDon[]> {
  const limit = opts?.limit ?? 50;

  if (opts?.donneurLocalId) {
    return db.getAllAsync<LocalDon>(
      "SELECT * FROM dons WHERE donneur_local_id = ? ORDER BY created_at DESC LIMIT ?",
      opts.donneurLocalId, limit
    );
  }
  if (opts?.dateDon) {
    return db.getAllAsync<LocalDon>(
      "SELECT * FROM dons WHERE date_don = ? ORDER BY created_at DESC LIMIT ?",
      opts.dateDon, limit
    );
  }
  if (opts?.dateFrom && opts?.dateTo) {
    return db.getAllAsync<LocalDon>(
      "SELECT * FROM dons WHERE date_don >= ? AND date_don <= ? ORDER BY date_don DESC LIMIT ?",
      opts.dateFrom, opts.dateTo, limit
    );
  }
  if (opts?.query) {
    const q = `%${opts.query}%`;
    return db.getAllAsync<LocalDon>(
      `SELECT d.* FROM dons d
       JOIN donneurs dn ON d.donneur_local_id = dn.local_id
       WHERE dn.nom LIKE ? OR dn.prenom LIKE ? OR d.din LIKE ?
       ORDER BY d.created_at DESC LIMIT ?`,
      q, q, q, limit
    );
  }
  return db.getAllAsync<LocalDon>(
    "SELECT * FROM dons ORDER BY created_at DESC LIMIT ?",
    limit
  );
}

export async function getDon(
  db: SQLiteDatabase,
  localId: string
): Promise<LocalDon | null> {
  return db.getFirstAsync<LocalDon>(
    "SELECT * FROM dons WHERE local_id = ?",
    localId
  );
}

export async function createDon(
  db: SQLiteDatabase,
  input: DonCreateInput
): Promise<LocalDon> {
  const localId = generateUUID();
  const idempotencyKey = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO dons (local_id, donneur_local_id, date_don, type_don,
      statut_qualification, idempotency_key, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'EN_ATTENTE', ?, 'PENDING', ?, ?)`,
    localId, input.donneur_local_id, input.date_don, input.type_don,
    idempotencyKey, now, now
  );

  // Mettre à jour dernier_don du donneur
  await db.runAsync(
    "UPDATE donneurs SET dernier_don = ?, updated_at = datetime('now') WHERE local_id = ?",
    input.date_don, input.donneur_local_id
  );

  return (await getDon(db, localId))!;
}

export async function updateDonSyncStatus(
  db: SQLiteDatabase,
  localId: string,
  status: "PENDING" | "SYNCED" | "FAILED",
  opts?: { serverId?: string; din?: string; error?: string }
): Promise<void> {
  await db.runAsync(
    `UPDATE dons SET sync_status = ?, server_id = COALESCE(?, server_id),
     din = COALESCE(?, din), sync_error = ?, updated_at = datetime('now')
     WHERE local_id = ?`,
    status, opts?.serverId ?? null, opts?.din ?? null,
    opts?.error ?? null, localId
  );
}

export async function countTodayDons(db: SQLiteDatabase, date: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM dons WHERE date_don = ?",
    date
  );
  return row?.count ?? 0;
}
