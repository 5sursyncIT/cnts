import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => {
        if (name === "cnts_portal_session") return { value: "token" };
        return undefined;
      }
    }))
  };
});

vi.mock("./session", () => {
  return {
    sessionCookieName: "cnts_portal_session",
    verifySessionToken: vi.fn(async () => ({ userId: "p1", email: "patient@cnts.local", displayName: "Patient" }))
  };
});

import { getCurrentPatient } from "./current-user";

describe("getCurrentPatient", () => {
  it("returns session when cookie is set", async () => {
    await expect(getCurrentPatient()).resolves.toMatchObject({ email: "patient@cnts.local" });
  });

  it("returns null when cookie missing", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => ({ get: () => undefined })
    );
    await expect(getCurrentPatient()).resolves.toBeNull();
  });

  it("returns null when token verification fails", async () => {
    const { verifySessionToken } = await import("./session");
    (verifySessionToken as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => null
    );
    await expect(getCurrentPatient()).resolves.toBeNull();
  });
});
