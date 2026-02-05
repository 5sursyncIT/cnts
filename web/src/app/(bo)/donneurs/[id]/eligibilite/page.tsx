"use client";

import { useDonneur, useCheckEligibilite } from "@cnts/api";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function EligibilitePage() {
  const params = useParams();
  const donneurId = params.id as string;

  const { data: donneur, status: donneurStatus } = useDonneur(apiClient, donneurId);
  const { data: eligibilite, status: eligibiliteStatus } = useCheckEligibilite(apiClient, donneurId);

  const isLoading = donneurStatus === "loading" || eligibiliteStatus === "loading";
  const isError = donneurStatus === "error" || eligibiliteStatus === "error";

  if (isLoading) {
    return <div className="p-8 text-center text-gray-700">Chargement de l'éligibilité...</div>;
  }

  if (isError || !donneur) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">Erreur lors du chargement des données</div>
        <Link href="/donneurs" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/donneurs"
          className="p-2 hover:bg-gray-100 rounded-full transition"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vérification d'éligibilité
          </h1>
          <p className="text-gray-800">
            {donneur.prenom} {donneur.nom}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte Statut Éligibilité */}
        <div className={`p-6 rounded-xl border shadow-sm ${
          eligibilite?.eligible 
            ? "bg-green-50 border-green-200" 
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-4 mb-4">
            {eligibilite?.eligible ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
            <div>
              <h2 className={`text-lg font-bold ${
                eligibilite?.eligible ? "text-green-900" : "text-red-900"
              }`}>
                {eligibilite?.eligible ? "Éligible au don" : "Non éligible temporairement"}
              </h2>
              <p className={`text-sm ${
                eligibilite?.eligible ? "text-green-700" : "text-red-700"
              }`}>
                {eligibilite?.eligible 
                  ? "Ce donneur peut effectuer un don aujourd'hui."
                  : eligibilite?.raison || "Le délai entre deux dons n'est pas respecté."
                }
              </p>
            </div>
          </div>

          {!eligibilite?.eligible && eligibilite?.eligible_le && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-red-100">
              <div className="flex items-center gap-2 text-gray-700 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Prochaine date possible :</span>
              </div>
              <div className="text-lg font-bold text-gray-900 ml-6">
                {new Date(eligibilite.eligible_le).toLocaleDateString("fr-FR", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              {eligibilite.delai_jours && (
                <div className="text-sm text-gray-700 ml-6 mt-1">
                  (Dans {eligibilite.delai_jours} jours)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informations Donneur */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations clés</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Sexe</span>
              <span className="font-medium">
                {donneur.sexe === "H" ? "Homme" : "Femme"}
              </span>
            </div>
            
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Groupe Sanguin</span>
              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">
                {donneur.groupe_sanguin || "Inconnu"}
              </span>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Dernier don</span>
              <span className="font-medium">
                {donneur.dernier_don 
                  ? new Date(donneur.dernier_don).toLocaleDateString("fr-FR")
                  : "Jamais"
                }
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-500">Intervalle requis</span>
              <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {donneur.sexe === "H" ? "2 mois (Hommes)" : "4 mois (Femmes)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-end gap-4">
        <Link
          href={`/donneurs/${donneurId}`}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
        >
          Voir le dossier complet
        </Link>
        {eligibilite?.eligible && (
          <Link
            href={`/dons/nouveau?donneur_id=${donneurId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Enregistrer un don
          </Link>
        )}
      </div>
    </div>
  );
}
