import { hasPermission, perm } from "@cnts/rbac";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { accessCookieName } from "@/lib/auth/session";

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
      <main>
        <h1 className="text-2xl font-semibold">Audit</h1>
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          Accès refusé.
        </div>
      </main>
    );
  }

  const events = await getPersistedAuditEvents();
  logAuditEvent({ actorEmail: user.email, action: "audit.view" });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Logs & audit</h1>
      <p className="mt-1 text-sm text-zinc-600">Événements persistés de traçabilité métier.</p>

      <section className="mt-6 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th scope="col" className="px-4 py-2 font-medium text-zinc-900">
                Date
              </th>
              <th scope="col" className="px-4 py-2 font-medium text-zinc-900">
                Acteur
              </th>
              <th scope="col" className="px-4 py-2 font-medium text-zinc-900">
                Action
              </th>
              <th scope="col" className="px-4 py-2 font-medium text-zinc-900">
                Cible
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, idx) => (
              <tr key={e.id ?? idx} className="border-b border-zinc-100">
                <td className="px-4 py-2 font-mono text-xs text-zinc-700">{e.created_at}</td>
                <td className="px-4 py-2 text-zinc-800">{String(e.payload?.actor_email ?? e.payload?.admin_email ?? "—")}</td>
                <td className="px-4 py-2 text-zinc-800">{e.event_type}</td>
                <td className="px-4 py-2 text-zinc-800">{e.aggregate_type}:{e.aggregate_id}</td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-zinc-600" colSpan={4}>
                  Aucun événement pour l’instant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
