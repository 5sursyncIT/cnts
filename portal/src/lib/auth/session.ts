import { jwtVerify, SignJWT } from "jose";

export type PortalSession = {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
};

export const sessionCookieName = "cnts_portal_session";

function getSecretKey() {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    // Sans secret, n'importe qui pourrait forger une session : on refuse plutôt que de signer avec une valeur connue.
    throw new Error("PORTAL_SESSION_SECRET manquant");
  }
  return new TextEncoder().encode(secret || "dev-only-change-me");
}

export async function signSession(session: PortalSession, ttlSeconds: number): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ttlSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId as string;
    const email = payload.email as string;
    const displayName = payload.displayName as string;
    const accessToken = payload.accessToken as string;

    if (!userId || !email || !accessToken) return null;

    return { userId, email, displayName, accessToken };
  } catch {
    return null;
  }
}
