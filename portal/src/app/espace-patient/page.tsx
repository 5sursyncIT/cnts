import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentPatient } from "@/lib/auth/current-user";

export const metadata = {
  title: "Espace patient — SGI-CNTS"
};

export default async function PatientAreaHome() {
  const patient = await getCurrentPatient();
  if (patient) redirect("/espace-patient/tableau-de-bord");

  return (
    <main className="bg-zinc-50">
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Espace patient</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-700">
          Connexion sécurisée, accès aux rendez-vous, comptes-rendus, messagerie et documents.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/espace-patient/connexion"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Se connecter
          </Link>
          <Link
            href="/espace-patient/inscription"
            className="inline-flex items-center justify-center rounded-md bg-white border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Créer un compte
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-transparent text-zinc-600 px-4 py-2 text-sm font-medium hover:text-zinc-900 hover:underline"
          >
            Besoin d’aide
          </Link>
        </div>
      </section>
    </main>
  );
}

