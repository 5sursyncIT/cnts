"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ActeTransfusionnel,
  EIR,
  EIRCreate,
  EvolutionEIR,
  GraviteEIR,
  ImputabiliteEIR,
  StatistiquesEIR,
  StatutInvestigationEIR,
  TypeEIR,
} from "@cnts/api";
import { Lock, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
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
  StatCard,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
  type BadgeTone,
} from "@/components/ui";

const TYPES: Record<TypeEIR, string> = {
  REACTION_FEBRILE: "Réaction fébrile non hémolytique",
  ALLERGIQUE: "Réaction allergique",
  HEMOLYTIQUE_AIGUE: "Hémolyse aiguë",
  TACO: "Surcharge volémique (TACO)",
  TRALI: "Œdème pulmonaire lésionnel (TRALI)",
  INFECTION_BACTERIENNE: "Infection bactérienne transmise",
  INCOMPATIBILITE_ABO: "Incompatibilité ABO",
  AUTRE: "Autre",
};

const GRAVITES: Record<GraviteEIR, string> = {
  GRADE_1: "Grade 1 — non sévère",
  GRADE_2: "Grade 2 — sévère",
  GRADE_3: "Grade 3 — menace vitale",
  GRADE_4: "Grade 4 — décès",
};

const IMPUTABILITES: Record<ImputabiliteEIR, string> = {
  CERTAINE: "Certaine",
  PROBABLE: "Probable",
  POSSIBLE: "Possible",
  DOUTEUSE: "Douteuse",
  EXCLUE: "Exclue",
};

const EVOLUTIONS: Record<EvolutionEIR, string> = {
  EN_COURS: "En cours",
  GUERISON_SANS_SEQUELLE: "Guérison sans séquelle",
  SEQUELLE: "Séquelle",
  DECES: "Décès",
};

const STATUTS: Record<StatutInvestigationEIR, string> = {
  OUVERTE: "Ouverte",
  EN_COURS: "En cours",
  CLOTUREE: "Clôturée",
};

const GRAVITE_TONES: Record<GraviteEIR, BadgeTone> = {
  GRADE_1: "info",
  GRADE_2: "warning",
  GRADE_3: "danger",
  GRADE_4: "danger",
};

const STATUT_TONES: Record<StatutInvestigationEIR, BadgeTone> = {
  OUVERTE: "warning",
  EN_COURS: "info",
  CLOTUREE: "neutral",
};

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

function options<T extends string>(labels: Record<T, string>) {
  return (Object.keys(labels) as T[]).map((k) => (
    <option key={k} value={k}>
      {labels[k]}
    </option>
  ));
}

const EMPTY_FORM: EIRCreate = {
  acte_transfusionnel_id: "",
  type_eir: "REACTION_FEBRILE",
  gravite: "GRADE_1",
  imputabilite: "POSSIBLE",
  evolution: "EN_COURS",
};

export default function EirPage() {
  const [items, setItems] = useState<EIR[]>([]);
  const [stats, setStats] = useState<StatistiquesEIR | null>(null);
  const [actes, setActes] = useState<ActeTransfusionnel[]>([]);
  const [statutFilter, setStatutFilter] = useState<StatutInvestigationEIR | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EIRCreate>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<EIR | null>(null);
  const [conclusion, setConclusion] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        apiClient.eir.list({ statut_investigation: statutFilter || undefined, limit: 200 }),
        apiClient.eir.statistiques(),
      ]);
      setItems(list);
      setStats(s);
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible de charger les EIR."));
    } finally {
      setLoading(false);
    }
  }, [statutFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function openForm() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
    try {
      setActes(await apiClient.hemovigilance.listActesTransfusionnels({ limit: 200 }));
    } catch (e) {
      setFormError(apiErrorMessage(e, "Impossible de charger les actes transfusionnels."));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.eir.declarer({
        ...form,
        symptomes: form.symptomes?.trim() || undefined,
        conduite_tenue: form.conduite_tenue?.trim() || undefined,
      });
      setShowForm(false);
      toast.success("EIR déclaré");
      await load();
    } catch (err) {
      const msg = apiErrorMessage(err, "La déclaration a échoué.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function updateSelected(action: () => Promise<EIR>, successMessage?: string) {
    setSaving(true);
    setFormError(null);
    try {
      const updated = await action();
      setSelected(updated);
      if (successMessage) toast.success(successMessage);
      await load();
    } catch (err) {
      const msg = apiErrorMessage(err, "La mise à jour a échoué.");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const closeForm = useCallback(() => setShowForm(false), []);
  const closeSelected = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Événements indésirables receveur (EIR)"
        description="Déclaration, investigation et clôture des EIR"
        back={{ href: "/hemovigilance", label: "Hémovigilance" }}
        actions={
          <Button variant="danger" onClick={openForm} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Déclarer un EIR
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats ? (
          <>
            <StatCard label="Total déclarés" value={stats.total} />
            <StatCard
              label="Investigations ouvertes"
              value={stats.investigations_ouvertes}
              tone={stats.investigations_ouvertes > 0 ? "warning" : "neutral"}
            />
            <StatCard
              label="Grades 3–4"
              value={(stats.par_gravite.GRADE_3 ?? 0) + (stats.par_gravite.GRADE_4 ?? 0)}
              tone="danger"
            />
          </>
        ) : null}
        <Card className="col-span-2 p-4 md:col-span-1">
          <Field label="Filtrer par investigation">
            <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value as StatutInvestigationEIR | "")}>
              <option value="">Toutes</option>
              {options(STATUTS)}
            </Select>
          </Field>
        </Card>
      </div>

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Aucun EIR déclaré"
            icon={<ShieldAlert className="h-6 w-6" aria-hidden="true" />}
            description={statutFilter ? "Aucun EIR pour ce statut d’investigation." : undefined}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Déclaré le</Th>
                <Th>Type</Th>
                <Th>Gravité</Th>
                <Th>Imputabilité</Th>
                <Th>Évolution</Th>
                <Th>Investigation</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <TBody>
              {items.map((eir) => (
                <Tr key={eir.id}>
                  <Td className="whitespace-nowrap text-gray-600">
                    {dateTime.format(new Date(eir.date_declaration ?? eir.created_at))}
                  </Td>
                  <Td className="text-gray-900">{TYPES[eir.type_eir] ?? eir.type_eir}</Td>
                  <Td>
                    <Badge tone={GRAVITE_TONES[eir.gravite] ?? "neutral"} dot>
                      {GRAVITES[eir.gravite]?.split(" — ")[0] ?? eir.gravite}
                    </Badge>
                  </Td>
                  <Td>{IMPUTABILITES[eir.imputabilite] ?? eir.imputabilite}</Td>
                  <Td>{EVOLUTIONS[eir.evolution] ?? eir.evolution}</Td>
                  <Td>
                    <Badge tone={STATUT_TONES[eir.statut_investigation] ?? "neutral"}>
                      {STATUTS[eir.statut_investigation] ?? eir.statut_investigation}
                    </Badge>
                  </Td>
                  <Td align="right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelected(eir);
                        setConclusion(eir.conclusion ?? "");
                        setFormError(null);
                      }}
                      aria-label={`Ouvrir l’EIR du ${dateTime.format(new Date(eir.date_declaration ?? eir.created_at))}`}
                    >
                      Ouvrir
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={closeForm}
        title="Déclarer un EIR"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={saving}>
              Annuler
            </Button>
            <Button type="submit" form="eir-form" variant="danger" loading={saving}>
              {saving ? "Enregistrement…" : "Déclarer"}
            </Button>
          </>
        }
      >
        <form id="eir-form" onSubmit={submit} className="space-y-4">
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <Field label="Acte transfusionnel" required hint="La poche et le receveur sont repris de l’acte.">
            <Select value={form.acte_transfusionnel_id} onChange={(e) => setForm({ ...form, acte_transfusionnel_id: e.target.value })}>
              <option value="">Sélectionner un acte</option>
              {actes.map((a) => (
                <option key={a.id} value={a.id}>
                  {dateTime.format(new Date(a.date_transfusion))} · {a.din ?? a.poche_id.slice(0, 8)}
                  {a.type_produit ? ` · ${a.type_produit}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" required>
              <Select value={form.type_eir} onChange={(e) => setForm({ ...form, type_eir: e.target.value as TypeEIR })}>
                {options(TYPES)}
              </Select>
            </Field>
            <Field label="Gravité" required>
              <Select value={form.gravite} onChange={(e) => setForm({ ...form, gravite: e.target.value as GraviteEIR })}>
                {options(GRAVITES)}
              </Select>
            </Field>
            <Field label="Imputabilité" required>
              <Select value={form.imputabilite} onChange={(e) => setForm({ ...form, imputabilite: e.target.value as ImputabiliteEIR })}>
                {options(IMPUTABILITES)}
              </Select>
            </Field>
            <Field label="Délai d’apparition (min)">
              <Input
                type="number"
                min={0}
                value={form.delai_apparition_minutes ?? ""}
                onChange={(e) =>
                  setForm({ ...form, delai_apparition_minutes: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Symptômes">
            <Textarea rows={3} value={form.symptomes ?? ""} onChange={(e) => setForm({ ...form, symptomes: e.target.value })} />
          </Field>
          <Field label="Conduite tenue">
            <Textarea rows={2} value={form.conduite_tenue ?? ""} onChange={(e) => setForm({ ...form, conduite_tenue: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={selected !== null}
        onClose={closeSelected}
        title={selected ? TYPES[selected.type_eir] ?? selected.type_eir : ""}
        description={selected ? <StatusLine eir={selected} /> : undefined}
        size="lg"
        footer={
          selected && selected.statut_investigation !== "CLOTUREE" ? (
            <>
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => updateSelected(() => apiClient.eir.update(selected.id, { conclusion }), "Conclusion enregistrée")}
              >
                Enregistrer la conclusion
              </Button>
              <Button
                variant="danger"
                disabled={!conclusion.trim()}
                loading={saving}
                onClick={() => {
                  if (!window.confirm("Clôturer définitivement cette investigation ?")) return;
                  updateSelected(async () => {
                    await apiClient.eir.update(selected.id, { conclusion });
                    return apiClient.eir.cloturer(selected.id);
                  }, "Investigation clôturée");
                }}
                title={conclusion.trim() ? undefined : "Saisissez une conclusion avant de clôturer"}
                icon={<Lock className="h-4 w-4" aria-hidden="true" />}
              >
                Clôturer
              </Button>
            </>
          ) : undefined
        }
      >
        {selected ? (
          <div className="space-y-4">
            {formError ? <Alert tone="danger">{formError}</Alert> : null}
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-gray-600">Gravité</dt>
              <dd className="text-gray-900">{GRAVITES[selected.gravite]}</dd>
              <dt className="text-gray-600">Délai d’apparition</dt>
              <dd className="text-gray-900">
                {selected.delai_apparition_minutes != null ? `${selected.delai_apparition_minutes} min` : "—"}
              </dd>
              <dt className="text-gray-600">Symptômes</dt>
              <dd className="whitespace-pre-line text-gray-900">{selected.symptomes ?? "—"}</dd>
              <dt className="text-gray-600">Conduite tenue</dt>
              <dd className="whitespace-pre-line text-gray-900">{selected.conduite_tenue ?? "—"}</dd>
            </dl>

            {selected.statut_investigation === "CLOTUREE" ? (
              <Alert tone="info">
                <strong>Investigation clôturée.</strong> {selected.conclusion ? `Conclusion : ${selected.conclusion}` : ""}
              </Alert>
            ) : (
              <div className="space-y-4 border-t border-gray-100 pt-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Imputabilité">
                    <Select
                      disabled={saving}
                      value={selected.imputabilite}
                      onChange={(e) =>
                        updateSelected(
                          () => apiClient.eir.update(selected.id, { imputabilite: e.target.value as ImputabiliteEIR }),
                          "Imputabilité mise à jour"
                        )
                      }
                    >
                      {options(IMPUTABILITES)}
                    </Select>
                  </Field>
                  <Field label="Évolution">
                    <Select
                      disabled={saving}
                      value={selected.evolution}
                      onChange={(e) =>
                        updateSelected(
                          () => apiClient.eir.update(selected.id, { evolution: e.target.value as EvolutionEIR }),
                          "Évolution mise à jour"
                        )
                      }
                    >
                      {options(EVOLUTIONS)}
                    </Select>
                  </Field>
                  <Field label="Investigation">
                    <Select
                      disabled={saving}
                      value={selected.statut_investigation}
                      onChange={(e) =>
                        updateSelected(
                          () =>
                            apiClient.eir.update(selected.id, {
                              statut_investigation: e.target.value as StatutInvestigationEIR,
                            }),
                          "Statut d’investigation mis à jour"
                        )
                      }
                    >
                      <option value="OUVERTE">Ouverte</option>
                      <option value="EN_COURS">En cours</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Conclusion" hint="Obligatoire pour clôturer l’investigation.">
                  <Textarea rows={3} value={conclusion} onChange={(e) => setConclusion(e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StatusLine({ eir }: { eir: EIR }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge tone={GRAVITE_TONES[eir.gravite] ?? "neutral"} dot>
        {GRAVITES[eir.gravite]?.split(" — ")[0] ?? eir.gravite}
      </Badge>
      <Badge tone={STATUT_TONES[eir.statut_investigation] ?? "neutral"}>
        {STATUTS[eir.statut_investigation] ?? eir.statut_investigation}
      </Badge>
    </span>
  );
}
