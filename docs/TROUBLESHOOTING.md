# 🔧 Troubleshooting

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

Ce document recense les problèmes courants et leurs solutions pour TicketV2.

> **⚠️ Pour LLM/Agents** : Consulter ce document en cas d'erreur pour trouver une solution avant de proposer des modifications.

---

## Problèmes de Démarrage

### L'application ne démarre pas

#### Symptôme
```
Error: Missing required environment variables: DB_HOST, DB_NAME, ...
```

#### Solution
1. Vérifier que le fichier `.env` existe
2. Vérifier que toutes les variables requises sont définies

```bash
# Vérifier les variables
cat .env

# Variables obligatoires
DB_HOST=localhost
DB_NAME=ticketv2
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

---

### Erreur de connexion PostgreSQL

#### Symptôme
```
Error: connect ECONNREFUSED 127.0.0.1:5432
❌ Unexpected error on idle client
```

#### Solutions

**1. PostgreSQL n'est pas démarré**
```bash
# Linux
sudo systemctl start postgresql

# Mac (Homebrew)
brew services start postgresql

# Docker
docker-compose up -d db
```

**2. Mauvais host**
```bash
# Local
DB_HOST=localhost

# Docker
DB_HOST=db  # Nom du service Docker
```

**3. Mot de passe incorrect**
```bash
# Tester la connexion manuellement
psql -h localhost -U postgres -d ticketv2
```

---

### Port déjà utilisé

#### Symptôme
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### Solutions

**1. Identifier le processus**
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

**2. Tuer le processus**
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

**3. Utiliser un autre port**
```bash
PORT=3001 npm start
```

---

## Problèmes d'Authentification

### Token invalide ou expiré

#### Symptôme
```json
{
  "error": "Invalid or expired token"
}
```

#### Solutions

**1. Se reconnecter**
- Le token expire après 7 jours par défaut
- Aller sur `/login` et se reconnecter

**2. Vérifier JWT_SECRET**
- Si le secret a changé, tous les tokens deviennent invalides
```bash
# Vérifier que JWT_SECRET est identique
echo $JWT_SECRET
```

**3. Côté client**
```javascript
// Vider le localStorage et se reconnecter
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/login';
```

---

### "Invalid credentials" au login

#### Symptôme
```json
{
  "error": "Invalid credentials"
}
```

#### Solutions

**1. Vérifier l'utilisateur existe**
```sql
SELECT username, role FROM users WHERE username = 'votre_username';
```

**2. Réinitialiser le mot de passe**
```javascript
// Générer un nouveau hash
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('nouveau_mot_de_passe', 10);
console.log(hash);
```

```sql
UPDATE users SET password = '<hash>' WHERE username = 'votre_username';
```

**3. Vérifier no_password_login**
```sql
SELECT username, no_password_login FROM users WHERE username = 'votre_username';
```

---

### "No tenant assigned"

#### Symptôme
```json
{
  "error": "No tenant assigned"
}
```

#### Solution
L'utilisateur n'a pas de tenant_id. Assigner un tenant :

```sql
-- Voir les tenants disponibles
SELECT id, name FROM tenants;

-- Assigner un tenant
UPDATE users SET tenant_id = 1 WHERE username = 'votre_username';
```

---

## Problèmes de Base de Données

### Tables manquantes

#### Symptôme
```
error: relation "calls" does not exist
```

#### Solution
Exécuter le script de setup :

```bash
npm run db:setup

# Ou en Docker
docker-compose exec app node server/scripts/setup-db.js
```

---

### Erreur de contrainte unique

#### Symptôme
```
error: duplicate key value violates unique constraint "users_username_key"
```

#### Solution
L'enregistrement existe déjà. Utiliser ON CONFLICT pour l'upsert :

```sql
INSERT INTO callers (name, tenant_id) VALUES ($1, $2)
ON CONFLICT (name, tenant_id) DO UPDATE SET name = EXCLUDED.name
RETURNING id;
```

---

### Données corrompues ou incohérentes

#### Diagnostic
```sql
-- Appels avec un tenant inexistant
SELECT c.id, c.tenant_id FROM calls c
LEFT JOIN tenants t ON c.tenant_id = t.id
WHERE t.id IS NULL;

-- Utilisateurs sans tenant (non global_admin)
SELECT id, username, role FROM users
WHERE tenant_id IS NULL AND role != 'global_admin' AND role != 'viewer';
```

#### Correction
```sql
-- Supprimer les appels orphelins
DELETE FROM calls WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- Assigner un tenant par défaut
UPDATE users SET tenant_id = 1 
WHERE tenant_id IS NULL AND role NOT IN ('global_admin', 'viewer');
```

---

## Problèmes Docker

### Container ne démarre pas

#### Symptôme
```
ticketv2-app exited with code 1
```

#### Solutions

**1. Vérifier les logs**
```bash
docker-compose logs app
```

**2. Vérifier la santé de la BDD**
```bash
docker-compose ps db
docker-compose logs db
```

**3. Attendre que la BDD soit prête**
Le container app peut démarrer avant que PostgreSQL soit prêt.
```bash
# Redémarrer après quelques secondes
docker-compose restart app
```

---

### Volume non trouvé

#### Symptôme
```
ERROR: Volume ticketv2_postgres_data declared as external, but could not be found
```

#### Solution
```bash
# Créer le volume
docker volume create ticketv2_postgres_data

# Ou supprimer external: true dans docker-compose.yml
```

---

### Build échoue

#### Symptôme
```
npm ERR! code ENOENT
```

#### Solutions

**1. Nettoyer le cache Docker**
```bash
docker system prune -a
docker-compose build --no-cache
```

**2. Vérifier les fichiers**
```bash
# S'assurer que package.json existe
ls -la package.json
ls -la client/package.json
```

---

## Problèmes Frontend

### Page blanche après login

#### Causes possibles

**1. Erreur JavaScript**
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs

**2. API non accessible**
```bash
# Tester l'API
curl http://localhost:3000/api/health
```

**3. Proxy Vite non configuré**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
};
```

---

### Suggestions ne s'affichent pas

#### Solutions

**1. Vérifier l'API**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/calls/suggestions/callers
```

**2. Vérifier le tenant**
- Les suggestions sont filtrées par tenant
- S'assurer que l'utilisateur a un tenant assigné

---

### Statistiques vides

#### Solutions

**1. Vérifier la période**
- Par défaut : aujourd'hui (`period=day`)
- Essayer une période plus large (`period=month`)

**2. Vérifier le tenant**
- Admin : sélectionner le bon tenant ou "Tous"
- Utilisateur : vérifie son tenant

**3. Vérifier les appels**
```sql
SELECT COUNT(*) FROM calls WHERE tenant_id = 1;
```

---

## Problèmes de Performance

### Requêtes lentes

#### Diagnostic
```sql
-- Activer les logs de requêtes lentes
-- Dans postgresql.conf
log_min_duration_statement = 1000  -- 1 seconde
```

#### Solutions

**1. Vérifier les index**
```sql
-- Index existants
\di

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_calls_tenant ON calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
```

**2. Analyser une requête**
```sql
EXPLAIN ANALYZE SELECT * FROM calls WHERE tenant_id = 1 ORDER BY created_at DESC;
```

**3. Limiter les résultats**
```javascript
// Toujours utiliser LIMIT
const result = await pool.query(
  'SELECT * FROM calls WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100',
  [tenantId]
);
```

---

### Mémoire insuffisante

#### Symptôme
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

#### Solutions

**1. Augmenter la mémoire Node.js**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

**2. Docker : augmenter les limites**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## Logs et Debugging

### Activer les logs détaillés

```bash
# Niveau de log
LOG_LEVEL=debug npm start

# Voir les requêtes SQL
DEBUG=pg:* npm start
```

### Lire les fichiers de log

```bash
# Erreurs
tail -f server/logs/error.log

# Tous les logs
tail -f server/logs/combined.log

# Docker
docker-compose logs -f app
```

### Debug Frontend

```javascript
// Dans la console du navigateur
localStorage.getItem('token');
localStorage.getItem('user');

// Tester une requête API
fetch('/api/health').then(r => r.json()).then(console.log);
```

---

## Réinitialisation Complète

### Reset BDD (⚠️ Perte de données)

```bash
# Docker
docker-compose down -v
docker-compose up -d

# Manuel
dropdb ticketv2
createdb ticketv2
npm run db:setup
```

### Reset Complet Docker

```bash
# Arrêter et supprimer tout
docker-compose down -v
docker system prune -a

# Reconstruire
docker-compose up -d --build
```

### Recréer l'admin

```bash
# Accéder à PostgreSQL
docker-compose exec db psql -U postgres -d ticketv2

# Supprimer et recréer l'admin
DELETE FROM users WHERE username = 'admin';

-- Réexécuter setup-db.js
docker-compose exec app node server/scripts/setup-db.js
```

---

## Checklist de Diagnostic

Avant de demander de l'aide, vérifier :

- [ ] Les logs (console, error.log, docker logs)
- [ ] Les variables d'environnement
- [ ] La connexion à la base de données
- [ ] Les permissions utilisateur (rôle, tenant)
- [ ] Le token JWT (présent, non expiré)
- [ ] La version de Node.js (18+)
- [ ] L'état des containers Docker (si applicable)

---

## Contacter le Support

Si le problème persiste :

1. Collecter les informations :
   - Message d'erreur exact
   - Logs pertinents
   - Étapes pour reproduire
   - Environnement (OS, versions)

2. Vérifier la documentation :
   - [BACKEND.md](./BACKEND.md)
   - [FRONTEND.md](./FRONTEND.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)

3. Ouvrir une issue sur GitHub avec toutes les informations

---

## Voir Aussi

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Configuration et déploiement
- [SECURITY.md](./SECURITY.md) - Problèmes d'authentification
- [DATABASE.md](./DATABASE.md) - Structure de la BDD
