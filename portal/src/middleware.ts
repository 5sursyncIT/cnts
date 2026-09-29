import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";

function isProtectedPatientPath(pathname: string) {
  if (!pathname.startsWith("/espace-patient")) return false;
  if (pathname === "/espace-patient") return false;
  if (pathname === "/espace-patient/connexion") return false;
  if (pathname === "/espace-patient/inscription") return false;
  return true;
}

// Anciennes pages de démonstration de l'espace patient → pages réelles.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/espace-patient/messagerie": "/contact",
  "/espace-patient/comptes-rendus": "/espace-patient/documents",
  "/espace-patient/preferences": "/espace-patient/profil",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = LEGACY_REDIRECTS[pathname];
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy;
    url.search = "";
    return NextResponse.redirect(url, 308);
  }
  
  // 1. Security Headers
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' blob: data: https:;
    font-src 'self' data: https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 2. Auth Logic
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isProtectedPatientPath(pathname)) {
    const token = request.cookies.get(sessionCookieName)?.value;
    const session = token ? await verifySessionToken(token) : null;
    
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/espace-patient/connexion";
      url.searchParams.set("next", pathname);
      response = NextResponse.redirect(url);
    }
  }

  // 3. Apply Security Headers to Response
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

export const config = {
  matcher: ["/espace-patient/:path*"]
};

