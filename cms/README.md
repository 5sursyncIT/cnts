# CMS Strapi — contenu éditorial du portail

Strapi 5 gère le contenu éditorial du portail public (`portal/`). Il remplace le
CMS maison du Back Office : les anciens écrans Articles, FAQ, Équipe et Partenaires
ont été retirés.

| | |
|---|---|
| Administration | https://cnts.gouv.sn/cms/admin |
| API publique (lecture) | `https://cnts.gouv.sn/cms/api/<collection>` |
| Service docker | `cms` (port local `127.0.0.1:1337`) |
| Base de données | base `strapi` (rôle `strapi`) dans le conteneur Postgres `db`, séparée de la base métier `cnts` |
| Médias | volume docker `cms_uploads` → `/opt/app/public/uploads` |

## Types de contenu

| Collection (API) | Page du portail |
|---|---|
| `articles` — Article | `/actualites`, `/actualites/[slug]`, accueil ; catégorie « Communiqué » → `/presse` |
| `faq-items` — Question FAQ | `/faq` (groupées par `category`, triées par `order`) |
| `team-members` — Membre de l'équipe | `/equipe` |
| `partners` — Partenaire | `/qui-sommes-nous/partenaires` |
| `ressources` — Ressource presse | médiathèque de `/presse` |

Toutes les collections utilisent le brouillon/publication de Strapi : seul le
contenu **publié** est visible sur le portail, et il y apparaît dès la publication.
Le rôle *Public* reçoit automatiquement les droits `find`/`findOne` sur ces
collections au démarrage (`src/seed.ts`).

Le portail lit Strapi côté serveur (`portal/src/lib/cms.ts`, via
`CMS_INTERNAL_URL=http://cms:1337`). Si Strapi est arrêté ou si une collection
est vide, il affiche le contenu de repli de `portal/src/components/cnts/data.ts`.

## Contenu initial

Au premier démarrage, `src/seed.ts` importe `data/seed.json` et `data/images/`
(les articles, la FAQ, l'équipe et les partenaires qui étaient codés en dur dans
le portail), puis enregistre un drapeau pour ne jamais réimporter. Pour
régénérer ce jeu de données depuis `portal/src/components/cnts/data.ts` :

```bash
node scripts/build-seed.mjs
```

## Premier démarrage

```bash
# 1. Base et rôle Postgres (une seule fois ; les variables CMS_* sont dans ../.env)
set -a; . ../.env; set +a
docker exec -i cnts-app-db-1 psql -U "$POSTGRES_USER" -d postgres <<SQL
CREATE ROLE $CMS_DB_USER LOGIN PASSWORD '$CMS_DB_PASSWORD';
CREATE DATABASE $CMS_DB_NAME OWNER $CMS_DB_USER;
SQL

# 2. Build et démarrage (le build fige PUBLIC_URL dans le panneau d'administration)
cd .. && docker compose build cms && docker compose up -d cms

# 3. Apache (vhost cnts-app.conf), AVANT la règle « ProxyPass / » :
#      RewriteRule ^/cms/?$ /cms/admin [R=302,L]
#      ProxyPass        /cms/ http://127.0.0.1:1337/
#      ProxyPassReverse /cms/ http://127.0.0.1:1337/

# 4. Ouvrir https://cnts.gouv.sn/cms/admin : le premier compte créé est super-administrateur.
```

## Développement local

```bash
cp .env.example .env   # DATABASE_* vers un Postgres local, PUBLIC_URL vide
npm run develop        # http://localhost:1337/admin — édition des types de contenu activée
```

Le constructeur de types de contenu n'est disponible qu'en mode `develop`. En
production, on modifie les schémas dans `src/api/*/content-types/*/schema.json`,
puis on reconstruit l'image.

> Réseau du serveur : npm dépasse ses délais de connexion si l'option
> `--no-network-family-autoselection` de Node n'est pas activée (le Dockerfile la
> définit déjà). En local : `NODE_OPTIONS=--no-network-family-autoselection npm install`.
