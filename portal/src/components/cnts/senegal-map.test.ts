import { describe, expect, it } from "vitest";
import { REGION_POINTS, regionOf } from "./senegal-map";
import { STRUCTURES, CRTS } from "./structures";

describe("regionOf / geoToSvg", () => {
  it("place chaque capitale régionale dans sa région", () => {
    for (const p of REGION_POINTS) {
      expect(regionOf(p.lng, p.lat), p.name).toBe(p.id);
    }
  });
});

describe("cartographie des structures (Excel de la Direction)", () => {
  it("chaque structure tombe dans la région déclarée", () => {
    for (const s of STRUCTURES) {
      expect(regionOf(s.lng, s.lat), s.name).toBe(s.region);
    }
  });

  it("identifiants uniques et CRTS de Kaolack et Matam présents", () => {
    expect(new Set(STRUCTURES.map((s) => s.id)).size).toBe(STRUCTURES.length);
    expect(CRTS.map((s) => s.commune).sort()).toEqual(["Kaolack", "Matam"]);
  });
});
