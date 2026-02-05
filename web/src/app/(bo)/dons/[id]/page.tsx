"use client";

import {
  useDon,
  useDonneur,
  useAnalyses,
  useCheckLiberation,
} from "@cnts/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function DonDetailPage() {
  const params = useParams();
  const donId = params.id as string;

  const { data: don, status: donStatus, error: donError, refetch: refetchDon } = useDon(apiClient, donId);
  const { data: donneur } = useDonneur(apiClient, don?.donneur_id || null);
  const { data: analyses, refetch: refetchAnalyses } = useAnalyses(apiClient, {
    don_id: donId,
  });
  const { data: liberation, refetch: refetchLiberation } = useCheckLiberation(
    apiClient,
    donId
  );

  const [downloadingEtiquette, setDownloadingEtiquette] = useState(false);

  const handleDownloadEtiquette = async () => {
    setDownloadingEtiquette(true);
    try {
      const etiquette = await apiClient.dons.getEtiquette(donId);

      // Créer un blob de texte avec les données de l'étiquette
      const text = `
ÉTIQUETTE DE DON - ISBT 128
================================

DIN: ${etiquette.din}
Date du don: ${new Date(etiquette.date_don).toLocaleDateString("fr-FR")}
Groupe sanguin: ${etiquette.groupe_sanguin || "Non déterminé"}
Type produit: ${etiquette.type_produit}
Date de péremption: ${new Date(etiquette.date_peremption).toLocaleDateString(
        "fr-FR"
      )}

⚠️ ANONYME - Ne contient aucune information personnelle du donneur
================================
      `.trim();

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiquette_${etiquette.din}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de la génération de l'étiquette");
      console.error(err);
    } finally {
      setDownloadingEtiquette(false);
    }
  };

  if (donStatus === "loading") {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (donStatus === "error" || !don) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-800">
            {donError?.status === 404 ? "Don introuvable" : "Erreur inconnue"}
          </div>
          <Link
            href="/dons"
            className="mt-4 inline-block text-blue-600 hover:text-blue-900"
          >
            ← Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dons"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour à la liste
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Don {don.din}</h1>
            <div className="flex gap-3 mt-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  don.statut_qualification === "LIBERE"
                    ? "bg-green-100 text-green-900"
                    : "bg-yellow-100 text-yellow-900"
                }`}
              >
                {don.statut_qualification === "LIBERE"
                  ? "✓ Libéré"
                  : "⏳ En attente"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadEtiquette}
              disabled={downloadingEtiquette}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {downloadingEtiquette ? "Génération..." : "📥 Télécharger étiquette"}
            </button>
            <Link
              href={`/laboratoire/analyses?don_id=${donId}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
            >
              + Ajouter analyses
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte d'identité du don */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Informations du don</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">DIN</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    {don.din}
                  </code>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Date du don
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(don.date_don).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{don.type_don}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Créé le
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(don.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>

            {donneur && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Donneur
                </div>
                <Link
                  href={`/donneurs/${donneur.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  {donneur.nom}, {donneur.prenom} ({donneur.sexe === "H" ? "Homme" : "Femme"})
                  →
                </Link>
              </div>
            )}
          </div>

          {/* Analyses biologiques */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Analyses biologiques</h2>
              <button
                onClick={() => refetchAnalyses()}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                Actualiser
              </button>
            </div>

            {!analyses || analyses.length === 0 ? (
              <div className="p-6 text-center text-gray-700">
                Aucune analyse enregistrée
                <div className="mt-2">
                  <Link
                    href={`/laboratoire/analyses?don_id=${donId}`}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Ajouter des analyses →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {["ABO", "RH", "VIH", "VHB", "VHC", "SYPHILIS"].map(
                  (testType) => {
                    const analyse = analyses.find(
                      (a) => a.type_test === testType
                    );
                    return (
                      <div
                        key={testType}
                        className="p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {testType}
                          </div>
                          {analyse && analyse.note && (
                            <div className="text-sm text-gray-800 mt-1">
                              {analyse.note}
                            </div>
                          )}
                        </div>
                        {analyse ? (
                          <span
                            className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              analyse.resultat === "NEGATIF" ||
                              ["A", "B", "AB", "O", "POS", "NEG"].includes(
                                analyse.resultat
                              )
                                ? "bg-green-100 text-green-900"
                                : analyse.resultat === "POSITIF"
                                ? "bg-red-100 text-red-900"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {analyse.resultat}
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-full">
                            Non effectué
                          </span>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Poches associées */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Poches créées</h2>
            </div>

            {!don.poches || don.poches.length === 0 ? (
              <div className="p-6 text-center text-gray-700">
                Aucune poche créée
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {don.poches.map((poche) => (
                  <div
                    key={poche.id}
                    className="p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {poche.type_produit}
                          {poche.groupe_sanguin && ` - ${poche.groupe_sanguin}`}
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          Péremption:{" "}
                          {new Date(poche.date_peremption).toLocaleDateString(
                            "fr-FR"
                          )}
                          {poche.volume_ml && ` • ${poche.volume_ml}ml`}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {poche.emplacement_stock}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            poche.statut_distribution === "DISPONIBLE"
                              ? "bg-green-100 text-green-900"
                              : poche.statut_distribution === "RESERVE"
                              ? "bg-blue-100 text-blue-900"
                              : poche.statut_distribution === "DISTRIBUE"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-900"
                          }`}
                        >
                          {poche.statut_distribution}
                        </span>
                        <span className="text-xs text-gray-500">
                          {poche.statut_stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Libération */}
        <div className="space-y-6">
          {liberation && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Statut de libération
              </h2>

              <div
                className={`p-4 rounded-lg mb-4 ${
                  liberation.liberable
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div
                  className={`text-lg font-semibold mb-2 ${
                    liberation.liberable ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {liberation.liberable ? "✓ Libérable" : "✗ Non libérable"}
                </div>
                {liberation.raison && (
                  <div
                    className={`text-sm ${
                      liberation.liberable
                        ? "text-green-700"
                        : "text-red-700"
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
                </div>
              )}

              {liberation.tests_positifs.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Tests positifs:
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {liberation.tests_positifs.map((test) => (
                      <li key={test}>• {test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {liberation.liberable && (
                <Link
                  href={`/laboratoire/liberation?don_id=${donId}`}
                  className="block w-full mt-4 px-4 py-2 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition"
                >
                  Libérer le don
                </Link>
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
              ⚠️ Règle d'or
            </h3>
            <p className="text-xs text-red-900">
              Aucune poche ne peut être distribuée sans libération biologique
              validée. Tous les tests doivent être NÉGATIF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
