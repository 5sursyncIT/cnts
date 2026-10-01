/**
 * Message lisible à partir d'une erreur levée par @cnts/api ({ status, body })
 * ou d'une Error standard. `detail` FastAPI peut être une chaîne ou une liste
 * d'erreurs de validation (422).
 */
export function apiErrorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error && typeof error === "object" && "status" in error) {
    const { status, body } = error as { status: number; body: unknown };
    const detail = (body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean);
      if (msgs.length) return msgs.join(" · ");
    }
    if (status === 401) return "Session expirée : reconnectez-vous.";
    if (status === 403) return "Action non autorisée pour votre rôle.";
    if (status === 404) return "Ressource introuvable.";
    if (status === 429) return "Trop de requêtes : réessayez dans une minute.";
    if (status >= 500) return "Le serveur a rencontré une erreur. Réessayez plus tard.";
    return `${fallback} (erreur ${status})`;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
