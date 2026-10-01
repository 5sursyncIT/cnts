import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { signPreAuth, preAuthCookieName } from "@/lib/auth/preauth";
import { accessCookieName, sessionCookieName } from "@/lib/auth/session";
import { forwardedForHeader } from "@/lib/http/client-ip";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  const loginError = (code: string) => NextResponse.redirect(new URL(`/admin/login?error=${code}`, APP_URL));

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardedForHeader(request.headers),
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      logAuditEvent({ actorEmail: email, action: "auth.login_failed" });
      return loginError(res.status === 429 ? "locked" : "1");
    }

    const data = await res.json();

    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieName);
    cookieStore.delete(preAuthCookieName);
    cookieStore.delete(accessCookieName);

    // Le Back Office exige un second facteur : le backend ne délivre jamais de
    // session directe au personnel. Une réponse sans MFA (compte patient) est refusée.
    if (!data.mfa_required || typeof data.challenge_token !== "string") {
      logAuditEvent({ actorEmail: email, action: "auth.login_refused_no_mfa" });
      return loginError("1");
    }

    const setup = data.mfa_setup_required === true;
    let enrollment: { setupSecret: string; otpauthUri: string } | null = null;
    if (setup) {
      // Enrôlement : le secret est généré une seule fois et conservé dans le
      // pré-auth signé, pour réafficher le même QR code en cas de code erroné.
      const setupRes = await fetch(`${backendUrl}/api/auth/mfa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...forwardedForHeader(request.headers) },
        body: JSON.stringify({ challenge_token: data.challenge_token }),
        cache: "no-store",
      });
      if (!setupRes.ok) return loginError(setupRes.status === 429 ? "locked" : "1");
      const body = await setupRes.json();
      enrollment = { setupSecret: body.secret, otpauthUri: body.otpauth_uri };
    }
    const preAuthToken = await signPreAuth(
      { email, challengeToken: data.challenge_token, setup, ...(enrollment ?? {}) },
      5 * 60
    );
    cookieStore.set(preAuthCookieName, preAuthToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 60,
    });

    logAuditEvent({ actorEmail: email, action: setup ? "auth.password_ok_mfa_setup_required" : "auth.password_ok_mfa_required" });
    const target = setup ? "/admin/mfa/setup" : "/admin/mfa";
    return NextResponse.redirect(new URL(`${target}?next=${encodeURIComponent(safeNext)}`, APP_URL));
  } catch (error) {
    console.error("Login Error:", error);
    return loginError("1");
  }
}
