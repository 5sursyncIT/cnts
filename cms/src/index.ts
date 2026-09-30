import type { Core } from '@strapi/strapi';
import { configureStockAdmin, configureStructureAdmin, grantPublicRead, seedOnce, seedStockOnce, seedStructuresOnce } from './seed';

export default {
  register() {},

  // Au démarrage : lecture publique du contenu éditorial pour le portail, puis
  // import unique du contenu initial (data/seed.json) et des structures de la carte.
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await seedOnce(strapi);
    await seedStructuresOnce(strapi);
    await configureStructureAdmin(strapi);
    await seedStockOnce(strapi);
    await configureStockAdmin(strapi);
  },
};
