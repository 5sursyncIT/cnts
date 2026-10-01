import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { adminPath, asStaffUser, establishMfaSession } from "@/lib/auth/establish-session";
import { preAuthCookieName, verifyPreAuthToken } from "@/lib/auth/preauth";
import { forwardedForHeader } from "@/lib/http/client-ip";

export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  const cookieStore = await cookies();
  const preAuthToken = cookieStore.get(preAuthCookieName)?.value;
  const preAuth = preAuthToken ? await verifyPreAuthToken(preAuthToken) : null;
  if (!preAuth || preAuth.setup) {
    cookieStore.delete(preAuthCookieName);
    return NextResponse.redirect(new URL("/admin/login", appUrl));
  }

  const form = await request.formData();
  const token = String(form.get("token") ?? "").replace(/\s+/g, "");
  const useRecovery = String(form.get("mode") ?? "") === "recovery";
  const next = String(form.get("next") ?? "/dashboard");
  const retry = (code: string) =>
    NextResponse.redirect(new URL(`/admin/mfa?error=${code}&next=${encodeURIComponent(next)}`, appUrl));

  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${backendUrl}/api/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...forwardedForHeader(request.headers) },
      body: JSON.stringify(
        useRecovery
          ? { challenge_token: preAuth.challengeToken, recovery_code: token }
          : { challenge_token: preAuth.challengeToken, token }
      ),
      cache: "no-store"
    });
    if (!response.ok) {
      logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_failed" });
      if (response.status === 429) {
        cookieStore.delete(preAuthCookieName);
        return NextResponse.redirect(new URL("/admin/login?error=locked", appUrl));
      }
      return retry("1");
    }
    const { access_token, user } = await response.json();
    const staff = asStaffUser(user);
    if (typeof access_token !== "string" || !staff) throw new Error("Invalid MFA response");

    await establishMfaSession(staff, access_token);
    logAuditEvent({ actorEmail: staff.email, action: useRecovery ? "auth.mfa_recovery_code_used" : "auth.mfa_success" });
    return NextResponse.redirect(new URL(adminPath(next), appUrl));
  } catch (error) {
    console.error("MFA verification error:", error);
    logAuditEvent({ actorEmail: preAuth.email, action: "auth.mfa_error" });
    return retry("1");
  }
}
