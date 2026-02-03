import { describe, expect, it } from "vitest";

import { signSession, verifySessionToken, type PortalSession } from "./session";
import { SignJWT } from "jose";

describe("portal session", () => {
  it("signs and verifies a session token", async () => {
    process.env.PORTAL_SESSION_SECRET = "test-secret";
    const session: PortalSession = {
      userId: "p1",
      email: "patient@cnts.local",
      displayName: "Patient"
    };
    const token = await signSession(session, 60);
    await expect(verifySessionToken(token)).resolves.toEqual(session);
  });

  it("returns null for invalid token", async () => {
    process.env.PORTAL_SESSION_SECRET = "test-secret";
    await expect(verifySessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null for invalid payload", async () => {
    process.env.PORTAL_SESSION_SECRET = "test-secret";
    const key = new TextEncoder().encode("test-secret");
    const token = await new SignJWT({ userId: 123, email: "patient@cnts.local", displayName: "Patient" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(key);
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
