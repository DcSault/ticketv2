# 🐳 Guide Docker - CallFixV2

## Prérequis

- **Docker** installé ([télécharger](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (inclus avec Docker Desktop)

## 🚀 Démarrage Rapide

### 1. Cloner le projet (si nécessaire)

```bash
git clone <votre-repo>
cd ticketv2
```

### 2. Lancer avec Docker Compose

```bash
# Lancer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f app
docker-compose logs -f db
```

### 3. Accéder à l'application

- **Application** : http://localhost:3000
- **Identifiants** : admin / admin123

## 🛠️ Commandes Utiles

### Gestion des conteneurs

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Redémarrer un service
docker-compose restart app
docker-compose restart db

# Voir le statut
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f
```

### Accès aux conteneurs

```bash
# Accéder au shell du conteneur app
docker-compose exec app sh

# Accéder à PostgreSQL
docker-compose exec db psql -U postgres -d ticketv2

# Exécuter des commandes dans le conteneur
docker-compose exec app npm run db:setup
```

### Maintenance

```bash
# Reconstruire les conteneurs
docker-compose up -d --build

# Voir l'utilisation des ressources
docker stats

# Nettoyer les images inutilisées
docker system prune -a
```

## 📋 Architecture Docker

### Services

1. **app** (Node.js)
   - Image : `node:18-alpine`
   - Port : 3000
   - Rôle : Backend API + Frontend statique
   - Healthcheck : Vérifie `/api/health`

2. **db** (PostgreSQL)
   - Image : `postgres:15-alpine`
   - Port : 5432 (interne)
   - Rôle : Base de données
   - Healthcheck : `pg_isready`

### Volumes

- `postgres_data` : Données PostgreSQL persistantes
- `node_modules` : Dépendances Node.js (performance)

### Network

- `ticketv2-network` : Réseau bridge pour la communication inter-conteneurs

## 🔧 Configuration

Les variables d'environnement sont définies dans le `docker-compose.yml` :

```yaml
environment:
  - DB_HOST=db
  - DB_PORT=5432
  - DB_NAME=ticketv2
  - DB_USER=postgres
  - DB_PASSWORD=.njw6JQ*NKX8.vq!9R2!KfDMDB8Y_n
  - JWT_SECRET=...
  - PORT=3000
  - NODE_ENV=production
```

⚠️ **Important** : Changez les mots de passe en production !

## 📦 Workflow de Démarrage

1. Docker Compose démarre le service **db**
2. Le healthcheck attend que PostgreSQL soit prêt
3. Docker Compose démarre le service **app**
4. L'app installe les dépendances (backend + frontend)
5. L'app attend 5 secondes pour la DB
6. L'app exécute le script `setup-db.js` (création tables + données)
7. L'app démarre le serveur sur le port 3000

## 🐛 Dépannage

### Le conteneur app ne démarre pas

```bash
# Voir les logs détaillés
docker-compose logs app

# Vérifier que la DB est prête
docker-compose exec db pg_isready -U postgres

# Redémarrer le service
docker-compose restart app
```

### Erreur de connexion à la base de données

```bash
# Vérifier que les services communiquent
docker-compose exec app ping db

# Vérifier les variables d'environnement
docker-compose exec app env | grep DB

# Réinitialiser la base de données
docker-compose down -v
docker-compose up -d
```

### Port 3000 déjà utilisé

Modifiez le port dans `docker-compose.yml` :

```yaml
ports:
  - "8080:3000"  # Utilise le port 8080 au lieu de 3000
```

### Problème de permissions

```bash
# Sur Linux/Mac, si problème de permissions
sudo chown -R $USER:$USER .
```

## 🔄 Mise à Jour de l'Application

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose down
docker-compose up -d --build

# Ou simplement redémarrer
docker-compose restart app
```

## 💾 Sauvegarde et Restauration

### Sauvegarder la base de données

```bash
# Créer un backup
docker-compose exec db pg_dump -U postgres ticketv2 > backup.sql

# Avec compression
docker-compose exec db pg_dump -U postgres ticketv2 | gzip > backup.sql.gz
```

### Restaurer la base de données

```bash
# Depuis un fichier SQL
docker-compose exec -T db psql -U postgres ticketv2 < backup.sql

# Depuis un fichier compressé
gunzip < backup.sql.gz | docker-compose exec -T db psql -U postgres ticketv2
```

## 📊 Monitoring

### Voir l'utilisation des ressources

```bash
# Utilisation CPU, RAM, réseau
docker stats

# Espace disque des volumes
docker system df
```

### Healthchecks

Les deux services ont des healthchecks configurés :

```bash
# Vérifier le statut de santé
docker-compose ps

# Les services doivent être "healthy"
```

## 🚀 Déploiement Production

### Recommandations

1. **Changez les secrets** dans `docker-compose.yml`
2. **Utilisez des volumes nommés** pour la persistance
3. **Configurez un reverse proxy** (Nginx, Traefik)
4. **Activez SSL/TLS** (Let's Encrypt)
5. **Configurez les backups automatiques** de la DB
6. **Limitez les ressources** (CPU, RAM)

### Exemple avec Nginx

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    networks:
      - ticketv2-network
```

## 📝 Variables d'Environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| DB_HOST | Hôte PostgreSQL | db |
| DB_PORT | Port PostgreSQL | 5432 |
| DB_NAME | Nom de la base | ticketv2 |
| DB_USER | Utilisateur DB | postgres |
| DB_PASSWORD | Mot de passe DB | (à changer) |
| JWT_SECRET | Clé secrète JWT | (à changer) |
| JWT_EXPIRES_IN | Expiration token | 7d |
| PORT | Port serveur | 3000 |
| NODE_ENV | Environnement | production |
| DEFAULT_ADMIN_USERNAME | Admin par défaut | admin |
| DEFAULT_ADMIN_PASSWORD | Mot de passe admin | admin123 |

## 🎯 Avantages de Docker

✅ **Isolation** - Environnement cohérent partout  
✅ **Portabilité** - Fonctionne sur n'importe quel OS  
✅ **Reproductibilité** - Même config dev/prod  
✅ **Simplicité** - Une commande pour tout démarrer  
✅ **Scalabilité** - Facile à déployer et scaler  

## 📞 Support

En cas de problème :

1. Consultez les logs : `docker-compose logs -f`
2. Vérifiez le statut : `docker-compose ps`
3. Vérifiez les healthchecks : `docker inspect ticketv2-app`
4. Redémarrez : `docker-compose restart`

Bon déploiement ! 🎉
