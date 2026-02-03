import { authenticator } from "otplib";

import { AutoSubmitMfa } from "./AutoSubmitMfa";

export default async function MfaPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const error = searchParams.error === "1";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/dashboard";
  // Force disable MFA as requested
  const disableMfa = true; 
  const showDevCode = process.env.BACKOFFICE_SHOW_MFA_CODE === "1" && process.env.NODE_ENV !== "production";
  const secret = process.env.BACKOFFICE_ADMIN_TOTP_SECRET?.replace(/\s+/g, "");
  const devCode = showDevCode && secret ? authenticator.generate(secret) : null;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Vérification MFA</h1>
        <p className="mt-1 text-sm text-zinc-600">Saisissez le code de votre application d’authentification.</p>

        {disableMfa ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            MFA désactivé. Redirection en cours… <AutoSubmitMfa action="/api/auth/mfa" next={next} />
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            Code invalide.
          </div>
        ) : null}

        {devCode ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Code dev (env BACKOFFICE_SHOW_MFA_CODE=1) : <span className="font-mono">{devCode}</span>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" action="/api/auth/mfa" method="post">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="token" className="block text-sm font-medium">
              Code (6 chiffres)
            </label>
            <input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              required={!disableMfa}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm tracking-widest outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            disabled={disableMfa}
          >
            Valider
          </button>
        </form>
      </div>
    </main>
  );
}
