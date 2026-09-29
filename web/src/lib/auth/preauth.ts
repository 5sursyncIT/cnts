import { jwtVerify, SignJWT } from "jose";

export type BackOfficePreAuth = {
  email: string;
  challengeToken: string;
};

export const preAuthCookieName = "cnts_bo_preauth";

function getSecretKey() {
  const secret = process.env.BACKOFFICE_PREAUTH_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("BACKOFFICE_PREAUTH_SECRET must contain at least 32 characters in production");
  }
  return new TextEncoder().encode(secret ?? "dev-only-change-me");
}

export async function signPreAuth(preAuth: BackOfficePreAuth, ttlSeconds: number): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return await new SignJWT(preAuth)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ttlSeconds)
    .sign(getSecretKey());
}

export async function verifyPreAuthToken(token: string): Promise<BackOfficePreAuth | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const email = payload.email;
    const challengeToken = payload.challengeToken;
    if (typeof email !== "string" || typeof challengeToken !== "string") return null;
    return { email, challengeToken };
  } catch {
    return null;
  }
}
