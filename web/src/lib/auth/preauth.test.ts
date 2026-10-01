import { describe, expect, it } from "vitest";

import { signPreAuth, signRecoveryCodes, verifyPreAuthToken, verifyRecoveryCodes } from "./preauth";

describe("backoffice preauth", () => {
  it("signs and verifies preauth token", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    const token = await signPreAuth({ email: "admin@cnts.local", challengeToken: "mfa-challenge" }, 60);
    await expect(verifyPreAuthToken(token)).resolves.toEqual({
      email: "admin@cnts.local",
      challengeToken: "mfa-challenge"
    });
  });

  it("keeps the MFA enrollment flag", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    const token = await signPreAuth({ email: "a@cnts.local", challengeToken: "c", setup: true }, 60);
    await expect(verifyPreAuthToken(token)).resolves.toEqual({ email: "a@cnts.local", challengeToken: "c", setup: true });
  });

  it("round-trips recovery codes", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    const token = await signRecoveryCodes(["abc-def", "123-456"], 60);
    await expect(verifyRecoveryCodes(token)).resolves.toEqual(["abc-def", "123-456"]);
    await expect(verifyRecoveryCodes("garbage")).resolves.toBeNull();
  });

  it("returns null for invalid token", async () => {
    process.env.BACKOFFICE_PREAUTH_SECRET = "test-preauth-secret";
    await expect(verifyPreAuthToken("not-a-jwt")).resolves.toBeNull();
  });
});
