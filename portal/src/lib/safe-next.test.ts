import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

const DEFAUT = "/espace-patient/tableau-de-bord";

describe("safeNext", () => {
  it("garde un chemin de l'espace patient", () => {
    expect(safeNext("/espace-patient/rendez-vous")).toBe("/espace-patient/rendez-vous");
    expect(safeNext("/espace-patient/profil?tab=1")).toBe("/espace-patient/profil?tab=1");
  });

  it.each([
    undefined,
    42,
    "",
    "https://evil.tld",
    "//evil.tld",
    "/\\evil.tld",
    "/espace-patient\\@evil.tld",
    "/espace-patient//evil.tld",
    "/espace-patient/../admin",
    "/espace-patientevil",
    "/contact",
    "javascript:alert(1)",
  ])("refuse %s", (next) => {
    expect(safeNext(next)).toBe(DEFAUT);
  });
});
