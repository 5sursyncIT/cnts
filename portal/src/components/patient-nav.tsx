import Link from "next/link";

import type { PortalSession } from "@/lib/auth/session";

export function PatientNav(props: { patient: PortalSession }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <nav className="flex flex-wrap items-center gap-3" aria-label="Navigation espace patient">
          <Link className="text-sm font-semibold text-zinc-900" href="/espace-patient/tableau-de-bord">
            Espace patient
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/rendez-vous">
            Rendez-vous
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/comptes-rendus">
            Comptes-rendus
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/messagerie">
            Messagerie
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/historique">
            Mes dons
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/carte-donneur">
            Carte donneur
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/documents">
            Documents
          </Link>
          <Link className="text-sm text-zinc-700 hover:text-zinc-900" href="/espace-patient/preferences">
            Notifications
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-600 md:inline">{props.patient.displayName}</span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

