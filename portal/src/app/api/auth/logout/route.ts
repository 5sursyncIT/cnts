import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  // Use the public APP_URL for redirect to avoid localhost issues
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.5sursync.com";
  return NextResponse.redirect(new URL(`${APP_URL}/espace-patient/connexion`));
}

