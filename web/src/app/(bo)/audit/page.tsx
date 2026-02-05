import { hasPermission, perm } from "@cnts/rbac";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { listAuditEvents } from "@/lib/audit/store";

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

  const events = listAuditEvents(80);
  logAuditEvent({ actorEmail: user.email, action: "audit.view" });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Logs & audit</h1>
      <p className="mt-1 text-sm text-zinc-600">Aperçu local des actions utilisateur côté Back Office.</p>

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
              <tr key={`${e.ts}-${idx}`} className="border-b border-zinc-100">
                <td className="px-4 py-2 font-mono text-xs text-zinc-700">{e.ts}</td>
                <td className="px-4 py-2 text-zinc-800">{e.actorEmail ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-800">{e.action}</td>
                <td className="px-4 py-2 text-zinc-800">{e.target ?? "—"}</td>
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
