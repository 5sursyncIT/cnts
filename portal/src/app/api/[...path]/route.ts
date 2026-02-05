import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function proxy(request: NextRequest, path: string) {
  try {
    logger.info({ method: request.method, path }, "[Proxy] Request");
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(sessionCookieName)?.value;
    logger.debug({ present: !!sessionToken }, "[Proxy] Session token present");

    let accessToken = null;
    if (sessionToken) {
        const session = await verifySessionToken(sessionToken);
        logger.debug({ valid: !!session }, "[Proxy] Session valid");
        if (session) {
            accessToken = session.accessToken;
            logger.debug({ present: !!accessToken }, "[Proxy] Access token present");
        }
    }

    const headers = new Headers(request.headers);
    // Ensure we pass the token if available
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    // Remove host to avoid conflicts
    headers.delete("host");
    headers.delete("cookie");
    headers.delete("connection");
    headers.delete("content-length"); // Let fetch calculate it

    // Construct backend URL
    const url = new URL(path, BACKEND_URL);
    url.search = request.nextUrl.search;
    logger.debug({ url: url.toString() }, "[Proxy] Backend URL");

    // Read body
    let body: any = undefined;
    if (methodHasBody(request.method)) {
        try {
            // Read as text first to be safe and debuggable
            body = await request.text();
            logger.debug({ body }, "[Proxy] Request body");
        } catch (e) {
            logger.error({ err: e }, "[Proxy] Error reading body");
        }
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    logger.info({ status: response.status }, "[Proxy] Backend response status");

    // Read response body to forward it safely
    const responseBody = await response.arrayBuffer();

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    logger.error({ err: error }, "[Proxy] Error");
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}

function methodHasBody(method: string) {
  return ["POST", "PUT", "PATCH"].includes(method.toUpperCase());
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = "/api/" + resolvedParams.path.join("/");
  return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = "/api/" + resolvedParams.path.join("/");
  return proxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = "/api/" + resolvedParams.path.join("/");
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = "/api/" + resolvedParams.path.join("/");
  return proxy(request, path);
}
