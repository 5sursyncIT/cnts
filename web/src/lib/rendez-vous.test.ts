import { describe, expect, it } from "vitest";

import {
  actionsPossibles,
  horairesEnTexte,
  jourDakar,
  tailleLisible,
  texteEnFermetures,
  texteEnHoraires,
} from "./rendez-vous";

describe("actionsPossibles", () => {
  const now = new Date("2026-10-05T12:00:00Z");

  it("RDV confirmé à venir : seulement annuler", () => {
    expect(actionsPossibles({ statut: "CONFIRME", date_prevue: "2026-10-06T09:00:00Z" }, now)).toEqual(["ANNULE"]);
  });

  it("RDV confirmé du jour ou passé : effectué, manqué, annuler", () => {
    expect(actionsPossibles({ statut: "CONFIRME", date_prevue: "2026-10-05T16:00:00Z" }, now)).toEqual(["EFFECTUE", "MANQUE", "ANNULE"]);
    expect(actionsPossibles({ statut: "CONFIRME", date_prevue: "2026-10-01T09:00:00Z" }, now)).toHaveLength(3);
  });

  it("RDV déjà traité : aucune action", () => {
    for (const statut of ["EFFECTUE", "MANQUE", "ANNULE"]) {
      expect(actionsPossibles({ statut, date_prevue: "2026-10-01T09:00:00Z" }, now)).toEqual([]);
    }
  });

  it("jour de Dakar", () => {
    expect(jourDakar(new Date("2026-10-05T23:30:00Z"))).toBe("2026-10-05");
  });
});

describe("horaires d'un lieu", () => {
  it("aller-retour texte ↔ horaires", () => {
    const horaires = { "1": [["08:00", "12:00"], ["14:00", "17:00"]], "6": [["08:00", "13:00"]] } as Record<string, [string, string][]>;
    const texte = horairesEnTexte(horaires);
    expect(texte["1"]).toBe("08:00-12:00, 14:00-17:00");
    expect(texte["7"]).toBe("");
    expect(texteEnHoraires(texte)).toEqual({ horaires });
  });

  it("refuse une plage mal écrite ou inversée", () => {
    expect(texteEnHoraires({ "1": "8h-17h" })).toHaveProperty("erreur");
    expect(texteEnHoraires({ "2": "17:00-08:00" })).toEqual({ erreur: "Mardi : l'heure de fin doit suivre l'heure de début." });
  });
});

describe("fermetures", () => {
  it("trie, dédoublonne et valide", () => {
    expect(texteEnFermetures("2026-12-25\n2026-04-04, 2026-12-25")).toEqual({ fermetures: ["2026-04-04", "2026-12-25"] });
    expect(texteEnFermetures("")).toEqual({ fermetures: [] });
    expect(texteEnFermetures("25/12/2026")).toHaveProperty("erreur");
  });
});

it("tailleLisible", () => {
  expect(tailleLisible(null)).toBe("—");
  expect(tailleLisible(500)).toBe("500 o");
  expect(tailleLisible(20_480)).toBe("20 Ko");
  expect(tailleLisible(3 * 1024 * 1024)).toBe("3,0 Mo");
});
