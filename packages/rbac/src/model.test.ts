import { describe, expect, it } from "vitest";

import { hasPermission, perm, rightsByModule, roles, type User } from "./index";

function userWithRoles(...roleIds: Array<keyof typeof roles>): User {
  return {
    id: "u1",
    email: "admin@cnts.local",
    displayName: "Admin",
    roles: roleIds.map((roleId) => roles[roleId]),
    isMfaEnabled: true
  };
}

describe("rbac", () => {
  it("returns false when user has no matching permission", () => {
    const user = userWithRoles("agentStock");
    expect(hasPermission({ user, permission: { module: "dons", action: "read" } })).toBe(false);
  });

  it("returns true when any role grants the permission", () => {
    const user = userWithRoles("agentStock", "lectureSeule");
    expect(hasPermission({ user, permission: { module: "stock", action: "write" } })).toBe(true);
  });

  it("aggregates rights per module", () => {
    const user = userWithRoles("biologiste");
    const rights = rightsByModule(user);
    expect(rights.analyses.read).toBe(true);
    expect(rights.analyses.write).toBe(true);
    expect(rights.liberation.validate).toBe(true);
    expect(rights.stock).toBeUndefined();
  });

  it("builds permission objects with perm()", () => {
    expect(perm("stock", "read")).toEqual({ module: "stock", action: "read" });
  });
});
