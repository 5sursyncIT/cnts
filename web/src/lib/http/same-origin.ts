const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Origines autorisées à envoyer des requêtes modifiant des données. */
export function allowedOrigins(requestOrigin: string): Set<string> {
  const origins = new Set<string>();
  try {
    origins.add(new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn").origin);
  } catch {
    // URL mal configurée : seule l'origine de développement reste possible.
  }
  if (process.env.NODE_ENV !== "production") origins.add(requestOrigin);
  return origins;
}

/**
 * Protection CSRF : une requête modifiante portant un en-tête Origin (tous les
 * navigateurs récents l'envoient) doit venir du Back Office lui-même. Sans
 * Origin (client non navigateur), on s'appuie sur SameSite=Lax des cookies.
 */
export function isCrossSiteWrite(method: string, origin: string | null, requestOrigin: string): boolean {
  if (!UNSAFE_METHODS.has(method.toUpperCase())) return false;
  if (!origin || origin === "null") return origin === "null";
  return !allowedOrigins(requestOrigin).has(origin);
}
