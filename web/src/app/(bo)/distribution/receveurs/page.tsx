"use client";

import { useCreateReceveur, useReceveurs, useUpdateReceveur, useDeleteReceveur, useHopitaux } from "@cnts/api";
import type { Receveur } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

const GROUPES_SANGUINS = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

export default function ReceveursPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingReceveur, setEditingReceveur] = useState<Receveur | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    sexe: "M",
    date_naissance: "",
    adresse: "",
    telephone: "",
    groupe_sanguin: "",
    hopital_id: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Queries and Mutations
  const { data: receveurs, status, refetch } = useReceveurs(apiClient, {
    limit: 100,
  });

  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 100,
  });
  
  const createMutation = useCreateReceveur(apiClient);
  const updateMutation = useUpdateReceveur(apiClient);
  const deleteMutation = useDeleteReceveur(apiClient);

  const handleOpenCreate = () => {
    setEditingReceveur(null);
    setFormData({
      nom: "",
      prenom: "",
      sexe: "M",
      date_naissance: "",
      adresse: "",
      telephone: "",
      groupe_sanguin: "",
      hopital_id: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (receveur: Receveur) => {
    setEditingReceveur(receveur);
    setFormData({
      nom: receveur.nom || "",
      prenom: receveur.prenom || "",
      sexe: receveur.sexe || "M",
      date_naissance: receveur.date_naissance || "",
      adresse: receveur.adresse || "",
      telephone: receveur.telephone || "",
      groupe_sanguin: receveur.groupe_sanguin || "",
      hopital_id: receveur.hopital_id || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingReceveur(null);
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce receveur ?")) {
      try {
        await deleteMutation.mutate(id);
        await refetch();
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom || undefined,
        sexe: (formData.sexe as "H" | "F") || undefined,
        date_naissance: formData.date_naissance || undefined,
        adresse: formData.adresse || undefined,
        telephone: formData.telephone || undefined,
        hopital_id: formData.hopital_id || undefined,
        groupe_sanguin: formData.groupe_sanguin || undefined,
      };

      if (editingReceveur) {
        await updateMutation.mutate({
          id: editingReceveur.id,
          data: payload,
        });
      } else {
        await createMutation.mutate(payload);
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
          <h1 className="text-2xl font-bold text-gray-900">Receveurs</h1>
          <p className="text-gray-700 mt-1">
            Gestion des patients receveurs de produits sanguins
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Ajouter un receveur
        </button>
      </div>

      {/* Loading / Error States */}
      {status === "loading" && (
        <div className="text-center py-10 text-gray-500">Chargement...</div>
      )}

      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          Erreur lors du chargement des receveurs.
        </div>
      )}

      {/* Table */}
      {status === "success" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nom du patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Groupe Sanguin
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact / Adresse
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receveurs?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-700">
                    Aucun receveur trouvé.
                  </td>
                </tr>
              )}
              {receveurs?.map((receveur) => (
                <tr key={receveur.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {receveur.prenom} {receveur.nom}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {receveur.sexe === "H" ? "Homme" : "Femme"} • {receveur.date_naissance ? new Date(receveur.date_naissance).toLocaleDateString() : "Né(e) inconnu"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {receveur.groupe_sanguin ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-900">
                        {receveur.groupe_sanguin}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Inconnu</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{receveur.hopital?.nom || "-"}</div>
                    <div className="truncate max-w-xs">{receveur.adresse || "-"}</div>
                    <div className="text-xs text-gray-400">{receveur.telephone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenEdit(receveur)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(receveur.id)}
                      className="text-red-700 hover:text-red-900 font-semibold hover:underline"
                    >
                      Supprimer
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
              {editingReceveur ? "Modifier le receveur" : "Ajouter un receveur"}
            </h2>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Établissement de soin (Hôpital/Clinique)
                </label>
                <select
                  value={formData.hopital_id}
                  onChange={(e) =>
                    setFormData({ ...formData, hopital_id: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun / Non spécifié</option>
                  {hopitaux?.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Moussa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Diop"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexe *
                  </label>
                  <select
                    value={formData.sexe}
                    onChange={(e) =>
                      setFormData({ ...formData, sexe: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) =>
                      setFormData({ ...formData, date_naissance: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Adresse complète"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) =>
                      setFormData({ ...formData, telephone: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 77 000 00 00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Groupe Sanguin
                  </label>
                  <select
                    value={formData.groupe_sanguin}
                    onChange={(e) =>
                      setFormData({ ...formData, groupe_sanguin: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Inconnu / A déterminer</option>
                    {GROUPES_SANGUINS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
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
