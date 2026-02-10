"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRightLeft,
  Plus,
  RefreshCw,
  X,
  Truck,
  Thermometer,
  Send,
  PackageCheck,
  Ban,
} from "lucide-react";

const API = "/api/backend";

interface TransfertInterSite {
  id: string;
  site_source_id: string;
  site_destination_id: string;
  statut: "BROUILLON" | "EN_TRANSIT" | "RECU" | "ANNULE";
  motif: string | null;
  date_expedition: string | null;
  date_reception: string | null;
  transporteur: string | null;
  temperature_depart: number | null;
  temperature_arrivee: number | null;
  created_at: string;
}

interface SiteRef {
  id: string;
  code: string;
  nom: string;
}

interface TransfertForm {
  site_source_id: string;
  site_destination_id: string;
  motif: string;
  transporteur: string;
}

const emptyForm: TransfertForm = {
  site_source_id: "",
  site_destination_id: "",
  motif: "",
  transporteur: "",
};

export default function TransfertsPage() {
  const [transferts, setTransferts] = useState<TransfertInterSite[]>([]);
  const [sites, setSites] = useState<SiteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TransfertForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`${API}/sites?offset=0&limit=200`);
      if (!res.ok) return;
      const data = await res.json();
      setSites(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      // silently fail, sites are for display only
    }
  }, []);

  const fetchTransferts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ offset: "0", limit: "200" });
      if (statutFilter) params.set("statut", statutFilter);
      const res = await fetch(`${API}/sites/transferts?${params.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTransferts(Array.isArray(data) ? data : data.items ?? []);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [statutFilter]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    fetchTransferts();
  }, [fetchTransferts]);

  const getSiteNom = (siteId: string): string => {
    const site = sites.find((s) => s.id === siteId);
    return site ? site.nom : siteId.slice(0, 8) + "...";
  };

  const handleOpenCreate = () => {
    setFormData(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const payload: Record<string, any> = {
      site_source_id: formData.site_source_id,
      site_destination_id: formData.site_destination_id,
      motif: formData.motif || undefined,
      transporteur: formData.transporteur || undefined,
    };

    try {
      const res = await fetch(`${API}/sites/transferts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }

      await fetchTransferts();
      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "expedier" | "recevoir" | "annuler"
  ) => {
    const labels: Record<string, string> = {
      expedier: "expedier ce transfert",
      recevoir: "confirmer la reception",
      annuler: "annuler ce transfert",
    };

    if (!confirm(`Voulez-vous ${labels[action]} ?`)) return;

    setActionLoading(id);
    try {
      const res = await fetch(`${API}/sites/transferts/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Erreur ${res.status}`);
      }

      await fetchTransferts();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "BROUILLON":
        return "bg-gray-100 text-gray-900";
      case "EN_TRANSIT":
        return "bg-blue-100 text-blue-900";
      case "RECU":
        return "bg-green-100 text-green-900";
      case "ANNULE":
        return "bg-red-100 text-red-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "BROUILLON":
        return "Brouillon";
      case "EN_TRANSIT":
        return "En transit";
      case "RECU":
        return "Recu";
      case "ANNULE":
        return "Annule";
      default:
        return statut;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTemp = (temp: number | null) => {
    if (temp === null || temp === undefined) return "-";
    return `${temp}°C`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            Transferts Inter-Sites
          </h1>
          <p className="text-gray-700 mt-1">
            Suivi des transferts de produits sanguins entre sites
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Transfert
        </button>
      </div>

      {/* Filtre par statut */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_TRANSIT">En transit</option>
              <option value="RECU">Recu</option>
              <option value="ANNULE">Annule</option>
            </select>
          </div>
          <button
            onClick={fetchTransferts}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-700">
          Chargement...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-sm text-gray-800">{error}</div>
          <button
            onClick={fetchTransferts}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reessayer
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          {transferts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-700">
              Aucun transfert trouve
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Motif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        <Thermometer className="w-3.5 h-3.5 inline mr-1" />
                        Temperatures
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transferts.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {t.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getSiteNom(t.site_source_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getSiteNom(t.site_destination_id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 max-w-[200px] truncate">
                          {t.motif || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatutBadge(t.statut)}`}
                          >
                            {getStatutLabel(t.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <div className="flex flex-col gap-0.5">
                            <span>
                              Dep: {formatTemp(t.temperature_depart)}
                            </span>
                            <span>
                              Arr: {formatTemp(t.temperature_arrivee)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <div className="flex flex-col gap-0.5">
                            <span>Exp: {formatDate(t.date_expedition)}</span>
                            <span>Rec: {formatDate(t.date_reception)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {t.statut === "BROUILLON" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(t.id, "expedier")
                                  }
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50 transition"
                                >
                                  <Send className="w-3 h-3" />
                                  Expedier
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(t.id, "annuler")
                                  }
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50 transition"
                                >
                                  <Ban className="w-3 h-3" />
                                  Annuler
                                </button>
                              </>
                            )}
                            {t.statut === "EN_TRANSIT" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(t.id, "recevoir")
                                  }
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50 transition"
                                >
                                  <PackageCheck className="w-3 h-3" />
                                  Recevoir
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(t.id, "annuler")
                                  }
                                  disabled={actionLoading === t.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50 transition"
                                >
                                  <Ban className="w-3 h-3" />
                                  Annuler
                                </button>
                              </>
                            )}
                            {(t.statut === "RECU" ||
                              t.statut === "ANNULE") && (
                              <span className="text-xs text-gray-700 italic">
                                Termine
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer count */}
          <div className="mt-4 text-sm text-gray-800">
            {transferts.length} transfert(s) affiche(s)
          </div>
        </>
      )}

      {/* Modal creation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Nouveau transfert
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site source *
                </label>
                <select
                  required
                  value={formData.site_source_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      site_source_id: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">-- Selectionner le site source --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site destination *
                </label>
                <select
                  required
                  value={formData.site_destination_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      site_destination_id: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">
                    -- Selectionner le site destination --
                  </option>
                  {sites
                    .filter((s) => s.id !== formData.site_source_id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom} ({s.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif
                </label>
                <textarea
                  value={formData.motif}
                  onChange={(e) =>
                    setFormData({ ...formData, motif: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Raison du transfert..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Truck className="w-3.5 h-3.5 inline mr-1" />
                  Transporteur
                </label>
                <input
                  type="text"
                  value={formData.transporteur}
                  onChange={(e) =>
                    setFormData({ ...formData, transporteur: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Nom du transporteur"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Creation..." : "Creer le transfert"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
