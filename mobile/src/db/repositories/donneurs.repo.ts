import type { SQLiteDatabase } from "expo-sqlite";
import { generateUUID } from "../../utils/uuid";

export interface LocalDonneur {
  local_id: string;
  server_id: string | null;
  cni_raw: string | null;
  nom: string;
  prenom: string;
  sexe: "H" | "F";
  date_naissance: string | null;
  groupe_sanguin: string | null;
  adresse: string | null;
  region: string | null;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  profession: string | null;
  dernier_don: string | null;
  photo_uri: string | null;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonneurCreateInput {
  cni: string;
  nom: string;
  prenom: string;
  sexe: "H" | "F";
  date_naissance?: string;
  groupe_sanguin?: string;
  adresse?: string;
  region?: string;
  telephone?: string;
  email?: string;
  profession?: string;
}

export async function listDonneurs(
  db: SQLiteDatabase,
  opts?: { query?: string; limit?: number; offset?: number }
): Promise<LocalDonneur[]> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  if (opts?.query) {
    const q = `%${opts.query}%`;
    return db.getAllAsync<LocalDonneur>(
      `SELECT * FROM donneurs WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ?
       ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      q, q, q, limit, offset
    );
  }
  return db.getAllAsync<LocalDonneur>(
    "SELECT * FROM donneurs ORDER BY updated_at DESC LIMIT ? OFFSET ?",
    limit, offset
  );
}

export async function getDonneur(
  db: SQLiteDatabase,
  localId: string
): Promise<LocalDonneur | null> {
  return db.getFirstAsync<LocalDonneur>(
    "SELECT * FROM donneurs WHERE local_id = ?",
    localId
  );
}

export async function getDonneurByServerId(
  db: SQLiteDatabase,
  serverId: string
): Promise<LocalDonneur | null> {
  return db.getFirstAsync<LocalDonneur>(
    "SELECT * FROM donneurs WHERE server_id = ?",
    serverId
  );
}

export async function createDonneur(
  db: SQLiteDatabase,
  input: DonneurCreateInput
): Promise<LocalDonneur> {
  const localId = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO donneurs (local_id, cni_raw, nom, prenom, sexe, date_naissance,
      groupe_sanguin, adresse, region, telephone, email, profession, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    localId, input.cni, input.nom, input.prenom, input.sexe,
    input.date_naissance ?? null, input.groupe_sanguin ?? null,
    input.adresse ?? null, input.region ?? null,
    input.telephone ?? null, input.email ?? null,
    input.profession ?? null, now, now
  );

  return (await getDonneur(db, localId))!;
}

export interface DonneurUpdateInput {
  nom?: string;
  prenom?: string;
  sexe?: "H" | "F";
  date_naissance?: string | null;
  groupe_sanguin?: string | null;
  adresse?: string | null;
  region?: string | null;
  telephone?: string | null;
  email?: string | null;
  profession?: string | null;
  photo_uri?: string | null;
}

export async function updateDonneur(
  db: SQLiteDatabase,
  localId: string,
  input: DonneurUpdateInput
): Promise<LocalDonneur> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
  }
  if (sets.length === 0) {
    return (await getDonneur(db, localId))!;
  }

  sets.push("sync_status = 'PENDING'");
  sets.push("updated_at = datetime('now')");
  values.push(localId);

  await db.runAsync(
    `UPDATE donneurs SET ${sets.join(", ")} WHERE local_id = ?`,
    ...values
  );

  return (await getDonneur(db, localId))!;
}

export async function updateDonneurSyncStatus(
  db: SQLiteDatabase,
  localId: string,
  status: "PENDING" | "SYNCED" | "FAILED",
  serverId?: string,
  error?: string
): Promise<void> {
  await db.runAsync(
    `UPDATE donneurs SET sync_status = ?, server_id = COALESCE(?, server_id),
     sync_error = ?, updated_at = datetime('now') WHERE local_id = ?`,
    status, serverId ?? null, error ?? null, localId
  );
}

export async function countPendingDonneurs(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM donneurs WHERE sync_status = 'PENDING'"
  );
  return row?.count ?? 0;
}
