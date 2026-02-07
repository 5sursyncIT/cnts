import type { SQLiteDatabase } from "expo-sqlite";
import { SYNC_INTERVAL_MS } from "../constants/api";
import { getQueueStats } from "../db/repositories/event-queue.repo";
import { useSyncStore } from "../stores/sync.store";
import { pushEvents } from "./pusher";
import { pullEvents } from "./puller";

let _intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Exécute un cycle complet de sync : push puis pull.
 */
export async function runSyncCycle(
  db: SQLiteDatabase,
  token: string
): Promise<void> {
  const store = useSyncStore.getState();
  if (store.isSyncing) return; // Éviter les cycles concurrents

  store.setSyncing(true);
  store.setError(null);

  try {
    // 1. Push d'abord (envoyer les données locales)
    const pushResult = await pushEvents(db, token);

    // 2. Pull ensuite (récupérer les données serveur)
    const pullResult = await pullEvents(db, token);

    // 3. Mettre à jour les stats
    const stats = await getQueueStats(db);
    store.setStats(stats);
    store.setLastSync(new Date().toISOString());

    if (pushResult.errors > 0) {
      store.setError(`${pushResult.errors} événement(s) en erreur`);
    }
  } catch (e) {
    store.setError(e instanceof Error ? e.message : "Erreur de synchronisation");
  } finally {
    store.setSyncing(false);
  }
}

/** Démarre le sync automatique périodique. */
export function startPeriodicSync(
  db: SQLiteDatabase,
  token: string
): void {
  stopPeriodicSync();
  // Sync immédiat
  runSyncCycle(db, token);
  // Puis périodique
  _intervalId = setInterval(() => {
    runSyncCycle(db, token);
  }, SYNC_INTERVAL_MS);
}

/** Arrête le sync automatique. */
export function stopPeriodicSync(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
}
