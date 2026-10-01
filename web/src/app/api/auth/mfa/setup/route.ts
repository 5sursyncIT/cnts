import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { asStaffUser, establishMfaSession } from "@/lib/auth/establish-session";
import { preAuthCookieName, recoveryCodesCookieName, signRecoveryCodes, verifyPreAuthToken } from "@/lib/auth/preauth";
import { forwardedForHeader } from "@/lib/http/client-ip";

/** Enrôlement MFA, étape 2 : confirmation du premier code puis ouverture de session. */
export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  const cookieStore = await cookies();
  const preAuthToken = cookieStore.get(preAuthCookieName)?.value;
  const preAuth = preAuthToken ? await verifyPreAuthToken(preAuthToken) : null;
  if (!preAuth?.setup) {
    cookieStore.delete(preAuthCookieName);
    return NextResponse.redirect(new URL("/admin/login", appUrl));
  }

  const form = await request.formData();
  const token = String(form.get("token") ?? "").replace(/\s+/g, "");
  const next = String(form.get("next") ?? "/dashboard");

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/api/auth/mfa/setup/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardedForHeader(request.headers) },
      body: JSON.stringify({ challenge_token: preAuth.challengeToken, token }),
      cache: "no-store"
    });
    if (!response.ok) {
      logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_setup_failed" });
      if (response.status === 429) {
        cookieStore.delete(preAuthCookieName);
        return NextResponse.redirect(new URL("/admin/login?error=locked", appUrl));
      }
      return NextResponse.redirect(new URL(`/admin/mfa/setup?error=1&next=${encodeURIComponent(next)}`, appUrl));
    }
    const { access_token, user, recovery_codes } = await response.json();
    const staff = asStaffUser(user);
    if (typeof access_token !== "string" || !staff || !Array.isArray(recovery_codes)) {
      throw new Error("Invalid MFA setup response");
    }

    await establishMfaSession(staff, access_token);
    cookieStore.set(recoveryCodesCookieName, await signRecoveryCodes(recovery_codes, 10 * 60), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 10 * 60,
    });
    logAuditEvent({ actorEmail: staff.email, action: "auth.mfa_enrolled" });
    return NextResponse.redirect(new URL(`/admin/mfa/codes?next=${encodeURIComponent(next)}`, appUrl));
  } catch (error) {
    console.error("MFA setup error:", error);
    logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_setup_error" });
    return NextResponse.redirect(new URL(`/admin/mfa/setup?error=1&next=${encodeURIComponent(next)}`, appUrl));
  }
}
