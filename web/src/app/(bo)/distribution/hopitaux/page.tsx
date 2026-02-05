"use client";

import { useCreateHopital, useHopitaux, useUpdateHopital } from "@cnts/api";
import type { Hopital } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function HopitauxPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingHopital, setEditingHopital] = useState<Hopital | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    contact: "",
    convention_actif: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Queries and Mutations
  const { data: hopitaux, status, refetch } = useHopitaux(apiClient, {
    limit: 100,
  });

  const createMutation = useCreateHopital(apiClient);
  const updateMutation = useUpdateHopital(apiClient);

  const handleOpenCreate = () => {
    setEditingHopital(null);
    setFormData({
      nom: "",
      adresse: "",
      contact: "",
      convention_actif: true,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (hopital: Hopital) => {
    setEditingHopital(hopital);
    setFormData({
      nom: hopital.nom,
      adresse: hopital.adresse || "",
      contact: hopital.contact || "",
      convention_actif: hopital.convention_actif,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingHopital(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingHopital) {
        await updateMutation.mutate({
          id: editingHopital.id,
          data: {
            nom: formData.nom,
            adresse: formData.adresse || undefined,
            contact: formData.contact || undefined,
            convention_actif: formData.convention_actif,
          },
        });
      } else {
        await createMutation.mutate({
          nom: formData.nom,
          adresse: formData.adresse || undefined,
          contact: formData.contact || undefined,
          convention_actif: formData.convention_actif,
        });
      }

      await refetch();
      handleClose();
    } catch (err: any) {
      setFormError(err.body?.detail || "Une erreur est survenue");
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/distribution"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Retour distribution
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hôpitaux et Partenaires</h1>
          <p className="text-gray-700 mt-1">
            Gestion des établissements de santé conventionnés
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Ajouter un hôpital
        </button>
      </div>

      {/* Loading / Error States */}
      {status === "loading" && (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      )}

      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          Erreur lors du chargement des hôpitaux.
        </div>
      )}

      {/* Table */}
      {status === "success" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nom de l'établissement
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact / Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hopitaux?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-700">
                    Aucun hôpital trouvé.
                  </td>
                </tr>
              )}
              {hopitaux?.map((hopital) => (
                <tr key={hopital.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{hopital.nom}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {hopital.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {hopital.contact || "-"}
                    </div>
                    <div className="text-sm text-gray-700 truncate max-w-xs">
                      {hopital.adresse}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hopital.convention_actif ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-900">
                        Convention Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEdit(hopital)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingHopital ? "Modifier l'hôpital" : "Ajouter un hôpital"}
            </h2>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'établissement *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Hôpital Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact (Téléphone / Email)
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: +221 77..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Adresse complète..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="convention_actif"
                  checked={formData.convention_actif}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      convention_actif: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="convention_actif"
                  className="text-sm font-medium text-gray-700"
                >
                  Convention active (peut recevoir des produits)
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
