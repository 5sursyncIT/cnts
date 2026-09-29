// Règles métier côté donneur, sans dépendance serveur (testables unitairement).

/** Lieux où un rendez-vous de don peut être pris en ligne (centres fixes publiés). */
export const LIEUX_RDV = ["CNTS — Siège national (Fann, Dakar)", "CRTS de Kaolack"] as const;

/** Délai minimal entre deux dons de sang total (cnts.gouv.sn, rubrique « Périodicité »). */
export function delaiMois(sexe: string | null | undefined): number {
  return (sexe ?? "").toUpperCase() === "F" ? 4 : 3;
}

function parseDate(iso: string): Date {
  // « 2026-04-14 » → minuit local, pour éviter les décalages de fuseau.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addMonths(date: Date, months: number): Date {
  const r = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  // 31 janvier + 1 mois → fin février (et non 3 mars).
  if (r.getDate() !== date.getDate()) r.setDate(0);
  return r;
}

export type Eligibilite =
  | { etat: "jamais" }
  | { etat: "possible"; depuis: Date }
  | { etat: "attente"; le: Date; joursRestants: number };

/** Date indicative du prochain don possible à partir du dernier don connu. */
export function eligibilite(dernierDon: string | null | undefined, sexe: string | null | undefined, today = new Date()): Eligibilite {
  if (!dernierDon) return { etat: "jamais" };
  const le = addMonths(parseDate(dernierDon), delaiMois(sexe));
  const jour = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (le <= jour) return { etat: "possible", depuis: le };
  const joursRestants = Math.round((le.getTime() - jour.getTime()) / 86_400_000);
  return { etat: "attente", le, joursRestants };
}

/** Date la plus récente entre le profil (dernier_don) et l'historique des dons. */
export function dernierDonConnu(profilDernierDon: string | null | undefined, dons: { date_don: string }[]): string | null {
  const dates = [profilDernierDon, ...dons.map((d) => d.date_don)].filter((d): d is string => Boolean(d));
  return dates.length ? dates.sort().at(-1)! : null;
}

const TYPE_DON: Record<string, string> = {
  SANG_TOTAL: "Sang total",
  PLASMA: "Plasma",
  PLAQUETTES: "Plaquettes",
  APHERESE: "Aphérèse",
};
export const typeDonLabel = (t: string) => TYPE_DON[t?.toUpperCase()] ?? t.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

const TYPE_RDV: Record<string, string> = { DON_SANG: "Don de sang", CONSULTATION: "Consultation" };
export const typeRdvLabel = (t: string) => TYPE_RDV[t] ?? t;

export const STATUT_RDV: Record<string, { label: string; tone: "ok" | "warn" | "crit" | "info" }> = {
  CONFIRME: { label: "Confirmé", tone: "ok" },
  EFFECTUE: { label: "Effectué", tone: "info" },
  ANNULE: { label: "Annulé", tone: "crit" },
  MANQUE: { label: "Manqué", tone: "warn" },
};

const TYPE_DOC: Record<string, string> = {
  ANALYSE: "Analyse",
  COMPTE_RENDU: "Compte-rendu",
  ATTESTATION: "Attestation",
};
export const typeDocLabel = (t: string) => TYPE_DOC[t] ?? t;

/** Rendez-vous à venir et confirmés, du plus proche au plus lointain. */
export function rdvAVenir<T extends { date_prevue: string; statut: string }>(rdvs: T[], now = new Date()): T[] {
  return rdvs
    .filter((r) => r.statut === "CONFIRME" && new Date(r.date_prevue) > now)
    .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue));
}

// --- Créneaux de rendez-vous (horaires publiés du siège : Lun–Ven 08h–17h · Sam 08h–13h) ---

export const HORIZON_RDV_JOURS = 90;

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Première et dernière date réservables : demain (ou la date d'éligibilité si elle est
 * plus tardive) → +90 jours à partir de cette date de début.
 */
export function bornesRdv(today = new Date(), eligibleLe?: Date | null): { min: string; max: string } {
  const demain = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const debut = eligibleLe && eligibleLe > demain ? eligibleLe : demain;
  const max = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + HORIZON_RDV_JOURS - 1);
  return { min: isoLocal(debut), max: isoLocal(max) };
}

/** Créneaux de 30 min proposés pour une date « AAAA-MM-JJ » (vide le dimanche). */
export function creneaux(dateIso: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return [];
  const [y, m, d] = dateIso.split("-").map(Number);
  const jour = new Date(y, m - 1, d).getDay(); // 0 = dimanche
  if (jour === 0) return [];
  const fin = jour === 6 ? 12 * 60 + 30 : 16 * 60 + 30; // dernier créneau
  const out: string[] = [];
  for (let t = 8 * 60; t <= fin; t += 30) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Vérifie qu'un couple date/heure est réservable (dans l'horizon et sur un créneau ouvert). */
export function creneauValide(dateIso: string, heure: string, today = new Date(), eligibleLe?: Date | null): boolean {
  const { min, max } = bornesRdv(today, eligibleLe);
  return dateIso >= min && dateIso <= max && creneaux(dateIso).includes(heure);
}
