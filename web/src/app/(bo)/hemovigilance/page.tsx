import Link from "next/link";
import { Activity, AlertTriangle } from "lucide-react";

export default function HemovigilancePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">Hémovigilance</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/hemovigilance/transfusions"
          className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Suivi Transfusionnel</h2>
              <p className="text-sm text-zinc-500">
                Consulter l'historique des transfusions et les effets indésirables (EIR).
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/hemovigilance/rappels"
          className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-red-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-50 p-3 text-red-600 group-hover:bg-red-600 group-hover:text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Rappels & Alertes</h2>
              <p className="text-sm text-zinc-500">
                Gérer les rappels de produits et les alertes sanitaires.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
