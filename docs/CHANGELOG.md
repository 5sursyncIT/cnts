# Journal des Modifications - SGI-CNTS

## [0.2.0] - 2026-02-02

### ✅ Module Laboratoire & Qualification (Complété)

#### Nouvelles Fonctionnalités

**1. Gestion des Analyses Biologiques** (`/analyses`)
- `POST /analyses` - Créer une nouvelle analyse (ABO, RH, VIH, VHB, VHC, SYPHILIS)
- `GET /analyses` - Lister les analyses avec filtres (don_id, type_test, resultat)
- `GET /analyses/{analyse_id}` - Récupérer une analyse spécifique
- `PATCH /analyses/{analyse_id}` - Mettre à jour le résultat d'une analyse
- `DELETE /analyses/{analyse_id}` - Supprimer une analyse

**2. Libération Biologique** (`/liberation`)
- `GET /liberation/{don_id}` - Vérifier si un don peut être libéré
  - Vérifie que tous les tests obligatoires sont effectués
  - Vérifie qu'aucun test n'est POSITIF ou EN_ATTENTE
  - Retourne les raisons en cas d'impossibilité de libération

- `POST /liberation/{don_id}/liberer` - Effectuer la libération biologique
  - Met à jour le statut du don: `EN_ATTENTE` → `LIBERE`
  - Met à jour les poches associées: `NON_DISTRIBUABLE` → `DISPONIBLE`
  - **RÈGLE CRITIQUE**: Impossible si un test est positif ou manquant

**3. Gestion du Stock des Poches** (`/poches`)
- `POST /poches` - Créer une poche (produit dérivé)
- `GET /poches` - Lister les poches avec tri FEFO optionnel
- `GET /poches/{poche_id}` - Récupérer une poche spécifique
- `PATCH /poches/{poche_id}` - Mettre à jour une poche
- `DELETE /poches/{poche_id}` - Supprimer une poche (sauf si DISTRIBUE)

**4. Outils de Gestion du Stock**
- `GET /poches/stock/summary` - Résumé du stock par type de produit
  - Quantités disponibles, réservées et totales par type (ST, CGR, PFC, CP)

- `GET /poches/alertes/peremption` - Alertes de péremption
  - Liste les poches qui périment dans N jours (par défaut 7)
  - Trie par date de péremption croissante
  - Filtre sur les poches DISPONIBLE et RESERVE uniquement

#### Règles Métier Implémentées

1. **Tests Obligatoires**: 6 tests requis pour la libération
   - ABO, RH (groupage sanguin)
   - VIH, VHB, VHC, SYPHILIS (sérologie infectieuse)

2. **Blocage Électronique**: Une poche ne peut être DISPONIBLE que si:
   - Le don parent est LIBERE
   - Tous les tests obligatoires sont NEGATIF

3. **Protection des Données**:
   - Impossible de supprimer une poche déjà DISTRIBUE
   - Impossible de rendre DISPONIBLE une poche si le don n'est pas LIBERE

4. **Tri FEFO**: First Expired, First Out
   - Option `sort_by_expiration=true` dans `/poches`
   - Priorité aux poches qui périment en premier

#### Modèles de Données

**Analyse**
```python
- id: UUID
- don_id: UUID (FK)
- type_test: str (ABO, RH, VIH, etc.)
- resultat: str (EN_ATTENTE, POSITIF, NEGATIF)
- note: str (optionnel)
- validateur_id: UUID (optionnel)
- created_at: datetime
```

**Poche**
```python
- id: UUID
- don_id: UUID (FK)
- type_produit: str (ST, CGR, PFC, CP)
- date_peremption: date
- emplacement_stock: str
- statut_distribution: str (NON_DISTRIBUABLE, DISPONIBLE, RESERVE, DISTRIBUE)
- created_at: datetime
```

#### Tests Automatisés

**`tests/test_liberation.py`** (10 tests)
- Vérification des tests obligatoires manquants
- Détection des tests POSITIF ou EN_ATTENTE
- Libération biologique réussie avec tous les tests NEGATIF
- Mise à jour automatique du statut des poches
- Protection contre la libération de dons non éligibles
- Idempotence de la libération

**`tests/test_poches.py`** (8 tests)
- Création de poches produits dérivés
- Tri FEFO (First Expired First Out)
- Alertes de péremption avec filtres
- Résumé du stock par type de produit
- Protection contre la mise à jour de poches non libérées
- Protection contre la suppression de poches distribuées

### 🔧 Améliorations Techniques

- **Pagination**: Tous les endpoints de liste supportent `limit`/`offset`
- **Filtrage**: Filtres multiples sur les analyses et poches
- **Optimisation**: Requêtes avec `selectinload` pour éviter N+1
- **Validation**: Contraintes Pydantic strictes sur tous les schémas
- **Documentation**: Docstrings détaillés sur tous les endpoints

### 📊 Métriques

- **Nouveaux endpoints**: 16
- **Nouveaux schémas**: 10
- **Tests ajoutés**: 18
- **Fichiers créés**: 8
- **Lignes de code**: ~1000

### 🚀 Prochaines Étapes (Roadmap)

1. ✅ MVP : Module de collecte et étiquetage
2. ✅ Module Labo et validation des tests
3. ⏳ Gestion avancée du stock et fractionnement (ST → CGR/PFC/CP)
4. ⏳ Module de distribution et interface hôpitaux
5. ⏳ Hémovigilance et traçabilité complète

## [0.1.0] - 2026-02-02

### 🎯 Fonctionnalités Initiales

**Module Donneurs**
- Création et gestion des donneurs
- Hachage CNI pour protection de la vie privée
- Calcul d'éligibilité (H: 2 mois, F: 4 mois)

**Module Dons**
- Création de dons avec génération automatique de DIN (ISBT 128)
- Support de l'idempotence pour synchronisation mobile
- Création automatique de poche ST (Sang Total)
- Génération d'étiquettes avec DIN

**Infrastructure**
- API FastAPI avec PostgreSQL
- Migrations Alembic
- Configuration Docker Compose
- Logging structuré
- Health checks (API + DB)
