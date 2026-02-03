"use client";

import {
  usePochesStock,
  useRecettes,
  useFractionner,
  useFractionnerAvecRecette,
} from "@cnts/api";
import type { ComposantFractionnement } from "@cnts/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export default function FractionnementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pocheIdFromUrl = searchParams.get("poche_id");

  const [selectedPocheId, setSelectedPocheId] = useState<string>(
    pocheIdFromUrl || ""
  );
  const [mode, setMode] = useState<"recette" | "manuel">("recette");
  const [selectedRecetteCode, setSelectedRecetteCode] = useState<string>("");
  const [composants, setComposants] = useState<ComposantFractionnement[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { mutate: fractionner } = useFractionner(apiClient);
  const { mutate: fractionnerAvecRecette } = useFractionnerAvecRecette(apiClient);

  // Charger les poches ST EN_STOCK
  const { data: pochesDisponibles } = usePochesStock(apiClient, {
    type_produit: "ST",
    statut_stock: "EN_STOCK",
    limit: 100,
  });

  // Charger les recettes actives
  const { data: recettes } = useRecettes(apiClient, { actif: true });

  // Trouver la poche sélectionnée
  const pocheSelectionnee = pochesDisponibles?.find(
    (p) => p.id === selectedPocheId
  );

  // Trouver la recette sélectionnée
  const recetteSelectionnee = recettes?.find(
    (r) => r.code === selectedRecetteCode
  );

  // Initialiser les composants avec la recette sélectionnée
  useEffect(() => {
    if (mode === "recette" && recetteSelectionnee) {
      setComposants(
        recetteSelectionnee.composants.map((c) => ({
          type_produit: c.type_produit as "CGR" | "PFC" | "CP",
          volume_ml: c.volume_ml,
        }))
      );
    }
  }, [mode, recetteSelectionnee]);

  // Ajouter un composant manuel
  const ajouterComposant = () => {
    setComposants([
      ...composants,
      { type_produit: "CGR", volume_ml: 280 },
    ]);
  };

  // Supprimer un composant
  const supprimerComposant = (index: number) => {
    setComposants(composants.filter((_, i) => i !== index));
  };

  // Modifier un composant
  const modifierComposant = (
    index: number,
    field: keyof ComposantFractionnement,
    value: any
  ) => {
    const nouveauxComposants = [...composants];
    nouveauxComposants[index] = {
      ...nouveauxComposants[index],
      [field]: value,
    };
    setComposants(nouveauxComposants);
  };

  // Calculer le volume total
  const volumeTotal = composants.reduce((sum, c) => sum + c.volume_ml, 0);

  // Soumettre le fractionnement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPocheId) {
      alert("Veuillez sélectionner une poche source");
      return;
    }

    if (composants.length === 0) {
      alert("Veuillez ajouter au moins un composant");
      return;
    }

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (mode === "recette" && selectedRecetteCode) {
        // Fractionnement avec recette
        const result = await fractionnerAvecRecette({
          code: selectedRecetteCode,
          data: {
            source_poche_id: selectedPocheId,
          },
        });
        setSuccessMessage(
          `✓ Fractionnement réussi: ${result.poches.length} poche(s) créée(s)`
        );
      } else {
        // Fractionnement manuel
        const result = await fractionner({
          source_poche_id: selectedPocheId,
          composants,
        });
        setSuccessMessage(
          `✓ Fractionnement réussi: ${result.poches.length} poche(s) créée(s)`
        );
      }

      // Rediriger vers le stock après 2 secondes
      setTimeout(() => {
        router.push("/stock");
      }, 2000);
    } catch (err: any) {
      console.error("Erreur fractionnement:", err);
      setErrorMessage(
        err.message || "Erreur lors du fractionnement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/stock"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Retour au stock
        </Link>
        <h1 className="text-2xl font-bold">Fractionnement de Sang Total</h1>
        <p className="text-gray-600 mt-1">
          Séparation d'une poche ST en composants sanguins (CGR, PFC, CP)
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm font-medium text-green-800">
            {successMessage}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Redirection vers le stock...
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-800">
            Erreur de fractionnement
          </div>
          <div className="text-sm text-red-600 mt-1">{errorMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de la poche source */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Poche source</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une poche ST en stock
                  <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedPocheId}
                  onChange={(e) => setSelectedPocheId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choisir une poche --</option>
                  {pochesDisponibles?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.groupe_sanguin || "?"} - {p.volume_ml || "?"}ml - Exp:{" "}
                      {new Date(p.date_peremption).toLocaleDateString("fr-FR")}
                    </option>
                  ))}
                </select>
                {pochesDisponibles?.length === 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    Aucune poche ST disponible pour fractionnement
                  </p>
                )}
              </div>
            </div>

            {/* Mode de fractionnement */}
            {selectedPocheId && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Mode de fractionnement
                </h2>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setMode("recette")}
                    className={`flex-1 px-4 py-2 rounded-md transition ${
                      mode === "recette"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Recette prédéfinie
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("manuel");
                      setComposants([]);
                    }}
                    className={`flex-1 px-4 py-2 rounded-md transition ${
                      mode === "manuel"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Manuel
                  </button>
                </div>

                {/* Mode recette */}
                {mode === "recette" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner une recette
                    </label>
                    <select
                      value={selectedRecetteCode}
                      onChange={(e) => setSelectedRecetteCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={mode === "recette"}
                    >
                      <option value="">-- Choisir une recette --</option>
                      {recettes?.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.libelle} ({r.composants.length} composant(s))
                        </option>
                      ))}
                    </select>
                    {recettes?.length === 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Aucune recette active.{" "}
                        <Link
                          href="/stock/recettes"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Créer une recette →
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                {/* Composants (recette ou manuel) */}
                {((mode === "recette" && recetteSelectionnee) ||
                  mode === "manuel") && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Composants à créer
                      </h3>
                      {mode === "manuel" && (
                        <button
                          type="button"
                          onClick={ajouterComposant}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Ajouter
                        </button>
                      )}
                    </div>

                    {composants.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">
                        Aucun composant défini
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {composants.map((composant, index) => (
                          <div
                            key={index}
                            className="flex gap-3 items-start p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1">
                                Type
                              </label>
                              <select
                                value={composant.type_produit}
                                onChange={(e) =>
                                  modifierComposant(
                                    index,
                                    "type_produit",
                                    e.target.value
                                  )
                                }
                                disabled={mode === "recette"}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              >
                                <option value="CGR">CGR</option>
                                <option value="PFC">PFC</option>
                                <option value="CP">CP</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-600 mb-1">
                                Volume (ml)
                              </label>
                              <input
                                type="number"
                                value={composant.volume_ml}
                                onChange={(e) =>
                                  modifierComposant(
                                    index,
                                    "volume_ml",
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                disabled={mode === "recette"}
                                min="1"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                            </div>
                            {mode === "manuel" && (
                              <button
                                type="button"
                                onClick={() => supprimerComposant(index)}
                                className="mt-6 text-red-600 hover:text-red-800 text-sm"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Volume total */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-900 font-medium">
                          Volume total des composants:
                        </span>
                        <span className="text-blue-900 font-bold">
                          {volumeTotal}ml
                        </span>
                      </div>
                      {pocheSelectionnee && (
                        <div className="flex justify-between text-xs text-blue-700 mt-1">
                          <span>Volume source:</span>
                          <span>{pocheSelectionnee.volume_ml || "?"}ml</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {selectedPocheId && composants.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-end gap-3">
                  <Link
                    href="/stock"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {submitting
                      ? "Fractionnement..."
                      : "Fractionner la poche"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {pocheSelectionnee && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Poche sélectionnée</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900">
                    {pocheSelectionnee.type_produit}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Groupe sanguin</dt>
                  <dd className="font-medium text-gray-900">
                    {pocheSelectionnee.groupe_sanguin || "Non déterminé"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Volume</dt>
                  <dd className="font-medium text-gray-900">
                    {pocheSelectionnee.volume_ml || "?"}ml
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Péremption</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(
                      pocheSelectionnee.date_peremption
                    ).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Emplacement</dt>
                  <dd className="font-medium text-gray-900">
                    {pocheSelectionnee.emplacement_stock}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/dons/${pocheSelectionnee.don_id}`}
                className="block mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Voir le don →
              </Link>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Produits dérivés du sang
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>
                <strong>CGR</strong>: Concentré Globules Rouges (~280ml, 42j)
              </li>
              <li>
                <strong>PFC</strong>: Plasma Frais Congelé (~220ml, 365j)
              </li>
              <li>
                <strong>CP</strong>: Concentré Plaquettaire (~50ml, 5j)
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2 text-sm">
              ⚠️ Règles de fractionnement
            </h3>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• Seules les poches ST peuvent être fractionnées</li>
              <li>• La poche doit être EN_STOCK</li>
              <li>• Volume total ≤ volume source + tolérance (250ml)</li>
              <li>• Péremption calculée selon règles produit</li>
              <li>• Action irréversible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
