import { afterEach, describe, expect, it, vi } from "vitest";
import { getArticle, getArticles, getPartners, getResources, mediaUrl } from "./cms";

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
});
