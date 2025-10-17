# CallFixV2 - Application de Suivi d'Appels Multi-Tenant

Application web complète de gestion et suivi d'appels avec support multi-tenant, statistiques dynamiques et interface moderne.

## 🚀 Fonctionnalités

- **Authentification JWT** - Connexion sécurisée avec gestion des rôles
- **Multi-tenant** - Plusieurs départements indépendants (Infra, Dev, etc.)
- **Suivi d'appels** - Saisie rapide avec suggestions automatiques
- **Historique** - Liste chronologique avec édition inline
- **Statistiques** - Graphiques jour/semaine/mois/année avec export JSON
- **Administration** - Panneau global pour gérer tenants et utilisateurs

## 📋 Prérequis

- Node.js (v18+)
- PostgreSQL (v14+)
- npm ou yarn

## ⚙️ Installation

1. **Cloner le projet**
```bash
git clone <repo-url>
cd ticketv2
```

2. **Installer les dépendances backend**
```bash
npm install
```

3. **Installer les dépendances frontend**
```bash
cd client
npm install
cd ..
```

4. **Configuration**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
```

5. **Initialiser la base de données**
```bash
npm run db:setup
```

## 🎯 Utilisation

### Mode développement
```bash
npm run dev
```
- Backend : http://localhost:3000
- Frontend : http://localhost:5173

### Mode production
```bash
npm run build
npm start
```

### 🐳 Avec Docker
```bash
# Démarrer avec Docker Compose
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```
Consultez [DOCKER.md](DOCKER.md) pour plus d'informations.

## 👤 Connexion par défaut

**Admin Global** (défini dans .env):
- Username: admin
- Password: admin123

## 🏗️ Architecture

```
ticketv2/
├── server/              # Backend Node.js + Express
│   ├── config/          # Configuration DB
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Auth, validation
│   ├── models/          # Modèles PostgreSQL
│   ├── routes/          # Routes API REST
│   ├── scripts/         # Scripts utilitaires
│   └── index.js         # Point d'entrée
│
└── client/              # Frontend React + TailwindCSS
    ├── src/
    │   ├── components/  # Composants React
    │   ├── pages/       # Pages principales
    │   ├── services/    # API calls
    │   └── App.jsx      # App principale
    └── package.json
```

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Appels
- `GET /api/calls` - Liste des appels
- `POST /api/calls` - Créer un appel
- `PUT /api/calls/:id` - Modifier un appel
- `DELETE /api/calls/:id` - Supprimer un appel

### Statistiques
- `GET /api/statistics` - Statistiques filtrées
- `GET /api/statistics/export` - Export JSON

### Admin (Global)
- `GET /api/admin/tenants` - Liste des tenants
- `POST /api/admin/tenants` - Créer un tenant
- `GET /api/admin/users` - Liste des utilisateurs
- `POST /api/admin/users` - Créer un utilisateur

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- Isolation complète des données par tenant
- Validation des entrées
- Protection CSRF et headers sécurisés

## 📦 Technologies

**Backend:**
- Node.js + Express
- PostgreSQL
- JWT pour l'authentification
- bcryptjs pour le hashing

**Frontend:**
- React 18
- TailwindCSS
- React Router
- Recharts pour les graphiques
- Axios pour les requêtes

## 📝 Licence

ISC
