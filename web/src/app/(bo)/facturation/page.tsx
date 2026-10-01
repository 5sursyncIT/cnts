"use client";

import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react";
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
import { toast } from "sonner";
import {
  Alert,
  Badge,
  Button,
  Card,
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

const STATUT_TONES: Record<Facture["statut"], BadgeTone> = {
  EMISE: "info",
  ENVOYEE: "purple",
  PAYEE_PARTIELLEMENT: "warning",
  PAYEE: "success",
  ANNULEE: "danger",
};

const STATUT_LABELS: Record<Facture["statut"], string> = {
  EMISE: "Émise",
  ENVOYEE: "Envoyée",
  PAYEE_PARTIELLEMENT: "Partiellement payée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const MODE_LABELS: Record<Paiement["mode_paiement"], string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money",
};

const PRODUITS = ["ST", "CGR", "PFC", "CP"] as const;
const FORM_ID = "facturation-form";

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
      toast.success(form === "factures" ? "Facture créée" : form === "tarifs" ? "Tarif enregistré" : "Paiement enregistré");
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
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({ factures: null, tarifs: null, paiements: null });

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    setActiveTab(tabs[next].key);
    tabRefs.current[tabs[next].key]?.focus();
  };

  // Callbacks stables : la Modal ré-exécute son effet (focus) quand onClose change.
  const closeForm = useCallback(() => setForm(null), []);
  const closeDetail = useCallback(() => setSelectedFacture(null), []);

  const openForm = (key: TabKey) => {
    setForm(key);
    setFormError(null);
  };

  const newLabels: Record<TabKey, string> = {
    factures: "Nouvelle facture",
    tarifs: "Nouveau tarif",
    paiements: "Nouveau paiement",
  };

  const today = new Date().toISOString().slice(0, 10);
  const statValue = (value: React.ReactNode) => (loadingStats ? "…" : errorStats ? "—" : value);

  const refreshButton = (onClick: () => void, loading: boolean) => (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      loading={loading}
      icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
    >
      Actualiser
    </Button>
  );

  // --- Render ---

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturation"
        description="Gestion des factures, tarifs et paiements."
        actions={
          <Button onClick={() => openForm(activeTab)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            {newLabels[activeTab]}
          </Button>
        }
      />

      {/* Indicateurs */}
      {errorStats ? (
        <Alert tone="warning" className="flex flex-wrap items-center justify-between gap-3">
          <span>Les indicateurs de facturation n&apos;ont pas pu être chargés ({errorStats}).</span>
          <Button size="sm" variant="secondary" onClick={() => fetchStats()}>Réessayer</Button>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy={loadingStats || undefined}>
        <StatCard
          label="Total facturé"
          value={statValue(formatFCFA(stats?.montant_total_fcfa ?? 0))}
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Factures impayées"
          value={statValue(stats?.factures_impayees ?? 0)}
          icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
          tone={stats?.factures_impayees ? "warning" : "neutral"}
        />
        <StatCard
          label="Montant encaissé"
          value={statValue(formatFCFA(stats?.total_paye_fcfa ?? 0))}
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Taux de recouvrement"
          value={statValue(
            `${stats?.montant_total_fcfa
              ? ((stats.total_paye_fcfa / stats.montant_total_fcfa) * 100).toFixed(1)
              : "0.0"} %`
          )}
          icon={<TrendingUp className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <div role="tablist" aria-label="Sections de la facturation" className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => { tabRefs.current[tab.key] = el; }}
                type="button"
                role="tab"
                id={`facturation-tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`facturation-panel-${tab.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulaire de création */}
      <Modal
        open={form !== null}
        onClose={closeForm}
        title={form ? newLabels[form] : ""}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Annuler</Button>
            <Button type="submit" form={FORM_ID} loading={saving}>Enregistrer</Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={submitForm} className="space-y-4">
          {form === "factures" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Numéro de facture" required>
                <Input name="numero" maxLength={32} />
              </Field>
              <Field label="Hôpital" required>
                <Select name="hopital_id" defaultValue="">
                  <option value="" disabled>Sélectionner</option>
                  {hopitaux.map((h) => <option key={h.id} value={h.id}>{h.nom}</option>)}
                </Select>
              </Field>
              <Field label="Commande servie" hint="Identifiant de la commande (facultatif).">
                <Input name="commande_id" />
              </Field>
              <Field label="Date de facture" required>
                <Input name="date_facture" type="date" defaultValue={today} />
              </Field>
              <Field label="Produit" required>
                <Select name="type_produit">
                  {PRODUITS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Quantité" required>
                <Input name="quantite" type="number" min="1" defaultValue="1" />
              </Field>
              <Field label="Prix unitaire (FCFA)" required>
                <Input name="prix_unitaire_fcfa" type="number" min="0" />
              </Field>
            </div>
          )}
          {form === "tarifs" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Produit" required>
                <Select name="type_produit">
                  {PRODUITS.map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </Field>
              <Field label="Prix unitaire (FCFA)" required>
                <Input name="prix_unitaire_fcfa" type="number" min="0" />
              </Field>
              <Field label="Date de début" required>
                <Input name="date_debut" type="date" defaultValue={today} />
              </Field>
            </div>
          )}
          {form === "paiements" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Facture" required>
                <Select name="facture_id" defaultValue="">
                  <option value="" disabled>Sélectionner</option>
                  {factures.filter((f) => f.statut !== "PAYEE" && f.statut !== "ANNULEE")
                    .map((f) => <option key={f.id} value={f.id}>{f.numero}</option>)}
                </Select>
              </Field>
              <Field label="Montant (FCFA)" required>
                <Input name="montant_fcfa" type="number" min="1" />
              </Field>
              <Field label="Mode de paiement">
                <Select name="mode_paiement">
                  {Object.entries(MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Référence">
                <Input name="reference" />
              </Field>
              <Field label="Date de paiement" required>
                <Input name="date_paiement" type="date" defaultValue={today} />
              </Field>
            </div>
          )}
          {formError && <Alert tone="danger">{formError}</Alert>}
        </form>
      </Modal>

      {/* Détail d'une facture */}
      <Modal
        open={selectedFacture !== null}
        onClose={closeDetail}
        title={selectedFacture ? `Facture ${selectedFacture.numero}` : ""}
        size="sm"
        footer={<Button variant="secondary" onClick={closeDetail}>Fermer</Button>}
      >
        {selectedFacture && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-600">Hôpital</dt>
            <dd className="text-gray-900">{hopitaux.find((h) => h.id === selectedFacture.hopital_id)?.nom || selectedFacture.hopital_id}</dd>
            <dt className="text-gray-600">Commande</dt>
            <dd className="break-all text-gray-900">{selectedFacture.commande_id || "Sans commande"}</dd>
            <dt className="text-gray-600">Date</dt>
            <dd className="text-gray-900">{formatDate(selectedFacture.date_facture)}</dd>
            <dt className="text-gray-600">Montant TTC</dt>
            <dd className="font-medium tabular-nums text-gray-900">{formatFCFA(selectedFacture.montant_ttc_fcfa)}</dd>
            <dt className="text-gray-600">Statut</dt>
            <dd><Badge tone={STATUT_TONES[selectedFacture.statut]} dot>{STATUT_LABELS[selectedFacture.statut]}</Badge></dd>
          </dl>
        )}
      </Modal>

      {/* --- Onglet Factures --- */}
      {activeTab === "factures" && (
        <Card role="tabpanel" id="facturation-panel-factures" aria-labelledby="facturation-tab-factures">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <Field label="Statut" className="w-full sm:w-56">
              <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <option value="">Tous</option>
                {(Object.keys(STATUT_LABELS) as Facture["statut"][]).map((key) => (
                  <option key={key} value={key}>{STATUT_LABELS[key]}</option>
                ))}
              </Select>
            </Field>
            {refreshButton(() => fetchFactures(), loadingFactures)}
          </div>

          {loadingFactures ? (
            <LoadingState />
          ) : errorFactures ? (
            <ErrorState message={errorFactures} onRetry={() => fetchFactures()} />
          ) : factures.length === 0 ? (
            <EmptyState
              title="Aucune facture trouvée"
              description={statutFilter ? "Aucune facture ne correspond à ce statut." : undefined}
              action={<Button size="sm" onClick={() => openForm("factures")} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>Nouvelle facture</Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <Th>Numéro</Th>
                    <Th>Date</Th>
                    <Th align="right">Montant HT</Th>
                    <Th align="right">Montant TTC</Th>
                    <Th>Statut</Th>
                    <Th>Échéance</Th>
                    <Th align="right"><span className="sr-only">Actions</span></Th>
                  </tr>
                </THead>
                <TBody>
                  {factures.map((facture) => (
                    <Tr key={facture.id}>
                      <Td className="whitespace-nowrap font-medium text-gray-900">{facture.numero}</Td>
                      <Td className="whitespace-nowrap">{formatDate(facture.date_facture)}</Td>
                      <Td align="right" className="whitespace-nowrap tabular-nums">{formatFCFA(facture.montant_ht_fcfa)}</Td>
                      <Td align="right" className="whitespace-nowrap tabular-nums">{formatFCFA(facture.montant_ttc_fcfa)}</Td>
                      <Td>
                        <Badge tone={STATUT_TONES[facture.statut]} dot>{STATUT_LABELS[facture.statut]}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap">{facture.date_echeance ? formatDate(facture.date_echeance) : "—"}</Td>
                      <Td align="right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFacture(facture)} aria-label={`Voir la facture ${facture.numero}`}>
                          Voir
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {factures.length} facture{factures.length > 1 ? "s" : ""} affichée{factures.length > 1 ? "s" : ""}
              </p>
            </>
          )}
        </Card>
      )}

      {/* --- Onglet Tarifs --- */}
      {activeTab === "tarifs" && (
        <Card role="tabpanel" id="facturation-panel-tarifs" aria-labelledby="facturation-tab-tarifs">
          <CardHeader title="Grille tarifaire" actions={refreshButton(() => fetchTarifs(), loadingTarifs)} />

          {loadingTarifs ? (
            <LoadingState />
          ) : errorTarifs ? (
            <ErrorState message={errorTarifs} onRetry={() => fetchTarifs()} />
          ) : tarifs.length === 0 ? (
            <EmptyState
              title="Aucun tarif configuré"
              action={<Button size="sm" onClick={() => openForm("tarifs")} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>Nouveau tarif</Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <Th>Type de produit</Th>
                    <Th align="right">Prix unitaire</Th>
                    <Th>Date de début</Th>
                    <Th>Date de fin</Th>
                    <Th>État</Th>
                  </tr>
                </THead>
                <TBody>
                  {tarifs.map((tarif) => (
                    <Tr key={tarif.id}>
                      <Td><Badge tone="info">{tarif.type_produit}</Badge></Td>
                      <Td align="right" className="whitespace-nowrap font-medium tabular-nums text-gray-900">{formatFCFA(tarif.prix_unitaire_fcfa)}</Td>
                      <Td className="whitespace-nowrap">{formatDate(tarif.date_debut)}</Td>
                      <Td className="whitespace-nowrap">{tarif.date_fin ? formatDate(tarif.date_fin) : "—"}</Td>
                      <Td>
                        <Badge tone={tarif.is_active ? "success" : "neutral"} dot>{tarif.is_active ? "Actif" : "Inactif"}</Badge>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {tarifs.length} tarif{tarifs.length > 1 ? "s" : ""} affiché{tarifs.length > 1 ? "s" : ""}
              </p>
            </>
          )}
        </Card>
      )}

      {/* --- Onglet Paiements --- */}
      {activeTab === "paiements" && (
        <Card role="tabpanel" id="facturation-panel-paiements" aria-labelledby="facturation-tab-paiements">
          <CardHeader title="Paiements reçus" actions={refreshButton(() => fetchPaiements(), loadingPaiements)} />

          {loadingPaiements ? (
            <LoadingState />
          ) : errorPaiements ? (
            <ErrorState message={errorPaiements} onRetry={() => fetchPaiements()} />
          ) : paiements.length === 0 ? (
            <EmptyState
              title="Aucun paiement enregistré"
              action={<Button size="sm" onClick={() => openForm("paiements")} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>Nouveau paiement</Button>}
            />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <Th>Facture</Th>
                    <Th align="right">Montant</Th>
                    <Th>Mode</Th>
                    <Th>Référence</Th>
                    <Th>Date</Th>
                  </tr>
                </THead>
                <TBody>
                  {paiements.map((paiement) => (
                    <Tr key={paiement.id}>
                      <Td className="whitespace-nowrap font-medium text-gray-900">
                        {factures.find((f) => f.id === paiement.facture_id)?.numero || paiement.facture_id}
                      </Td>
                      <Td align="right" className="whitespace-nowrap font-medium tabular-nums text-gray-900">{formatFCFA(paiement.montant_fcfa)}</Td>
                      <Td className="whitespace-nowrap">{MODE_LABELS[paiement.mode_paiement]}</Td>
                      <Td>{paiement.reference || "—"}</Td>
                      <Td className="whitespace-nowrap">{formatDate(paiement.date_paiement)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {paiements.length} paiement{paiements.length > 1 ? "s" : ""} affiché{paiements.length > 1 ? "s" : ""}
              </p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
