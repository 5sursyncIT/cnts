// Règles d'affichage des rendez-vous pris en ligne (sans dépendance React, testables).

export type ActionRdv = "EFFECTUE" | "MANQUE" | "ANNULE";

export const ACTION_RDV: Record<ActionRdv, { label: string; tone: "success" | "secondary" | "danger" }> = {
  EFFECTUE: { label: "Effectué", tone: "success" },
  MANQUE: { label: "Manqué", tone: "secondary" },
  ANNULE: { label: "Annuler", tone: "danger" },
};

const DAKAR = "Africa/Dakar";

/** « AAAA-MM-JJ » à Dakar (UTC toute l'année). */
export function jourDakar(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: DAKAR });
}

export function dateHeureDakar(iso: string): { jour: string; heure: string } {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: DAKAR }),
    heure: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: DAKAR }).replace(":", "h"),
  };
}

/**
 * Actions proposées sur un RDV (mêmes règles que le backend) : seul un RDV confirmé se traite ;
 * « effectué » / « manqué » à partir du jour du RDV ; « annuler » à tout moment.
 */
export function actionsPossibles(rdv: { statut: string; date_prevue: string }, now = new Date()): ActionRdv[] {
  if (rdv.statut !== "CONFIRME") return [];
  return jourDakar(new Date(rdv.date_prevue)) <= jourDakar(now) ? ["EFFECTUE", "MANQUE", "ANNULE"] : ["ANNULE"];
}

// --- Horaires d'un lieu : saisie texte « 08:00-12:00, 14:00-17:00 » par jour ------------------

export const JOURS_SEMAINE = [
  { iso: "1", label: "Lundi" },
  { iso: "2", label: "Mardi" },
  { iso: "3", label: "Mercredi" },
  { iso: "4", label: "Jeudi" },
  { iso: "5", label: "Vendredi" },
  { iso: "6", label: "Samedi" },
  { iso: "7", label: "Dimanche" },
] as const;

export type Horaires = Record<string, [string, string][]>;

export function horairesEnTexte(horaires: Horaires): Record<string, string> {
  return Object.fromEntries(JOURS_SEMAINE.map(({ iso }) => [iso, (horaires[iso] ?? []).map(([a, b]) => `${a}-${b}`).join(", ")]));
}

const PLAGE = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/;

export function texteEnHoraires(texte: Record<string, string>): { horaires: Horaires } | { erreur: string } {
  const horaires: Horaires = {};
  for (const { iso, label } of JOURS_SEMAINE) {
    const brut = (texte[iso] ?? "").trim();
    if (!brut) continue;
    const plages: [string, string][] = [];
    for (const morceau of brut.split(",")) {
      const m = morceau.trim().match(PLAGE);
      if (!m) return { erreur: `${label} : « ${morceau.trim()} » n'est pas une plage valide (ex. 08:00-17:00).` };
      const debut = `${m[1]}:${m[2]}`;
      const fin = `${m[3]}:${m[4]}`;
      if (debut >= fin) return { erreur: `${label} : l'heure de fin doit suivre l'heure de début.` };
      plages.push([debut, fin]);
    }
    horaires[iso] = plages;
  }
  return { horaires };
}

/** Jours de fermeture saisis librement (un par ligne, ou séparés par des virgules). */
export function texteEnFermetures(texte: string): { fermetures: string[] } | { erreur: string } {
  const dates = texte.split(/[\s,;]+/).filter(Boolean);
  const invalide = dates.find((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)));
  if (invalide) return { erreur: `Date de fermeture invalide : « ${invalide} » (format AAAA-MM-JJ).` };
  return { fermetures: [...new Set(dates)].sort() };
}

export function tailleLisible(octets: number | null | undefined): string {
  if (!octets) return "—";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}
