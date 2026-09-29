// Génère data/seed.json (+ copie des images dans data/images/) à partir du
// contenu statique du portail (portal/src/components/cnts/data.ts).
// Ce jeu de données initial est importé une seule fois par src/seed.ts au
// premier démarrage de Strapi.
//
//   node scripts/build-seed.mjs
import { createJiti } from "../../node_modules/jiti/lib/jiti.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cmsDir = path.resolve(here, "..");
const portalDir = path.resolve(cmsDir, "../portal");
const outImages = path.join(cmsDir, "data/images");

const jiti = createJiti(import.meta.url);
const data = await jiti.import(path.join(portalDir, "src/components/cnts/data.ts"));

fs.rmSync(outImages, { recursive: true, force: true });
fs.mkdirSync(outImages, { recursive: true });

// Copie une image de portal/public et renvoie son nom dans data/images/.
function image(src) {
  if (!src || !src.startsWith("/images/")) return undefined;
  const from = path.join(portalDir, "public", src);
  if (!fs.existsSync(from)) return undefined;
  const name = src.slice("/images/".length).replaceAll("/", "__");
  fs.copyFileSync(from, path.join(outImages, name));
  return name;
}

const text = (t) => [{ type: "text", text: t }];

// Corps « legacy » ({h, p[], list[], quote}) → blocs Rich text de Strapi 5.
function toBlocks(body) {
  const blocks = [];
  for (const s of body) {
    if (s.h) blocks.push({ type: "heading", level: 2, children: text(s.h) });
    for (const p of s.p ?? []) blocks.push({ type: "paragraph", children: text(p) });
    if (s.list) {
      blocks.push({
        type: "list",
        format: "unordered",
        children: s.list.map((li) => ({ type: "list-item", children: text(li) })),
      });
    }
    if (s.quote) {
      blocks.push({ type: "quote", children: text(`« ${s.quote.text} »${s.quote.by ? ` — ${s.quote.by}` : ""}`) });
    }
  }
  return blocks;
}

const seed = {
  articles: data.news.map((n) => ({
    title: n.title,
    slug: n.slug,
    category: n.cat,
    date: n.date,
    excerpt: n.excerpt,
    cover: image(n.img),
    gallery: (n.gallery ?? []).map(image).filter(Boolean),
    body: toBlocks(n.body),
  })),
  faqItems: data.faq.map((f, i) => ({ ...f, order: i })),
  teamMembers: data.equipe.map((m, i) => ({
    name: m.name,
    role: m.role,
    specialty: m.specialty ?? null,
    bio: m.bio ?? null,
    photo: image(m.photo_url),
    order: i,
  })),
  partners: data.partenaires.map((p, i) => ({
    name: p.name,
    category: p.category,
    type: p.type ?? null,
    description: p.description ?? null,
    website_url: p.website_url ?? null,
    logo: image(p.logo_url),
    order: i,
  })),
};

fs.writeFileSync(path.join(cmsDir, "data/seed.json"), JSON.stringify(seed, null, 2) + "\n");
console.log(
  `seed.json : ${seed.articles.length} articles, ${seed.faqItems.length} FAQ, ` +
    `${seed.teamMembers.length} membres, ${seed.partners.length} partenaires, ` +
    `${fs.readdirSync(outImages).length} images`
);
