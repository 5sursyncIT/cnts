import { cookies } from "next/headers";

import { preAuthCookieName } from "./preauth";
import { accessCookieName, signSession, sessionCookieName } from "./session";

const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type BackendStaffUser = { id: string; email: string; role: string };

/** Valide l'utilisateur renvoyé par le backend : personnel uniquement. */
export function asStaffUser(user: unknown): BackendStaffUser | null {
  const u = user as Partial<BackendStaffUser> | null;
  if (!u || typeof u.id !== "string" || typeof u.email !== "string" || typeof u.role !== "string") return null;
  if (u.role.toUpperCase() === "PATIENT") return null;
  return { id: u.id, email: u.email, role: u.role };
}

/**
 * Ouvre la session Back Office après un second facteur validé : cookie de session
 * signé (mfa: true) + jeton d'accès backend httpOnly, TTL alignés sur le backend.
 */
export async function establishMfaSession(user: BackendStaffUser, accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(preAuthCookieName);
  const sessionToken = await signSession(
    { userId: user.id, email: user.email, displayName: user.email.split("@")[0], roleIds: [user.role], mfa: true },
    SESSION_TTL_SECONDS
  );
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
  cookieStore.set(sessionCookieName, sessionToken, cookieOptions);
  cookieStore.set(accessCookieName, accessToken, cookieOptions);
}

export function adminPath(next: string): string {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return safeNext.startsWith("/admin/") ? safeNext : `/admin${safeNext}`;
}
