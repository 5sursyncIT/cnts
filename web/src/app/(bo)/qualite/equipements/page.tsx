"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  RefreshCw,
  Wrench,
  Thermometer,
  FlaskConical,
  Scale,
  Wind,
  Snowflake,
  Gauge,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const API = "/api";

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
  { value: "REFRIGERATEUR", label: "Réfrigérateur" },
  { value: "CONGELATEUR", label: "Congélateur" },
  { value: "AGITATEUR", label: "Agitateur" },
  { value: "BALANCE", label: "Balance" },
  { value: "THERMOMETRE", label: "Thermomètre" },
];

const STATUTS: { value: StatutEquipement; label: string }[] = [
  { value: "EN_SERVICE", label: "En service" },
  { value: "EN_PANNE", label: "En panne" },
  { value: "EN_MAINTENANCE", label: "En maintenance" },
  { value: "HORS_SERVICE", label: "Hors service" },
  { value: "REFORME", label: "Réformé" },
];

function getCategorieLabel(cat: CategorieEquipement): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function getCategorieIcon(cat: CategorieEquipement) {
  const cls = "h-3.5 w-3.5";
  switch (cat) {
    case "AUTOMATE_ANALYSE":
      return <FlaskConical className={cls} aria-hidden="true" />;
    case "CENTRIFUGEUSE":
      return <Gauge className={cls} aria-hidden="true" />;
    case "REFRIGERATEUR":
    case "CONGELATEUR":
      return <Snowflake className={cls} aria-hidden="true" />;
    case "AGITATEUR":
      return <Wind className={cls} aria-hidden="true" />;
    case "BALANCE":
      return <Scale className={cls} aria-hidden="true" />;
    case "THERMOMETRE":
      return <Thermometer className={cls} aria-hidden="true" />;
    default:
      return <Wrench className={cls} aria-hidden="true" />;
  }
}

const STATUT_TONES: Record<StatutEquipement, BadgeTone> = {
  EN_SERVICE: "success",
  EN_PANNE: "danger",
  EN_MAINTENANCE: "warning",
  HORS_SERVICE: "neutral",
  REFORME: "neutral",
};

function getStatutLabel(statut: StatutEquipement): string {
  return STATUTS.find((s) => s.value === statut)?.label ?? statut;
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function DueDate({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">—</span>;
  if (isOverdue(value)) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-red-700">
        {formatDate(value)}
        <Badge tone="danger">En retard</Badge>
      </span>
    );
  }
  return <span>{formatDate(value)}</span>;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

  const closeModal = useCallback(() => setShowModal(false), []);

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
          body?.detail || `Erreur ${res.status} lors de la création`
        );
      }

      toast.success("Équipement créé");
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

  const hasFilters = Boolean(categorieFilter || statutFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipements"
        description="Qualification et suivi des équipements du laboratoire."
        back={{ href: "/qualite", label: "Qualité" }}
        actions={
          <Button onClick={() => setShowModal(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouvel équipement
          </Button>
        }
      />

      <Card>
        {/* Filtres */}
        <div className="grid items-end gap-3 border-b border-gray-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Catégorie">
            <Select value={categorieFilter} onChange={(e) => setCategorieFilter(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              {STATUTS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-2 lg:col-span-2 lg:justify-end">
            {hasFilters ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setCategorieFilter("");
                  setStatutFilter("");
                }}
              >
                Réinitialiser
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => fetchEquipements()}
              loading={loading}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Actualiser
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchEquipements()} />
        ) : equipements.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-6 w-6" aria-hidden="true" />}
            title="Aucun équipement trouvé"
            description={hasFilters ? "Aucun équipement ne correspond à ces filtres." : "Enregistrez le premier équipement du laboratoire."}
            action={
              hasFilters ? undefined : (
                <Button size="sm" onClick={() => setShowModal(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                  Nouvel équipement
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Code inv.</Th>
                  <Th>Nom</Th>
                  <Th>Catégorie</Th>
                  <Th>Marque / modèle</Th>
                  <Th>Statut</Th>
                  <Th>Proch. maintenance</Th>
                  <Th>Proch. calibration</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </tr>
              </THead>
              <TBody>
                {equipements.map((eq) => (
                  <Tr key={eq.id}>
                    <Td className="whitespace-nowrap font-mono font-medium text-gray-900">{eq.code_inventaire}</Td>
                    <Td className="text-gray-900">{eq.nom}</Td>
                    <Td>
                      <Badge tone="neutral">
                        {getCategorieIcon(eq.categorie)}
                        {getCategorieLabel(eq.categorie)}
                      </Badge>
                    </Td>
                    <Td>
                      <div>{eq.marque}</div>
                      <div className="text-xs text-gray-500">{eq.modele}</div>
                    </Td>
                    <Td>
                      <Badge tone={STATUT_TONES[eq.statut] ?? "neutral"} dot>{getStatutLabel(eq.statut)}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <DueDate value={eq.date_prochaine_maintenance} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <DueDate value={eq.date_prochaine_calibration} />
                    </Td>
                    <Td align="right">
                      <ButtonLink
                        href={`/qualite/equipements/${eq.id}`}
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="h-4 w-4" aria-hidden="true" />}
                      >
                        Voir<span className="sr-only"> {eq.nom}</span>
                      </ButtonLink>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
              {equipements.length} équipement{equipements.length > 1 ? "s" : ""} affiché{equipements.length > 1 ? "s" : ""}
            </p>
          </>
        )}
      </Card>

      {/* Modale : nouvel équipement */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Nouvel équipement"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Annuler
            </Button>
            <Button type="submit" form="equipement-form" loading={submitting}>
              Créer l&apos;équipement
            </Button>
          </>
        }
      >
        <form id="equipement-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code inventaire" required>
              <Input
                type="text"
                value={form.code_inventaire}
                onChange={(e) => setForm({ ...form, code_inventaire: e.target.value })}
                placeholder="EQ-2024-001"
              />
            </Field>
            <Field label="Catégorie" required>
              <Select
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value as CategorieEquipement })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Nom" required>
            <Input
              type="text"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Automate Sysmex XN-1000"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marque" required>
              <Input
                type="text"
                value={form.marque}
                onChange={(e) => setForm({ ...form, marque: e.target.value })}
                placeholder="Sysmex"
              />
            </Field>
            <Field label="Modèle" required>
              <Input
                type="text"
                value={form.modele}
                onChange={(e) => setForm({ ...form, modele: e.target.value })}
                placeholder="XN-1000"
              />
            </Field>
            <Field label="Numéro de série" required>
              <Input
                type="text"
                value={form.numero_serie}
                onChange={(e) => setForm({ ...form, numero_serie: e.target.value })}
                placeholder="SN-123456789"
              />
            </Field>
            <Field label="Date de mise en service" required>
              <Input
                type="date"
                value={form.date_mise_service}
                onChange={(e) => setForm({ ...form, date_mise_service: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Localisation" required>
            <Input
              type="text"
              value={form.localisation}
              onChange={(e) => setForm({ ...form, localisation: e.target.value })}
              placeholder="Laboratoire principal - Salle 3"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
