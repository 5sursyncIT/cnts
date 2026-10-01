import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { accessCookieName, sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { preAuthCookieName } from "@/lib/auth/preauth";
import { forwardedForHeader } from "@/lib/http/client-ip";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const accessToken = cookieStore.get(accessCookieName)?.value;

  // Révocation côté backend : le jeton d'accès (valide 8 h) ne doit plus servir,
  // même s'il a été copié. Un échec ici n'empêche pas la déconnexion locale.
  if (accessToken) {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    try {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, ...forwardedForHeader(request.headers) },
        cache: "no-store",
      });
    } catch (error) {
      console.error("Logout revocation error:", error);
    }
  }

  cookieStore.delete(sessionCookieName);
  cookieStore.delete(preAuthCookieName);
  cookieStore.delete(accessCookieName);

  logAuditEvent({ actorEmail: session?.email, action: "auth.logout" });
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  return NextResponse.redirect(new URL(`${APP_URL}/admin/login`));
}
