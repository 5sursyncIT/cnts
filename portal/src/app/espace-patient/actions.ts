"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentPatient } from "@/lib/auth/current-user";
import { sessionCookieName, signSession } from "@/lib/auth/session";
import { ESPACE_PATIENT_FERME_MSG, ESPACE_PATIENT_OUVERT } from "@/lib/espace-patient";
import {
  BACKEND_URL,
  clientIp,
  forwardedHeaders,
  patientFetch,
  publicPost,
  revokeBackendSession,
  type Creneau,
  type Profil,
  type RendezVous,
} from "@/lib/backend";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";
import { getSmsChallenge, SMS_CHALLENGE_COOKIE, type SmsChallenge } from "@/lib/sms-challenge";

// Server Actions de l'espace patient. Elles sont postées sur l'URL de la page
// (/espace-patient/...), donc jamais interceptées par le proxy Apache « /api ».

// `ts` change à chaque réponse : sert de clé pour remonter les champs avec les valeurs saisies
// (React 19 réinitialise le formulaire après chaque action).
export type FormState = {
  error?: string;
  ok?: boolean;
  fields?: Record<string, string>;
  ts?: number;
  // Connexion refusée faute d'email confirmé : le formulaire propose de renvoyer le lien.
  unverified?: boolean;
};

const SESSION_TTL = 8 * 60 * 60;
const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

// --- Connexion / déconnexion -------------------------------------------------

const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const email = String(form.get("email") ?? "");
  if (limiter.check(5, `login:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de tentatives. Réessayez dans une minute.", fields: { email } };
  }
  const parsed = loginSchema.safeParse({ email, password: form.get("password") });
  if (!parsed.success) return { error: "Saisissez votre email et votre mot de passe.", fields: { email } };

  const login = await publicPost<{ access_token?: string; mfa_required?: boolean }>("/api/auth/login", parsed.data);
  if (!login.ok && login.status === 403 && login.detail === "email_not_verified") {
    return {
      error: "Votre adresse email n'est pas encore confirmée. Ouvrez le lien reçu par email lors de la création du compte.",
      fields: { email },
      unverified: true,
    };
  }
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
    headers: { ...(await forwardedHeaders()), Authorization: `Bearer ${accessToken}` },
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
  const patient = await getCurrentPatient();
  if (patient) await revokeBackendSession(patient.accessToken);
  (await cookies()).delete(sessionCookieName);
  redirect("/espace-patient/connexion?logout=1");
}

// --- Création de compte (liaison à un dossier donneur existant) ---------------

const motDePasse = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128, "Le mot de passe ne doit pas dépasser 128 caractères.");
const CONFIRMATION_DIFFERENTE = "Les deux mots de passe ne correspondent pas.";

const registerSchema = z
  .object({
    cni: z.string().trim().min(5, "Numéro de CNI incomplet."),
    date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide."),
    email: z.string().trim().email("Adresse email invalide."),
    password: motDePasse,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: CONFIRMATION_DIFFERENTE, path: ["confirm"] });

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const raw = Object.fromEntries(["cni", "date_naissance", "email", "password", "confirm"].map((k) => [k, String(form.get(k) ?? "")]));
  const fields = { cni: raw.cni, date_naissance: raw.date_naissance, email: raw.email };
  // Limite stricte : la vérification CNI + date de naissance ne doit pas pouvoir être devinée.
  if (limiter.check(5, `register:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de tentatives. Réessayez dans une minute.", fields };
  }
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet.", fields };

  const { confirm: _confirm, ...payload } = parsed.data;
  const r = await publicPost<RegisterResult>("/api/auth/register-patient", payload);
  if (!r.ok) {
    // 422 sans message texte = validation Pydantic (en pratique : email refusé, ex. domaine réservé).
    if (r.status === 422 && !r.detail) return { error: "Adresse email invalide.", fields };
    if (r.status === 400 || r.status === 409 || r.status === 422) return { error: r.detail ?? "Création du compte impossible.", fields };
    logger.error({ status: r.status }, "patient register: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard.", fields };
  }
  if (r.data.verification === "sms" && r.data.challenge_token) {
    await setSmsChallenge({ c: r.data.challenge_token, t: r.data.telephone ?? "", e: r.data.sms_sent === false ? 1 : 0 });
    redirect("/espace-patient/verification-sms");
  }
  redirect("/espace-patient/connexion?verify=1");
}

// --- Vérification par SMS (dossier sans email ou avec une autre adresse) ------------

type RegisterResult = { verification: "email" | "sms"; challenge_token?: string; telephone?: string; sms_sent?: boolean };

/** Étape SMS en cours : jeton du backend + numéro masqué, dans un cookie httpOnly de courte durée. */
async function setSmsChallenge(value: SmsChallenge) {
  (await cookies()).set(SMS_CHALLENGE_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/espace-patient",
    maxAge: 30 * 60,
  });
}

export async function verifySmsAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const challenge = await getSmsChallenge();
  if (!challenge) return { error: "La vérification a expiré. Recommencez la création du compte." };
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Le code comporte 6 chiffres.", ts: Date.now() };

  const r = await publicPost("/api/auth/verify-phone", { challenge_token: challenge.c, code });
  if (!r.ok) {
    if (r.status === 400 || r.status === 422) return { error: r.detail ?? "Code incorrect.", ts: Date.now() };
    logger.error({ status: r.status }, "patient sms verification: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard.", ts: Date.now() };
  }
  (await cookies()).delete({ name: SMS_CHALLENGE_COOKIE, path: "/espace-patient" });
  redirect("/espace-patient/connexion?verify=1");
}

export async function resendSmsAction(_prev: FormState, _form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const challenge = await getSmsChallenge();
  if (!challenge) return { error: "La vérification a expiré. Recommencez la création du compte." };
  const r = await publicPost<{ telephone: string }>("/api/auth/resend-sms", { challenge_token: challenge.c });
  if (!r.ok) {
    if ([400, 429, 503].includes(r.status)) return { error: r.detail ?? "Envoi impossible pour le moment." };
    logger.error({ status: r.status }, "patient sms resend: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard." };
  }
  await setSmsChallenge({ ...challenge, t: r.data.telephone, e: 0 });
  return { ok: true, ts: Date.now() };
}

// --- Confirmation de l'email et mot de passe oublié ---------------------------------

const emailSchema = z.string().trim().email("Adresse email invalide.");

/** Demande anonyme par email (renvoi du lien de confirmation, mot de passe oublié). */
async function demandeParEmail(form: FormData, cle: string, path: string): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const email = String(form.get("email") ?? "");
  if (limiter.check(3, `${cle}:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de demandes. Réessayez dans une minute.", fields: { email } };
  }
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields: { email } };
  const r = await publicPost(path, { email: parsed.data });
  if (!r.ok && r.status !== 422) {
    logger.error({ status: r.status, path }, "patient email request: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard.", fields: { email } };
  }
  return { ok: true };
}

export async function resendVerificationAction(_prev: FormState, form: FormData): Promise<FormState> {
  return demandeParEmail(form, "resend", "/api/auth/resend-verification");
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  return demandeParEmail(form, "forgot", "/api/auth/password-reset/request");
}

const resetSchema = z
  .object({ token: z.string().min(1).max(2048), password: motDePasse, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: CONFIRMATION_DIFFERENTE, path: ["confirm"] });

export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  if (limiter.check(5, `reset:${await clientIp()}`).isRateLimited) {
    return { error: "Trop de tentatives. Réessayez dans une minute." };
  }
  const parsed = resetSchema.safeParse({
    token: String(form.get("token") ?? ""),
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };

  const r = await publicPost("/api/auth/password-reset/confirm", { token: parsed.data.token, password: parsed.data.password });
  if (!r.ok) {
    if (r.status === 400 || r.status === 422) return { error: r.detail ?? "Mot de passe refusé." };
    logger.error({ status: r.status }, "patient password reset: backend error");
    return { error: "Service momentanément indisponible. Réessayez plus tard." };
  }
  redirect("/espace-patient/connexion?reset=1");
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
  lieu_id: z.string().uuid("Choisissez un lieu."),
  debut: z.string().datetime({ offset: true, message: "Choisissez un créneau." }),
  commentaire: z.string().max(500).optional(),
});

export async function createAppointmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const raw = {
    lieu_id: String(form.get("lieu_id") ?? ""),
    jour: String(form.get("jour") ?? ""),
    debut: String(form.get("debut") ?? ""),
    commentaire: String(form.get("commentaire") ?? "").trim() || undefined,
  };
  const fields = { lieu_id: raw.lieu_id, jour: raw.jour, debut: raw.debut, commentaire: raw.commentaire ?? "" };
  const parsed = rdvSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields, ts: Date.now() };

  // Le backend contrôle tout : créneau ouvert, places libres, éligibilité à cette date, RDV déjà pris.
  const r = await patientFetch<RendezVous>("/api/me/appointments", {
    method: "POST",
    body: JSON.stringify({ lieu_id: parsed.data.lieu_id, date_prevue: parsed.data.debut, type_rdv: "DON_SANG", commentaire: parsed.data.commentaire }),
  });
  if (!r.ok) {
    return {
      error: [404, 409, 422].includes(r.status) ? (r.detail ?? "Ce créneau n'est pas disponible.") : "Impossible d'enregistrer le rendez-vous. Réessayez.",
      fields,
      ts: Date.now(),
    };
  }
  revalidatePath("/espace-patient", "layout");
  // Le formulaire laisse la place au RDV pris : la confirmation est affichée par la page.
  redirect("/espace-patient/rendez-vous?ok=1");
}

/** Créneaux libres d'un lieu pour un jour (appelée par le formulaire quand le lieu ou la date change). */
export async function creneauxAction(lieuId: string, jour: string): Promise<{ creneaux: Creneau[] } | { error: string }> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  if (!z.string().uuid().safeParse(lieuId).success || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) return { creneaux: [] };
  const r = await patientFetch<Creneau[]>(`/api/me/rdv/creneaux?lieu_id=${lieuId}&jour=${jour}`);
  return r.ok ? { creneaux: r.data } : { error: "Les créneaux ne peuvent pas être chargés. Réessayez." };
}

export async function cancelAppointmentAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const id = String(form.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return { error: "Rendez-vous introuvable." };
  const r = await patientFetch(`/api/me/appointments/${id}`, { method: "PUT" });
  if (!r.ok) return { error: r.status === 409 || r.status === 404 ? (r.detail ?? "Ce rendez-vous ne peut plus être annulé.") : "Annulation impossible. Réessayez." };
  revalidatePath("/espace-patient", "layout");
  return { ok: true };
}

// --- Profil (coordonnées modifiables par le donneur) -------------------------------

const profilSchema = z.object({
  telephone: z.string().trim().max(32).optional(),
  email: z.union([z.literal(""), z.string().trim().email("Adresse email invalide.")]).optional(),
  adresse: z.string().trim().max(255).optional(),
  profession: z.string().trim().max(120).optional(),
});

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const raw = Object.fromEntries(["telephone", "email", "adresse", "profession"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = profilSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, fields: raw };
  // Champ vidé → null côté backend (et non chaîne vide, invalide pour l'email).
  const payload = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v ? v : null]));
  const r = await patientFetch<Profil>("/api/me", { method: "PUT", body: JSON.stringify(payload) });
  if (!r.ok) return { error: r.status === 422 ? "Coordonnées invalides." : "Enregistrement impossible. Réessayez.", fields: raw };
  revalidatePath("/espace-patient", "layout");
  return { ok: true };
}

// --- Changement de mot de passe -------------------------------------------------------

const changePasswordSchema = z
  .object({ current: z.string().min(1, "Saisissez votre mot de passe actuel."), password: motDePasse, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: CONFIRMATION_DIFFERENTE, path: ["confirm"] });

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!ESPACE_PATIENT_OUVERT) return { error: ESPACE_PATIENT_FERME_MSG };
  const parsed = changePasswordSchema.safeParse({
    current: String(form.get("current") ?? ""),
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet.", ts: Date.now() };

  const r = await patientFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password: parsed.data.current, new_password: parsed.data.password }),
  });
  if (!r.ok) {
    const error =
      r.status === 400 || r.status === 422
        ? (r.detail ?? "Mot de passe refusé.")
        : r.status === 429
          ? "Trop d'essais : votre compte est verrouillé pendant 15 minutes."
          : "Modification impossible. Réessayez.";
    return { error, ts: Date.now() };
  }
  // Le backend a fermé toutes les sessions : on se reconnecte avec le nouveau mot de passe.
  (await cookies()).delete(sessionCookieName);
  redirect("/espace-patient/connexion?password=1");
}
