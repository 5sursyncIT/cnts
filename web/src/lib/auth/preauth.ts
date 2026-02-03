import { jwtVerify, SignJWT } from "jose";

export type BackOfficePreAuth = {
  email: string;
};

export const preAuthCookieName = "cnts_bo_preauth";

function getSecretKey() {
  const secret = process.env.BACKOFFICE_PREAUTH_SECRET ?? "dev-only-change-me";
  return new TextEncoder().encode(secret);
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
    if (typeof email !== "string") return null;
    return { email };
  } catch {
    return null;
  }
}

