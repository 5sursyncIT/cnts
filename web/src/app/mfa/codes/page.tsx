import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthLayout } from "@/components/auth-layout";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui";
import { recoveryCodesCookieName, verifyRecoveryCodes } from "@/lib/auth/preauth";

import { CopyCodesButton } from "./copy-codes-button";

export default async function RecoveryCodesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const next = typeof searchParams.next === "string" ? searchParams.next : "/dashboard";

  const token = (await cookies()).get(recoveryCodesCookieName)?.value;
  const codes = token ? await verifyRecoveryCodes(token) : null;
  if (!codes) redirect("/dashboard");

  return (
    <AuthLayout title="Double authentification activée" description="Conservez vos codes de secours avant de continuer.">
      <Alert tone="warning" className="mb-5">
        Ces codes ne seront <strong>plus jamais affichés</strong>. Chacun permet une seule connexion si vous perdez votre
        téléphone. Rangez-les hors du téléphone (coffre, gestionnaire de mots de passe, papier sous clé).
      </Alert>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codes.map((code) => (
          <li key={code} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-gray-900">
            {code}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <CopyCodesButton codes={codes} />
      </div>
      <form className="mt-6" action="/admin/api/auth/mfa/recovery-codes" method="post">
        <input type="hidden" name="next" value={next} />
        <SubmitButton>J’ai conservé mes codes, continuer</SubmitButton>
      </form>
    </AuthLayout>
  );
}
