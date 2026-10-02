"use client";

import { useLieuxRdv, useRendezVous, useSetStatutRendezVous, type RendezVousStaff, type StatutRendezVous } from "@cnts/api";
import Link from "next/link";
import { useCallback, useState } from "react";
import { CalendarClock, MapPin, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  Alert,
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
  StatusBadge,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { ACTION_RDV, actionsPossibles, dateHeureDakar, jourDakar, type ActionRdv } from "@/lib/rendez-vous";

const STATUTS: { value: StatutRendezVous | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "CONFIRME", label: "Confirmés" },
  { value: "EFFECTUE", label: "Effectués" },
  { value: "MANQUE", label: "Manqués" },
  { value: "ANNULE", label: "Annulés" },
];

function plusJours(jour: string, n: number) {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function RendezVousClient({ canWrite, isAdmin }: { canWrite: boolean; isAdmin: boolean }) {
  const today = jourDakar(new Date());
  const [du, setDu] = useState(today);
  const [au, setAu] = useState(plusJours(today, 7));
  const [lieuId, setLieuId] = useState("");
  const [statut, setStatut] = useState<StatutRendezVous | "">("");
  const [q, setQ] = useState("");

  const lieux = useLieuxRdv(apiClient);
  const { data, status, error, refetch } = useRendezVous(apiClient, {
    du: du || undefined,
    au: au || undefined,
    lieu_id: lieuId || undefined,
    statut: statut || undefined,
    q: q.trim() || undefined,
    limit: 500,
  });
  const setStatutRdv = useSetStatutRendezVous(apiClient);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [annulation, setAnnulation] = useState<RendezVousStaff | null>(null);
  const [motif, setMotif] = useState("");

  const appliquer = async (rdv: RendezVousStaff, action: ActionRdv, motifAnnulation?: string) => {
    setEnCours(rdv.id);
    try {
      await setStatutRdv.mutate({ id: rdv.id, statut: action, motif: motifAnnulation });
      toast.success(
        action === "ANNULE"
          ? "Rendez-vous annulé : le donneur est prévenu par email s'il a un compte confirmé."
          : `Rendez-vous marqué « ${ACTION_RDV[action].label.toLowerCase()} ».`,
      );
      setAnnulation(null);
      setMotif("");
      refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Mise à jour impossible."));
    } finally {
      setEnCours(null);
    }
  };

  const fermerAnnulation = useCallback(() => {
    setAnnulation(null);
    setMotif("");
  }, []);

  const rdvs = data ?? [];
  const confirmes = rdvs.filter((r) => r.statut === "CONFIRME").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rendez-vous des donneurs"
        description="Rendez-vous pris en ligne depuis l'espace donneur du portail. Marquez-les effectués ou manqués après le passage du donneur."
        actions={
          isAdmin ? (
            <ButtonLink href="/donneurs/rendez-vous/lieux" variant="secondary" icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
              Lieux et horaires
            </ButtonLink>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Du">
            <Input type="date" value={du} onChange={(e) => setDu(e.target.value)} />
          </Field>
          <Field label="Au">
            <Input type="date" value={au} min={du} onChange={(e) => setAu(e.target.value)} />
          </Field>
          <Field label="Lieu">
            <Select value={lieuId} onChange={(e) => setLieuId(e.target.value)}>
              <option value="">Tous</option>
              {(lieux.data ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Statut">
            <Select value={statut} onChange={(e) => setStatut(e.target.value as StatutRendezVous | "")}>
              {STATUTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Field label="Donneur" className="flex-1">
              <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, prénom, téléphone…" />
            </Field>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              aria-label="Actualiser la liste"
              title="Actualiser"
              className="px-3"
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Button size="sm" variant="ghost" onClick={() => { setDu(today); setAu(today); }}>
            Aujourd&apos;hui
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setDu(today); setAu(plusJours(today, 7)); }}>
            7 prochains jours
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setDu(plusJours(today, -30)); setAu(today); setStatut("CONFIRME"); }}>
            À traiter (30 derniers jours)
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {status === "loading" && <LoadingState rows={6} />}
        {status === "error" && <ErrorState message={apiErrorMessage(error, "Impossible de charger les rendez-vous.")} onRetry={() => refetch()} />}
        {status === "success" && rdvs.length === 0 && (
          <EmptyState
            icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />}
            title="Aucun rendez-vous"
            description="Aucun rendez-vous ne correspond à ces critères."
          />
        )}
        {status === "success" && rdvs.length > 0 && (
          <>
            <div className="border-b border-gray-100 px-4 py-2 text-sm text-gray-600">
              {rdvs.length} rendez-vous · {confirmes} confirmé{confirmes > 1 ? "s" : ""}
              {rdvs.length >= 500 && " · liste limitée à 500 : resserrez les dates"}
            </div>
            <Table>
              <THead>
                <tr>
                  <Th>Date</Th>
                  <Th>Donneur</Th>
                  <Th>Groupe</Th>
                  <Th>Téléphone</Th>
                  <Th>Lieu</Th>
                  <Th>Statut</Th>
                  {canWrite && <Th align="right">Actions</Th>}
                </tr>
              </THead>
              <TBody>
                {rdvs.map((r) => {
                  const { jour, heure } = dateHeureDakar(r.date_prevue);
                  return (
                    <Tr key={r.id}>
                      <Td className="whitespace-nowrap">
                        <span className="font-medium capitalize text-gray-900">{jour}</span>
                        <span className="ml-2 text-gray-600">{heure}</span>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Link href={`/donneurs/${r.donneur.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                          {r.donneur.nom}, {r.donneur.prenom}
                        </Link>
                        {r.commentaire && <div className="max-w-xs truncate text-xs text-gray-500" title={r.commentaire}>« {r.commentaire} »</div>}
                      </Td>
                      <Td className="whitespace-nowrap font-medium">{r.donneur.groupe_sanguin || "—"}</Td>
                      <Td className="whitespace-nowrap text-gray-600">
                        {r.donneur.telephone ? <a href={`tel:${r.donneur.telephone}`}>{r.donneur.telephone}</a> : "—"}
                      </Td>
                      <Td className="text-gray-600">{r.lieu || "—"}</Td>
                      <Td>
                        <StatusBadge status={r.statut} />
                        {r.motif && <div className="mt-1 max-w-xs text-xs text-gray-500">{r.motif}</div>}
                      </Td>
                      {canWrite && (
                        <Td align="right" className="whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {actionsPossibles(r).map((a) => (
                              <Button
                                key={a}
                                size="sm"
                                variant={ACTION_RDV[a].tone}
                                loading={enCours === r.id && a !== "ANNULE"}
                                disabled={enCours !== null}
                                onClick={() => (a === "ANNULE" ? setAnnulation(r) : appliquer(r, a))}
                              >
                                {ACTION_RDV[a].label}
                              </Button>
                            ))}
                          </div>
                        </Td>
                      )}
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </>
        )}
      </Card>

      <Modal
        open={annulation !== null}
        onClose={fermerAnnulation}
        title="Annuler le rendez-vous"
        description={
          annulation
            ? `${annulation.donneur.prenom} ${annulation.donneur.nom} — ${dateHeureDakar(annulation.date_prevue).jour} à ${dateHeureDakar(annulation.date_prevue).heure}`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={fermerAnnulation} disabled={enCours !== null}>
              Retour
            </Button>
            <Button type="submit" form="annulation-rdv-form" variant="danger" loading={enCours !== null}>
              Annuler le rendez-vous
            </Button>
          </>
        }
      >
        <form
          id="annulation-rdv-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (annulation && motif.trim()) appliquer(annulation, "ANNULE", motif.trim());
          }}
        >
          <Alert tone="info">Le motif est communiqué au donneur par email (s&apos;il a un compte confirmé).</Alert>
          <Field label="Motif" required>
            <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={255} rows={3} required placeholder="Ex. : centre fermé exceptionnellement" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
