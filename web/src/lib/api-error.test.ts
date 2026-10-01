import { describe, expect, it } from "vitest";

import { apiErrorMessage } from "./api-error";

describe("apiErrorMessage", () => {
  it("uses FastAPI string detail", () => {
    expect(apiErrorMessage({ status: 409, body: { detail: "déjà existant" } })).toBe("déjà existant");
  });

  it("joins validation errors", () => {
    const body = { detail: [{ msg: "champ requis" }, { msg: "trop long" }] };
    expect(apiErrorMessage({ status: 422, body })).toBe("champ requis · trop long");
  });

  it("maps statuses without detail", () => {
    expect(apiErrorMessage({ status: 403, body: null })).toBe("Action non autorisée pour votre rôle.");
    expect(apiErrorMessage({ status: 502, body: null })).toMatch(/serveur/);
  });

  it("falls back for unknown values", () => {
    expect(apiErrorMessage(new Error("réseau"))).toBe("réseau");
    expect(apiErrorMessage(undefined, "défaut")).toBe("défaut");
  });
});
