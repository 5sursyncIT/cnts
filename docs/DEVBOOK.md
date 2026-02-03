# Project: CNTS-Dakar Management System (SGI-CNTS)

## 📌 Vision du Projet
Développement d'un système de gestion intégré pour le Centre National de Transfusion Sanguine (CNTS) de Dakar. L'objectif est d'assurer une traçabilité totale "de la veine du donneur à la veine du receveur", en respectant les normes internationales de sécurité transfusionnelle.

## 🌍 Contexte Local & Normes
- **Lieu :** Dakar, Sénégal (Centre principal à Fann + Collectes mobiles).
- **Identification :** Utilisation de la CNI (Carte Nationale d'Identité) sénégalaise pour l'indexation des donneurs.
- **Standard d'Étiquetage :** Norme internationale **ISBT 128** (obligatoire pour l'interopérabilité).
- **Langues :** Français (Interface), Wolof (Support audio pour le questionnaire donneur).

## 🛠 Modules Principaux (Core Modules)

### 1. Gestion des Donneurs (Donor Management)
- **Identification :** Gestion des doublons, historique des dons.
- **Éligibilité :** Calcul automatique du délai entre deux dons (H : 2 mois / F : 4 mois).
- **Questionnaire :** Digitalisation du pré-don avec système de flagging pour le médecin.

### 2. Laboratoire & Qualification (Lab & Testing)
- **Groupage :** Saisie/Import des résultats ABO/Rh.
- **Sérologie :** Validation des tests infectieux (VIH, VHB, VHC, Syphilis).
- **Blocage Électronique :** Une poche ne doit PAS pouvoir être libérée si un test est positif ou non effectué.

### 3. Stock & Fractionnement (Inventory)
- **Transformation :** Passage du Sang Total (ST) vers CGR, PFC, CP.
- **Chaîne du Froid :** Suivi des températures et alertes de péremption.
- **FIFO/FEFO :** Priorité de sortie de stock basée sur la date d'expiration.

### 4. Distribution & Hémovigilance
- **Commandes :** Gestion des demandes des hôpitaux partenaires.
- **Compatibilité :** Cross-matching entre receveur et poche.
- **Traçabilité :** Archivage des données de transfusion pour rappel de lot si nécessaire.

## 🏗 Architecture Technique (Recommandée)
- **Backend :** API REST (Python/FastAPI) pour la gestion des transactions critiques.
- **Frontend :** Web (Next.js) pour l'administration et Mobile (React Native) pour les collectes mobiles avec mode **Offline-first**.
- **Base de données :** PostgreSQL (Relationnel strict pour l'intégrité des données).
- **Sécurité :** Chiffrement des données de santé (données sensibles), authentification par rôles (RBAC).

## ✅ Décisions Techniques (Optimisées Performance & Fiabilité)
### 1) API & Backend
- **Monolithe modulaire au début (FastAPI)** : séparation par domaines (donneur/don, labo, stock, distribution) avec contrats clairs. Objectif : performance et simplicité d’exploitation avant microservices.
- **Entrées/sorties “minces”** : DTO explicites, pagination obligatoire, filtres indexables, éviter les payloads massifs.
- **Idempotence** : endpoints d’écriture acceptant une `idempotency_key` (surtout pour la sync mobile) pour éviter doublons et conflits.
- **Audit trail** : journaliser chaque transition d’état (qui/quand/quoi) sans alourdir les tables métier (table d’événements dédiée).

### 2) Modèle de données & PostgreSQL
- **Contraintes en base** : les règles bloquantes (ex: pas de distribution sans libération) doivent être garanties par des statuts + contraintes/transactions côté DB, pas seulement par l’API.
- **États explicites** : workflow par machine à états (ex: `statut_qualification`, `statut_distribution`) pour des requêtes rapides et auditables.
- **Indexation ciblée** :
  - recherche donneur via `cni_hash` (index unique),
  - traçabilité via DIN (index unique),
  - requêtes stock via `(type_produit, date_peremption)` (FEFO),
  - requêtes labo via `(don_id, type_test, resultat)`.
- **Chiffrement applicatif des champs sensibles** : garder les colonnes chiffrées hors index (indexer uniquement des dérivés non réversibles: hash).

### 3) Offline-first & Synchronisation Mobile
- **Modèle “event log + projection”** :
  - sur mobile : file d’attente d’événements horodatés,
  - côté serveur : ingestion idempotente + application transactionnelle,
  - projection d’un état courant pour l’UI et les listes.
- **Conflits minimisés par conception** : “une collecte = un device responsable” tant que non synchronisée; verrous logiques par `don_id` lors des transitions critiques.
- **Réplication incrémentale** : sync par “cursor” (dernier événement confirmé), pas par “dump complet”.

### 4) Recherche & Performance perçue
- **Toujours paginer** (admin) et privilégier les vues “liste” (résumés) + écrans “détails” chargés à la demande.
- **Pré-calcul léger** : champs dérivés utiles (ex: `date_peremption`, `eligible_le`) pour éviter des calculs coûteux en lecture.
- **Pas de cache prématuré** : démarrer sans Redis; ajouter uniquement après mesure (latence p95, charge, points chauds).

### 5) Observabilité & Exploitation
- **Metrics & logs structurés dès le MVP** : latence p95/p99, erreurs, taux de sync, files d’attente, temps de transactions DB.
- **Traçage des opérations critiques** : collectes, libérations, sorties stock, distributions (corrélation par DIN).
- **Sauvegardes DB** : politique de restauration testée (une sauvegarde non testée n’existe pas).

### 6) Choix concrets recommandés (résumé)
- **Architecture** : monolithe FastAPI modulaire + PostgreSQL transactionnel.
- **Sync mobile** : événements idempotents + curseur + projections (évite les merges coûteux et les écrasements).
- **Garanties métier** : invariants imposés en DB + audit trail événementiel.
- **Optimisation** : index ciblés + pagination + mesures avant cache.

## 🚦 Business Rules Critiques (À respecter par l'IA)
1. **Règle d'Or :** Aucune poche ne peut être distribuée sans une "Libération Biologique" validée informatiquement.
2. **Identifiant Unique :** Chaque don génère un `Donation Identification Number (DIN)` unique selon le format ISBT 128.
3. **Anonymisation :** Le nom du donneur ne doit jamais apparaître sur l'étiquette de la poche, uniquement le DIN et le groupe sanguin.

## 📂 Structure des Données (High Level)
- `Donneur` (id, cni_hash, nom, prenom, sexe, dernier_don)
- `Don` (id_don, donneur_id, date_don, type_don, statut_qualification)
- `Poche` (id_poche, don_id, type_produit, date_peremption, emplacement_stock)
- `Analyse` (id_analyse, don_id, type_test, resultat, validateur_id)

## 📝 Roadmap de Développement
1. [x] MVP : Module de collecte et étiquetage (donneur, don, DIN, idempotence).
2. [x] Module Labo et validation des tests (analyses, blocage, libération biologique).
3. [x] Stock & Fractionnement (de base) : ST → CGR/PFC/CP + FEFO (liste).
4. [x] Module Distribution : commandes hôpitaux, réservations, cross-matching.
5. [x] Hémovigilance : traçabilité + rappels de lots (MVP + workflow).

### Prochaines étapes (détaillées)
#### Fractionnement avancé
- Règles paramétrables de péremption par produit (ex: CGR/PFC/CP) + contrôles de cohérence (volumes, nombre de composants, poche source).
- États stock (EN_STOCK / FRACTIONNEE / RESERVEE / DISTRIBUEE / DETRUITE) avec transitions atomiques.
- Alertes de péremption + sorties FEFO (type_produit + date_peremption).
- Étiquetage “produit” (ISBT 128) : champs `code_produit_isbt`, `lot`, `division` + endpoint `GET /poches/{id}/etiquette-produit` (payload prêt pour code-barres/DataMatrix).

#### Distribution (hôpitaux + cross-matching)
- Référentiel `Hopital` + workflow `Commande` (statuts: BROUILLON, VALIDEE, SERVIE, ANNULEE).
- Réservation de poches (allocation FEFO) + dé-allocation si annulation/expiration.
- Cross-match (receveur ↔ poche) avec résultat, validateur, horodatage; blocage si incompatible.
- Garanties DB : impossibilité de distribuer une poche non libérée (règle d’or).
- Endpoint utilitaire : `POST /commandes/reservations/sweep` pour libérer les réservations expirées (utile cron).

#### Hémovigilance (traçabilité + rappels)
- Journal d’événements (audit trail) pour chaque transition critique (collecte, fractionnement, libération, sortie, distribution, retour, destruction).
- Traçabilité “veine → veine” : relier DIN, composants, commande, receveur, acte transfusionnel.
- Rappel de lots : recherche par DIN/lot → liste des établissements/patients impactés + workflow d’actions.
- MVP implémenté :
  - Actes transfusionnels enregistrés lors du service commande (`POST /commandes/{id}/servir`).
  - Endpoints : `GET /hemovigilance/transfusions`, `POST/GET /hemovigilance/rappels`, `GET /hemovigilance/rappels/{id}/impacts`.
  - Workflow rappels : `POST /hemovigilance/rappels/{id}/notifier|confirmer|cloturer` + historique `GET /hemovigilance/rappels/{id}/actions`.
  - Exports impacts : `GET /hemovigilance/rappels/{id}/export/hopitaux|receveurs?format=json|csv`.

#### Sync offline-first (mobile)
- Pull incrémental : `GET /sync/events?cursor=...&limit=...` (cursor opaque + `next_cursor`).
- Push batch idempotent : `POST /sync/events` (par `device_id` + `client_event_id`, retours `ACCEPTE/REJETE/DUPLICATE`).
- Tables dédiées : `sync_devices`, `sync_ingested_events` (idempotence + audit des événements ingérés).

#### Observabilité & audit
- Request-id : support `X-Request-Id` (réponse incluse) pour corrélation logs.
- Metrics : `GET /metrics` (format Prometheus).
- Audit trail consultable : `GET /trace/events` (filtres + pagination `before`) et `GET /trace/events/{id}`.

## 💻 Développement Frontend

L’API est déjà en place. Le frontend est organisé en interfaces distinctes :
- **Back Office** (`web/`, Next.js) : administration sécurisée (MFA/RBAC/audit) avec écrans paginés et filtres.
- **Portail patient** (`portal/`, Next.js) : site vitrine + espace patient (RDV, documents, messagerie) avec SEO.
- **Mobile** (`mobile/`, React Native / Expo) : collecte (offline-first) + synchronisation incrémentale.

### Pré-requis
- **Node.js 20+** (ou version LTS récente) + npm.
- **API** en local : `http://localhost:8000` (Swagger : `http://localhost:8000/docs`).

### 1) Back Office (Next.js) — Administration

#### Installation (monorepo)

```bash
npm install --workspaces --include-workspace-root
```

#### Variables d’environnement
Créer `web/.env.local` :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Conventions (cibles)
- **Listes paginées** (tri + filtres) puis **détails** chargés à la demande.
- **Tri/filtre indexables** : DIN, `cni_hash`, statuts, `date_peremption`.
- **Écritures idempotentes** : prévoir l’envoi d’une clé côté client sur les actions “critique sync” (notamment mobile), et réutiliser le même mécanisme sur le web si besoin.

#### Notes d’intégration API (dev)
- Le backend ne configure pas encore le CORS : en dev, privilégier un **proxy** côté Next.js (route API) ou ajouter le middleware CORS au backend quand le web démarre réellement.
- Le contrat est disponible via **OpenAPI** : `GET /openapi.json` (utile pour générer des types TypeScript).

### 2) Portail patient (Next.js) — Vitrine + espace patient

#### Variables d’environnement
Créer `portal/.env.local` :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Conventions (cibles)
- Vitrine **SEO-first** : pages statiques, métadonnées, performance.
- Espace patient : routes protégées, consentement GDPR explicite, documents via liens signés (côté backend).

### 3) Mobile (Expo React Native) — Collectes offline-first

#### Initialisation

```bash
cd mobile
npm create expo@latest . -- --template blank-typescript
```

#### Variables d’environnement
Créer `mobile/.env` (ou config Expo équivalente) :

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Conventions (cibles)
- **Persistance locale** (SQLite) : donneurs, dons, étiquettes, états d’envoi.
- **File d’événements** : opérations horodatées + `idempotency_key` côté client, envoyées au backend dès qu’il y a du réseau.
- **Sync incrémentale** : curseur (dernier événement confirmé) + relecture idempotente, pas de “dump complet”.

### 4) Conventions communes (Back Office + Portail + Mobile)

#### Client API
- Centraliser un client HTTP (base URL, headers, retry limité) et une couche “SDK” par domaine : donneurs, dons, analyses, libération, stock, distribution.
- Ne pas exposer de secrets côté frontend : uniquement des variables publiques (`NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`).

#### Gestion des dates & statuts
- Toujours afficher les dates au format local (FR) mais conserver l’ISO côté API.
- Représenter les statuts comme des enums TS alignés sur l’API (évite des bugs de mapping).

#### UX orientée opérationnel
- **Scanner DIN** (mobile) et recherche rapide (web) : accès en 2 actions max.
- États et erreurs explicites : “non libéré”, “tests manquants”, “incompatible”, “déjà distribué”, etc.
