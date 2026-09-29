import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { preAuthCookieName, verifyPreAuthToken } from "@/lib/auth/preauth";
import { accessCookieName, signSession, sessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  const cookieStore = await cookies();
  const preAuthToken = cookieStore.get(preAuthCookieName)?.value;
  if (!preAuthToken) {
    return NextResponse.redirect(new URL("/admin/login", appUrl));
  }

  const preAuth = await verifyPreAuthToken(preAuthToken);
  if (!preAuth) {
    cookieStore.delete(preAuthCookieName);
    return NextResponse.redirect(new URL("/admin/login", appUrl));
  }

  const form = await request.formData();
  const token = String(form.get("token") ?? "").replace(/\s+/g, "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/api/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_token: preAuth.challengeToken, token }),
      cache: "no-store"
    });
    if (!response.ok) {
      logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_failed" });
      return NextResponse.redirect(new URL(`/admin/mfa?error=1&next=${encodeURIComponent(safeNext)}`, appUrl));
    }
    const { access_token, user } = await response.json();
    if (typeof access_token !== "string" || !user?.id || !user?.email || !user?.role || user.role.toUpperCase() === "PATIENT") {
      throw new Error("Invalid MFA response");
    }

    cookieStore.delete(preAuthCookieName);
    const sessionToken = await signSession(
      { userId: user.id, email: user.email, displayName: user.email.split("@")[0], roleIds: [user.role], mfa: true },
      8 * 60 * 60
    );
    const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 60 * 60 };
    cookieStore.set(sessionCookieName, sessionToken, cookieOptions);
    cookieStore.set(accessCookieName, access_token, cookieOptions);
    logAuditEvent({ actorEmail: user.email, action: "auth.mfa_success" });
    const finalNext = safeNext.startsWith("/admin/") ? safeNext : `/admin${safeNext}`;
    return NextResponse.redirect(new URL(finalNext, appUrl));
  } catch (error) {
    console.error("MFA verification error:", error);
    logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_error" });
    return NextResponse.redirect(new URL(`/admin/mfa?error=1&next=${encodeURIComponent(safeNext)}`, appUrl));
  }
}
