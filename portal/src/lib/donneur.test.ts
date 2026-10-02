import { describe, expect, it } from "vitest";

import { bornesRdv, depuisServeur, dernierDonConnu, eligibilite, rdvAVenir, typeDonLabel } from "./donneur";

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


describe("calendrier de rendez-vous", () => {
  const today = new Date(2026, 8, 29);

  it("va d'aujourd'hui à l'horizon du lieu", () => {
    expect(bornesRdv(90, today)).toEqual({ min: "2026-09-29", max: "2026-12-28" });
  });

  it("commence à la date d'éligibilité si elle est plus tardive", () => {
    expect(bornesRdv(90, today, "2026-11-02")).toEqual({ min: "2026-11-02", max: "2026-12-28" });
    expect(bornesRdv(90, today, "2026-06-01").min).toBe("2026-09-29");
  });
});

describe("éligibilité renvoyée par le backend", () => {
  const today = new Date(2026, 8, 29);

  it("attente avec date et jours restants", () => {
    const e = depuisServeur({ eligible: false, eligible_le: "2026-10-09", raison: "Délai" }, "2026-06-09", today);
    expect(e).toMatchObject({ etat: "attente", joursRestants: 10 });
  });

  it("inapte sans date (âge)", () => {
    expect(depuisServeur({ eligible: false, eligible_le: null, raison: "Âge au-delà de la limite" }, null, today)).toEqual({
      etat: "inapte",
      raison: "Âge au-delà de la limite",
    });
  });

  it("premier don ou don à nouveau possible", () => {
    expect(depuisServeur({ eligible: true, eligible_le: null, raison: "" }, null, today)).toEqual({ etat: "jamais" });
    expect(depuisServeur({ eligible: true, eligible_le: "2026-09-01", raison: "" }, "2026-05-01", today).etat).toBe("possible");
  });
});
