"use client";

import Link from "next/link";
import { useDons } from "@cnts/api";
import { apiClient } from "@/lib/api-client";

export default function LaboratoirePage() {
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 10,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Laboratoire</h1>
        <p className="text-gray-600 mt-1">
          Gestion des analyses biologiques et libération des dons
        </p>
      </div>

      {/* Modules principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Link
          href="/laboratoire/analyses"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                📋 Analyses Biologiques
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Saisie des résultats de tests : ABO, Rh, sérologie infectieuse
              </p>
              <div className="text-blue-600 text-sm font-medium">
                Accéder au module →
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/laboratoire/liberation"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                ✅ Libération Biologique
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Validation finale et libération des dons pour distribution
              </p>
              <div className="text-green-600 text-sm font-medium">
                Accéder au module →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Dons en attente */}
      {donsEnAttente && donsEnAttente.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">
            ⏳ Dons en attente de libération
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            {donsEnAttente.length} don(s) nécessite(nt) des analyses ou une
            libération biologique
          </p>
          <Link
            href="/laboratoire/liberation"
            className="text-sm text-yellow-900 font-medium hover:text-yellow-700"
          >
            Voir les dons en attente →
          </Link>
        </div>
      )}

      {/* Informations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 text-sm">
          Workflow de validation
        </h3>
        <ol className="text-xs text-blue-800 space-y-1">
          <li>1. Collecte du don → Génération DIN + poche ST</li>
          <li>
            2. Analyses biologiques → 6 tests obligatoires (ABO, Rh, VIH, VHB,
            VHC, Syphilis)
          </li>
          <li>
            3. Vérification → Tous les tests doivent être NÉGATIF (ou résultats
            groupage valides)
          </li>
          <li>
            4. Libération biologique → Transition Don (LIBERE) + Poches
            (DISPONIBLE)
          </li>
          <li>5. Distribution → Les poches peuvent être attribuées</li>
        </ol>
      </div>
    </div>
  );
}
