import Link from "next/link";

import { AuthCard } from "@/components/patient/auth-card";
import { Alert, ResetPasswordForm } from "@/components/patient/forms";

export const metadata = { title: "Nouveau mot de passe — Espace patient" };

// Le jeton n'est consommé qu'à l'envoi du formulaire : l'ouverture du lien (ou son
// analyse par un antivirus de messagerie) ne change rien.
export default async function ResetPasswordPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await props.searchParams) ?? {};
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <AuthCard title="Nouveau mot de passe" intro={token ? "Choisissez le nouveau mot de passe de votre espace donneur." : undefined}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <Alert tone="warn">Ce lien est incomplet. Ouvrez le lien exactement tel qu&apos;il figure dans l&apos;email.</Alert>
          <Link href="/espace-patient/mot-de-passe-oublie">Faire une nouvelle demande</Link>
        </>
      )}
    </AuthCard>
  );
}
