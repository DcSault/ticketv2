# 🚀 Guide d'Installation - TicketV2

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** v18 ou supérieur ([télécharger](https://nodejs.org/))
- **PostgreSQL** v14 ou supérieur ([télécharger](https://www.postgresql.org/download/))
- **npm** (inclus avec Node.js)

## Installation Étape par Étape

### 1. Créer la base de données PostgreSQL

Ouvrez PostgreSQL et créez la base de données :

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE ticketv2;

# Quitter
\q
```

### 2. Configuration de l'environnement

```powershell
# Copier le fichier d'exemple
Copy-Item .env.example .env

# Éditer le fichier .env avec vos paramètres
notepad .env
```

**Configurez ces variables dans `.env` :**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticketv2
DB_USER=postgres
DB_PASSWORD=VOTRE_MOT_DE_PASSE_POSTGRESQL

JWT_SECRET=changez-cette-cle-secrete-en-production
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### 3. Installer les dépendances

```powershell
# Dépendances backend
npm install

# Dépendances frontend
cd client
npm install
cd ..
```

### 4. Initialiser la base de données

```powershell
# Créer les tables et les données initiales
npm run db:setup
```

Cette commande va :
- Créer toutes les tables nécessaires
- Créer 2 tenants par défaut : "Infra" et "Dev"
- Créer 3 utilisateurs :
  - **admin** / admin123 (Admin Global)
  - **infra_admin** / admin123 (Admin Infra)
  - **dev_admin** / admin123 (Admin Dev)

### 5. Démarrer l'application

```powershell
# Mode développement (backend + frontend)
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000/api

### 6. Se connecter

Ouvrez votre navigateur et allez sur http://localhost:5173

**Identifiants par défaut :**
- Username: `admin`
- Password: `admin123`

## 🎯 Utilisation

### En tant qu'utilisateur normal

1. **Connectez-vous** avec vos identifiants
2. **Page d'accueil** : Choisissez entre "Application" ou "Statistiques"
3. **Application** : 
   - Remplissez le formulaire pour créer un appel
   - Utilisez les suggestions automatiques
   - Cochez "Ticket GLPI" pour masquer raison et tags
   - Consultez l'historique et modifiez les appels
4. **Statistiques** :
   - Filtrez par période (jour/semaine/mois/année)
   - Visualisez les graphiques
   - Exportez les données en JSON

### En tant qu'administrateur global

1. **Connectez-vous** avec le compte admin
2. Accédez au **panneau d'administration**
3. **Gérez les tenants** :
   - Créer/modifier/supprimer des départements
4. **Gérez les utilisateurs** :
   - Créer des utilisateurs avec différents rôles
   - Assigner des utilisateurs à des tenants
5. **Consultez les statistiques globales** tous tenants confondus

## 🏗️ Structure du Projet

```
ticketv2/
├── server/                  # Backend
│   ├── config/              # Configuration DB
│   ├── controllers/         # Logique métier
│   ├── middleware/          # Authentification
│   ├── routes/              # Routes API
│   ├── scripts/             # Scripts utilitaires
│   └── index.js             # Serveur Express
│
├── client/                  # Frontend
│   ├── src/
│   │   ├── pages/           # Pages React
│   │   ├── services/        # API services
│   │   ├── App.jsx          # Router
│   │   └── main.jsx         # Point d'entrée
│   └── package.json
│
├── .env                     # Variables d'environnement
└── package.json             # Dépendances backend
```

## 🔧 Scripts disponibles

```powershell
# Développement (lance backend + frontend)
npm run dev

# Lancer seulement le backend
npm run server

# Lancer seulement le frontend
npm run client

# Réinitialiser la base de données
npm run db:setup

# Build production
npm run build

# Démarrer en production
npm start
```

## 🐛 Dépannage

### Erreur de connexion à PostgreSQL

- Vérifiez que PostgreSQL est démarré
- Vérifiez les identifiants dans `.env`
- Assurez-vous que la base `ticketv2` existe

### Port déjà utilisé

Si le port 3000 ou 5173 est déjà utilisé :
```powershell
# Modifier PORT dans .env pour le backend
# Modifier server.port dans client/vite.config.js pour le frontend
```

### Problème avec les dépendances

```powershell
# Supprimer node_modules et réinstaller
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client/node_modules
npm install
cd client
npm install
cd ..
```

## 📝 Notes importantes

- **Changez le JWT_SECRET** en production !
- **Changez le mot de passe admin** après la première connexion
- Les données sont **isolées par tenant** automatiquement
- L'export JSON respecte le format spécifié dans les specs

## 🆘 Support

En cas de problème, vérifiez :
1. Les logs du terminal
2. La console du navigateur (F12)
3. Que PostgreSQL est bien démarré
4. Que les ports ne sont pas bloqués

Bon développement ! 🎉
