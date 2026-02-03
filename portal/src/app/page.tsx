import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Portail Patient SGI-CNTS</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-700">
            Accédez à vos rendez-vous, comptes-rendus et documents médicaux, et échangez via une messagerie sécurisée.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/espace-patient"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              Accéder à l’espace patient
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              Découvrir les services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Rendez-vous en ligne</h2>
            <p className="mt-2 text-sm text-zinc-700">Prise de rendez-vous, rappels et historique.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Comptes-rendus</h2>
            <p className="mt-2 text-sm text-zinc-700">Consultation et téléchargement de documents médicaux.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Messagerie sécurisée</h2>
            <p className="mt-2 text-sm text-zinc-700">Échanges confidentiels avec les praticiens.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
