import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDemoPatientByEmail, verifyPassword } from "@/lib/auth/demo-user";
import { sessionCookieName, signSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/espace-patient/tableau-de-bord");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/espace-patient/tableau-de-bord";

  const user = getDemoPatientByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    return NextResponse.redirect(new URL(`/espace-patient/connexion?error=1&next=${encodeURIComponent(safeNext)}`, request.url));
  }

  const token = await signSession(
    { userId: user.id, email: user.email, displayName: user.displayName },
    8 * 60 * 60
  );

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return NextResponse.redirect(new URL(safeNext, request.url));
}

