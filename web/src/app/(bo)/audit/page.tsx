import { hasPermission, perm } from "@cnts/rbac";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { accessCookieName } from "@/lib/auth/session";
import { Alert, Badge, Card, EmptyState, PageHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Africa/Dakar" });

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : dateFormatter.format(d);
}

type PersistedAuditEvent = {
  id: string;
  created_at: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
};

async function getPersistedAuditEvents(): Promise<PersistedAuditEvent[]> {
  const token = (await cookies()).get(accessCookieName)?.value;
  if (!token) return [];
  const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${backendUrl}/api/trace/events?limit=80`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  return response.ok ? await response.json() : [];
}

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canView = hasPermission({ user, permission: perm("audit", "read") });
  if (!canView) {
    logAuditEvent({ actorEmail: user.email, action: "audit.view_denied" });
    return (
      <div>
        <PageHeader title="Audit" />
        <Alert tone="danger">Accès refusé : vous n’avez pas la permission de consulter le journal d’audit.</Alert>
      </div>
    );
  }

  const events = await getPersistedAuditEvents();
  logAuditEvent({ actorEmail: user.email, action: "audit.view" });

  return (
    <div>
      <PageHeader title="Logs & audit" description="Événements persistés de traçabilité métier (80 plus récents)." />

      <Card>
        {events.length === 0 ? (
          <EmptyState title="Aucun événement pour l’instant" description="Les actions tracées apparaîtront ici." />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Date</Th>
                <Th>Acteur</Th>
                <Th>Action</Th>
                <Th>Cible</Th>
              </tr>
            </THead>
            <TBody>
              {events.map((e, idx) => (
                <Tr key={e.id ?? idx}>
                  <Td className="whitespace-nowrap tabular-nums text-gray-700">
                    <time dateTime={e.created_at}>{formatDate(e.created_at)}</time>
                  </Td>
                  <Td>{String(e.payload?.actor_email ?? e.payload?.admin_email ?? "—")}</Td>
                  <Td>
                    <Badge tone="info">{e.event_type}</Badge>
                  </Td>
                  <Td className="font-mono text-xs text-gray-700">
                    {e.aggregate_type}:{e.aggregate_id}
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
