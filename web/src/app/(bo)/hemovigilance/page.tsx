import Link from "next/link";
import { Activity, AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/ui";

const SECTIONS = [
  {
    href: "/hemovigilance/transfusions",
    title: "Suivi transfusionnel",
    description: "Historique et traçabilité des actes transfusionnels.",
    icon: Activity,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    href: "/hemovigilance/rappels",
    title: "Rappels et alertes",
    description: "Rappels de produits et alertes sanitaires.",
    icon: AlertTriangle,
    tone: "bg-red-50 text-red-600",
  },
  {
    href: "/hemovigilance/eir",
    title: "Événements indésirables (EIR)",
    description: "Déclarer, investiguer et clôturer les réactions transfusionnelles.",
    icon: ShieldAlert,
    tone: "bg-amber-50 text-amber-600",
  },
];

export default function HemovigilancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Hémovigilance" description="Traçabilité post-transfusionnelle, rappels et événements indésirables" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, title, description, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-gray-900">{title}</span>
              <span className="mt-0.5 block text-sm text-gray-600">{description}</span>
            </span>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
