"use client";

import { useDons, useDonneurs } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DonsPage() {
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [donneurIdFilter, setDonneurIdFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: dons, status, error, refetch } = useDons(apiClient, {
    statut: statutFilter || undefined,
    donneur_id: donneurIdFilter || undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  // Charger les donneurs pour le filtre
  const { data: donneurs } = useDonneurs(apiClient, { limit: 200 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Dons</h1>
          <p className="text-gray-700 mt-1">
            Historique des dons de sang collectés
          </p>
        </div>
        <Link
          href="/dons/nouveau"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          + Nouveau Don
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Donneur
            </label>
            <select
              value={donneurIdFilter}
              onChange={(e) => {
                setDonneurIdFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous les donneurs</option>
              {donneurs?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}, {d.prenom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="LIBERE">Libéré</option>
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

      {/* Statistiques rapides */}
      {status === "success" && dons && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-700 mb-1">Total dons</div>
            <div className="text-2xl font-bold text-gray-900">{dons.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-700 mb-1">En attente</div>
            <div className="text-2xl font-bold text-yellow-900">
              {dons.filter((d) => d.statut_qualification === "EN_ATTENTE").length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-700 mb-1">Libérés</div>
            <div className="text-2xl font-bold text-green-900">
              {dons.filter((d) => d.statut_qualification === "LIBERE").length}
            </div>
          </div>
        </div>
      )}

      {/* Liste des dons */}
      <div className="bg-white rounded-lg shadow">
        {status === "loading" && (
          <div className="p-8 text-center text-gray-700">Chargement...</div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Erreur de chargement</div>
            <div className="text-sm text-gray-800">
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

        {status === "success" && dons && dons.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            Aucun don trouvé
          </div>
        )}

        {status === "success" && dons && dons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    DIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date du don
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Poches
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dons.map((don) => (
                  <tr key={don.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dons/${don.id}`}
                        className="text-sm font-mono text-blue-600 hover:text-blue-900"
                      >
                        {don.din}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(don.date_don).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {don.type_don}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${don.statut_qualification === "LIBERE"
                            ? "bg-green-100 text-green-900"
                            : "bg-yellow-100 text-yellow-900"
                          }`}
                      >
                        {don.statut_qualification === "LIBERE"
                          ? "✓ Libéré"
                          : "⏳ En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {don.poches ? `${don.poches.length} poche(s)` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dons/${don.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Voir
                      </Link>
                      <Link
                        href={`/donneurs/${don.donneur_id}`}
                        className="text-gray-800 hover:text-gray-900"
                      >
                        Donneur
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
          <div className="text-sm text-gray-800">
            Page {page} • {dons?.length || 0} résultats affichés
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
              disabled={!dons || dons.length < ITEMS_PER_PAGE}
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
