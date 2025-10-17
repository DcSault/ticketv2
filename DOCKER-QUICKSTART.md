# 🚀 Démarrage Rapide avec Docker

## Option 1 : Docker Compose Simple

```powershell
# Démarrer l'application
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Accéder à l'application
# http://localhost:3000
```

## Option 2 : Docker Compose Production (avec Dockerfile)

```powershell
# Build et démarrer
docker-compose -f docker-compose.prod.yml up -d --build

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Commandes NPM Docker

```powershell
# Démarrer
npm run docker:up

# Arrêter
npm run docker:down

# Voir les logs
npm run docker:logs

# Redémarrer
npm run docker:restart
```

## 🔐 Première Connexion

- **URL** : http://localhost:3000
- **Username** : admin
- **Password** : admin123

## 📦 Que fait Docker Compose ?

1. ✅ Démarre PostgreSQL
2. ✅ Attend que la base soit prête
3. ✅ Installe toutes les dépendances
4. ✅ Initialise la base de données
5. ✅ Crée les tenants et utilisateurs par défaut
6. ✅ Démarre l'application

## 🛠️ Gestion

```powershell
# Voir le statut
docker-compose ps

# Arrêter tout
docker-compose down

# Arrêter et supprimer les données (⚠️ attention)
docker-compose down -v

# Redémarrer un service
docker-compose restart app
```

## 📚 Documentation Complète

Consultez [DOCKER.md](DOCKER.md) pour :
- Configuration avancée
- Backup/Restore
- Dépannage
- Déploiement production
- Variables d'environnement

Bon déploiement ! 🎉
