import { describe, expect, it } from "vitest";

import { getDemoPatientByEmail, verifyPassword } from "./demo-user";

describe("demo user", () => {
  it("returns demo user and verifies password", () => {
    process.env.PORTAL_DEMO_PATIENT_EMAIL = "patient@cnts.local";
    process.env.PORTAL_DEMO_PATIENT_PASSWORD = "patient";
    const user = getDemoPatientByEmail("patient@cnts.local");
    expect(user).not.toBeNull();
    expect(verifyPassword(user!, "patient")).toBe(true);
    expect(verifyPassword(user!, "wrong")).toBe(false);
  });

  it("returns null for unknown email", () => {
    process.env.PORTAL_DEMO_PATIENT_EMAIL = "patient@cnts.local";
    expect(getDemoPatientByEmail("other@cnts.local")).toBeNull();
  });
});
