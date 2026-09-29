import "server-only";

import { redirect } from "next/navigation";

import { getCurrentPatient } from "@/lib/auth/current-user";

// Appels au backend FastAPI depuis le serveur Next uniquement : le jeton d'accès
// reste dans la session signée (cookie httpOnly) et n'est jamais exposé au navigateur.
export const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export type BackendResult<T> = { ok: true; data: T } | { ok: false; status: number; detail?: string };

async function detailOf(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : undefined;
  } catch {
    return undefined;
  }
}

/** Appel authentifié au nom du patient connecté. Session absente ou expirée → page de connexion. */
export async function patientFetch<T>(path: string, init: RequestInit = {}): Promise<BackendResult<T>> {
  const patient = await getCurrentPatient();
  if (!patient) redirect("/espace-patient/connexion");

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
        Authorization: `Bearer ${patient.accessToken}`,
      },
    });
  } catch {
    return { ok: false, status: 503 };
  }

  if (res.status === 401) redirect("/espace-patient/connexion?error=expired");
  if (!res.ok) return { ok: false, status: res.status, detail: await detailOf(res) };
  return { ok: true, data: (await res.json()) as T };
}

/** Lecture tolérante : renvoie null si la ressource n'existe pas (404) ou si le service est indisponible. */
export async function patientGet<T>(path: string): Promise<T | null> {
  const r = await patientFetch<T>(path);
  return r.ok ? r.data : null;
}

/** Appel anonyme (connexion, création de compte). */
export async function publicPost<T>(path: string, body: unknown): Promise<BackendResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 503 };
  }
  if (!res.ok) return { ok: false, status: res.status, detail: await detailOf(res) };
  return { ok: true, data: (await res.json()) as T };
}

// --- Types renvoyés par /api/me/* ---

export type Profil = {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string | null;
  groupe_sanguin: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  profession: string | null;
  dernier_don: string | null;
};

export type RendezVous = {
  id: string;
  date_prevue: string;
  type_rdv: string;
  lieu: string | null;
  commentaire: string | null;
  statut: "CONFIRME" | "ANNULE" | "EFFECTUE" | "MANQUE" | string;
};

export type DonPatient = { id: string; date_don: string; type_don: string };

export type Carte = {
  numero_carte: string;
  niveau: string;
  points: number;
  total_dons: number;
  date_premier_don: string | null;
  date_dernier_don: string | null;
  is_active: boolean;
  historique: { type_operation: string; points: number; description: string | null; created_at: string }[];
};

export type DocumentMedical = {
  id: string;
  titre: string;
  type_document: string;
  description: string | null;
  date_document: string;
  fichier_url: string;
};
