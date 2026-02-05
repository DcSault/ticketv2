# 🚀 Déploiement

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

TicketV2 peut être déployé de plusieurs façons :
- **Docker Compose** (recommandé) - Production simplifiée
- **Docker + Dockerfile** - Build personnalisé
- **Manuel** - Installation traditionnelle

---

## Prérequis

### Environnement

| Composant | Version | Obligatoire |
|-----------|---------|-------------|
| Node.js | 18+ | ✅ (sauf Docker) |
| PostgreSQL | 14+ | ✅ (sauf Docker) |
| Docker | 20+ | ❌ (recommandé) |
| Docker Compose | 2.0+ | ❌ (recommandé) |

### Ports

| Service | Port | Modifiable |
|---------|------|------------|
| Application | 3000 (dev) / 7979 (docker) | ✅ |
| PostgreSQL | 5432 | ✅ |

---

## Déploiement Docker (Recommandé)

### 1. Cloner le Projet

```bash
git clone https://github.com/DcSault/ticketv2.git
cd ticketv2
```

### 2. Configuration

Le `docker-compose.yml` inclut déjà les variables d'environnement. Pour personnaliser :

```bash
# Créer un fichier .env (optionnel)
cat > .env << EOF
DB_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_random_secret_key
DEFAULT_ADMIN_PASSWORD=your_admin_password
EOF
```

### 3. Lancement

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

### 4. Accès

- **URL** : http://localhost:7979
- **Identifiants** : admin / admin123 (par défaut)

### 5. Commandes Utiles

```bash
# Arrêter
docker-compose down

# Arrêter et supprimer les données
docker-compose down -v

# Redémarrer
docker-compose restart

# Reconstruire
docker-compose up -d --build

# Accès shell conteneur app
docker-compose exec app sh

# Accès PostgreSQL
docker-compose exec db psql -U postgres -d ticketv2

# Exécuter le setup BDD manuellement
docker-compose exec app node server/scripts/setup-db.js
```

---

## Architecture Docker

### Services

```yaml
services:
  app:
    image: node:18-alpine
    ports:
      - "7979:3000"
    depends_on:
      - db
    environment:
      - DB_HOST=db
      - NODE_ENV=production
    # ...

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ticketv2
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Volumes

| Volume | Description |
|--------|-------------|
| `postgres_data` | Données PostgreSQL persistantes |
| `ticketv2_data` | Code application (si applicable) |

### Réseau

```yaml
networks:
  ticketv2-network:
    driver: bridge
```

Tous les services communiquent via le réseau interne Docker.

---

## Dockerfile Personnalisé

Pour des builds personnalisés, utilisez le Dockerfile fourni :

```dockerfile
FROM node:18-alpine

# Dépendances système
RUN apk add --no-cache postgresql-client python3 make g++

WORKDIR /app

# Dépendances Node
COPY package*.json ./
RUN npm ci --only=production

# Dépendances Frontend
COPY client/package*.json ./client/
RUN cd client && npm ci

# Code source
COPY . .

# Build frontend
RUN cd client && npm run build

# User non-root
RUN adduser -S nodejs
USER nodejs

EXPOSE 3000

CMD ["node", "server/index.js"]
```

### Build et Run

```bash
# Build l'image
docker build -t ticketv2:latest .

# Run avec PostgreSQL externe
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_NAME=ticketv2 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e JWT_SECRET=your-secret \
  ticketv2:latest
```

---

## Déploiement Manuel

### 1. Prérequis

```bash
# Installer Node.js 18+
# Installer PostgreSQL 14+

# Vérifier les versions
node --version
psql --version
```

### 2. Base de Données

```bash
# Créer la base de données
createdb ticketv2

# Ou via psql
psql -U postgres -c "CREATE DATABASE ticketv2;"
```

### 3. Installation

```bash
# Cloner
git clone https://github.com/DcSault/ticketv2.git
cd ticketv2

# Installer les dépendances backend
npm install

# Installer les dépendances frontend
cd client && npm install && cd ..

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos paramètres
```

### 4. Configuration .env

```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticketv2
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_very_long_random_secret_at_least_64_characters
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=production

# Admin par défaut
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### 5. Initialisation BDD

```bash
npm run db:setup
```

### 6. Build Frontend

```bash
npm run build
```

### 7. Démarrage

```bash
# Production
npm start

# Ou développement
npm run dev
```

---

## Variables d'Environnement

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_HOST` | Hôte PostgreSQL | `localhost` ou `db` |
| `DB_NAME` | Nom de la base | `ticketv2` |
| `DB_USER` | Utilisateur BDD | `postgres` |
| `DB_PASSWORD` | Mot de passe BDD | `secure_password` |
| `JWT_SECRET` | Clé secrète JWT | (64+ caractères) |

### Optionnelles

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DB_PORT` | `5432` | Port PostgreSQL |
| `PORT` | `3000` | Port du serveur |
| `NODE_ENV` | `development` | Environnement |
| `JWT_EXPIRES_IN` | `7d` | Durée validité token |
| `DEFAULT_ADMIN_USERNAME` | `admin` | Username admin initial |
| `DEFAULT_ADMIN_PASSWORD` | `admin123` | Password admin initial |
| `LOG_LEVEL` | `info` | Niveau de logging |

---

## Health Check

### Endpoint

```
GET /api/health
```

### Réponse

```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Vérification

```bash
# Curl
curl http://localhost:3000/api/health

# Docker
docker-compose exec app wget -qO- http://localhost:3000/api/health
```

---

## Mise à Jour

### Docker

```bash
# Arrêter les services
docker-compose down

# Pull les dernières images
docker-compose pull

# Reconstruire et démarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f app
```

### Manuel

```bash
# Pull les changements
git pull origin main

# Installer les nouvelles dépendances
npm install
cd client && npm install && cd ..

# Rebuild le frontend
npm run build

# Exécuter les migrations si nécessaire
npm run db:setup

# Redémarrer
pm2 restart ticketv2  # ou autre gestionnaire de processus
```

---

## Sauvegarde et Restauration

### Sauvegarde PostgreSQL

```bash
# Docker
docker-compose exec db pg_dump -U postgres ticketv2 > backup_$(date +%Y%m%d).sql

# Manuel
pg_dump -h localhost -U postgres -d ticketv2 > backup_$(date +%Y%m%d).sql
```

### Restauration PostgreSQL

```bash
# Docker
docker-compose exec -T db psql -U postgres -d ticketv2 < backup.sql

# Manuel
psql -h localhost -U postgres -d ticketv2 < backup.sql
```

### Automatisation (Cron)

```bash
# Crontab : backup quotidien à 2h du matin
0 2 * * * docker-compose -f /path/to/docker-compose.yml exec -T db pg_dump -U postgres ticketv2 > /backups/ticketv2_$(date +\%Y\%m\%d).sql
```

---

## Monitoring

### Logs Docker

```bash
# Tous les logs
docker-compose logs

# Logs en temps réel
docker-compose logs -f

# Logs d'un service
docker-compose logs -f app
docker-compose logs -f db
```

### Logs Application

Les logs sont stockés dans :
- `server/logs/error.log` - Erreurs uniquement
- `server/logs/combined.log` - Tous les logs

### Métriques Docker

```bash
# Utilisation ressources
docker stats

# Statut des services
docker-compose ps
```

---

## Reverse Proxy (Nginx)

### Configuration Exemple

```nginx
server {
    listen 80;
    server_name ticketv2.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ticketv2.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7979;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## PM2 (Process Manager)

### Installation

```bash
npm install -g pm2
```

### Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ticketv2',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Commandes

```bash
# Démarrer
pm2 start ecosystem.config.js

# Statut
pm2 status

# Logs
pm2 logs ticketv2

# Redémarrer
pm2 restart ticketv2

# Arrêter
pm2 stop ticketv2

# Auto-start au boot
pm2 startup
pm2 save
```

---

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs app

# Vérifier les variables d'environnement
docker-compose exec app env | grep -E "DB_|JWT_"

# Tester la connexion BDD
docker-compose exec app node -e "require('./server/config/database').query('SELECT 1')"
```

### Erreur de connexion BDD

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps db

# Tester la connexion
docker-compose exec db psql -U postgres -d ticketv2 -c "SELECT 1"
```

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -i :7979
netstat -tulpn | grep 7979

# Changer le port dans docker-compose.yml
ports:
  - "8080:3000"  # Utiliser le port 8080 à la place
```

---

## Voir Aussi

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique
- [BACKEND.md](./BACKEND.md) - Configuration backend
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Résolution de problèmes
