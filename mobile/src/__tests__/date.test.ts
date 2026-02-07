import { checkEligibilite, formatDate, formatDateTime, todayISO } from "../utils/date";
import { format, subDays } from "date-fns";

describe("checkEligibilite", () => {
  it("retourne éligible si pas de dernier don", () => {
    const result = checkEligibilite("H", null);
    expect(result.eligible).toBe(true);
    expect(result.joursRestants).toBeNull();
  });

  it("retourne éligible pour homme après 60 jours", () => {
    const date70DaysAgo = format(subDays(new Date(), 70), "yyyy-MM-dd");
    const result = checkEligibilite("H", date70DaysAgo);
    expect(result.eligible).toBe(true);
  });

  it("retourne non éligible pour homme avant 60 jours", () => {
    const date30DaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const result = checkEligibilite("H", date30DaysAgo);
    expect(result.eligible).toBe(false);
    expect(result.joursRestants).toBeGreaterThan(0);
  });

  it("retourne non éligible pour femme avant 120 jours", () => {
    const date90DaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const result = checkEligibilite("F", date90DaysAgo);
    expect(result.eligible).toBe(false);
    expect(result.joursRestants).toBeGreaterThan(0);
  });

  it("retourne éligible pour femme après 120 jours", () => {
    const date130DaysAgo = format(subDays(new Date(), 130), "yyyy-MM-dd");
    const result = checkEligibilite("F", date130DaysAgo);
    expect(result.eligible).toBe(true);
  });
});

describe("formatDate", () => {
  it("formate une date ISO en français", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("retourne — pour null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("retourne — pour undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formate une date+heure ISO en français", () => {
    const result = formatDateTime("2024-06-15T14:30:00");
    expect(result).toContain("15");
    expect(result).toContain("2024");
    expect(result).toContain("14");
    expect(result).toContain("30");
  });

  it("retourne — pour null", () => {
    expect(formatDateTime(null)).toBe("—");
  });
});

describe("todayISO", () => {
  it("retourne la date du jour au format YYYY-MM-DD", () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const today = new Date();
    const expected = format(today, "yyyy-MM-dd");
    expect(result).toBe(expected);
  });
});
