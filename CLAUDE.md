# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Apercu du Projet

**SGI-CNTS** : Systeme de gestion de la transfusion sanguine pour le Centre National de Transfusion Sanguine (CNTS) de Dakar, Senegal. Assure la tracabilite complete "de la veine du donneur a la veine du receveur" selon les normes ISBT 128.

**Architecture** : Monolithe modulaire FastAPI + PostgreSQL, avec un monorepo npm workspaces contenant un Back Office Next.js (interface admin avec MFA/RBAC), un Portail Patient Next.js (site public + espace patient securise), et des packages TypeScript partages (@cnts/api, @cnts/rbac, @cnts/monitoring).

## Commandes de Developpement

### Demarrage rapide avec Docker
```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/api/health
```

### Backend
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
# Backend
cd backend && pytest                        # tous les tests
pytest tests/test_liberation.py             # un fichier
pytest -v -k test_name                      # un test precis
ruff check . && ruff format .               # lint + formatage

# Frontend (depuis la racine du projet)
npm run test                                # tous les workspaces
npm -w web run test                         # un workspace specifique
npm -w @cnts/api run test                   # un package partage
npm run lint
```

### Migrations de Base de Donnees
```bash
cd backend
alembic upgrade head                              # appliquer
alembic revision --autogenerate -m "description"  # creer
alembic downgrade -1                              # annuler
```

## Architecture

```
.
├── backend/           # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py        # Dependances auth (get_current_user, require_auth_in_production)
│   │   │   ├── router.py      # Agregation des routes
│   │   │   └── routes/        # Modules endpoints par domaine
│   │   ├── audit/events.py    # log_event() pour la piste d'audit
│   │   ├── core/              # Logique metier (din.py, security.py, idempotency.py, rate_limit.py)
│   │   ├── db/models.py       # Modeles SQLAlchemy
│   │   └── schemas/           # DTOs Pydantic
│   ├── alembic/               # Migrations
│   └── tests/
├── web/               # Back Office (Next.js 16 + React 19, App Router)
├── portal/            # Portail Patient (Next.js 16 + React 19, App Router)
└── packages/
    ├── api/           # @cnts/api - Client API type-safe + hooks React
    ├── rbac/          # @cnts/rbac - Controle d'acces base sur les roles
    └── monitoring/    # @cnts/monitoring - Metriques et rapport d'erreurs
```

### Backend : Toutes les routes API sont prefixees par `/api` (configure dans `app/main.py`).

### Frontend : Le Back Office utilise le proxy `/api/backend/*` pour eviter les problemes CORS. Les deux apps utilisent App Router, Server Components par defaut, cookies de session httpOnly, Tailwind CSS 4 et Vitest pour les tests.

### Pattern Hooks @cnts/api

Les hooks dans [packages/api/src/hooks.ts](packages/api/src/hooks.ts) utilisent un pattern custom `useQuery`/`useMutation` (pas React Query) :

```typescript
// Hook de requete
export function useMyData(api: ApiClient, params?: Params) {
  return useQuery(["my-key", JSON.stringify(params)], () => api.myModule.list(params));
}

// Hook de mutation
export function useCreateMyData(api: ApiClient) {
  return useMutation((data: T.MyDataCreate) => api.myModule.create(data));
}
```

**Critique** : Les dependances du `useEffect` doivent utiliser `queryKey.join(",")`, et NON `queryFn` directement (empeche les boucles de re-rendu infinies).

## Modeles du Domaine

**Donneur** → identifie par `cni_hash` (HMAC-SHA256, le CNI n'est jamais stocke en clair). Eligibilite : hommes 60 jours, femmes 120 jours entre les dons.

**Don** → `din` unique (format ISBT 128 : `{SITE_CODE}{AA}{JJJ}{NNNNNN}`). Machine a etats : `statut_qualification` EN_ATTENTE → LIBERE.

**Poche** (Poche de sang) → produits : ST, CGR, PFC, CP. Deux machines a etats paralleles :
- `statut_stock` : EN_STOCK → FRACTIONNEE
- `statut_distribution` : NON_DISTRIBUABLE → DISPONIBLE → RESERVE → DISTRIBUE
- `source_poche_id` trace la chaine de fractionnement. Indexe par `(type_produit, date_peremption)` pour le FEFO.

**Analyse** → 6 tests requis : ABO, RH, VIH, VHB, VHC, SYPHILIS. Resultats : POSITIF/NEGATIF/EN_ATTENTE.

**Commande** → commandes hospitalieres. Machine a etats : BROUILLON → VALIDEE → SERVIE (ou ANNULEE). Allocation FEFO avec reservations a duree limitee (defaut 24h).

**ProductRule** → duree de conservation et contraintes de volume par type de produit. **FractionnementRecette** → recettes predefinies pour fractionner le ST en composants.

## Architecture de Securite

### Authentification (`app/api/deps.py`)
- **`get_current_user`** : Auth stricte via token OAuth2 Bearer. Retourne `UserAccount` ou leve 401.
- **`require_auth_in_production`** : Utilise sur tous les endpoints d'ecriture. Exige l'auth en prod/staging, autorise l'acces anonyme en dev. A ajouter sur les nouveaux endpoints d'ecriture :
  ```python
  from app.api.deps import require_auth_in_production
  from app.db.models import UserAccount

  @router.post("/resource")
  def create_resource(
      payload: ResourceCreate,
      db: Session = Depends(get_db),
      _user: UserAccount | None = Depends(require_auth_in_production),
  ) -> Resource:
  ```

### Rate Limiting (`app/core/rate_limit.py`)
Fenetre glissante par IP, desactive en dev. Limites : auth 10/min, admin 30/min, ecriture 60/min, lecture 100/min.

### CORS (`app/main.py`)
Methodes et en-tetes restreints (pas `*`). En-tetes de securite ajoutes via middleware : `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`.

### Hachage du CNI (`app/core/security.py`)
Le CNI du donneur est hache par HMAC, normalise (alphanumerique majuscule) avant hachage. Le CNI original n'est jamais stocke.

### Validation des secrets en production (`app/core/config.py`)
`@model_validator` leve `ValueError` si des secrets par defaut non securises sont utilises en prod/staging.

## Regles Metier Critiques

1. **Porte de liberation biologique** : Une `Poche` NE DOIT PAS devenir `DISPONIBLE` sauf si les 6 resultats d'`Analyse` sont `NEGATIF` et `Don.statut_qualification` est `LIBERE`.

2. **Eligibilite du donneur** : Hommes ≥ 60 jours depuis le dernier don, Femmes ≥ 120 jours.

3. **Anonymisation** : Les etiquettes de poches contiennent UNIQUEMENT : DIN, groupe sanguin, type de produit, date de peremption. Jamais le nom ou le CNI du donneur.

4. **Fractionnement** : Seul le ST → composants. La source doit etre EN_STOCK. Volume total ≤ source + surcote max (defaut 250ml). Peremption = date_don + product_rule.shelf_life_days.

5. **Piste d'audit** : Toutes les operations modifiant l'etat DOIVENT appeler `log_event()` pour la conformite reglementaire.

## Patterns de Developpement

### Gestion des erreurs
Utiliser `HTTPException` avec : 404 (non trouve), 409 (violation regle metier), 422 (donnees invalides). Messages d'erreur en francais.

### Journalisation d'audit
```python
from app.audit.events import log_event
log_event(db, aggregate_type="poche", aggregate_id=poche.id,
          event_type="poche.fractionnee", payload={...})
```

### Idempotence
Les endpoints d'ecriture supportant la synchro mobile acceptent `idempotency_key` dans le body. Utilise dans : `/dons`, `/stock/fractionnements`.

### Pagination
Tous les endpoints de liste DOIVENT supporter les parametres `offset`/`limit`.

### Tests
Le backend utilise pytest avec SQLite en memoire. Fichiers de tests dans `backend/tests/`. Le frontend utilise Vitest + happy-dom.

### RBAC (Back Office)
4 roles : admin, biologiste, technicien_labo, agent_distribution. Utiliser `@cnts/rbac` pour les verifications de permissions. Sessions via cookies httpOnly + MFA (TOTP via otplib).

## Configuration

Variables d'environnement backend (prefixees `CNTS_`) :
- `CNTS_DATABASE_URL` : Connexion PostgreSQL (`postgresql+psycopg://...`)
- `CNTS_CNI_HASH_KEY` : Secret HMAC pour le hachage des CNI
- `CNTS_DIN_SITE_CODE` : Identifiant du site pour la generation DIN (defaut : "CNTS")
- `CNTS_FRACTIONNEMENT_MAX_OVERAGE_ML` : Surcote de volume max (defaut : 250ml)
- `CNTS_ENV` : dev/staging/prod
- `CNTS_LOG_LEVEL` : INFO/DEBUG/WARNING/ERROR

Voir [.env.example](.env.example) pour la liste complete.

## Problemes Connus

- `stock.py` a des definitions de routes en double pour `GET /regles` et `PUT /regles/{type_produit}` (lignes ~146-200 et ~258-294). Le second jeu utilise des schemas Pydantic, le premier utilise un `dict` brut.
- `tests/api/routes/test_patient.py` a un import casse (`get_password_hash` depuis `app.core.security`).
- Certains echecs de tests sont dus a des problemes preexistants de configuration des routes (404 sur les routes prefixees `/api/` dans le client de test).
