import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sessionCookieName, signSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional().default("/espace-patient/tableau-de-bord"),
});

export async function POST(request: Request) {
  // 1. Rate Limiting
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { isRateLimited } = limiter.check(5, ip); // 5 attempts per minute

  if (isRateLimited) {
    const url = new URL("/espace-patient/connexion", request.url);
    url.searchParams.set("error", "too_many_requests");
    return NextResponse.redirect(url);
  }

  // 2. Input Validation
  const form = await request.formData();
  const rawData = {
    email: form.get("email"),
    password: form.get("password"),
    next: form.get("next"),
  };

  const validation = loginSchema.safeParse(rawData);

  if (!validation.success) {
    const url = new URL("/espace-patient/connexion", request.url);
    url.searchParams.set("error", "invalid_input");
    return NextResponse.redirect(url);
  }

  const { email, password, next } = validation.data;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/espace-patient/tableau-de-bord";

  try {
    // 3. Login to get access token
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 401) {
      return NextResponse.redirect(new URL(`/espace-patient/connexion?error=1&next=${encodeURIComponent(safeNext)}`, request.url));
    }

    if (!res.ok) {
      logger.error({ status: res.status, body: await res.text() }, "Login error");
      return NextResponse.redirect(new URL(`/espace-patient/connexion?error=system&next=${encodeURIComponent(safeNext)}`, request.url));
    }

    const data = await res.json();
    
    if (data.mfa_required) {
       return NextResponse.redirect(new URL(`/espace-patient/connexion?error=mfa_not_supported&next=${encodeURIComponent(safeNext)}`, request.url));
    }

    const accessToken = data.access_token;
    if (!accessToken) {
        throw new Error("No access token returned");
    }

    // 2. Fetch user profile to get details
    const profileRes = await fetch(`${BACKEND_URL}/api/me`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    let userDetails = {
      userId: "unknown",
      email: email,
      displayName: email.split("@")[0]
    };

    if (profileRes.ok) {
      const profile = await profileRes.json();
      userDetails = {
        userId: profile.id,
        email: profile.email || email,
        displayName: `${profile.prenom} ${profile.nom}`.trim()
      };
    }

    // 3. Create and sign portal session
    const sessionToken = await signSession(
      { 
        ...userDetails, 
        accessToken 
      },
      8 * 60 * 60 // 8 hours
    );

    const cookieStore = await cookies();
    cookieStore.set(sessionCookieName, sessionToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60
    });

    return NextResponse.redirect(new URL(safeNext, request.url));
  } catch (error) {
    logger.error({ err: error }, "Login exception");
    return NextResponse.redirect(new URL(`/espace-patient/connexion?error=system&next=${encodeURIComponent(safeNext)}`, request.url));
  }
}
