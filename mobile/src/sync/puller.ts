import type { SQLiteDatabase } from "expo-sqlite";
import { API_BASE_URL } from "../constants/api";
import { getSyncCursor, updatePullCursor } from "../db/repositories/sync-cursor.repo";
import type { SyncPullOut } from "./types";

/**
 * Pull les événements serveur via GET /sync/events?cursor=...
 * Applique les mises à jour au store local SQLite.
 */
export async function pullEvents(
  db: SQLiteDatabase,
  token: string
): Promise<{ pulled: number }> {
  const { pull_cursor } = await getSyncCursor(db);

  let totalPulled = 0;
  let cursor = pull_cursor;

  // Boucle jusqu'à ce qu'il n'y ait plus d'événements
  while (true) {
    const url = new URL(`${API_BASE_URL}/sync/events`);
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) break;

    const data: SyncPullOut = await res.json();
    if (data.events.length === 0) break;

    for (const event of data.events) {
      await applyPullEvent(db, event);
    }

    totalPulled += data.events.length;
    cursor = data.next_cursor ?? null;
    await updatePullCursor(db, cursor);

    // Si moins de 200 events, on est à jour
    if (data.events.length < 200) break;
  }

  return { pulled: totalPulled };
}

/** Applique un événement pull du serveur au SQLite local. */
async function applyPullEvent(
  db: SQLiteDatabase,
  event: { event_type: string; payload: Record<string, unknown> }
): Promise<void> {
  // Les events pull sont des trace_events (audit).
  // On met à jour les projections locales si le serveur a modifié des records.
  const { event_type, payload } = event;

  if (event_type === "donneur.upserted") {
    const serverId = payload.donneur_id as string;
    if (!serverId) return;
    // Mettre à jour le server_id si on a un donneur local correspondant
    await db.runAsync(
      `UPDATE donneurs SET server_id = ?, sync_status = 'SYNCED', updated_at = datetime('now')
       WHERE server_id IS NULL AND cni_raw IS NOT NULL`,
      serverId
    );
  }

  if (event_type === "don.created") {
    const din = payload.din as string;
    const serverId = payload.don_id as string;
    if (!din || !serverId) return;
    // Mettre à jour avec DIN et server_id
    await db.runAsync(
      `UPDATE dons SET din = COALESCE(din, ?), server_id = ?, sync_status = 'SYNCED',
       updated_at = datetime('now') WHERE server_id IS NULL`,
      din, serverId
    );
  }
}
