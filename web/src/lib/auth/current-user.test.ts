import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => {
        if (name === "cnts_backoffice_session") return { value: "token" };
        return undefined;
      }
    }))
  };
});

vi.mock("./session", () => {
  return {
    sessionCookieName: "cnts_backoffice_session",
    verifySessionToken: vi.fn(async () => ({
      userId: "u1",
      email: "admin@cnts.local",
      displayName: "Admin",
      roleIds: ["lectureSeule"],
      mfa: true
    }))
  };
});

import { getCurrentUser } from "./current-user";

describe("getCurrentUser", () => {
  it("returns user with resolved roles", async () => {
    const user = await getCurrentUser();
    expect(user).toMatchObject({
      id: "u1",
      email: "admin@cnts.local",
      displayName: "Admin",
      isMfaEnabled: true
    });
    expect(user?.roles.length).toBe(1);
  });

  it("returns null without cookie", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => ({ get: () => undefined })
    );
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("returns null when session token is invalid", async () => {
    const { verifySessionToken } = await import("./session");
    (verifySessionToken as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => null
    );
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
