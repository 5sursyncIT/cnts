import { jwtVerify, SignJWT } from "jose";

export type BackOfficePreAuth = {
  email: string;
  challengeToken: string;
  /** true : le compte doit d'abord enrôler sa MFA (challenge d'enrôlement). */
  setup?: boolean;
  /** Enrôlement en cours : secret TOTP et URI otpauth à afficher (QR code). */
  setupSecret?: string;
  otpauthUri?: string;
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
    if (payload.setup !== true) return { email, challengeToken };
    const preAuth: BackOfficePreAuth = { email, challengeToken, setup: true };
    if (typeof payload.setupSecret === "string") preAuth.setupSecret = payload.setupSecret;
    if (typeof payload.otpauthUri === "string") preAuth.otpauthUri = payload.otpauthUri;
    return preAuth;
  } catch {
    return null;
  }
}

// Codes de secours affichés UNE fois après l'enrôlement : transmis à la page
// d'affichage dans un cookie httpOnly signé, de courte durée.
export const recoveryCodesCookieName = "cnts_bo_recovery";

export async function signRecoveryCodes(codes: string[], ttlSeconds: number): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return await new SignJWT({ codes })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ttlSeconds)
    .sign(getSecretKey());
}

export async function verifyRecoveryCodes(token: string): Promise<string[] | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const codes = payload.codes;
    if (!Array.isArray(codes) || !codes.every((c) => typeof c === "string")) return null;
    return codes as string[];
  } catch {
    return null;
  }
}
