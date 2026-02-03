import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { preAuthCookieName, verifyPreAuthToken } from "@/lib/auth/preauth";
import { signSession, sessionCookieName } from "@/lib/auth/session";
import { getBackOfficeUserByEmail } from "@/lib/auth/users";
import { verifyTotp } from "@/lib/auth/mfa";

export async function POST(request: Request) {
  // Force disable MFA as requested
  const disableMfa = true; 
  const cookieStore = await cookies();
  const preAuthToken = cookieStore.get(preAuthCookieName)?.value;
  if (!preAuthToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const preAuth = await verifyPreAuthToken(preAuthToken);
  if (!preAuth) {
    cookieStore.delete(preAuthCookieName);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = getBackOfficeUserByEmail(preAuth.email);
  if (!user || (!disableMfa && !user.totpSecret)) {
    cookieStore.delete(preAuthCookieName);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const form = await request.formData();
  const token = String(form.get("token") ?? "").replace(/\s+/g, "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!disableMfa) {
    const ok = verifyTotp({ secret: user.totpSecret!, token });
    if (!ok) {
      logAuditEvent({ actorEmail: user.email, action: "auth.mfa_failed" });
      return NextResponse.redirect(new URL(`/mfa?error=1&next=${encodeURIComponent(safeNext)}`, request.url));
    }
  }

  cookieStore.delete(preAuthCookieName);
  const sessionToken = await signSession(
    {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      roleIds: user.roles.map((r) => r.id),
      mfa: !disableMfa
    },
    8 * 60 * 60
  );
  cookieStore.set(sessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  logAuditEvent({
    actorEmail: user.email,
    action: disableMfa ? "auth.mfa_skipped_disabled" : "auth.mfa_success"
  });
  return NextResponse.redirect(new URL(safeNext, request.url));
}
