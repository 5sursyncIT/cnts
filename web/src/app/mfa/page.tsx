import Link from "next/link";

import { AuthLayout } from "@/components/auth-layout";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, Input } from "@/components/ui";

export default async function MfaPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const error = searchParams.error === "1";
  const recovery = searchParams.mode === "recovery";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/dashboard";

  return (
    <AuthLayout
      title="Vérification en deux étapes"
      description={
        recovery
          ? "Saisissez l’un de vos codes de secours. Chaque code n’est utilisable qu’une fois."
          : "Ouvrez votre application d’authentification et saisissez le code à 6 chiffres."
      }
    >
      {error ? <Alert className="mb-5">Code invalide ou expiré. Réessayez avec le code affiché actuellement.</Alert> : null}
      <form className="space-y-5" action="/admin/api/auth/mfa" method="post">
        <input type="hidden" name="next" value={next} />
        {recovery ? <input type="hidden" name="mode" value="recovery" /> : null}
        <Field label={recovery ? "Code de secours" : "Code de vérification"}>
          <Input
            name="token"
            inputMode={recovery ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
            autoFocus
            placeholder={recovery ? "xxxxxx-xxxxxx" : "123 456"}
            className="h-12 text-center font-mono text-lg tracking-[0.3em]"
          />
        </Field>
        <SubmitButton pendingLabel="Vérification…">Valider</SubmitButton>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm">
        <a className="text-blue-700 hover:underline" href={`/admin/mfa?next=${encodeURIComponent(next)}${recovery ? "" : "&mode=recovery"}`}>
          {recovery ? "Utiliser l’application d’authentification" : "Utiliser un code de secours"}
        </a>
        <Link className="text-gray-600 hover:underline" href="/login">
          Changer de compte
        </Link>
      </div>
    </AuthLayout>
  );
}
