import Link from "next/link";

import { Alert, ResendVerificationForm } from "@/components/patient/forms";
import { AuthCard } from "@/components/patient/auth-card";
import { publicPost } from "@/lib/backend";
import { logger } from "@/lib/logger";

export const metadata = { title: "Confirmation de l'email — Espace patient" };

/** Le lien de l'email est idempotent côté backend : une ouverture répétée reste sans effet. */
async function verifier(token: string): Promise<"ok" | "invalide" | "indisponible"> {
  if (!token || token.length > 2048) return "invalide";
  const r = await publicPost("/api/auth/verify-email", { token });
  if (r.ok) return "ok";
  if (r.status === 400 || r.status === 422) return "invalide";
  logger.error({ status: r.status }, "patient email verification: backend error");
  return "indisponible";
}

export default async function VerificationPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await props.searchParams) ?? {};
  const resultat = await verifier(typeof sp.token === "string" ? sp.token : "");

  if (resultat === "ok") {
    return (
      <AuthCard title="Adresse email confirmée">
        <Alert tone="ok">Votre espace donneur est activé.</Alert>
        <Link href="/espace-patient/connexion" className="cn-btn primary md" style={{ justifySelf: "start" }}>
          Se connecter
        </Link>
      </AuthCard>
    );
  }
  if (resultat === "indisponible") {
    return (
      <AuthCard title="Confirmation impossible pour le moment">
        <Alert tone="warn">Le service est momentanément indisponible. Réessayez en rouvrant le lien un peu plus tard.</Alert>
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title="Lien expiré ou invalide"
      intro="Le lien de confirmation est valable 48 heures, et seul le dernier lien envoyé fonctionne. Indiquez votre email pour en recevoir un nouveau."
    >
      <ResendVerificationForm />
    </AuthCard>
  );
}
