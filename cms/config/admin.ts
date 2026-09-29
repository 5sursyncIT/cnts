import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
    // Derrière Apache, l'admin est servi sous /cms/admin : le cookie de session
    // doit porter ce chemin, sinon le navigateur ne le renvoie pas (401 sur
    // /admin/access-token). Figé dans le panneau au build.
    cookie: {
      path: `${new URL(env('PUBLIC_URL', '') || 'http://localhost').pathname.replace(/\/$/, '')}/admin`,
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  flags: {
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
