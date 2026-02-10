"use client";

import { useCommandes, useHopitaux } from "@cnts/api";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function DistributionPage() {
  // Charger toutes les commandes récentes
  const { data: commandes, status, refetch } = useCommandes(apiClient, {
    limit: 50,
  });

  // Charger les hôpitaux
  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 100,
  });

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "error">("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bo.autoRefreshEnabled");
    if (stored === "false") setAutoRefreshEnabled(false);

    const onRefreshSetting = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setAutoRefreshEnabled(customEvent.detail.enabled);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bo.autoRefreshEnabled") {
        setAutoRefreshEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refreshData = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();
    if (!options?.force && now - lastFetchAtRef.current < 5000) return;
    if (inflightRef.current) return;
    inflightRef.current = true;
    lastFetchAtRef.current = now;
    setRefreshState("loading");
    setRefreshError(null);
    try {
      await refetch();
      setRefreshState("idle");
    } catch (err) {
      setRefreshState("error");
      setRefreshError(err instanceof Error ? err.message : "Connexion interrompue");
    } finally {
      inflightRef.current = false;
    }
  }, [refetch]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (autoRefreshEnabled) {
      intervalId = window.setInterval(() => {
        refreshData();
      }, 15000) as unknown as number;
    }
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, refreshData]);

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

  // Filtrer les commandes en attente (BROUILLON + VALIDEE)
  const commandesEnAttente = commandes?.filter(
    (c) => c.statut === "BROUILLON" || c.statut === "VALIDEE"
  );

  // Trouver le nom d'un hôpital
  const getHopitalNom = (hopitalId: string) => {
    return hopitaux?.find((h) => h.id === hopitalId)?.nom || "Hôpital inconnu";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distribution</h1>
          <p className="text-gray-700 mt-1">
            Gestion des commandes hospitalières et réservations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-700" title={refreshError ?? undefined}>
            <span
              className={`h-2 w-2 rounded-full ${
                refreshState === "loading"
                  ? "bg-blue-500 animate-pulse"
                  : refreshState === "error"
                  ? "bg-red-500"
                  : autoRefreshEnabled
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />
            <span>
              {autoRefreshEnabled
                ? refreshState === "loading"
                  ? "Mise à jour..."
                  : refreshState === "error"
                  ? "Connexion interrompue"
                  : "Données à jour"
                : "Rafraîchissement désactivé"}
            </span>
          </div>
          <Link
            href="/distribution/commandes/nouvelle"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            + Nouvelle commande
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      {status === "success" && commandes && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="text-xs text-gray-800 mb-1">Brouillon</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.brouillon}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-xs text-blue-600 mb-1">Validée</div>
            <div className="text-2xl font-bold text-blue-900">
              {stats.validee}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-xs text-green-600 mb-1">Servie</div>
            <div className="text-2xl font-bold text-green-900">
              {stats.servie}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-xs text-red-600 mb-1">Annulée</div>
            <div className="text-2xl font-bold text-red-900">{stats.annulee}</div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Link
          href="/distribution/commandes"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Toutes les commandes</h2>
              <p className="text-sm text-gray-800">
                Voir l'historique complet des commandes hospitalières
              </p>
            </div>
            <span className="text-2xl">📋</span>
          </div>
        </Link>

        <Link
          href="/distribution/hopitaux"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Hôpitaux</h2>
              <p className="text-sm text-gray-800">
                Gérer les hôpitaux et les conventions
              </p>
            </div>
            <span className="text-2xl">🏥</span>
          </div>
        </Link>

        <Link
          href="/distribution/receveurs"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Receveurs</h2>
              <p className="text-sm text-gray-800">
                Gérer les receveurs et les cross-matchings
              </p>
            </div>
            <span className="text-2xl">👤</span>
          </div>
        </Link>
      </div>

      {/* Commandes en attente */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Commandes en attente</h2>
          <button
            onClick={() => refetch()}
            className="text-sm text-blue-600 hover:text-blue-900"
          >
            Actualiser
          </button>
        </div>

        {status === "loading" && (
          <div className="p-8 text-center text-gray-700">Chargement...</div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Erreur de chargement</div>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === "success" && (!commandesEnAttente || commandesEnAttente.length === 0) && (
          <div className="p-8 text-center text-gray-700">
            <div className="mb-2">Aucune commande en attente</div>
            <Link
              href="/distribution/commandes/nouvelle"
              className="text-sm text-blue-600 hover:text-blue-900"
            >
              Créer une commande →
            </Link>
          </div>
        )}

        {status === "success" && commandesEnAttente && commandesEnAttente.length > 0 && (
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
                {commandesEnAttente.map((commande) => (
                  <tr key={commande.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getHopitalNom(commande.hopital_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(commande.date_demande).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {commande.date_livraison_prevue
                        ? new Date(commande.date_livraison_prevue).toLocaleDateString(
                            "fr-FR"
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {commande.lignes.length} ligne(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          commande.statut === "BROUILLON"
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
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workflow info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 text-sm">
          Workflow de distribution
        </h3>
        <ul className="text-xs text-blue-900 space-y-1">
          <li>
            1. <strong>BROUILLON</strong>: Commande créée, lignes spécifiées
          </li>
          <li>
            2. <strong>VALIDEE</strong>: Poches réservées automatiquement (FEFO)
          </li>
          <li>
            3. <strong>Affectation</strong>: Associer receveurs aux poches
            (cross-matching)
          </li>
          <li>
            4. <strong>SERVIE</strong>: Poches marquées DISTRIBUE, prêtes pour
            transfusion
          </li>
        </ul>
      </div>
    </div>
  );
}
