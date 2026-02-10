"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Eye,
  RefreshCw,
  X,
  Wrench,
  Thermometer,
  FlaskConical,
  Scale,
  Wind,
  Snowflake,
  Gauge,
} from "lucide-react";

const API = "/api/backend";

// --- Types ---

type CategorieEquipement =
  | "AUTOMATE_ANALYSE"
  | "CENTRIFUGEUSE"
  | "REFRIGERATEUR"
  | "CONGELATEUR"
  | "AGITATEUR"
  | "BALANCE"
  | "THERMOMETRE";

type StatutEquipement =
  | "EN_SERVICE"
  | "EN_PANNE"
  | "EN_MAINTENANCE"
  | "HORS_SERVICE"
  | "REFORME";

interface Equipement {
  id: string;
  code_inventaire: string;
  nom: string;
  categorie: CategorieEquipement;
  marque: string;
  modele: string;
  numero_serie: string;
  site_id: string | null;
  localisation: string;
  date_mise_service: string;
  date_prochaine_maintenance: string | null;
  date_prochaine_calibration: string | null;
  statut: StatutEquipement;
  created_at: string;
}

interface EquipementCreate {
  code_inventaire: string;
  nom: string;
  categorie: CategorieEquipement;
  marque: string;
  modele: string;
  numero_serie: string;
  localisation: string;
  date_mise_service: string;
}

// --- Helpers ---

const CATEGORIES: { value: CategorieEquipement; label: string }[] = [
  { value: "AUTOMATE_ANALYSE", label: "Automate d'analyse" },
  { value: "CENTRIFUGEUSE", label: "Centrifugeuse" },
  { value: "REFRIGERATEUR", label: "Refrigerateur" },
  { value: "CONGELATEUR", label: "Congelateur" },
  { value: "AGITATEUR", label: "Agitateur" },
  { value: "BALANCE", label: "Balance" },
  { value: "THERMOMETRE", label: "Thermometre" },
];

const STATUTS: { value: StatutEquipement; label: string }[] = [
  { value: "EN_SERVICE", label: "En service" },
  { value: "EN_PANNE", label: "En panne" },
  { value: "EN_MAINTENANCE", label: "En maintenance" },
  { value: "HORS_SERVICE", label: "Hors service" },
  { value: "REFORME", label: "Reforme" },
];

function getCategorieLabel(cat: CategorieEquipement): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function getCategorieBadge(cat: CategorieEquipement): string {
  switch (cat) {
    case "AUTOMATE_ANALYSE":
      return "bg-purple-100 text-purple-900";
    case "CENTRIFUGEUSE":
      return "bg-blue-100 text-blue-900";
    case "REFRIGERATEUR":
      return "bg-cyan-100 text-cyan-900";
    case "CONGELATEUR":
      return "bg-indigo-100 text-indigo-900";
    case "AGITATEUR":
      return "bg-teal-100 text-teal-900";
    case "BALANCE":
      return "bg-orange-100 text-orange-900";
    case "THERMOMETRE":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-gray-100 text-gray-900";
  }
}

function getCategorieIcon(cat: CategorieEquipement) {
  switch (cat) {
    case "AUTOMATE_ANALYSE":
      return <FlaskConical className="w-3.5 h-3.5 inline mr-1" />;
    case "CENTRIFUGEUSE":
      return <Gauge className="w-3.5 h-3.5 inline mr-1" />;
    case "REFRIGERATEUR":
      return <Snowflake className="w-3.5 h-3.5 inline mr-1" />;
    case "CONGELATEUR":
      return <Snowflake className="w-3.5 h-3.5 inline mr-1" />;
    case "AGITATEUR":
      return <Wind className="w-3.5 h-3.5 inline mr-1" />;
    case "BALANCE":
      return <Scale className="w-3.5 h-3.5 inline mr-1" />;
    case "THERMOMETRE":
      return <Thermometer className="w-3.5 h-3.5 inline mr-1" />;
    default:
      return <Wrench className="w-3.5 h-3.5 inline mr-1" />;
  }
}

function getStatutBadge(statut: StatutEquipement): string {
  switch (statut) {
    case "EN_SERVICE":
      return "bg-green-100 text-green-900";
    case "EN_PANNE":
      return "bg-red-100 text-red-900";
    case "EN_MAINTENANCE":
      return "bg-amber-100 text-amber-900";
    case "HORS_SERVICE":
      return "bg-gray-100 text-gray-700";
    case "REFORME":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-900";
  }
}

function getStatutLabel(statut: StatutEquipement): string {
  return STATUTS.find((s) => s.value === statut)?.label ?? statut;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

// --- Component ---

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categorieFilter, setCategorieFilter] = useState<string>("");
  const [statutFilter, setStatutFilter] = useState<string>("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<EquipementCreate>({
    code_inventaire: "",
    nom: "",
    categorie: "AUTOMATE_ANALYSE",
    marque: "",
    modele: "",
    numero_serie: "",
    localisation: "",
    date_mise_service: "",
  });

  // Fetch equipements
  const fetchEquipements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("offset", "0");
      params.set("limit", "500");
      if (categorieFilter) params.set("categorie", categorieFilter);
      if (statutFilter) params.set("statut", statutFilter);

      const res = await fetch(`${API}/equipements?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      setEquipements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [categorieFilter, statutFilter]);

  useEffect(() => {
    fetchEquipements();
  }, [fetchEquipements]);

  // Create equipement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${API}/equipements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.detail || `Erreur ${res.status} lors de la creation`
        );
      }

      setShowModal(false);
      setForm({
        code_inventaire: "",
        nom: "",
        categorie: "AUTOMATE_ANALYSE",
        marque: "",
        modele: "",
        numero_serie: "",
        localisation: "",
        date_mise_service: "",
      });
      fetchEquipements();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipements</h1>
          <p className="text-gray-700 mt-1">
            Qualification et suivi des equipements du laboratoire
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nouvel Equipement
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categorie
            </label>
            <select
              value={categorieFilter}
              onChange={(e) => setCategorieFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Toutes les categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
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
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchEquipements()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        {loading && (
          <div className="p-8 text-center text-gray-700">Chargement...</div>
        )}

        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">Erreur de chargement</div>
            <div className="text-sm text-gray-800">{error}</div>
            <button
              onClick={() => fetchEquipements()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reessayer
            </button>
          </div>
        )}

        {!loading && !error && equipements.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            Aucun equipement trouve
          </div>
        )}

        {!loading && !error && equipements.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Code Inv.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Marque / Modele
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Proch. Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Proch. Calibration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipements.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {eq.code_inventaire}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {eq.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded ${getCategorieBadge(eq.categorie)}`}
                      >
                        {getCategorieIcon(eq.categorie)}
                        {getCategorieLabel(eq.categorie)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div>{eq.marque}</div>
                      <div className="text-xs text-gray-500">{eq.modele}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatutBadge(eq.statut)}`}
                      >
                        {getStatutLabel(eq.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          isOverdue(eq.date_prochaine_maintenance)
                            ? "text-red-600 font-semibold"
                            : "text-gray-900"
                        }
                      >
                        {formatDate(eq.date_prochaine_maintenance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          isOverdue(eq.date_prochaine_calibration)
                            ? "text-red-600 font-semibold"
                            : "text-gray-900"
                        }
                      >
                        {formatDate(eq.date_prochaine_calibration)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/qualite/equipements/${eq.id}`}
                        className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
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
      {!loading && !error && (
        <div className="mt-4 text-sm text-gray-800">
          {equipements.length} equipement(s) affiche(s)
        </div>
      )}

      {/* Modal: Nouvel Equipement */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Nouvel Equipement
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code inventaire *
                </label>
                <input
                  type="text"
                  required
                  value={form.code_inventaire}
                  onChange={(e) =>
                    setForm({ ...form, code_inventaire: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="EQ-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Automate Sysmex XN-1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie *
                </label>
                <select
                  required
                  value={form.categorie}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categorie: e.target.value as CategorieEquipement,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marque *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.marque}
                    onChange={(e) =>
                      setForm({ ...form, marque: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Sysmex"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modele *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.modele}
                    onChange={(e) =>
                      setForm({ ...form, modele: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="XN-1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero de serie *
                </label>
                <input
                  type="text"
                  required
                  value={form.numero_serie}
                  onChange={(e) =>
                    setForm({ ...form, numero_serie: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="SN-123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation *
                </label>
                <input
                  type="text"
                  required
                  value={form.localisation}
                  onChange={(e) =>
                    setForm({ ...form, localisation: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Laboratoire principal - Salle 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de mise en service *
                </label>
                <input
                  type="date"
                  required
                  value={form.date_mise_service}
                  onChange={(e) =>
                    setForm({ ...form, date_mise_service: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creation..." : "Creer l'equipement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
