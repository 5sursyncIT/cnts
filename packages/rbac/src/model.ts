export type PermissionAction = "read" | "write" | "delete" | "validate";

export type Permission = {
  module: string;
  action: PermissionAction;
};

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  roles: Role[];
  isMfaEnabled: boolean;
};

export type PermissionCheckInput = {
  user: Pick<User, "roles">;
  permission: Permission;
};

export function hasPermission(input: PermissionCheckInput): boolean {
  const { user, permission } = input;
  for (const role of user.roles) {
    for (const rolePerm of role.permissions) {
      if (rolePerm.module === permission.module && rolePerm.action === permission.action) {
        return true;
      }
    }
  }
  return false;
}

export type ModuleRights = Record<PermissionAction, boolean>;

export function rightsByModule(user: Pick<User, "roles">): Record<string, ModuleRights> {
  const result: Record<string, ModuleRights> = {};
  for (const role of user.roles) {
    for (const perm of role.permissions) {
      const current = result[perm.module] ?? {
        read: false,
        write: false,
        delete: false,
        validate: false
      };
      current[perm.action] = true;
      result[perm.module] = current;
    }
  }
  return result;
}

