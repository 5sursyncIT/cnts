"use client";

import { useCommandes, useHopitaux } from "@cnts/api";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FilePen,
  Plus,
  RefreshCw,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";

export default function DistributionPage() {
  // Charger toutes les commandes récentes
  const { data: commandes, status, refetch } = useCommandes(apiClient, {
    limit: 50,
  });

  // Charger les hôpitaux
  const { data: hopitaux } = useHopitaux(apiClient, {
    convention_actif: true,
    limit: 100,
  });

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "error">("idle");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const inflightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("bo.autoRefreshEnabled");
    if (stored === "false") setAutoRefreshEnabled(false);

    const onRefreshSetting = (event: Event) => {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof customEvent.detail?.enabled === "boolean") {
        setAutoRefreshEnabled(customEvent.detail.enabled);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === "bo.autoRefreshEnabled") {
        setAutoRefreshEnabled(event.newValue !== "false");
      }
    };

    window.addEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("bo:autoRefreshChanged", onRefreshSetting as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refreshData = useCallback(async (options?: { force?: boolean }) => {
    const now = Date.now();
    if (!options?.force && now - lastFetchAtRef.current < 5000) return;
    if (inflightRef.current) return;
    inflightRef.current = true;
    lastFetchAtRef.current = now;
    setRefreshState("loading");
    setRefreshError(null);
    try {
      await refetch();
      setRefreshState("idle");
    } catch (err) {
      setRefreshState("error");
      setRefreshError(err instanceof Error ? err.message : "Connexion interrompue");
    } finally {
      inflightRef.current = false;
    }
  }, [refetch]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (autoRefreshEnabled) {
      intervalId = window.setInterval(() => {
        refreshData();
      }, 15000) as unknown as number;
    }
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, refreshData]);

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

  // Filtrer les commandes en attente (BROUILLON + VALIDEE)
  const commandesEnAttente = commandes?.filter(
    (c) => c.statut === "BROUILLON" || c.statut === "VALIDEE"
  );

  // Trouver le nom d'un hôpital
  const getHopitalNom = (hopitalId: string) => {
    return hopitaux?.find((h) => h.id === hopitalId)?.nom || "Hôpital inconnu";
  };

  const refreshDotClass =
    refreshState === "loading"
      ? "bg-blue-500 animate-pulse"
      : refreshState === "error"
      ? "bg-red-500"
      : autoRefreshEnabled
      ? "bg-emerald-500"
      : "bg-gray-400";
  const refreshLabel = autoRefreshEnabled
    ? refreshState === "loading"
      ? "Mise à jour…"
      : refreshState === "error"
      ? "Connexion interrompue"
      : "Données à jour"
    : "Rafraîchissement désactivé";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribution"
        description="Commandes hospitalières et réservations de poches"
        actions={
          <>
            <span
              className="inline-flex items-center gap-2 text-xs text-gray-600"
              title={refreshError ?? undefined}
              role="status"
              aria-live="polite"
            >
              <span className={`h-2 w-2 rounded-full ${refreshDotClass}`} aria-hidden="true" />
              {refreshLabel}
            </span>
            <ButtonLink href="/distribution/commandes/nouvelle" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Nouvelle commande
            </ButtonLink>
          </>
        }
      />

      {status === "success" && commandes && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Total" value={stats.total} icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Brouillons" value={stats.brouillon} icon={<FilePen className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Validées" value={stats.validee} tone="info" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Servies" value={stats.servie} tone="success" icon={<Truck className="h-5 w-5" aria-hidden="true" />} />
          <StatCard label="Annulées" value={stats.annulee} tone="danger" icon={<XCircle className="h-5 w-5" aria-hidden="true" />} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink
          href="/distribution/commandes"
          title="Toutes les commandes"
          description="Historique complet des commandes hospitalières"
          icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />}
        />
        <QuickLink
          href="/distribution/hopitaux"
          title="Hôpitaux"
          description="Établissements et conventions"
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
        />
        <QuickLink
          href="/distribution/receveurs"
          title="Receveurs"
          description="Receveurs et cross-matchings"
          icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Commandes en attente"
          description="Brouillons et commandes validées à traiter"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            >
              Actualiser
            </Button>
          }
        />

        {status === "loading" && <LoadingState rows={4} />}

        {status === "error" && <ErrorState message="Les commandes n’ont pas pu être chargées." onRetry={() => refetch()} />}

        {status === "success" && (!commandesEnAttente || commandesEnAttente.length === 0) && (
          <EmptyState
            title="Aucune commande en attente"
            description="Toutes les commandes ont été traitées."
            action={
              <ButtonLink href="/distribution/commandes/nouvelle" variant="secondary" size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Créer une commande
              </ButtonLink>
            }
          />
        )}

        {status === "success" && commandesEnAttente && commandesEnAttente.length > 0 && (
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
              {commandesEnAttente.map((commande) => (
                <Tr key={commande.id}>
                  <Td className="whitespace-nowrap font-medium text-gray-900">{getHopitalNom(commande.hopital_id)}</Td>
                  <Td className="whitespace-nowrap">{new Date(commande.date_demande).toLocaleDateString("fr-FR")}</Td>
                  <Td className="whitespace-nowrap">
                    {commande.date_livraison_prevue
                      ? new Date(commande.date_livraison_prevue).toLocaleDateString("fr-FR")
                      : "—"}
                  </Td>
                  <Td className="whitespace-nowrap">{commande.lignes.length} ligne(s)</Td>
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
        )}
      </Card>

      <Alert tone="info">
        <p className="mb-2 font-medium">Circuit de distribution</p>
        <ol className="list-inside list-decimal space-y-1 text-xs">
          <li>
            <strong>Brouillon</strong> : commande créée, lignes spécifiées
          </li>
          <li>
            <strong>Validée</strong> : poches réservées automatiquement (FEFO)
          </li>
          <li>
            <strong>Affectation</strong> : association des receveurs aux poches (cross-matching)
          </li>
          <li>
            <strong>Servie</strong> : poches marquées distribuées, prêtes pour la transfusion
          </li>
        </ol>
      </Alert>
    </div>
  );
}

function QuickLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-900">{title}</span>
        <span className="mt-0.5 block text-sm text-gray-600">{description}</span>
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 group-hover:text-blue-600" aria-hidden="true" />
    </Link>
  );
}
