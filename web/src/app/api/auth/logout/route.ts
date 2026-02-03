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
  return NextResponse.redirect(new URL("/login", request.url));
}

