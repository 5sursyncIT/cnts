import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => {
        if (name !== "cnts_gdpr_consent") return undefined;
        return { value: "accepted" };
      }
    }))
  };
});

import { getGdprConsent } from "./consent";

describe("getGdprConsent", () => {
  it("returns accepted/declined/unset", async () => {
    await expect(getGdprConsent()).resolves.toBe("accepted");

    const { cookies } = await import("next/headers");
    (cookies as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => ({ get: () => ({ value: "declined" }) })
    );
    await expect(getGdprConsent()).resolves.toBe("declined");

    (cookies as unknown as { mockImplementationOnce: (impl: unknown) => unknown }).mockImplementationOnce(
      async () => ({ get: () => undefined })
    );
    await expect(getGdprConsent()).resolves.toBe("unset");
  });
});

