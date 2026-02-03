import Link from "next/link";

import { ConsentCard } from "@/components/consent-card";
import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Rendez-vous — Espace patient"
};

export default async function AppointmentsPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Rendez-vous</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Prise de rendez-vous en ligne et rappels. Préférences :{" "}
        <Link className="underline" href="/espace-patient/preferences">
          notifications
        </Link>
        .
      </p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Prochain rendez-vous</h2>
            <p className="mt-2 text-sm text-zinc-700">Aucun rendez-vous planifié.</p>
          </section>
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Prendre rendez-vous</h2>
            <form className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-900" htmlFor="date">
                  Date souhaitée
                </label>
                <input
                  id="date"
                  type="date"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <button
                type="button"
                className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Envoyer une demande
              </button>
              <p className="text-xs text-zinc-600">À connecter à l’API (prise de rendez-vous + notifications email/SMS).</p>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

