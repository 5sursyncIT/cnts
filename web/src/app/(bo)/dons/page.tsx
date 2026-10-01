"use client";

import { useDons, useDonneurs } from "@cnts/api";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, Droplet, Heart, RefreshCw } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pagination,
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

export default function DonsPage() {
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [donneurIdFilter, setDonneurIdFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const { data: dons, status, error, refetch } = useDons(apiClient, {
    statut: statutFilter || undefined,
    donneur_id: donneurIdFilter || undefined,
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });

  // Charger les donneurs pour le filtre
  const { data: donneurs } = useDonneurs(apiClient, { limit: 200 });

  const hasFilters = Boolean(statutFilter || donneurIdFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dons"
        description="Historique des dons de sang collectés"
        actions={
          <ButtonLink href="/dons/nouveau" variant="success" icon={<Heart className="h-4 w-4" aria-hidden="true" />}>
            Nouveau don
          </ButtonLink>
        }
      />

      <Card className="p-4">
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Donneur" className="sm:col-span-2">
            <Select
              value={donneurIdFilter}
              onChange={(e) => {
                setDonneurIdFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les donneurs</option>
              {donneurs?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}, {d.prenom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Statut">
            <Select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="LIBERE">Libéré</option>
            </Select>
          </Field>
          <div>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Actualiser
            </Button>
          </div>
        </div>
      </Card>

      {status === "success" && dons && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Dons affichés"
            value={dons.length}
            hint="Sur cette page"
            icon={<Droplet className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="En attente"
            value={dons.filter((d) => d.statut_qualification === "EN_ATTENTE").length}
            tone="warning"
            icon={<Clock className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label="Libérés"
            value={dons.filter((d) => d.statut_qualification === "LIBERE").length}
            tone="success"
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        {status === "loading" && <LoadingState rows={8} />}

        {status === "error" && (
          <ErrorState message={apiErrorMessage(error, "Impossible de charger les dons.")} onRetry={() => refetch()} />
        )}

        {status === "success" && dons && dons.length === 0 && (
          <EmptyState
            icon={<Droplet className="h-6 w-6" aria-hidden="true" />}
            title="Aucun don trouvé"
            description={hasFilters ? "Aucun don ne correspond à ces critères." : undefined}
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatutFilter("");
                    setDonneurIdFilter("");
                    setPage(1);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <ButtonLink href="/dons/nouveau" size="sm" variant="success">
                  Nouveau don
                </ButtonLink>
              )
            }
          />
        )}

        {status === "success" && dons && dons.length > 0 && (
          <>
            <Table>
              <THead>
                <tr>
                  <Th>DIN</Th>
                  <Th>Date du don</Th>
                  <Th>Type</Th>
                  <Th>Statut</Th>
                  <Th>Poches</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {dons.map((don) => (
                  <Tr key={don.id}>
                    <Td className="whitespace-nowrap">
                      <Link href={`/dons/${don.id}`} className="font-mono text-sm text-blue-600 hover:text-blue-800">
                        {don.din}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {new Date(don.date_don).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Td>
                    <Td className="whitespace-nowrap text-gray-600">{don.type_don}</Td>
                    <Td>
                      <StatusBadge status={don.statut_qualification} />
                    </Td>
                    <Td className="whitespace-nowrap text-gray-600">
                      {don.poches ? `${don.poches.length} poche${don.poches.length > 1 ? "s" : ""}` : "—"}
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <div className="flex justify-end gap-3 text-sm font-medium">
                        <Link href={`/dons/${don.id}`} className="text-blue-600 hover:text-blue-800">
                          Voir
                        </Link>
                        <Link href={`/donneurs/${don.donneur_id}`} className="text-gray-700 hover:text-gray-900">
                          Donneur
                        </Link>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <Pagination
              page={page}
              hasNext={dons.length >= ITEMS_PER_PAGE}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              summary={`Page ${page} · ${dons.length} résultat${dons.length > 1 ? "s" : ""} affiché${dons.length > 1 ? "s" : ""}`}
            />
          </>
        )}
      </Card>
    </div>
  );
}
