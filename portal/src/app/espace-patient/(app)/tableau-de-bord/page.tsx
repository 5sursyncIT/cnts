import Link from "next/link";

import { ConsentCard } from "@/components/consent-card";
import { getGdprConsent } from "@/lib/consent";

export const metadata = {
  title: "Tableau de bord — Espace patient"
};

export default async function PatientDashboardPage() {
  const consent = await getGdprConsent();

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Tableau de bord</h1>
      <p className="mt-1 text-sm text-zinc-600">Accès rapide à vos services.</p>

      {consent !== "accepted" ? (
        <div className="mt-6">
          <ConsentCard />
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/espace-patient/rendez-vous" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:bg-zinc-50">
          <div className="text-sm font-semibold text-zinc-900">Rendez-vous</div>
          <div className="mt-1 text-sm text-zinc-700">Prise et rappels (email/SMS).</div>
        </Link>
        <Link
          href="/espace-patient/comptes-rendus"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:bg-zinc-50"
        >
          <div className="text-sm font-semibold text-zinc-900">Comptes-rendus</div>
          <div className="mt-1 text-sm text-zinc-700">Consultation et téléchargement.</div>
        </Link>
        <Link href="/espace-patient/messagerie" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:bg-zinc-50">
          <div className="text-sm font-semibold text-zinc-900">Messagerie</div>
          <div className="mt-1 text-sm text-zinc-700">Messages sécurisés avec les praticiens.</div>
        </Link>
        <Link href="/espace-patient/documents" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:bg-zinc-50">
          <div className="text-sm font-semibold text-zinc-900">Documents</div>
          <div className="mt-1 text-sm text-zinc-700">Téléversement et accès aux pièces.</div>
        </Link>
      </section>
    </main>
  );
}

