# SGI-CNTS — Pistes d'Amélioration

Ce document recense les améliorations identifiées à partir de l'analyse du code existant, classées par priorité et domaine.

---

## Priorité Haute — Qualité et Robustesse

### 1. Tests automatisés à compléter

**Constat :** La couverture de tests couvre les modules Core (liberation, poches, distribution, sync) mais de nombreux modules de Phase 2 à 6 n'ont pas de tests dédiés.

**Impact :** Risque de régression lors d'évolutions sur les modules qualité, facturation, fidélisation, FHIR, DHIS2.

**Action recommandée :**
- Atteindre 80% de couverture sur les modules Phase 2–6 (objectif npm `test:coverage`).
- Ajouter des tests d'intégration pour les workflows complets (fractionnement → distribution → acte transfusionnel).
- Corriger les 2 tests `test_patient.py` qui dépendent de l'état des migrations.

---

### 2. Validation de l'implémentation API Key

**Constat :** Dans `app/api/deps.py`, le bloc de validation de la clé API (`X-API-Key`) dans `require_auth_in_production` est un stub non fonctionnel :
```python
if api_key and hasattr(settings, "api_keys"):
    # API key validation could be added here
    pass
```

**Impact :** En production, un header `X-API-Key` valide n'authentifie pas l'utilisateur, ce qui peut créer de la confusion et des failles potentielles.

**Action recommandée :** Soit implémenter la validation via un modèle `ApiKey` en base, soit supprimer le paramètre `api_key` de `require_auth_in_production` pour éviter toute ambiguïté.

---

### 3. Migrations Alembic à consolider

**Constat :** Il existe 20+ fichiers de migration dans `backend/alembic/versions/`, dont plusieurs semblent corriger ou restaurer des états précédents (`restore_donneurs_updated_at`, `remove_cni_plaintext`). Certaines migrations portent des noms auto-générés (hash) plutôt que descriptifs.

**Impact :** Difficulté à auditer l'historique de schéma, risque d'erreur lors du déploiement sur un environnement neuf.

**Action recommandée :**
- Consolider les migrations en une seule migration initiale propre pour les nouveaux déploiements.
- Renommer les migrations avec des préfixes numériques et descriptions claires.
- Ajouter un test de migration dans la CI (`alembic upgrade head` sur une base vide).

---

### 4. Sécurisation du champ `statut_qualification` non contraint

**Constat :** Les transitions d'états (`EN_ATTENTE → QUALIFIE → LIBERE` pour les dons, etc.) sont appliquées uniquement au niveau de l'API. Il n'existe pas de contrainte `CHECK` en base de données pour interdire des valeurs invalides.

**Impact :** Une insertion directe en base ou un bug dans un endpoint secondaire pourrait corrompre l'état d'un don ou d'une poche.

**Action recommandée :** Ajouter des contraintes `CHECK` PostgreSQL sur les colonnes de statut via Alembic, ou utiliser des types `ENUM` PostgreSQL natifs.

---

## Priorité Moyenne — Performance et Scalabilité

### 5. Mise en cache des données de référence

**Constat :** Les données de référence rarement modifiées (règles de péremption, recettes de fractionnement, liste des régions du Sénégal, tarifs) sont rechargées depuis la base à chaque requête.

**Action recommandée :** Mettre en cache ces endpoints dans Redis avec un TTL court (5–15 min) via un décorateur de cache. Celery Beat peut invalider le cache lors des mises à jour.

---

### 6. Requêtes N+1 potentielles sur les listings

**Constat :** Certains endpoints de liste chargent des relations (ex : `poche.don`, `commande.lignes`) sans `selectinload` explicite, ce qui peut générer des requêtes N+1 sous charge.

**Action recommandée :** Auditer tous les endpoints `GET /resource` avec l'option `echo=True` de SQLAlchemy en dev, et ajouter les `options(selectinload(...))` manquants.

---

### 7. Pagination curseur pour les grands datasets

**Constat :** La pagination par `offset/limit` est utilisée partout. Sur les tables à fort volume (TraceEvent, Notification, actes transfusionnels), `OFFSET` grand est coûteux en PostgreSQL.

**Action recommandée :** Migrer les endpoints à fort volume vers une pagination par curseur (keyset pagination sur `id` ou `created_at`), sur le modèle de `/hemovigilance/partenaires/flux` qui l'implémente déjà correctement.

---

### 8. Workers Celery non supervisés

**Constat :** Dans `docker-compose.yml`, les workers Celery n'ont pas de configuration de `max_retries`, `task_acks_late`, ni de dead-letter queue pour les tâches échouées.

**Impact :** Une tâche de notification en échec (SMTP indisponible, quota SMS dépassé) est perdue sans trace ni alerte.

**Action recommandée :**
- Configurer `task_acks_late = True` pour éviter la perte de messages.
- Ajouter une dead-letter queue (via Redis streams ou une table `FailedTask`).
- Exposer un endpoint `/observability/celery` avec l'état des workers et files d'attente.

---

## Priorité Normale — Expérience Utilisateur et Fonctionnalités

### 9. Dashboard analytique enrichi

**Constat :** L'endpoint `/analytics/dashboard` retourne des KPIs calculés à la demande. Il n'existe pas encore de visualisations historiques pré-calculées ni de comparaison inter-périodes.

**Action recommandée :**
- Pré-calculer les KPIs quotidiens via une tâche Celery Beat et les stocker dans une table `DailyKPI`.
- Ajouter un endpoint de comparaison périodique (ex : ce mois vs mois précédent).
- Intégrer des graphiques interactifs dans le Back Office (ex : Recharts ou Chart.js).

---

### 10. Questionnaire pré-don digital

**Constat :** Le DEVBOOK mentionne la digitalisation du questionnaire pré-don avec "système de flagging pour le médecin", mais ce module n'est pas encore implémenté dans les routes disponibles.

**Action recommandée :** Ajouter un module `questionnaire` avec :
- Formulaire de contre-indications temporaires/permanentes.
- Système de score de risque et flag automatique pour validation médicale.
- Stockage des réponses dans un champ JSONB sur le modèle `Don`.

---

### 11. Notification proactive d'éligibilité

**Constat :** Le système calcule l'éligibilité à la demande mais n'envoie pas de rappel automatique au donneur quand il redevient éligible.

**Action recommandée :** Ajouter une tâche Celery Beat quotidienne qui :
1. Identifie les donneurs dont la date d'éligibilité tombe dans les 7 prochains jours.
2. Envoie un SMS/WhatsApp de rappel via le canal préféré du donneur.

---

### 12. Application mobile — synchronisation conflits

**Constat :** La résolution de conflits de synchronisation est basée uniquement sur `occurred_at`. En cas de modification concurrent d'un même donneur (agent A en terrain + agent B au bureau), la stratégie "last write wins" peut écraser des données.

**Action recommandée :** Implémenter une résolution de conflit par champ (field-level merge) ou exposer les conflits à l'opérateur via une interface de réconciliation dans le Back Office.

---

### 13. Internationalisation (i18n)

**Constat :** L'interface est entièrement en français. Le DEVBOOK mentionne le wolof pour le questionnaire donneur audio, mais aucune infrastructure i18n n'est en place.

**Action recommandée :**
- Intégrer `next-intl` dans `web/` et `portal/` pour le support multilingue.
- Préparer les fichiers de traduction FR/Wolof pour les messages les plus fréquents (questionnaire, notifications SMS, portail patient).

---

## Priorité Basse — Dette Technique

### 14. Centraliser la logique de machine à états

**Constat :** Les transitions d'états des entités principales (Don, Poche, Commande, RappelLot) sont implémentées avec des blocs `if/raise HTTPException` disséminés dans les routes. Cela rend les règles métier difficiles à tester unitairement.

**Action recommandée :** Extraire la logique de transition dans des classes de machine à états dans `app/core/` (ex : `DonStateMachine`, `CommandeStateMachine`) testables indépendamment de FastAPI.

---

### 15. Séparation des schémas Pydantic par usage

**Constat :** Certains schémas dans `schemas/` mélangent les usages lecture/écriture avec de nombreux champs `Optional`. La convention `{Entity}Create / {Entity}Update / {Entity}Out` est en place mais pas systématiquement respectée.

**Action recommandée :** Auditer et compléter les schémas manquants, en particulier pour les modules Phase 2–6, pour garantir la cohérence des DTOs exposés dans la documentation OpenAPI.

---

### 16. Documentation OpenAPI enrichie

**Constat :** Les endpoints FastAPI génèrent automatiquement la documentation OpenAPI (`/docs`), mais peu d'endpoints ont des `description`, `summary` ou exemples (`responses`) renseignés.

**Action recommandée :**
- Ajouter des `summary` et `description` Markdown sur chaque endpoint.
- Définir des exemples de réponse dans les schémas Pydantic (`model_config = {"json_schema_extra": {...}}`).
- Publier la documentation OpenAPI statique dans `docs/`.

---

### 17. Variables d'environnement non documentées

**Constat :** Certaines variables comme `CNTS_RATE_LIMIT_IN_DEV` ou `CNTS_FRACTIONNEMENT_MAX_OVERAGE_ML` ne sont pas listées dans le CLAUDE.md ni dans un fichier `.env.example`.

**Action recommandée :** S'assurer que `.env.example` liste exhaustivement toutes les variables de `app/core/config.py` avec leurs valeurs par défaut et commentaires explicatifs.

---

## Résumé des Priorités

| # | Amélioration | Priorité | Effort estimé |
|---|---|---|---|
| 1 | Compléter la couverture de tests | Haute | Moyen |
| 2 | Implémenter ou supprimer le stub API Key | Haute | Faible |
| 3 | Consolider les migrations Alembic | Haute | Moyen |
| 4 | Contraintes CHECK sur les statuts en base | Haute | Faible |
| 5 | Cache Redis pour données de référence | Moyenne | Faible |
| 6 | Corriger les requêtes N+1 | Moyenne | Moyen |
| 7 | Pagination curseur sur grands datasets | Moyenne | Moyen |
| 8 | Supervision des workers Celery | Moyenne | Faible |
| 9 | Dashboard analytique enrichi | Normale | Élevé |
| 10 | Questionnaire pré-don digital | Normale | Élevé |
| 11 | Rappels automatiques d'éligibilité | Normale | Faible |
| 12 | Résolution de conflits sync mobile | Normale | Élevé |
| 13 | Internationalisation FR/Wolof | Normale | Moyen |
| 14 | Classes de machine à états | Basse | Moyen |
| 15 | Compléter les schémas Pydantic | Basse | Moyen |
| 16 | Documentation OpenAPI enrichie | Basse | Faible |
| 17 | Compléter `.env.example` | Basse | Faible |
