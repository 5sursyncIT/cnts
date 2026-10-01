"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Clock, ShieldCheck } from "lucide-react";
import { useDons } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import { Alert, ButtonLink, Card, CardBody, CardHeader, PageHeader } from "@/components/ui";

const MODULES = [
  {
    href: "/laboratoire/analyses",
    title: "Analyses biologiques",
    description: "Saisie des résultats de tests : ABO, Rh, sérologie infectieuse.",
    icon: ClipboardList,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    href: "/laboratoire/liberation",
    title: "Libération biologique",
    description: "Validation finale et libération des dons pour distribution.",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-600",
  },
] as const;

export default function LaboratoirePage() {
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 10,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laboratoire"
        description="Analyses biologiques et libération des dons"
      />

      {donsEnAttente && donsEnAttente.length > 0 && (
        <Alert tone="warning">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Dons en attente de libération</p>
                <p>
                  {donsEnAttente.length} don(s) nécessite(nt) des analyses ou une libération biologique.
                </p>
              </div>
            </div>
            <ButtonLink href="/laboratoire/liberation" variant="secondary" size="sm">
              Voir les dons en attente
            </ButtonLink>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${m.tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">{m.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{m.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    Accéder au module
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Circuit de validation" />
        <CardBody>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
            <li>Collecte du don : génération du DIN et de la poche de sang total.</li>
            <li>Analyses biologiques : 6 tests obligatoires (ABO, Rh, VIH, VHB, VHC, Syphilis).</li>
            <li>Vérification : tous les tests doivent être négatifs (et le groupage valide).</li>
            <li>Libération biologique : le don passe à « Libéré », les poches à « Disponible ».</li>
            <li>Distribution : les poches peuvent être attribuées.</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
