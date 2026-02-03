import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sessionCookieName } from "@/lib/auth/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  return NextResponse.redirect(new URL("/espace-patient/connexion", request.url));
}

