"use client";

import {
  useDonneurs,
  useDonneur,
  useCheckEligibilite,
  useCreateDon,
} from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function NouveauDonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donneurIdFromUrl = searchParams.get("donneur_id");

  const { mutate: createDon, status: createStatus, error: createError } = useCreateDon(apiClient);

  const [selectedDonneurId, setSelectedDonneurId] = useState<string>(
    donneurIdFromUrl || ""
  );
  const [formData, setFormData] = useState({
    date_don: new Date().toISOString().split("T")[0], // Aujourd'hui par défaut
    type_don: "SANG_TOTAL",
  });

  // Charger la liste des donneurs
  const { data: donneurs } = useDonneurs(apiClient, { limit: 500 });

  // Charger le donneur sélectionné
  const {
    data: donneur,
    status: donneurStatus,
    refetch: refetchDonneur,
  } = useDonneur(apiClient, selectedDonneurId);

  // Vérifier l'éligibilité
  const {
    data: eligibilite,
    status: eligibiliteStatus,
    refetch: refetchEligibilite,
  } = useCheckEligibilite(apiClient, selectedDonneurId);

  // Recharger l'éligibilité quand le donneur change
  useEffect(() => {
    if (selectedDonneurId) {
      refetchDonneur();
      refetchEligibilite();
    }
  }, [selectedDonneurId, refetchDonneur, refetchEligibilite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDonneurId) {
      alert("Veuillez sélectionner un donneur");
      return;
    }

    if (!eligibilite?.eligible) {
      const confirmProceed = window.confirm(
        "⚠️ Le donneur n'est pas éligible. Voulez-vous quand même créer ce don ?"
      );
      if (!confirmProceed) return;
    }

    try {
      const don = await createDon({
        donneur_id: selectedDonneurId,
        date_don: formData.date_don,
        type_don: formData.type_don,
      });
      router.push(`/dons/${don.id}`);
    } catch (err) {
      console.error("Erreur création don:", err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dons"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour à la liste
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau Don</h1>
        <p className="text-gray-700 mt-1">
          Enregistrer une nouvelle collecte de sang
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            {/* Erreur globale */}
            {createStatus === "error" && createError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm font-medium text-red-900">
                  Erreur lors de la création
                </div>
                <div className="text-sm text-red-600 mt-1">
                  {createError.status === 404
                    ? "Donneur introuvable"
                    : `Erreur ${createError.status}: ${JSON.stringify(
                      createError.body
                    )}`}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Sélection du donneur */}
              <div>
                <label
                  htmlFor="donneur"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Donneur <span className="text-red-600">*</span>
                </label>
                <select
                  id="donneur"
                  value={selectedDonneurId}
                  onChange={(e) => setSelectedDonneurId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="">Sélectionner un donneur...</option>
                  {donneurs?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}, {d.prenom} ({d.sexe})
                      {d.dernier_don
                        ? ` - Dernier don: ${new Date(
                          d.dernier_don
                        ).toLocaleDateString("fr-FR")}`
                        : " - Jamais donné"}
                    </option>
                  ))}
                </select>
                {!donneurIdFromUrl && (
                  <div className="mt-2 text-sm text-gray-800">
                    Ou{" "}
                    <Link href="/donneurs/nouveau" className="text-blue-600 hover:text-blue-900">
                      créer un nouveau donneur
                    </Link>
                  </div>
                )}
              </div>

              {/* Date du don */}
              <div>
                <label
                  htmlFor="date_don"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date du don <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  id="date_don"
                  value={formData.date_don}
                  onChange={(e) =>
                    setFormData({ ...formData, date_don: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  La date ne peut pas être dans le futur
                </p>
              </div>

              {/* Type de don */}
              <div>
                <label
                  htmlFor="type_don"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Type de don <span className="text-red-600">*</span>
                </label>
                <select
                  id="type_don"
                  value={formData.type_don}
                  onChange={(e) =>
                    setFormData({ ...formData, type_don: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="SANG_TOTAL">Sang Total (ST)</option>
                  <option value="PLASMAPHERESE">Plasmaphérèse</option>
                  <option value="CYTAPHERESE">Cytaphérèse</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Une poche ST sera créée automatiquement après enregistrement
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <Link
                href="/dons"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={
                  createStatus === "loading" || !selectedDonneurId
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createStatus === "loading" ? "Création..." : "Créer le don"}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Éligibilité */}
        <div className="space-y-6">
          {selectedDonneurId && donneurStatus === "success" && donneur && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Donneur sélectionné</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">Nom</div>
                  <div className="text-gray-900">
                    {donneur.nom}, {donneur.prenom}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Sexe</div>
                  <div className="text-gray-900">
                    {donneur.sexe === "H" ? "Homme" : "Femme"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    Dernier don
                  </div>
                  <div className="text-gray-900">
                    {donneur.dernier_don
                      ? new Date(donneur.dernier_don).toLocaleDateString(
                        "fr-FR"
                      )
                      : "Jamais"}
                  </div>
                </div>
                <Link
                  href={`/donneurs/${donneur.id}`}
                  className="block text-sm text-blue-600 hover:text-blue-900"
                >
                  Voir la fiche complète →
                </Link>
              </div>
            </div>
          )}

          {selectedDonneurId && eligibiliteStatus === "success" && eligibilite && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Vérification d'éligibilité</h2>
              <div
                className={`p-4 rounded-lg mb-4 ${eligibilite.eligible
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
                  }`}
              >
                <div
                  className={`text-lg font-semibold mb-2 ${eligibilite.eligible ? "text-green-900" : "text-red-900"
                    }`}
                >
                  {eligibilite.eligible ? "✓ Éligible" : "✗ Non éligible"}
                </div>
                {eligibilite.raison && (
                  <div
                    className={`text-sm ${eligibilite.eligible ? "text-green-700" : "text-red-700"
                      }`}
                  >
                    {eligibilite.raison}
                  </div>
                )}
              </div>

              {eligibilite.eligible_le && !eligibilite.eligible && (
                <div className="text-sm space-y-2">
                  <div className="font-medium text-gray-700">
                    Sera éligible le:
                  </div>
                  <div className="text-gray-900">
                    {new Date(eligibilite.eligible_le).toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                  {eligibilite.delai_jours !== null && (
                    <div className="text-gray-800">
                      Dans {eligibilite.delai_jours} jour(s)
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedDonneurId && eligibiliteStatus === "loading" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-700">
                Vérification de l'éligibilité...
              </div>
            </div>
          )}

          {!selectedDonneurId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2 text-sm">
                Workflow de création
              </h3>
              <ul className="text-xs text-blue-900 space-y-1">
                <li>1. Sélectionner un donneur</li>
                <li>2. Vérifier son éligibilité</li>
                <li>3. Renseigner date et type de don</li>
                <li>4. Créer le don (génère DIN + poche ST)</li>
                <li>5. Passer aux analyses biologiques</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
