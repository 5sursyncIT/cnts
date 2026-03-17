# SGI-CNTS — Fonctionnalités et Fonctionnement

Ce document décrit chaque module fonctionnel du système, les règles métier qu'il applique et son fonctionnement technique.

---

## 1. Gestion des Donneurs

**Accès :** Back Office `/donneurs` · App Mobile

### Ce que ça fait
- Enregistrement des donneurs avec leurs informations personnelles (nom, prénom, sexe, date de naissance, contact, région, profession).
- Vérification automatique de l'éligibilité avant chaque don (délai minimal respecté).
- Détection des doublons par hachage de la CNI (un donneur = une CNI = un hash unique).
- Liaison optionnelle à un compte UserAccount pour l'espace patient.

### Règles métier
| Règle | Valeur |
|---|---|
| Délai inter-dons homme | ≥ 60 jours |
| Délai inter-dons femme | ≥ 120 jours |
| CNI stockée | Jamais en clair — HMAC-SHA256 avec clé secrète |
| Champ `dernier_don` | Mis à jour automatiquement à chaque don enregistré |

### Fonctionnement technique
La CNI est normalisée (alphanumériques majuscules) puis hashée via `app/core/security.py::hash_cni()`. Le champ `cni_hash` est indexé pour la recherche de doublons sans jamais exposer la CNI brute.

---

## 2. Enregistrement des Dons

**Accès :** Back Office `/dons` · App Mobile (offline-first)

### Ce que ça fait
- Création d'un don rattaché à un donneur éligible.
- Génération automatique d'un **DIN ISBT 128** unique (identifiant international du don).
- Création automatique d'une poche Sang Total (ST) associée.
- Support de l'idempotence : un même don soumis plusieurs fois (réseau instable) ne crée pas de doublon.
- Impression d'une étiquette avec DIN + groupe sanguin + date.

### Machine à états : `statut_qualification`
```
EN_ATTENTE → QUALIFIE → LIBERE
```

### Fonctionnement technique
Le DIN est généré par `app/core/din.py` selon la structure ISBT 128 : code site (`CNTS_DIN_SITE_CODE`, défaut `A0001`) + séquence + checksum ISBT 128. L'idempotence est assurée par une clé `idempotency_key` dans le corps de la requête.

---

## 3. Analyses Biologiques (Laboratoire)

**Accès :** Back Office `/laboratoire/analyses`

### Ce que ça fait
- Saisie des 6 résultats de tests obligatoires par don.
- Mise à jour et correction des résultats par le biologiste.
- Blocage automatique de la libération si un test est positif ou manquant.

### 6 tests obligatoires
| Test | Type | Valeurs possibles |
|---|---|---|
| ABO | Groupage sanguin | A, B, AB, O |
| RH | Phénotypage | POS, NEG |
| VIH | Sérologie infectieuse | POSITIF, NEGATIF, EN_ATTENTE |
| VHB | Sérologie infectieuse | POSITIF, NEGATIF, EN_ATTENTE |
| VHC | Sérologie infectieuse | POSITIF, NEGATIF, EN_ATTENTE |
| SYPHILIS | Sérologie infectieuse | POSITIF, NEGATIF, EN_ATTENTE |

---

## 4. Libération Biologique

**Accès :** Back Office `/laboratoire/liberation`

### Ce que ça fait
- Validation finale par le biologiste avant que les poches puissent être distribuées.
- Vérification automatique de toutes les conditions requises.
- Transition d'état en cascade : Don `LIBERE` → Poches `DISPONIBLE`.

### Conditions de libération (toutes obligatoires)
1. Les 6 tests sont enregistrés
2. ABO et RH sont renseignés
3. VIH, VHB, VHC, SYPHILIS sont tous `NEGATIF`
4. Le don n'est pas déjà libéré

### Fonctionnement technique
`POST /api/liberation/{don_id}/liberer` vérifie les conditions, met à jour `don.statut_qualification = LIBERE` et bascule toutes les poches du don de `NON_DISTRIBUABLE` vers `DISPONIBLE` dans une seule transaction SQL. Chaque étape génère un `log_event()` dans la table d'audit.

---

## 5. Gestion des Stocks (Poches)

**Accès :** Back Office `/stock`

### Ce que ça fait
- Inventaire en temps réel de toutes les poches par type de produit.
- Alertes de péremption configurables (défaut : 7 jours).
- Localisation physique des poches dans l'entrepôt (`emplacement_stock`).
- Résumé du stock disponible / réservé / total par type.

### Types de produits sanguins
| Code | Produit | Durée de vie | Volume |
|---|---|---|---|
| ST | Sang Total | 35 jours | ~450 ml |
| CGR | Concentré de Globules Rouges | 42 jours | ~280 ml |
| PFC | Plasma Frais Congelé | 365 jours | ~200 ml |
| CP | Concentré Plaquettaire | 5 jours | ~60 ml |

### Algorithme FEFO
Les poches disponibles sont toujours triées par `date_peremption ASC`. L'index composite `(type_produit, date_peremption)` garantit des requêtes performantes. La distribution alloue en priorité les poches qui expirent le plus tôt.

### Machine à états d'une poche
```
statut_stock        : EN_STOCK → FRACTIONNEE | DISTRIBUEE
statut_distribution : NON_DISTRIBUABLE → DISPONIBLE → RESERVE → DISTRIBUE
```

---

## 6. Fractionnement du Sang Total

**Accès :** Back Office `/stock/fractionnement`

### Ce que ça fait
- Transformation d'une poche ST en composants (CGR, PFC, CP) selon une recette.
- Application des règles de volumes et de péremptions par type de produit.
- Traçabilité du lien poche source → poches filles.

### Règles de fractionnement
- Seules les poches de type **ST** en statut **EN_STOCK** peuvent être fractionnées.
- Le volume total des composants ne peut pas dépasser `source + CNTS_FRACTIONNEMENT_MAX_OVERAGE_ML` (défaut 250 ml).
- La poche source passe en statut `FRACTIONNEE` après l'opération.
- Les recettes de fractionnement (`/stock/recettes`) sont configurables par les administrateurs.

---

## 7. Chaîne du Froid

**Accès :** Back Office `/stock` (section équipements froids)

### Ce que ça fait
- Gestion du parc de réfrigérateurs et congélateurs (`ColdChainStorage`).
- Enregistrement manuel ou automatique des relevés de température.
- Alertes automatiques en cas de dépassement des seuils min/max configurés.

### Fonctionnement technique
Chaque unité de stockage a des champs `min_temp` et `max_temp`. Un relevé hors plage génère une alerte listée sur `GET /api/stock/cold-chain/alerts`.

---

## 8. Distribution aux Hôpitaux

**Accès :** Back Office `/distribution`

### Ce que ça fait
- Gestion du réseau d'hôpitaux partenaires et de leurs conventions.
- Prise en charge des commandes de produits sanguins.
- Allocation automatique des poches selon l'algorithme FEFO.
- Gestion des réservations avec expiration automatique.

### Machine à états d'une commande
```
BROUILLON → VALIDEE → SERVIE
              ↓
           ANNULEE
```

### Workflow complet d'une commande
1. L'hôpital crée une commande (`BROUILLON`) avec les lignes de produits demandés.
2. La validation (`VALIDEE`) alloue et réserve les poches disponibles selon FEFO.
3. Une affectation optionnelle lie chaque poche à un receveur identifié.
4. Un cross-match valide la compatibilité ABO/RH (obligatoire pour les CGR).
5. La confirmation de service (`SERVIE`) marque les poches comme `DISTRIBUE`.
6. Les réservations non confirmées sont libérées automatiquement après expiration.

---

## 9. Compatibilité (Cross-Match)

**Accès :** Back Office `/distribution/commandes/[id]`

### Ce que ça fait
- Test de compatibilité entre une poche CGR et un receveur.
- Vérification de la compatibilité ABO et Rhésus.
- Blocage de la distribution si le cross-match est `INCOMPATIBLE`.

### Règles de compatibilité ABO
| Groupe receveur | Groupes compatibles (CGR) |
|---|---|
| O | O uniquement |
| A | A, O |
| B | B, O |
| AB | A, B, AB, O (receveur universel) |

---

## 10. Hémovigilance et Rappels de Lots

**Accès :** Back Office `/hemovigilance`

### Ce que ça fait
- Enregistrement de tous les actes transfusionnels.
- Déclenchement de rappels par DIN ou par numéro de lot.
- Notification automatique aux hôpitaux concernés.
- Génération de rapports réglementaires pour les autorités sanitaires.

### Workflow de rappel
```
OUVERT → NOTIFIE → CONFIRME → CLOTURE
```

### Fonctionnement technique
Un rappel identifie toutes les poches concernées (par DIN ou LOT), liste les hôpitaux auxquels elles ont été distribuées, et les receveurs impactés. Les notifications sont envoyées via `POST /hemovigilance/rappels/{id}/notifier`. L'export hôpital/receveur est disponible en CSV.

---

## 11. Analytique et Reporting

**Accès :** Back Office `/analytics`

### Ce que ça fait
- Tableau de bord KPI en temps réel.
- Tendances des dons, du stock et de la distribution sur des périodes configurables.
- Calcul des taux clés : collecte, gaspillage, libération, stock disponible.
- Export des données en CSV / Excel / PDF.

### KPIs disponibles
| KPI | Description |
|---|---|
| `collection-rate` | Dons collectés vs objectif sur la période |
| `wastage-rate` | Poches périmées / total distribuable |
| `liberation-rate` | Dons libérés / dons totaux |
| `stock-available` | Nombre de poches disponibles par type |

---

## 12. Synchronisation Mobile (Offline-First)

**Accès :** Application mobile React Native

### Ce que ça fait
- Les agents terrain saisissent donneurs et dons sans connexion Internet.
- À la reconnexion, les données sont poussées au backend (push) et les mises à jour récupérées (pull).
- Idempotence garantie : un même événement soumis plusieurs fois ne crée pas de doublon.

### Fonctionnement technique
- Le mobile pousse des événements (`donneur.upsert`, `don.create`) via `POST /api/sync/events`.
- Le pull utilise une pagination par curseur (`GET /api/sync/events?since_cursor=...`).
- Les conflits sont résolus côté serveur par ordre de `occurred_at`.
- Les appareils sont identifiés par `SyncDevice` pour le suivi.

---

## 13. Portail Patient

**Accès :** `portal/` — `http://localhost:3000`

### Ce que ça fait
**Pages publiques :**
- Informations sur le don de sang, éligibilité, parcours donneur.
- Actualités, FAQ, services du CNTS.
- Calendrier des collectes mobiles.

**Espace patient authentifié (`/espace-patient`) :**
- Tableau de bord personnel avec historique des dons.
- Carte donneur digitale avec QR code.
- Prise de rendez-vous pour un don.
- Accès aux comptes-rendus et documents médicaux.
- Messagerie sécurisée.

---

## 14. Fidélisation des Donneurs

**Accès :** Back Office `/donneurs/fidelisation` · App Mobile · Portail

### Ce que ça fait
- Attribution automatique de points à chaque don validé.
- Système de niveaux : Bronze → Silver → Gold → Platinum.
- Carte donneur digitale avec QR code (scannable lors des collectes).
- Historique des points et récompenses.
- Campagnes de recrutement ciblées.

---

## 15. Qualité (SMQ)

**Accès :** Back Office `/qualite`

### Ce que ça fait
- Gestion documentaire (procédures, formulaires, enregistrements).
- Déclaration et suivi des non-conformités.
- Plans d'actions correctives et préventives (CAPA).
- Planification et rapports d'audits internes.
- Gestion des équipements avec calendrier de maintenance.
- Suivi des formations et habilitations du personnel.

---

## 16. Facturation

**Accès :** Back Office `/facturation`

### Ce que ça fait
- Création de tarifs par type de produit sanguin (en FCFA).
- Génération de factures pour les hôpitaux partenaires.
- Suivi des paiements.
- Gestion du stock de consommables (poches, tubulures, réactifs).

---

## 17. Notifications Multi-Canal

**Accès :** Back Office · Système interne

### Ce que ça fait
- Envoi de notifications par email, SMS ou WhatsApp.
- Gestion des préférences de notification par utilisateur.
- Retry automatique en cas d'échec.
- Historique de toutes les notifications envoyées.

### Fonctionnement technique
Les notifications sont envoyées en asynchrone via des tâches Celery. Les identifiants SMS et WhatsApp sont configurés via les variables `CNTS_SMS_API_KEY`, `CNTS_WHATSAPP_API_TOKEN`.

---

## 18. Interopérabilité

**Accès :** API interne

### Ce que ça fait
- **FHIR HL7** : Export des données patients et transfusionnelles au format standard FHIR R4 pour les systèmes hospitaliers.
- **DHIS2** : Export des indicateurs épidémiologiques vers la plateforme nationale de santé publique.
- **Automates laboratoire** : Interfaces pour l'import automatique des résultats d'analyseurs.

---

## 19. Étiquetage ISBT 128

**Accès :** Back Office `/production/etiquetage`

### Ce que ça fait
- Génération d'étiquettes DataMatrix conformes ISBT 128 pour chaque poche.
- Validation du checksum ISBT 128 des DIN.
- Contenu de l'étiquette : DIN · groupe sanguin · type produit · date péremption — **jamais de données nominatives**.

---

## 20. Observabilité et Audit

### Ce que ça fait
- **Piste d'audit** : Tout changement d'état est enregistré dans `TraceEvent` avec : type d'agrégat, ID, type d'événement, payload JSONB, horodatage.
- **Métriques Prometheus** : Nombre de requêtes, durées de réponse, labellisées par méthode/route/statut.
- **Request ID** : Header `X-Request-ID` propagé sur toutes les réponses pour le suivi distribué.
- **W3C Trace Context** : Header `traceparent` injecté automatiquement.

### Endpoints d'observabilité
```
GET /api/observability/metrics       # Métriques Prometheus
GET /api/observability/trace/events  # Journal d'audit paginé
GET /api/trace/events/{event_id}     # Détail d'un événement
```
