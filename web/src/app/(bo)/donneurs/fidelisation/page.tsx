"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Megaphone,
  BarChart3,
  RefreshCw,
  Award,
  Users,
  Star,
  Gift,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  Table,
  TBody,
  THead,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const API = "/api";

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

const NIVEAU_META: Record<Niveau, { label: string; tone: BadgeTone; icon: typeof Award }> = {
  BRONZE: { label: "Bronze", tone: "warning", icon: Award },
  ARGENT: { label: "Argent", tone: "neutral", icon: Star },
  OR: { label: "Or", tone: "warning", icon: Gift },
  PLATINE: { label: "Platine", tone: "purple", icon: Award },
};

function NiveauBadge({ niveau }: { niveau: Niveau }) {
  const meta = NIVEAU_META[niveau];
  return (
    <Badge tone={meta?.tone ?? "neutral"} dot>
      {meta?.label ?? niveau}
    </Badge>
  );
}

const CANAL_LABELS: Record<string, string> = {
  SMS: "SMS",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  MIXTE: "Mixte",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "cartes" | "campagnes" | "statistiques";

const TABS: { key: Tab; label: string; icon: typeof CreditCard }[] = [
  { key: "cartes", label: "Cartes donneur", icon: CreditCard },
  { key: "campagnes", label: "Campagnes de recrutement", icon: Megaphone },
  { key: "statistiques", label: "Statistiques", icon: BarChart3 },
];

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FidelisationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("cartes");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fidélisation"
        description="Cartes de fidélité, campagnes de recrutement et statistiques."
        back={{ href: "/donneurs", label: "Donneurs" }}
      />

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <div role="tablist" aria-label="Sections de fidélisation" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === key
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "cartes" && <CartesTab />}
        {activeTab === "campagnes" && <CampagnesTab />}
        {activeTab === "statistiques" && <StatistiquesTab />}
      </div>
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
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardBody className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Niveau">
            <Select
              value={niveauFilter}
              onChange={(e) => {
                setNiveauFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              {NIVEAUX.map((n) => (
                <option key={n} value={n}>
                  {NIVEAU_META[n].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Statut">
            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>

          <div>
            <Button variant="secondary" onClick={() => fetchCartes()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Actualiser
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        {loading && <LoadingState />}

        {error && !loading && <ErrorState message={error} onRetry={() => fetchCartes()} />}

        {!loading && !error && cartes.length === 0 && (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" aria-hidden="true" />}
            title="Aucune carte de fidélité trouvée"
            description="Modifiez les filtres pour élargir la recherche."
          />
        )}

        {!loading && !error && cartes.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>N° carte</Th>
                <Th>Niveau</Th>
                <Th align="right">Points</Th>
                <Th align="right">Total dons</Th>
                <Th>Statut</Th>
                <Th>Créée le</Th>
              </tr>
            </THead>
            <TBody>
              {cartes.map((carte) => (
                <Tr key={carte.id}>
                  <Td className="whitespace-nowrap font-mono font-medium text-gray-900">{carte.numero_carte}</Td>
                  <Td>
                    <NiveauBadge niveau={carte.niveau} />
                  </Td>
                  <Td align="right" className="font-medium tabular-nums text-gray-900">
                    {carte.points.toLocaleString("fr-FR")}
                  </Td>
                  <Td align="right" className="tabular-nums">{carte.total_dons}</Td>
                  <Td>
                    <Badge tone={carte.is_active ? "success" : "neutral"} dot>
                      {carte.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap">{formatDate(carte.created_at)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}

        {!loading && !error && (cartes.length > 0 || page > 1) && (
          <Pagination
            page={page}
            hasNext={cartes.length >= ITEMS_PER_PAGE}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            summary={`Page ${page} · ${cartes.length} résultat(s) affiché(s)`}
          />
        )}
      </Card>
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
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardBody className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Statut">
            <Select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
            </Select>
          </Field>

          <div>
            <Button variant="secondary" onClick={() => fetchCampagnes()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Actualiser
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        {loading && <LoadingState />}

        {error && !loading && <ErrorState message={error} onRetry={() => fetchCampagnes()} />}

        {!loading && !error && campagnes.length === 0 && (
          <EmptyState
            icon={<Megaphone className="h-6 w-6" aria-hidden="true" />}
            title="Aucune campagne trouvée"
            description="Modifiez le filtre de statut pour élargir la recherche."
          />
        )}

        {!loading && !error && campagnes.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Nom</Th>
                <Th>Canal</Th>
                <Th>Statut</Th>
                <Th>Période</Th>
                <Th align="right">Contactés</Th>
                <Th align="right">Convertis</Th>
                <Th align="right">Taux de conversion</Th>
              </tr>
            </THead>
            <TBody>
              {campagnes.map((campagne) => {
                const taux =
                  campagne.nb_contactes > 0
                    ? (
                        (campagne.nb_convertis / campagne.nb_contactes) *
                        100
                      ).toFixed(1)
                    : "0.0";
                const tauxNum = parseFloat(taux);

                return (
                  <Tr key={campagne.id}>
                    <Td>
                      <div className="font-medium text-gray-900">{campagne.nom}</div>
                      {campagne.description && (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-gray-600" title={campagne.description}>
                          {campagne.description}
                        </div>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">{CANAL_LABELS[campagne.canal] || campagne.canal}</Td>
                    <Td>
                      <StatusBadge status={campagne.statut} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div>{formatDate(campagne.date_debut)}</div>
                      <div className="text-xs text-gray-600">au {formatDate(campagne.date_fin)}</div>
                    </Td>
                    <Td align="right" className="font-medium tabular-nums text-gray-900">
                      {campagne.nb_contactes.toLocaleString("fr-FR")}
                    </Td>
                    <Td align="right" className="font-medium tabular-nums text-gray-900">
                      {campagne.nb_convertis.toLocaleString("fr-FR")}
                    </Td>
                    <Td align="right">
                      <Badge tone={tauxNum >= 10 ? "success" : tauxNum >= 5 ? "warning" : "danger"}>
                        {taux.replace(".", ",")} %
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}

        {!loading && !error && (campagnes.length > 0 || page > 1) && (
          <Pagination
            page={page}
            hasNext={campagnes.length >= ITEMS_PER_PAGE}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            summary={`Page ${page} · ${campagnes.length} résultat(s) affiché(s)`}
          />
        )}
      </Card>
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
      const res = await fetch(`${API}/fidelisation/cartes?limit=500`);
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
      <Card>
        <LoadingState label="Chargement des statistiques…" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorState message={error} onRetry={() => fetchAllCartes()} />
      </Card>
    );
  }

  const totalCartes = cartes.length;
  const totalPoints = cartes.reduce((sum, c) => sum + c.points, 0);
  const totalDons = cartes.reduce((sum, c) => sum + c.total_dons, 0);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cartes de fidélité"
          value={totalCartes.toLocaleString("fr-FR")}
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Points distribués"
          value={totalPoints.toLocaleString("fr-FR")}
          icon={<Star className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Total dons (via cartes)"
          value={totalDons.toLocaleString("fr-FR")}
          icon={<Gift className="h-5 w-5" aria-hidden="true" />}
          tone="danger"
        />
      </div>

      <Card>
        <CardHeader title="Répartition par niveau" />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NIVEAUX.map((niveau) => {
            const Icon = NIVEAU_META[niveau].icon;
            const pct = totalCartes > 0 ? (countByNiveau[niveau] / totalCartes) * 100 : 0;
            return (
              <div key={niveau} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <NiveauBadge niveau={niveau} />
                  <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-gray-900">
                  {countByNiveau[niveau].toLocaleString("fr-FR")}
                </p>
                <p className="mt-1 text-sm text-gray-600">{pct.toFixed(1).replace(".", ",")} % du total</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
