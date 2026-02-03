import { describe, expect, it } from "vitest";

import { signPreAuth, verifyPreAuthToken } from "./preauth";

describe("backoffice preauth", () => {
  it("signs and verifies preauth token", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    const token = await signPreAuth({ email: "admin@cnts.local" }, 60);
    await expect(verifyPreAuthToken(token)).resolves.toEqual({ email: "admin@cnts.local" });
  });

  it("returns null for invalid token", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    await expect(verifyPreAuthToken("not-a-jwt")).resolves.toBeNull();
  });
});
