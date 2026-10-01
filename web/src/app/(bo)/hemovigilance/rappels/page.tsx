"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle,
  Circle,
  Download,
  Eye,
  Lock,
  Package,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Modal,
  PageHeader,
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

// ── Types ──────────────────────────────────────

interface Rappel {
  id: string;
  type_cible: string;
  valeur_cible: string;
  motif: string | null;
  statut: string;
  updated_at: string | null;
  notified_at: string | null;
  confirmed_at: string | null;
  closed_at: string | null;
  created_at: string;
}

interface RappelAction {
  id: string;
  rappel_id: string;
  action: string;
  validateur_id: string | null;
  note: string | null;
  created_at: string;
}

interface Impact {
  poche_id: string;
  don_id: string;
  din: string;
  type_produit: string;
  lot: string | null;
  statut_distribution: string;
  hopital_id: string | null;
  receveur_id: string | null;
  commande_id: string | null;
  date_transfusion: string | null;
}

// ── Helpers ────────────────────────────────────

const API = "/api/hemovigilance";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUT_RAPPEL: Record<string, [BadgeTone, string]> = {
  OUVERT: ["danger", "Ouvert"],
  NOTIFIE: ["warning", "Notifié"],
  CONFIRME: ["info", "Confirmé"],
  CLOTURE: ["success", "Clôturé"],
};

function statutLabel(statut: string) {
  return STATUT_RAPPEL[statut]?.[1] ?? statut;
}

function statutBadge(statut: string) {
  const [tone, label] = STATUT_RAPPEL[statut] ?? ["neutral", statut];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

function typeCibleBadge(type: string) {
  return <Badge tone={type === "DIN" ? "purple" : "info"}>{type === "DIN" ? "DIN" : "LOT"}</Badge>;
}

// ── Main Page ──────────────────────────────────

export default function RappelsPage() {
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRappel, setSelectedRappel] = useState<Rappel | null>(null);

  const fetchRappels = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterStatut) params.set("statut", filterStatut);
      const res = await fetch(`${API}/rappels?${params}`);
      if (res.ok) setRappels(await res.json());
      else setLoadError(`Le serveur a répondu avec l’erreur ${res.status}.`);
    } catch {
      setLoadError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [filterStatut]);

  useEffect(() => {
    fetchRappels();
  }, [fetchRappels]);

  const closeCreate = useCallback(() => setShowCreateModal(false), []);

  const filtered = rappels.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.valeur_cible.toLowerCase().includes(q) ||
      r.type_cible.toLowerCase().includes(q) ||
      (r.motif && r.motif.toLowerCase().includes(q))
    );
  });

  // Stats
  const stats = {
    total: rappels.length,
    ouverts: rappels.filter((r) => r.statut === "OUVERT").length,
    notifies: rappels.filter((r) => r.statut === "NOTIFIE").length,
    confirmes: rappels.filter((r) => r.statut === "CONFIRME").length,
    clotures: rappels.filter((r) => r.statut === "CLOTURE").length,
  };

  if (selectedRappel) {
    return (
      <RappelDetail
        rappel={selectedRappel}
        onBack={() => {
          setSelectedRappel(null);
          fetchRappels();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rappels et alertes"
        description="Rappels de produits sanguins par DIN ou par lot"
        back={{ href: "/hemovigilance", label: "Hémovigilance" }}
        actions={
          <Button variant="danger" onClick={() => setShowCreateModal(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouveau rappel
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ouverts" value={stats.ouverts} tone={stats.ouverts > 0 ? "warning" : "neutral"} />
        <StatCard label="Notifiés" value={stats.notifies} />
        <StatCard label="Confirmés" value={stats.confirmes} />
        <StatCard label="Clôturés" value={stats.clotures} />
      </div>

      <Card>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Recherche" className="lg:col-span-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="DIN, lot, motif…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Statut">
              <Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                <option value="">Tous les statuts</option>
                <option value="OUVERT">Ouvert</option>
                <option value="NOTIFIE">Notifié</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="CLOTURE">Clôturé</option>
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={fetchRappels} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={rappels.length === 0 ? "Aucun rappel enregistré" : "Aucun rappel ne correspond à la recherche"}
            icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Type</Th>
                <Th>Cible</Th>
                <Th>Motif</Th>
                <Th>Statut</Th>
                <Th>Créé le</Th>
                <Th>Notifié</Th>
                <Th>Clôturé</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {filtered.map((r) => (
                <Tr key={r.id}>
                  <Td>{typeCibleBadge(r.type_cible)}</Td>
                  <Td className="font-mono font-medium text-gray-900">{r.valeur_cible}</Td>
                  <Td className="max-w-[250px] truncate text-gray-600">{r.motif || "—"}</Td>
                  <Td>{statutBadge(r.statut)}</Td>
                  <Td className="whitespace-nowrap text-gray-600">{fmtDate(r.created_at)}</Td>
                  <Td className="whitespace-nowrap text-gray-600">{fmtDate(r.notified_at)}</Td>
                  <Td className="whitespace-nowrap text-gray-600">{fmtDate(r.closed_at)}</Td>
                  <Td align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedRappel(r)}
                      icon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                      aria-label={`Détail du rappel ${r.valeur_cible}`}
                    >
                      Détail
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <CreateRappelModal
        open={showCreateModal}
        onClose={closeCreate}
        onCreated={() => {
          setShowCreateModal(false);
          toast.success("Rappel créé");
          fetchRappels();
        }}
      />
    </div>
  );
}

// ── Create Modal ───────────────────────────────

function CreateRappelModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [typeCible, setTypeCible] = useState("DIN");
  const [valeurCible, setValeurCible] = useState("");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valeurCible.trim()) {
      setError("La valeur cible est obligatoire");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/rappels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_cible: typeCible,
          valeur_cible: valeurCible.trim(),
          motif: motif.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.detail === "string" ? data.detail : `Erreur ${res.status}`);
        return;
      }
      setValeurCible("");
      setMotif("");
      onCreated();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouveau rappel"
      description="Le rappel identifie toutes les poches concernées et leurs destinataires."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" form="rappel-form" variant="danger" loading={submitting}>
            {submitting ? "Création…" : "Créer le rappel"}
          </Button>
        </>
      }
    >
      <form id="rappel-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label="Type de cible">
          <Select value={typeCible} onChange={(e) => setTypeCible(e.target.value)}>
            <option value="DIN">DIN (don individuel)</option>
            <option value="LOT">LOT (lot de poches)</option>
          </Select>
        </Field>

        <Field label={typeCible === "DIN" ? "Numéro DIN" : "Numéro de lot"} required>
          <Input
            type="text"
            value={valeurCible}
            onChange={(e) => setValeurCible(e.target.value)}
            placeholder={typeCible === "DIN" ? "Ex. : CNTS2500100001" : "Ex. : LOT-2025-001"}
          />
        </Field>

        <Field label="Motif du rappel">
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            placeholder="Décrivez la raison du rappel"
          />
        </Field>
      </form>
    </Modal>
  );
}

// ── Detail View ────────────────────────────────

function RappelDetail({ rappel: initialRappel, onBack }: { rappel: Rappel; onBack: () => void }) {
  const [rappel, setRappel] = useState(initialRappel);
  const [actions, setActions] = useState<RappelAction[]>([]);
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [loadingActions, setLoadingActions] = useState(true);
  const [loadingImpacts, setLoadingImpacts] = useState(true);
  const [activeTab, setActiveTab] = useState<"impacts" | "actions">("impacts");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    const [actRes, impRes, rapRes] = await Promise.all([
      fetch(`${API}/rappels/${rappel.id}/actions`),
      fetch(`${API}/rappels/${rappel.id}/impacts`),
      fetch(`${API}/rappels/${rappel.id}`),
    ]);
    if (actRes.ok) {
      setActions(await actRes.json());
      setLoadingActions(false);
    }
    if (impRes.ok) {
      setImpacts(await impRes.json());
      setLoadingImpacts(false);
    }
    if (rapRes.ok) {
      setRappel(await rapRes.json());
    }
  }, [rappel.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleWorkflowAction = async (action: "notifier" | "confirmer" | "cloturer") => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/rappels/${rappel.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validateur_id: null,
          note: actionNote.trim() || null,
        }),
      });
      if (res.ok) {
        setRappel(await res.json());
        setActionNote("");
        toast.success(
          action === "notifier" ? "Rappel notifié" : action === "confirmer" ? "Rappel confirmé" : "Rappel clôturé"
        );
        // Refresh actions
        const actRes = await fetch(`${API}/rappels/${rappel.id}/actions`);
        if (actRes.ok) setActions(await actRes.json());
      } else {
        const data = await res.json().catch(() => null);
        toast.error(typeof data?.detail === "string" ? data.detail : `Erreur ${res.status}`);
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (type: "hopitaux" | "receveurs", format: "csv" | "json") => {
    window.open(`${API}/rappels/${rappel.id}/export/${type}?format=${format}`, "_blank");
  };

  const nextAction = (() => {
    switch (rappel.statut) {
      case "OUVERT":
        return { action: "notifier" as const, label: "Notifier", icon: Bell, variant: "primary" as const };
      case "NOTIFIE":
        return { action: "confirmer" as const, label: "Confirmer", icon: CheckCircle, variant: "primary" as const };
      case "CONFIRME":
        return { action: "cloturer" as const, label: "Clôturer", icon: Lock, variant: "success" as const };
      default:
        return null;
    }
  })();

  // Impact stats
  const impactStats = {
    total: impacts.length,
    distribues: impacts.filter((i) => i.statut_distribution === "DISTRIBUE").length,
    reserves: impacts.filter((i) => i.statut_distribution === "RESERVE").length,
    enStock: impacts.filter((i) => ["DISPONIBLE", "EN_STOCK", "NON_DISTRIBUABLE"].includes(i.statut_distribution)).length,
  };

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
      active ? "border-brand-600 text-brand-700" : "border-transparent text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />} className="-ml-3 mb-2">
          Rappels
        </Button>
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-brand-600" aria-hidden="true" />
              Rappel {typeCibleBadge(rappel.type_cible)}
              <span className="font-mono">{rappel.valeur_cible}</span>
              {statutBadge(rappel.statut)}
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Informations" />
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Type de cible" value={rappel.type_cible === "DIN" ? "Don individuel (DIN)" : "Lot de poches"} />
              <InfoRow label="Valeur cible" value={rappel.valeur_cible} mono />
              <InfoRow label="Statut" value={statutLabel(rappel.statut)} />
              <InfoRow label="Créé le" value={fmtDate(rappel.created_at)} />
              <InfoRow label="Notifié le" value={fmtDate(rappel.notified_at)} />
              <InfoRow label="Confirmé le" value={fmtDate(rappel.confirmed_at)} />
              <InfoRow label="Clôturé le" value={fmtDate(rappel.closed_at)} />
            </dl>
            {rappel.motif && (
              <Alert tone="danger" className="mt-4">
                <p className="mb-1 text-xs font-medium">Motif du rappel</p>
                <p>{rappel.motif}</p>
              </Alert>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Circuit du rappel" />
          <CardBody>
            <ol className="mb-6 space-y-3">
              <WorkflowStep label="Ouvert" done={true} />
              <WorkflowStep label="Notifié" done={["NOTIFIE", "CONFIRME", "CLOTURE"].includes(rappel.statut)} />
              <WorkflowStep label="Confirmé" done={["CONFIRME", "CLOTURE"].includes(rappel.statut)} />
              <WorkflowStep label="Clôturé" done={rappel.statut === "CLOTURE"} />
            </ol>

            {nextAction && (
              <div className="space-y-3">
                <Field label="Note" hint="Facultative">
                  <Textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={2} />
                </Field>
                <Button
                  variant={nextAction.variant}
                  className="w-full"
                  onClick={() => handleWorkflowAction(nextAction.action)}
                  loading={submitting}
                  icon={<nextAction.icon className="h-4 w-4" aria-hidden="true" />}
                >
                  {submitting ? "En cours…" : nextAction.label}
                </Button>
              </div>
            )}

            {rappel.statut === "CLOTURE" && (
              <p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                <Lock className="h-4 w-4" aria-hidden="true" />
                Rappel clôturé
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Poches impactées" value={impactStats.total} />
        <StatCard label="Distribuées" value={impactStats.distribues} tone={impactStats.distribues > 0 ? "warning" : "neutral"} />
        <StatCard label="Réservées" value={impactStats.reserves} />
        <StatCard label="En stock" value={impactStats.enStock} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-2">
          <div role="tablist" aria-label="Détail du rappel" className="flex">
            <button
              type="button"
              role="tab"
              id="tab-impacts"
              aria-selected={activeTab === "impacts"}
              aria-controls="panel-impacts"
              onClick={() => setActiveTab("impacts")}
              className={tabClass(activeTab === "impacts")}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Poches impactées ({impacts.length})
            </button>
            <button
              type="button"
              role="tab"
              id="tab-actions"
              aria-selected={activeTab === "actions"}
              aria-controls="panel-actions"
              onClick={() => setActiveTab("actions")}
              className={tabClass(activeTab === "actions")}
            >
              Historique des actions ({actions.length})
            </button>
          </div>
          <div className="flex-1" />
          {impacts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-2 py-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport("hopitaux", "csv")}
                icon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Export hôpitaux (CSV)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport("receveurs", "csv")}
                icon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Export receveurs (CSV)
              </Button>
            </div>
          )}
        </div>

        {activeTab === "impacts" && (
          <div role="tabpanel" id="panel-impacts" aria-labelledby="tab-impacts">
            {loadingImpacts ? (
              <LoadingState label="Chargement des impacts…" />
            ) : impacts.length === 0 ? (
              <EmptyState title="Aucune poche impactée trouvée" icon={<Package className="h-6 w-6" aria-hidden="true" />} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>DIN</Th>
                    <Th>Produit</Th>
                    <Th>Lot</Th>
                    <Th>Distribution</Th>
                    <Th>Transfusée le</Th>
                  </tr>
                </THead>
                <TBody>
                  {impacts.map((imp) => (
                    <Tr key={imp.poche_id}>
                      <Td className="font-mono">{imp.din}</Td>
                      <Td>{imp.type_produit}</Td>
                      <Td className="font-mono text-gray-600">{imp.lot || "—"}</Td>
                      <Td>
                        <StatusBadge status={imp.statut_distribution} />
                      </Td>
                      <Td className="whitespace-nowrap text-gray-600">{fmtDate(imp.date_transfusion)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        )}

        {activeTab === "actions" && (
          <div role="tabpanel" id="panel-actions" aria-labelledby="tab-actions">
            {loadingActions ? (
              <LoadingState />
            ) : actions.length === 0 ? (
              <EmptyState title="Aucune action enregistrée" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {actions.map((a) => (
                  <li key={a.id} className="flex items-start gap-4 px-5 py-4">
                    <ActionIcon action={a.action} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{actionLabel(a.action)}</span>
                        <span className="text-xs text-gray-500">{fmtDate(a.created_at)}</span>
                      </div>
                      {a.note && <p className="mt-1 text-sm text-gray-600">{a.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Sub components ─────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function WorkflowStep({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-3">
      {done ? (
        <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Circle className="h-5 w-5 text-gray-300" aria-hidden="true" />
      )}
      <span className={`text-sm ${done ? "font-medium text-gray-900" : "text-gray-500"}`}>
        {label}
        {done ? <span className="sr-only"> (étape franchie)</span> : null}
      </span>
    </li>
  );
}

function ActionIcon({ action }: { action: string }) {
  const map: Record<string, { bg: string; icon: typeof Bell }> = {
    CREER: { bg: "bg-red-50 text-red-600", icon: Plus },
    NOTIFIER: { bg: "bg-amber-50 text-amber-600", icon: Bell },
    CONFIRMER: { bg: "bg-blue-50 text-blue-600", icon: CheckCircle },
    CLOTURER: { bg: "bg-emerald-50 text-emerald-600", icon: Lock },
  };
  const item = map[action] || { bg: "bg-gray-100 text-gray-600", icon: AlertTriangle };
  const Icon = item.icon;
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.bg}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    CREER: "Rappel créé",
    NOTIFIER: "Notification envoyée",
    CONFIRMER: "Rappel confirmé",
    CLOTURER: "Rappel clôturé",
  };
  return map[action] || action;
}
