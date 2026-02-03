"use client";

import { usePoches, usePochesStock } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function StockPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statutFilter, setStatutFilter] = useState<string>("EN_STOCK");
  const [sortByExpiration, setSortByExpiration] = useState(true);

  // Charger les poches en stock
  const { data: poches, status, error, refetch } = usePochesStock(apiClient, {
    type_produit: typeFilter || undefined,
    statut_stock: statutFilter || undefined,
    limit: 500,
  });

  // Trier par date de péremption si activé
  const sortedPoches = poches
    ? [...poches].sort((a, b) => {
        if (!sortByExpiration) return 0;
        return (
          new Date(a.date_peremption).getTime() -
          new Date(b.date_peremption).getTime()
        );
      })
    : [];

  // Calculer les statistiques
  const stats = sortedPoches.reduce(
    (acc, poche) => {
      acc.total++;
      if (poche.type_produit === "ST") acc.st++;
      if (poche.type_produit === "CGR") acc.cgr++;
      if (poche.type_produit === "PFC") acc.pfc++;
      if (poche.type_produit === "CP") acc.cp++;
      if (poche.statut_distribution === "DISPONIBLE") acc.disponible++;

      // Alertes péremption (7 jours)
      const daysUntilExpiry = Math.ceil(
        (new Date(poche.date_peremption).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) {
        acc.expiringSoon++;
      }
      if (daysUntilExpiry < 0) {
        acc.expired++;
      }

      return acc;
    },
    {
      total: 0,
      st: 0,
      cgr: 0,
      pfc: 0,
      cp: 0,
      disponible: 0,
      expiringSoon: 0,
      expired: 0,
    }
  );

  // Calculer les jours jusqu'à péremption
  const getDaysUntilExpiry = (datePeremption: string) => {
    return Math.ceil(
      (new Date(datePeremption).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion du Stock</h1>
          <p className="text-gray-600 mt-1">
            Inventaire des poches de sang et fractionnement
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/stock/regles"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Règles produits
          </Link>
          <Link
            href="/stock/fractionnement"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            + Fractionner
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      {status === "success" && poches && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-xs text-red-600 mb-1">ST</div>
            <div className="text-2xl font-bold text-red-900">{stats.st}</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-xs text-orange-600 mb-1">CGR</div>
            <div className="text-2xl font-bold text-orange-900">{stats.cgr}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-xs text-yellow-600 mb-1">PFC</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.pfc}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-xs text-blue-600 mb-1">CP</div>
            <div className="text-2xl font-bold text-blue-900">{stats.cp}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-xs text-green-600 mb-1">Disponible</div>
            <div className="text-2xl font-bold text-green-900">
              {stats.disponible}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-xs text-orange-600 mb-1">Expire {"<"}7j</div>
            <div className="text-2xl font-bold text-orange-900">
              {stats.expiringSoon}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-xs text-red-600 mb-1">Expiré</div>
            <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de produit
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les types</option>
              <option value="ST">Sang Total (ST)</option>
              <option value="CGR">Concentré Globules Rouges (CGR)</option>
              <option value="PFC">Plasma Frais Congelé (PFC)</option>
              <option value="CP">Concentré Plaquettaire (CP)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut stock
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="EN_STOCK">En stock</option>
              <option value="FRACTIONNEE">Fractionnée</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sort-fefo"
              checked={sortByExpiration}
              onChange={(e) => setSortByExpiration(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sort-fefo" className="text-sm text-gray-700">
              Tri FEFO (péremption)
            </label>
          </div>

          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste des poches */}
      <div className="bg-white rounded-lg shadow">
        {status === "loading" && (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
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

        {status === "success" && sortedPoches.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Aucune poche en stock
          </div>
        )}

        {status === "success" && sortedPoches.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groupe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Péremption
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emplacement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut Distrib.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPoches.map((poche) => {
                  const daysUntilExpiry = getDaysUntilExpiry(poche.date_peremption);
                  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                  const isExpired = daysUntilExpiry < 0;

                  return (
                    <tr
                      key={poche.id}
                      className={`hover:bg-gray-50 transition ${
                        isExpired
                          ? "bg-red-50"
                          : isExpiringSoon
                          ? "bg-orange-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            poche.type_produit === "ST"
                              ? "bg-red-100 text-red-800"
                              : poche.type_produit === "CGR"
                              ? "bg-orange-100 text-orange-800"
                              : poche.type_produit === "PFC"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {poche.type_produit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {poche.groupe_sanguin || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {poche.volume_ml ? `${poche.volume_ml}ml` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div
                          className={
                            isExpired
                              ? "text-red-600 font-semibold"
                              : isExpiringSoon
                              ? "text-orange-600 font-semibold"
                              : "text-gray-900"
                          }
                        >
                          {new Date(poche.date_peremption).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isExpired
                            ? `Expiré (${Math.abs(daysUntilExpiry)}j)`
                            : `${daysUntilExpiry}j restant`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {poche.emplacement_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            poche.statut_stock === "EN_STOCK"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {poche.statut_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            poche.statut_distribution === "DISPONIBLE"
                              ? "bg-green-100 text-green-800"
                              : poche.statut_distribution === "RESERVE"
                              ? "bg-blue-100 text-blue-800"
                              : poche.statut_distribution === "DISTRIBUE"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {poche.statut_distribution}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {poche.type_produit === "ST" &&
                          poche.statut_stock === "EN_STOCK" && (
                            <Link
                              href={`/stock/fractionnement?poche_id=${poche.id}`}
                              className="text-purple-600 hover:text-purple-900 mr-4"
                            >
                              Fractionner
                            </Link>
                          )}
                        <Link
                          href={`/dons/${poche.don_id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Voir don
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {status === "success" && sortedPoches && (
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>{sortedPoches.length} poche(s) affichée(s)</div>
          {sortByExpiration && (
            <div className="text-xs bg-blue-50 border border-blue-200 rounded px-3 py-1">
              ℹ️ Tri FEFO activé (First Expired, First Out)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
