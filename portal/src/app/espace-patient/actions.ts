"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { sessionCookieName, signSession } from "@/lib/auth/session";
import { BACKEND_URL, patientFetch, patientGet, publicPost, type DonPatient, type Profil, type RendezVous } from "@/lib/backend";
import { logger } from "@/lib/logger";
import { creneauValide, dernierDonConnu, eligibilite, LIEUX_RDV } from "@/lib/donneur";
import { rateLimit } from "@/lib/rate-limit";

// Server Actions de l'espace patient. Elles sont postées sur l'URL de la page
// (/espace-patient/...), donc jamais interceptées par le proxy Apache « /api ».

// `ts` change à chaque réponse : sert de clé pour remonter les champs avec les valeurs saisies
// (React 19 réinitialise le formulaire après chaque action).
export type FormState = { error?: string; ok?: boolean; fields?: Record<string, string>; ts?: number };

const SESSION_TTL = 8 * 60 * 60;
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function safeNext(next: unknown) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/espace-patient") && !n.startsWith("//") ? n : "/espace-patient/tableau-de-bord";
}

// --- Connexion / déconnexion -------------------------------------------------

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  if (limiter.check(5, `login:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de tentatives. Réessayez dans une minute.", fields: { email } };
  }
  const parsed = loginSchema.safeParse({ email, password: form.get("password") });
  if (!parsed.success) return { error: "Saisissez votre email et votre mot de passe.", fields: { email } };

  const login = await publicPost<{ access_token?: string; mfa_required?: boolean }>("/api/auth/login", parsed.data);
  if (!login.ok) {
    if (login.status === 401 || login.status === 422) return { error: "Email ou mot de passe incorrect.", fields: { email } };
    logger.error({ status: login.status }, "patient login: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard.", fields: { email } };
  }
  if (login.data.mfa_required || !login.data.access_token) {
    return { error: "Ce compte utilise la double authentification : connectez-vous depuis l'espace professionnel.", fields: { email } };
  }
  const accessToken = login.data.access_token;

  // L'espace patient est réservé aux comptes liés à un dossier donneur.
  const me = await fetch(`${BACKEND_URL}/api/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  }).catch(() => null);
  if (!me || me.status === 404) {
    return { error: "Ce compte n'est lié à aucun dossier donneur. Contactez le CNTS.", fields: { email } };
  }
  if (!me.ok) return { error: "Service momentanément indisponible. Réessayez plus tard.", fields: { email } };
  const profil = (await me.json()) as Profil;

  const token = await signSession(
    {
      userId: profil.id,
      email: parsed.data.email.toLowerCase(),
      displayName: `${profil.prenom} ${profil.nom}`.trim(),
      accessToken,
    },
    SESSION_TTL,
  );
  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  (await cookies()).delete(sessionCookieName);
  redirect("/espace-patient/connexion?logout=1");
}

// --- Création de compte (liaison à un dossier donneur existant) ---------------

const registerSchema = z
  .object({
    cni: z.string().trim().min(5, "Numéro de CNI incomplet."),
    date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide."),
    email: z.string().trim().email("Adresse email invalide."),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Les deux mots de passe ne correspondent pas.", path: ["confirm"] });

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(["cni", "date_naissance", "email", "password", "confirm"].map((k) => [k, String(form.get(k) ?? "")]));
  const fields = { cni: raw.cni, date_naissance: raw.date_naissance, email: raw.email };
  // Limite stricte : la vérification CNI + date de naissance ne doit pas pouvoir être devinée.
  if (limiter.check(5, `register:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de tentatives. Réessayez dans une minute.", fields };
  }
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet.", fields };

  const { confirm: _confirm, ...payload } = parsed.data;
  const r = await publicPost("/api/auth/register-patient", payload);
  if (!r.ok) {
    // 422 sans message texte = validation Pydantic (en pratique : email refusé, ex. domaine réservé).
    if (r.status === 422 && !r.detail) return { error: "Adresse email invalide.", fields };
    if (r.status === 400 || r.status === 409 || r.status === 422) return { error: r.detail ?? "Création du compte impossible.", fields };
    logger.error({ status: r.status }, "patient register: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard.", fields };
  }
  redirect("/espace-patient/connexion?created=1");
}

// --- Consentement RGPD (accès aux documents de santé) -------------------------

export async function consentAction(value: "accepted" | "declined") {
  if (value !== "accepted" && value !== "declined") return;
  (await cookies()).set("cnts_gdpr_consent", value, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 180 * 24 * 60 * 60,
  });
  revalidatePath("/espace-patient", "layout");
}

// --- Rendez-vous ----------------------------------------------------------------

const rdvSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date."),
  heure: z.string().regex(/^\d{2}:\d{2}$/, "Choisissez un créneau."),
  lieu: z.enum(LIEUX_RDV, { message: "Choisissez un lieu." }),
  commentaire: z.string().max(500).optional(),
});

export async function createAppointmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = {
    date: String(form.get("date") ?? ""),
    heure: String(form.get("heure") ?? ""),
    lieu: String(form.get("lieu") ?? ""),
    commentaire: String(form.get("commentaire") ?? "").trim() || undefined,
  };
  const fields = { date: raw.date, heure: raw.heure, lieu: raw.lieu, commentaire: raw.commentaire ?? "" };
  const parsed = rdvSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields, ts: Date.now() };
  const [profil, dons] = await Promise.all([patientGet<Profil>("/api/me"), patientGet<DonPatient[]>("/api/me/dons")]);
  const elig = eligibilite(dernierDonConnu(profil?.dernier_don, dons ?? []), profil?.sexe);
  const eligibleLe = elig.etat === "attente" ? elig.le : null;
  if (eligibleLe && parsed.data.date < `${eligibleLe.getFullYear()}-${String(eligibleLe.getMonth() + 1).padStart(2, "0")}-${String(eligibleLe.getDate()).padStart(2, "0")}`) {
    return {
      error: `D'après votre dernier don, vous pourrez donner à partir du ${eligibleLe.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`,
      fields,
      ts: Date.now(),
    };
  }
  if (!creneauValide(parsed.data.date, parsed.data.heure, new Date(), eligibleLe)) {
    return { error: "Ce créneau n'est pas disponible (centre fermé ou date hors délai).", fields, ts: Date.now() };
  }

  // Heure de Dakar (UTC+0, sans heure d'été).
  const date_prevue = `${parsed.data.date}T${parsed.data.heure}:00+00:00`;
  const r = await patientFetch<RendezVous>("/api/me/appointments", {
    method: "POST",
    body: JSON.stringify({ date_prevue, type_rdv: "DON_SANG", lieu: parsed.data.lieu, commentaire: parsed.data.commentaire }),
  });
  if (!r.ok) {
    return {
      error: r.status === 422 ? (r.detail ?? "Date invalide.") : "Impossible d'enregistrer le rendez-vous. Réessayez.",
      fields,
      ts: Date.now(),
    };
  }
  revalidatePath("/espace-patient", "layout");
  return { ok: true, ts: Date.now() };
}

export async function cancelAppointmentAction(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await patientFetch(`/api/me/appointments/${id}`, { method: "PUT" });
  revalidatePath("/espace-patient", "layout");
}

// --- Profil (coordonnées modifiables par le donneur) -------------------------------

const profilSchema = z.object({
  telephone: z.string().trim().max(32).optional(),
  email: z.union([z.literal(""), z.string().trim().email("Adresse email invalide.")]).optional(),
  adresse: z.string().trim().max(255).optional(),
  profession: z.string().trim().max(120).optional(),
});

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(["telephone", "email", "adresse", "profession"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = profilSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields: raw };
  // Champ vidé → null côté backend (et non chaîne vide, invalide pour l'email).
  const payload = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v ? v : null]));
  const r = await patientFetch<Profil>("/api/me", { method: "PUT", body: JSON.stringify(payload) });
  if (!r.ok) return { error: r.detail && r.status === 422 ? "Coordonnées invalides." : "Enregistrement impossible. Réessayez.", fields: raw };
  revalidatePath("/espace-patient", "layout");
  return { ok: true };
}
