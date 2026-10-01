import { AuthLayout } from "@/components/auth-layout";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, Input } from "@/components/ui";

export default async function LoginPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const error =
    searchParams.error === "locked"
      ? "Trop de tentatives échouées : le compte est verrouillé pendant 15 minutes."
      : searchParams.error
        ? "Adresse email ou mot de passe incorrect."
        : null;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/dashboard";

  return (
    <AuthLayout title="Connexion" description="Identifiez-vous avec votre compte professionnel CNTS.">
      {error ? <Alert className="mb-5">{error}</Alert> : null}
      <form className="space-y-5" action="/admin/api/auth/login" method="post">
        <input type="hidden" name="next" value={next} />
        <Field label="Adresse email">
          <Input name="email" type="email" autoComplete="username" required autoFocus placeholder="prenom.nom@cnts.gouv.sn" />
        </Field>
        <Field label="Mot de passe">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
      </form>
      <p className="mt-6 text-xs text-gray-500">
        Un second facteur (application d’authentification) vous sera demandé à l’étape suivante. Mot de passe
        oublié : contactez l’administrateur du système.
      </p>
    </AuthLayout>
  );
}
