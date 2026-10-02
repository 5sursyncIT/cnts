import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { ESPACE_PATIENT_OUVERT } from "@/lib/espace-patient";

// Pages accessibles sans session (création du compte et récupération de l'accès).
const PUBLIC_PATIENT_PATHS = new Set([
  "/espace-patient",
  "/espace-patient/connexion",
  "/espace-patient/inscription",
  "/espace-patient/verification",
  "/espace-patient/verification-sms",
  "/espace-patient/mot-de-passe-oublie",
  "/espace-patient/nouveau-mot-de-passe",
]);

function isProtectedPatientPath(pathname: string) {
  return pathname.startsWith("/espace-patient") && !PUBLIC_PATIENT_PATHS.has(pathname);
}

// Anciennes pages de démonstration de l'espace patient → pages réelles.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/espace-patient/messagerie": "/contact",
  "/espace-patient/comptes-rendus": "/espace-patient/documents",
  "/espace-patient/preferences": "/espace-patient/profil",
};

// 'unsafe-eval' n'est nécessaire qu'au serveur de développement de Next (rechargement à chaud).
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https:`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data: https:",
  "frame-src 'self' https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** En-têtes de sécurité posés sur toutes les réponses de l'espace patient, redirections comprises. */
function secure(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // Pages personnelles : jamais en cache partagé.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function redirectTo(request: NextRequest, pathname: string, status: number, params?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  return secure(NextResponse.redirect(url, status));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Espace fermé : toute sous-page renvoie vers la page « en construction ».
  if (!ESPACE_PATIENT_OUVERT && pathname !== "/espace-patient") return redirectTo(request, "/espace-patient", 307);

  const legacy = LEGACY_REDIRECTS[pathname];
  if (legacy) return redirectTo(request, legacy, 308);

  const token = request.cookies.get(sessionCookieName)?.value;
  if (isProtectedPatientPath(pathname)) {
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      const response = redirectTo(request, "/espace-patient/connexion", 307, { next: pathname });
      if (token) response.cookies.delete(sessionCookieName);
      return response;
    }
  }

  const response = NextResponse.next();
  // Jeton backend refusé (401) : la session portail est encore signée mais inutilisable.
  if (pathname === "/espace-patient/connexion" && request.nextUrl.searchParams.get("error") === "expired") {
    response.cookies.delete(sessionCookieName);
  }
  return secure(response);
}

export const config = {
  matcher: ["/espace-patient/:path*"],
};
