/** Base URL du backend API. Configurable via variable d'environnement Expo. */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://10.0.2.2:8000/api";

/** Intervalle de sync automatique en ms (60 secondes). */
export const SYNC_INTERVAL_MS = 60_000;

/** Taille max d'un batch de push sync. */
export const SYNC_BATCH_SIZE = 100;

/** Délai de base pour le retry exponentiel (5 secondes). */
export const RETRY_BASE_DELAY_MS = 5_000;

/** Délai max pour le retry (5 minutes). */
export const RETRY_MAX_DELAY_MS = 300_000;

/** Nombre max de retries par event. */
export const MAX_RETRIES = 5;
