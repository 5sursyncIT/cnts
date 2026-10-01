"use client";

import { useCommandes, useHopitaux } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  Button,
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  Field,
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

export default function CommandesPage() {
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [hopitalFilter, setHopitalFilter] = useState<string>("");

  const { data: commandes, status, error, refetch } = useCommandes(apiClient, {
    statut: statutFilter || undefined,
    hopital_id: hopitalFilter || undefined,
    limit: 200,
  });

  const { data: hopitaux } = useHopitaux(apiClient, { limit: 200 });

  // Trouver le nom d'un hôpital
  const getHopitalNom = (hopitalId: string) => {
    return hopitaux?.find((h) => h.id === hopitalId)?.nom || "Hôpital inconnu";
  };

  // Calculer les statistiques
  const stats = commandes
    ? {
      total: commandes.length,
      brouillon: commandes.filter((c) => c.statut === "BROUILLON").length,
      validee: commandes.filter((c) => c.statut === "VALIDEE").length,
      servie: commandes.filter((c) => c.statut === "SERVIE").length,
      annulee: commandes.filter((c) => c.statut === "ANNULEE").length,
    }
    : { total: 0, brouillon: 0, validee: 0, servie: 0, annulee: 0 };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes hospitalières"
        description="Historique complet des commandes de produits sanguins"
        back={{ href: "/distribution", label: "Distribution" }}
        actions={
          <ButtonLink href="/distribution/commandes/nouvelle" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Nouvelle commande
          </ButtonLink>
        }
      />

      {status === "success" && commandes && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Brouillons" value={stats.brouillon} />
          <StatCard label="Validées" value={stats.validee} tone="info" />
          <StatCard label="Servies" value={stats.servie} tone="success" />
          <StatCard label="Annulées" value={stats.annulee} tone="danger" />
        </div>
      )}

      <Card>
        <CardBody>
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <Field label="Statut">
              <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <option value="">Tous</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="VALIDEE">Validée</option>
                <option value="SERVIE">Servie</option>
                <option value="ANNULEE">Annulée</option>
              </Select>
            </Field>
            <div>
              <Button variant="secondary" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}>
                Actualiser
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        {status === "loading" && <LoadingState />}

        {status === "error" && (
          <ErrorState
            message={error?.status ? `Le serveur a répondu avec l’erreur ${error.status}.` : "Erreur inconnue."}
            onRetry={() => refetch()}
          />
        )}

        {status === "success" && commandes && commandes.length === 0 && (
          <EmptyState
            title="Aucune commande trouvée"
            description={statutFilter || hopitalFilter ? "Modifiez les filtres pour élargir la recherche." : undefined}
            action={
              <ButtonLink href="/distribution/commandes/nouvelle" variant="secondary" size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Créer une commande
              </ButtonLink>
            }
          />
        )}

        {status === "success" && commandes && commandes.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>Hôpital</Th>
                  <Th>Date demande</Th>
                  <Th>Livraison prévue</Th>
                  <Th>Lignes</Th>
                  <Th>Statut</Th>
                  <Th align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </THead>
              <TBody>
                {commandes.map((commande) => (
                  <Tr key={commande.id}>
                    <Td className="whitespace-nowrap">
                      <Link
                        href={`/distribution/commandes/${commande.id}`}
                        className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        {getHopitalNom(commande.hopital_id)}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{fmtDate(commande.date_demande)}</Td>
                    <Td className="whitespace-nowrap">
                      {commande.date_livraison_prevue ? fmtDate(commande.date_livraison_prevue) : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div>{commande.lignes.length} ligne(s)</div>
                      <div className="text-xs text-gray-500">
                        {commande.lignes.reduce((sum, l) => sum + l.quantite, 0)} poche(s)
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={commande.statut} />
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <Link
                        href={`/distribution/commandes/${commande.id}`}
                        className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        Gérer
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-gray-100 px-4 py-3 text-right text-sm text-gray-600">
              {commandes.length} commande(s) affichée(s)
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
