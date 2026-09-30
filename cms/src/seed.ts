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
  'api::structure.structure',
];

// Types uniques (single types) : seule l'action `find` existe.
export const PUBLIC_SINGLE_TYPES: UID.ContentType[] = ['api::stock-barometer.stock-barometer'];

// Donne au rôle « Public » le droit find/findOne sur le contenu éditorial.
// Idempotent : exécuté à chaque démarrage.
export async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!role) return;

  const actions = [
    ...PUBLIC_CONTENT_TYPES.flatMap((uid) => [`${uid}.find`, `${uid}.findOne`]),
    ...PUBLIC_SINGLE_TYPES.map((uid) => `${uid}.find`),
  ];
  for (const action of actions) {
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

// Importe une seule fois les structures de la carte du réseau (data/structures.json,
// généré par scripts/import_structures.py depuis la cartographie Excel de la Direction).
// Drapeau distinct de `seeded` : le contenu éditorial est déjà importé en production.
export async function seedStructuresOnce(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'core', name: 'cnts' });
  if (await store.get({ key: 'seeded-structures' })) return;

  const file = path.join(DATA_DIR, 'structures.json');
  if (!fs.existsSync(file)) return;
  const structures = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>[];

  strapi.log.info(`[cnts] Import de ${structures.length} structures de la carte…`);
  for (const s of structures) {
    await strapi.documents('api::structure.structure').create({ data: s as never, status: 'published' });
  }
  await store.set({ key: 'seeded-structures', value: new Date().toISOString() });
  strapi.log.info('[cnts] Structures importées.');
}

// Libellés français et aide à la saisie dans le formulaire « Structure » du panneau
// d'administration. Appliqué une fois (drapeau versionné) pour ne pas écraser les
// réglages de mise en page faits ensuite depuis l'interface.
const STRUCTURE_FIELDS: Record<string, { label: string; description?: string; placeholder?: string }> = {
  name: { label: 'Nom de la structure', placeholder: 'Ex. CRTS de Louga' },
  kind: {
    label: 'Type',
    description:
      'siege = siège national · crts = centre régional (CRTS) · banque = banque de sang · pts = poste de transfusion · depot = dépôt de sang',
  },
  commune: { label: 'Commune' },
  departement: { label: 'Département' },
  hote: { label: 'Établissement hôte', placeholder: 'Hôpital, Centre de santé…' },
  adresse: { label: 'Adresse / quartier' },
  repere: { label: 'Point de repère' },
  horaires: {
    label: 'Horaires d’accueil des donneurs',
    description: 'Affichés sur la page Collectes pour le siège et les CRTS. Vide : « renseignez-vous auprès du CNTS ».',
  },
  latitude: {
    label: 'Latitude (GPS)',
    description: 'En degrés décimaux, entre 12 et 17 (ex. 15.660078). La région est déduite automatiquement.',
  },
  longitude: {
    label: 'Longitude (GPS)',
    description: 'En degrés décimaux, négative, entre -18 et -11 (ex. -13.263137). Astuce : clic droit sur Google Maps pour copier les coordonnées.',
  },
};

type FieldMeta = { label: string; description?: string; placeholder?: string };
const row = (...fields: [string, number][]) => fields.map(([name, size]) => ({ name, size }));

// Applique libellés, aides et mise en page d'un type de contenu dans le panneau
// d'administration, une seule fois par drapeau.
async function configureAdmin(
  strapi: Core.Strapi,
  uid: UID.ContentType,
  flag: string,
  fields: Record<string, FieldMeta>,
  layouts: { edit: { name: string; size: number }[][]; list?: string[] },
  settings: Record<string, unknown> = {},
) {
  const store = strapi.store({ type: 'core', name: 'cnts' });
  if (await store.get({ key: flag })) return;

  const service = strapi.plugin('content-manager').service('content-types');
  const contentType = strapi.contentTypes[uid];
  if (!contentType) return;
  const conf = await service.findConfiguration(contentType);

  const metadatas = { ...conf.metadatas };
  for (const [field, meta] of Object.entries(fields)) {
    const current = metadatas[field] ?? { edit: {}, list: {} };
    metadatas[field] = {
      edit: { ...current.edit, label: meta.label, description: meta.description ?? '', placeholder: meta.placeholder ?? '' },
      list: { ...current.list, label: meta.label },
    };
  }
  await service.updateConfiguration(contentType, {
    settings: { ...conf.settings, ...settings },
    metadatas,
    layouts: { ...conf.layouts, ...layouts },
  });
  await store.set({ key: flag, value: new Date().toISOString() });
}

export async function configureStructureAdmin(strapi: Core.Strapi) {
  await configureAdmin(
    strapi,
    'api::structure.structure',
    'structure-admin-config-v1',
    STRUCTURE_FIELDS,
    {
      list: ['name', 'kind', 'commune', 'departement'],
      edit: [
        row(['name', 12]),
        row(['kind', 6], ['hote', 6]),
        row(['commune', 6], ['departement', 6]),
        row(['adresse', 6], ['repere', 6]),
        row(['horaires', 12]),
        row(['latitude', 6], ['longitude', 6]),
      ],
    },
    { mainField: 'name', defaultSortBy: 'name', defaultSortOrder: 'ASC', pageSize: 50 },
  );
}

// --- Baromètre des stocks (page d'accueil) --------------------------------------------

const GROUPS: [string, string][] = [
  ['o_pos', 'O+'], ['a_pos', 'A+'], ['b_pos', 'B+'], ['ab_pos', 'AB+'],
  ['o_neg', 'O-'], ['a_neg', 'A-'], ['b_neg', 'B-'], ['ab_neg', 'AB-'],
];

const STOCK_FIELDS: Record<string, FieldMeta> = {
  date_mise_a_jour: { label: 'Date de mise à jour', description: 'Affichée sur la page d’accueil (« Mis à jour le … »).' },
  ...Object.fromEntries(
    GROUPS.map(([k, g]) => [k, { label: `${g} — jours de réserve`, placeholder: 'Ex. 4.5' }]),
  ),
  seuil_critique: {
    label: 'Seuil « Critique » (jours)',
    description: 'En dessous de ce nombre de jours, le groupe est affiché « Critique ».',
  },
  seuil_baisse: {
    label: 'Seuil « En baisse » (jours)',
    description: 'En dessous de ce nombre de jours (et au-dessus du seuil critique), le groupe est « En baisse ».',
  },
  message: {
    label: 'Message (facultatif)',
    description: 'Court message affiché sous le baromètre, ex. « Appel urgent aux donneurs O- ».',
  },
};

export async function configureStockAdmin(strapi: Core.Strapi) {
  await configureAdmin(strapi, 'api::stock-barometer.stock-barometer', 'stock-admin-config-v1', STOCK_FIELDS, {
    edit: [
      row(['date_mise_a_jour', 6]),
      row(['o_pos', 3], ['a_pos', 3], ['b_pos', 3], ['ab_pos', 3]),
      row(['o_neg', 3], ['a_neg', 3], ['b_neg', 3], ['ab_neg', 3]),
      row(['seuil_critique', 6], ['seuil_baisse', 6]),
      row(['message', 12]),
    ],
  }, { mainField: 'id' });
}

// Valeurs initiales = celles affichées jusqu'ici sur le portail (à remplacer par les
// niveaux réels dès la mise en service). Une seule fois.
export async function seedStockOnce(strapi: Core.Strapi) {
  const store = strapi.store({ type: 'core', name: 'cnts' });
  if (await store.get({ key: 'seeded-stock' })) return;
  const uid = 'api::stock-barometer.stock-barometer';
  if (!(await strapi.documents(uid).findFirst())) {
    await strapi.documents(uid).create({
      data: {
        date_mise_a_jour: new Date().toISOString().slice(0, 10),
        o_pos: 5.2, a_pos: 3.1, b_pos: 4.0, ab_pos: 6.8,
        o_neg: 1.1, a_neg: 2.0, b_neg: 1.6, ab_neg: 5.0,
        seuil_critique: 2, seuil_baisse: 3.5,
      } as never,
    });
    strapi.log.info('[cnts] Baromètre des stocks initialisé.');
  }
  await store.set({ key: 'seeded-stock', value: new Date().toISOString() });
}
