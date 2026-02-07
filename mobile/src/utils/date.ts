import { addMonths, differenceInDays, format, isAfter, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/** Vérifie l'éligibilité au don selon le sexe.
 *  Hommes : 2 mois (60j), Femmes : 4 mois (120j). */
export function checkEligibilite(
  sexe: "H" | "F",
  dernierDon: string | null
): { eligible: boolean; eligibleLe: Date | null; joursRestants: number | null } {
  if (!dernierDon) return { eligible: true, eligibleLe: null, joursRestants: null };

  const mois = sexe === "H" ? 2 : 4;
  const eligibleLe = addMonths(parseISO(dernierDon), mois);
  const now = new Date();
  const eligible = isAfter(now, eligibleLe) || now.getTime() === eligibleLe.getTime();
  const joursRestants = eligible ? null : differenceInDays(eligibleLe, now);
  return { eligible, eligibleLe, joursRestants };
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return format(parseISO(dateStr), "dd MMM yyyy", { locale: fr });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return format(parseISO(dateStr), "dd MMM yyyy HH:mm", { locale: fr });
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
