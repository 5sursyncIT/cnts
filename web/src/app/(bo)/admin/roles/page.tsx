import { hasPermission, perm, rightsByModule } from "@cnts/rbac";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canView = hasPermission({ user, permission: perm("administration", "read") });
  if (!canView) {
    logAuditEvent({ actorEmail: user.email, action: "rbac.roles_view_denied" });
    return (
      <main>
        <h1 className="text-2xl font-semibold">Rôles & droits</h1>
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          Accès refusé.
        </div>
      </main>
    );
  }

  const rights = rightsByModule(user);
  const modules = Object.keys(rights).sort();
  logAuditEvent({ actorEmail: user.email, action: "rbac.roles_view" });

  return (
    <main>
      <h1 className="text-2xl font-semibold">Rôles & droits</h1>
      <p className="mt-1 text-sm text-zinc-600">Modèle RBAC avec granularité lecture/écriture/suppression/validation.</p>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Rôles assignés</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-zinc-800">
          {user.roles.map((r) => (
            <li key={r.id}>
              {r.name} <span className="text-xs text-zinc-500">({r.id})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Matrice des permissions</h2>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th scope="col" className="py-2 pr-4 font-medium text-zinc-900">
                  Module
                </th>
                <th scope="col" className="py-2 pr-4 font-medium text-zinc-900">
                  Lecture
                </th>
                <th scope="col" className="py-2 pr-4 font-medium text-zinc-900">
                  Écriture
                </th>
                <th scope="col" className="py-2 pr-4 font-medium text-zinc-900">
                  Suppression
                </th>
                <th scope="col" className="py-2 pr-4 font-medium text-zinc-900">
                  Validation
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((moduleName) => (
                <tr key={moduleName} className="border-b border-zinc-100">
                  <th scope="row" className="py-2 pr-4 font-medium text-zinc-900">
                    {moduleName}
                  </th>
                  <td className="py-2 pr-4">{rights[moduleName]?.read ? "Oui" : "Non"}</td>
                  <td className="py-2 pr-4">{rights[moduleName]?.write ? "Oui" : "Non"}</td>
                  <td className="py-2 pr-4">{rights[moduleName]?.delete ? "Oui" : "Non"}</td>
                  <td className="py-2 pr-4">{rights[moduleName]?.validate ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
