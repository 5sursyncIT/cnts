import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuditEvent } from "@/lib/audit/log";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { preAuthCookieName } from "@/lib/auth/preauth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;

  cookieStore.delete(sessionCookieName);
  cookieStore.delete(preAuthCookieName);

  logAuditEvent({ actorEmail: session?.email, action: "auth.logout" });
  // Use the public APP_URL for redirect to avoid localhost issues
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.5sursync.com";
  // The web app is mounted at /admin via Nginx, so we redirect to /admin/login
  return NextResponse.redirect(new URL(`${APP_URL}/admin/login`));
}

