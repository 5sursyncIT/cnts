# Déploiement Frontend

Ce dépôt contient deux applications Next.js distinctes :
- `web/` : Back Office (administration)
- `portal/` : Portail patient (vitrine + espace patient)

## Pré-requis
- Node.js 20+
- Variables d’environnement configurées par application

## Build
Depuis la racine :

```bash
npm ci --workspaces --include-workspace-root
npm -w web run build
npm -w portal run build
```

## Exécution
Chaque application est un service séparé.

```bash
npm -w web run start
npm -w portal run start
```

## Variables d’environnement (résumé)
Back Office (`web/.env.local`) :
- `BACKOFFICE_API_BASE_URL` : URL API backend (FastAPI)
- `BACKOFFICE_SESSION_SECRET` : secret de signature des sessions
- `BACKOFFICE_PREAUTH_SECRET` : secret de signature de la pré-auth MFA
- `BACKOFFICE_ADMIN_*` : compte admin de démo (dev uniquement)

Portail patient (`portal/.env.local`) :
- `PORTAL_SESSION_SECRET` : secret de signature des sessions
- `PORTAL_DEMO_PATIENT_*` : compte patient de démo (dev uniquement)

## Sécurité (production)
- Secrets gérés par un gestionnaire de secrets (jamais en clair dans le dépôt).
- Cookies en `Secure` + `HttpOnly` (sessions) et `SameSite=Lax`.
- Espace patient : consentement explicite et audit côté backend pour actions sensibles.
