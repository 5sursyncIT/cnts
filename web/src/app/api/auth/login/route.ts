import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { signPreAuth, preAuthCookieName } from "@/lib/auth/preauth";
import { signSession, sessionCookieName } from "@/lib/auth/session";
import { getBackOfficeUserByEmail, verifyPassword } from "@/lib/auth/users";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const user = getBackOfficeUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    logAuditEvent({ actorEmail: email, action: "auth.login_failed" });
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  cookieStore.delete(preAuthCookieName);

  if (user.isMfaEnabled) {
    const preAuthToken = await signPreAuth({ email: user.email }, 5 * 60);
    cookieStore.set(preAuthCookieName, preAuthToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    logAuditEvent({ actorEmail: user.email, action: "auth.password_ok_mfa_required" });
    return NextResponse.redirect(new URL(`/mfa?next=${encodeURIComponent(safeNext)}`, request.url));
  }

  const sessionToken = await signSession(
    {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      roleIds: user.roles.map((r) => r.id),
      mfa: false
    },
    8 * 60 * 60
  );
  cookieStore.set(sessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  logAuditEvent({ actorEmail: user.email, action: "auth.login_success_no_mfa" });
  return NextResponse.redirect(new URL(safeNext, request.url));
}
