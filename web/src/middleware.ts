import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/mfa" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Force bypass MFA check in middleware if disabled globally
  const disableMfa = process.env.BACKOFFICE_DISABLE_MFA === "1" || true; // Force true for now as requested
  if (!disableMfa && !session.mfa && pathname !== "/mfa") {
    const url = request.nextUrl.clone();
    url.pathname = "/mfa";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

