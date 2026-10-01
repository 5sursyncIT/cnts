"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Calendar, CalendarCheck, Eye, MapPin, Plus, RefreshCw, Target, Timer } from "lucide-react";
import { toast } from "sonner";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  StatusBadge,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const API = "/api";

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
  code: string;
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

const TYPE_TONES: Record<CampagneCollecte["type_campagne"], BadgeTone> = {
  FIXE: "info",
  MOBILE: "success",
  ENTREPRISE: "purple",
  UNIVERSITE: "warning",
};

const TYPE_LABELS: Record<CampagneCollecte["type_campagne"], string> = {
  FIXE: "Fixe",
  MOBILE: "Mobile",
  ENTREPRISE: "Entreprise",
  UNIVERSITE: "Université",
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
  return `${formatDate(debut)} – ${formatDate(fin)}`;
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
    code: "",
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
      code: "",
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

  // Stable : la Modal ré-exécute son effet (focus) quand onClose change.
  const handleClose = useCallback(() => {
    setShowModal(false);
    setFormError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch(`${API}/collectes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.trim() || undefined,
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
      toast.success("Collecte créée");
      await fetchCollectes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  // ---------- Render ----------

  const hasFilters = Boolean(statutFilter || typeFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collectes"
        description="Planification et suivi des campagnes de collecte de sang"
        actions={
          <Button variant="success" onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouvelle collecte
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Statut">
            <Select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Toutes</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </Select>
          </Field>
          <Field label="Type de campagne">
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les types</option>
              <option value="FIXE">Fixe</option>
              <option value="MOBILE">Mobile</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="UNIVERSITE">Université</option>
            </Select>
          </Field>
          <div>
            <Button
              variant="secondary"
              onClick={() => fetchCollectes()}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Actualiser
            </Button>
          </div>
        </div>
      </Card>

      {status === "success" && collectes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Collectes affichées" value={collectes.length} icon={<Calendar className="h-5 w-5" aria-hidden="true" />} />
          <StatCard
            label="Planifiées"
            value={collectes.filter((c) => c.statut === "PLANIFIEE").length}
            tone="info"
            icon={<CalendarCheck className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="En cours"
            value={collectes.filter((c) => c.statut === "EN_COURS").length}
            tone="success"
            icon={<Timer className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Objectif total"
            value={collectes.reduce((sum, c) => sum + c.objectif_dons, 0)}
            hint="dons"
            icon={<Target className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {(status === "loading" || status === "idle") && <LoadingState rows={8} />}

        {status === "error" && <ErrorState message={error} onRetry={() => fetchCollectes()} />}

        {status === "success" && collectes.length === 0 && (
          <EmptyState
            icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
            title="Aucune collecte trouvée"
            description={hasFilters ? "Aucune collecte ne correspond à ces critères." : undefined}
            action={
              <Button variant="success" size="sm" onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Planifier une collecte
              </Button>
            }
          />
        )}

        {status === "success" && collectes.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Code</Th>
                  <Th>Nom</Th>
                  <Th>Type</Th>
                  <Th>Lieu</Th>
                  <Th>Dates</Th>
                  <Th>Objectif</Th>
                  <Th>Statut</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {collectes.map((collecte) => (
                  <Tr key={collecte.id}>
                    <Td className="whitespace-nowrap font-mono text-gray-900">{collecte.code}</Td>
                    <Td className="whitespace-nowrap">
                      <Link href={`/collectes/${collecte.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                        {collecte.nom}
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone={TYPE_TONES[collecte.type_campagne]}>{TYPE_LABELS[collecte.type_campagne]}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="flex items-center gap-1 text-gray-700">
                        <MapPin className="h-3 w-3 text-gray-400" aria-hidden="true" />
                        {collecte.lieu}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-gray-600">
                      {formatDateRange(collecte.date_debut, collecte.date_fin)}
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">{collecte.objectif_dons} dons</Td>
                    <Td>
                      <StatusBadge status={collecte.statut} />
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <Link
                        href={`/collectes/${collecte.id}`}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Voir
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              hasNext={collectes.length >= ITEMS_PER_PAGE}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              summary={`Page ${page} · ${collectes.length} résultat${collectes.length > 1 ? "s" : ""} affiché${collectes.length > 1 ? "s" : ""}`}
            />
          </>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={handleClose}
        title="Nouvelle collecte"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={formLoading}>
              Annuler
            </Button>
            <Button type="submit" form="collecte-create-form" variant="success" loading={formLoading}>
              {formLoading ? "Création…" : "Créer la collecte"}
            </Button>
          </>
        }
      >
        <form id="collecte-create-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <Field label="Nom de la campagne" required>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex. : Collecte UCAD janvier 2026"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" hint="Généré automatiquement si vide">
              <Input
                id="collecte-code"
                type="text"
                maxLength={32}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="Type de campagne" required>
              <Select
                value={formData.type_campagne}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type_campagne: e.target.value as CampagneCollecteCreate["type_campagne"],
                  })
                }
              >
                <option value="FIXE">Fixe</option>
                <option value="MOBILE">Mobile</option>
                <option value="ENTREPRISE">Entreprise</option>
                <option value="UNIVERSITE">Université</option>
              </Select>
            </Field>
          </div>

          <Field label="Lieu" required>
            <Input
              type="text"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              placeholder="Ex. : Campus UCAD, Dakar"
            />
          </Field>

          <Field label="Adresse">
            <Input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète…"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date de début" required>
              <Input
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
              />
            </Field>
            <Field label="Date de fin" required>
              <Input
                type="date"
                min={formData.date_debut || undefined}
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Objectif de dons" required>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={formData.objectif_dons}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  objectif_dons: parseInt(e.target.value, 10) || 0,
                })
              }
              placeholder="50"
            />
          </Field>

          <Field label="Notes matériel">
            <Textarea
              value={formData.materiel_notes}
              onChange={(e) => setFormData({ ...formData, materiel_notes: e.target.value })}
              placeholder="Poches, aiguilles, tables, tentes…"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
