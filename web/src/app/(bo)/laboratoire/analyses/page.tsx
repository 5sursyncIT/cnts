"use client";

import { useDon, useDons, useAnalyses, useCreateAnalyse } from "@cnts/api";
import type { AnalyseCreate } from "@cnts/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

const TESTS_REQUIS = [
  { type: "ABO", label: "Groupe ABO", options: ["A", "B", "AB", "O", "EN_ATTENTE"] },
  { type: "RH", label: "Rhésus", options: ["POS", "NEG", "EN_ATTENTE"] },
  { type: "VIH", label: "VIH", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "VHB", label: "Hépatite B", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "VHC", label: "Hépatite C", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
  { type: "SYPHILIS", label: "Syphilis", options: ["NEGATIF", "POSITIF", "EN_ATTENTE"] },
] as const;

export default function AnalysesPage() {
  const searchParams = useSearchParams();
  const donIdFromUrl = searchParams.get("don_id");

  const [selectedDonId, setSelectedDonId] = useState<string>(donIdFromUrl || "");
  const [searchDin, setSearchDin] = useState("");
  const [formData, setFormData] = useState<Record<string, { resultat: string; note: string }>>({
    ABO: { resultat: "", note: "" },
    RH: { resultat: "", note: "" },
    VIH: { resultat: "", note: "" },
    VHB: { resultat: "", note: "" },
    VHC: { resultat: "", note: "" },
    SYPHILIS: { resultat: "", note: "" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { mutate: createAnalyse } = useCreateAnalyse(apiClient);

  // Charger les dons EN_ATTENTE
  const { data: donsEnAttente } = useDons(apiClient, {
    statut: "EN_ATTENTE",
    limit: 100,
  });

  // Charger le don sélectionné
  const { data: don, refetch: refetchDon } = useDon(
    apiClient,
    selectedDonId || ""
  );

  // Charger les analyses existantes
  const { data: analysesExistantes, refetch: refetchAnalyses } = useAnalyses(
    apiClient,
    { don_id: selectedDonId || undefined }
  );

  // Réinitialiser le formulaire quand on change de don
  useEffect(() => {
    setFormData({
      ABO: { resultat: "", note: "" },
      RH: { resultat: "", note: "" },
      VIH: { resultat: "", note: "" },
      VHB: { resultat: "", note: "" },
      VHC: { resultat: "", note: "" },
      SYPHILIS: { resultat: "", note: "" },
    });
    setSuccessMessage("");
  }, [selectedDonId]);

  // Pré-remplir le groupe sanguin si disponible chez le donneur
  useEffect(() => {
    if (don?.donneur?.groupe_sanguin) {
      const groupe = don.donneur.groupe_sanguin;
      let abo = "";
      let rh = "";

      if (groupe.endsWith("+")) {
        rh = "POS";
        abo = groupe.slice(0, -1);
      } else if (groupe.endsWith("-")) {
        rh = "NEG";
        abo = groupe.slice(0, -1);
      } else {
        abo = groupe;
      }

      setFormData((prev) => {
        // Ne pas écraser si déjà saisi
        if (prev.ABO.resultat && prev.RH.resultat) return prev;

        return {
          ...prev,
          ABO: { ...prev.ABO, resultat: prev.ABO.resultat || abo },
          RH: { ...prev.RH, resultat: prev.RH.resultat || rh },
        };
      });
    }
  }, [don]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDonId) {
      alert("Veuillez sélectionner un don");
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");

    try {
      const promises = TESTS_REQUIS.map(async (test) => {
        const data = formData[test.type];
        if (!data.resultat) return null;

        // Vérifier si l'analyse existe déjà
        const existante = analysesExistantes?.find(
          (a) => a.type_test === test.type
        );
        if (existante) {
          console.log(`Test ${test.type} déjà effectué, skip`);
          return null;
        }

        const payload: AnalyseCreate = {
          don_id: selectedDonId,
          type_test: test.type as any,
          resultat: data.resultat,
          note: data.note || undefined,
        };

        return createAnalyse(payload);
      });

      await Promise.all(promises);

      setSuccessMessage("✓ Analyses enregistrées avec succès");
      setFormData({
        ABO: { resultat: "", note: "" },
        RH: { resultat: "", note: "" },
        VIH: { resultat: "", note: "" },
        VHB: { resultat: "", note: "" },
        VHC: { resultat: "", note: "" },
        SYPHILIS: { resultat: "", note: "" },
      });
      refetchAnalyses();
      refetchDon();

      // Rediriger vers libération si toutes les analyses sont complètes
      setTimeout(() => {
        window.location.href = `/laboratoire/liberation?don_id=${selectedDonId}`;
      }, 1500);
    } catch (err) {
      console.error("Erreur création analyses:", err);
      alert("Erreur lors de l'enregistrement des analyses");
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Saisie des Analyses Biologiques</h1>
        <p className="text-gray-700 mt-1">
          Enregistrement des résultats de tests pour validation biologique
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          {/* Sélection du don */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                Ou sélectionner dans la liste
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

          {/* Formulaire de saisie */}
          {selectedDonId && don && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-sm font-medium text-green-900">
                    {successMessage}
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold mb-4">
                Résultats des analyses
              </h2>

              <div className="space-y-6">
                {TESTS_REQUIS.map((test) => {
                  const existante = analysesExistantes?.find(
                    (a) => a.type_test === test.type
                  );

                  return (
                    <div key={test.type} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <label className="block text-sm font-medium text-gray-900">
                          {test.label}
                          {!existante && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </label>
                        {existante && (
                          <span className="text-xs bg-green-100 text-green-900 px-2 py-1 rounded">
                            ✓ Déjà effectué: {existante.resultat}
                          </span>
                        )}
                      </div>

                      {!existante && (
                        <>
                          <select
                            value={formData[test.type].resultat}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [test.type]: {
                                  ...formData[test.type],
                                  resultat: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-gray-900"
                          >
                            <option value="">-- Sélectionner --</option>
                            {test.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            value={formData[test.type].note}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [test.type]: {
                                  ...formData[test.type],
                                  note: e.target.value,
                                },
                              })
                            }
                            placeholder="Note (optionnelle)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Link
                  href="/laboratoire"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !selectedDonId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer les analyses"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {don && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Don sélectionné</h3>
              <dl className="space-y-3 text-sm">
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
                  <dt className="text-gray-500">Statut</dt>
                  <dd>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-900 rounded text-xs">
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

          {analysesExistantes && analysesExistantes.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2 text-sm">
                Analyses déjà effectuées
              </h3>
              <ul className="text-xs text-green-900 space-y-1">
                {analysesExistantes.map((a) => (
                  <li key={a.id}>
                    • {a.type_test}: {a.resultat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Tests obligatoires
            </h3>
            <ul className="text-xs text-blue-900 space-y-1">
              <li>• Groupage: ABO + Rhésus</li>
              <li>• Sérologie: VIH, VHB, VHC, Syphilis</li>
              <li>• Tous doivent être NÉGATIF pour libération</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
