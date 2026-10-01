/**
 * En-tête X-Forwarded-For à transmettre au backend pour un appel fait par le
 * serveur Next au nom d'un navigateur.
 *
 * Apache ajoute l'IP réelle en DERNIÈRE position de X-Forwarded-For (les entrées
 * précédentes viennent du client et sont falsifiables). Sans cet en-tête, le
 * backend verrait l'IP du conteneur et appliquerait une seule limite de débit à
 * tout le Back Office.
 */
export function forwardedForHeader(source: Headers): Record<string, string> {
  const last = source.get("x-forwarded-for")?.split(",").pop()?.trim();
  return last ? { "x-forwarded-for": last } : {};
}
