"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plus,
  RefreshCw,
  Receipt,
  Tags,
  Banknote,
} from "lucide-react";

const API = "/api/backend";

// --- Types ---

interface Tarif {
  id: string;
  type_produit: string;
  prix_unitaire_fcfa: number;
  date_debut: string;
  date_fin: string | null;
  is_active: boolean;
  created_at: string;
}

interface Facture {
  id: string;
  numero: string;
  commande_id: string;
  hopital_id: string;
  date_facture: string;
  montant_ht_fcfa: number;
  montant_ttc_fcfa: number;
  statut: "EMISE" | "ENVOYEE" | "PAYEE_PARTIELLEMENT" | "PAYEE" | "ANNULEE";
  date_echeance: string;
  created_at: string;
}

interface Paiement {
  id: string;
  facture_id: string;
  montant_fcfa: number;
  mode_paiement: "VIREMENT" | "CHEQUE" | "ESPECES" | "MOBILE_MONEY";
  reference: string;
  date_paiement: string;
  created_at: string;
}

interface Statistiques {
  total_facture_fcfa: number;
  total_impaye_count: number;
  total_encaisse_fcfa: number;
  taux_recouvrement: number;
}

// --- Helpers ---

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUT_COLORS: Record<Facture["statut"], string> = {
  EMISE: "bg-blue-100 text-blue-800",
  ENVOYEE: "bg-purple-100 text-purple-800",
  PAYEE_PARTIELLEMENT: "bg-amber-100 text-amber-800",
  PAYEE: "bg-green-100 text-green-800",
  ANNULEE: "bg-red-100 text-red-800",
};

const STATUT_LABELS: Record<Facture["statut"], string> = {
  EMISE: "Emise",
  ENVOYEE: "Envoyee",
  PAYEE_PARTIELLEMENT: "Partiellement payee",
  PAYEE: "Payee",
  ANNULEE: "Annulee",
};

const MODE_LABELS: Record<Paiement["mode_paiement"], string> = {
  VIREMENT: "Virement",
  CHEQUE: "Cheque",
  ESPECES: "Especes",
  MOBILE_MONEY: "Mobile Money",
};

type TabKey = "factures" | "tarifs" | "paiements";

// --- Component ---

export default function FacturationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("factures");
  const [statutFilter, setStatutFilter] = useState<string>("");

  // Data states
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingFactures, setLoadingFactures] = useState(true);
  const [loadingTarifs, setLoadingTarifs] = useState(true);
  const [loadingPaiements, setLoadingPaiements] = useState(true);

  // Error states
  const [errorStats, setErrorStats] = useState<string | null>(null);
  const [errorFactures, setErrorFactures] = useState<string | null>(null);
  const [errorTarifs, setErrorTarifs] = useState<string | null>(null);
  const [errorPaiements, setErrorPaiements] = useState<string | null>(null);

  // --- Fetchers ---

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);
    try {
      const res = await fetch(`${API}/facturation/statistiques`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      setErrorStats(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchFactures = useCallback(async () => {
    setLoadingFactures(true);
    setErrorFactures(null);
    try {
      const params = new URLSearchParams();
      if (statutFilter) params.set("statut", statutFilter);
      params.set("offset", "0");
      params.set("limit", "200");
      const res = await fetch(
        `${API}/facturation/factures?${params.toString()}`
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setFactures(data);
    } catch (err: unknown) {
      setErrorFactures(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingFactures(false);
    }
  }, [statutFilter]);

  const fetchTarifs = useCallback(async () => {
    setLoadingTarifs(true);
    setErrorTarifs(null);
    try {
      const res = await fetch(`${API}/facturation/tarifs`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTarifs(data);
    } catch (err: unknown) {
      setErrorTarifs(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingTarifs(false);
    }
  }, []);

  const fetchPaiements = useCallback(async () => {
    setLoadingPaiements(true);
    setErrorPaiements(null);
    try {
      // Fetch all factures first to get paiements from each
      const res = await fetch(
        `${API}/facturation/factures?offset=0&limit=200`
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const allFactures: Facture[] = await res.json();
      // Collect paiements from facture details
      const allPaiements: Paiement[] = [];
      for (const f of allFactures) {
        try {
          const detailRes = await fetch(
            `${API}/facturation/factures/${f.id}`
          );
          if (detailRes.ok) {
            const detail = await detailRes.json();
            if (detail.paiements) {
              allPaiements.push(
                ...detail.paiements.map((p: Paiement) => ({
                  ...p,
                  facture_numero: f.numero,
                }))
              );
            }
          }
        } catch {
          // skip individual facture errors
        }
      }
      setPaiements(allPaiements);
    } catch (err: unknown) {
      setErrorPaiements(
        err instanceof Error ? err.message : "Erreur inconnue"
      );
    } finally {
      setLoadingPaiements(false);
    }
  }, []);

  // --- Effects ---

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchFactures();
  }, [fetchFactures]);

  useEffect(() => {
    if (activeTab === "tarifs") fetchTarifs();
  }, [activeTab, fetchTarifs]);

  useEffect(() => {
    if (activeTab === "paiements") fetchPaiements();
  }, [activeTab, fetchPaiements]);

  // --- Tabs config ---

  const tabs: { key: TabKey; label: string; icon: typeof FileText }[] = [
    { key: "factures", label: "Factures", icon: Receipt },
    { key: "tarifs", label: "Tarifs", icon: Tags },
    { key: "paiements", label: "Paiements", icon: Banknote },
  ];

  // --- Render ---

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-700 mt-1">
          Gestion des factures, tarifs et paiements
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Total facture
            </span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          {loadingStats ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : errorStats ? (
            <div className="text-sm text-red-600">Erreur</div>
          ) : (
            <div className="text-xl font-bold text-gray-900">
              {formatFCFA(stats?.total_facture_fcfa ?? 0)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Factures impayees
            </span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          {loadingStats ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : errorStats ? (
            <div className="text-sm text-red-600">Erreur</div>
          ) : (
            <div className="text-xl font-bold text-gray-900">
              {stats?.total_impaye_count ?? 0}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Montant encaisse
            </span>
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
          </div>
          {loadingStats ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : errorStats ? (
            <div className="text-sm text-red-600">Erreur</div>
          ) : (
            <div className="text-xl font-bold text-gray-900">
              {formatFCFA(stats?.total_encaisse_fcfa ?? 0)}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Taux recouvrement
            </span>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          {loadingStats ? (
            <div className="text-sm text-gray-500">Chargement...</div>
          ) : errorStats ? (
            <div className="text-sm text-red-600">Erreur</div>
          ) : (
            <div className="text-xl font-bold text-gray-900">
              {(stats?.taux_recouvrement ?? 0).toFixed(1)} %
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6" aria-label="Onglets">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- Factures Tab --- */}
      {activeTab === "factures" && (
        <div>
          {/* Filter + action bar */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Tous</option>
                  <option value="EMISE">Emise</option>
                  <option value="ENVOYEE">Envoyee</option>
                  <option value="PAYEE_PARTIELLEMENT">
                    Partiellement payee
                  </option>
                  <option value="PAYEE">Payee</option>
                  <option value="ANNULEE">Annulee</option>
                </select>
              </div>
              <button
                onClick={() => fetchFactures()}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                title="Actualiser"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Facture
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            {loadingFactures && (
              <div className="p-8 text-center text-gray-700">
                Chargement...
              </div>
            )}

            {errorFactures && (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">Erreur de chargement</div>
                <div className="text-sm text-gray-800">{errorFactures}</div>
                <button
                  onClick={() => fetchFactures()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reessayer
                </button>
              </div>
            )}

            {!loadingFactures && !errorFactures && factures.length === 0 && (
              <div className="p-8 text-center text-gray-700">
                Aucune facture trouvee
              </div>
            )}

            {!loadingFactures && !errorFactures && factures.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Numero
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Montant HT
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Montant TTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Echeance
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {factures.map((facture) => (
                      <tr
                        key={facture.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {facture.numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(facture.date_facture)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatFCFA(facture.montant_ht_fcfa)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatFCFA(facture.montant_ttc_fcfa)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUT_COLORS[facture.statut]}`}
                          >
                            {STATUT_LABELS[facture.statut]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(facture.date_echeance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-700 hover:text-blue-900 font-semibold hover:underline">
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loadingFactures && !errorFactures && factures.length > 0 && (
            <div className="mt-4 text-sm text-gray-800 text-right">
              {factures.length} facture(s) affichee(s)
            </div>
          )}
        </div>
      )}

      {/* --- Tarifs Tab --- */}
      {activeTab === "tarifs" && (
        <div>
          {/* Action bar */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => fetchTarifs()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              title="Actualiser"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Tarif
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            {loadingTarifs && (
              <div className="p-8 text-center text-gray-700">
                Chargement...
              </div>
            )}

            {errorTarifs && (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">Erreur de chargement</div>
                <div className="text-sm text-gray-800">{errorTarifs}</div>
                <button
                  onClick={() => fetchTarifs()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reessayer
                </button>
              </div>
            )}

            {!loadingTarifs && !errorTarifs && tarifs.length === 0 && (
              <div className="p-8 text-center text-gray-700">
                Aucun tarif configure
              </div>
            )}

            {!loadingTarifs && !errorTarifs && tarifs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type Produit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Prix unitaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date debut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date fin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actif
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tarifs.map((tarif) => (
                      <tr
                        key={tarif.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-900">
                            {tarif.type_produit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatFCFA(tarif.prix_unitaire_fcfa)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {formatDate(tarif.date_debut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {tarif.date_fin ? formatDate(tarif.date_fin) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {tarif.is_active ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactif
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loadingTarifs && !errorTarifs && tarifs.length > 0 && (
            <div className="mt-4 text-sm text-gray-800 text-right">
              {tarifs.length} tarif(s) affiche(s)
            </div>
          )}
        </div>
      )}

      {/* --- Paiements Tab --- */}
      {activeTab === "paiements" && (
        <div>
          {/* Action bar */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => fetchPaiements()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              title="Actualiser"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Paiement
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow">
            {loadingPaiements && (
              <div className="p-8 text-center text-gray-700">
                Chargement...
              </div>
            )}

            {errorPaiements && (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">Erreur de chargement</div>
                <div className="text-sm text-gray-800">{errorPaiements}</div>
                <button
                  onClick={() => fetchPaiements()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reessayer
                </button>
              </div>
            )}

            {!loadingPaiements &&
              !errorPaiements &&
              paiements.length === 0 && (
                <div className="p-8 text-center text-gray-700">
                  Aucun paiement enregistre
                </div>
              )}

            {!loadingPaiements &&
              !errorPaiements &&
              paiements.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Facture N.
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paiements.map((paiement) => (
                        <tr
                          key={paiement.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(paiement as Paiement & { facture_numero?: string })
                              .facture_numero || paiement.facture_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatFCFA(paiement.montant_fcfa)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {MODE_LABELS[paiement.mode_paiement]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {paiement.reference || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {formatDate(paiement.date_paiement)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {!loadingPaiements && !errorPaiements && paiements.length > 0 && (
            <div className="mt-4 text-sm text-gray-800 text-right">
              {paiements.length} paiement(s) affiche(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
