"use client";

import { useDonneurs } from "@cnts/api";
import Link from "next/link";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DonneursPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sexeFilter, setSexeFilter] = useState<"H" | "F" | "">("");
  const [groupeFilter, setGroupeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const REGIONS_SENEGAL = [
    "Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", 
    "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", 
    "Thiès", "Ziguinchor"
  ];

  const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sexeFilter, groupeFilter, regionFilter]);

  const { data: donneurs, status, error, refetch } = useDonneurs(apiClient, {
    q: searchQuery || undefined,
    sexe: (sexeFilter || undefined) as "H" | "F" | undefined,
    groupe_sanguin: groupeFilter || undefined,
    region: regionFilter || undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Donneurs</h1>
          <p className="text-gray-600 mt-1">
            Liste des donneurs enregistrés dans le système
          </p>
        </div>
        <Link
          href="/donneurs/nouveau"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Nouveau Donneur
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, prénom..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexe
            </label>
            <select
              value={sexeFilter}
              onChange={(e) => setSexeFilter(e.target.value as "H" | "F" | "")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="H">Homme</option>
              <option value="F">Femme</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupe
            </label>
            <select
              value={groupeFilter}
              onChange={(e) => setGroupeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {GROUPES_SANGUINS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Région
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes</option>
              {REGIONS_SENEGAL.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste des donneurs */}
      <div className="bg-white rounded-lg shadow">
        {status === "loading" && (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Erreur de chargement</div>
            <div className="text-sm text-gray-600">
              {error?.status ? `Erreur ${error.status}` : "Erreur inconnue"}
            </div>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === "success" && donneurs && donneurs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Aucun donneur trouvé
          </div>
        )}

        {status === "success" && donneurs && donneurs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom & Prénom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sexe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groupe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Région
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernier Don
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNI Hash
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donneurs.map((donneur) => (
                  <tr
                    key={donneur.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {donneur.nom}, {donneur.prenom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          donneur.sexe === "H"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-pink-100 text-pink-800"
                        }`}
                      >
                        {donneur.sexe === "H" ? "Homme" : "Femme"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donneur.groupe_sanguin || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donneur.region || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {donneur.dernier_don
                        ? new Date(donneur.dernier_don).toLocaleDateString(
                            "fr-FR"
                          )
                        : "Jamais"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {donneur.cni_hash.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/donneurs/${donneur.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/donneurs/${donneur.id}/eligibilite`}
                        className="text-green-600 hover:text-green-900"
                      >
                        Éligibilité
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {status === "success" && (
        <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">
            Page {page} • {donneurs?.length || 0} résultats affichés
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!donneurs || donneurs.length < ITEMS_PER_PAGE}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
