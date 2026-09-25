/* Pure formatting helpers — safe to call from Server Components. */

export function frDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", opts || { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
