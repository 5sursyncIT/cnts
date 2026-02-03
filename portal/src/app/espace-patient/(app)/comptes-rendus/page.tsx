import { ConsentCard } from "@/components/consent-card";
import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Comptes-rendus — Espace patient"
};

export default async function ReportsPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Comptes-rendus</h1>
      <p className="mt-1 text-sm text-zinc-600">Accès sécurisé aux comptes-rendus médicaux.</p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : (
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Documents disponibles</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span>Compte-rendu — 2026-01-10</span>
              <button type="button" className="text-sm font-medium text-zinc-900 underline">
                Télécharger
              </button>
            </li>
            <li className="flex items-center justify-between">
              <span>Compte-rendu — 2025-12-02</span>
              <button type="button" className="text-sm font-medium text-zinc-900 underline">
                Télécharger
              </button>
            </li>
          </ul>
          <p className="mt-4 text-xs text-zinc-600">
            À connecter à un stockage sécurisé (liens signés, contrôle d’accès, traçabilité).
          </p>
        </section>
      )}
    </main>
  );
}

