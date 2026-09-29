import type { Core } from '@strapi/strapi';
import { grantPublicRead, seedOnce } from './seed';

export default {
  register() {},

  // Au démarrage : lecture publique du contenu éditorial pour le portail, puis
  // import unique du contenu initial (data/seed.json).
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await seedOnce(strapi);
  },
};
