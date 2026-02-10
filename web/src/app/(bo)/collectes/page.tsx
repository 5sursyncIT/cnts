"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  Target,
  Loader2,
} from "lucide-react";

const API = "/api/backend";

// ---------- Types ----------

interface CampagneCollecte {
  id: string;
  code: string;
  nom: string;
  site_id: string | null;
  type_campagne: "FIXE" | "MOBILE" | "ENTREPRISE" | "UNIVERSITE";
  lieu: string;
  adresse: string | null;
  latitude: number | null;
  longitude: number | null;
  date_debut: string;
  date_fin: string;
  objectif_dons: number;
  statut: "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
  responsable_id: string | null;
  materiel_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CampagneCollecteCreate {
  nom: string;
  type_campagne: "FIXE" | "MOBILE" | "ENTREPRISE" | "UNIVERSITE";
  lieu: string;
  adresse: string;
  date_debut: string;
  date_fin: string;
  objectif_dons: number;
  materiel_notes: string;
}

// ---------- Constants ----------

const ITEMS_PER_PAGE = 20;

const STATUT_COLORS: Record<CampagneCollecte["statut"], string> = {
  PLANIFIEE: "bg-blue-100 text-blue-900",
  EN_COURS: "bg-green-100 text-green-900",
  TERMINEE: "bg-gray-100 text-gray-800",
  ANNULEE: "bg-red-100 text-red-900",
};

const STATUT_LABELS: Record<CampagneCollecte["statut"], string> = {
  PLANIFIEE: "Planifi\u00e9e",
  EN_COURS: "En cours",
  TERMINEE: "Termin\u00e9e",
  ANNULEE: "Annul\u00e9e",
};

const TYPE_COLORS: Record<CampagneCollecte["type_campagne"], string> = {
  FIXE: "bg-blue-100 text-blue-900",
  MOBILE: "bg-green-100 text-green-900",
  ENTREPRISE: "bg-purple-100 text-purple-900",
  UNIVERSITE: "bg-amber-100 text-amber-900",
};

const TYPE_LABELS: Record<CampagneCollecte["type_campagne"], string> = {
  FIXE: "Fixe",
  MOBILE: "Mobile",
  ENTREPRISE: "Entreprise",
  UNIVERSITE: "Universit\u00e9",
};

// ---------- Helpers ----------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(debut: string, fin: string): string {
  return `${formatDate(debut)} - ${formatDate(fin)}`;
}

// ---------- Component ----------

export default function CollectesPage() {
  // Data state
  const [collectes, setCollectes] = useState<CampagneCollecte[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampagneCollecteCreate>({
    nom: "",
    type_campagne: "MOBILE",
    lieu: "",
    adresse: "",
    date_debut: "",
    date_fin: "",
    objectif_dons: 50,
    materiel_notes: "",
  });

  // ---------- Fetch collectes ----------

  const fetchCollectes = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statutFilter) params.set("statut", statutFilter);
      if (typeFilter) params.set("type_campagne", typeFilter);
      params.set("offset", String((page - 1) * ITEMS_PER_PAGE));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`${API}/collectes?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data: CampagneCollecte[] = await res.json();
      setCollectes(data);
      setStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      setStatus("error");
    }
  }, [statutFilter, typeFilter, page]);

  useEffect(() => {
    fetchCollectes();
  }, [fetchCollectes]);

  // ---------- Create collecte ----------

  const handleOpenCreate = () => {
    setFormData({
      nom: "",
      type_campagne: "MOBILE",
      lieu: "",
      adresse: "",
      date_debut: "",
      date_fin: "",
      objectif_dons: 50,
      materiel_notes: "",
    });
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
    setFormLoading(true);

    try {
      const res = await fetch(`${API}/collectes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.nom,
          type_campagne: formData.type_campagne,
          lieu: formData.lieu,
          adresse: formData.adresse || undefined,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          objectif_dons: formData.objectif_dons,
          materiel_notes: formData.materiel_notes || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Erreur ${res.status}`);
      }

      handleClose();
      await fetchCollectes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  // ---------- Render ----------

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collectes Mobiles</h1>
          <p className="text-gray-700 mt-1">
            Planification et suivi des campagnes de collecte de sang
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Collecte
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Toutes</option>
              <option value="PLANIFIEE">Planifi\u00e9e</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Termin\u00e9e</option>
              <option value="ANNULEE">Annul\u00e9e</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de campagne
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous les types</option>
              <option value="FIXE">Fixe</option>
              <option value="MOBILE">Mobile</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="UNIVERSITE">Universit\u00e9</option>
            </select>
          </div>

          <button
            onClick={() => fetchCollectes()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {status === "success" && collectes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <Calendar className="w-4 h-4" />
              Total
            </div>
            <div className="text-2xl font-bold text-gray-900">{collectes.length}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-700 mb-1">Planifi\u00e9es</div>
            <div className="text-2xl font-bold text-blue-900">
              {collectes.filter((c) => c.statut === "PLANIFIEE").length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-700 mb-1">En cours</div>
            <div className="text-2xl font-bold text-green-900">
              {collectes.filter((c) => c.statut === "EN_COURS").length}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <Target className="w-4 h-4" />
              Objectif total
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {collectes.reduce((sum, c) => sum + c.objectif_dons, 0)}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {status === "loading" && (
          <div className="p-8 text-center text-gray-700 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement...
          </div>
        )}

        {status === "error" && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Erreur de chargement</div>
            <div className="text-sm text-gray-800">{error}</div>
            <button
              onClick={() => fetchCollectes()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              R\u00e9essayer
            </button>
          </div>
        )}

        {status === "success" && collectes.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="mb-2">Aucune collecte trouv\u00e9e</div>
            <button
              onClick={handleOpenCreate}
              className="text-sm text-green-600 hover:text-green-900 font-medium"
            >
              Planifier une nouvelle collecte
            </button>
          </div>
        )}

        {status === "success" && collectes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Lieu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Objectif
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
                {collectes.map((collecte) => (
                  <tr key={collecte.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">
                        {collecte.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {collecte.nom}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${TYPE_COLORS[collecte.type_campagne]}`}
                      >
                        {TYPE_LABELS[collecte.type_campagne]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-800">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {collecte.lieu}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {formatDateRange(collecte.date_debut, collecte.date_fin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Target className="w-3 h-3 text-gray-400" />
                        {collecte.objectif_dons} dons
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUT_COLORS[collecte.statut]}`}
                      >
                        {STATUT_LABELS[collecte.statut]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`/collectes/${collecte.id}`}
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </a>
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
            Page {page} &bull; {collectes.length} r\u00e9sultat(s) affich\u00e9(s)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Pr\u00e9c\u00e9dent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={collectes.length < ITEMS_PER_PAGE}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center gap-1 text-sm font-medium text-gray-700"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Nouvelle Collecte */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Nouvelle Collecte
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
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
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Collecte UCAD Janvier 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de campagne *
                </label>
                <select
                  required
                  value={formData.type_campagne}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type_campagne: e.target.value as CampagneCollecteCreate["type_campagne"],
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="FIXE">Fixe</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="ENTREPRISE">Entreprise</option>
                  <option value="UNIVERSITE">Universit\u00e9</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lieu}
                  onChange={(e) =>
                    setFormData({ ...formData, lieu: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ex: Campus UCAD, Dakar"
                />
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Adresse compl\u00e8te..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de d\u00e9but *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_debut}
                    onChange={(e) =>
                      setFormData({ ...formData, date_debut: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_fin}
                    onChange={(e) =>
                      setFormData({ ...formData, date_fin: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objectif de dons *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.objectif_dons}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      objectif_dons: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes mat\u00e9riel
                </label>
                <textarea
                  value={formData.materiel_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, materiel_notes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Poches, aiguilles, tables, tentes..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={formLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {formLoading ? "Cr\u00e9ation..." : "Cr\u00e9er la collecte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
