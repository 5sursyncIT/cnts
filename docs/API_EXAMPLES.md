# Exemples d'utilisation de l'API SGI-CNTS

## Workflow complet : De la collecte à la libération

### 1. Créer un donneur

```bash
curl -X POST http://localhost:8000/donneurs \
  -H "Content-Type: application/json" \
  -d '{
    "cni": "1234567890123",
    "nom": "Diop",
    "prenom": "Amadou",
    "sexe": "H"
  }'
```

Réponse :
```json
{
  "id": "1ba02cbe-4e2d-4597-bb8c-87506bc74cb0",
  "cni_hash": "a1b2c3...",
  "nom": "Diop",
  "prenom": "Amadou",
  "sexe": "H",
  "dernier_don": null
}
```

### 2. Vérifier l'éligibilité du donneur

```bash
curl http://localhost:8000/donneurs/1ba02cbe-4e2d-4597-bb8c-87506bc74cb0/eligibilite
```

Réponse :
```json
{
  "eligible": true,
  "eligible_le": null
}
```

### 3. Enregistrer un don

```bash
curl -X POST http://localhost:8000/dons \
  -H "Content-Type: application/json" \
  -d '{
    "donneur_id": "1ba02cbe-4e2d-4597-bb8c-87506bc74cb0",
    "date_don": "2026-02-02",
    "type_don": "SANG_TOTAL",
    "idempotency_key": "collecte-mobile-001"
  }'
```

Réponse :
```json
{
  "id": "423aa046-11fd-46a6-a4dc-220551633c7a",
  "donneur_id": "1ba02cbe-4e2d-4597-bb8c-87506bc74cb0",
  "din": "CNTS26033000002",
  "date_don": "2026-02-02",
  "type_don": "SANG_TOTAL",
  "statut_qualification": "EN_ATTENTE"
}
```

**Note** : Une poche de type ST (Sang Total) est créée automatiquement avec le don.

### 4. Créer les analyses obligatoires

Les 6 tests obligatoires pour la libération biologique :

```bash
# Groupage ABO
curl -X POST http://localhost:8000/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
    "type_test": "ABO",
    "resultat": "NEGATIF",
    "note": "Groupe O"
  }'

# Groupage Rhésus
curl -X POST http://localhost:8000/analyses \
  -H "Content-Type: application/json" \
  -d '{
    "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
    "type_test": "RH",
    "resultat": "NEGATIF",
    "note": "Rh positif"
  }'

# Tests sérologiques (VIH, VHB, VHC, SYPHILIS)
for TEST in VIH VHB VHC SYPHILIS; do
  curl -X POST http://localhost:8000/analyses \
    -H "Content-Type: application/json" \
    -d "{
      \"don_id\": \"423aa046-11fd-46a6-a4dc-220551633c7a\",
      \"type_test\": \"$TEST\",
      \"resultat\": \"NEGATIF\"
    }"
done
```

### 5. Vérifier la possibilité de libération

```bash
curl http://localhost:8000/liberation/423aa046-11fd-46a6-a4dc-220551633c7a
```

Réponse (si tous les tests sont négatifs) :
```json
{
  "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
  "din": "CNTS26033000002",
  "statut_qualification": "EN_ATTENTE",
  "liberable": true,
  "raison": null,
  "analyses": [...]
}
```

Réponse (si des tests manquent) :
```json
{
  "liberable": false,
  "raison": "Tests manquants: RH, SYPHILIS",
  ...
}
```

Réponse (si un test est positif) :
```json
{
  "liberable": false,
  "raison": "Tests non conformes: VIH=POSITIF",
  ...
}
```

### 6. Effectuer la libération biologique

```bash
curl -X POST http://localhost:8000/liberation/423aa046-11fd-46a6-a4dc-220551633c7a/liberer
```

Réponse :
```json
{
  "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
  "din": "CNTS26033000002",
  "statut_qualification": "LIBERE",
  "liberable": true,
  "raison": null,
  "analyses": [...]
}
```

**Effet** :
- Le don passe à `statut_qualification: "LIBERE"`
- Toutes les poches associées passent à `statut_distribution: "DISPONIBLE"`

## Gestion du stock

### Lister les poches avec tri FEFO

```bash
# FEFO : First Expired, First Out
curl "http://localhost:8000/poches?sort_by_expiration=true&statut_distribution=DISPONIBLE"
```

### Obtenir le résumé du stock

```bash
curl http://localhost:8000/poches/stock/summary
```

Réponse :
```json
[
  {
    "type_produit": "ST",
    "quantite_disponible": 15,
    "quantite_reservee": 3,
    "quantite_totale": 18
  },
  {
    "type_produit": "CGR",
    "quantite_disponible": 42,
    "quantite_reservee": 8,
    "quantite_totale": 50
  }
]
```

### Alertes de péremption

```bash
# Poches qui périment dans les 7 prochains jours
curl "http://localhost:8000/poches/alertes/peremption?jours=7"

# Poches qui périment dans les 3 prochains jours (critique)
curl "http://localhost:8000/poches/alertes/peremption?jours=3"
```

Réponse :
```json
[
  {
    "id": "7437aaad-c7d8-43ac-882a-116357ec567c",
    "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
    "din": "CNTS26033000002",
    "type_produit": "ST",
    "date_peremption": "2026-02-09",
    "jours_restants": 7,
    "emplacement_stock": "FRIGO_A1",
    "statut_distribution": "DISPONIBLE"
  }
]
```

### Créer un produit dérivé (fractionnement)

```bash
# Créer un CGR (Concentré de Globules Rouges)
curl -X POST http://localhost:8000/poches \
  -H "Content-Type: application/json" \
  -d '{
    "don_id": "423aa046-11fd-46a6-a4dc-220551633c7a",
    "type_produit": "CGR",
    "date_peremption": "2026-03-16",
    "emplacement_stock": "FRIGO_B2"
  }'
```

### Mettre à jour l'emplacement d'une poche

```bash
curl -X PATCH http://localhost:8000/poches/7437aaad-c7d8-43ac-882a-116357ec567c \
  -H "Content-Type: application/json" \
  -d '{
    "emplacement_stock": "FRIGO_C3"
  }'
```

### Réserver une poche pour distribution

```bash
curl -X PATCH http://localhost:8000/poches/7437aaad-c7d8-43ac-882a-116357ec567c \
  -H "Content-Type: application/json" \
  -d '{
    "statut_distribution": "RESERVE"
  }'
```

## Recherche et filtrage

### Rechercher un donneur par CNI

```bash
curl "http://localhost:8000/donneurs?cni=1234567890123"
```

### Lister les analyses d'un don

```bash
curl "http://localhost:8000/analyses?don_id=423aa046-11fd-46a6-a4dc-220551633c7a"
```

### Lister les analyses en attente

```bash
curl "http://localhost:8000/analyses?resultat=EN_ATTENTE"
```

### Filtrer les poches par type et emplacement

```bash
curl "http://localhost:8000/poches?type_produit=CGR&emplacement_stock=FRIGO_A1"
```

## Documentation interactive

L'API expose une documentation Swagger interactive :

```
http://localhost:8000/docs
```

Et une documentation ReDoc alternative :

```
http://localhost:8000/redoc
```

## Tests avec idempotence (mobile sync)

```bash
# Premier envoi
curl -X POST http://localhost:8000/dons \
  -H "Content-Type: application/json" \
  -d '{
    "donneur_id": "1ba02cbe-4e2d-4597-bb8c-87506bc74cb0",
    "date_don": "2026-02-02",
    "type_don": "SANG_TOTAL",
    "idempotency_key": "mobile-device-001-don-20260202-1430"
  }'

# Deuxième envoi (retry) - retourne le même résultat sans créer de doublon
curl -X POST http://localhost:8000/dons \
  -H "Content-Type: application/json" \
  -d '{
    "donneur_id": "1ba02cbe-4e2d-4597-bb8c-87506bc74cb0",
    "date_don": "2026-02-02",
    "type_don": "SANG_TOTAL",
    "idempotency_key": "mobile-device-001-don-20260202-1430"
  }'
```

Les deux requêtes retournent le même don sans créer de doublon, garantissant la cohérence des données lors de synchronisations mobiles avec connectivité intermittente.
