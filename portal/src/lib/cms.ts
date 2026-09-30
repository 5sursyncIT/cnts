// Client du CMS Strapi (contenu éditorial du portail).
//
// Appelé uniquement côté serveur. Chaque fonction renvoie `null` si le CMS est
// injoignable ou vide : les pages retombent alors sur le contenu de repli de
// `components/cnts/data.ts`, de sorte que le portail reste utilisable même
// quand Strapi est arrêté.
import type { NewsItem, PartnerItem, TeamItem, FaqItem, StockBarometer } from "@/components/cnts/data";
import { stockStatus } from "../components/cnts/data";
import type { Structure, StructureKind } from "@/components/cnts/structures";
import { regionOf } from "../components/cnts/senegal-geo";
import { logger } from "./logger";

// URL interne (réseau docker) utilisée pour les appels serveur → Strapi.
const CMS_INTERNAL_URL = (process.env.CMS_INTERNAL_URL || "http://localhost:1337").replace(/\/$/, "");
// URL publique utilisée pour construire les liens vers les médias (images, PDF).
const CMS_PUBLIC_URL = (process.env.CMS_PUBLIC_URL || "https://cnts.gouv.sn/cms").replace(/\/$/, "");
const TIMEOUT_MS = 3000;

export type CmsMedia = {
  url: string;
  alternativeText?: string | null;
  name?: string;
  ext?: string;
  mime?: string;
  size?: number; // en ko
};

// Nœuds du champ « Rich text (Blocks) » de Strapi 5.
export type CmsInline =
  | { type: "text"; text: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean }
  | { type: "link"; url: string; children: CmsInline[] };
export type CmsBlock =
  | { type: "paragraph"; children: CmsInline[] }
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; children: CmsInline[] }
  | { type: "list"; format: "ordered" | "unordered"; children: { type: "list-item"; children: CmsInline[] }[] }
  | { type: "quote"; children: CmsInline[] }
  | { type: "code"; children: CmsInline[] }
  | { type: "image"; image: CmsMedia };

export type CmsArticle = Omit<NewsItem, "body"> & { body: NewsItem["body"]; blocks?: CmsBlock[] };
export type CmsResource = { title: string; description?: string | null; url: string; ext: string; sizeKb?: number };

export function mediaUrl(media?: CmsMedia | null): string | undefined {
  if (!media?.url) return undefined;
  return /^https?:\/\//.test(media.url) ? media.url : `${CMS_PUBLIC_URL}${media.url}`;
}

async function cmsFind<T>(collection: string, query: Record<string, string>): Promise<T[] | null> {
  const url = `${CMS_INTERNAL_URL}/api/${collection}?${new URLSearchParams(query)}`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: T[] };
    return json.data && json.data.length > 0 ? json.data : null;
  } catch (error) {
    logger.warn({ err: error, collection }, "CMS indisponible, contenu de repli utilisé");
    return null;
  }
}

type StrapiArticle = {
  slug: string;
  title: string;
  excerpt?: string | null;
  category: string;
  date: string;
  cover?: CmsMedia | null;
  gallery?: CmsMedia[] | null;
  body?: CmsBlock[] | null;
};

function toArticle(a: StrapiArticle): CmsArticle {
  return {
    slug: a.slug,
    cat: a.category,
    date: a.date,
    title: a.title,
    excerpt: a.excerpt ?? "",
    tag: "",
    img: mediaUrl(a.cover) ?? "",
    body: [],
    blocks: a.body ?? [],
    gallery: (a.gallery ?? []).map(mediaUrl).filter((u): u is string => !!u),
  };
}

const ARTICLE_POPULATE = { "populate[0]": "cover", "populate[1]": "gallery" };

export async function getArticles(opts: { category?: string; limit?: number } = {}): Promise<CmsArticle[] | null> {
  const query: Record<string, string> = {
    ...ARTICLE_POPULATE,
    sort: "date:desc",
    "pagination[pageSize]": String(opts.limit ?? 100),
  };
  if (opts.category) query["filters[category][$eq]"] = opts.category;
  const data = await cmsFind<StrapiArticle>("articles", query);
  return data?.map(toArticle) ?? null;
}

export async function getArticle(slug: string): Promise<CmsArticle | null> {
  const data = await cmsFind<StrapiArticle>("articles", { ...ARTICLE_POPULATE, "filters[slug][$eq]": slug });
  return data ? toArticle(data[0]) : null;
}

export async function getFaqItems(): Promise<FaqItem[] | null> {
  const data = await cmsFind<FaqItem>("faq-items", { sort: "order:asc", "pagination[pageSize]": "100" });
  return data?.map(({ question, answer, category }) => ({ question, answer, category })) ?? null;
}

export async function getTeamMembers(): Promise<TeamItem[] | null> {
  const data = await cmsFind<Omit<TeamItem, "photo_url"> & { photo?: CmsMedia | null }>("team-members", {
    populate: "photo",
    sort: "order:asc",
    "pagination[pageSize]": "100",
  });
  return (
    data?.map((m) => ({ name: m.name, role: m.role, specialty: m.specialty, bio: m.bio, photo_url: mediaUrl(m.photo) })) ?? null
  );
}

export async function getPartners(): Promise<PartnerItem[] | null> {
  const data = await cmsFind<Omit<PartnerItem, "logo_url"> & { logo?: CmsMedia | null }>("partners", {
    populate: "logo",
    sort: "order:asc",
    "pagination[pageSize]": "100",
  });
  return (
    data?.map((p) => ({
      name: p.name,
      category: p.category,
      type: p.type ?? undefined,
      description: p.description ?? undefined,
      website_url: p.website_url ?? undefined,
      logo_url: mediaUrl(p.logo),
    })) ?? null
  );
}

export async function getResources(): Promise<CmsResource[] | null> {
  const data = await cmsFind<{ title: string; description?: string | null; file?: CmsMedia | null }>("ressources", {
    populate: "file",
    sort: "order:asc",
    "pagination[pageSize]": "100",
  });
  return (
    data
      ?.filter((r) => r.file)
      .map((r) => ({
        title: r.title,
        description: r.description,
        url: mediaUrl(r.file)!,
        ext: (r.file!.ext ?? "").replace(".", "").toUpperCase() || "DOC",
        sizeKb: r.file!.size,
      })) ?? null
  );
}

type StrapiStructure = {
  documentId: string;
  name: string;
  kind: StructureKind;
  commune: string;
  departement?: string | null;
  hote?: string | null;
  adresse?: string | null;
  repere?: string | null;
  horaires?: string | null;
  latitude: number | string;
  longitude: number | string;
};

/** Structures de la carte du réseau (la région est déduite des coordonnées GPS). */
export async function getStructures(): Promise<Structure[] | null> {
  const data = await cmsFind<StrapiStructure>("structures", { sort: "name:asc", "pagination[pageSize]": "500" });
  if (!data) return null;
  const out: Structure[] = [];
  for (const s of data) {
    const lat = Number(s.latitude);
    const lng = Number(s.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: s.documentId,
      name: s.name,
      kind: s.kind,
      region: regionOf(lng, lat),
      commune: s.commune,
      departement: s.departement || s.commune,
      hote: s.hote ?? "",
      adresse: s.adresse || undefined,
      repere: s.repere || undefined,
      horaires: s.horaires || undefined,
      lat,
      lng,
    });
  }
  return out.length ? out : null;
}

// Champs du type unique « Baromètre des stocks » → groupe sanguin, dans l'ordre d'affichage.
const STOCK_FIELDS: [string, string][] = [
  ["o_pos", "O+"], ["a_pos", "A+"], ["b_pos", "B+"], ["ab_pos", "AB+"],
  ["o_neg", "O-"], ["a_neg", "A-"], ["b_neg", "B-"], ["ab_neg", "AB-"],
];

/** Niveaux des réserves par groupe, saisis chaque semaine dans le CMS. */
export async function getStockBarometer(): Promise<StockBarometer | null> {
  const url = `${CMS_INTERNAL_URL}/api/stock-barometer`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = ((await res.json()) as { data?: Record<string, unknown> | null }).data;
    if (!d) return null;
    const crit = Number(d.seuil_critique ?? 2);
    const baisse = Number(d.seuil_baisse ?? 3.5);
    const levels = STOCK_FIELDS.map(([field, type]) => {
      const days = Number(d[field]);
      return { type, days, status: stockStatus(days, crit, baisse) };
    });
    if (levels.some((l) => !Number.isFinite(l.days))) return null;
    return {
      levels,
      updatedOn: typeof d.date_mise_a_jour === "string" ? d.date_mise_a_jour : undefined,
      message: typeof d.message === "string" && d.message.trim() ? d.message.trim() : undefined,
    };
  } catch (error) {
    logger.warn({ err: error, collection: "stock-barometer" }, "CMS indisponible, contenu de repli utilisé");
    return null;
  }
}
