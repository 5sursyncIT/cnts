import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./index";

describe("api client", () => {
  it("calls /health", async () => {
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      return new Response("not found", { status: 404 });
    };

    const api = createApiClient({ baseUrl: "http://localhost:8000", fetchImpl: fetchImpl as typeof fetch });
    await expect(api.health()).resolves.toEqual({ status: "ok" });
  });

  it("throws ApiError-like object on non-2xx", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ detail: "bad" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });

    const api = createApiClient({ baseUrl: "http://localhost:8000", fetchImpl: fetchImpl as typeof fetch });
    await expect(api.health()).rejects.toMatchObject({ status: 400 });
  });

  it("handles non-JSON responses", async () => {
    const fetchImpl = async () => new Response("ok", { status: 200, headers: { "content-type": "text/plain" } });
    const api = createApiClient({ baseUrl: "http://localhost:8000", fetchImpl: fetchImpl as typeof fetch });
    await expect(api.health()).resolves.toBe("ok");
  });

  it("builds query params for listDonneurs", async () => {
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain("/donneurs");
      expect(url).toContain("q=ndiaye");
      expect(url).toContain("limit=10");
      expect(url).toContain("offset=20");
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    };

    const api = createApiClient({ baseUrl: "http://localhost:8000", fetchImpl: fetchImpl as typeof fetch });
    await expect(api.donneurs.list({ q: "ndiaye", limit: 10, offset: 20 })).resolves.toEqual([]);
  });

  it("covers most endpoints", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
    });

    const api = createApiClient({ baseUrl: "http://localhost:8000", fetchImpl: fetchImpl as unknown as typeof fetch });

    await api.health();
    await api.healthDb();

    await api.donneurs.list();
    await api.donneurs.create({} as any);
    await api.donneurs.get("00000000-0000-0000-0000-000000000000");

    await api.dons.list();
    await api.dons.create({} as any);
    await api.dons.get("00000000-0000-0000-0000-000000000000");

    await api.analyses.list();
    await api.analyses.create({} as any);
    await api.analyses.get("00000000-0000-0000-0000-000000000000");

    await api.liberation.check("00000000-0000-0000-0000-000000000000");
    await api.liberation.liberer("00000000-0000-0000-0000-000000000000");

    await api.poches.list();
    await api.poches.get("00000000-0000-0000-0000-000000000000");
    await api.poches.delete("00000000-0000-0000-0000-000000000000");
    await api.poches.getAlertesPeremption();
    await api.poches.getStockSummary();

    await api.stock.listRecettes();
    await api.stock.getRecette("code");
    await api.stock.createRecette({} as any);
    await api.stock.updateRecette("code", {} as any);
    await api.stock.deleteRecette("code");
    await api.stock.listPochesStock();
    await api.stock.listProductRules();
    await api.stock.getProductRule("CGR");
    await api.stock.upsertProductRule("CGR", {} as any);
    await api.stock.fractionner({} as any);
    await api.stock.fractionnerAvecRecette("code", {} as any);

    await api.hopitaux.list();
    await api.hopitaux.create({} as any);
    await api.hopitaux.get("00000000-0000-0000-0000-000000000000");

    await api.commandes.list();
    await api.commandes.create({} as any);
    await api.commandes.get("00000000-0000-0000-0000-000000000000");
    await api.commandes.valider("00000000-0000-0000-0000-000000000000");
    await api.commandes.affecter("00000000-0000-0000-0000-000000000000", {} as any);
    await api.commandes.servir("00000000-0000-0000-0000-000000000000");
    await api.commandes.annuler("00000000-0000-0000-0000-000000000000");
    await api.commandes.sweepReservations();

    await api.receveurs.list();
    await api.receveurs.create({} as any);
    await api.receveurs.get("00000000-0000-0000-0000-000000000000");

    await api.crossMatch.create({} as any);

    await api.hemovigilance.listActesTransfusionnels();
    await api.hemovigilance.getActeTransfusionnel("00000000-0000-0000-0000-000000000000");
    await api.hemovigilance.listRappels();
    await api.hemovigilance.getRappel("00000000-0000-0000-0000-000000000000");

    expect(fetchImpl).toHaveBeenCalled();
  });
});
