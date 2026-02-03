import { describe, expect, it } from "vitest";

import { signSession, verifySessionToken, type BackOfficeSession } from "./session";
import { SignJWT } from "jose";

describe("backoffice session", () => {
  it("signs and verifies a session token", async () => {
    process.env.BACKOFFICE_SESSION_SECRET = "test-secret";
    const session: BackOfficeSession = {
      userId: "u1",
      email: "admin@cnts.local",
      displayName: "Admin",
      roleIds: ["role_admin"],
      mfa: true
    };

    const token = await signSession(session, 60);
    const decoded = await verifySessionToken(token);
    expect(decoded).toEqual(session);
  });

  it("returns null for invalid token", async () => {
    process.env.BACKOFFICE_SESSION_SECRET = "test-secret";
    const decoded = await verifySessionToken("not-a-jwt");
    expect(decoded).toBeNull();
  });

  it("returns null for invalid payload types", async () => {
    process.env.BACKOFFICE_SESSION_SECRET = "test-secret";
    const key = new TextEncoder().encode("test-secret");
    const token = await new SignJWT({
      userId: 123,
      email: "admin@cnts.local",
      displayName: "Admin",
      roleIds: ["lectureSeule"],
      mfa: true
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(key);

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });
});
