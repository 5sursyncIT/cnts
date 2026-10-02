import Link from "next/link";

import { AuthCard } from "@/components/patient/auth-card";
import { ForgotPasswordForm } from "@/components/patient/forms";

export const metadata = { title: "Mot de passe oublié — Espace patient" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      intro="Indiquez l'adresse email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <ForgotPasswordForm />
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, fontSize: 14, color: "var(--ink-600)" }}>
        Vous n&apos;avez plus accès à cette adresse ? <Link href="/contact">Contactez le CNTS</Link>
      </div>
    </AuthCard>
  );
}
