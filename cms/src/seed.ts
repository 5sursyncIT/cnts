import fs from 'node:fs';
import path from 'node:path';
import type { Core, UID } from '@strapi/strapi';

// Types de contenu lisibles sans authentification par le portail public.
export const PUBLIC_CONTENT_TYPES: UID.ContentType[] = [
  'api::article.article',
  'api::faq-item.faq-item',
  'api::team-member.team-member',
  'api::partner.partner',
  'api::ressource.ressource',
];

// Donne au rôle « Public » le droit find/findOne sur le contenu éditorial.
// Idempotent : exécuté à chaque démarrage.
export async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) return;

  for (const uid of PUBLIC_CONTENT_TYPES) {
    for (const verb of ['find', 'findOne']) {
      const action = `${uid}.${verb}`;
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: role.id } });
      if (!existing) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: role.id } });
      }
    }
  }
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function uploadImage(strapi: Core.Strapi, name?: string | null) {
  if (!name) return null;
  const filepath = path.join(DATA_DIR, 'images', name);
  if (!fs.existsSync(filepath)) return null;
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name, alternativeText: '' } },
      files: {
        filepath,
        originalFilename: name,
        mimetype: MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream',
        size: fs.statSync(filepath).size,
      },
    });
  return file.id;
}

// Importe une seule fois le contenu initial (data/seed.json, généré depuis le
// portail par scripts/build-seed.mjs). Un drapeau dans le store Strapi empêche
// de réimporter si les éditeurs suppriment ensuite des entrées.
export async function seedOnce(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'core', name: 'cnts' });
  if (await store.get({ key: 'seeded' })) return;

  const seedFile = path.join(DATA_DIR, 'seed.json');
  if (!fs.existsSync(seedFile)) return;
  const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));

  strapi.log.info('[cnts] Import du contenu initial dans le CMS…');
  const publish = (uid: UID.ContentType, data: Record<string, unknown>) =>
    strapi.documents(uid).create({ data: data as never, status: 'published' });

  for (const a of seed.articles) {
    const gallery = [];
    for (const g of a.gallery) gallery.push(await uploadImage(strapi, g));
    await publish('api::article.article', {
      ...a,
      cover: await uploadImage(strapi, a.cover),
      gallery: gallery.filter(Boolean),
    });
  }
  for (const f of seed.faqItems) await publish('api::faq-item.faq-item', f);
  for (const m of seed.teamMembers) {
    await publish('api::team-member.team-member', { ...m, photo: await uploadImage(strapi, m.photo) });
  }
  for (const p of seed.partners) {
    await publish('api::partner.partner', { ...p, logo: await uploadImage(strapi, p.logo) });
  }

  await store.set({ key: 'seeded', value: new Date().toISOString() });
  strapi.log.info('[cnts] Contenu initial importé.');
}
