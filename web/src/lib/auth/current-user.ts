import { roles, type User } from "@cnts/rbac";
import { cookies } from "next/headers";

import { sessionCookieName, verifySessionToken } from "./session";

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const resolvedRoles = session.roleIds
    .map((id) => {
      // 1. Essayer de trouver par ID de rôle (ex: "role_admin")
      const foundById = Object.values(roles).find((r) => r.id === id);
      if (foundById) return foundById;

      // 2. Fallback: essayer par clé (ex: "admin") - legacy ou config manuelle
      return (roles as Record<string, any>)[id];
    })
    .filter((r): r is (typeof roles)[keyof typeof roles] => Boolean(r));

  return {
    id: session.userId,
    email: session.email,
    displayName: session.displayName,
    roles: resolvedRoles,
    isMfaEnabled: true
  };
}

