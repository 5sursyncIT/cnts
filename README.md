# SGI-CNTS (CNTS Dakar)

Le projet vise une traçabilité complète “de la veine du donneur à la veine du receveur”. Le cadrage métier et la stack cible sont décrits dans [docs/DEVBOOK.md](file:///home/youssoupha/project/cnts/docs/DEVBOOK.md).

## Démarrage rapide (API + PostgreSQL)
1. Copier l’environnement :

```bash
cp .env.example .env
```

2. Lancer l’infra et l’API :

```bash
docker compose up --build
```

3. Vérifier :
 - `GET http://localhost:8000/health`
 - `GET http://localhost:8000/health/db`

## Structure du dépôt
- `backend/` : API FastAPI + modèles de données (Labo & Stock implémentés)
- `web/` : Back Office (Next.js) — admin sécurisé (MFA/RBAC/audit)
- `portal/` : Portail web patient (Next.js) — vitrine + espace patient
- `mobile/` : application de collecte (React Native, offline-first) — à initialiser
- `docs/` : Documentation technique (DEVBOOK.md, CHANGELOG.md)

## Démarrage rapide (Frontends)
Pré-requis : Node.js 20+.

```bash
npm install --workspaces --include-workspace-root
```

Back Office (admin) :
```bash
npm -w web run dev
```

Portail patient :
```bash
npm -w portal run dev
```

## État d'avancement

- ✅ Module Donneurs (gestion, éligibilité)
- ✅ Module Dons (collecte, DIN, étiquetage)
- ✅ Module Laboratoire (analyses, libération biologique)
- ✅ Module Stock (poches, FEFO, alertes de péremption)
- ⏳ Module Distribution (à venir)
- ⏳ Module Hémovigilance (à venir)

## Endpoints API disponibles

### Donneurs
- `POST /donneurs` - Créer un donneur
- `GET /donneurs` - Lister les donneurs
- `GET /donneurs/{id}/eligibilite` - Vérifier éligibilité

### Dons
- `POST /dons` - Enregistrer un don
- `GET /dons` - Lister les dons
- `GET /dons/{id}/etiquette` - Générer étiquette

### Laboratoire
- `POST /analyses` - Créer une analyse
- `GET /analyses` - Lister les analyses
- `GET /liberation/{don_id}` - Vérifier libération
- `POST /liberation/{don_id}/liberer` - Libérer un don

### Stock
- `GET /poches` - Lister les poches (avec tri FEFO)
- `GET /poches/stock/summary` - Résumé du stock
- `GET /poches/alertes/peremption` - Alertes de péremption

Voir la documentation complète : `GET http://localhost:8000/docs`
