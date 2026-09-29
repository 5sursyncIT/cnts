/**
 * Client API initialisé pour le Back Office
 * Utilise le proxy /api/* pour éviter CORS
 */

import { createApiClient } from "@cnts/api";

// En production, utiliser le proxy Next.js /api
// En développement, pointer directement vers le backend
const baseUrl =
  typeof window !== "undefined"
    ? "/admin/api/backend"
    : (process.env.BACKEND_API_URL || "http://api:8000") + "/api";

export const apiClient = createApiClient({
  baseUrl,
  fetchImpl: typeof window !== "undefined" ? window.fetch.bind(window) : fetch,
});
