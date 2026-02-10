# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Apercu du Projet

**SGI-CNTS** : Systeme de gestion de la transfusion sanguine pour le Centre National de Transfusion Sanguine (CNTS) de Dakar, Senegal. Tracabilite complete "de la veine du donneur a la veine du receveur" selon les normes ISBT 128.

**Architecture** : Monolithe modulaire FastAPI + PostgreSQL + Celery/Redis, avec un monorepo npm workspaces contenant un Back Office Next.js, un Portail Patient Next.js, une app mobile React Native (Expo), et des packages TypeScript partages (@cnts/api, @cnts/rbac, @cnts/monitoring).

## Commandes de Developpement

### Demarrage rapide avec Docker
```bash
cp .env.example .env
docker compose up --build    # lance: db, api, redis, celery-worker, celery-beat
curl http://localhost:8000/api/health
```

### Backend (sans Docker)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -U pip && pip install -e ".[dev]"
pip install email-validator python-multipart  # souvent manquants
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm install --workspaces --include-workspace-root
npm -w web run dev       # Back Office → http://localhost:3000
npm -w portal run dev    # Portail Patient → http://localhost:3001
```

Creer `web/.env.local` :
```
NEXT_PUBLIC_API_BASE_URL=/api/backend
BACKOFFICE_API_BASE_URL=http://localhost:8000/api
BACKOFFICE_SESSION_SECRET=change-me-in-production
BACKOFFICE_ADMIN_EMAIL=admin@cnts.local
BACKOFFICE_ADMIN_PASSWORD=admin
BACKOFFICE_ADMIN_ROLES=admin
```

Creer `portal/.env.local` :
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
PORTAL_SESSION_SECRET=change-me-in-production
PORTAL_DEMO_PATIENT_EMAIL=patient@cnts.local
PORTAL_DEMO_PATIENT_PASSWORD=patient
```

### Tests et Linting
```bash
# Backend (depuis backend/)
pytest                                      # tous les tests
pytest tests/test_liberation.py             # un fichier
pytest -v -k test_name                      # un test precis
ruff check . && ruff format .               # lint + formatage (line-length 100, target py311)

# Frontend (depuis la racine)
npm run test                                # tous les workspaces
npm -w web run test                         # un workspace specifique
npm -w @cnts/api run test                   # un package partage
npm run lint
```

### Scripts npm racine
```bash
npm run dev:web          # alias npm -w web run dev
npm run dev:portal       # alias npm -w portal run dev
npm run test:coverage    # couverture tous workspaces (seuil 80%)
```

### Migrations
```bash
cd backend
alembic upgrade head                              # appliquer
alembic revision --autogenerate -m "description"  # creer
alembic downgrade -1                              # annuler
```

## Architecture

```
.
├── backend/           # FastAPI + PostgreSQL + Celery (Python 3.11+)
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py        # Auth deps (get_current_user, require_auth_in_production)
│   │   │   ├── router.py      # Agregation des 49 modules de routes
│   │   │   └── routes/        # Endpoints par domaine (49 fichiers)
│   │   ├── audit/events.py    # log_event() pour la piste d'audit
│   │   ├── core/              # Logique metier et utilitaires
│   │   │   ├── config.py      # pydantic-settings, prefixe CNTS_
│   │   │   ├── celery_app.py  # Celery + Redis pour taches asynchrones
│   │   │   ├── din.py         # Generation DIN (ISBT 128)
│   │   │   ├── security.py    # Hachage CNI (HMAC-SHA256)
│   │   │   ├── passwords.py   # Hachage mots de passe (PBKDF2-SHA256)
│   │   │   ├── tokens.py      # JWT
│   │   │   ├── totp.py        # MFA TOTP
│   │   │   ├── idempotency.py # Idempotence synchro mobile
│   │   │   ├── rate_limit.py  # Fenetre glissante par IP
│   │   │   └── isbt128/       # Checksum ISBT 128
│   │   ├── db/models.py       # 67 modeles SQLAlchemy 2.0 (mapped_column, UUID PKs)
│   │   ├── schemas/           # DTOs Pydantic v2 ({Entity}Create/Update/Out)
│   │   └── tasks/             # Taches Celery asynchrones
│   ├── alembic/               # Migrations
│   └── tests/                 # pytest + SQLite en memoire
├── web/               # Back Office (Next.js 16 + React 19, App Router)
├── portal/            # Portail Patient (Next.js 16 + React 19, App Router)
├── mobile/            # App collecte (React Native / Expo, offline-first)
└── packages/
    ├── api/           # @cnts/api - Client API type-safe + hooks React
    ├── rbac/          # @cnts/rbac - Roles/permissions
    └── monitoring/    # @cnts/monitoring - Metriques et erreurs
```

### Backend

Toutes les routes API prefixees par `/api` (configure dans `app/main.py`).

Middleware stack (ordre important) : CORS → ObservabilityMiddleware → RateLimitMiddleware.

**49 modules de routes** organises par domaine fonctionnel :
- **Core** : `health`, `auth`, `admin_auth`, `users`, `metrics`, `monitoring`, `parametrage`, `upload`, `sync`, `trace`, `content`
- **Donneurs/Dons** : `donneurs`, `dons`, `poches`, `etiquetage`, `analyses`, `liberation`, `crossmatch`
- **Distribution** : `commandes`, `stock`, `receveurs`, `hopitaux`, `hemovigilance`, `analytics`
- **Phase 1 (Infra)** : `notifications`, `sites`
- **Phase 2 (Biologie avancee)** : `phenotypage`, `rai`, `nat`, `reactions_donneur`, `culm`, `suivi_transfusion`, `eir`, `apherese`
- **Phase 3 (Logistique)** : `collectes`, `prevision`, `transport`
- **Phase 4 (Qualite)** : `qualite`, `equipements`, `formations`
- **Phase 5 (Interoperabilite)** : `automates`, `fhir`, `dhis2`
- **Phase 6 (Finance/Fidelisation)** : `facturation`, `consommables`, `fidelisation`

Voir `app/api/routes/patient.py` pour le pattern de route patient (portail).

**Important** : Le hachage des mots de passe est dans `app.core.passwords` (`hash_password`, `verify_password`), distinct du hachage CNI dans `app.core.security` (`hash_cni`).

### Frontend

Le Back Office utilise le proxy `/api/backend/*` → `http://127.0.0.1:8000/api/*` (configure dans `web/next.config.ts`). Le Portail appelle l'API directement (pas de proxy).

Les deux apps : App Router, Server Components par defaut, cookies de session httpOnly (jose JWT), Tailwind CSS 4, Vitest + happy-dom, React Hook Form + Zod.

**Back Office (`web/`)** : Route group `(bo)` pour les pages authentifiees. Sections : dashboard, donneurs, dons, laboratoire, stock, distribution, hemovigilance, analytics, audit, cms, admin, monitoring, parametrage, collectes, facturation, qualite, fidelisation. Auth : `/login`, `/mfa`.

**Portail Patient (`portal/`)** : Pages publiques (actualites, FAQ, services) + espace patient (`/espace-patient`). Route group `(app)` pour les pages patient. Playwright pour les tests e2e.

### Mobile (`mobile/`)

App React Native (Expo) offline-first pour la collecte terrain. Stack : expo-router, expo-sqlite, expo-secure-store, zustand. Fonctionnalites : gestion donneurs/dons, carte donneur digitale avec QR code, systeme de points/fidelite (Bronze/Silver/Gold/Platinum), synchronisation push/pull avec le backend.

### Pattern Hooks @cnts/api

Les hooks dans `packages/api/src/hooks.ts` utilisent un pattern custom `useQuery`/`useMutation` (pas React Query) :

```typescript
export function useMyData(api: ApiClient, params?: Params) {
  return useQuery(["my-key", JSON.stringify(params)], () => api.myModule.list(params));
}
export function useCreateMyData(api: ApiClient) {
  return useMutation((data: T.MyDataCreate) => api.myModule.create(data));
}
```

**Critique** : Les dependances du `useEffect` doivent utiliser `queryKey.join(",")`, et NON `queryFn` directement (empeche les boucles de re-rendu infinies).

### @cnts/rbac

4 roles : `admin`, `biologiste`, `technicien_labo`, `agent_distribution`. API : `hasPermission(user, permission)`, `rightsByModule(user)`. Actions : `read`, `write`, `delete`, `validate`.

## Modeles du Domaine

67 modeles SQLAlchemy dans `app/db/models.py`. Les principaux :

**Donneur** → identifie par `cni_hash` (HMAC-SHA256). Eligibilite : hommes 60j, femmes 120j entre dons.

**Don** → `din` unique (ISBT 128). Machine a etats : `statut_qualification` EN_ATTENTE → LIBERE.

**Poche** → produits : ST, CGR, PFC, CP. Deux machines a etats :
- `statut_stock` : EN_STOCK → FRACTIONNEE
- `statut_distribution` : NON_DISTRIBUABLE → DISPONIBLE → RESERVE → DISTRIBUE
- Indexe par `(type_produit, date_peremption)` pour le FEFO.

**Analyse** → 6 tests requis : ABO, RH, VIH, VHB, VHC, SYPHILIS. Resultats : POSITIF/NEGATIF/EN_ATTENTE.

**Commande** → Machine a etats : BROUILLON → VALIDEE → SERVIE (ou ANNULEE). Allocation FEFO.

**Modeles Phases 1-6** (selection) :
- `Site`, `TransfertInterSite`, `Notification` (multi-sites, notifications)
- `Phenotypage`, `RAI`, `TestNAT`, `CULM`, `EIR`, `ProcedureApherese` (biologie)
- `CampagneCollecte`, `PrevisionStock`, `Livraison` (logistique)
- `DocumentQualite`, `NonConformite`, `CAPA`, `AuditInterne` (SMQ)
- `Equipement`, `Formation`, `Habilitation` (maintenance/RH)
- `InterfaceAutomate`, `MessageAutomate`, `DHIS2Export` (interop)
- `Tarif`, `Facture`, `LigneFacture`, `Paiement` (facturation FCFA)
- `Consommable`, `LotConsommable`, `MouvementConsommable` (stock consommables)
- `CarteDonneur`, `PointsHistorique`, `CampagneRecrutement` (fidelisation)

## Architecture de Securite

### Authentification (`app/api/deps.py`)
- **`get_current_user`** : Auth via OAuth2 Bearer ou `X-API-Key`. Retourne `UserAccount` ou 401.
- **`require_auth_in_production`** : Sur tous les endpoints d'ecriture. Auth obligatoire en prod/staging, anonyme en dev :
  ```python
  @router.post("/resource")
  def create_resource(
      payload: ResourceCreate,
      db: Session = Depends(get_db),
      _user: UserAccount | None = Depends(require_auth_in_production),
  ) -> Resource:
  ```

### Rate Limiting
Fenetre glissante par IP, desactive en dev. Limites : auth 10/min, admin 30/min, ecriture 60/min, lecture 100/min.

### Hachage CNI (`app/core/security.py`)
CNI normalise (alphanumerique majuscule) puis hache HMAC. Jamais stocke en clair.

### Secrets en production (`app/core/config.py`)
`@model_validator` leve `ValueError` si secrets par defaut utilises en prod/staging.

## Regles Metier Critiques

1. **Liberation biologique** : `Poche` ne devient `DISPONIBLE` que si les 6 `Analyse` sont `NEGATIF` et `Don.statut_qualification` est `LIBERE`.
2. **Eligibilite donneur** : Hommes >= 60j, Femmes >= 120j depuis dernier don.
3. **Anonymisation** : Etiquettes de poches : DIN, groupe sanguin, type produit, date peremption. Jamais nom/CNI.
4. **Fractionnement** : ST uniquement → composants. Source EN_STOCK. Volume <= source + surcote max (250ml).
5. **Piste d'audit** : Tout changement d'etat DOIT appeler `log_event()`.

## Patterns de Developpement

### Gestion des erreurs
`HTTPException` : 404 (non trouve), 409 (violation regle metier), 422 (donnees invalides). Messages en francais.

### Journalisation d'audit
```python
from app.audit.events import log_event
log_event(db, aggregate_type="poche", aggregate_id=poche.id,
          event_type="poche.fractionnee", payload={...})
```

### Idempotence
Endpoints synchro mobile : `idempotency_key` dans le body. Fonctions : `get_idempotent_response()`, `store_idempotent_response()`.

### Pagination
Tous les endpoints de liste DOIVENT supporter `offset`/`limit`.

### Tests
Backend : pytest + SQLite en memoire. Fixtures dans `tests/conftest.py` : `client` (TestClient), `db_session` (ORM), `donneur_id`, `don_id`, `don_libere`. Fixtures creent les entites via endpoints API (tests d'integration). Frontend : Vitest + happy-dom (seuil couverture 80%).

### Conventions de nommage
- Python : snake_case (fichiers, fonctions, variables)
- TypeScript : camelCase (variables, fonctions), PascalCase (types, composants)
- Schemas Pydantic : `{Entity}Create`, `{Entity}Update`, `{Entity}Out`
- Routes API : minuscules avec tirets (`/cold-chain/storages`)
- Base de donnees : snake_case, UUIDs pour les PKs (sauf ProductRule : string PK)
- JSONB columns avec fallback JSON pour compatibilite SQLite en test

### Observabilite
Request ID (`X-Request-ID`), W3C Trace Context, metriques Prometheus via `app/core/metrics.py`. Routes : `/observability/metrics`, `/observability/trace/events`.

## Configuration

Variables d'environnement backend (prefixees `CNTS_`) :
- `CNTS_DATABASE_URL` : PostgreSQL (`postgresql+psycopg://...`)
- `CNTS_ENV` : dev/staging/prod
- `CNTS_CNI_HASH_KEY` : Secret HMAC hachage CNI
- `CNTS_AUTH_TOKEN_SECRET` : Secret JWT
- `CNTS_RECOVERY_CODES_SECRET` : Secret codes MFA
- `CNTS_ADMIN_TOKEN` : Token auth admin
- `CNTS_DIN_SITE_CODE` : Code site pour DIN (defaut "CNTS")
- `CNTS_REDIS_URL` : URL Redis pour Celery (defaut `redis://localhost:6379/0`)
- `CNTS_SMTP_HOST/PORT/USER/PASSWORD` : Email notifications
- `CNTS_SMS_API_KEY/URL` : SMS notifications
- `CNTS_WHATSAPP_API_TOKEN/PHONE_ID` : WhatsApp notifications
- `CNTS_CORS_ORIGINS` : Origines CORS autorisees
- `CNTS_RATE_LIMIT_ENABLED` : Activer le rate limiting

## Problemes Connus

- `tests/api/routes/test_patient.py` : import casse (`get_password_hash` au lieu de `passwords.hash_password`) et utilise fixture `db` au lieu de `db_session`.
- 8 tests echouent (pre-existant) : 404 sur routes `/api/` dans le client de test (prefix mismatch).
- 18 erreurs de tests (pre-existant) : problemes de fixtures et imports.
