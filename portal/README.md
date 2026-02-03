# Portail Web Patient (Next.js) — SGI-CNTS

Deux volets :
- Site vitrine (accueil, services, équipe médicale, contact, actualités)
- Espace patient sécurisé (rendez-vous, comptes-rendus, messagerie, documents, notifications)

Socle GDPR :
- Bannière de consentement
- Consentement explicite requis pour l’accès aux données de santé dans l’espace patient

## Démarrer
Pré-requis : Node.js 20+.

Depuis la racine :

```bash
npm install --workspaces --include-workspace-root
npm -w portal run dev
```

URL : http://localhost:3001 (ou port suivant disponibilité)

## Variables d’environnement (dev)
Créer `portal/.env.local` :

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
PORTAL_SESSION_SECRET=change-me
PORTAL_DEMO_PATIENT_EMAIL=patient@cnts.local
PORTAL_DEMO_PATIENT_PASSWORD=patient
```
