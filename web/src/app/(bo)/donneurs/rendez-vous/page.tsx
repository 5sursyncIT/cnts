import { hasPermission, perm } from "@cnts/rbac";

import { getCurrentUser } from "@/lib/auth/current-user";

import RendezVousClient from "./rendez-vous-client";

export default async function RendezVousPage() {
  const user = await getCurrentUser();
  const canWrite = Boolean(user && hasPermission({ user, permission: perm("donneurs", "write") }));
  const isAdmin = Boolean(user?.roles.some((r) => r.id === "role_admin"));
  return <RendezVousClient canWrite={canWrite} isAdmin={isAdmin} />;
}
