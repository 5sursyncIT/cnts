import { roles, type User } from "@cnts/rbac";

export type BackOfficeUserRecord = User & {
  password: string;
  totpSecret?: string;
};

function parseRoles(roleIdsRaw: string | undefined) {
  // Par défaut, ou si "admin" est spécifié, on utilise explicitement le rôle admin
  // Cela évite les erreurs de lookup dynamique si l'objet roles est mal indexé
  if (!roleIdsRaw || roleIdsRaw === "admin") {
    return [roles.admin];
  }

  const ids = roleIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids
    .map((id) => (roles as any)[id])
    .filter((r) => Boolean(r));
}

export function getBackOfficeUserByEmail(email: string): BackOfficeUserRecord | null {
  const adminEmail = process.env.BACKOFFICE_ADMIN_EMAIL ?? "admin@cnts.local";
  if (email.toLowerCase() !== adminEmail.toLowerCase()) return null;

  // Force disable MFA as requested
  const disableMfa = true; 
  const password = process.env.BACKOFFICE_ADMIN_PASSWORD ?? "admin";
  const displayName = process.env.BACKOFFICE_ADMIN_NAME ?? "Administrateur";
  const roleIds = process.env.BACKOFFICE_ADMIN_ROLES;
  const totpSecret = disableMfa ? undefined : process.env.BACKOFFICE_ADMIN_TOTP_SECRET;

  return {
    id: "user_admin",
    email: adminEmail,
    displayName,
    roles: parseRoles(roleIds),
    isMfaEnabled: Boolean(totpSecret) && !disableMfa,
    password,
    totpSecret
  };
}

export function verifyPassword(user: BackOfficeUserRecord, password: string): boolean {
  return user.password === password;
}
