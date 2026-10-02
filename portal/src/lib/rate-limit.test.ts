import { describe, expect, it } from "vitest";

import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("autorise exactement `limit` essais par fenêtre et par clé", () => {
    const limiter = rateLimit({ interval: 60_000 });
    const essais = Array.from({ length: 6 }, () => limiter.check(5, "login:1.2.3.4").isRateLimited);
    expect(essais).toEqual([false, false, false, false, false, true]);
    expect(limiter.check(5, "login:5.6.7.8").isRateLimited).toBe(false);
  });
});
