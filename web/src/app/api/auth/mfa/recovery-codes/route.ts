import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminPath } from "@/lib/auth/establish-session";
import { recoveryCodesCookieName } from "@/lib/auth/preauth";

/** « J'ai conservé mes codes » : on efface le cookie qui les transportait. */
export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cnts.gouv.sn";
  const form = await request.formData();
  const next = String(form.get("next") ?? "/dashboard");
  (await cookies()).delete({ name: recoveryCodesCookieName, path: "/admin" });
  return NextResponse.redirect(new URL(adminPath(next), appUrl));
}
