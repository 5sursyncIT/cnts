import { describe, expect, it } from "vitest";

import { bornesRdv, creneauValide, creneaux, dernierDonConnu, eligibilite, rdvAVenir, typeDonLabel } from "./donneur";

describe("eligibilite", () => {
  const today = new Date(2026, 8, 29); // 29 septembre 2026

  it("sans don connu", () => {
    expect(eligibilite(null, "M", today)).toEqual({ etat: "jamais" });
  });

  it("homme : 3 mois après le dernier don", () => {
    const r = eligibilite("2026-08-01", "M", today);
    expect(r.etat).toBe("attente");
    if (r.etat === "attente") {
      expect(r.le).toEqual(new Date(2026, 10, 1));
      expect(r.joursRestants).toBe(33);
    }
  });

  it("femme : 4 mois après le dernier don", () => {
    const r = eligibilite("2026-06-01", "F", today);
    expect(r.etat).toBe("attente");
    if (r.etat === "attente") expect(r.le).toEqual(new Date(2026, 9, 1));
  });

  it("délai écoulé → don possible", () => {
    expect(eligibilite("2026-05-01", "M", today).etat).toBe("possible");
  });

  it("fin de mois : 30 novembre + 3 mois → fin février", () => {
    const r = eligibilite("2026-11-30", "M", new Date(2026, 11, 1));
    if (r.etat === "attente") expect(r.le).toEqual(new Date(2027, 1, 28));
  });
});

describe("dernierDonConnu", () => {
  it("prend la date la plus récente entre profil et historique", () => {
    expect(dernierDonConnu("2026-01-10", [{ date_don: "2026-05-03" }, { date_don: "2025-12-01" }])).toBe("2026-05-03");
    expect(dernierDonConnu(null, [])).toBeNull();
  });
});

describe("rdvAVenir", () => {
  it("garde les RDV confirmés futurs, triés", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    const r = rdvAVenir(
      [
        { date_prevue: "2026-10-20T09:00:00Z", statut: "CONFIRME" },
        { date_prevue: "2026-10-05T09:00:00Z", statut: "CONFIRME" },
        { date_prevue: "2026-10-01T09:00:00Z", statut: "ANNULE" },
        { date_prevue: "2026-09-01T09:00:00Z", statut: "CONFIRME" },
      ],
      now,
    );
    expect(r.map((x) => x.date_prevue)).toEqual(["2026-10-05T09:00:00Z", "2026-10-20T09:00:00Z"]);
  });
});

it("typeDonLabel", () => {
  expect(typeDonLabel("SANG_TOTAL")).toBe("Sang total");
  expect(typeDonLabel("GLOBULES_ROUGES")).toBe("Globules rouges");
});


describe("créneaux de rendez-vous", () => {
  it("dimanche fermé, samedi jusqu'à 12h30, semaine jusqu'à 16h30", () => {
    expect(creneaux("2026-10-04")).toEqual([]); // dimanche
    expect(creneaux("2026-10-03").at(-1)).toBe("12:30"); // samedi
    expect(creneaux("2026-10-05")[0]).toBe("08:00"); // lundi
    expect(creneaux("2026-10-05").at(-1)).toBe("16:30");
  });

  it("borne l'horizon de demain à +90 jours", () => {
    const today = new Date(2026, 8, 29);
    expect(bornesRdv(today)).toEqual({ min: "2026-09-30", max: "2026-12-28" });
    expect(creneauValide("2026-09-29", "09:00", today)).toBe(false); // aujourd'hui
    expect(creneauValide("2026-10-05", "09:00", today)).toBe(true);
    expect(creneauValide("2026-10-05", "09:15", today)).toBe(false); // hors grille
    expect(creneauValide("2026-12-29", "09:00", today)).toBe(false); // au-delà de 90 j
  });

  it("ne propose rien avant la date d'éligibilité", () => {
    const today = new Date(2026, 8, 29);
    const eligible = new Date(2026, 10, 2); // 2 novembre
    expect(bornesRdv(today, eligible)).toEqual({ min: "2026-11-02", max: "2027-01-30" });
    expect(creneauValide("2026-10-05", "09:00", today, eligible)).toBe(false);
    expect(creneauValide("2026-11-02", "09:00", today, eligible)).toBe(true);
    // Éligibilité déjà passée : on reste sur « demain ».
    expect(bornesRdv(today, new Date(2026, 5, 1)).min).toBe("2026-09-30");
  });
});
