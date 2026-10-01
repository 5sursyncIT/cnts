"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import type {
  BilanCampagne,
  CampagneCollecte,
  InscriptionCollecte,
  InscriptionStatut,
} from "@cnts/api";
import { Calendar, MapPin, Package, Play, Square, UserPlus, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Select,
  StatCard,
  StatusBadge,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

const INSCRIPTION_LABELS: Record<InscriptionStatut, string> = {
  INSCRIT: "Inscrit",
  PRESENT: "Présent",
  PRELEVE: "Prélevé",
  ABSENT: "Absent",
  ANNULE: "Annulé",
};

const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export default function CollecteDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const [campagne, setCampagne] = useState<CampagneCollecte | null>(null);
  const [bilan, setBilan] = useState<BilanCampagne | null>(null);
  const [inscriptions, setInscriptions] = useState<InscriptionCollecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nouveau, setNouveau] = useState({ nom: "", telephone: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, b, i] = await Promise.all([
        apiClient.collectes.get(id),
        apiClient.collectes.bilan(id),
        apiClient.collectes.inscriptions(id, { limit: 500 }),
      ]);
      setCampagne(c);
      setBilan(b);
      setInscriptions(i);
    } catch (e) {
      setError(apiErrorMessage(e, "Impossible de charger la collecte."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<unknown>, confirmMessage?: string, successMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await load();
      if (successMessage) toast.success(successMessage);
    } catch (e) {
      const message = apiErrorMessage(e, "L’action a échoué.");
      setActionError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  const back = { href: "/collectes", label: "Toutes les collectes" };

  if (loading && !campagne) {
    return (
      <div className="space-y-6">
        <PageHeader title="Collecte" back={back} />
        <Card>
          <LoadingState rows={6} />
        </Card>
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="space-y-6">
        <PageHeader title="Collecte" back={back} />
        <Card>
          <ErrorState message={error ?? "Collecte introuvable."} onRetry={load} />
        </Card>
      </div>
    );
  }

  const modifiable = campagne.statut === "PLANIFIEE" || campagne.statut === "EN_COURS";

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={campagne.nom}
        description={
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={campagne.statut} />
            <span className="font-mono text-gray-600">{campagne.code}</span>
          </span>
        }
        actions={
          <>
            {campagne.statut === "PLANIFIEE" && (
              <>
                <Button
                  variant="success"
                  disabled={busy}
                  onClick={() => run(() => apiClient.collectes.demarrer(id), undefined, "Collecte démarrée")}
                  icon={<Play className="h-4 w-4" aria-hidden="true" />}
                >
                  Démarrer
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => run(() => apiClient.collectes.annuler(id), "Annuler cette collecte ?", "Collecte annulée")}
                  icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                >
                  Annuler la collecte
                </Button>
              </>
            )}
            {campagne.statut === "EN_COURS" && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => run(() => apiClient.collectes.terminer(id), "Clôturer cette collecte ?", "Collecte clôturée")}
                icon={<Square className="h-4 w-4" aria-hidden="true" />}
              >
                Terminer
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardBody className="grid gap-3 text-sm text-gray-800 sm:grid-cols-2">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <span>
              {campagne.lieu ?? "Lieu non renseigné"}
              {campagne.adresse ? ` — ${campagne.adresse}` : ""}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <span>
              Du {dateTime.format(new Date(campagne.date_debut))} au {dateTime.format(new Date(campagne.date_fin))}
            </span>
          </p>
          {campagne.materiel_notes ? (
            <p className="flex items-start gap-2 text-gray-600 sm:col-span-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              <span>Matériel : {campagne.materiel_notes}</span>
            </p>
          ) : null}
        </CardBody>
      </Card>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

      {bilan ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Objectif" value={bilan.objectif_dons ?? "—"} />
          <StatCard label="Inscrits" value={bilan.inscrits} />
          <StatCard label="Présents" value={bilan.presents} hint={`${bilan.taux_presence} % de présence`} />
          <StatCard label="Prélevés" value={bilan.preleves} />
          <StatCard label="Réalisation" value={bilan.taux_realisation != null ? `${bilan.taux_realisation} %` : "—"} />
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader
          title={`Inscriptions (${inscriptions.length})`}
          actions={
            modifiable ? (
              <form
                className="flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    await apiClient.collectes.inscrire(id, {
                      nom: nouveau.nom.trim(),
                      telephone: nouveau.telephone.trim() || undefined,
                    });
                    setNouveau({ nom: "", telephone: "" });
                  }, undefined, "Inscription ajoutée");
                }}
              >
                <label htmlFor="ins-nom" className="block text-xs font-medium text-gray-700">
                  Nom<span className="ml-0.5 text-brand-600" aria-hidden="true">*</span>
                  <input
                    id="ins-nom"
                    required
                    value={nouveau.nom}
                    onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 mt-1 h-8 w-44"
                  />
                </label>
                <label htmlFor="ins-tel" className="block text-xs font-medium text-gray-700">
                  Téléphone
                  <input
                    id="ins-tel"
                    type="tel"
                    value={nouveau.telephone}
                    onChange={(e) => setNouveau({ ...nouveau, telephone: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 mt-1 h-8 w-36"
                  />
                </label>
                <Button type="submit" size="sm" loading={busy} icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}>
                  Inscrire
                </Button>
              </form>
            ) : undefined
          }
        />

        {inscriptions.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="Aucune inscription"
            description={modifiable ? "Ajoutez un premier donneur avec le formulaire ci-dessus." : "Aucune inscription pour cette collecte."}
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Nom</Th>
                <Th>Téléphone</Th>
                <Th>Créneau</Th>
                <Th>Statut</Th>
              </tr>
            </THead>
            <TBody>
              {inscriptions.map((ins) => (
                <Tr key={ins.id}>
                  <Td className="whitespace-nowrap">
                    {ins.donneur_id ? (
                      <Link href={`/donneurs/${ins.donneur_id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {ins.nom ?? "Donneur enregistré"}
                      </Link>
                    ) : (
                      ins.nom ?? "—"
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-gray-600">{ins.telephone ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-gray-600">{ins.creneau ? dateTime.format(new Date(ins.creneau)) : "—"}</Td>
                  <Td>
                    <Select
                      id={`statut-${ins.id}`}
                      aria-label={`Statut de ${ins.nom ?? "l’inscription"}`}
                      value={ins.statut}
                      disabled={busy || !modifiable}
                      onChange={(e) =>
                        run(() => apiClient.collectes.pointer(id, ins.id, e.target.value as InscriptionStatut))
                      }
                      className="h-8 w-36"
                    >
                      {(Object.keys(INSCRIPTION_LABELS) as InscriptionStatut[]).map((s) => (
                        <option key={s} value={s}>{INSCRIPTION_LABELS[s]}</option>
                      ))}
                    </Select>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
