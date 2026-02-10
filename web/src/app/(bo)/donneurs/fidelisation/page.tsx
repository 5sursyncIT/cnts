"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Megaphone,
  BarChart3,
  RefreshCw,
  Award,
  Users,
  Star,
  Gift,
} from "lucide-react";

const API = "/api/backend";

// ── Types ────────────────────────────────────────────────────────────────────

type Niveau = "BRONZE" | "ARGENT" | "OR" | "PLATINE";

interface CarteDonneur {
  id: string;
  donneur_id: string;
  numero_carte: string;
  qr_code_data: string;
  niveau: Niveau;
  points: number;
  total_dons: number;
  date_premier_don: string | null;
  date_dernier_don: string | null;
  is_active: boolean;
  created_at: string;
}

interface CampagneRecrutement {
  id: string;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  cible: number;
  canal: "SMS" | "EMAIL" | "WHATSAPP" | "MIXTE";
  message_template: string;
  statut: "PLANIFIEE" | "EN_COURS" | "TERMINEE";
  nb_contactes: number;
  nb_convertis: number;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NIVEAUX: Niveau[] = ["BRONZE", "ARGENT", "OR", "PLATINE"];

const NIVEAU_COLORS: Record<Niveau, string> = {
  BRONZE: "bg-amber-100 text-amber-800",
  ARGENT: "bg-gray-200 text-gray-800",
  OR: "bg-yellow-100 text-yellow-800",
  PLATINE: "bg-purple-100 text-purple-800",
};

const NIVEAU_DOT_COLORS: Record<Niveau, string> = {
  BRONZE: "bg-amber-500",
  ARGENT: "bg-gray-500",
  OR: "bg-yellow-500",
  PLATINE: "bg-purple-500",
};

const STATUT_CAMPAGNE_COLORS: Record<string, string> = {
  PLANIFIEE: "bg-blue-100 text-blue-800",
  EN_COURS: "bg-green-100 text-green-800",
  TERMINEE: "bg-gray-200 text-gray-800",
};

const CANAL_LABELS: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  MIXTE: "Mixte",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "cartes" | "campagnes" | "statistiques";

const TABS: { key: Tab; label: string; icon: typeof CreditCard }[] = [
  { key: "cartes", label: "Cartes Donneur", icon: CreditCard },
  { key: "campagnes", label: "Campagnes Recrutement", icon: Megaphone },
  { key: "statistiques", label: "Statistiques", icon: BarChart3 },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FidelisationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("cartes");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/donneurs"
          className="text-blue-600 hover:text-blue-900 text-sm mb-2 inline-block"
        >
          ← Retour aux donneurs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Fidélisation Donneurs
        </h1>
        <p className="text-gray-700 mt-1">
          Gestion des cartes de fidélité, campagnes de recrutement et
          statistiques
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "cartes" && <CartesTab />}
      {activeTab === "campagnes" && <CampagnesTab />}
      {activeTab === "statistiques" && <StatistiquesTab />}
    </div>
  );
}

// ── Cartes Donneur Tab ───────────────────────────────────────────────────────

function CartesTab() {
  const [cartes, setCartes] = useState<CarteDonneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [niveauFilter, setNiveauFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchCartes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (niveauFilter) params.append("niveau", niveauFilter);
      if (activeFilter) params.append("is_active", activeFilter);
      params.append("offset", String((page - 1) * ITEMS_PER_PAGE));
      params.append("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`${API}/fidelisation/cartes?${params}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCartes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [niveauFilter, activeFilter, page]);

  useEffect(() => {
    fetchCartes();
  }, [fetchCartes]);

  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              value={niveauFilter}
              onChange={(e) => {
                setNiveauFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous</option>
              {NIVEAUX.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          <button
            onClick={() => fetchCartes()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2"
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
              onClick={() => fetchCartes()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && cartes.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            Aucune carte de fidélité trouvée
          </div>
        )}

        {!loading && !error && cartes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    N° Carte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Dons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date création
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cartes.map((carte) => (
                  <tr key={carte.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {carte.numero_carte}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${NIVEAU_COLORS[carte.niveau]}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${NIVEAU_DOT_COLORS[carte.niveau]}`}
                        />
                        {carte.niveau}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {carte.points.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {carte.total_dons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          carte.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {carte.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(carte.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-800">
            Page {page} • {cartes.length} résultats affichés
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
              disabled={cartes.length < ITEMS_PER_PAGE}
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

// ── Campagnes Tab ────────────────────────────────────────────────────────────

function CampagnesTab() {
  const [campagnes, setCampagnes] = useState<CampagneRecrutement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statutFilter, setStatutFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchCampagnes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statutFilter) params.append("statut", statutFilter);
      params.append("offset", String((page - 1) * ITEMS_PER_PAGE));
      params.append("limit", String(ITEMS_PER_PAGE));

      const res = await fetch(`${API}/fidelisation/campagnes?${params}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCampagnes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [statutFilter, page]);

  useEffect(() => {
    fetchCampagnes();
  }, [fetchCampagnes]);

  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
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
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          </div>

          <button
            onClick={() => fetchCampagnes()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center gap-2"
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
              onClick={() => fetchCampagnes()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && campagnes.length === 0 && (
          <div className="p-8 text-center text-gray-700">
            Aucune campagne trouvée
          </div>
        )}

        {!loading && !error && campagnes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contactés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Convertis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Taux conversion
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campagnes.map((campagne) => {
                  const taux =
                    campagne.nb_contactes > 0
                      ? (
                          (campagne.nb_convertis / campagne.nb_contactes) *
                          100
                        ).toFixed(1)
                      : "0.0";

                  return (
                    <tr
                      key={campagne.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {campagne.nom}
                        </div>
                        {campagne.description && (
                          <div className="text-xs text-gray-700 mt-0.5 max-w-xs truncate">
                            {campagne.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {CANAL_LABELS[campagne.canal] || campagne.canal}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            STATUT_CAMPAGNE_COLORS[campagne.statut] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campagne.statut === "EN_COURS"
                            ? "En cours"
                            : campagne.statut === "PLANIFIEE"
                              ? "Planifiée"
                              : "Terminée"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>{formatDate(campagne.date_debut)}</div>
                        <div className="text-xs text-gray-700">
                          au {formatDate(campagne.date_fin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {campagne.nb_contactes.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {campagne.nb_convertis.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`font-semibold ${
                            parseFloat(taux) >= 10
                              ? "text-green-700"
                              : parseFloat(taux) >= 5
                                ? "text-yellow-700"
                                : "text-red-700"
                          }`}
                        >
                          {taux} %
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && (
        <div className="flex justify-between items-center mt-4 bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-800">
            Page {page} • {campagnes.length} résultats affichés
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
              disabled={campagnes.length < ITEMS_PER_PAGE}
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

// ── Statistiques Tab ─────────────────────────────────────────────────────────

function StatistiquesTab() {
  const [cartes, setCartes] = useState<CarteDonneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCartes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/fidelisation/cartes?limit=10000`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCartes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCartes();
  }, [fetchAllCartes]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-700">
        Chargement des statistiques...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">Erreur de chargement</div>
        <div className="text-sm text-gray-800">{error}</div>
        <button
          onClick={() => fetchAllCartes()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const totalCartes = cartes.length;
  const totalPoints = cartes.reduce((sum, c) => sum + c.points, 0);
  const countByNiveau: Record<Niveau, number> = {
    BRONZE: 0,
    ARGENT: 0,
    OR: 0,
    PLATINE: 0,
  };
  cartes.forEach((c) => {
    if (c.niveau in countByNiveau) {
      countByNiveau[c.niveau]++;
    }
  });

  const niveauCards: {
    niveau: Niveau;
    label: string;
    color: string;
    bgColor: string;
    icon: typeof Award;
  }[] = [
    {
      niveau: "BRONZE",
      label: "Bronze",
      color: "text-amber-700",
      bgColor: "bg-amber-50 border-amber-200",
      icon: Award,
    },
    {
      niveau: "ARGENT",
      label: "Argent",
      color: "text-gray-700",
      bgColor: "bg-gray-50 border-gray-200",
      icon: Star,
    },
    {
      niveau: "OR",
      label: "Or",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50 border-yellow-200",
      icon: Gift,
    },
    {
      niveau: "PLATINE",
      label: "Platine",
      color: "text-purple-700",
      bgColor: "bg-purple-50 border-purple-200",
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total cartes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Total cartes actives
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {totalCartes.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        {/* Points distribués */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Points distribués
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {totalPoints.toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        {/* Dons totaux */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Gift className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Total dons (via cartes)
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {cartes
                  .reduce((sum, c) => sum + c.total_dons, 0)
                  .toLocaleString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Par niveau */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Répartition par niveau
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {niveauCards.map(({ niveau, label, color, bgColor, icon: Icon }) => (
            <div
              key={niveau}
              className={`rounded-xl border shadow-sm p-6 ${bgColor}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${NIVEAU_COLORS[niveau]}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${NIVEAU_DOT_COLORS[niveau]}`}
                  />
                  {label}
                </span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {countByNiveau[niveau].toLocaleString("fr-FR")}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {totalCartes > 0
                  ? ((countByNiveau[niveau] / totalCartes) * 100).toFixed(1)
                  : "0.0"}{" "}
                % du total
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
