import type { SQLiteDatabase } from "expo-sqlite";
import { generateUUID } from "../../utils/uuid";

export interface LocalRdv {
  local_id: string;
  server_id: string | null;
  donneur_local_id: string;
  date_prevue: string;
  type_rdv: string;
  statut: "CONFIRME" | "ANNULE" | "EFFECTUE" | "MANQUE";
  lieu: string | null;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

export interface RdvCreateInput {
  donneur_local_id: string;
  date_prevue: string;
  type_rdv?: string;
  lieu?: string;
  commentaire?: string;
}

export async function listRdv(
  db: SQLiteDatabase,
  opts?: { donneurLocalId?: string; upcoming?: boolean; limit?: number }
): Promise<LocalRdv[]> {
  const limit = opts?.limit ?? 50;

  if (opts?.donneurLocalId) {
    return db.getAllAsync<LocalRdv>(
      "SELECT * FROM rendez_vous WHERE donneur_local_id = ? ORDER BY date_prevue DESC LIMIT ?",
      opts.donneurLocalId, limit
    );
  }
  if (opts?.upcoming) {
    const today = new Date().toISOString().slice(0, 10);
    return db.getAllAsync<LocalRdv>(
      `SELECT * FROM rendez_vous WHERE date_prevue >= ? AND statut = 'CONFIRME'
       ORDER BY date_prevue ASC LIMIT ?`,
      today, limit
    );
  }
  return db.getAllAsync<LocalRdv>(
    "SELECT * FROM rendez_vous ORDER BY date_prevue DESC LIMIT ?",
    limit
  );
}

export async function getRdv(
  db: SQLiteDatabase,
  localId: string
): Promise<LocalRdv | null> {
  return db.getFirstAsync<LocalRdv>(
    "SELECT * FROM rendez_vous WHERE local_id = ?",
    localId
  );
}

export async function createRdv(
  db: SQLiteDatabase,
  input: RdvCreateInput
): Promise<LocalRdv> {
  const localId = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO rendez_vous (local_id, donneur_local_id, date_prevue, type_rdv, statut, lieu, commentaire, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'CONFIRME', ?, ?, ?, ?)`,
    localId, input.donneur_local_id, input.date_prevue,
    input.type_rdv ?? "DON_SANG",
    input.lieu ?? null, input.commentaire ?? null,
    now, now
  );

  return (await getRdv(db, localId))!;
}

export async function cancelRdv(
  db: SQLiteDatabase,
  localId: string
): Promise<void> {
  await db.runAsync(
    "UPDATE rendez_vous SET statut = 'ANNULE', updated_at = datetime('now') WHERE local_id = ?",
    localId
  );
}

export async function markRdvDone(
  db: SQLiteDatabase,
  localId: string
): Promise<void> {
  await db.runAsync(
    "UPDATE rendez_vous SET statut = 'EFFECTUE', updated_at = datetime('now') WHERE local_id = ?",
    localId
  );
}

export async function countUpcomingRdv(db: SQLiteDatabase): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM rendez_vous WHERE date_prevue >= ? AND statut = 'CONFIRME'",
    today
  );
  return row?.count ?? 0;
}
