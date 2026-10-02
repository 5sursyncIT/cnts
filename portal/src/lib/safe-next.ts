const DEFAUT = "/espace-patient/tableau-de-bord";

/**
 * Cible de redirection après connexion : uniquement un chemin interne à l'espace patient.
 * Refuse les URL absolues, les chemins « //hote » et « /\hote » (interprétés comme externes
 * par les navigateurs) ainsi que les sorties de l'espace par « .. ».
 */
export function safeNext(next: unknown): string {
  if (typeof next !== "string") return DEFAUT;
  if (!/^\/espace-patient(\/[\w\-/]*)?(\?[^\\]*)?$/.test(next)) return DEFAUT;
  if (next.includes("..") || next.includes("//")) return DEFAUT;
  return next;
}
