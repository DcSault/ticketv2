# 🔐 Sécurité & Authentification

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

TicketV2 utilise un système d'authentification basé sur **JWT (JSON Web Tokens)** avec un système de rôles et une isolation multi-tenant.

---

## Authentification JWT

### Flow d'Authentification

```
┌─────────┐                                    ┌─────────────┐
│  Client │                                    │   Server    │
└────┬────┘                                    └──────┬──────┘
     │                                                │
     │  1. POST /api/auth/login                       │
     │     {username, password}                       │
     │ ──────────────────────────────────────────────►│
     │                                                │
     │                          2. Vérifier username  │
     │                          3. bcrypt.compare()   │
     │                          4. jwt.sign(payload)  │
     │                                                │
     │  5. {token, user}                              │
     │ ◄──────────────────────────────────────────────│
     │                                                │
     │  6. localStorage.setItem('token', token)       │
     │                                                │
     │  7. GET /api/calls                             │
     │     Authorization: Bearer <token>              │
     │ ──────────────────────────────────────────────►│
     │                                                │
     │                          8. jwt.verify(token)  │
     │                          9. req.user = decoded │
     │                                                │
     │  10. {calls: [...]}                            │
     │ ◄──────────────────────────────────────────────│
     │                                                │
```

### Structure du Token JWT

```javascript
// Payload du token
{
  id: 1,                    // ID utilisateur
  username: "admin",        // Nom d'utilisateur
  role: "global_admin",     // Rôle
  tenantId: null,           // ID du tenant (null pour global_admin)
  tenantName: null,         // Nom du tenant
  iat: 1705402800,          // Issued At (timestamp)
  exp: 1706007600           // Expiration (7 jours par défaut)
}
```

### Génération du Token

```javascript
// server/controllers/authController.js
const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
```

### Vérification du Token

```javascript
// server/middleware/auth.js
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

---

## Système de Rôles

### Hiérarchie des Rôles

```
┌─────────────────────────────────────────────────────────────────┐
│                        global_admin                             │
│  • Accès total à tous les tenants                              │
│  • Gestion des tenants (CRUD)                                   │
│  • Gestion de tous les utilisateurs                             │
│  • tenant_id = NULL                                             │
├─────────────────────────────────────────────────────────────────┤
│                        tenant_admin                             │
│  • Accès à son tenant uniquement                               │
│  • Gestion des utilisateurs de son tenant                       │
│  • Gestion des données (callers, tags, etc.)                    │
│  • CRUD sur les appels de son tenant                            │
├─────────────────────────────────────────────────────────────────┤
│                           user                                  │
│  • Accès à son tenant uniquement                               │
│  • CRUD sur les appels de son tenant                            │
│  • Pas d'accès admin                                            │
├─────────────────────────────────────────────────────────────────┤
│                          viewer                                 │
│  • Lecture seule                                                │
│  • Peut voir tous les tenants (si tenant_id = NULL)            │
│  • Ou un seul tenant (si tenant_id défini)                     │
│  • Ne peut pas modifier les données                             │
└─────────────────────────────────────────────────────────────────┘
```

### Matrice des Permissions

| Action | global_admin | tenant_admin | user | viewer |
|--------|:------------:|:------------:|:----:|:------:|
| Voir tous les tenants | ✅ | ❌ | ❌ | ⚠️* |
| Créer tenant | ✅ | ❌ | ❌ | ❌ |
| Modifier tenant | ✅ | ❌ | ❌ | ❌ |
| Supprimer tenant | ✅ | ❌ | ❌ | ❌ |
| Voir tous les users | ✅ | ❌ | ❌ | ❌ |
| Voir users du tenant | ✅ | ✅ | ❌ | ❌ |
| Créer user | ✅ | ✅** | ❌ | ❌ |
| Modifier user | ✅ | ✅** | ❌ | ❌ |
| Supprimer user | ✅ | ✅** | ❌ | ❌ |
| Voir appels | ✅ | ✅ | ✅ | ✅ |
| Créer appel | ✅ | ✅ | ✅ | ❌ |
| Modifier appel | ✅ | ✅ | ✅ | ❌ |
| Supprimer appel | ✅ | ✅ | ✅ | ❌ |
| Voir statistiques | ✅ | ✅ | ✅ | ✅ |
| Export données | ✅ | ✅ | ❌ | ❌ |

\* Viewer sans tenant_id peut voir tous les tenants  
\** Tenant_admin peut gérer seulement les users de son tenant

---

## Middlewares de Sécurité

### `authenticateToken`

Vérifie la présence et validité du JWT.

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

**Utilisation** :
```javascript
router.use(authenticateToken); // Sur toutes les routes du router
// ou
router.get('/protected', authenticateToken, controller.action);
```

---

### `requireGlobalAdmin`

Restreint l'accès aux global_admin uniquement.

```javascript
const requireGlobalAdmin = (req, res, next) => {
  if (req.user.role !== 'global_admin') {
    return res.status(403).json({ error: 'Global admin access required' });
  }
  next();
};
```

**Utilisation** :
```javascript
router.post('/tenants', requireGlobalAdmin, adminController.createTenant);
router.delete('/tenants/:id', requireGlobalAdmin, adminController.deleteTenant);
```

---

### `requireTenantAdmin`

Restreint l'accès aux tenant_admin, global_admin et viewers.

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

Vérifie et injecte l'accès au tenant.

```javascript
const ensureTenantAccess = (req, res, next) => {
  // Global admin et viewers multi-tenant : accès total
  if (req.user.role === 'global_admin' || 
      (req.user.role === 'viewer' && !req.user.tenantId)) {
    return next();
  }

  // Utilisateurs avec tenant : accès limité
  if (!req.user.tenantId) {
    return res.status(403).json({ error: 'No tenant assigned' });
  }

  req.tenantId = req.user.tenantId;
  next();
};
```

**Comportement** :
- `global_admin` : Peut accéder à tout, utilise `req.query.tenantId`
- `viewer` sans tenant : Peut voir tout, utilise `req.query.tenantId`
- `viewer` avec tenant : Limité à son tenant
- Autres : Limités à leur tenant via `req.user.tenantId`

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

**Utilisation** :
```javascript
// Routes de lecture (viewers autorisés)
router.get('/', callController.getCalls);

// Routes de modification (viewers bloqués)
router.post('/', blockViewerModifications, callController.createCall);
router.put('/:id', blockViewerModifications, callController.updateCall);
router.delete('/:id', blockViewerModifications, callController.deleteCall);
```

---

## Sécurité HTTP (Helmet)

### Headers Configurés

Helmet configure automatiquement ces headers de sécurité :

| Header | Description |
|--------|-------------|
| `X-Content-Type-Options: nosniff` | Empêche le MIME sniffing |
| `X-Frame-Options: SAMEORIGIN` | Protection contre le clickjacking |
| `X-XSS-Protection: 0` | Désactive le filtre XSS obsolète |
| `Strict-Transport-Security` | Force HTTPS (en production) |
| `Content-Security-Policy` | Politique de sécurité du contenu |
| `X-Permitted-Cross-Domain-Policies` | Politique cross-domain |

### Configuration

```javascript
// server/index.js
const helmet = require('helmet');
app.use(helmet());
```

---

## Hashage des Mots de Passe

### Création d'un Hash

```javascript
const bcrypt = require('bcryptjs');

// Lors de la création d'un utilisateur
const hashedPassword = await bcrypt.hash(password, 10);

// Stockage en BDD
await pool.query(
  'INSERT INTO users (username, password) VALUES ($1, $2)',
  [username, hashedPassword]
);
```

### Vérification d'un Hash

```javascript
// Lors du login
const validPassword = await bcrypt.compare(password, user.password);

if (!validPassword) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
```

### Coût du Hash

Le facteur de coût (10) représente le nombre d'itérations : $2^{10} = 1024$ itérations.

---

## Connexion Sans Mot de Passe

### Fonctionnalité

Certains utilisateurs peuvent se connecter sans mot de passe (utile pour des terminaux partagés).

### Champ BDD

```sql
ALTER TABLE users ADD COLUMN no_password_login BOOLEAN DEFAULT false;
```

### Logique de Login

```javascript
// server/controllers/authController.js
if (!user.no_password_login) {
  // Mot de passe requis
  if (!password) {
    return res.status(401).json({ error: 'Password required' });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
}
// Si no_password_login = true, on continue sans vérifier le mot de passe
```

### Vérification Côté Client

```javascript
// Avant d'afficher le formulaire de mot de passe
const checkPasswordRequired = async (username) => {
  const response = await api.get(`/auth/check/${username}`);
  return response.data.passwordRequired;
};
```

---

## Isolation Multi-Tenant

### Principe

Chaque donnée est associée à un `tenant_id`. Les requêtes sont toujours filtrées par tenant.

### Implémentation Controller

```javascript
exports.getCalls = async (req, res) => {
  // Déterminer le tenant à utiliser
  const tenantId = (req.user.role === 'global_admin') 
    ? req.query.tenantId  // Admin peut choisir
    : req.user.tenantId;  // Autres sont limités

  // Requête toujours filtrée
  const result = await pool.query(
    'SELECT * FROM calls WHERE tenant_id = $1',
    [tenantId]
  );
  
  res.json(result.rows);
};
```

### Contraintes BDD

```sql
-- Unicité par tenant
UNIQUE(name, tenant_id)

-- Suppression en cascade
tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE
```

---

## CORS

### Configuration

```javascript
const cors = require('cors');
app.use(cors());
```

En développement, Vite proxy les requêtes vers le backend, donc CORS est transparent.

En production, le frontend est servi par le même serveur Express, donc pas de problème CORS.

---

## Variables d'Environnement Sécurisées

### Variables Critiques

| Variable | Description | Exemple |
|----------|-------------|---------|
| `JWT_SECRET` | Clé secrète pour signer les tokens | Chaîne aléatoire longue |
| `DB_PASSWORD` | Mot de passe PostgreSQL | - |
| `DEFAULT_ADMIN_PASSWORD` | MDP admin initial | À changer après installation |

### Bonnes Pratiques

1. **Ne jamais commiter `.env`** en production
2. **Utiliser des secrets longs** pour JWT_SECRET (64+ caractères)
3. **Changer les mots de passe par défaut** après installation
4. **Utiliser des variables différentes** par environnement

### Génération d'un Secret

```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Recommandations de Sécurité

### ✅ À Faire

1. **Toujours filtrer par tenant_id** dans les requêtes
2. **Valider les entrées** côté serveur (ne pas faire confiance au client)
3. **Logger les erreurs** sans exposer de détails sensibles
4. **Utiliser HTTPS** en production
5. **Renouveler régulièrement** le JWT_SECRET
6. **Auditer les permissions** lors des modifications de code

### ❌ À Éviter

1. **Ne pas exposer les stack traces** en production
2. **Ne pas stocker le JWT** dans des cookies sans protection
3. **Ne pas désactiver Helmet** en production
4. **Ne pas utiliser des secrets faibles**
5. **Ne pas ignorer les erreurs** d'authentification

---

## Gestion des Erreurs d'Auth

### Codes HTTP

| Code | Situation | Message |
|------|-----------|---------|
| 401 | Token manquant | `Access token required` |
| 401 | Identifiants invalides | `Invalid credentials` |
| 403 | Token invalide/expiré | `Invalid or expired token` |
| 403 | Permissions insuffisantes | `Global admin access required` |
| 403 | Viewer tente modification | `Viewers cannot modify data` |
| 403 | Pas de tenant assigné | `No tenant assigned` |

### Gestion Côté Client

```javascript
// http-common.js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Voir Aussi

- [BACKEND.md](./BACKEND.md) - Implémentation des middlewares
- [API_REFERENCE.md](./API_REFERENCE.md) - Documentation des endpoints
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Configuration production
