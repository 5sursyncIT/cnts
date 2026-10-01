"use client";

import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  FileText,
  AlertTriangle,
  CheckSquare,
  ClipboardCheck,
  Plus,
  Eye,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
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
  StatCard,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  statusLabel,
  type BadgeTone,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentQualite {
  id: string;
  code: string;
  titre: string;
  type_document: "PROCEDURE" | "MODE_OPERATOIRE" | "FORMULAIRE" | "ENREGISTREMENT" | "POLITIQUE";
  version: string;
  statut: "BROUILLON" | "EN_REVUE" | "APPROUVE" | "OBSOLETE";
  fichier_url: string | null;
  date_approbation: string | null;
  date_revision: string | null;
  created_at: string;
}

interface NonConformite {
  id: string;
  code: string;
  titre: string;
  description: string;
  type_nc: "PRODUIT" | "PROCESSUS" | "EQUIPEMENT" | "DOCUMENT" | "PERSONNEL" | "AUTRE";
  gravite: "MINEURE" | "MAJEURE" | "CRITIQUE";
  statut: "OUVERTE" | "EN_INVESTIGATION" | "ACTION_CORRECTIVE" | "VERIFIEE" | "CLOTUREE";
  cause_racine: string | null;
  action_immediate: string | null;
  action_corrective: string | null;
  date_cloture: string | null;
  created_at: string;
}

interface CAPA {
  id: string;
  code: string;
  non_conformite_id: string | null;
  type_action: "CORRECTIVE" | "PREVENTIVE";
  description: string;
  date_echeance: string;
  statut: "PLANIFIEE" | "EN_COURS" | "REALISEE" | "VERIFIEE" | "EFFICACE" | "INEFFICACE";
  verification: string | null;
  efficacite: string | null;
  created_at: string;
}

interface AuditInterne {
  id: string;
  code: string;
  titre: string;
  processus_audite: string;
  date_audit: string;
  statut: "PLANIFIE" | "EN_COURS" | "RAPPORT_REDIGE" | "CLOTURE";
  constats: string | null;
  conclusion: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API = "/api";

type TabKey = "documents" | "nc" | "capa" | "audits";

const TABS: { key: TabKey; label: string }[] = [
  { key: "documents", label: "Documents" },
  { key: "nc", label: "Non-conformités" },
  { key: "capa", label: "CAPA" },
  { key: "audits", label: "Audits" },
];

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const DOC_STATUTS = ["BROUILLON", "EN_REVUE", "APPROUVE", "OBSOLETE"] as const;
const NC_STATUTS = ["OUVERTE", "EN_INVESTIGATION", "ACTION_CORRECTIVE", "VERIFIEE", "CLOTUREE"] as const;
const CAPA_STATUTS = ["PLANIFIEE", "EN_COURS", "REALISEE", "VERIFIEE", "EFFICACE", "INEFFICACE"] as const;
const AUDIT_STATUTS = ["PLANIFIE", "EN_COURS", "RAPPORT_REDIGE", "CLOTURE"] as const;

// Labels français des valeurs d'énumération (statuts, types, gravités).
const LABELS: Record<string, string> = {
  EN_REVUE: "En revue",
  APPROUVE: "Approuvé",
  OBSOLETE: "Obsolète",
  EN_INVESTIGATION: "En investigation",
  ACTION_CORRECTIVE: "Action corrective",
  VERIFIEE: "Vérifiée",
  REALISEE: "Réalisée",
  EFFICACE: "Efficace",
  INEFFICACE: "Inefficace",
  RAPPORT_REDIGE: "Rapport rédigé",
  PROCEDURE: "Procédure",
  MODE_OPERATOIRE: "Mode opératoire",
  EQUIPEMENT: "Équipement",
  PREVENTIVE: "Préventive",
};

function label(value: string): string {
  return LABELS[value] ?? statusLabel(value);
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-800 ring-gray-200",
  info: "bg-blue-50 text-blue-800 ring-blue-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
  purple: "bg-violet-50 text-violet-800 ring-violet-200",
};

/** Sélecteur de statut présenté comme un badge (changement de statut en ligne). */
function StatutSelect(props: {
  value: string;
  options: readonly string[];
  tone: BadgeTone;
  label: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label={props.label}
      value={props.value}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.value)}
      className={`cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-7 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 ${TONE_CLASSES[props.tone]}`}
    >
      {props.options.map((o) => (
        <option key={o} value={o}>{label(o)}</option>
      ))}
    </select>
  );
}

const DOC_TYPE_TONES: Record<DocumentQualite["type_document"], BadgeTone> = {
  PROCEDURE: "info",
  MODE_OPERATOIRE: "info",
  FORMULAIRE: "purple",
  ENREGISTREMENT: "neutral",
  POLITIQUE: "neutral",
};

const DOC_STATUT_TONES: Record<DocumentQualite["statut"], BadgeTone> = {
  BROUILLON: "neutral",
  EN_REVUE: "warning",
  APPROUVE: "success",
  OBSOLETE: "danger",
};

const NC_GRAVITE_TONES: Record<NonConformite["gravite"], BadgeTone> = {
  CRITIQUE: "danger",
  MAJEURE: "warning",
  MINEURE: "neutral",
};

const NC_STATUT_TONES: Record<NonConformite["statut"], BadgeTone> = {
  OUVERTE: "danger",
  EN_INVESTIGATION: "warning",
  ACTION_CORRECTIVE: "info",
  VERIFIEE: "purple",
  CLOTUREE: "success",
};

const CAPA_STATUT_TONES: Record<CAPA["statut"], BadgeTone> = {
  PLANIFIEE: "neutral",
  EN_COURS: "info",
  REALISEE: "info",
  VERIFIEE: "purple",
  EFFICACE: "success",
  INEFFICACE: "danger",
};

const AUDIT_STATUT_TONES: Record<AuditInterne["statut"], BadgeTone> = {
  PLANIFIE: "neutral",
  EN_COURS: "info",
  RAPPORT_REDIGE: "purple",
  CLOTURE: "success",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function QualitePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("documents");

  // Data state
  const [documents, setDocuments] = useState<DocumentQualite[]>([]);
  const [ncs, setNcs] = useState<NonConformite[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [audits, setAudits] = useState<AuditInterne[]>([]);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ------ Fetch all data ------
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, ncRes, capaRes, auditRes] = await Promise.all([
        fetch(`${API}/qualite/documents`),
        fetch(`${API}/qualite/non-conformites`),
        fetch(`${API}/qualite/capa`),
        fetch(`${API}/qualite/audits`),
      ]);

      if (!docRes.ok || !ncRes.ok || !capaRes.ok || !auditRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const [docData, ncData, capaData, auditData] = await Promise.all([
        docRes.json(),
        ncRes.json(),
        capaRes.json(),
        auditRes.json(),
      ]);

      setDocuments(Array.isArray(docData) ? docData : []);
      setNcs(Array.isArray(ncData) ? ncData : []);
      setCapas(Array.isArray(capaData) ? capaData : []);
      setAudits(Array.isArray(auditData) ? auditData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const [statutBusy, setStatutBusy] = useState<string | null>(null);
  const changerStatut = async (ressource: "documents" | "non-conformites" | "capa" | "audits", id: string, statut: string) => {
    setStatutBusy(id);
    try {
      const res = await fetch(`${API}/qualite/${ressource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.detail === "string" ? body.detail : `Erreur ${res.status}`);
      }
      toast.success(`Statut mis à jour : ${label(statut)}`);
      await fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mise à jour du statut impossible");
    } finally {
      setStatutBusy(null);
    }
  };

  // ------ Summary stats ------
  const totalDocuments = documents.length;
  const ncOuvertes = ncs.filter(
    (nc) => nc.statut !== "CLOTUREE" && nc.statut !== "VERIFIEE"
  ).length;
  const capaEnCours = capas.filter(
    (c) => c.statut === "EN_COURS" || c.statut === "PLANIFIEE"
  ).length;
  const auditsPlanifies = audits.filter((a) => a.statut === "PLANIFIE").length;

  // ------ Create handlers ------
  async function handleCreateDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      type_document: form.get("type_document") as string,
      version: form.get("version") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("Document créé");
      setModalOpen(false);
      await fetchAll();
    } catch {
      toast.error("Erreur lors de la création du document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateNC(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      description: form.get("description") as string,
      type_nc: form.get("type_nc") as string,
      gravite: form.get("gravite") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/non-conformites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("Non-conformité déclarée");
      setModalOpen(false);
      await fetchAll();
    } catch {
      toast.error("Erreur lors de la création de la non-conformité.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCAPA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      type_action: form.get("type_action") as string,
      description: form.get("description") as string,
      date_echeance: form.get("date_echeance") as string,
      non_conformite_id: (form.get("non_conformite_id") as string) || null,
    };
    try {
      const res = await fetch(`${API}/qualite/capa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("CAPA créée");
      setModalOpen(false);
      await fetchAll();
    } catch {
      toast.error("Erreur lors de la création de la CAPA.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAudit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const body = {
      titre: form.get("titre") as string,
      processus_audite: form.get("processus_audite") as string,
      date_audit: form.get("date_audit") as string,
    };
    try {
      const res = await fetch(`${API}/qualite/audits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      toast.success("Audit planifié");
      setModalOpen(false);
      await fetchAll();
    } catch {
      toast.error("Erreur lors de la création de l’audit.");
    } finally {
      setSubmitting(false);
    }
  }

  // ------ Tabs / modal ------
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setActiveTab(TABS[next].key);
    tabRefs.current[TABS[next].key]?.focus();
  };

  // Callback stable : la Modal ré-exécute son effet (focus) quand onClose change.
  const closeModal = useCallback(() => setModalOpen(false), []);

  const NEW_LABELS: Record<TabKey, string> = {
    documents: "Nouveau document",
    nc: "Nouvelle non-conformité",
    capa: "Nouvelle CAPA",
    audits: "Nouvel audit",
  };
  const MODAL_TITLES: Record<TabKey, string> = {
    documents: "Nouveau document qualité",
    nc: "Déclarer une non-conformité",
    capa: "Nouvelle action corrective ou préventive",
    audits: "Planifier un audit interne",
  };
  const FORM_ID = "qualite-form";
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  const countLabel: Record<TabKey, string> = {
    documents: plural(documents.length, "document", "documents"),
    nc: plural(ncs.length, "non-conformité", "non-conformités"),
    capa: plural(capas.length, "action", "actions"),
    audits: plural(audits.length, "audit", "audits"),
  };
  const createAction = (
    <Button size="sm" onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
      {NEW_LABELS[activeTab]}
    </Button>
  );

  // ------ Render ------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualité (SMQ)"
        description="Gestion documentaire, non-conformités, actions correctives et audits internes."
        actions={
          <>
            <ButtonLink href="/qualite/equipements" variant="secondary" icon={<Wrench className="h-4 w-4" aria-hidden="true" />}>
              Équipements
            </ButtonLink>
            <Button onClick={() => setModalOpen(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              {NEW_LABELS[activeTab]}
            </Button>
          </>
        }
      />

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Documents"
          value={loading ? "…" : totalDocuments}
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="NC ouvertes"
          value={loading ? "…" : ncOuvertes}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          tone={ncOuvertes > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="CAPA en cours"
          value={loading ? "…" : capaEnCours}
          icon={<CheckSquare className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Audits planifiés"
          value={loading ? "…" : auditsPlanifies}
          icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
        <div role="tablist" aria-label="Sections du système qualité" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                type="button"
                role="tab"
                id={`qualite-tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls="qualite-panel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-1.5"
          onClick={fetchAll}
          loading={loading}
          icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
        >
          Actualiser
        </Button>
      </div>

      <Card role="tabpanel" id="qualite-panel" aria-labelledby={`qualite-tab-${activeTab}`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAll} />
        ) : (
          <>
            {/* ==================== DOCUMENTS ==================== */}
            {activeTab === "documents" &&
              (documents.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" aria-hidden="true" />}
                  title="Aucun document qualité enregistré"
                  action={createAction}
                />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Titre</Th>
                      <Th>Type</Th>
                      <Th>Version</Th>
                      <Th>Statut</Th>
                      <Th>Date de révision</Th>
                      <Th align="right"><span className="sr-only">Fichier</span></Th>
                    </tr>
                  </THead>
                  <TBody>
                    {documents.map((doc) => (
                      <Tr key={doc.id}>
                        <Td className="whitespace-nowrap font-medium text-gray-900">{doc.code}</Td>
                        <Td className="text-gray-900">{doc.titre}</Td>
                        <Td>
                          <Badge tone={DOC_TYPE_TONES[doc.type_document] ?? "neutral"}>{label(doc.type_document)}</Badge>
                        </Td>
                        <Td className="tabular-nums">{doc.version}</Td>
                        <Td>
                          <StatutSelect
                            value={doc.statut}
                            options={DOC_STATUTS}
                            tone={DOC_STATUT_TONES[doc.statut] ?? "neutral"}
                            label={`Statut du document ${doc.code}`}
                            disabled={statutBusy === doc.id}
                            onChange={(v) => changerStatut("documents", doc.id, v)}
                          />
                        </Td>
                        <Td className="whitespace-nowrap">{formatDate(doc.date_revision)}</Td>
                        <Td align="right">
                          {doc.fichier_url ? (
                            <a
                              href={doc.fichier_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-700 hover:bg-gray-100 hover:text-blue-900"
                              title="Voir le document"
                              aria-label={`Voir le document ${doc.code} (nouvel onglet)`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">Aucun fichier</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ))}

            {/* ==================== NON-CONFORMITES ==================== */}
            {activeTab === "nc" &&
              (ncs.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
                  title="Aucune non-conformité enregistrée"
                  action={createAction}
                />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Titre</Th>
                      <Th>Type</Th>
                      <Th>Gravité</Th>
                      <Th>Statut</Th>
                      <Th>Date</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {ncs.map((nc) => (
                      <Tr key={nc.id}>
                        <Td className="whitespace-nowrap font-medium text-gray-900">{nc.code}</Td>
                        <Td className="text-gray-900">{nc.titre}</Td>
                        <Td className="whitespace-nowrap">{label(nc.type_nc)}</Td>
                        <Td>
                          <Badge tone={NC_GRAVITE_TONES[nc.gravite] ?? "neutral"} dot>{label(nc.gravite)}</Badge>
                        </Td>
                        <Td>
                          <StatutSelect
                            value={nc.statut}
                            options={NC_STATUTS}
                            tone={NC_STATUT_TONES[nc.statut] ?? "neutral"}
                            label={`Statut de la non-conformité ${nc.code}`}
                            disabled={statutBusy === nc.id}
                            onChange={(v) => changerStatut("non-conformites", nc.id, v)}
                          />
                        </Td>
                        <Td className="whitespace-nowrap">{formatDate(nc.created_at)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ))}

            {/* ==================== CAPA ==================== */}
            {activeTab === "capa" &&
              (capas.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare className="h-6 w-6" aria-hidden="true" />}
                  title="Aucune action corrective ou préventive enregistrée"
                  action={createAction}
                />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th>Échéance</Th>
                      <Th>Statut</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {capas.map((capa) => (
                      <Tr key={capa.id}>
                        <Td className="whitespace-nowrap font-medium text-gray-900">{capa.code}</Td>
                        <Td>
                          <Badge tone={capa.type_action === "CORRECTIVE" ? "info" : "success"}>{label(capa.type_action)}</Badge>
                        </Td>
                        <Td className="max-w-xs truncate" title={capa.description}>{capa.description}</Td>
                        <Td className="whitespace-nowrap">{formatDate(capa.date_echeance)}</Td>
                        <Td>
                          <StatutSelect
                            value={capa.statut}
                            options={CAPA_STATUTS}
                            tone={CAPA_STATUT_TONES[capa.statut] ?? "neutral"}
                            label={`Statut de la CAPA ${capa.code}`}
                            disabled={statutBusy === capa.id}
                            onChange={(v) => changerStatut("capa", capa.id, v)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ))}

            {/* ==================== AUDITS ==================== */}
            {activeTab === "audits" &&
              (audits.length === 0 ? (
                <EmptyState
                  icon={<ClipboardCheck className="h-6 w-6" aria-hidden="true" />}
                  title="Aucun audit interne enregistré"
                  action={createAction}
                />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Titre</Th>
                      <Th>Processus</Th>
                      <Th>Date</Th>
                      <Th>Statut</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {audits.map((audit) => (
                      <Tr key={audit.id}>
                        <Td className="whitespace-nowrap font-medium text-gray-900">{audit.code}</Td>
                        <Td className="text-gray-900">{audit.titre}</Td>
                        <Td>{audit.processus_audite}</Td>
                        <Td className="whitespace-nowrap">{formatDate(audit.date_audit)}</Td>
                        <Td>
                          <StatutSelect
                            value={audit.statut}
                            options={AUDIT_STATUTS}
                            tone={AUDIT_STATUT_TONES[audit.statut] ?? "neutral"}
                            label={`Statut de l’audit ${audit.code}`}
                            disabled={statutBusy === audit.id}
                            onChange={(v) => changerStatut("audits", audit.id, v)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ))}

            <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">{countLabel[activeTab]}</p>
          </>
        )}
      </Card>

      {/* ==================== MODALE DE CRÉATION ==================== */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={MODAL_TITLES[activeTab]}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Annuler
            </Button>
            <Button type="submit" form={FORM_ID} loading={submitting}>
              Créer
            </Button>
          </>
        }
      >
        {activeTab === "documents" && (
          <form id={FORM_ID} onSubmit={handleCreateDocument} className="space-y-4">
            <Field label="Titre" required>
              <Input name="titre" placeholder="Titre du document" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de document" required>
                <Select name="type_document">
                  <option value="PROCEDURE">Procédure</option>
                  <option value="MODE_OPERATOIRE">Mode opératoire</option>
                  <option value="FORMULAIRE">Formulaire</option>
                  <option value="ENREGISTREMENT">Enregistrement</option>
                  <option value="POLITIQUE">Politique</option>
                </Select>
              </Field>
              <Field label="Version" required>
                <Input name="version" defaultValue="1.0" placeholder="1.0" />
              </Field>
            </div>
          </form>
        )}

        {activeTab === "nc" && (
          <form id={FORM_ID} onSubmit={handleCreateNC} className="space-y-4">
            <Field label="Titre" required>
              <Input name="titre" placeholder="Titre de la non-conformité" />
            </Field>
            <Field label="Description" required>
              <Textarea name="description" rows={3} placeholder="Description détaillée…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" required>
                <Select name="type_nc">
                  <option value="PRODUIT">Produit</option>
                  <option value="PROCESSUS">Processus</option>
                  <option value="EQUIPEMENT">Équipement</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="PERSONNEL">Personnel</option>
                  <option value="AUTRE">Autre</option>
                </Select>
              </Field>
              <Field label="Gravité" required>
                <Select name="gravite">
                  <option value="MINEURE">Mineure</option>
                  <option value="MAJEURE">Majeure</option>
                  <option value="CRITIQUE">Critique</option>
                </Select>
              </Field>
            </div>
          </form>
        )}

        {activeTab === "capa" && (
          <form id={FORM_ID} onSubmit={handleCreateCAPA} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type d’action" required>
                <Select name="type_action">
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Préventive</option>
                </Select>
              </Field>
              <Field label="Date d’échéance" required>
                <Input name="date_echeance" type="date" />
              </Field>
            </div>
            <Field label="Description" required>
              <Textarea name="description" rows={3} placeholder="Description de l’action…" />
            </Field>
            <Field label="Non-conformité associée" hint="Facultatif.">
              <Select name="non_conformite_id">
                <option value="">Aucune</option>
                {ncs.map((nc) => (
                  <option key={nc.id} value={nc.id}>
                    {nc.code} - {nc.titre}
                  </option>
                ))}
              </Select>
            </Field>
          </form>
        )}

        {activeTab === "audits" && (
          <form id={FORM_ID} onSubmit={handleCreateAudit} className="space-y-4">
            <Field label="Titre" required>
              <Input name="titre" placeholder="Titre de l’audit" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Processus audité" required>
                <Input name="processus_audite" placeholder="Ex. : collecte, laboratoire, distribution…" />
              </Field>
              <Field label="Date de l’audit" required>
                <Input name="date_audit" type="date" />
              </Field>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
