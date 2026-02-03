import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const value = String(form.get("value") ?? "");
  const allowed = value === "accepted" || value === "declined";
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("cnts_gdpr_consent", value, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 180 * 24 * 60 * 60
  });

  return NextResponse.json({ ok: true });
}

