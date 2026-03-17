# SGI-CNTS — Présentation Générale

## Qu'est-ce que SGI-CNTS ?

Le **Système de Gestion Intégré du Centre National de Transfusion Sanguine (SGI-CNTS)** est une plateforme numérique complète conçue pour le CNTS de Dakar, Sénégal. Elle assure la traçabilité totale du sang **"de la veine du donneur à la veine du receveur"** conformément aux normes internationales **ISBT 128**.

Chaque unité de sang est identifiée par un **DIN (Donation Identification Number)** unique, scannable via DataMatrix, dont le parcours complet est enregistré dans un journal d'audit immuable — de la collecte terrain jusqu'à la transfusion chez le patient.

---

## Contexte et Enjeux

| Enjeu | Réponse SGI-CNTS |
|---|---|
| Sécurité transfusionnelle | 6 tests biologiques obligatoires avant toute distribution |
| Traçabilité réglementaire | Audit trail complet sur chaque changement d'état |
| Gestion des stocks | Algorithme FEFO (premier expiré, premier sorti) automatique |
| Hémovigilance | Rappels de lots avec workflow en 4 étapes |
| Collecte terrain | Application mobile offline-first synchronisée |
| Confidentialité | CNI des donneurs hashée HMAC-SHA256, jamais stockée en clair |
| Interopérabilité | Exports FHIR et DHIS2, interfaces automates |

---

## Architecture Technique

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERFACES                            │
│                                                              │
│  Back Office (web/)          Portail Patient (portal/)       │
│  Next.js 16 · React 19       Next.js 16 · React 19           │
│  basePath: /admin            Accès public + espace patient   │
│                                                              │
│              Application Mobile (mobile/)                    │
│              React Native / Expo · Offline-first             │
└─────────────────────────┬────────────────────────────────────┘
                          │ REST / JSON
┌─────────────────────────▼────────────────────────────────────┐
│                    API BACKEND (backend/)                     │
│                                                              │
│  FastAPI (Python 3.11+)   47 modules de routes               │
│  PostgreSQL 16            SQLAlchemy 2.0 · Alembic           │
│  Celery + Redis           Tâches async · Planification       │
└──────────────────────────────────────────────────────────────┘

Packages TypeScript partagés (npm workspaces) :
  @cnts/api       — Client API typé + hooks React
  @cnts/rbac      — Gestion des rôles et permissions
  @cnts/monitoring — Métriques et remontée d'erreurs
```

**Middleware stack backend (ordre) :** CORS → ObservabilityMiddleware → RateLimitMiddleware

---

## Périmètre Fonctionnel en 6 Phases

| Phase | Domaine | Contenu |
|---|---|---|
| **Core** | Transfusion de base | Donneurs, dons, analyses, libération biologique, stock, distribution, hémovigilance |
| **Phase 1** | Infrastructure | Multi-sites, notifications multi-canal (email/SMS/WhatsApp) |
| **Phase 2** | Biologie avancée | Phénotypage, RAI, NAT, CULM, EIR, aphérèse, réactions donneur |
| **Phase 3** | Logistique | Campagnes de collecte, prévisions de stock, transport |
| **Phase 4** | Qualité (SMQ) | Documents qualité, non-conformités, CAPA, équipements, formations |
| **Phase 5** | Interopérabilité | FHIR HL7, DHIS2, interfaces automates laboratoire |
| **Phase 6** | Finance & Fidélisation | Facturation FCFA, gestion consommables, carte donneur + points |

---

## Utilisateurs et Interfaces

| Profil | Interface | Niveau d'accès |
|---|---|---|
| **Administrateur** | Back Office `/admin` | Tous les modules, gestion utilisateurs |
| **Biologiste** | Back Office | Analyses + libération biologique + validation |
| **Agent Stock** | Back Office | Gestion des stocks uniquement |
| **Lecture seule** | Back Office | Consultation sans écriture |
| **Patient / Donneur** | Portail Patient | Espace personnel, rendez-vous, historique |
| **Agent terrain** | App Mobile | Saisie de collecte hors-ligne + synchronisation |

---

## Chiffres Clés du Projet

- **47 modules** d'API REST organisés par domaine fonctionnel
- **67 modèles** de base de données (SQLAlchemy 2.0, UUID PKs)
- **4 rôles** RBAC avec permissions granulaires par module et action
- **6 tests** biologiques obligatoires par don avant libération
- **2 fronts** web : Back Office (`/admin/*`) + Portail public (`/*`)
- **1 application** mobile offline-first (React Native / Expo)
- **3 canaux** de notification : Email · SMS · WhatsApp

---

## Démarrage Rapide

```bash
# Lancer toute la stack avec Docker
cp .env.example .env
docker compose up --build

# Vérifications
curl http://localhost:8000/api/health     # API backend
# Back Office   → http://localhost:3001/admin
# Portail       → http://localhost:3000
```

---

## Sécurité et Conformité

- **Authentification** : JWT (OAuth2 Bearer) + MFA TOTP obligatoire pour le Back Office
- **Rate limiting** : Fenêtre glissante par IP (10/min auth, 60/min écriture, 100/min lecture)
- **Hachage CNI** : HMAC-SHA256 avec clé secrète — la CNI brute n'est jamais persistée
- **Audit trail** : Chaque transition d'état appelle `log_event()` avec payload JSONB horodaté
- **CORS** : Origines explicitement autorisées, méthodes et headers restreints
- **Headers de sécurité** : `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` sur chaque réponse
- **Secrets** : Validation au démarrage — refus de lancer en production avec les valeurs par défaut
