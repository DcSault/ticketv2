# 🐳 TicketV2 - Docker Complete !

## ✅ Ce qui a été créé

### Fichiers Docker
- ✅ `docker-compose.yml` - Version simple avec volumes montés
- ✅ `docker-compose.prod.yml` - Version production avec Dockerfile
- ✅ `docker-compose.env.yml` - Version avec fichier .env
- ✅ `Dockerfile` - Image Docker optimisée
- ✅ `.dockerignore` - Exclusions Docker
- ✅ `.env.docker` - Variables d'environnement Docker

### Documentation
- ✅ `DOCKER.md` - Guide complet Docker
- ✅ `DOCKER-QUICKSTART.md` - Démarrage rapide

### Scripts NPM
- ✅ `npm run docker:up` - Démarrer
- ✅ `npm run docker:down` - Arrêter
- ✅ `npm run docker:logs` - Logs
- ✅ `npm run docker:restart` - Redémarrer

---

## 🚀 Utilisation

### Méthode 1 : Docker Compose Simple (Recommandé pour dev)

```bash
docker-compose up -d
```

**Avantages :**
- ✅ Rapide à démarrer
- ✅ Hot-reload activé (modifications en temps réel)
- ✅ Facile à déboguer

### Méthode 2 : Docker Compose Production

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Avantages :**
- ✅ Build optimisé
- ✅ Image Docker réutilisable
- ✅ Sécurisé (utilisateur non-root)
- ✅ Healthchecks avancés

### Méthode 3 : Docker Compose avec .env

```bash
# Éditer .env.docker d'abord
docker-compose -f docker-compose.env.yml up -d
```

**Avantages :**
- ✅ Configuration centralisée
- ✅ Facile à modifier
- ✅ Pas de secrets dans le YAML

---

## 📊 Comparaison des Méthodes

| Méthode | Use Case | Hot-reload | Build Time | Sécurité |
|---------|----------|------------|------------|----------|
| **docker-compose.yml** | Développement | ✅ Oui | 🟢 Rapide | 🟡 Standard |
| **docker-compose.prod.yml** | Production | ❌ Non | 🟡 Moyen | 🟢 Élevée |
| **docker-compose.env.yml** | Production | ✅ Oui | 🟢 Rapide | 🟢 Élevée |
| **Local (npm)** | Développement | ✅ Oui | 🟢 Instant | 🟡 Standard |

---

## 🎯 Quelle méthode choisir ?

### Pour le Développement
```bash
# Option 1 : Docker Simple (isolation complète)
docker-compose up -d

# Option 2 : Local (plus rapide)
npm run dev
```

### Pour la Production
```bash
# Option 1 : Avec Dockerfile (recommandé)
docker-compose -f docker-compose.prod.yml up -d --build

# Option 2 : Avec .env (plus flexible)
docker-compose -f docker-compose.env.yml up -d
```

---

## 🔐 Sécurité

### ⚠️ IMPORTANT pour la Production

1. **Changez TOUS les secrets dans les fichiers :**
   - `.env.docker`
   - `docker-compose.yml`
   - `docker-compose.prod.yml`

2. **Variables à changer :**
   ```env
   DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
   JWT_SECRET=VOTRE_CLE_SECRETE_LONGUE_ET_ALEATOIRE
   DEFAULT_ADMIN_PASSWORD=VOTRE_MOT_DE_PASSE_ADMIN
   ```

3. **Générer des secrets forts :**
   ```bash
   # Générer un mot de passe aléatoire
   openssl rand -base64 32
   ```

---

## 📦 Volumes Docker

### Volumes créés automatiquement :

1. **postgres_data** : Données PostgreSQL persistantes
2. **node_modules** : Dépendances Node.js (cache)
3. **client/node_modules** : Dépendances frontend (cache)

### Gestion des volumes :

```bash
# Lister les volumes
docker volume ls

# Voir les détails d'un volume
docker volume inspect ticketv2-db-data

# Supprimer un volume (⚠️ perte de données)
docker volume rm ticketv2-db-data

# Supprimer tous les volumes inutilisés
docker volume prune
```

---

## 🌐 Réseau Docker

### Réseau créé : `ticketv2-network`

```bash
# Voir les détails du réseau
docker network inspect ticketv2-network

# Tester la connectivité entre conteneurs
docker-compose exec app ping db
```

---

## 📝 Logs et Debugging

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f app
docker-compose logs -f db

# Dernières 100 lignes
docker-compose logs --tail=100 app
```

### Accéder aux conteneurs

```bash
# Shell du conteneur app
docker-compose exec app sh

# PostgreSQL
docker-compose exec db psql -U postgres -d ticketv2

# Voir les processus
docker-compose exec app ps aux
```

### Inspecter les conteneurs

```bash
# Voir la configuration
docker inspect ticketv2-app

# Voir les stats en temps réel
docker stats ticketv2-app ticketv2-db
```

---

## 🔄 Mise à Jour et Maintenance

### Mise à jour de l'application

```bash
# Récupérer les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose down
docker-compose up -d --build

# Ou avec la version prod
docker-compose -f docker-compose.prod.yml up -d --build
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# + Supprimer les volumes (⚠️ perte de données)
docker-compose down -v

# Nettoyer les images inutilisées
docker image prune -a

# Nettoyage complet du système
docker system prune -a --volumes
```

---

## 💾 Backup et Restore

### Backup de la base de données

```bash
# Backup simple
docker-compose exec db pg_dump -U postgres ticketv2 > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup compressé
docker-compose exec db pg_dump -U postgres ticketv2 | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore de la base de données

```bash
# Restore depuis un fichier SQL
docker-compose exec -T db psql -U postgres ticketv2 < backup.sql

# Restore depuis un fichier compressé
gunzip < backup.sql.gz | docker-compose exec -T db psql -U postgres ticketv2
```

---

## 🚀 Déploiement Production

### Checklist avant déploiement

- [ ] Changer tous les mots de passe et secrets
- [ ] Configurer un reverse proxy (Nginx/Traefik)
- [ ] Activer SSL/HTTPS (Let's Encrypt)
- [ ] Configurer les backups automatiques
- [ ] Limiter les ressources (CPU, RAM)
- [ ] Configurer le monitoring (Prometheus, Grafana)
- [ ] Tester les healthchecks
- [ ] Configurer les logs centralisés

### Exemple de déploiement avec Nginx

```yaml
# Ajouter dans docker-compose.prod.yml
  nginx:
    image: nginx:alpine
    container_name: ticketv2-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    networks:
      - ticketv2-network
    restart: unless-stopped
```

---

## 📊 Monitoring

### Voir l'état des services

```bash
# Status des conteneurs
docker-compose ps

# Healthcheck status
docker inspect --format='{{.State.Health.Status}}' ticketv2-app
docker inspect --format='{{.State.Health.Status}}' ticketv2-db
```

### Ressources utilisées

```bash
# Stats en temps réel
docker stats

# Espace disque
docker system df
```

---

## 🎉 Conclusion

Vous disposez maintenant de **3 méthodes différentes** pour déployer TicketV2 avec Docker :

1. **Simple** (`docker-compose.yml`) - Idéal pour le développement
2. **Production** (`docker-compose.prod.yml`) - Optimisé et sécurisé
3. **Flexible** (`docker-compose.env.yml`) - Configuration centralisée

Choisissez celle qui correspond le mieux à vos besoins !

**Documentation complète :** Consultez [DOCKER.md](DOCKER.md)

Bon déploiement ! 🐳🚀
