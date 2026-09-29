"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createAppointmentAction,
  loginAction,
  registerAction,
  updateProfileAction,
  type FormState,
} from "@/app/espace-patient/actions";
import { Icon } from "@/components/cnts/icon";
import { bornesRdv, creneaux, LIEUX_RDV } from "@/lib/donneur";

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
  return (
    <div>
      <label htmlFor={id} className="cn-label">
        {label}
      </label>
      <input id={id} className="cn-input" {...input} />
      {hint && <div className="cn-hint">{hint}</div>}
    </div>
  );
}

// --- Connexion ---------------------------------------------------------------

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 16 }} noValidate>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      <input type="hidden" name="next" value={next} />
      <Field label="Email" name="email" type="email" autoComplete="username" required defaultValue={state.fields?.email} />
      <Field label="Mot de passe" name="password" type="password" autoComplete="current-password" required />
      <Submit full>
        Se connecter
      </Submit>
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
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={f.email} />
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Mot de passe" name="password" type="password" autoComplete="new-password" required minLength={8} hint="8 caractères minimum" />
        <Field label="Confirmation" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <Submit icon="user" full>
        Créer mon compte
      </Submit>
    </form>
  );
}

// --- Rendez-vous -------------------------------------------------------------------

export function AppointmentForm({ eligibleLe }: { eligibleLe?: string | null }) {
  const [state, action] = useActionState(createAppointmentAction, INITIAL);
  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {state.error && <Alert tone="err">{state.error}</Alert>}
      {state.ok && <Alert tone="ok">Rendez-vous enregistré. Présentez-vous 10 minutes avant l&apos;heure prévue avec votre pièce d&apos;identité.</Alert>}
      {/* Remonté à chaque réponse : champs non contrôlés, pré-remplis avec la saisie en cas d'erreur. */}
      <RdvFields key={state.ts ?? 0} fields={state.ok ? {} : (state.fields ?? {})} eligibleLe={eligibleLe} />
      <div>
        <Submit icon="calendarCheck">Confirmer le rendez-vous</Submit>
      </div>
    </form>
  );
}

function RdvFields({ fields, eligibleLe }: { fields: Record<string, string>; eligibleLe?: string | null }) {
  const { min, max } = bornesRdv(new Date(), eligibleLe ? new Date(`${eligibleLe}T00:00:00`) : null);
  const [date, setDate] = useState(fields.date ?? "");
  const slots = creneaux(date);
  return (
    <>
      <div>
        <label htmlFor="lieu" className="cn-label">
          Lieu
        </label>
        <select id="lieu" name="lieu" className="cn-input" required defaultValue={fields.lieu || LIEUX_RDV[0]}>
          {LIEUX_RDV.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Date" name="date" type="date" min={min} max={max} required defaultValue={fields.date} onChange={(e) => setDate(e.target.value)} />
        <div>
          <label htmlFor="heure" className="cn-label">
            Heure
          </label>
          <select id="heure" name="heure" className="cn-input" required disabled={!slots.length} defaultValue={fields.heure}>
            {!date && <option value="">Choisissez d&apos;abord une date</option>}
            {date && !slots.length && <option value="">Centre fermé ce jour-là</option>}
            {slots.map((h) => (
              <option key={h} value={h}>
                {h.replace(":", "h")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="commentaire" className="cn-label">
          Commentaire <span style={{ fontWeight: 500, color: "var(--ink-500)" }}>(facultatif)</span>
        </label>
        <textarea id="commentaire" name="commentaire" className="cn-input" rows={3} maxLength={500} defaultValue={fields.commentaire} />
      </div>
      <div className="cn-hint" style={{ marginTop: -4 }}>
        Lun–Ven 08h00–17h00 · Sam 08h00–13h00. Réservation possible jusqu&apos;à 3 mois à l&apos;avance.
      </div>
    </>
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
        <Field label="Email de contact" name="email" type="email" autoComplete="email" defaultValue={v.email} />
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
