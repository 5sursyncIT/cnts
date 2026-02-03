 # Backend (FastAPI)
 
 ## Pré-requis
 - Python 3.11+
 - PostgreSQL (local ou via Docker Compose à la racine)
 
 ## Variables d’environnement
 - Copier `.env.example` (racine) en `.env` puis ajuster `CNTS_DATABASE_URL` si besoin.
- Auth (API):
  - `CNTS_AUTH_TOKEN_SECRET` : secret de signature des tokens (dev/prod).
  - `CNTS_RECOVERY_CODES_SECRET` : secret HMAC pour hacher les codes de récupération.
  - `CNTS_ADMIN_TOKEN` : token statique pour endpoints d’admin (à remplacer par RBAC).
 
 ## Installation
 
 ```bash
 cd backend
 python3 -m venv .venv
 . .venv/bin/activate
 pip install -U pip
 pip install -e ".[dev]"
 ```
 
 ## Lancer l’API
 
 ```bash
 uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
 ```
 
## Migrations (PostgreSQL)

```bash
alembic upgrade head
```

 Endpoints:
 - `GET /health`
 - `GET /health/db`
 - `POST /auth/login` (password-only ou challenge MFA)
 - `POST /auth/mfa/verify` (TOTP ou recovery code)
 - `POST /admin/auth/2fa/disable/{user_id}` (désactivation 2FA)
 - `POST /admin/auth/2fa/disable-all` (désactivation 2FA globale)
 - Audit: `GET /trace/events?event_type=auth.2fa_disabled` / `auth.2fa_disabled_bulk`
