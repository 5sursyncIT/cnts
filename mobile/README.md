# Mobile (React Native) — Collectes offline-first

Ce dossier est réservé à l’application de collecte mobile (offline-first) décrite dans [DEVBOOK.md](file:///home/youssoupha/project/cnts/docs/DEVBOOK.md#L117-L185).

## Initialisation recommandée (Expo)

```bash
cd mobile
npm create expo@latest . -- --template blank-typescript
```

## Conventions (cibles)
- Persistance locale (SQLite) + file d’attente d’événements à synchroniser (idempotency_key).
- Synchronisation incrémentale par curseur (pas de “dump” complet).
