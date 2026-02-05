import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { signPreAuth, preAuthCookieName } from "@/lib/auth/preauth";
import { signSession, sessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

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
      return NextResponse.redirect(new URL("/login?error=1", request.url));
    }

    const data = await res.json();
    const { mfa_required, access_token, user } = data;

    const cookieStore = await cookies();
    cookieStore.delete(sessionCookieName);
    cookieStore.delete(preAuthCookieName);

    // MFA Flow
    if (mfa_required) {
      // Not fully verified/implemented for frontend flow with backend challenge yet
      // But for now, let's handle the direct login case majorly
      const preAuthToken = await signPreAuth({ email: email }, 5 * 60);
      cookieStore.set(preAuthCookieName, preAuthToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });

      logAuditEvent({ actorEmail: email, action: "auth.password_ok_mfa_required" });
      return NextResponse.redirect(new URL(`/mfa?next=${encodeURIComponent(safeNext)}`, request.url));
    }

    // Direct Login (No MFA or MFA passed implicitly if disabled)
    // Map Backend User to Session User
    const sessionToken = await signSession(
      {
        userId: user.id,
        email: user.email,
        displayName: user.email.split("@")[0], // Use part of email as display name since backend doesn't have name
        roleIds: [user.role], // Assuming backend role string matches frontend role ID
        mfa: user.mfa_enabled
      },
      8 * 60 * 60
    );

    cookieStore.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    logAuditEvent({ actorEmail: user.email, action: "auth.login_success" });
    return NextResponse.redirect(new URL(safeNext, request.url));

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
}
