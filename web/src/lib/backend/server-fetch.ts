import { cookies, headers } from "next/headers";

import { accessCookieName } from "@/lib/auth/session";
import { forwardedForHeader } from "@/lib/http/client-ip";

const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";

export type BackendRead<T> = { ok: true; data: T } | { ok: false; status: number };

/**
 * Lecture backend depuis un composant serveur, au nom de l'utilisateur connecté
 * (jeton d'accès httpOnly). Ne lève jamais : l'appelant affiche un état d'erreur.
 */
export async function backendGet<T>(path: string): Promise<BackendRead<T>> {
  const token = (await cookies()).get(accessCookieName)?.value;
  if (!token) return { ok: false, status: 401 };
  try {
    const res = await fetch(`${backendUrl}/api${path}`, {
      headers: { Authorization: `Bearer ${token}`, ...forwardedForHeader(await headers()) },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 503 };
  }
}
