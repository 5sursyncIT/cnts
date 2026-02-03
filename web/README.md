# Back Office (Next.js) — SGI-CNTS

Interface d’administration sécurisée (personnel CNTS + établissements), avec socle :
- Authentification + MFA (TOTP)
- Sessions en cookie httpOnly
- RBAC (lecture/écriture/suppression/validation par module)
- Journal d’audit (socle local côté app)

## Démarrer
Pré-requis : Node.js 20+.

Depuis la racine :

```bash
npm install --workspaces --include-workspace-root
npm -w web run dev
```

URL : http://localhost:3000

## Variables d’environnement (dev)
Créer `web/.env.local` :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BACKOFFICE_API_BASE_URL=http://localhost:8000
BACKOFFICE_SESSION_SECRET=change-me
BACKOFFICE_PREAUTH_SECRET=change-me
BACKOFFICE_ADMIN_EMAIL=admin@cnts.local
BACKOFFICE_ADMIN_PASSWORD=admin
BACKOFFICE_ADMIN_ROLES=admin
BACKOFFICE_ADMIN_TOTP_SECRET=
```

Activer la MFA : renseigner `BACKOFFICE_ADMIN_TOTP_SECRET` (secret TOTP).

### Générer un secret + code (dev)
Depuis la racine :

```bash
npm run mfa:backoffice
```

Pour afficher le code directement sur la page `/mfa` (dev uniquement) :

```bash
BACKOFFICE_SHOW_MFA_CODE=1
```

## Proxy API (anti-CORS)
Les appels navigateur peuvent passer par `/api/backend/*` (proxy Next.js) vers `BACKOFFICE_API_BASE_URL`.
