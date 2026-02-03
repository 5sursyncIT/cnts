import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";

function isProtectedPatientPath(pathname: string) {
  if (!pathname.startsWith("/espace-patient")) return false;
  if (pathname === "/espace-patient") return false;
  if (pathname === "/espace-patient/connexion") return false;
  if (pathname === "/espace-patient/inscription") return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPatientPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/espace-patient/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/espace-patient/:path*"]
};

