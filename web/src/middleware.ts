import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { isCrossSiteWrite } from "@/lib/http/same-origin";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/mfa" ||
    pathname === "/mfa/setup" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF : toute écriture (connexion, MFA, proxy API…) doit venir du Back Office.
  if (isCrossSiteWrite(request.method, request.headers.get("origin"), request.nextUrl.origin)) {
    return NextResponse.json({ detail: "Origine de la requête refusée" }, { status: 403 });
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;
  // Une session sans second facteur validé n'ouvre pas le Back Office.
  if (!session || !session.mfa) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
