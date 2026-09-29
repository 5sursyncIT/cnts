import { NextResponse, type NextRequest } from "next/server";

import { accessCookieName, sessionCookieName, verifySessionToken } from "@/lib/auth/session";

const backendBaseUrl = (process.env.BACKOFFICE_API_BASE_URL ?? `${process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000"}/api`)
  .replace(/\/+$/, "");

// En-têtes hop-by-hop à ne jamais recopier tels quels d'une réponse à l'autre :
// les transmettre corromprait le corps (double encodage / longueur erronée).
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length"
]);

function buildTargetUrl(request: NextRequest, pathParts: string[]) {
  const url = new URL(`${backendBaseUrl}/${pathParts.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url;
}

async function proxy(request: NextRequest, pathParts: string[]) {
  // Le proxy exige une session Back Office valide.
  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken) : null;
  if (!session) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const target = buildTargetUrl(request, pathParts);

  // En-têtes minimaux et nettoyés : on NE transmet PAS les cookies du navigateur
  // au backend ; on injecte le Bearer issu du cookie d'accès httpOnly.
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const accessToken = request.cookies.get(accessCookieName)?.value;
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual"
  });

  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}
