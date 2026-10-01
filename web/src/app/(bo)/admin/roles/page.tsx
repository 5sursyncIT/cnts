import { hasPermission, perm, rightsByModule } from "@cnts/rbac";

import { getCurrentUser } from "@/lib/auth/current-user";
import { logAuditEvent } from "@/lib/audit/log";
import { Alert, Badge, Card, CardBody, CardHeader, PageHeader, Table, TBody, THead, Td, Th, Tr, type BadgeTone } from "@/components/ui";

const RIGHTS: { key: "read" | "write" | "delete" | "validate"; label: string; tone: BadgeTone }[] = [
  { key: "read", label: "Lecture", tone: "success" },
  { key: "write", label: "Écriture", tone: "info" },
  { key: "delete", label: "Suppression", tone: "danger" },
  { key: "validate", label: "Validation", tone: "purple" },
];

export default async function RolesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canView = hasPermission({ user, permission: perm("administration", "read") });
  if (!canView) {
    logAuditEvent({ actorEmail: user.email, action: "rbac.roles_view_denied" });
    return (
      <div>
        <PageHeader title="Rôles et droits" />
        <Alert tone="danger">Accès refusé : votre rôle ne permet pas de consulter cette page.</Alert>
      </div>
    );
  }

  const rights = rightsByModule(user);
  const modules = Object.keys(rights).sort();
  logAuditEvent({ actorEmail: user.email, action: "rbac.roles_view" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles et droits"
        description="Modèle RBAC avec granularité lecture / écriture / suppression / validation."
      />

      <Card>
        <CardHeader title="Rôles assignés" />
        <CardBody>
          <ul className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
                <Badge tone="purple">{r.name}</Badge>
                <span className="font-mono text-xs text-gray-500">{r.id}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Matrice des permissions" description={`${modules.length} module(s)`} />
        <Table>
          <THead>
            <tr>
              <Th>Module</Th>
              {RIGHTS.map((r) => (
                <Th key={r.key} align="center">
                  {r.label}
                </Th>
              ))}
            </tr>
          </THead>
          <TBody>
            {modules.map((moduleName) => (
              <Tr key={moduleName}>
                <th scope="row" className="px-4 py-3 font-medium text-gray-900">
                  {moduleName}
                </th>
                {RIGHTS.map((r) => (
                  <Td key={r.key} align="center">
                    {rights[moduleName]?.[r.key] ? <Badge tone={r.tone}>Oui</Badge> : <Badge tone="neutral">Non</Badge>}
                  </Td>
                ))}
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
