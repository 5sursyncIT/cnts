import { afterEach, describe, expect, it, vi } from "vitest";

import { isCrossSiteWrite } from "./same-origin";

describe("isCrossSiteWrite", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts writes from the configured app origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://cnts.gouv.sn");
    vi.stubEnv("NODE_ENV", "production");
    expect(isCrossSiteWrite("POST", "https://cnts.gouv.sn", "http://127.0.0.1:3001")).toBe(false);
  });

  it("rejects writes from another origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://cnts.gouv.sn");
    vi.stubEnv("NODE_ENV", "production");
    expect(isCrossSiteWrite("POST", "https://evil.example", "http://127.0.0.1:3001")).toBe(true);
    expect(isCrossSiteWrite("DELETE", "null", "http://127.0.0.1:3001")).toBe(true);
  });

  it("ignores safe methods and requests without Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isCrossSiteWrite("GET", "https://evil.example", "http://x")).toBe(false);
    expect(isCrossSiteWrite("POST", null, "http://x")).toBe(false);
  });
});
