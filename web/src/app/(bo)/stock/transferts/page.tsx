"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft, Ban, PackageCheck, Plus, RefreshCw, Send, Thermometer, Truck } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-error";
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
  Select,
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
    } catch (err) {
      setError(apiErrorMessage(err, "Erreur de chargement"));
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
    return site ? site.nom : siteId.slice(0, 8) + "…";
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
      toast.success("Transfert créé");
    } catch (err) {
      setFormError(apiErrorMessage(err, "Une erreur est survenue"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "expedier" | "recevoir" | "annuler"
  ) => {
    const labels: Record<string, string> = {
      expedier: "expédier ce transfert",
      recevoir: "confirmer la réception",
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
      toast.success(
        action === "expedier" ? "Transfert expédié" : action === "recevoir" ? "Réception confirmée" : "Transfert annulé"
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, "Erreur lors de l’action"));
    } finally {
      setActionLoading(null);
    }
  };

  const STATUT_TONES: Record<string, BadgeTone> = {
    BROUILLON: "neutral",
    EN_TRANSIT: "info",
    RECU: "success",
    ANNULE: "danger",
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case "BROUILLON":
        return "Brouillon";
      case "EN_TRANSIT":
        return "En transit";
      case "RECU":
        return "Reçu";
      case "ANNULE":
        return "Annulé";
      default:
        return statut;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTemp = (temp: number | null) => {
    if (temp === null || temp === undefined) return "—";
    return `${temp} °C`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferts inter-sites"
        description="Suivi des transferts de produits sanguins entre sites"
        actions={
          <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouveau transfert
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Field label="Statut">
            <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="EN_TRANSIT">En transit</option>
              <option value="RECU">Reçu</option>
              <option value="ANNULE">Annulé</option>
            </Select>
          </Field>
          <div className="flex">
            <Button variant="secondary" onClick={fetchTransferts} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
              Actualiser
            </Button>
          </div>
        </div>

        {loading && <LoadingState rows={6} />}

        {error && !loading && <ErrorState message={error} onRetry={fetchTransferts} />}

        {!loading && !error && transferts.length === 0 && (
          <EmptyState
            title="Aucun transfert"
            description={statutFilter ? "Aucun transfert ne correspond à ce statut." : "Aucun transfert inter-sites n’a encore été créé."}
            icon={<ArrowRightLeft className="h-6 w-6" aria-hidden="true" />}
            action={
              <Button onClick={handleOpenCreate} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Nouveau transfert
              </Button>
            }
          />
        )}

        {!loading && !error && transferts.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Référence</Th>
                  <Th>Source</Th>
                  <Th>Destination</Th>
                  <Th>Motif</Th>
                  <Th>Statut</Th>
                  <Th>
                    <span className="inline-flex items-center gap-1">
                      <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                      Températures
                    </span>
                  </Th>
                  <Th>Dates</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {transferts.map((t) => (
                  <Tr key={t.id}>
                    <Td className="whitespace-nowrap font-mono text-gray-900">{t.id.slice(0, 8)}</Td>
                    <Td className="whitespace-nowrap text-gray-900">{getSiteNom(t.site_source_id)}</Td>
                    <Td className="whitespace-nowrap text-gray-900">{getSiteNom(t.site_destination_id)}</Td>
                    <Td className="max-w-[200px] truncate" title={t.motif ?? undefined}>
                      {t.motif || "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Badge tone={STATUT_TONES[t.statut] ?? "neutral"} dot>
                        {getStatutLabel(t.statut)}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>Départ : {formatTemp(t.temperature_depart)}</span>
                        <span>Arrivée : {formatTemp(t.temperature_arrivee)}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span>Expédition : {formatDate(t.date_expedition)}</span>
                        <span>Réception : {formatDate(t.date_reception)}</span>
                      </div>
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {t.statut === "BROUILLON" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction(t.id, "expedier")}
                            disabled={actionLoading === t.id}
                            icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}
                          >
                            Expédier
                          </Button>
                        )}
                        {t.statut === "EN_TRANSIT" && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAction(t.id, "recevoir")}
                            disabled={actionLoading === t.id}
                            icon={<PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                          >
                            Recevoir
                          </Button>
                        )}
                        {(t.statut === "BROUILLON" || t.statut === "EN_TRANSIT") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(t.id, "annuler")}
                            disabled={actionLoading === t.id}
                            icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                          >
                            Annuler
                          </Button>
                        )}
                        {(t.statut === "RECU" || t.statut === "ANNULE") && (
                          <span className="text-xs italic text-gray-500">Terminé</span>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
              {transferts.length} transfert(s) affiché(s)
            </div>
          </>
        )}
      </Card>

      <Modal
        open={showModal}
        onClose={handleClose}
        title={
          <span className="inline-flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" aria-hidden="true" />
            Nouveau transfert
          </span>
        }
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" form="transfert-form" loading={submitting}>
              Créer le transfert
            </Button>
          </>
        }
      >
        <form id="transfert-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site source" required>
              <Select
                value={formData.site_source_id}
                onChange={(e) => setFormData({ ...formData, site_source_id: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom} ({s.code})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Site destination" required>
              <Select
                value={formData.site_destination_id}
                onChange={(e) => setFormData({ ...formData, site_destination_id: e.target.value })}
              >
                <option value="">— Sélectionner —</option>
                {sites
                  .filter((s) => s.id !== formData.site_source_id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom} ({s.code})
                    </option>
                  ))}
              </Select>
            </Field>
          </div>

          <Field label="Motif">
            <Textarea
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              rows={3}
              placeholder="Raison du transfert…"
            />
          </Field>

          <Field label="Transporteur">
            <Input
              type="text"
              value={formData.transporteur}
              onChange={(e) => setFormData({ ...formData, transporteur: e.target.value })}
              placeholder="Nom du transporteur"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
