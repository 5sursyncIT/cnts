import { ConsentCard } from "@/components/consent-card";
import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Documents — Espace patient"
};

export default async function DocumentsPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Documents</h1>
      <p className="mt-1 text-sm text-zinc-600">Téléchargement et dépôt de documents médicaux.</p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Mes documents</h2>
            <p className="mt-2 text-sm text-zinc-700">Aucun document.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">Ajouter un document</h2>
            <form className="mt-3 space-y-3">
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-zinc-900">
                  Fichier
                </label>
                <input id="file" type="file" className="mt-1 w-full text-sm" />
              </div>
              <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                Envoyer
              </button>
              <p className="text-xs text-zinc-600">
                À connecter à un stockage sécurisé (antivirus, chiffrement, liens signés, audit).
              </p>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

