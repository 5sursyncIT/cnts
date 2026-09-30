import { afterEach, describe, expect, it, vi } from "vitest";
import { getArticle, getArticles, getPartners, getResources, getStockBarometer, getStructures, mediaUrl } from "./cms";

function mockFetch(data: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve({ data }) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("client CMS Strapi", () => {
  it("construit l'URL publique des médias", () => {
    expect(mediaUrl({ url: "/uploads/logo.png" })).toBe("https://cnts.gouv.sn/cms/uploads/logo.png");
    expect(mediaUrl({ url: "https://cdn.example/x.png" })).toBe("https://cdn.example/x.png");
    expect(mediaUrl(null)).toBeUndefined();
  });

  it("filtre les articles par catégorie et les trie par date", async () => {
    const fetchMock = mockFetch([
      { slug: "a", title: "A", category: "Communiqué", date: "2026-01-02", cover: { url: "/uploads/a.jpg" }, body: [] },
    ]);
    const list = await getArticles({ category: "Communiqué", limit: 3 });

    const url = decodeURIComponent(fetchMock.mock.calls[0][0] as string);
    expect(url).toContain("/api/articles?");
    expect(url).toContain("filters[category][$eq]=Communiqué");
    expect(url).toContain("sort=date:desc");
    expect(url).toContain("pagination[pageSize]=3");
    expect(list?.[0]).toMatchObject({ slug: "a", cat: "Communiqué", img: "https://cnts.gouv.sn/cms/uploads/a.jpg" });
  });

  it("renvoie null (repli) si le CMS est vide ou en erreur", async () => {
    mockFetch([]);
    expect(await getArticle("inconnu")).toBeNull();
    mockFetch(null, false);
    expect(await getPartners()).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    expect(await getArticles()).toBeNull();
  });

  it("ignore les ressources sans fichier et normalise l'extension", async () => {
    mockFetch([
      { title: "Logo", file: { url: "/uploads/logo.zip", ext: ".zip", size: 2048 } },
      { title: "Sans fichier", file: null },
    ]);
    expect(await getResources()).toEqual([
      { title: "Logo", description: undefined, url: "https://cnts.gouv.sn/cms/uploads/logo.zip", ext: "ZIP", sizeKb: 2048 },
    ]);
  });

  it("convertit les structures de la carte et déduit la région des coordonnées", async () => {
    mockFetch([
      { documentId: "m1", name: "CRTS de Matam", kind: "crts", commune: "Matam", departement: null, hote: "CRTS", latitude: 15.660078, longitude: -13.263137 },
      { documentId: "x", name: "Sans GPS", kind: "banque", commune: "X", latitude: "abc", longitude: null },
    ]);
    const list = await getStructures();
    expect(list).toHaveLength(1);
    expect(list?.[0]).toMatchObject({ id: "m1", kind: "crts", region: "SNMT", departement: "Matam", lat: 15.660078, lng: -13.263137 });
    expect(list?.[0].horaires).toBeUndefined();
  });

  it("renvoie null pour les structures si le CMS est vide ou injoignable", async () => {
    mockFetch([]);
    expect(await getStructures()).toBeNull();
    mockFetch(null, false);
    expect(await getStructures()).toBeNull();
  });

  it("calcule le statut de chaque groupe à partir des seuils du baromètre", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: {
              date_mise_a_jour: "2026-09-28",
              o_pos: 5, a_pos: 3, b_pos: 4, ab_pos: 7, o_neg: 1.1, a_neg: 2, b_neg: 1.6, ab_neg: 5,
              seuil_critique: 2, seuil_baisse: 3.5, message: "  Appel urgent aux donneurs O-  ",
            },
          }),
      }),
    );
    const b = await getStockBarometer();
    expect(b?.updatedOn).toBe("2026-09-28");
    expect(b?.message).toBe("Appel urgent aux donneurs O-");
    expect(b?.levels.map((l) => `${l.type}:${l.status}`)).toEqual([
      "O+:ok", "A+:warn", "B+:ok", "AB+:ok", "O-:crit", "A-:warn", "B-:crit", "AB-:ok",
    ]);
  });

  it("renvoie null pour le baromètre si le CMS est vide, incomplet ou injoignable", async () => {
    mockFetch(null);
    expect(await getStockBarometer()).toBeNull();
    mockFetch({ o_pos: 5 });
    expect(await getStockBarometer()).toBeNull();
    mockFetch(null, false);
    expect(await getStockBarometer()).toBeNull();
  });
});
