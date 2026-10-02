import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentPatient } from "@/lib/auth/current-user";

// Appels au backend FastAPI depuis le serveur Next uniquement : le jeton d'accès
// reste dans la session signée (cookie httpOnly, illisible par le JavaScript de la page).
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

/**
 * IP du visiteur. Apache ajoute l'IP réelle EN DERNIER dans X-Forwarded-For ; les entrées
 * précédentes viennent du client et sont falsifiables.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const last = h.get("x-forwarded-for")?.split(",").pop()?.trim();
  return last || h.get("x-real-ip") || "local";
}

/**
 * Transmet l'IP du visiteur au backend, qui fait confiance à X-Forwarded-For venant du réseau
 * docker : sans cela, tous les patients partageraient la limite de débit de l'IP du portail.
 */
export async function forwardedHeaders(): Promise<Record<string, string>> {
  const ip = await clientIp();
  return ip === "local" ? {} : { "X-Forwarded-For": ip };
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
        ...(await forwardedHeaders()),
        Authorization: `Bearer ${patient.accessToken}`,
      },
    });
  } catch {
    return { ok: false, status: 503 };
  }

  if (res.status === 401) redirect("/espace-patient/connexion?error=expired");
  if (!res.ok) return { ok: false, status: res.status, detail: await detailOf(res) };
  if (res.status === 204) return { ok: true, data: undefined as T };
  return { ok: true, data: (await res.json()) as T };
}

/** Lecture tolérante : renvoie null si la ressource n'existe pas (404) ou si le service est indisponible. */
export async function patientGet<T>(path: string): Promise<T | null> {
  const r = await patientFetch<T>(path);
  return r.ok ? r.data : null;
}

/** Révoque côté backend tous les jetons du compte (déconnexion). Échec ignoré : le cookie est supprimé quoi qu'il arrive. */
export async function revokeBackendSession(accessToken: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      cache: "no-store",
      headers: { ...(await forwardedHeaders()), Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // backend injoignable : le jeton expirera de lui-même (8 h)
  }
}

/** Appel anonyme (connexion, création de compte). */
export async function publicPost<T>(path: string, body: unknown): Promise<BackendResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(await forwardedHeaders()) },
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
  lieu_id: string | null;
  commentaire: string | null;
  statut: "CONFIRME" | "ANNULE" | "EFFECTUE" | "MANQUE" | string;
  motif: string | null;
};

export type LieuRdv = {
  id: string;
  nom: string;
  adresse: string | null;
  horaires: Record<string, [string, string][]>;
  duree_creneau_min: number;
  delai_min_heures: number;
  horizon_jours: number;
};

export type Creneau = { debut: string; places: number };

/** Éligibilité calculée par le backend (âge, délai selon le sexe et le type du dernier don). */
export type EligibiliteApi = { eligible: boolean; eligible_le: string | null; raison: string };

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
  /** « /api/me/documents/{id}/fichier » pour un fichier déposé par le centre, sinon vide ou URL externe. */
  fichier_url: string;
  fichier_nom: string | null;
  mime: string | null;
  taille: number | null;
};
