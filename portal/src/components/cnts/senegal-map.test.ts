import { describe, expect, it } from "vitest";
import { REGION_POINTS, regionOf } from "./senegal-map";
import { centers } from "./data";

describe("regionOf / geoToSvg", () => {
  it("place chaque capitale régionale dans sa région", () => {
    for (const p of REGION_POINTS) {
      expect(regionOf(p.lng, p.lat), p.name).toBe(p.id);
    }
  });

  it("rattache les centres de don à la bonne région", () => {
    const byId = Object.fromEntries(centers.map((c) => [c.id, regionOf(c.lng, c.lat)]));
    expect(byId["dakar-cnts"]).toBe("SNDK");
    expect(byId["crts-kaolack"]).toBe("SNKL");
  });
});
