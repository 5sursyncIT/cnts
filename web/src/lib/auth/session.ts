import { jwtVerify, SignJWT } from "jose";

export type BackOfficeSession = {
  userId: string;
  email: string;
  displayName: string;
  roleIds: string[];
  mfa: boolean;
};

export const sessionCookieName = "cnts_bo_session";

function getSecretKey() {
  const secret = process.env.BACKOFFICE_SESSION_SECRET ?? "dev-only-change-me";
  return new TextEncoder().encode(secret);
}

export async function signSession(session: BackOfficeSession, ttlSeconds: number): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    roleIds: session.roleIds,
    mfa: session.mfa
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + ttlSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<BackOfficeSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId;
    const email = payload.email;
    const displayName = payload.displayName;
    const roleIds = payload.roleIds;
    const mfa = payload.mfa;

    if (typeof userId !== "string") return null;
    if (typeof email !== "string") return null;
    if (typeof displayName !== "string") return null;
    if (!Array.isArray(roleIds) || roleIds.some((r) => typeof r !== "string")) return null;
    if (typeof mfa !== "boolean") return null;

    return { userId, email, displayName, roleIds, mfa };
  } catch {
    return null;
  }
}

