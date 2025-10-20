<div align="center"># TicketV2 - Application de Suivi d'Appels Multi-Tenant



# 🎫 TicketV2Application web complète de gestion et suivi d'appels avec support multi-tenant, statistiques dynamiques et interface moderne.



### Application de Suivi d'Appels Multi-Tenant## 🚀 Fonctionnalités



[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)- **Authentification JWT** - Connexion sécurisée avec gestion des rôles

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)- **Multi-tenant** - Plusieurs départements indépendants (Infra, Dev, etc.)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)- **Suivi d'appels** - Saisie rapide avec suggestions automatiques

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)- **Historique** - Liste chronologique avec édition inline

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)- **Statistiques** - Graphiques jour/semaine/mois/année avec export JSON

- **Administration** - Panneau global pour gérer tenants et utilisateurs

<p align="center">

  <strong>Une solution moderne et complète pour gérer les appels d'assistance technique avec support multi-tenant, statistiques en temps réel et interface intuitive.</strong>## 📋 Prérequis

</p>

- Node.js (v18+)

[Démarrage Rapide](#-démarrage-rapide) •- PostgreSQL (v14+)

[Fonctionnalités](#-fonctionnalités) •- npm ou yarn

[Documentation](#-documentation-api) •

[Architecture](#-architecture)## ⚙️ Installation



</div>1. **Cloner le projet**

```bash

---git clone <repo-url>

cd ticketv2

## ✨ Fonctionnalités```



### 🔐 **Authentification & Sécurité**2. **Installer les dépendances backend**

- Authentification JWT sécurisée avec tokens à expiration configurable```bash

- Système de rôles : `global_admin`, `tenant_admin`, `user`npm install

- Hashage des mots de passe avec bcrypt```

- Protection des routes et isolation des données par tenant

3. **Installer les dépendances frontend**

### 🏢 **Multi-Tenant**```bash

- Gestion de plusieurs départements/équipes indépendantscd client

- Isolation complète des données entre tenantsnpm install

- Administration dédiée par tenantcd ..

- Configuration personnalisable par organisation```



### 📞 **Gestion des Appels**4. **Configuration**

- Saisie rapide avec suggestions automatiques (noms, téléphones, lieux)```bash

- Historique chronologique avec recherche et filtrescp .env.example .env

- Édition inline des appels existants# Éditer .env avec vos paramètres de base de données

- Archivage automatique des anciens appels (90 jours)```

- Gestion des pièces jointes et commentaires

5. **Initialiser la base de données**

### 📊 **Statistiques & Rapports**```bash

- Graphiques interactifs (jour, semaine, mois, année)npm run db:setup

- Visualisation des tendances et analyses```

- Export des données en JSON

- Statistiques en temps réel par tenant## 🎯 Utilisation



### ⚙️ **Administration**### Mode développement

- **Admin Global** : Gestion des tenants et utilisateurs globaux```bash

- **Admin Tenant** : Gestion des utilisateurs de son équipenpm run dev

- Interface de gestion des données (lieux, utilisateurs)```

- Tableau de bord dédié par rôle- Backend : http://localhost:3000

- Frontend : http://localhost:5173

---

### Mode production

## 🚀 Démarrage Rapide```bash

npm run build

### Prérequisnpm start

```

- **Node.js** 18+ ([Télécharger](https://nodejs.org/))

- **PostgreSQL** 14+ ([Télécharger](https://www.postgresql.org/download/))### 🐳 Avec Docker

- **npm** ou **yarn**```bash

- **Git**# Démarrer avec Docker Compose

docker-compose up -d

### Installation Locale

# Voir les logs

```bashdocker-compose logs -f

# 1. Cloner le repository

git clone https://github.com/DcSault/ticketv2.git# Arrêter

cd ticketv2docker-compose down

```

# 2. Installer les dépendances backendConsultez [DOCKER.md](DOCKER.md) pour plus d'informations.

npm install

## 👤 Connexion par défaut

# 3. Installer les dépendances frontend

cd client**Admin Global** (défini dans .env):

npm install- Username: admin

cd ..- Password: admin123



# 4. Configuration de l'environnement## 🏗️ Architecture

# Créer un fichier .env à la racine du projet

cat > .env << 'EOF'```

# Databaseticketv2/

DB_HOST=localhost├── server/              # Backend Node.js + Express

DB_PORT=5432│   ├── config/          # Configuration DB

DB_NAME=ticketv2│   ├── controllers/     # Logique métier

DB_USER=postgres│   ├── middleware/      # Auth, validation

DB_PASSWORD=votre_mot_de_passe│   ├── models/          # Modèles PostgreSQL

│   ├── routes/          # Routes API REST

# JWT│   ├── scripts/         # Scripts utilitaires

JWT_SECRET=votre_secret_jwt_ultra_securise│   └── index.js         # Point d'entrée

JWT_EXPIRES_IN=7d│

└── client/              # Frontend React + TailwindCSS

# Server    ├── src/

PORT=3000    │   ├── components/  # Composants React

NODE_ENV=development    │   ├── pages/       # Pages principales

    │   ├── services/    # API calls

# Admin par défaut    │   └── App.jsx      # App principale

DEFAULT_ADMIN_USERNAME=admin    └── package.json

DEFAULT_ADMIN_PASSWORD=admin123```

EOF

## 📡 API Endpoints

# 5. Initialiser la base de données

npm run db:setup### Authentification

- `POST /api/auth/login` - Connexion

# 6. Lancer l'application en mode développement- `POST /api/auth/logout` - Déconnexion

npm run dev- `GET /api/auth/me` - Profil utilisateur

```

### Appels

**🎉 Application disponible :**- `GET /api/calls` - Liste des appels

- Frontend : [http://localhost:5173](http://localhost:5173)- `POST /api/calls` - Créer un appel

- Backend : [http://localhost:3000](http://localhost:3000)- `PUT /api/calls/:id` - Modifier un appel

- Health Check : [http://localhost:3000/api/health](http://localhost:3000/api/health)- `DELETE /api/calls/:id` - Supprimer un appel



### 🐳 Installation avec Docker### Statistiques

- `GET /api/statistics` - Statistiques filtrées

```bash- `GET /api/statistics/export` - Export JSON

# Démarrer tous les services (app + base de données)

npm run docker:up### Admin (Global)

- `GET /api/admin/tenants` - Liste des tenants

# Voir les logs en temps réel- `POST /api/admin/tenants` - Créer un tenant

npm run docker:logs- `GET /api/admin/users` - Liste des utilisateurs

- `POST /api/admin/users` - Créer un utilisateur

# Redémarrer les services

npm run docker:restart## 🔒 Sécurité



# Arrêter les services- Mots de passe hashés avec bcrypt

npm run docker:down- Tokens JWT avec expiration

```- Isolation complète des données par tenant

- Validation des entrées

**Application accessible sur :** [http://localhost:7979](http://localhost:7979)- Protection CSRF et headers sécurisés



> 📘 Consultez [DOCKER.md](DOCKER.md) pour plus de détails sur le déploiement Docker.## 📦 Technologies



---**Backend:**

- Node.js + Express

## 🔑 Connexion par Défaut- PostgreSQL

- JWT pour l'authentification

Après l'installation, connectez-vous avec :- bcryptjs pour le hashing



| Rôle | Username | Password |**Frontend:**

|------|----------|----------|- React 18

| **Admin Global** | `admin` | `admin123` |- TailwindCSS

- React Router

> ⚠️ **Important :** Changez ces identifiants après la première connexion !- Recharts pour les graphiques

- Axios pour les requêtes

---

## 📝 Licence

## 🏗️ Architecture

ISC

### Structure du Projet

```
ticketv2/
│
├── 📁 server/                    # Backend (Node.js + Express)
│   ├── config/                   # Configuration de la base de données
│   │   └── database.js           # Pool PostgreSQL
│   │
│   ├── controllers/              # Logique métier
│   │   ├── adminController.js    # Admin global & tenants
│   │   ├── authController.js     # Authentification
│   │   ├── callController.js     # Gestion des appels
│   │   ├── dataManagementController.js
│   │   └── statisticsController.js
│   │
│   ├── middleware/               # Middlewares Express
│   │   └── auth.js               # Vérification JWT & rôles
│   │
│   ├── routes/                   # Routes API REST
│   │   ├── admin.js              # /api/admin/*
│   │   ├── auth.js               # /api/auth/*
│   │   ├── calls.js              # /api/calls/*
│   │   ├── dataManagement.js     # /api/data-management/*
│   │   └── statistics.js         # /api/statistics/*
│   │
│   ├── jobs/                     # Tâches planifiées
│   │   └── archiveOldCalls.js    # Archivage automatique
│   │
│   ├── scripts/                  # Scripts utilitaires
│   │   ├── setup-db.js           # Initialisation DB
│   │   └── migrate-add-no-password.js
│   │
│   └── index.js                  # Point d'entrée serveur
│
├── 📁 client/                    # Frontend (React + Vite)
│   ├── public/                   # Assets statiques
│   │
│   ├── src/
│   │   ├── components/           # Composants réutilisables
│   │   │
│   │   ├── pages/                # Pages de l'application
│   │   │   ├── Login.jsx         # Page de connexion
│   │   │   ├── Home.jsx          # Tableau de bord
│   │   │   ├── App.jsx           # Saisie des appels
│   │   │   ├── Archives.jsx      # Historique & édition
│   │   │   ├── Statistics.jsx    # Graphiques & stats
│   │   │   ├── Admin.jsx         # Panel admin global
│   │   │   ├── AdminTenant.jsx   # Panel admin tenant
│   │   │   └── DataManagement.jsx
│   │   │
│   │   ├── services/             # Services & API
│   │   │   ├── api.js            # Client Axios & endpoints
│   │   │   └── serviceWorkerManager.js
│   │   │
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── App.jsx               # Router principal
│   │   ├── main.jsx              # Point d'entrée React
│   │   └── index.css             # Styles globaux
│   │
│   ├── index.html                # Template HTML
│   ├── vite.config.js            # Configuration Vite
│   ├── tailwind.config.js        # Configuration Tailwind
│   └── package.json
│
├── docker-compose.yml            # Configuration Docker
├── Dockerfile                    # Image Docker
├── DOCKER.md                     # Documentation Docker
├── package.json                  # Dépendances backend
└── README.md                     # Ce fichier
```

### Stack Technique

<table>
<tr>
<td valign="top" width="50%">

#### 🔧 Backend
- **Runtime :** Node.js 18+
- **Framework :** Express.js
- **Base de données :** PostgreSQL 15
- **Authentification :** JWT (jsonwebtoken)
- **Sécurité :** bcryptjs, helmet, cors
- **Logging :** morgan
- **Développement :** nodemon, concurrently

</td>
<td valign="top" width="50%">

#### 🎨 Frontend
- **Framework :** React 18
- **Build Tool :** Vite
- **Routing :** React Router DOM v6
- **Styling :** TailwindCSS 3
- **Graphiques :** Recharts + Chart.js
- **HTTP Client :** Axios
- **Dev Server :** Vite Dev Server (HMR)

</td>
</tr>
</table>

---

## 📡 Documentation API

### Base URL
```
http://localhost:3000/api
```

### Endpoints Principaux

#### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/login` | Connexion utilisateur | ❌ |
| `POST` | `/logout` | Déconnexion | ✅ |
| `GET` | `/me` | Profil de l'utilisateur connecté | ✅ |

**Exemple de requête :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 📞 Appels (`/api/calls`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/` | Liste des appels (avec filtres) | ✅ |
| `POST` | `/` | Créer un nouvel appel | ✅ |
| `PUT` | `/:id` | Modifier un appel | ✅ |
| `DELETE` | `/:id` | Supprimer un appel | ✅ |
| `GET` | `/suggestions` | Suggestions (noms, tél, lieux) | ✅ |

#### 📊 Statistiques (`/api/statistics`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/` | Statistiques avec filtres | ✅ |
| `GET` | `/export` | Export JSON des stats | ✅ |

**Paramètres de requête :**
- `period` : `day`, `week`, `month`, `year`
- `startDate`, `endDate` : ISO 8601 format

#### 👥 Administration (`/api/admin`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/tenants` | Liste des tenants | 🔑 Global Admin |
| `POST` | `/tenants` | Créer un tenant | 🔑 Global Admin |
| `PUT` | `/tenants/:id` | Modifier un tenant | 🔑 Global Admin |
| `DELETE` | `/tenants/:id` | Supprimer un tenant | 🔑 Global Admin |
| `GET` | `/users` | Liste des utilisateurs | 🔑 Admin |
| `POST` | `/users` | Créer un utilisateur | 🔑 Admin |
| `PUT` | `/users/:id` | Modifier un utilisateur | 🔑 Admin |
| `DELETE` | `/users/:id` | Supprimer un utilisateur | 🔑 Admin |

#### 🗂️ Gestion des Données (`/api/data-management`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/locations` | Liste des lieux | ✅ |
| `POST` | `/locations` | Créer un lieu | 🔑 Tenant Admin |
| `PUT` | `/locations/:id` | Modifier un lieu | 🔑 Tenant Admin |
| `DELETE` | `/locations/:id` | Supprimer un lieu | 🔑 Tenant Admin |

### Authentification des Requêtes

Ajoutez le header `Authorization` avec le token JWT :

```javascript
Authorization: Bearer <votre_token_jwt>
```

---

## 🛠️ Scripts Disponibles

### Backend (racine)
```bash
npm run dev           # Démarrage en mode développement (backend + frontend)
npm run server        # Démarrage du serveur backend seul
npm start             # Démarrage en mode production
npm run build         # Build du frontend
npm run db:setup      # Initialisation de la base de données
```

### Frontend (dossier client/)
```bash
npm run dev           # Serveur de développement Vite
npm run build         # Build de production
npm run preview       # Prévisualisation du build
```

### Docker
```bash
npm run docker:up      # Démarrer les conteneurs
npm run docker:down    # Arrêter les conteneurs
npm run docker:logs    # Voir les logs
npm run docker:restart # Redémarrer les services
```

---

## 🔒 Sécurité

### Mesures de Sécurité Implémentées

✅ **Authentification robuste**
- Tokens JWT avec expiration configurable
- Refresh automatique des tokens

✅ **Protection des mots de passe**
- Hashage bcrypt avec salt rounds élevés
- Pas de stockage en clair

✅ **Isolation des données**
- Séparation stricte par tenant
- Vérification des permissions à chaque requête

✅ **Protection des headers HTTP**
- Helmet.js pour les headers de sécurité
- CORS configuré

✅ **Validation des entrées**
- Sanitization des données utilisateur
- Protection contre les injections SQL

### Recommandations

1. **Changez les identifiants par défaut** après l'installation
2. **Utilisez des secrets JWT forts** (minimum 32 caractères aléatoires)
3. **Activez HTTPS** en production
4. **Mettez à jour régulièrement** les dépendances
5. **Limitez l'accès** à la base de données

---

## 🚦 Gestion des Rôles

| Rôle | Permissions |
|------|-------------|
| **global_admin** | Accès total : gestion des tenants, utilisateurs globaux, toutes les fonctionnalités |
| **tenant_admin** | Gestion de son tenant : utilisateurs, lieux, données de son équipe |
| **user** | Saisie d'appels, consultation des statistiques de son tenant |

---

## 📝 Développement

### Ajouter une Nouvelle Fonctionnalité

1. **Backend** : Créer un contrôleur et une route dans `server/`
2. **Frontend** : Créer un composant/page dans `client/src/`
3. **API Service** : Ajouter l'endpoint dans `client/src/services/api.js`
4. **Routing** : Ajouter la route dans `client/src/App.jsx`

### Convention de Commit

```
feat: Nouvelle fonctionnalité
fix: Correction de bug
docs: Documentation
style: Formatage
refactor: Refactoring
test: Tests
chore: Maintenance
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'feat: Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence **ISC**.

---

## 🆘 Support & Contact

- 📧 **Issues GitHub** : [Signaler un problème](https://github.com/DcSault/ticketv2/issues)
- 💬 **Discussions** : Pour les questions générales
- 📖 **Wiki** : Documentation détaillée

---

<div align="center">

**Fait avec ❤️ pour simplifier la gestion des appels d'assistance**

⭐ **Si ce projet vous est utile, n'hésitez pas à laisser une étoile !** ⭐

</div>
