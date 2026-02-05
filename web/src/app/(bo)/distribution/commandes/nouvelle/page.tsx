"use client";

import { useHopitaux, useCreateCommande } from "@cnts/api";
import type { LigneCommandeCreate } from "@cnts/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function NouvelleCommandePage() {
  const router = useRouter();

  const [hopitalId, setHopitalId] = useState<string>("");
  const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState<string>("");
  const [lignes, setLignes] = useState<LigneCommandeCreate[]>([
    { type_produit: "CGR", groupe_sanguin: "A_POS", quantite: 1 },
  ]);

  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 200,
  });

  const { mutate: createCommande, status: createStatus, error: createError } =
    useCreateCommande(apiClient);

  // Ajouter une ligne
  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      { type_produit: "CGR", groupe_sanguin: "A_POS", quantite: 1 },
    ]);
  };

  // Supprimer une ligne
  const supprimerLigne = (index: number) => {
    if (lignes.length === 1) {
      alert("Une commande doit contenir au moins une ligne");
      return;
    }
    setLignes(lignes.filter((_, i) => i !== index));
  };

  // Modifier une ligne
  const modifierLigne = (
    index: number,
    field: keyof LigneCommandeCreate,
    value: any
  ) => {
    const nouvellesLignes = [...lignes];
    nouvellesLignes[index] = {
      ...nouvellesLignes[index],
      [field]: value,
    };
    setLignes(nouvellesLignes);
  };

  // Calculer le total de poches
  const totalPoches = lignes.reduce((sum, l) => sum + l.quantite, 0);

  // Soumettre la commande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hopitalId) {
      alert("Veuillez sélectionner un hôpital");
      return;
    }

    if (lignes.length === 0) {
      alert("Veuillez ajouter au moins une ligne");
      return;
    }

    try {
      const commande = await createCommande({
        hopital_id: hopitalId,
        date_livraison_prevue: dateLivraisonPrevue || undefined,
        lignes: lignes.map((l) => ({
          ...l,
          groupe_sanguin: l.groupe_sanguin || undefined,
        })),
      });

      router.push(`/distribution/commandes/${commande.id}`);
    } catch (err) {
      console.error("Erreur création commande:", err);
    }
  };

  const GROUPES_SANGUINS = [
    { value: "A_POS", label: "A+" },
    { value: "A_NEG", label: "A-" },
    { value: "B_POS", label: "B+" },
    { value: "B_NEG", label: "B-" },
    { value: "AB_POS", label: "AB+" },
    { value: "AB_NEG", label: "AB-" },
    { value: "O_POS", label: "O+" },
    { value: "O_NEG", label: "O-" },
  ];

  const TYPES_PRODUITS = [
    { value: "ST", label: "Sang Total (ST)" },
    { value: "CGR", label: "Concentré Globules Rouges (CGR)" },
    { value: "PFC", label: "Plasma Frais Congelé (PFC)" },
    { value: "CP", label: "Concentré Plaquettaire (CP)" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/distribution/commandes"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour aux commandes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle Commande</h1>
        <p className="text-gray-700 mt-1">
          Créer une demande de sang pour un hôpital
        </p>
      </div>

      {/* Erreur globale */}
      {createStatus === "error" && createError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-900">
            Erreur lors de la création
          </div>
          <div className="text-sm text-red-600 mt-1">
            {createError.status === 404
              ? "Hôpital introuvable"
              : `Erreur ${createError.status}: ${JSON.stringify(
                  createError.body
                )}`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Informations générales
              </h2>

              <div className="space-y-4">
                {/* Hôpital */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hôpital destinataire <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={hopitalId}
                    onChange={(e) => setHopitalId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Sélectionner un hôpital --</option>
                    {hopitaux?.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nom}
                        {h.convention_actif ? "" : " (Convention inactive)"}
                      </option>
                    ))}
                  </select>
                  {hopitaux?.length === 0 && (
                    <p className="mt-2 text-sm text-gray-800">
                      Aucun hôpital disponible.{" "}
                      <Link
                        href="/distribution/hopitaux/nouveau"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Créer un hôpital →
                      </Link>
                    </p>
                  )}
                </div>

                {/* Date de livraison */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de livraison prévue (optionnel)
                  </label>
                  <input
                    type="date"
                    value={dateLivraisonPrevue}
                    onChange={(e) => setDateLivraisonPrevue(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Lignes de commande */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lignes de commande</h2>
                <button
                  type="button"
                  onClick={ajouterLigne}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  + Ajouter une ligne
                </button>
              </div>

              <div className="space-y-4">
                {lignes.map((ligne, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Ligne {index + 1}
                      </span>
                      {lignes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => supprimerLigne(index)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Type de produit */}
                      <div>
                        <label className="block text-xs text-gray-800 mb-1">
                          Type de produit
                        </label>
                        <select
                          value={ligne.type_produit}
                          onChange={(e) =>
                            modifierLigne(index, "type_produit", e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {TYPES_PRODUITS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Groupe sanguin */}
                      <div>
                        <label className="block text-xs text-gray-800 mb-1">
                          Groupe sanguin
                        </label>
                        <select
                          value={ligne.groupe_sanguin || ""}
                          onChange={(e) =>
                            modifierLigne(
                              index,
                              "groupe_sanguin",
                              e.target.value || undefined
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Indifférent --</option>
                          {GROUPES_SANGUINS.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantité */}
                      <div>
                        <label className="block text-xs text-gray-800 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          value={ligne.quantite}
                          onChange={(e) =>
                            modifierLigne(
                              index,
                              "quantite",
                              parseInt(e.target.value, 10)
                            )
                          }
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-900 font-medium">
                    Total de poches demandées:
                  </span>
                  <span className="text-blue-900 font-bold">{totalPoches}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-end gap-3">
                <Link
                  href="/distribution/commandes"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={createStatus === "loading" || !hopitalId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createStatus === "loading"
                    ? "Création..."
                    : "Créer la commande"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm">
              Workflow de commande
            </h3>
            <ul className="text-xs text-blue-900 space-y-1">
              <li>1. Créer la commande (statut BROUILLON)</li>
              <li>2. Valider la commande (réserve les poches)</li>
              <li>3. Affecter les receveurs (cross-matching)</li>
              <li>4. Servir la commande (marque DISTRIBUE)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2 text-sm">
              ⚠️ Réservation automatique
            </h3>
            <p className="text-xs text-yellow-900">
              Lors de la validation, les poches seront automatiquement réservées
              selon FEFO (First Expired, First Out) parmi les poches DISPONIBLE.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 mb-2 text-sm">
              Groupes sanguins compatibles
            </h3>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• <strong>O-</strong>: Donneur universel</li>
              <li>• <strong>AB+</strong>: Receveur universel</li>
              <li>• <strong>A</strong> reçoit: A, O</li>
              <li>• <strong>B</strong> reçoit: B, O</li>
              <li>• <strong>+</strong> reçoit: + ou -</li>
              <li>• <strong>-</strong> reçoit: - seulement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
