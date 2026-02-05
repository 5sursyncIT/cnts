import { describe, expect, it } from "vitest";

import { getBackOfficeUserByEmail, verifyPassword } from "./users";

describe("backoffice demo user", () => {
  it("returns null for unknown email", () => {
    process.env.BACKOFFICE_ADMIN_EMAIL = "admin@cnts.local";
    expect(getBackOfficeUserByEmail("other@cnts.local")).toBeNull();
  });

  it("builds user record from env and parses roles", () => {
    process.env.BACKOFFICE_ADMIN_EMAIL = "admin@cnts.local";
    process.env.BACKOFFICE_ADMIN_PASSWORD = "admin";
    process.env.BACKOFFICE_ADMIN_NAME = "Admin";
    process.env.BACKOFFICE_ADMIN_ROLES = "lectureSeule,unknown";
    process.env.BACKOFFICE_ADMIN_TOTP_SECRET = "totp";

    const user = getBackOfficeUserByEmail("ADMIN@CNTS.LOCAL");
    expect(user?.email).toBe("admin@cnts.local");
    expect(user?.displayName).toBe("Admin");
    expect(user?.isMfaEnabled).toBe(false);
    expect(user?.totpSecret).toBeUndefined();
    expect(user?.roles.length).toBe(1);
    expect(verifyPassword(user!, "admin")).toBe(true);
    expect(verifyPassword(user!, "bad")).toBe(false);
  });

  it("uses defaults when env vars are missing", () => {
    delete process.env.BACKOFFICE_ADMIN_EMAIL;
    delete process.env.BACKOFFICE_ADMIN_PASSWORD;
    delete process.env.BACKOFFICE_ADMIN_NAME;
    delete process.env.BACKOFFICE_ADMIN_ROLES;
    delete process.env.BACKOFFICE_ADMIN_TOTP_SECRET;

    const user = getBackOfficeUserByEmail("admin@cnts.local");
    expect(user?.displayName).toBe("Administrateur");
    expect(user?.roles.length).toBeGreaterThan(0);
    expect(user?.isMfaEnabled).toBe(false);
  });

  it("can disable MFA globally via env flag", () => {
    process.env.BACKOFFICE_ADMIN_EMAIL = "admin@cnts.local";
    process.env.BACKOFFICE_ADMIN_TOTP_SECRET = "totp";
    process.env.BACKOFFICE_DISABLE_MFA = "1";

    const user = getBackOfficeUserByEmail("admin@cnts.local");
    expect(user?.isMfaEnabled).toBe(false);
    expect(user?.totpSecret).toBeUndefined();
  });
});
