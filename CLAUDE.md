# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SGI-CNTS**: Blood transfusion management system for Centre National de Transfusion Sanguine (CNTS) Dakar, Senegal. The system ensures complete traceability "from donor vein to recipient vein" following international blood safety standards (ISBT 128).

**Architecture**: Modular monolith FastAPI backend + PostgreSQL, with npm workspaces monorepo containing Next.js Back Office (admin web UI with MFA/RBAC), Next.js Patient Portal (public website + secure patient space), shared TypeScript packages (@cnts/api, @cnts/rbac, @cnts/monitoring), and planned React Native mobile app (offline-first for blood drives).

## Development Commands

### Using Docker (Recommended for Quick Start)
```bash
# Copy environment config
cp .env.example .env

# Start PostgreSQL + API
docker compose up --build

# Verify health
curl http://localhost:8000/health
curl http://localhost:8000/health/db
```

### Monorepo Setup (Frontend)
```bash
# Install all workspace dependencies (from project root)
npm install --workspaces --include-workspace-root

# Start Back Office (admin) on http://localhost:3000
npm -w web run dev

# Start Patient Portal on http://localhost:3001
npm -w portal run dev

# Run linting across all workspaces
npm run lint

# Run tests across all workspaces
npm run test

# Run tests with coverage
npm run test:coverage
```

**Environment Variables**: Create `.env.local` files in `web/` and `portal/` directories. See [web/README.md](web/README.md) and [portal/README.md](portal/README.md) for required variables.

### Local Backend Development
```bash
cd backend

# Setup virtual environment
python3 -m venv .venv
source .venv/bin/activate  # or `. .venv/bin/activate`

# Install dependencies (includes dev tools: pytest, httpx, ruff)
pip install -U pip
pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Start API with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Testing & Linting

**Backend (Python)**
```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_liberation.py

# Run tests with verbose output
pytest -v

# Lint with ruff
ruff check .

# Format with ruff
ruff format .
```

**Frontend (TypeScript/JavaScript)**
```bash
# From project root - run across all workspaces
npm run test
npm run test:coverage
npm run lint

# Specific workspace
npm -w web run test
npm -w web run test:coverage
npm -w web run lint

npm -w portal run test
npm -w portal run lint

# Shared packages
npm -w @cnts/api run test
npm -w @cnts/rbac run test
npm -w @cnts/monitoring run test
```

### Database Migrations
```bash
cd backend

# Apply migrations
alembic upgrade head

# Create new migration (after modifying models)
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1
```

## Architecture Overview

### Monorepo Structure
```
.
├── backend/           # FastAPI backend + PostgreSQL
├── web/               # Back Office (Next.js 16 + React 19)
├── portal/            # Patient Portal (Next.js 16 + React 19)
├── packages/          # Shared TypeScript packages
│   ├── api/           # @cnts/api - API client
│   ├── rbac/          # @cnts/rbac - Role-based access control
│   └── monitoring/    # @cnts/monitoring - Metrics & reporting
├── mobile/            # React Native app (planned)
├── docs/              # Technical documentation
└── package.json       # Root workspace configuration
```

### Backend Structure
```
backend/
├── app/
│   ├── api/routes/     # API endpoints by domain
│   │   ├── donneurs.py      # Donor management
│   │   ├── dons.py          # Donation collection
│   │   ├── analyses.py      # Lab test results
│   │   ├── liberation.py    # Biological release
│   │   ├── poches.py        # Blood bag inventory
│   │   └── stock.py         # Fractionnement & product rules
│   ├── audit/          # Event sourcing & audit trail
│   ├── core/           # Business logic & utilities
│   │   ├── din.py           # DIN generation (ISBT 128)
│   │   ├── security.py      # CNI hashing
│   │   ├── idempotency.py   # Mobile sync support
│   │   └── config.py        # Settings
│   ├── db/             # SQLAlchemy models, session
│   └── schemas/        # Pydantic DTOs
├── alembic/            # Database migrations
└── tests/              # Pytest test suite
```

### Frontend Applications

**web/ (Back Office)**
- Next.js 16 App Router with React 19
- Secure admin interface for CNTS staff and healthcare facilities
- Authentication: Login + MFA (TOTP via otplib), httpOnly session cookies
- RBAC: Role-based permissions (read/write/delete/validate per module)
- Local audit trail: Logs administrative actions
- API Proxy: `/api/backend/*` proxies to FastAPI backend (anti-CORS)
- Stack: Next.js, jose (JWT), otplib (TOTP), Tailwind CSS 4, Vitest
- Environment: See [web/README.md](web/README.md) for required env vars

**portal/ (Patient Portal)**
- Next.js 16 App Router with React 19
- Public website (services, team, contact, news)
- Secure patient space (appointments, reports, messaging, documents, notifications)
- GDPR compliance: Cookie consent banner, explicit consent for health data access
- Stack: Next.js, jose (JWT), Tailwind CSS 4, Vitest
- Environment: See [portal/README.md](portal/README.md) for required env vars

**Shared Packages** (TypeScript, ES modules)
- `@cnts/api`: Type-safe API client for FastAPI backend, includes monitoring integration
- `@cnts/rbac`: RBAC model and permission checks (roles, resources, actions)
- `@cnts/monitoring`: Metrics collection and error reporting

All packages use Vitest for testing with coverage reporting.

### Core Domain Models

**Donneur (Donor)**
- Identified via `cni_hash` (HMAC-SHA256 of national ID number)
- Tracks `dernier_don` (last donation date) for eligibility calculation
- Males: 2 months between donations, Females: 4 months

**Don (Donation)**
- Each donation receives unique `din` (Donation Identification Number) via ISBT 128 format: `{SITE_CODE}{YY}{DDD}{NNNNNN}` (site code + year + day-of-year + sequence)
- `statut_qualification`: state machine (EN_ATTENTE → LIBERE)
- Links to multiple `Analyse` (lab tests) and `Poche` (blood products)

**Poche (Blood Bag)**
- Derived products: ST (whole blood), CGR (packed RBC), PFC (plasma), CP (platelets)
- Two parallel state machines:
  - `statut_stock`: EN_STOCK → FRACTIONNEE (for inventory tracking)
  - `statut_distribution`: NON_DISTRIBUABLE → DISPONIBLE → RESERVE → DISTRIBUE (for clinical use)
- `source_poche_id`: Tracks fractionnement chain (ST → CGR/PFC/CP)
- `volume_ml`: Volume in milliliters (optional but recommended)
- Indexed by `(type_produit, date_peremption)` for FEFO (First Expired, First Out)

**Analyse (Lab Test)**
- Types: ABO grouping, Rh factor, infectious disease screening (VIH, VHB, VHC, SYPHILIS)
- `resultat`: POSITIF/NEGATIF/EN_ATTENTE
- **Critical Rule**: Blood bag CANNOT be marked DISPONIBLE if any test is POSITIF or EN_ATTENTE

**ProductRule** (Configuration)
- Defines shelf life and volume constraints per product type
- `shelf_life_days`: Days from donation date to expiration
- `default_volume_ml`, `min_volume_ml`, `max_volume_ml`: Volume constraints
- Used by fractionnement to calculate expiration dates and validate volumes

**FractionnementRecette** (Recipe)
- Predefined recipes for splitting blood products (e.g., "ST_STANDARD": 1 CGR + 1 PFC + 1 CP)
- `composants`: JSONB array of `{type_produit, volume_ml, quantite}`
- `site_code`: Optional site-specific recipes (null = global)
- `actif`: Enable/disable recipes without deletion

**TraceEvent** (Audit Trail)
- Event sourcing for critical operations (fractionnement, liberation, etc.)
- `aggregate_type`, `aggregate_id`: Entity being tracked
- `event_type`: Operation performed (e.g., "poche.fractionnee")
- `payload`: JSONB snapshot of operation details

### Key Technical Patterns

**DIN Generation** ([backend/app/core/din.py](backend/app/core/din.py))
- Uses PostgreSQL sequence `din_seq` for unique serial numbers
- Format ensures global uniqueness and ISBT 128 compliance

**CNI Hashing** ([backend/app/core/security.py](backend/app/core/security.py))
- Donor CNI is HMAC-hashed with secret key (`CNTS_CNI_HASH_KEY`)
- Normalized (alphanumeric, uppercase) before hashing to handle duplicates
- Hash is indexed for fast lookup, original CNI not stored in DB

**Idempotency Support** ([backend/app/core/idempotency.py](backend/app/core/idempotency.py))
- Critical for mobile offline-first sync (prevents duplicate donations on retry)
- Endpoints that modify state accept `idempotency_key` in request body
- System tracks processed keys to reject duplicates
- Used in: `/dons`, `/stock/fractionnements`, `/stock/fractionnements/recette/{code}`

**Audit Trail** ([backend/app/audit/events.py](backend/app/audit/events.py))
- `log_event()` function records critical operations in `trace_events` table
- Event sourcing pattern for compliance and debugging
- Currently tracks: fractionnement operations
- Future: liberation, distribution, adverse reactions

**State Machine Validation**
- Use explicit status enums in models (e.g., `statut_qualification`, `statut_distribution`, `statut_stock`)
- Database constraints enforce business rules (e.g., CHECK constraints, foreign keys)
- State transitions should be atomic (use DB transactions)

**Fractionnement Workflow** ([backend/app/api/routes/stock.py](backend/app/api/routes/stock.py))
1. Validate source poche is ST and EN_STOCK
2. Lookup ProductRule for each component to get shelf_life_days and volume constraints
3. Create derived poches with calculated expiration dates
4. Validate total volume doesn't exceed source + max_overage (default 250ml)
5. Mark source as FRACTIONNEE
6. Log event to audit trail
7. Return list of created poches

### Configuration

Environment variables (all prefixed with `CNTS_`):
- `CNTS_DATABASE_URL`: PostgreSQL connection string (use `postgresql+psycopg://...`)
- `CNTS_CNI_HASH_KEY`: HMAC secret for hashing donor IDs (MUST change in production)
- `CNTS_DIN_SITE_CODE`: Site identifier for DIN generation (default: "CNTS")
- `CNTS_FRACTIONNEMENT_MAX_OVERAGE_ML`: Max volume overage allowed (default: 250ml)
- `CNTS_ENV`: dev/staging/prod
- `CNTS_LOG_LEVEL`: INFO/DEBUG/WARNING/ERROR

See [.env.example](.env.example) for full configuration.

## Critical Business Rules

1. **Biological Release Gate**: A `Poche` MUST NOT transition to `DISPONIBLE` status unless:
   - All required `Analyse` records exist for the parent `Don` (ABO, RH, VIH, VHB, VHC, SYPHILIS)
   - All test results are `NEGATIF`
   - `Don.statut_qualification` is `LIBERE`

2. **Donor Eligibility**: Before accepting a donation, verify:
   - Males: `dernier_don` is NULL or >= 60 days ago
   - Females: `dernier_don` is NULL or >= 120 days ago
   - Pre-donation questionnaire flags are reviewed by medical staff

3. **Anonymization**: Blood bag labels contain ONLY:
   - DIN (unique identifier)
   - Blood group (ABO + Rh)
   - Product type (ST/CGR/PFC/CP)
   - Expiration date
   - NEVER the donor's name or CNI

4. **Fractionnement Rules**:
   - Only ST (Sang Total) can be fractionned
   - Source poche must be EN_STOCK status
   - Total component volume must not exceed source volume + max_overage
   - Each component expiration = donation_date + product_rule.shelf_life_days
   - Source poche becomes FRACTIONNEE and moved to FRACTIONNEMENT location

5. **Audit Trail**: All state transitions and critical operations MUST be logged via `log_event()` for regulatory compliance.

## Development Guidelines

- **Index Strategy**: The models already have indexes on frequently queried columns (`cni_hash`, `din`, `type_produit + date_peremption`, status fields). Add new indexes sparingly after measuring query performance.

- **API Pagination**: All list endpoints MUST support pagination (`offset`/`limit`). Default page size should be 20-200 items depending on data size.

- **Error Handling**: Use FastAPI's `HTTPException` with appropriate status codes:
  - 404: Resource not found
  - 409: Business rule violation (e.g., poche already FRACTIONNEE)
  - 422: Invalid data / unprocessable entity
  - Provide clear error messages in French (user-facing API)

- **Mobile Sync**: When implementing mobile endpoints, ensure:
  - Accept `idempotency_key` to prevent duplicate submissions
  - Return incremental updates via cursor-based sync (timestamp or event sequence)
  - Handle clock skew (use server timestamps for authoritative ordering)

- **Testing**: Use pytest fixtures for database setup. Test files are in `backend/tests/`. Use SQLite in-memory database for fast tests. See test_liberation.py and test_poches.py for examples.

- **Audit Logging**: When adding new state-changing endpoints, call `log_event()` to record the operation:
  ```python
  from app.audit.events import log_event

  log_event(
      db,
      aggregate_type="poche",
      aggregate_id=poche.id,
      event_type="poche.fractionnee",
      payload={"key": "value", ...}
  )
  ```

### Frontend Development Guidelines

- **Monorepo Practices**: Use workspace dependencies (`@cnts/*` packages) for shared code. Changes to packages are automatically reflected in dependent apps during development.

- **Next.js Patterns**:
  - Use App Router (not Pages Router)
  - Server Components by default, Client Components only when needed ('use client')
  - API routes in `app/api/` for backend proxy and server-side logic
  - Middleware for authentication/session checks

- **Authentication & Security**:
  - Back Office: Use httpOnly session cookies (never localStorage)
  - Verify sessions in middleware.ts before allowing access to protected routes
  - MFA (TOTP) required for admin users - use otplib for generation/validation
  - RBAC checks: Use @cnts/rbac package for permission validation

- **API Communication**:
  - Use @cnts/api client for type-safe backend requests
  - Back Office: Prefer `/api/backend/*` proxy to avoid CORS
  - Portal: Can call backend directly or via proxy
  - Include error handling and monitoring integration

- **Testing**: All new components and utilities should have Vitest tests. Use happy-dom for DOM testing. Run `npm run test:coverage` to ensure coverage thresholds.

- **Styling**: Use Tailwind CSS 4 utility classes. Follow existing patterns for consistency (see web/src/components/ for examples).

- **Accessibility**: Use semantic HTML and ARIA attributes where needed. Run ESLint with jsx-a11y plugin to catch issues.

## Implemented Modules (v0.2.0+)

### Donor Management ([backend/app/api/routes/donneurs.py](backend/app/api/routes/donneurs.py))
- CRUD for donors with CNI hashing
- Eligibility calculation based on gender and last donation date
- Automatic duplicate detection via CNI hash

### Donation Collection ([backend/app/api/routes/dons.py](backend/app/api/routes/dons.py))
- Create donations with automatic DIN generation (ISBT 128)
- Idempotency support for mobile sync
- Automatic ST poche creation on donation
- Etiquette generation endpoint

### Laboratory Module ([backend/app/api/routes/analyses.py](backend/app/api/routes/analyses.py))
- Complete CRUD for lab test results (Analyse model)
- Required tests: ABO, RH, VIH, VHB, VHC, SYPHILIS
- Validation prevents duplicate tests for same donation
- Filtering by don_id, type_test, resultat

### Biological Release ([backend/app/api/routes/liberation.py](backend/app/api/routes/liberation.py))
- `GET /liberation/{don_id}` - Verify if donation can be released
- `POST /liberation/{don_id}/liberer` - Perform biological release
- **Critical business logic**: Enforces all required tests are NEGATIF before release
- Automatically updates Don status: EN_ATTENTE → LIBERE
- Automatically updates Poche status: NON_DISTRIBUABLE → DISPONIBLE

### Blood Bag Inventory ([backend/app/api/routes/poches.py](backend/app/api/routes/poches.py))
- FEFO sorting: `GET /poches?sort_by_expiration=true`
- Expiration alerts: `GET /poches/alertes/peremption?jours=7`
- Stock summary by product type: `GET /poches/stock/summary`
- Comprehensive filtering: type_produit, statut_distribution, emplacement_stock
- Protection: Cannot delete DISTRIBUE poches, cannot make DISPONIBLE without LIBERE don

### Fractionnement & Stock Management ([backend/app/api/routes/stock.py](backend/app/api/routes/stock.py))
- **Product Rules**: Configure shelf life and volume constraints per product type
  - `GET /stock/regles` - List all product rules
  - `PUT /stock/regles/{type_produit}` - Create/update product rule

- **Manual Fractionnement**: Split ST into components with custom volumes
  - `POST /stock/fractionnements` - Fractionner with explicit component list
  - Validates volumes against ProductRule constraints
  - Calculates expiration dates automatically

- **Recipe-based Fractionnement**: Use predefined recipes for consistent splitting
  - `GET /stock/recettes` - List recipes (filter by site_code, actif)
  - `GET /stock/recettes/{code}` - Get recipe details
  - `PUT /stock/recettes/{code}` - Create/update recipe
  - `DELETE /stock/recettes/{code}` - Deactivate recipe (sets actif=false)
  - `POST /stock/fractionnements/recette/{code}` - Split using recipe

- **Stock Queries**:
  - `GET /stock/poches` - List poches with FEFO sorting (EN_STOCK by default)

- **Idempotency**: Both fractionnement endpoints support `idempotency_key`
- **Audit**: All fractionnement operations logged to `trace_events` table

### Distribution Module ([backend/app/api/routes/](backend/app/api/routes/))
- **Hospital Management** (`hopitaux.py`)
  - `GET /hopitaux` - List hospitals with convention filter
  - `POST /hopitaux` - Create hospital
  - `GET /hopitaux/{id}` - Get hospital details

- **Order Management** (`commandes.py`)
  - `GET /commandes` - List orders (filter by statut, hopital_id)
  - `POST /commandes` - Create order with multiple lines
  - `GET /commandes/{id}` - Get order details with lines
  - `POST /commandes/{id}/valider` - Validate and reserve poches (FEFO)
  - `POST /commandes/{id}/affecter` - Assign receveurs to poches
  - `POST /commandes/{id}/servir` - Serve order (marks DISTRIBUE)
  - `POST /commandes/{id}/annuler` - Cancel order (releases reservations)

- **Receveur Management** (`receveurs.py`)
  - `GET /receveurs` - List receveurs (filter by groupe_sanguin)
  - `POST /receveurs` - Create receveur
  - `GET /receveurs/{id}` - Get receveur details

- **Cross-Matching** (`cross_match.py`)
  - `POST /cross-match` - Record compatibility test result

- **Business Logic**:
  - Automatic FEFO allocation (First Expired, First Out)
  - Blood group compatibility validation
  - Reservation expiration (configurable, default 24h)
  - State machine: BROUILLON → VALIDEE → SERVIE
  - Can cancel BROUILLON or VALIDEE (releases reservations)

### Test Coverage
- [backend/tests/test_liberation.py](backend/tests/test_liberation.py): 10 tests covering biological release workflow
- [backend/tests/test_poches.py](backend/tests/test_poches.py): 8 tests covering blood bag inventory features
- [backend/tests/test_distribution.py](backend/tests/test_distribution.py): 14 tests covering hospital orders, FEFO allocation, cross-matching

## Implemented Frontend Modules (v0.3.0+)

### Back Office (web/) - Admin Interface ✅

**Authentication & Authorization** (Complete)
- Login + MFA (TOTP via otplib), httpOnly session cookies
- RBAC system with 4 roles: admin, biologiste, technicien_labo, agent_distribution
- Permission-based access control via @cnts/rbac package
- Local audit trail for administrative actions
- API proxy: `/api/backend/*` for CORS-free backend communication

**Core Modules** (Complete - ~95% of business functionality)

**1. Donneurs (Donor Management)** - 3 pages
- [web/src/app/(bo)/donneurs/page.tsx](web/src/app/(bo)/donneurs/page.tsx) - List with search/filter
- [web/src/app/(bo)/donneurs/nouveau/page.tsx](web/src/app/(bo)/donneurs/nouveau/page.tsx) - Create donor with CNI validation
- [web/src/app/(bo)/donneurs/[id]/page.tsx](web/src/app/(bo)/donneurs/[id]/page.tsx) - Detail with real-time eligibility check and donation history

**2. Dons (Donation Collection)** - 3 pages
- [web/src/app/(bo)/dons/page.tsx](web/src/app/(bo)/dons/page.tsx) - List with filters and statistics
- [web/src/app/(bo)/dons/nouveau/page.tsx](web/src/app/(bo)/dons/nouveau/page.tsx) - Create donation with eligibility verification
- [web/src/app/(bo)/dons/[id]/page.tsx](web/src/app/(bo)/dons/[id]/page.tsx) - Detail with analyses, poches, liberation status, etiquette download

**3. Laboratoire (Laboratory)** - 3 pages
- [web/src/app/(bo)/laboratoire/page.tsx](web/src/app/(bo)/laboratoire/page.tsx) - Landing page with workflow overview
- [web/src/app/(bo)/laboratoire/analyses/page.tsx](web/src/app/(bo)/laboratoire/analyses/page.tsx) - Batch test entry for 6 required tests (ABO, RH, VIH, VHB, VHC, SYPHILIS)
- [web/src/app/(bo)/laboratoire/liberation/page.tsx](web/src/app/(bo)/laboratoire/liberation/page.tsx) - Biological release validation and execution

**4. Stock (Inventory & Fractionnement)** - 2 pages
- [web/src/app/(bo)/stock/page.tsx](web/src/app/(bo)/stock/page.tsx) - FEFO inventory with expiration alerts and statistics
- [web/src/app/(bo)/stock/fractionnement/page.tsx](web/src/app/(bo)/stock/fractionnement/page.tsx) - Split ST into components (recipe-based or manual)

**5. Distribution (Hospital Orders)** - 4 pages
- [web/src/app/(bo)/distribution/page.tsx](web/src/app/(bo)/distribution/page.tsx) - Dashboard with pending orders
- [web/src/app/(bo)/distribution/commandes/page.tsx](web/src/app/(bo)/distribution/commandes/page.tsx) - Order list with filters
- [web/src/app/(bo)/distribution/commandes/nouvelle/page.tsx](web/src/app/(bo)/distribution/commandes/nouvelle/page.tsx) - Create order with dynamic lines
- [web/src/app/(bo)/distribution/commandes/[id]/page.tsx](web/src/app/(bo)/distribution/commandes/[id]/page.tsx) - Order detail with validation, serving, cancellation

**Shared Infrastructure**
- `@cnts/api`: Complete type-safe API client with 50+ endpoints, React hooks for all operations
- `@cnts/rbac`: RBAC engine (roles, permissions, policy validation)
- `@cnts/monitoring`: Instrumented fetch with metrics and error reporting

**Complete "Vein to Vein" Workflow** - Fully Functional
```
Donor Registration → Donation → Lab Tests → Biological Release →
Fractionnement → Stock Management → Hospital Order → Distribution
```

All critical business operations now have full UI support.

### Patient Portal (portal/) - Public Website + Patient Space

**Public Website** (Complete)
- Landing page with services overview
- Team page (staff profiles)
- Contact page with form
- News/Blog section
- GDPR compliance: Cookie consent banner

**Patient Space** (Complete)
- Patient authentication with secure sessions
- Dashboard with key metrics
- Appointments management
- Medical reports access
- Secure messaging with staff
- Document library
- Notifications center
- Health data access consent (GDPR)

## Future Modules (Not Yet Implemented)

**Backend** (API complete, UI optional)
- **Hémovigilance**: Adverse reaction tracking, batch recall, post-transfusion follow-up
- **Cross-matching**: Receveur management UI, cross-match recording (backend exists)
- **Hospital Management**: CRUD for hospitals (backend exists, simple UI needed)

**Admin Pages** (Lower priority)
- Product rules management UI (CRUD)
- Fractionnement recipes management UI (CRUD)
- User management UI (create/edit users, assign roles)
- Enhanced audit log viewer

**Analytics** (Lower priority)
- Dashboard with charts (donation trends, stock levels, distribution statistics)
- KPI tracking (donation rate, waste rate, distribution efficiency)
- Reports generation (monthly summaries, compliance reports)

**Mobile**
- **Mobile App** (React Native): Offline-first blood drive collection with donor questionnaire, event log sync

## Common Workflows

### Complete Blood Donation Flow (Full "Vein to Vein" Traceability)
1. **Donor Registration** (`/donneurs/nouveau`)
   - Enter CNI (hashed), name, sex
   - System checks eligibility (60 days male, 120 days female)
   - Create donor record

2. **Donation Collection** (`/dons/nouveau`)
   - Select eligible donor
   - Generate unique DIN (ISBT 128 format)
   - Automatic ST poche creation (NON_DISTRIBUABLE)
   - Download anonymous etiquette

3. **Laboratory Testing** (`/laboratoire/analyses`)
   - Enter 6 required test results (ABO, RH, VIH, VHB, VHC, SYPHILIS)
   - Batch submission with validation

4. **Biological Release** (`/laboratoire/liberation`)
   - Verify all tests complete and NEGATIF
   - Validate and release don (LIBERE)
   - Poche becomes DISPONIBLE for distribution

5. **Fractionnement** (Optional, `/stock/fractionnement`)
   - Split ST into components (CGR, PFC, CP)
   - Use predefined recipe or manual specification
   - Automatic expiration calculation per product rule

6. **Stock Management** (`/stock`)
   - FEFO inventory (First Expired, First Out)
   - Expiration alerts
   - Product tracking by type and blood group

7. **Hospital Order** (`/distribution/commandes/nouvelle`)
   - Create order with multiple lines (type, group, quantity)
   - Validation reserves poches automatically (FEFO)
   - Affectation to specific receveurs (optional)

8. **Distribution** (`/distribution/commandes/{id}`)
   - Serve order (marks poches DISTRIBUE)
   - Complete traceability maintained
   - Ready for transfusion at hospital

### Fractionnement with Recipe
1. Admin creates ProductRule for each product type (shelf_life_days, volume constraints)
2. Admin creates FractionnementRecette (e.g., "ST_STANDARD": 1 CGR 280ml + 1 PFC 220ml + 1 CP 50ml)
3. Lab/Tech calls `POST /stock/fractionnements/recette/ST_STANDARD` with source poche
4. System validates, creates components, marks source as FRACTIONNEE, logs event

### Example: Define Product Rules
```bash
# CGR: 42 days shelf life, 250-300ml volume
curl -X PUT http://localhost:8000/stock/regles/CGR \
  -H "Content-Type: application/json" \
  -d '{"shelf_life_days": 42, "default_volume_ml": 280, "min_volume_ml": 250, "max_volume_ml": 300}'

# PFC: 365 days (frozen), 200-250ml
curl -X PUT http://localhost:8000/stock/regles/PFC \
  -H "Content-Type: application/json" \
  -d '{"shelf_life_days": 365, "default_volume_ml": 220, "min_volume_ml": 200, "max_volume_ml": 250}'
```

See [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md) for more examples.
