# 📱 Système de Gestion des Erreurs et Mode Hors Ligne

## 📋 Overview

Le système implémente :
- **Pages d'erreur personnalisées** (404, 500)
- **Détection du mode hors ligne** avec banneau
- **Service Worker** pour le cache des pages
- **Synchronisation automatique** à la reconnexion

---

## 🏗️ Architecture

### Fichiers Créés

```
client/
├── src/
│   ├── pages/
│   │   ├── Error404.jsx           # Page 404 personnalisée
│   │   ├── Error500.jsx           # Page 500 personnalisée
│   │   └── ErrorOffline.jsx       # Page hors ligne
│   ├── components/
│   │   └── OfflineBanner.jsx      # Banneau de détection hors ligne
│   ├── services/
│   │   └── serviceWorkerManager.js # Gestion du Service Worker
│   ├── hooks/
│   │   └── useErrorHandler.js     # Hooks pour gestion d'erreurs
│   └── App.jsx                    # Mise à jour avec Service Worker
├── public/
│   └── service-worker.js          # Service Worker pour le cache
└── src/
    └── index.css                  # Animations CSS
```

---

## 🔧 Configuration

### 1. **Service Worker (`service-worker.js`)**

Stratégies de cache :

- **Assets Statiques** (.js, .css, .woff2) → Cache First
  - Utilise d'abord le cache local
  - Récupère la dernière version ensuite

- **API/Pages** → Network First
  - Essaie d'abord le réseau
  - Utilise le cache si hors ligne

- **Runtime Cache**
  - Stocke les données API récentes
  - Permet la consultation hors ligne

### 2. **OfflineBanner Component**

```jsx
Affiche un banneau quand :
- La connexion Internet est perdue
- La reconnexion est établie

Banneau rouge/orange : Hors ligne
Banneau vert : Reconnecté
```

### 3. **Hooks Personnalisés**

#### `useErrorHandler()`
```javascript
const { error, errorCode, handleError, clearError } = useErrorHandler();

handleError(500, 'Message d\'erreur');
clearError();
```

#### `useOnlineStatus()`
```javascript
const isOnline = useOnlineStatus();
if (!isOnline) {
  // Afficher le mode hors ligne
}
```

---

## 📊 Flux de Fonctionnement

### Démarrage de l'Application

```
1. App.jsx démarre
   ↓
2. useEffect enregistre le Service Worker
   ↓
3. OfflineBanner se monte
   ↓
4. Écoute les événements online/offline
   ↓
5. Service Worker met en cache les assets
```

### Mode Hors Ligne

```
Utilisateur perd la connexion
   ↓
Événement 'offline' déclenché
   ↓
OfflineBanner devient visible
   ↓
Service Worker répond avec le cache
   ↓
Pages et données en cache sont accessibles
```

### Reconnexion

```
Utilisateur récupère la connexion
   ↓
Événement 'online' déclenché
   ↓
Banneau rouge disparaît
   ↓
Banneau vert de reconnexion (3s)
   ↓
Données se synchronisent automatiquement
```

---

## 🎨 Pages d'Erreur

### Error404.jsx
- Personnalisée avec le gradient bleu
- Boutons : Retour à l'accueil / Retour précédent
- Code erreur : 404 Not Found

### Error500.jsx
- Personnalisée avec le gradient rouge
- Boutons : Retour à l'accueil / Rafraîchir
- Code erreur : 500 Internal Server Error

### ErrorOffline.jsx
- Personnalisée avec le gradient ambre
- Message explicatif du mode hors ligne
- Boutons : Vérifier la connexion / Accueil en cache

---

## 🚀 Utilisation

### 1. **Enregistrement Service Worker**

Automatique dans `App.jsx` via `registerServiceWorker()`

### 2. **Afficher Banneau Hors Ligne**

Automatique via `<OfflineBanner />` dans `App.jsx`

### 3. **Gérer les Erreurs**

```javascript
import { useErrorHandler } from './hooks/useErrorHandler';

function MyComponent() {
  const { error, handleError } = useErrorHandler();
  
  try {
    // Votre code
  } catch (err) {
    handleError(500, err.message);
  }
}
```

### 4. **Vérifier l'État Online**

```javascript
import { useOnlineStatus } from './hooks/useErrorHandler';

function MyComponent() {
  const isOnline = useOnlineStatus();
  
  return (
    <div>
      {isOnline ? 'En ligne' : 'Hors ligne'}
    </div>
  );
}
```

---

## 🧪 Test en Mode Hors Ligne

### Avec les DevTools (Chrome/Firefox)

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Network**
3. Sélectionner **Offline** dans le dropdown
4. Recharger la page

### Simulation en Dev

```javascript
// Dans la console
navigator.onLine = false; // Simule hors ligne
// Ou arrêter le serveur backend
```

---

## 📦 Cache Management

### Taille du Cache

Le Service Worker gère automatiquement :
- `callfix-v2-cache-v1` → Assets statiques
- `callfix-v2-runtime-v1` → Données API

### Nettoyage

Le Service Worker supprime automatiquement les anciens caches lors de l'activation.

### Actualiser le Cache

```javascript
// Dans la console
caches.delete('callfix-v2-cache-v1').then(() => {
  location.reload();
});
```

---

## ⚠️ Limitations & Notes

1. **Service Worker nécessite HTTPS** en production (sauf localhost)
2. **Les modifications POST/PUT ne sont pas en cache**
3. **Les données en cache peuvent être obsolètes**
4. **Navigateur doit supporter Service Workers** (IE non supporté)

---

## 📚 Ressources

- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN - Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)

---

## ✅ Checklist de Mise en Production

- [ ] Tester le Service Worker en localhost
- [ ] Vérifier que HTTPS est activé
- [ ] Tester le mode hors ligne avec DevTools
- [ ] Vérifier la reconnexion automatique
- [ ] Tester sur mobile (Chrome Mobile, Safari)
- [ ] Vérifier les performances du cache
- [ ] Configurer la politique de cache appropriée

