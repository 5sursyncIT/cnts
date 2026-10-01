import { Heart, Plus, Truck } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { backendGet } from "@/lib/backend/server-fetch";
import { ButtonLink, Card, ErrorState, PageHeader } from "@/components/ui";
import {
  KpiRow,
  MapWidget,
  RecentOrders,
  StockDistribution,
  UpcomingCollectes,
  type DashboardData,
} from "@/components/dashboard-widgets";

function salutation() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Africa/Dakar" }).format(new Date()));
  return h < 18 ? "Bonjour" : "Bonsoir";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  logAuditEvent({ actorEmail: user.email, action: "dashboard.view", metadata: {} });

  const res = await backendGet<DashboardData>("/tableau-de-bord");
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeZone: "Africa/Dakar" }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${salutation()}, ${user.displayName}`}
        description={<span className="capitalize">{today}</span>}
        actions={
          <>
            <ButtonLink href="/donneurs/nouveau" variant="secondary" icon={<Plus className="h-4 w-4" />}>
              Donneur
            </ButtonLink>
            <ButtonLink href="/distribution/commandes/nouvelle" variant="secondary" icon={<Truck className="h-4 w-4" />}>
              Commande
            </ButtonLink>
            <ButtonLink href="/dons/nouveau" icon={<Heart className="h-4 w-4" />}>
              Nouveau don
            </ButtonLink>
          </>
        }
      />

      {res.ok ? (
        <>
          <KpiRow kpis={res.data.kpis} alertDays={res.data.peremption_alerte_jours} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentOrders commandes={res.data.commandes_recentes} parStatut={res.data.commandes_par_statut} />
            </div>
            <UpcomingCollectes collectes={res.data.collectes_a_venir} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <StockDistribution stock={res.data.stock} />
            <div className="lg:col-span-2">
              <MapWidget parRegion={res.data.donneurs_par_region} />
            </div>
          </div>
        </>
      ) : (
        <Card>
          <ErrorState
            title="Indicateurs momentanément indisponibles"
            message={`Le serveur n’a pas répondu (erreur ${res.status}). Rechargez la page dans un instant.`}
          />
        </Card>
      )}
    </div>
  );
}
