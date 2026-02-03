export const metadata = {
  title: "Connexion — Espace patient"
};

export default async function PatientLoginPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const error = searchParams.error === "1";
  const next = typeof searchParams.next === "string" ? searchParams.next : "/espace-patient/tableau-de-bord";

  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Connexion</h1>
          <p className="mt-1 text-sm text-zinc-700">Accès à votre espace patient.</p>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              Identifiants invalides.
            </div>
          ) : null}

          <form className="mt-6 space-y-4" action="/api/auth/login" method="post">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-900">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-900">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 text-xs text-zinc-600">
            <div>Démo :</div>
            <div>Email : patient@cnts.local</div>
            <div>Mot de passe : patient</div>
          </div>
        </div>
      </section>
    </main>
  );
}

