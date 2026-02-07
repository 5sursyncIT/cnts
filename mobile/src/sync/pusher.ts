import type { SQLiteDatabase } from "expo-sqlite";
import { API_BASE_URL, SYNC_BATCH_SIZE } from "../constants/api";
import {
  getPendingEvents,
  markAccepted,
  markDuplicate,
  markPushing,
  markRejected,
} from "../db/repositories/event-queue.repo";
import { updateDonneurSyncStatus } from "../db/repositories/donneurs.repo";
import { updateDonSyncStatus } from "../db/repositories/dons.repo";
import { getSyncCursor } from "../db/repositories/sync-cursor.repo";
import type { SyncPushIn, SyncPushOut } from "./types";

/**
 * Push les événements PENDING vers le backend.
 *
 * Respecte l'ordre: donneur.upsert AVANT don.create
 * (le backend exige que le donneur existe pour créer un don).
 */
export async function pushEvents(
  db: SQLiteDatabase,
  token: string
): Promise<{ pushed: number; errors: number }> {
  const events = await getPendingEvents(db, SYNC_BATCH_SIZE);
  if (events.length === 0) return { pushed: 0, errors: 0 };

  // Tri: donneur.upsert en premier
  events.sort((a, b) => {
    if (a.event_type === "donneur.upsert" && b.event_type !== "donneur.upsert") return -1;
    if (a.event_type !== "donneur.upsert" && b.event_type === "donneur.upsert") return 1;
    return a.id - b.id;
  });

  // Marquer comme PUSHING
  for (const ev of events) {
    await markPushing(db, ev.client_event_id);
  }

  const { device_id } = await getSyncCursor(db);

  const body: SyncPushIn = {
    device_id,
    events: events.map((ev) => ({
      client_event_id: ev.client_event_id,
      type: ev.event_type,
      payload: JSON.parse(ev.payload),
      occurred_at: ev.occurred_at,
    })),
  };

  let result: SyncPushOut;
  try {
    const res = await fetch(`${API_BASE_URL}/sync/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Remettre en PENDING
      for (const ev of events) {
        await markRejected(db, ev.client_event_id, String(res.status), "Erreur serveur");
      }
      return { pushed: 0, errors: events.length };
    }

    result = await res.json();
  } catch (e) {
    // Erreur réseau, remettre en PENDING pour retry
    for (const ev of events) {
      await markRejected(db, ev.client_event_id, "NETWORK", "Erreur réseau");
    }
    return { pushed: 0, errors: events.length };
  }

  let pushed = 0;
  let errors = 0;

  // Mapper les événements locaux par client_event_id
  const eventsByClientId = new Map(events.map((ev) => [ev.client_event_id, ev]));

  for (const r of result.results) {
    const localEvent = eventsByClientId.get(r.client_event_id);

    if (r.status === "ACCEPTE") {
      await markAccepted(db, r.client_event_id, r.response ?? null);
      // Mettre à jour l'enregistrement local avec les IDs serveur
      if (localEvent) {
        await applyServerResponse(db, localEvent.event_type, JSON.parse(localEvent.payload), r.response);
      }
      pushed++;
    } else if (r.status === "DUPLICATE") {
      await markDuplicate(db, r.client_event_id);
      pushed++;
    } else {
      await markRejected(
        db, r.client_event_id,
        r.error_code ?? "UNKNOWN",
        r.error_message ?? "Erreur inconnue"
      );
      errors++;
    }
  }

  return { pushed, errors };
}

/** Applique la réponse serveur pour mettre à jour les records locaux. */
async function applyServerResponse(
  db: SQLiteDatabase,
  eventType: string,
  payload: Record<string, unknown>,
  response: Record<string, unknown> | null | undefined
): Promise<void> {
  if (!response) return;

  if (eventType === "donneur.upsert") {
    const serverId = response.donneur_id as string;
    if (!serverId) return;
    // Trouver le donneur local par CNI raw dans le payload
    const cni = payload.cni as string;
    if (cni) {
      const row = await db.getFirstAsync<{ local_id: string }>(
        "SELECT local_id FROM donneurs WHERE cni_raw = ?",
        cni
      );
      if (row) {
        await updateDonneurSyncStatus(db, row.local_id, "SYNCED", serverId);
      }
    }
  }

  if (eventType === "don.create") {
    const serverId = response.don_id as string;
    const din = response.din as string;
    // Trouver le don local par le donneur CNI + date
    const cni = payload.donneur_cni as string;
    const dateDon = payload.date_don as string;
    if (cni && dateDon) {
      const donneur = await db.getFirstAsync<{ local_id: string }>(
        "SELECT local_id FROM donneurs WHERE cni_raw = ?",
        cni
      );
      if (donneur) {
        const don = await db.getFirstAsync<{ local_id: string }>(
          "SELECT local_id FROM dons WHERE donneur_local_id = ? AND date_don = ? AND sync_status = 'PENDING'",
          donneur.local_id, dateDon
        );
        if (don) {
          await updateDonSyncStatus(db, don.local_id, "SYNCED", { serverId, din });
        }
      }
    }
  }
}
