"use client";

import { useCommandes, useHopitaux } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function CommandesPage() {
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [hopitalFilter, setHopitalFilter] = useState<string>("");

  const { data: commandes, status, error, refetch } = useCommandes(apiClient, {
    statut: statutFilter || undefined,
    hopital_id: hopitalFilter || undefined,
    limit: 200,
  });

  const { data: hopitaux } = useHopitaux(apiClient, { limit: 200 });

  // Trouver le nom d'un hôpital
  const getHopitalNom = (hopitalId: string) => {
    return hopitaux?.find((h) => h.id === hopitalId)?.nom || "Hôpital inconnu";
  };

  // Calculer les statistiques
  const stats = commandes
    ? {
      total: commandes.length,
      brouillon: commandes.filter((c) => c.statut === "BROUILLON").length,
      validee: commandes.filter((c) => c.statut === "VALIDEE").length,
      servie: commandes.filter((c) => c.statut === "SERVIE").length,
      annulee: commandes.filter((c) => c.statut === "ANNULEE").length,
    }
    : { total: 0, brouillon: 0, validee: 0, servie: 0, annulee: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/distribution"
            className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
          >
            ← Retour à la distribution
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Commandes Hospitalières</h1>
          <p className="text-gray-700 mt-1">
            Historique complet des commandes de sang
          </p>
        </div>
        <Link
          href="/distribution/commandes/nouvelle"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Nouvelle commande
        </Link>
      </div>

      {/* Statistiques rapides */}
      {status === "success" && commandes && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-700 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-800 mb-1">Brouillon</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.brouillon}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-700 mb-1">Validée</div>
            <div className="text-2xl font-bold text-blue-900">{stats.validee}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-700 mb-1">Servie</div>
            <div className="text-2xl font-bold text-green-900">{stats.servie}</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-700 mb-1">Annulée</div>
            <div className="text-2xl font-bold text-red-900">{stats.annulee}</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hôpital
            </label>
            <select
              value={hopitalFilter}
              onChange={(e) => setHopitalFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous les hôpitaux</option>
              {hopitaux?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="VALIDEE">Validée</option>
              <option value="SERVIE">Servie</option>
              <option value="ANNULEE">Annulée</option>
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

      {/* Liste des commandes */}
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

        {status === "success" && commandes && commandes.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            <div className="mb-2">Aucune commande trouvée</div>
            <Link
              href="/distribution/commandes/nouvelle"
              className="text-sm text-blue-600 hover:text-blue-900"
            >
              Créer une commande →
            </Link>
          </div>
        )}

        {status === "success" && commandes && commandes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hôpital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date demande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Livraison prévue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Lignes
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
                {commandes.map((commande) => (
                  <tr key={commande.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/distribution/commandes/${commande.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {getHopitalNom(commande.hopital_id)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(commande.date_demande).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {commande.date_livraison_prevue
                        ? new Date(commande.date_livraison_prevue).toLocaleDateString(
                          "fr-FR",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div>{commande.lignes.length} ligne(s)</div>
                      <div className="text-xs text-gray-500">
                        {commande.lignes.reduce(
                          (sum, l) => sum + l.quantite,
                          0
                        )}{" "}
                        poche(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${commande.statut === "BROUILLON"
                            ? "bg-gray-100 text-gray-800"
                            : commande.statut === "VALIDEE"
                              ? "bg-blue-100 text-blue-900"
                              : commande.statut === "SERVIE"
                                ? "bg-green-100 text-green-900"
                                : "bg-red-100 text-red-900"
                          }`}
                      >
                        {commande.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/distribution/commandes/${commande.id}`}
                        className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {status === "success" && commandes && (
        <div className="mt-4 text-sm text-gray-800 text-right">
          {commandes.length} commande(s) affichée(s)
        </div>
      )}
    </div>
  );
}
