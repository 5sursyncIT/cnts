"use client";

import { useRendezVous } from "@cnts/api";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { Card, CardHeader, EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api-error";
import { dateHeureDakar } from "@/lib/rendez-vous";

/** Rendez-vous pris en ligne par le donneur (les 20 derniers). */
export function RendezVousSection({ donneurId }: { donneurId: string }) {
  const { data, status, error, refetch } = useRendezVous(apiClient, { donneur_id: donneurId, limit: 20 });
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Rendez-vous en ligne"
        actions={
          <Link href="/donneurs/rendez-vous" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Tous les rendez-vous
          </Link>
        }
      />
      {status === "loading" && <LoadingState rows={2} />}
      {status === "error" && <ErrorState message={apiErrorMessage(error, "Impossible de charger les rendez-vous.")} onRetry={() => refetch()} />}
      {status === "success" && (data ?? []).length === 0 && (
        <EmptyState icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />} title="Aucun rendez-vous" description="Ce donneur n'a pris aucun rendez-vous en ligne." />
      )}
      {status === "success" && (data ?? []).length > 0 && (
        <ul className="divide-y divide-gray-100">
          {(data ?? []).map((r) => {
            const { jour, heure } = dateHeureDakar(r.date_prevue);
            return (
              <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize text-gray-900">
                    {jour} · {heure}
                  </p>
                  <p className="text-sm text-gray-600">{r.lieu || "—"}</p>
                  {r.motif && <p className="text-xs text-gray-500">{r.motif}</p>}
                </div>
                <StatusBadge status={r.statut} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
