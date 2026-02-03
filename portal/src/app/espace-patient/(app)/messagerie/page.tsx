import { ConsentCard } from "@/components/consent-card";
import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Messagerie — Espace patient"
};

export default async function MessagingPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Messagerie sécurisée</h1>
      <p className="mt-1 text-sm text-zinc-600">Échanges confidentiels avec les praticiens.</p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Conversations</h2>
            <p className="mt-2 text-sm text-zinc-700">Aucune conversation pour l’instant.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Nouveau message</h2>
            <form className="mt-3 space-y-3">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-zinc-900">
                  Objet
                </label>
                <input
                  id="subject"
                  type="text"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-zinc-900">
                  Message
                </label>
                <textarea
                  id="body"
                  rows={5}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                Envoyer
              </button>
              <p className="text-xs text-zinc-600">À connecter à l’API (chiffrement, stockage, audit, notifications).</p>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

