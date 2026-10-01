import { describe, expect, it } from "vitest";

import { forwardedForHeader } from "./client-ip";

describe("forwardedForHeader", () => {
  it("keeps only the hop added by the reverse proxy", () => {
    const h = new Headers({ "x-forwarded-for": "6.6.6.6, 41.82.10.5" });
    expect(forwardedForHeader(h)).toEqual({ "x-forwarded-for": "41.82.10.5" });
  });

  it("returns nothing without the header", () => {
    expect(forwardedForHeader(new Headers())).toEqual({});
  });
});
