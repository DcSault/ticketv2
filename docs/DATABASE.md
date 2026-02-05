# 🗄️ Base de Données

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

TicketV2 utilise **PostgreSQL 15** comme base de données relationnelle avec un schéma multi-tenant.

### Connexion

```javascript
// server/config/database.js
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
```

---

## Schéma Relationnel

### Diagramme ERD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  TENANTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id           SERIAL PRIMARY KEY                                             │
│ name         VARCHAR(100) UNIQUE NOT NULL    -- Identifiant technique      │
│ display_name VARCHAR(200) NOT NULL           -- Nom affiché                │
│ created_at   TIMESTAMP DEFAULT NOW()                                        │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│       USERS         │  │      CALLERS        │  │      REASONS        │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ id         SERIAL PK│  │ id         SERIAL PK│  │ id         SERIAL PK│
│ username   VARCHAR  │  │ name       VARCHAR  │  │ name       VARCHAR  │
│ password   VARCHAR  │  │ tenant_id  FK ──────┼──│ tenant_id  FK ──────│
│ full_name  VARCHAR  │  │ created_at TIMESTAMP│  │ created_at TIMESTAMP│
│ role       VARCHAR  │  │                     │  │                     │
│ tenant_id  FK ──────┼──│ UNIQUE(name,tenant) │  │ UNIQUE(name,tenant) │
│ no_password BOOLEAN │  └─────────────────────┘  └─────────────────────┘
│ created_at TIMESTAMP│
└─────────────────────┘
          │
          │                        ┌─────────────────────┐
          │                        │        TAGS         │
          │                        ├─────────────────────┤
          │                        │ id         SERIAL PK│
          │                        │ name       VARCHAR  │
          │                        │ tenant_id  FK ──────┼──► tenants
          │                        │ created_at TIMESTAMP│
          │                        │ UNIQUE(name,tenant) │
          │                        └──────────┬──────────┘
          │                                   │
          │                                   │
          ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                    CALLS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ id               SERIAL PRIMARY KEY                                         │
│ caller_id        INTEGER FK ──────────────────────────────────► callers     │
│ caller_name      VARCHAR(200) NOT NULL      -- Dénormalisé pour perf       │
│ reason_id        INTEGER FK ──────────────────────────────────► reasons     │
│ reason_name      VARCHAR(200)               -- Dénormalisé pour perf       │
│ is_glpi          BOOLEAN DEFAULT false                                      │
│ glpi_number      VARCHAR(50)                                                │
│ is_blocking      BOOLEAN DEFAULT false                                      │
│ is_archived      BOOLEAN DEFAULT false                                      │
│ archived_at      TIMESTAMP                                                  │
│ archived_by      INTEGER FK ──────────────────────────────────► users       │
│ created_at       TIMESTAMP DEFAULT NOW()                                    │
│ created_by       INTEGER FK ──────────────────────────────────► users       │
│ last_modified_at TIMESTAMP DEFAULT NOW()                                    │
│ last_modified_by INTEGER FK ──────────────────────────────────► users       │
│ updated_at       TIMESTAMP DEFAULT NOW()                                    │
│ tenant_id        INTEGER FK ──────────────────────────────────► tenants     │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ Many-to-Many
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CALL_TAGS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ call_id    INTEGER FK ────────────────────────────────────────► calls       │
│ tag_id     INTEGER FK ────────────────────────────────────────► tags        │
│ PRIMARY KEY (call_id, tag_id)                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tables Détaillées

### `tenants`

Représente les départements/équipes (multi-tenant).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Identifiant technique (ex: "infra") |
| display_name | VARCHAR(200) | NOT NULL | Nom affiché (ex: "Infrastructure") |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

```sql
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `users`

Utilisateurs de l'application.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Nom de connexion |
| password | VARCHAR(255) | NOT NULL | Hash bcrypt |
| full_name | VARCHAR(200) | - | Nom complet |
| role | VARCHAR(20) | DEFAULT 'user' | Rôle utilisateur |
| tenant_id | INTEGER | FK → tenants | Tenant assigné (NULL pour global_admin) |
| no_password_login | BOOLEAN | DEFAULT false | Connexion sans mot de passe |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

**Rôles possibles** :
- `global_admin` : Accès total, tenant_id = NULL
- `tenant_admin` : Admin d'un tenant spécifique
- `user` : Utilisateur standard
- `viewer` : Lecture seule

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  role VARCHAR(20) DEFAULT 'user',
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  no_password_login BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `callers`

Personnes qui appellent (autocomplétion).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| name | VARCHAR(200) | NOT NULL | Nom de l'appelant |
| tenant_id | INTEGER | FK → tenants | Tenant propriétaire |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

**Contrainte unique** : `(name, tenant_id)` - Même nom possible dans différents tenants.

```sql
CREATE TABLE callers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, tenant_id)
);
```

---

### `reasons`

Motifs d'appel (autocomplétion).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| name | VARCHAR(200) | NOT NULL | Libellé du motif |
| tenant_id | INTEGER | FK → tenants | Tenant propriétaire |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

```sql
CREATE TABLE reasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, tenant_id)
);
```

---

### `tags`

Étiquettes pour catégoriser les appels.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| name | VARCHAR(100) | NOT NULL | Nom du tag |
| tenant_id | INTEGER | FK → tenants | Tenant propriétaire |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, tenant_id)
);
```

---

### `calls`

Table principale des appels.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identifiant unique |
| caller_id | INTEGER | FK → callers | Référence appelant |
| caller_name | VARCHAR(200) | NOT NULL | Nom dénormalisé (perf) |
| reason_id | INTEGER | FK → reasons | Référence motif |
| reason_name | VARCHAR(200) | - | Motif dénormalisé |
| is_glpi | BOOLEAN | DEFAULT false | Est un ticket GLPI |
| glpi_number | VARCHAR(50) | - | Numéro GLPI |
| is_blocking | BOOLEAN | DEFAULT false | Appel bloquant |
| is_archived | BOOLEAN | DEFAULT false | Archivé |
| archived_at | TIMESTAMP | - | Date d'archivage |
| archived_by | INTEGER | FK → users | Archivé par |
| created_at | TIMESTAMP | DEFAULT NOW() | Date de création |
| created_by | INTEGER | FK → users | Créé par |
| last_modified_at | TIMESTAMP | DEFAULT NOW() | Dernière modif |
| last_modified_by | INTEGER | FK → users | Modifié par |
| updated_at | TIMESTAMP | DEFAULT NOW() | Date update |
| tenant_id | INTEGER | FK → tenants | Tenant propriétaire |

**Dénormalisation** : `caller_name` et `reason_name` sont stockés directement pour éviter des JOIN coûteux sur les requêtes fréquentes.

```sql
CREATE TABLE calls (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER REFERENCES callers(id),
  caller_name VARCHAR(200) NOT NULL,
  reason_id INTEGER REFERENCES reasons(id),
  reason_name VARCHAR(200),
  is_glpi BOOLEAN DEFAULT false,
  glpi_number VARCHAR(50),
  is_blocking BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,
  archived_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE
);
```

---

### `call_tags`

Table de liaison Many-to-Many entre calls et tags.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| call_id | INTEGER | FK → calls, PK | Référence appel |
| tag_id | INTEGER | FK → tags, PK | Référence tag |

```sql
CREATE TABLE call_tags (
  call_id INTEGER REFERENCES calls(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (call_id, tag_id)
);
```

---

## Index

```sql
-- Performance des requêtes par tenant
CREATE INDEX idx_calls_tenant ON calls(tenant_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_callers_tenant ON callers(tenant_id);
CREATE INDEX idx_reasons_tenant ON reasons(tenant_id);
CREATE INDEX idx_tags_tenant ON tags(tenant_id);

-- Performance des requêtes temporelles
CREATE INDEX idx_calls_created_at ON calls(created_at);
```

---

## Script d'Initialisation

Fichier : `server/scripts/setup-db.js`

```bash
# Exécution
npm run db:setup
```

Ce script :
1. Crée toutes les tables (IF NOT EXISTS)
2. Crée les index
3. Insère les tenants par défaut (infra, dev)
4. Crée l'utilisateur admin par défaut
5. Exécute les migrations nécessaires

---

## Requêtes Courantes

### Récupérer les appels avec tags

```sql
SELECT 
  c.*,
  json_agg(
    json_build_object('id', t.id, 'name', t.name)
  ) FILTER (WHERE t.id IS NOT NULL) as tags
FROM calls c
LEFT JOIN call_tags ct ON c.id = ct.call_id
LEFT JOIN tags t ON ct.tag_id = t.id
WHERE c.tenant_id = $1
GROUP BY c.id
ORDER BY c.created_at DESC
LIMIT 100;
```

### Créer un appelant (Upsert)

```sql
INSERT INTO callers (name, tenant_id) 
VALUES ($1, $2)
ON CONFLICT (name, tenant_id) 
DO UPDATE SET name = EXCLUDED.name
RETURNING id;
```

### Statistiques par période

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM calls
WHERE tenant_id = $1
  AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY DATE(created_at)
ORDER BY date ASC;
```

### Archivage automatique

```sql
UPDATE calls 
SET 
  is_archived = true,
  archived_at = NOW()
WHERE 
  is_archived = false 
  AND created_at < (NOW() - INTERVAL '24 hours');
```

---

## Migrations

### Ajouter une Colonne

1. Créer un script dans `server/scripts/migrate-xxx.js`
2. Utiliser `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
3. Documenter dans ce fichier
4. Exécuter manuellement ou ajouter à `setup-db.js`

### Exemple : Migration no_password_login

```javascript
// server/scripts/migrate-add-no-password.js
const pool = require('../config/database');

async function migrate() {
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS no_password_login BOOLEAN DEFAULT false
  `);
  console.log('Migration completed');
}
```

---

## Sauvegarde et Restauration

### Backup

```bash
# Docker
docker-compose exec db pg_dump -U postgres ticketv2 > backup.sql

# Local
pg_dump -h localhost -U postgres -d ticketv2 > backup.sql
```

### Restore

```bash
# Docker
docker-compose exec -T db psql -U postgres -d ticketv2 < backup.sql

# Local
psql -h localhost -U postgres -d ticketv2 < backup.sql
```

---

## Bonnes Pratiques

1. **Toujours filtrer par tenant_id** dans les requêtes
2. **Utiliser des transactions** pour les opérations multi-tables
3. **Éviter les N+1 queries** en utilisant des JOIN ou sous-requêtes
4. **Utiliser EXPLAIN ANALYZE** pour optimiser les requêtes lentes
5. **Mettre à jour les colonnes dénormalisées** lors des modifications

---

## Voir Aussi

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Vue d'ensemble
- [BACKEND.md](./BACKEND.md) - Utilisation dans les controllers
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problèmes BDD courants
