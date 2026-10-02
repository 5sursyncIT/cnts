// Règles métier côté donneur, sans dépendance serveur (testables unitairement).

/**
 * Centres fixes publiés (carte des collectes). La liste réellement réservable, avec horaires
 * et capacité, vient du backend (/api/me/rdv/lieux, gérée dans le back-office).
 */
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
  ATTESTATION: "Attestation",
  CERTIFICAT: "Certificat",
  COMPTE_RENDU: "Compte-rendu",
  AUTRE: "Document",
};
export const typeDocLabel = (t: string) => TYPE_DOC[t] ?? t;

/** Rendez-vous à venir et confirmés, du plus proche au plus lointain. */
export function rdvAVenir<T extends { date_prevue: string; statut: string }>(rdvs: T[], now = new Date()): T[] {
  return rdvs
    .filter((r) => r.statut === "CONFIRME" && new Date(r.date_prevue) > now)
    .sort((a, b) => a.date_prevue.localeCompare(b.date_prevue));
}

// --- Éligibilité renvoyée par le backend ---------------------------------------------

export type EligibiliteServeur = Eligibilite | { etat: "inapte"; raison: string };

/**
 * Traduit l'éligibilité calculée par le backend (qui connaît l'âge et le type du dernier
 * don) dans les états affichés par le portail.
 */
export function depuisServeur(
  e: { eligible: boolean; eligible_le: string | null; raison: string },
  dernierDon: string | null,
  today = new Date(),
): EligibiliteServeur {
  if (!e.eligible) {
    if (!e.eligible_le) return { etat: "inapte", raison: e.raison };
    const le = parseDate(e.eligible_le);
    const jour = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return { etat: "attente", le, joursRestants: Math.max(1, Math.round((le.getTime() - jour.getTime()) / 86_400_000)) };
  }
  if (!dernierDon) return { etat: "jamais" };
  return { etat: "possible", depuis: e.eligible_le ? parseDate(e.eligible_le) : parseDate(dernierDon) };
}

/** « AAAA-MM-JJ » d'une date locale (sans passage par UTC). */
export function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Dates proposées dans le calendrier : aujourd'hui (ou la date d'éligibilité) → horizon du lieu. */
export function bornesRdv(horizonJours: number, today = new Date(), eligibleLe?: string | null): { min: string; max: string } {
  const aujourdhui = isoLocal(today);
  const max = isoLocal(new Date(today.getFullYear(), today.getMonth(), today.getDate() + horizonJours));
  const min = eligibleLe && eligibleLe > aujourdhui ? eligibleLe : aujourdhui;
  return { min, max };
}
