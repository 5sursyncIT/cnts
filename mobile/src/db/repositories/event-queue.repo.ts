import type { SQLiteDatabase } from "expo-sqlite";
import { generateUUID } from "../../utils/uuid";
import { MAX_RETRIES, RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS } from "../../constants/api";

export interface EventQueueItem {
  id: number;
  client_event_id: string;
  event_type: string;
  payload: string; // JSON string
  occurred_at: string;
  status: "PENDING" | "PUSHING" | "ACCEPTED" | "REJECTED" | "DUPLICATE";
  error_code: string | null;
  error_message: string | null;
  server_response: string | null;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  created_at: string;
  pushed_at: string | null;
}

/** Ajoute un événement dans la file d'attente de sync. */
export async function enqueueEvent(
  db: SQLiteDatabase,
  eventType: string,
  payload: Record<string, unknown>
): Promise<string> {
  const clientEventId = generateUUID();
  await db.runAsync(
    `INSERT INTO event_queue (client_event_id, event_type, payload, status)
     VALUES (?, ?, ?, 'PENDING')`,
    clientEventId, eventType, JSON.stringify(payload)
  );
  return clientEventId;
}

/** Récupère les événements PENDING à pusher, ordonnés par ID (FIFO). */
export async function getPendingEvents(
  db: SQLiteDatabase,
  limit: number = 100
): Promise<EventQueueItem[]> {
  const now = new Date().toISOString();
  return db.getAllAsync<EventQueueItem>(
    `SELECT * FROM event_queue
     WHERE status IN ('PENDING', 'REJECTED')
       AND retry_count < max_retries
       AND (next_retry_at IS NULL OR next_retry_at <= ?)
     ORDER BY id ASC LIMIT ?`,
    now, limit
  );
}

/** Marque un événement comme PUSHING (en cours d'envoi). */
export async function markPushing(
  db: SQLiteDatabase,
  clientEventId: string
): Promise<void> {
  await db.runAsync(
    "UPDATE event_queue SET status = 'PUSHING' WHERE client_event_id = ?",
    clientEventId
  );
}

/** Marque un événement comme ACCEPTED. */
export async function markAccepted(
  db: SQLiteDatabase,
  clientEventId: string,
  serverResponse: Record<string, unknown> | null
): Promise<void> {
  await db.runAsync(
    `UPDATE event_queue SET status = 'ACCEPTED', server_response = ?,
     pushed_at = datetime('now') WHERE client_event_id = ?`,
    serverResponse ? JSON.stringify(serverResponse) : null, clientEventId
  );
}

/** Marque un événement comme DUPLICATE. */
export async function markDuplicate(
  db: SQLiteDatabase,
  clientEventId: string
): Promise<void> {
  await db.runAsync(
    "UPDATE event_queue SET status = 'DUPLICATE', pushed_at = datetime('now') WHERE client_event_id = ?",
    clientEventId
  );
}

/** Marque un événement comme REJECTED avec retry scheduling. */
export async function markRejected(
  db: SQLiteDatabase,
  clientEventId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  // Calcul du prochain retry avec backoff exponentiel
  const item = await db.getFirstAsync<EventQueueItem>(
    "SELECT * FROM event_queue WHERE client_event_id = ?",
    clientEventId
  );
  const retryCount = (item?.retry_count ?? 0) + 1;
  const delay = Math.min(
    RETRY_BASE_DELAY_MS * Math.pow(2, retryCount) + Math.random() * 1000,
    RETRY_MAX_DELAY_MS
  );
  const nextRetryAt = new Date(Date.now() + delay).toISOString();

  await db.runAsync(
    `UPDATE event_queue SET status = 'REJECTED', error_code = ?, error_message = ?,
     retry_count = ?, next_retry_at = ? WHERE client_event_id = ?`,
    errorCode, errorMessage, retryCount, nextRetryAt, clientEventId
  );
}

/** Compte les événements par statut. */
export async function getQueueStats(
  db: SQLiteDatabase
): Promise<{ pending: number; accepted: number; rejected: number }> {
  const rows = await db.getAllAsync<{ status: string; count: number }>(
    "SELECT status, COUNT(*) as count FROM event_queue GROUP BY status"
  );
  const stats = { pending: 0, accepted: 0, rejected: 0 };
  for (const r of rows) {
    if (r.status === "PENDING" || r.status === "PUSHING") stats.pending += r.count;
    else if (r.status === "ACCEPTED" || r.status === "DUPLICATE") stats.accepted += r.count;
    else if (r.status === "REJECTED") stats.rejected += r.count;
  }
  return stats;
}

/** Récupère les événements REJECTED définitivement (max retries atteint). */
export async function getFailedEvents(
  db: SQLiteDatabase,
  limit: number = 50
): Promise<EventQueueItem[]> {
  return db.getAllAsync<EventQueueItem>(
    `SELECT * FROM event_queue WHERE status = 'REJECTED' AND retry_count >= max_retries
     ORDER BY created_at DESC LIMIT ?`,
    limit
  );
}

/** Récupère tous les événements REJECTED (retryable + définitifs). */
export async function getAllRejectedEvents(
  db: SQLiteDatabase,
  limit: number = 100
): Promise<EventQueueItem[]> {
  return db.getAllAsync<EventQueueItem>(
    "SELECT * FROM event_queue WHERE status = 'REJECTED' ORDER BY created_at DESC LIMIT ?",
    limit
  );
}

/** Remet un événement rejeté en PENDING pour retenter. */
export async function retryEvent(
  db: SQLiteDatabase,
  clientEventId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE event_queue SET status = 'PENDING', retry_count = 0,
     next_retry_at = NULL, error_code = NULL, error_message = NULL
     WHERE client_event_id = ?`,
    clientEventId
  );
}

/** Supprime définitivement un événement de la file. */
export async function dismissEvent(
  db: SQLiteDatabase,
  clientEventId: string
): Promise<void> {
  await db.runAsync(
    "DELETE FROM event_queue WHERE client_event_id = ?",
    clientEventId
  );
}
