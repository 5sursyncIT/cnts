import Link from "next/link";

import { AuthCard } from "@/components/patient/auth-card";
import { Alert, ResendSmsForm, SmsCodeForm } from "@/components/patient/forms";
import { getSmsChallenge } from "@/lib/sms-challenge";

export const metadata = { title: "Code SMS — Espace patient" };

export default async function VerificationSmsPage() {
  const challenge = await getSmsChallenge();

  if (!challenge) {
    return (
      <AuthCard title="Vérification expirée">
        <Alert tone="warn">La vérification par SMS a expiré (30 minutes). Recommencez la création de votre compte.</Alert>
        <Link href="/espace-patient/inscription" className="cn-btn primary md" style={{ justifySelf: "start" }}>
          Recommencer
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Vérification par SMS"
      intro={
        <>
          Pour protéger votre dossier, nous avons envoyé un code au numéro enregistré au CNTS : <strong>{challenge.t}</strong>. Un lien de
          confirmation sera ensuite envoyé à votre email.
        </>
      }
    >
      {challenge.e === 1 && <Alert tone="warn">L&apos;envoi du SMS a échoué. Demandez un nouveau code ci-dessous.</Alert>}
      <SmsCodeForm />
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "grid", gap: 10, fontSize: 14, color: "var(--ink-600)" }}>
        <ResendSmsForm />
        <span>
          Ce numéro n&apos;est plus le vôtre ? <Link href="/contact">Contactez le CNTS</Link> pour mettre à jour votre dossier.
        </span>
      </div>
    </AuthCard>
  );
}
