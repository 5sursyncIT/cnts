"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  cancelAppointmentAction,
  changePasswordAction,
  createAppointmentAction,
  creneauxAction,
  forgotPasswordAction,
  loginAction,
  registerAction,
  resendSmsAction,
  resendVerificationAction,
  resetPasswordAction,
  updateProfileAction,
  verifySmsAction,
  type FormState,
} from "@/app/espace-patient/actions";
import { Icon } from "@/components/cnts/icon";
import type { Creneau, LieuRdv } from "@/lib/backend";
import { bornesRdv } from "@/lib/donneur";

const INITIAL: FormState = {};

export function Alert({ tone, children }: { tone: "err" | "ok" | "info" | "warn"; children: React.ReactNode }) {
  const icon = { err: "alert", ok: "check", info: "info", warn: "alert" }[tone];
  return (
    <div className={`cn-alert ${tone}`} role={tone === "err" ? "alert" : "status"}>
      <Icon name={icon} size={18} style={{ marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}

function Submit({ children, icon, full }: { children: React.ReactNode; icon?: string; full?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cn-btn primary md" style={{ width: full ? "100%" : undefined }}>
      {icon && <Icon name={icon} size={18} />}
      {pending ? "Patientez…" : children}
    </button>
  );
}

function Field({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = input.id ?? input.name;
  const hintId = hint ? `${id}-aide` : undefined;
  return (
    <div>
      <label htmlFor={id} className="cn-label">
        {label}
      </label>
      <input id={id} className="cn-input" aria-describedby={hintId} {...input} />
      {hint && (
        <div id={hintId} className="cn-hint">
          {hint}
        </div>
      )}
    </div>
  );
}

// --- Connexion ---------------------------------------------------------------

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, INITIAL);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <form action={action} style={{ display: "grid", gap: 16 }} noValidate>
        {state.error && <Alert tone="err">{state.error}</Alert>}
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="username" required defaultValue={state.fields?.email} />
        <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
        <Submit full>
          Se connecter
        </Submit>
      </form>
      {state.unverified && <ResendVerificationForm email={state.fields?.email ?? ""} />}
    </div>
  );
}

/** Renvoi du lien de confirmation (email pré-rempli et masqué quand il est connu). */
export function ResendVerificationForm({ email }: { email?: string }) {
  const [state, action] = useActionState(resendVerificationAction, INITIAL);
  if (state.ok) return <Alert tone="info">Si votre compte attend une confirmation, un nouveau lien vient de vous être envoyé.</Alert>;
  return (
    <form action={action} style={{ display: "grid", gap: 12 }} noValidate>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} />
      )}
      <Submit icon="mail" full>
        Renvoyer l&apos;email de confirmation
      </Submit>
    </form>
  );
}

// --- Code SMS (inscription) ------------------------------------------------------------

export function SmsCodeForm() {
  const [state, action] = useActionState(verifySmsAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      <Field
        key={state.ts ?? 0}
        label="Code reçu par SMS"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        hint="6 chiffres, valable 10 minutes."
        style={{ fontSize: 22, letterSpacing: ".3em", fontVariantNumeric: "tabular-nums" }}
      />
      <Submit icon="check" full>
        Vérifier le code
      </Submit>
    </form>
  );
}

export function ResendSmsForm() {
  const [state, action] = useActionState(resendSmsAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 10 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {state.ok && <Alert tone="info">Un nouveau code vient d&apos;être envoyé.</Alert>}
      <button type="submit" className="cn-btn ghost md" style={{ justifySelf: "start" }}>
        Renvoyer un code
      </button>
    </form>
  );
}

// --- Mot de passe oublié / nouveau mot de passe ------------------------------------

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, INITIAL);
  if (state.ok) {
    return (
      <Alert tone="ok">
        Si un compte correspond à cette adresse, un email contenant un lien de réinitialisation vient de lui être envoyé. Le lien est valable
        1 heure. Pensez à vérifier vos courriers indésirables.
      </Alert>
    );
  }
  return (
    <form action={action} style={{ display: "grid", gap: 16 }} noValidate>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      <Field label="Email du compte" name="email" type="email" autoComplete="email" required defaultValue={state.fields?.email} />
      <Submit icon="mail" full>
        Recevoir le lien
      </Submit>
    </form>
  );
}

function NewPasswordFields() {
  return (
    <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} hint="8 caractères minimum" />
      <Field label="Confirmation" name="confirm" type="password" autoComplete="new-password" required />
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <NewPasswordFields />
      <Submit icon="check" full>
        Enregistrer le mot de passe
      </Submit>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {/* Remonté à chaque réponse pour vider les champs. */}
      <div key={state.ts ?? 0} style={{ display: "grid", gap: 16 }}>
        <Field label="Mot de passe actuel" name="current" type="password" autoComplete="current-password" required />
        <NewPasswordFields />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Submit icon="check">Changer le mot de passe</Submit>
        <span className="cn-hint" style={{ marginTop: 0 }}>
          Vous serez déconnecté de tous vos appareils.
        </span>
      </div>
    </form>
  );
}

// --- Création de compte --------------------------------------------------------

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, INITIAL);
  const f = state.fields ?? {};
  return (
    <form action={action} style={{ display: "grid", gap: 16 }} noValidate>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      <Field
        label="Numéro de CNI"
        name="cni"
        required
        autoComplete="off"
        inputMode="text"
        defaultValue={f.cni}
        hint="Celui présenté lors de votre premier don. Il n'est jamais stocké en clair."
      />
      <Field label="Date de naissance" name="date_naissance" type="date" required defaultValue={f.date_naissance} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={f.email}
        hint="Un lien de confirmation y sera envoyé. Si l'adresse n'est pas celle de votre dossier, un code vous sera d'abord envoyé par SMS."
      />
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} hint="8 caractères minimum" />
        <Field label="Confirmation" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <Submit icon="user" full>
        Créer mon compte
      </Submit>
    </form>
  );
}

// --- Rendez-vous -------------------------------------------------------------------

export function AppointmentForm({ lieux, eligibleLe }: { lieux: LieuRdv[]; eligibleLe?: string | null }) {
  const [state, action] = useActionState(createAppointmentAction, INITIAL);
  if (!lieux.length) return <Alert tone="info">La prise de rendez-vous en ligne est momentanément indisponible. Contactez le CNTS.</Alert>;
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {/* Remonté à chaque réponse : champs pré-remplis avec la saisie en cas d'erreur, et créneaux rechargés. */}
      <RdvFields key={state.ts ?? 0} lieux={lieux} fields={state.fields ?? {}} eligibleLe={eligibleLe} />
      <div>
        <Submit icon="calendarCheck">Confirmer le rendez-vous</Submit>
      </div>
    </form>
  );
}

const JOURS = ["", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** « Lun–Ven 08h00–17h00 · Sam 08h00–13h00 » à partir des horaires du lieu. */
function horairesLisibles(h: LieuRdv["horaires"]): string {
  const groupes: { jours: number[]; plages: string }[] = [];
  for (let j = 1; j <= 7; j++) {
    const plages = (h[String(j)] ?? []).map(([a, b]) => `${a.replace(":", "h")}–${b.replace(":", "h")}`).join(", ");
    if (!plages) continue;
    const dernier = groupes.at(-1);
    if (dernier && dernier.plages === plages && dernier.jours.at(-1) === j - 1) dernier.jours.push(j);
    else groupes.push({ jours: [j], plages });
  }
  return groupes
    .map((g) => `${JOURS[g.jours[0]]}${g.jours.length > 1 ? `–${JOURS[g.jours.at(-1)!]}` : ""} ${g.plages}`)
    .join(" · ");
}

function RdvFields({ lieux, fields, eligibleLe }: { lieux: LieuRdv[]; fields: Record<string, string>; eligibleLe?: string | null }) {
  const [lieuId, setLieuId] = useState(fields.lieu_id || lieux[0].id);
  const [jour, setJour] = useState(fields.jour ?? "");
  const [slots, setSlots] = useState<Creneau[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, startTransition] = useTransition();
  const lieu = lieux.find((l) => l.id === lieuId) ?? lieux[0];
  const { min, max } = bornesRdv(lieu.horizon_jours, new Date(), eligibleLe);

  useEffect(() => {
    if (!jour) return;
    startTransition(async () => {
      const r = await creneauxAction(lieuId, jour);
      if ("error" in r) {
        setErreur(r.error);
        setSlots([]);
      } else {
        setErreur(null);
        setSlots(r.creneaux);
      }
    });
  }, [lieuId, jour]);

  const heure = (iso: string) => iso.slice(11, 16).replace(":", "h"); // heure de Dakar = UTC
  return (
    <>
      <div>
        <label htmlFor="lieu_id" className="cn-label">
          Lieu
        </label>
        <select id="lieu_id" name="lieu_id" className="cn-input" required value={lieuId} onChange={(e) => setLieuId(e.target.value)}>
          {lieux.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nom}
            </option>
          ))}
        </select>
        <div className="cn-hint">
          {lieu.adresse ? `${lieu.adresse} · ` : ""}
          {horairesLisibles(lieu.horaires)}
        </div>
      </div>
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Date" name="jour" type="date" min={min} max={max} required defaultValue={jour} onChange={(e) => setJour(e.target.value)} />
        <div>
          <label htmlFor="debut" className="cn-label">
            Heure
          </label>
          <select id="debut" name="debut" className="cn-input" required disabled={!slots?.length} defaultValue={fields.debut} aria-busy={chargement}>
            {!jour && <option value="">Choisissez d&apos;abord une date</option>}
            {jour && chargement && <option value="">Chargement…</option>}
            {jour && !chargement && slots?.length === 0 && <option value="">Aucun créneau libre ce jour-là</option>}
            {!chargement &&
              slots?.map((c) => (
                <option key={c.debut} value={c.debut}>
                  {heure(c.debut)} · {c.places} place{c.places > 1 ? "s" : ""}
                </option>
              ))}
          </select>
        </div>
      </div>
      {erreur && <Alert tone="warn">{erreur}</Alert>}
      <div>
        <label htmlFor="commentaire" className="cn-label">
          Commentaire <span style={{ fontWeight: 500, color: "var(--ink-500)" }}>(facultatif)</span>
        </label>
        <textarea id="commentaire" name="commentaire" className="cn-input" rows={3} maxLength={500} defaultValue={fields.commentaire} />
      </div>
      <div className="cn-hint" style={{ marginTop: -4 }}>
        Réservation possible jusqu&apos;à {lieu.horizon_jours} jours à l&apos;avance, au plus tard {lieu.delai_min_heures} h avant le créneau.
      </div>
    </>
  );
}

/** Annulation en deux temps : on demande confirmation avant d'appeler le serveur. */
export function CancelAppointmentButton({ id, label }: { id: string; label: string }) {
  const [state, action] = useActionState(cancelAppointmentAction, INITIAL);
  const [confirmer, setConfirmer] = useState(false);
  if (state.ok) return null;
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
      {confirmer ? (
        <form action={action} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="hidden" name="id" value={id} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Annuler ce rendez-vous ?</span>
          <Submit icon="x">Oui, annuler</Submit>
          <button type="button" className="cn-btn ghost sm" onClick={() => setConfirmer(false)}>
            Non
          </button>
        </form>
      ) : (
        <button type="button" className="cn-btn ghost sm" aria-label={label} onClick={() => setConfirmer(true)}>
          <Icon name="x" size={15} />
          Annuler
        </button>
      )}
      {state.error && <Alert tone="err">{state.error}</Alert>}
    </div>
  );
}

// --- Profil -------------------------------------------------------------------------

export function ProfileForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useActionState(updateProfileAction, INITIAL);
  const v = state.fields ?? initial;
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {state.ok && <Alert tone="ok">Coordonnées mises à jour.</Alert>}
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Téléphone" name="telephone" type="tel" autoComplete="tel" defaultValue={v.telephone} placeholder="+221 …" />
        <Field
          label="Email de contact"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={v.email}
          hint="Pour les messages du CNTS. Ne change pas l'email de connexion."
        />
      </div>
      <Field label="Adresse" name="adresse" autoComplete="street-address" defaultValue={v.adresse} />
      <Field label="Profession" name="profession" defaultValue={v.profession} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Submit icon="check">Enregistrer</Submit>
        <span className="cn-hint" style={{ marginTop: 0 }}>
          Nom, date de naissance et groupe sanguin : à modifier au centre, sur présentation d&apos;une pièce d&apos;identité.{" "}
          <Link href="/contact">Nous contacter</Link>
        </span>
      </div>
    </form>
  );
}
