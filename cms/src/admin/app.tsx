import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    // Panneau d'administration proposé en français (choix dans le profil de l'éditeur).
    locales: ['fr'],
    translations: {
      fr: {
        'Auth.form.welcome.title': 'CMS du CNTS',
        'Auth.form.welcome.subtitle': 'Connectez-vous pour gérer le contenu du portail',
      },
    },
  },
  bootstrap(_app: StrapiApp) {},
};
