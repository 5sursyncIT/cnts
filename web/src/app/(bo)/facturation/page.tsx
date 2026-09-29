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

const API = "/api";

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
  commande_id: string | null;
  hopital_id: string;
  date_facture: string;
  montant_ht_fcfa: number;
  montant_ttc_fcfa: number;
  statut: "EMISE" | "ENVOYEE" | "PAYEE_PARTIELLEMENT" | "PAYEE" | "ANNULEE";
  date_echeance: string | null;
  created_at: string;
}

interface Paiement {
  id: string;
  facture_id: string;
  montant_fcfa: number;
  mode_paiement: "VIREMENT" | "CHEQUE" | "ESPECES" | "MOBILE_MONEY";
  reference: string | null;
  date_paiement: string;
  created_at: string;
  facture_numero?: string;
}

interface Statistiques {
  montant_total_fcfa: number;
  factures_impayees: number;
  total_paye_fcfa: number;
  montant_impaye_fcfa: number;
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
  const [hopitaux, setHopitaux] = useState<{ id: string; nom: string }[]>([]);
  const [form, setForm] = useState<TabKey | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

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
      const res = await fetch(`${API}/facturation/paiements?offset=0&limit=200`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setPaiements(await res.json());
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

  useEffect(() => {
    fetch(`${API}/hopitaux?limit=200`).then((res) => res.ok ? res.json() : [])
      .then(setHopitaux).catch(() => setHopitaux([]));
  }, []);

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const body = form === "factures" ? {
      numero: String(values.numero).trim(),
      hopital_id: String(values.hopital_id),
      commande_id: values.commande_id || null,
      date_facture: String(values.date_facture),
      lignes: [{ type_produit: String(values.type_produit).trim().toUpperCase(),
        quantite: Number(values.quantite), prix_unitaire_fcfa: Number(values.prix_unitaire_fcfa) }],
    } : form === "tarifs" ? {
      type_produit: String(values.type_produit).trim().toUpperCase(),
      prix_unitaire_fcfa: Number(values.prix_unitaire_fcfa),
      date_debut: String(values.date_debut),
    } : {
      facture_id: String(values.facture_id),
      montant_fcfa: Number(values.montant_fcfa),
      mode_paiement: String(values.mode_paiement),
      reference: String(values.reference || "").trim() || null,
      date_paiement: String(values.date_paiement),
    };
    const path = form === "factures" ? "factures" : form === "tarifs" ? "tarifs" : "paiements";
    try {
      const response = await fetch(`${API}/facturation/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(typeof error.detail === "string" ? error.detail : `Erreur ${response.status}`);
      }
      setForm(null);
      await Promise.all([fetchStats(), fetchFactures(), fetchTarifs(), fetchPaiements()]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

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
              {formatFCFA(stats?.montant_total_fcfa ?? 0)}
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
              {stats?.factures_impayees ?? 0}
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
              {formatFCFA(stats?.total_paye_fcfa ?? 0)}
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
              {stats?.montant_total_fcfa
                ? ((stats.total_paye_fcfa / stats.montant_total_fcfa) * 100).toFixed(1)
                : "0.0"} %
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

      {form && (
        <form onSubmit={submitForm} className="mb-6 rounded-lg bg-white p-5 shadow space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {form === "factures" ? "Nouvelle facture" : form === "tarifs" ? "Nouveau tarif" : "Nouveau paiement"}
            </h2>
            <button type="button" onClick={() => setForm(null)} className="text-gray-700 hover:underline">Fermer</button>
          </div>
          {form === "factures" && <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor="facture-numero" className="text-sm text-gray-800">Numéro de facture
              <input id="facture-numero" name="numero" required maxLength={32} className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="facture-hopital" className="text-sm text-gray-800">Hôpital
              <select id="facture-hopital" name="hopital_id" required className="mt-1 w-full rounded border p-2" defaultValue="">
                <option value="" disabled>Sélectionner</option>
                {hopitaux.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
              </select>
            </label>
            <label htmlFor="facture-commande" className="text-sm text-gray-800">Commande servie (ID, facultatif)
              <input id="facture-commande" name="commande_id" className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="facture-date" className="text-sm text-gray-800">Date de facture
              <input id="facture-date" name="date_facture" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="facture-produit" className="text-sm text-gray-800">Produit
              <select id="facture-produit" name="type_produit" required className="mt-1 w-full rounded border p-2">
                {(["ST", "CGR", "PFC", "CP"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label htmlFor="facture-quantite" className="text-sm text-gray-800">Quantité
              <input id="facture-quantite" name="quantite" type="number" min="1" required defaultValue="1" className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="facture-prix" className="text-sm text-gray-800">Prix unitaire (FCFA)
              <input id="facture-prix" name="prix_unitaire_fcfa" type="number" min="0" required className="mt-1 w-full rounded border p-2" />
            </label>
          </div>}
          {form === "tarifs" && <div className="grid gap-3 sm:grid-cols-3">
            <label htmlFor="tarif-produit" className="text-sm text-gray-800">Produit
              <select id="tarif-produit" name="type_produit" required className="mt-1 w-full rounded border p-2">
                {(["ST", "CGR", "PFC", "CP"] as const).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label htmlFor="tarif-prix" className="text-sm text-gray-800">Prix unitaire (FCFA)
              <input id="tarif-prix" name="prix_unitaire_fcfa" type="number" min="0" required className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="tarif-date" className="text-sm text-gray-800">Date de début
              <input id="tarif-date" name="date_debut" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border p-2" />
            </label>
          </div>}
          {form === "paiements" && <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor="paiement-facture" className="text-sm text-gray-800">Facture
              <select id="paiement-facture" name="facture_id" required className="mt-1 w-full rounded border p-2" defaultValue="">
                <option value="" disabled>Sélectionner</option>
                {factures.filter((f) => f.statut !== "PAYEE" && f.statut !== "ANNULEE")
                  .map((f) => <option key={f.id} value={f.id}>{f.numero}</option>)}
              </select>
            </label>
            <label htmlFor="paiement-montant" className="text-sm text-gray-800">Montant (FCFA)
              <input id="paiement-montant" name="montant_fcfa" type="number" min="1" required className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="paiement-mode" className="text-sm text-gray-800">Mode
              <select id="paiement-mode" name="mode_paiement" className="mt-1 w-full rounded border p-2">
                {Object.entries(MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label htmlFor="paiement-reference" className="text-sm text-gray-800">Référence
              <input id="paiement-reference" name="reference" className="mt-1 w-full rounded border p-2" />
            </label>
            <label htmlFor="paiement-date" className="text-sm text-gray-800">Date de paiement
              <input id="paiement-date" name="date_paiement" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded border p-2" />
            </label>
          </div>}
          {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
          <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {selectedFacture && <div className="mb-6 rounded-lg bg-white p-5 shadow text-sm text-gray-800">
        <button onClick={() => setSelectedFacture(null)} className="float-right text-blue-700 hover:underline">Fermer</button>
        <h2 className="mb-2 text-lg font-semibold">Facture {selectedFacture.numero}</h2>
        <p>Hôpital : {hopitaux.find((h) => h.id === selectedFacture.hopital_id)?.nom || selectedFacture.hopital_id}</p>
        <p>Commande : {selectedFacture.commande_id || "Sans commande"}</p>
        <p>Montant : {formatFCFA(selectedFacture.montant_ttc_fcfa)} — {STATUT_LABELS[selectedFacture.statut]}</p>
      </div>}

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
            <button onClick={() => { setForm("factures"); setFormError(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
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
                          {facture.date_echeance ? formatDate(facture.date_echeance) : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setSelectedFacture(facture)} className="text-blue-700 hover:text-blue-900 font-semibold hover:underline">
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
            <button onClick={() => { setForm("tarifs"); setFormError(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
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
            <button onClick={() => { setForm("paiements"); setFormError(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2">
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
                            {factures.find((f) => f.id === paiement.facture_id)?.numero || paiement.facture_id}
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
