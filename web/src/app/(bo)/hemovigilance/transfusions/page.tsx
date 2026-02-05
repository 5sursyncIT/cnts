"use client";

import { useActesTransfusionnels, useHopitaux, useReceveurs } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function TransfusionsPage() {
  // Filtres
  const [dinFilter, setDinFilter] = useState("");
  const [hopitalFilter, setHopitalFilter] = useState("");
  const [receveurFilter, setReceveurFilter] = useState("");

  // Requêtes API
  const { data: actes, status } = useActesTransfusionnels(apiClient, {
    din: dinFilter || undefined,
    hopital_id: hopitalFilter || undefined,
    receveur_id: receveurFilter || undefined,
    limit: 100,
  });

  const { data: hopitaux } = useHopitaux(apiClient, { limit: 100 });
  const { data: receveurs } = useReceveurs(apiClient, { limit: 100 });

  // Helpers pour l'affichage
  const getHopitalName = (id: string | null) => {
    if (!id) return "-";
    return hopitaux?.find((h) => h.id === id)?.nom || "Inconnu";
  };

  const getReceveurName = (id: string | null) => {
    if (!id) return "-";
    const r = receveurs?.find((r) => r.id === id);
    return r ? `${r.prenom || ""} ${r.nom || ""}`.trim() || r.nom : "Inconnu";
  };

  const getTypeLabel = (type: string | undefined) => {
    const labels: Record<string, string> = {
      ST: "Sang Total",
      CGR: "CGR",
      PFC: "PFC",
      CP: "CP",
    };
    return type ? labels[type] || type : "-";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/hemovigilance"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Retour hémovigilance
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi Transfusionnel</h1>
          <p className="text-gray-700 mt-1">
            Historique et traçabilité des actes transfusionnels
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher par DIN
            </label>
            <input
              type="text"
              value={dinFilter}
              onChange={(e) => setDinFilter(e.target.value)}
              placeholder="Ex: 23-123456"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par Hôpital
            </label>
            <select
              value={hopitalFilter}
              onChange={(e) => setHopitalFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
            >
              <option value="">Tous les hôpitaux</option>
              {hopitaux?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par Receveur
            </label>
            <select
              value={receveurFilter}
              onChange={(e) => setReceveurFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
            >
              <option value="">Tous les receveurs</option>
              {receveurs?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.prenom} {r.nom} ({r.groupe_sanguin || "?"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* État de chargement */}
      {status === "loading" && (
        <div className="text-center py-10 text-gray-500">Chargement des transfusions...</div>
      )}

      {/* État d'erreur */}
      {status === "error" && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          Une erreur est survenue lors du chargement des données.
        </div>
      )}

      {/* Tableau des résultats */}
      {status === "success" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Patient Receveur
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Établissement
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-700">
                    Aucun acte transfusionnel trouvé
                  </td>
                </tr>
              ) : (
                actes?.map((acte) => (
                  <tr key={acte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(acte.date_transfusion).toLocaleDateString()}
                      <span className="text-gray-500 ml-2 text-xs">
                        {new Date(acte.date_transfusion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {acte.din}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getTypeLabel(acte.type_produit)} • Lot: {acte.lot || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getReceveurName(acte.receveur_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getHopitalName(acte.hopital_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-900">
                        Transfusé
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
