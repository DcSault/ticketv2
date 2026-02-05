# ⚙️ Backend Documentation

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

Le backend de TicketV2 est une API REST construite avec **Node.js** et **Express.js**.

### Point d'Entrée

```
server/index.js
```

### Stack Technique

| Package | Version | Rôle |
|---------|---------|------|
| express | 4.18.x | Framework HTTP |
| pg | 8.11.x | Driver PostgreSQL |
| jsonwebtoken | 9.0.x | Gestion JWT |
| bcryptjs | 2.4.x | Hashage mots de passe |
| helmet | 7.1.x | Sécurité headers HTTP |
| cors | 2.8.x | Cross-Origin |
| morgan | 1.10.x | Logging HTTP |
| winston | 3.18.x | Logging avancé |
| multer | 1.4.x | Upload fichiers |
| dotenv | 16.3.x | Variables d'environnement |

---

## Architecture

```
server/
├── index.js                    # Point d'entrée Express
│
├── config/
│   └── database.js             # Configuration Pool PostgreSQL
│
├── controllers/                # Logique métier
│   ├── authController.js       # Authentification
│   ├── callController.js       # Gestion des appels
│   ├── adminController.js      # Administration
│   ├── statisticsController.js # Statistiques
│   └── dataManagementController.js
│
├── routes/                     # Définition des routes
│   ├── auth.js
│   ├── calls.js
│   ├── admin.js
│   ├── statistics.js
│   └── dataManagement.js
│
├── middleware/
│   └── auth.js                 # Middlewares JWT et rôles
│
├── jobs/
│   └── archiveOldCalls.js      # Job d'archivage automatique
│
├── scripts/
│   ├── setup-db.js             # Initialisation BDD
│   └── migrate-*.js            # Scripts de migration
│
└── utils/
    └── logger.js               # Configuration Winston
```

---

## Configuration Express (`index.js`)

### Middlewares Globaux

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 1. Sécurité HTTP headers
app.use(helmet());

// 2. CORS (Cross-Origin Resource Sharing)
app.use(cors());

// 3. Logging HTTP (format 'dev' pour développement)
app.use(morgan('dev'));

// 4. Parsing du body JSON
app.use(express.json());

// 5. Parsing des données URL-encoded
app.use(express.urlencoded({ extended: true }));
```

### Enregistrement des Routes

```javascript
const authRoutes = require('./routes/auth');
const callRoutes = require('./routes/calls');
const statisticsRoutes = require('./routes/statistics');
const adminRoutes = require('./routes/admin');
const dataManagementRoutes = require('./routes/dataManagement');

// Health check (sans auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data-management', dataManagementRoutes);
```

### Gestion des Erreurs

```javascript
// 404 pour les routes API non trouvées
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Démarrage du Serveur

```javascript
// Vérification des variables d'environnement requises
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Démarrage
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  
  // Démarrer le job d'archivage automatique
  startArchiveJob();
});
```

---

## Pattern Controller

### Structure Standard

```javascript
// controllers/exampleController.js
const pool = require('../config/database');
const logger = require('../utils/logger');

exports.getItems = async (req, res) => {
  // 1. Extraire les paramètres
  const { limit = 100, offset = 0 } = req.query;
  const tenantId = req.user.tenantId;

  try {
    // 2. Construire et exécuter la requête
    const result = await pool.query(
      'SELECT * FROM items WHERE tenant_id = $1 LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );

    // 3. Retourner la réponse
    res.json(result.rows);

  } catch (error) {
    // 4. Gérer les erreurs
    logger.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createItem = async (req, res) => {
  const { name, description } = req.body;
  const tenantId = req.user.tenantId;
  const userId = req.user.id;

  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Transaction pour opérations multiples
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Opérations...
    const result = await client.query(
      'INSERT INTO items (name, tenant_id, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, tenantId, userId]
    );

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create item error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
```

---

## Pattern Route

### Structure Standard

```javascript
// routes/example.js
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');
const { 
  authenticateToken, 
  ensureTenantAccess, 
  blockViewerModifications,
  requireGlobalAdmin 
} = require('../middleware/auth');

// Appliquer auth à toutes les routes
router.use(authenticateToken);
router.use(ensureTenantAccess);

// Routes de lecture (accessibles aux viewers)
router.get('/', exampleController.getItems);
router.get('/:id', exampleController.getItem);

// Routes de modification (bloquées pour viewers)
router.post('/', blockViewerModifications, exampleController.createItem);
router.put('/:id', blockViewerModifications, exampleController.updateItem);
router.delete('/:id', blockViewerModifications, exampleController.deleteItem);

// Routes admin uniquement
router.post('/admin-action', requireGlobalAdmin, exampleController.adminAction);

module.exports = router;
```

---

## Controllers Existants

### `authController.js`

| Fonction | Description |
|----------|-------------|
| `login` | Authentifie et retourne un JWT |
| `getCurrentUser` | Retourne l'utilisateur connecté |
| `logout` | Déconnexion (côté client) |
| `checkUserPasswordRequired` | Vérifie si MDP requis |

**Flow de Login** :
1. Recherche utilisateur par username
2. Vérifie `no_password_login` flag
3. Compare mot de passe avec bcrypt
4. Génère JWT avec `{id, username, role, tenantId}`
5. Retourne token + user info

---

### `callController.js`

| Fonction | Description |
|----------|-------------|
| `getCalls` | Liste les appels avec filtres |
| `createCall` | Crée un nouvel appel |
| `updateCall` | Modifie un appel |
| `deleteCall` | Supprime un appel |
| `archiveCall` | Archive un appel |
| `unarchiveCall` | Désarchive un appel |
| `getSuggestions` | Autocomplétion (callers, reasons, tags) |
| `getQuickSuggestions` | Suggestions les plus utilisées |

**Pattern Upsert pour Caller/Reason** :
```javascript
// Crée ou récupère l'appelant
const callerResult = await client.query(
  `INSERT INTO callers (name, tenant_id) VALUES ($1, $2) 
   ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name 
   RETURNING id`,
  [caller, tenantId]
);
```

**Gestion des Tags (Batch)** :
```javascript
// Insérer tous les tags en une requête
await client.query(`
  INSERT INTO tags (name, tenant_id)
  SELECT t, $1 FROM unnest($2::text[]) t
  ON CONFLICT (name, tenant_id) DO NOTHING
`, [tenantId, uniqueTags]);
```

---

### `adminController.js`

| Fonction | Description |
|----------|-------------|
| `getTenants` | Liste les tenants |
| `createTenant` | Crée un tenant |
| `updateTenant` | Modifie un tenant |
| `deleteTenant` | Supprime un tenant (CASCADE) |
| `getUsers` | Liste les utilisateurs |
| `createUser` | Crée un utilisateur |
| `updateUser` | Modifie un utilisateur |
| `deleteUser` | Supprime un utilisateur |

---

### `statisticsController.js`

| Fonction | Description |
|----------|-------------|
| `getStatistics` | Stats agrégées par période |
| `exportStatistics` | Export JSON |

**Périodes supportées** :
- `day` : Aujourd'hui
- `week` : Semaine courante
- `month` : Mois courant
- `year` : Année courante (groupé par mois)
- Custom : `startDate` et `endDate`

---

### `dataManagementController.js`

| Fonction | Description |
|----------|-------------|
| `getCallers` | Liste appelants avec usage |
| `updateCaller` | Renomme un appelant |
| `deleteCaller` | Supprime un appelant |
| `getReasons` | Liste raisons avec usage |
| `updateReason` | Renomme une raison |
| `deleteReason` | Supprime une raison |
| `getTags` | Liste tags avec usage |
| `updateTag` | Renomme un tag |
| `deleteTag` | Supprime un tag |

---

## Middlewares d'Authentification

### `authenticateToken`

Vérifie la présence et validité du token JWT.

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

**Données dans `req.user`** :
```javascript
{
  id: 1,
  username: 'admin',
  role: 'global_admin',
  tenantId: null,
  tenantName: null
}
```

---

### `requireGlobalAdmin`

Vérifie que l'utilisateur est un admin global.

```javascript
const requireGlobalAdmin = (req, res, next) => {
  if (req.user.role !== 'global_admin') {
    return res.status(403).json({ error: 'Global admin access required' });
  }
  next();
};
```

---

### `requireTenantAdmin`

Vérifie que l'utilisateur est au moins tenant_admin.

```javascript
const requireTenantAdmin = (req, res, next) => {
  if (req.user.role !== 'tenant_admin' && 
      req.user.role !== 'global_admin' && 
      req.user.role !== 'viewer') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

---

### `ensureTenantAccess`

Vérifie l'accès au tenant et injecte `req.tenantId`.

```javascript
const ensureTenantAccess = (req, res, next) => {
  // Admins globaux et viewers : accès total
  if (req.user.role === 'global_admin' || req.user.role === 'viewer') {
    return next();
  }

  // Autres utilisateurs : limités à leur tenant
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'No tenant assigned' });
  }

  req.tenantId = req.user.tenantId;
  next();
};
```

---

### `blockViewerModifications`

Empêche les viewers de modifier des données.

```javascript
const blockViewerModifications = (req, res, next) => {
  if (req.user.role === 'viewer') {
    return res.status(403).json({ error: 'Viewers cannot modify data' });
  }
  next();
};
```

---

## Jobs Background

### `archiveOldCalls.js`

Archive automatiquement les appels de plus de 24 heures.

```javascript
async function archiveOldCalls() {
  const result = await pool.query(`
    UPDATE calls 
    SET is_archived = true, archived_at = NOW(), archived_by = NULL
    WHERE is_archived = false 
      AND created_at < (NOW() - INTERVAL '24 hours')
    RETURNING id, caller_name, created_at
  `);

  if (result.rowCount > 0) {
    console.log(`✅ ${result.rowCount} appels archivés automatiquement`);
  }
}

function startArchiveJob() {
  // Exécution immédiate au démarrage
  archiveOldCalls().catch(console.error);

  // Puis toutes les 30 minutes
  setInterval(() => {
    archiveOldCalls().catch(console.error);
  }, 30 * 60 * 1000);

  console.log('🕐 Job d\'archivage démarré (toutes les 30 minutes)');
}
```

---

## Logging avec Winston

### Configuration (`utils/logger.js`)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ticketv2-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'server/logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'server/logs/combined.log' 
    }),
  ],
});

// Console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}
```

### Utilisation

```javascript
const logger = require('../utils/logger');

// Niveaux disponibles
logger.error('Message d\'erreur', { details: error });
logger.warn('Avertissement');
logger.info('Information');
logger.debug('Debug');
```

---

## Base de Données Pool

### Configuration (`config/database.js`)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ticketv2',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database error', err);
  process.exit(-1);
});

module.exports = pool;
```

### Utilisation

```javascript
const pool = require('../config/database');

// Simple query
const result = await pool.query('SELECT * FROM users');

// Query avec paramètres
const result = await pool.query(
  'SELECT * FROM calls WHERE tenant_id = $1',
  [tenantId]
);

// Transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... opérations
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## Ajouter un Nouveau Module

### 1. Créer le Controller

```javascript
// server/controllers/newController.js
const pool = require('../config/database');
const logger = require('../utils/logger');

exports.getItems = async (req, res) => {
  // Implementation
};

exports.createItem = async (req, res) => {
  // Implementation
};
```

### 2. Créer les Routes

```javascript
// server/routes/new.js
const express = require('express');
const router = express.Router();
const newController = require('../controllers/newController');
const { authenticateToken, ensureTenantAccess } = require('../middleware/auth');

router.use(authenticateToken);
router.use(ensureTenantAccess);

router.get('/', newController.getItems);
router.post('/', newController.createItem);

module.exports = router;
```

### 3. Enregistrer dans index.js

```javascript
const newRoutes = require('./routes/new');
app.use('/api/new', newRoutes);
```

### 4. Documenter

- Mettre à jour [API_REFERENCE.md](./API_REFERENCE.md)
- Mettre à jour ce fichier si nécessaire

---

## Variables d'Environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DB_HOST` | Hôte PostgreSQL | ✅ |
| `DB_PORT` | Port PostgreSQL | ❌ (5432) |
| `DB_NAME` | Nom de la base | ✅ |
| `DB_USER` | Utilisateur BDD | ✅ |
| `DB_PASSWORD` | Mot de passe BDD | ✅ |
| `JWT_SECRET` | Clé secrète JWT | ✅ |
| `JWT_EXPIRES_IN` | Expiration token | ❌ (7d) |
| `PORT` | Port du serveur | ❌ (3000) |
| `NODE_ENV` | Environnement | ❌ (development) |
| `LOG_LEVEL` | Niveau de log | ❌ (info) |

---

## Voir Aussi

- [API_REFERENCE.md](./API_REFERENCE.md) - Documentation des endpoints
- [DATABASE.md](./DATABASE.md) - Schéma de base de données
- [SECURITY.md](./SECURITY.md) - Authentification et sécurité
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Déploiement en production
