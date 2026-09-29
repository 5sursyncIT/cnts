import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { signPreAuth, preAuthCookieName } from "@/lib/auth/preauth";
import { accessCookieName, signSession, sessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";

  try {
    // Call Backend API
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      logAuditEvent({ actorEmail: email, action: "auth.login_failed" });
      return NextResponse.redirect(new URL("/admin/login?error=1", APP_URL));
    }

    const data = await res.json();
    const { mfa_required, access_token, user } = data;
    if (!mfa_required && (typeof access_token !== "string" || !user?.id || !user?.email || !user?.role || user.role.toUpperCase() === "PATIENT")) {
      return NextResponse.redirect(new URL("/admin/login?error=1", APP_URL));
    }

    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieName);
    cookieStore.delete(preAuthCookieName);
    cookieStore.delete(accessCookieName);

    // MFA Flow
    if (mfa_required) {
      if (typeof data.challenge_token !== "string") {
        throw new Error("Missing MFA challenge from backend");
      }
      const preAuthToken = await signPreAuth({ email: email, challengeToken: data.challenge_token }, 5 * 60);
      cookieStore.set(preAuthCookieName, preAuthToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });

      logAuditEvent({ actorEmail: email, action: "auth.password_ok_mfa_required" });
      return NextResponse.redirect(new URL(`/admin/mfa?next=${encodeURIComponent(safeNext)}`, APP_URL));
    }

    // Direct login when the backend does not require MFA.
    // Map Backend User to Session User
    const sessionToken = await signSession(
      {
        userId: user.id,
        email: user.email,
        displayName: user.email.split("@")[0], // Use part of email as display name since backend doesn't have name
        roleIds: [user.role], // Assuming backend role string matches frontend role ID
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

    // Jeton d'accès backend conservé dans un cookie httpOnly : le navigateur
    // l'enverra automatiquement aux appels /api/* (routés par Apache vers le
    // backend), qui les authentifiera. TTL aligné sur celui du backend (8 h).
    cookieStore.set(accessCookieName, access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60
    });

    logAuditEvent({ actorEmail: user.email, action: "auth.login_success" });
    const finalNext = safeNext.startsWith("/admin") ? safeNext : `/admin${safeNext.startsWith("/") ? "" : "/"}${safeNext}`;
    return NextResponse.redirect(new URL(finalNext, APP_URL));

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.redirect(new URL("/admin/login?error=1", APP_URL));
  }
}
