"use client";

import { useActesTransfusionnels, useHopitaux, useReceveurs } from "@cnts/api";
import { useState } from "react";
import { Activity, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {
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
  PageHeader,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function TransfusionsClient({ canConfirm }: { canConfirm: boolean }) {
  // Filtres
  const [dinFilter, setDinFilter] = useState("");
  const [hopitalFilter, setHopitalFilter] = useState("");
  const [receveurFilter, setReceveurFilter] = useState("");
  const [pocheId, setPocheId] = useState("");
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Requêtes API
  const { data: actes, status, refetch } = useActesTransfusionnels(apiClient, {
    din: dinFilter || undefined,
    hopital_id: hopitalFilter || undefined,
    receveur_id: receveurFilter || undefined,
    limit: 100,
  });

  const { data: hopitaux } = useHopitaux(apiClient, { limit: 100 });
  const { data: receveurs } = useReceveurs(apiClient, { limit: 100 });

  // Helpers pour l'affichage
  const getHopitalName = (id: string | null) => {
    if (!id) return "—";
    return hopitaux?.find((h) => h.id === id)?.nom || "Inconnu";
  };

  const getReceveurName = (id: string | null) => {
    if (!id) return "—";
    const r = receveurs?.find((r) => r.id === id);
    return r ? `${r.prenom || ""} ${r.nom || ""}`.trim() || r.nom : "Inconnu";
  };

  const getTypeLabel = (type: string | undefined) => {
    const labels: Record<string, string> = {
      ST: "Sang total",
      CGR: "CGR",
      PFC: "PFC",
      CP: "CP",
    };
    return type ? labels[type] || type : "—";
  };

  const confirmer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm) return;
    setConfirming(true);
    setConfirmationError(null);
    try {
      const response = await fetch("/api/hemovigilance/transfusions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poche_id: pocheId.trim(), date_transfusion: new Date().toISOString() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(typeof error.detail === "string" ? error.detail : `Erreur ${response.status}`);
      }
      setPocheId("");
      toast.success("Transfusion confirmée");
      await refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Confirmation impossible";
      setConfirmationError(msg);
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi transfusionnel"
        description="Historique et traçabilité des actes transfusionnels"
        back={{ href: "/hemovigilance", label: "Hémovigilance" }}
      />

      {canConfirm && (
        <Card>
          <CardHeader
            title="Confirmer une transfusion réalisée"
            description="La livraison seule ne confirme pas l’administration au patient."
          />
          <CardBody>
            <form onSubmit={confirmer} className="flex flex-wrap items-end gap-3">
              <Field label="Identifiant de la poche livrée" required className="min-w-0 flex-1 sm:min-w-72" error={confirmationError ?? undefined}>
                <Input value={pocheId} onChange={(event) => setPocheId(event.target.value)} placeholder="Identifiant de la poche" />
              </Field>
              <Button type="submit" loading={confirming} icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}>
                {confirming ? "Confirmation…" : "Confirmer maintenant"}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="DIN">
              <Input
                type="search"
                value={dinFilter}
                onChange={(e) => setDinFilter(e.target.value)}
                placeholder="Ex. : 23-123456"
              />
            </Field>
            <Field label="Hôpital">
              <Select value={hopitalFilter} onChange={(e) => setHopitalFilter(e.target.value)}>
                <option value="">Tous les hôpitaux</option>
                {hopitaux?.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nom}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Receveur">
              <Select value={receveurFilter} onChange={(e) => setReceveurFilter(e.target.value)}>
                <option value="">Tous les receveurs</option>
                {receveurs?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.prenom} {r.nom} ({r.groupe_sanguin || "?"})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        {status === "loading" && <LoadingState label="Chargement des transfusions…" />}

        {status === "error" && (
          <ErrorState message="Une erreur est survenue lors du chargement des données." onRetry={() => refetch()} />
        )}

        {status === "success" && actes?.length === 0 && (
          <EmptyState
            title="Aucun acte transfusionnel trouvé"
            description={dinFilter || hopitalFilter || receveurFilter ? "Modifiez les filtres pour élargir la recherche." : undefined}
            icon={<Activity className="h-6 w-6" aria-hidden="true" />}
          />
        )}

        {status === "success" && actes && actes.length > 0 && (
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Produit</Th>
                <Th>Receveur</Th>
                <Th>Établissement</Th>
                <Th align="right">Statut</Th>
              </tr>
            </THead>
            <TBody>
              {actes.map((acte) => (
                <Tr key={acte.id}>
                  <Td className="whitespace-nowrap text-gray-900">
                    {new Date(acte.date_transfusion).toLocaleDateString("fr-FR")}
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(acte.date_transfusion).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <p className="font-mono font-medium text-gray-900">{acte.din}</p>
                    <p className="text-xs text-gray-500">
                      {getTypeLabel(acte.type_produit)} · Lot : {acte.lot || "—"}
                    </p>
                  </Td>
                  <Td className="whitespace-nowrap">{getReceveurName(acte.receveur_id)}</Td>
                  <Td className="whitespace-nowrap text-gray-600">{getHopitalName(acte.hopital_id)}</Td>
                  <Td align="right" className="whitespace-nowrap">
                    <Badge tone="success" dot>
                      Transfusé
                    </Badge>
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
