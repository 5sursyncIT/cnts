"use client";

import {
  useDon,
  useDons,
  useAnalyses,
  useCheckLiberation,
  useLibererDon,
} from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function LiberationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const donIdFromUrl = searchParams.get("don_id");

  const [selectedDonId, setSelectedDonId] = useState<string>(donIdFromUrl || "");
  const [searchDin, setSearchDin] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [liberationStatus, setLiberationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: libererDon } = useLibererDon(apiClient);

  // Charger les dons EN_ATTENTE (potentiellement prêts pour libération)
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 100,
  });

  // Charger le don sélectionné
  const { data: don, refetch: refetchDon } = useDon(
    apiClient,
    selectedDonId
  );

  // Charger les analyses
  const { data: analyses } = useAnalyses(apiClient, {
    don_id: selectedDonId || undefined,
  });

  // Vérifier l'état de libération
  const { data: liberation, refetch: refetchLiberation } = useCheckLiberation(
    apiClient,
    selectedDonId
  );

  // Recherche par DIN
  const handleSearchByDin = () => {
    const foundDon = donsEnAttente?.find((d) => d.din === searchDin.trim());
    if (foundDon) {
      setSelectedDonId(foundDon.id);
      setSearchDin("");
    } else {
      alert("Don introuvable avec ce DIN");
    }
  };

  // Confirmation et libération
  const handleLiberer = async () => {
    if (!selectedDonId) return;

    setLiberationStatus("loading");
    setErrorMessage("");

    try {
      await libererDon(selectedDonId);
      setLiberationStatus("success");
      setShowConfirmModal(false);

      // Recharger les données
      await refetchDon();
      await refetchLiberation();

      // Rediriger vers la fiche du don après 2 secondes
      setTimeout(() => {
        router.push(`/dons/${selectedDonId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Erreur libération:", err);
      setLiberationStatus("error");
      setErrorMessage(err.message || "Erreur lors de la libération");
    }
  };

  const TESTS_REQUIS = ["ABO", "RH", "VIH", "VHB", "VHC", "SYPHILIS"];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/laboratoire"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour au laboratoire
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Libération Biologique</h1>
        <p className="text-gray-700 mt-1">
          Validation finale et libération des dons pour distribution
        </p>
      </div>

      {/* Message de succès */}
      {liberationStatus === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm font-medium text-green-900">
            ✓ Don libéré avec succès ! Redirection en cours...
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {liberationStatus === "error" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-900">
            Erreur lors de la libération
          </div>
          <div className="text-sm text-red-600 mt-1">{errorMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sélection du don */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Sélectionner un don</h2>

            {/* Recherche par DIN */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche par DIN
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchDin}
                  onChange={(e) => setSearchDin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchByDin()}
                  placeholder="Ex: CNTS2600X123456"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  onClick={handleSearchByDin}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Rechercher
                </button>
              </div>
            </div>

            {/* Ou sélection dans la liste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ou sélectionner dans la liste (EN_ATTENTE)
              </label>
              <select
                value={selectedDonId}
                onChange={(e) => setSelectedDonId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">-- Choisir un don --</option>
                {donsEnAttente?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.din} - {new Date(d.date_don).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Résumé des analyses */}
          {selectedDonId && don && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Résultats des analyses</h2>

              {!analyses || analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">Aucune analyse enregistrée</div>
                  <Link
                    href={`/laboratoire/analyses?don_id=${selectedDonId}`}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Ajouter des analyses →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {TESTS_REQUIS.map((testType) => {
                    const analyse = analyses.find((a) => a.type_test === testType);
                    return (
                      <div
                        key={testType}
                        className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{testType}</div>
                          {analyse && analyse.note && (
                            <div className="text-sm text-gray-800 mt-1">
                              {analyse.note}
                            </div>
                          )}
                        </div>
                        {analyse ? (
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${analyse.resultat === "NEGATIF" ||
                              ["A", "B", "AB", "O", "POS", "NEG"].includes(
                                analyse.resultat
                              )
                              ? "bg-green-100 text-green-900"
                              : analyse.resultat === "POSITIF"
                                ? "bg-red-100 text-red-900"
                                : "bg-yellow-100 text-yellow-900"
                              }`}
                          >
                            {analyse.resultat}
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm text-red-600 bg-red-50 rounded-full font-semibold">
                            ✗ Manquant
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Informations du don */}
          {selectedDonId && don && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Don sélectionné</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">DIN</dt>
                  <dd className="font-mono text-gray-900">{don.din}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Date</dt>
                  <dd className="text-gray-900">
                    {new Date(don.date_don).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900">{don.type_don}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Statut actuel</dt>
                  <dd>
                    <span
                      className={`px-2 py-1 rounded text-xs ${don.statut_qualification === "LIBERE"
                        ? "bg-green-100 text-green-900"
                        : "bg-yellow-100 text-yellow-900"
                        }`}
                    >
                      {don.statut_qualification}
                    </span>
                  </dd>
                </div>
              </dl>
              <Link
                href={`/dons/${don.id}`}
                className="block mt-4 text-sm text-blue-600 hover:text-blue-900"
              >
                Voir la fiche complète →
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar - Validation */}
        <div className="space-y-6">
          {liberation && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Validation de libération
              </h2>

              <div
                className={`p-4 rounded-lg mb-4 ${liberation.liberable
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
                  }`}
              >
                <div
                  className={`text-lg font-semibold mb-2 ${liberation.liberable ? "text-green-900" : "text-red-900"
                    }`}
                >
                  {liberation.liberable ? "✓ Libérable" : "✗ Non libérable"}
                </div>
                {liberation.raison && (
                  <div
                    className={`text-sm ${liberation.liberable ? "text-green-700" : "text-red-700"
                      }`}
                  >
                    {liberation.raison}
                  </div>
                )}
              </div>

              {liberation.tests_manquants.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Tests manquants:
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {liberation.tests_manquants.map((test) => (
                      <li key={test}>• {test}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/laboratoire/analyses?don_id=${selectedDonId}`}
                    className="block mt-3 text-sm text-blue-600 hover:text-blue-900"
                  >
                    Compléter les analyses →
                  </Link>
                </div>
              )}

              {liberation.tests_positifs.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    ⚠️ Tests positifs:
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {liberation.tests_positifs.map((test) => (
                      <li key={test}>• {test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {liberation.liberable && don?.statut_qualification !== "LIBERE" && (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={liberationStatus === "loading"}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {liberationStatus === "loading"
                      ? "Libération en cours..."
                      : "Libérer le don"}
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    La libération mettra à jour le statut du don et des poches
                  </p>
                </>
              )}

              {don?.statut_qualification === "LIBERE" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-900">
                  ✓ Ce don a déjà été libéré
                </div>
              )}

              <button
                onClick={() => refetchLiberation()}
                className="w-full mt-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Recalculer
              </button>
            </div>
          )}

          {/* Règle d'or */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2 text-sm">
              ⚠️ Règle de libération
            </h3>
            <ul className="text-xs text-red-900 space-y-1">
              <li>• Tous les 6 tests doivent être effectués</li>
              <li>• Groupage (ABO + Rh) doit être déterminé</li>
              <li>• Sérologies (VIH, VHB, VHC, Syphilis) doivent être NÉGATIF</li>
              <li>• Toute anomalie bloque la libération</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Workflow de libération
            </h3>
            <ul className="text-xs text-blue-900 space-y-1">
              <li>1. Vérifier toutes les analyses</li>
              <li>2. Confirmer la conformité biologique</li>
              <li>3. Libérer le don</li>
              <li>4. Poches deviennent DISPONIBLE</li>
              <li>5. Don peut être fractionné/distribué</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Confirmer la libération biologique
            </h3>
            <div className="mb-6 space-y-3">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-1">Don</div>
                <div className="text-sm text-gray-900 font-mono">{don?.din}</div>
              </div>
              <div className="text-sm text-gray-700">
                <strong>Conséquences de la libération:</strong>
                <ul className="mt-2 space-y-1 ml-4 list-disc">
                  <li>Don passe en statut LIBERE</li>
                  <li>Poches associées deviennent DISPONIBLE</li>
                  <li>Action irréversible</li>
                </ul>
              </div>
              {analyses && (
                <div className="text-xs text-gray-800">
                  <strong>Résumé:</strong>{" "}
                  {analyses.length} analyse(s) validée(s)
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={liberationStatus === "loading"}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleLiberer}
                disabled={liberationStatus === "loading"}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              >
                {liberationStatus === "loading"
                  ? "Libération..."
                  : "Confirmer la libération"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
