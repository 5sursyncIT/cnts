# CNTS Agent - Application Mobile

Application mobile React Native (Expo) pour les agents de terrain du Centre National de Transfusion Sanguine.

## Fonctionnalités

### ✅ Déjà implémentées
- **Authentification** : Login + MFA (TOTP)
- **Sync offline** : SQLite locale + push/pull automatique
- **Donneurs** : Liste, recherche, création, modification, RDV
- **Dons** : Liste, nouveau don, détail
- **Carte donneur digitale** : QR code, niveau fidélité, points, historique
- **Dashboard** : Stats temps réel (dons aujourd'hui, sync en attente, RDV)

### 📱 Écrans principaux
- `(auth)/login.tsx` - Connexion
- `(auth)/mfa.tsx` - Validation MFA
- `(main)/(home)/index.tsx` - Dashboard
- `(main)/donneurs/*` - Gestion donneurs
- `(main)/dons/*` - Gestion dons
- `(main)/carte/*` - **NOUVEAU** Carte donneur digitale
- `(main)/sync/*` - État de la synchronisation
- `(main)/parametres/*` - Paramètres

## Installation

```bash
cd mobile
npm install
```

## Configuration

Créer un fichier `.env` à la racine du dossier `mobile/` :

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.X:8000/api
```

Remplacer `192.168.1.X` par l'adresse IP de votre machine pour tester sur un appareil physique.

## Développement

### Lancer l'app en mode développement

```bash
# Démarrer le serveur Expo
npm start

# Ou directement sur Android
npm run android

# Ou sur iOS (macOS uniquement)
npm run ios

# Ou sur web
npm run web
```

### Scanner le QR code
1. Installer **Expo Go** sur votre téléphone (Android/iOS)
2. Scanner le QR code affiché dans le terminal
3. L'app se chargera automatiquement

## Tests

```bash
npm test
```

## Build de production

### Android (APK/AAB)

```bash
# Build preview APK
npm run build:preview:android

# Build production AAB
npm run build:prod
```

### iOS (IPA)

```bash
# Build preview IPA
npm run build:preview:ios

# Build production
npm run build:prod
```

> **Note** : Nécessite un compte Expo EAS. Configurer `eas.json` avec votre projet ID.

## Architecture

### Sync Offline
- **SQLite** : Base locale avec `expo-sqlite`
- **Event Queue** : File d'événements à synchroniser
- **Push** : Envoi des événements locaux vers le backend
- **Pull** : Récupération des événements serveur
- **Cursor-based** : Pagination incrémentale avec curseurs

### État global (Zustand)
- `auth.store.ts` : User, token, donneur_id
- `network.store.ts` : État de connexion
- `sync.store.ts` : État de la sync, pending count

### Repositories
- `donneurs.repo.ts` : CRUD donneurs local
- `dons.repo.ts` : CRUD dons local
- `rdv.repo.ts` : CRUD rendez-vous local
- `event-queue.repo.ts` : Gestion de la file de sync

## Nouveau module : Carte Donneur

### Backend API utilisé
- `GET /fidelisation/cartes/donneur/{donneur_id}` - Récupérer la carte
- `GET /fidelisation/points/{carte_id}` - Historique des points

### Écrans
1. **`carte/index.tsx`** - Carte principale
   - QR code scannable (format ISBT/CNTS)
   - Niveau de fidélité (Bronze/Argent/Or/Platine)
   - Points accumulés
   - Total de dons
   - Dates (premier don, dernier don)
   - Grille des paliers

2. **`carte/historique.tsx`** - Historique des points
   - Liste chronologique
   - Type d'opération (Don, Parrainage, Bonus, Utilisation)
   - Montant de points (+/-)
   - Description
   - Date/heure

### Composants UI réutilisés
- `Card` : Cartes blanches avec ombre
- `Badge` : Pastilles de statut
- `Button` : Boutons stylisés
- Thème centralisé dans `constants/theme.ts`

## Dépendances clés

- `expo` : Framework React Native
- `expo-router` : Navigation file-based
- `expo-sqlite` : Base de données locale
- `expo-secure-store` : Stockage sécurisé (token)
- `react-native-qrcode-svg` : Génération QR codes
- `@cnts/api` : Client API type-safe (monorepo)
- `zustand` : State management
- `date-fns` : Manipulation de dates

## Prochaines étapes suggérées

1. **Notifications push** : `expo-notifications` pour rappels de RDV
2. **Collectes mobiles** : Planning, checkin/checkout
3. **Scan de poches** : Caméra pour lire codes-barres ISBT 128
4. **Géolocalisation** : `expo-location` pour les collectes terrain
5. **Photos** : Capture photo donneur avec `expo-image-picker`

## Troubleshooting

### L'app ne se connecte pas au backend
- Vérifier que le backend tourne sur `http://localhost:8000`
- Utiliser l'IP locale (pas `localhost`) pour tester sur appareil physique
- Vérifier les permissions réseau dans `app.json`

### Erreur de sync
- Vérifier que le token est valide dans `expo-secure-store`
- Regarder les logs dans l'écran Sync
- Vider la base SQLite : supprimer et réinstaller l'app

### QR code ne s'affiche pas
- Installer `react-native-svg` : déjà fait via `react-native-qrcode-svg`
- Vérifier que `qr_code_data` est présent dans la carte

## Liens utiles

- [Expo Docs](https://docs.expo.dev/)
- [Expo Router](https://expo.github.io/router/)
- [React Native](https://reactnative.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
