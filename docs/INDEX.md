# 📚 TicketV2 - Documentation Technique

> **⚠️ DOCUMENT PRINCIPAL - À LIRE EN PREMIER**  
> Ce fichier est le point d'entrée de toute la documentation technique du projet TicketV2.

---

## 🤖 Instructions pour LLM / Agents IA

### Règles Obligatoires

Lorsque vous travaillez sur ce projet, vous **DEVEZ** :

1. **LIRE cette documentation** avant toute modification de code
2. **METTRE À JOUR** la documentation correspondante après chaque changement significatif
3. **RESPECTER** les conventions de code définies dans [CONVENTIONS.md](./CONVENTIONS.md)
4. **VÉRIFIER** la cohérence avec l'architecture dans [ARCHITECTURE.md](./ARCHITECTURE.md)

### Quand Mettre à Jour la Documentation

| Type de Changement | Document(s) à Mettre à Jour |
|-------------------|----------------------------|
| Nouvel endpoint API | [API_REFERENCE.md](./API_REFERENCE.md) |
| Nouvelle table/colonne BDD | [DATABASE.md](./DATABASE.md) |
| Nouveau composant React | [FRONTEND.md](./FRONTEND.md) |
| Nouveau controller/route | [BACKEND.md](./BACKEND.md) |
| Modification authentification | [SECURITY.md](./SECURITY.md) |
| Changement Docker/déploiement | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Nouvelle convention | [CONVENTIONS.md](./CONVENTIONS.md) |
| Nouveau bug connu/solution | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |

### Format de Mise à Jour

Lors de chaque mise à jour de documentation, ajouter en haut du fichier concerné :

```markdown
> **Dernière mise à jour**: [DATE] - [DESCRIPTION DU CHANGEMENT]
```

---

## 👨‍💻 Instructions pour Développeurs

### Première Installation

1. Lire [ARCHITECTURE.md](./ARCHITECTURE.md) pour comprendre la structure
2. Suivre [DEPLOYMENT.md](./DEPLOYMENT.md) pour l'installation
3. Consulter [CONVENTIONS.md](./CONVENTIONS.md) pour les standards

### Avant de Coder

1. Vérifier si une fonctionnalité similaire existe déjà
2. Respecter les patterns établis dans [BACKEND.md](./BACKEND.md) et [FRONTEND.md](./FRONTEND.md)
3. Comprendre le système de sécurité dans [SECURITY.md](./SECURITY.md)

### Après Avoir Codé

1. **Tester** avec différents rôles utilisateur
2. **Mettre à jour** la documentation pertinente
3. **Vérifier** qu'aucune régression n'est introduite

---

## 📁 Structure de la Documentation

```
docs/
├── 📄 INDEX.md              ← VOUS ÊTES ICI (point d'entrée)
├── 📄 ARCHITECTURE.md       ← Vue d'ensemble technique, diagrammes
├── 📄 API_REFERENCE.md      ← Documentation complète de l'API REST
├── 📄 DATABASE.md           ← Schéma BDD, relations, migrations
├── 📄 FRONTEND.md           ← React, composants, services, routing
├── 📄 BACKEND.md            ← Express, controllers, middlewares, jobs
├── 📄 SECURITY.md           ← Authentification, rôles, permissions
├── 📄 DEPLOYMENT.md         ← Docker, environnement, production
├── 📄 CONVENTIONS.md        ← Standards de code, bonnes pratiques
└── 📄 TROUBLESHOOTING.md    ← Problèmes courants et solutions
```

---

## 🎯 Résumé du Projet

### Description
**TicketV2** est une application de suivi d'appels d'assistance technique multi-tenant avec :
- Authentification JWT
- Système de rôles (global_admin, tenant_admin, user, viewer)
- Gestion complète des appels (CRUD, tags, archivage)
- Statistiques et graphiques
- Interface moderne React + TailwindCSS

### Stack Technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, Vite 5, TailwindCSS 3, React Router 6, Axios |
| Backend | Node.js 18, Express 4, JWT, bcrypt, Winston |
| Database | PostgreSQL 15 |
| DevOps | Docker, Docker Compose |

### Ports par Défaut

| Service | Port |
|---------|------|
| Application (Dev) | 3000 |
| Application (Docker) | 7979 |
| PostgreSQL | 5432 |

---

## 🔗 Liens Rapides

### Documentation

- [Architecture & Vue d'ensemble](./ARCHITECTURE.md)
- [API REST Complète](./API_REFERENCE.md)
- [Base de Données](./DATABASE.md)
- [Frontend React](./FRONTEND.md)
- [Backend Express](./BACKEND.md)
- [Sécurité & Auth](./SECURITY.md)
- [Déploiement Docker](./DEPLOYMENT.md)
- [Conventions de Code](./CONVENTIONS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Fichiers Clés du Projet

| Fichier | Description |
|---------|-------------|
| `server/index.js` | Point d'entrée backend |
| `client/src/App.jsx` | Point d'entrée frontend |
| `server/config/database.js` | Configuration PostgreSQL |
| `server/middleware/auth.js` | Middlewares d'authentification |
| `docker-compose.yml` | Configuration Docker |

---

## 📋 Changelog Documentation

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-01-16 | Initial | Création de la documentation complète |
| 2026-01-16 | Analyse | Ajout de ANALYSIS_REPORT.md - Rapport d'analyse technique |
| 2026-01-16 | Bugfix | Correction double point-virgule callController.js |
| 2026-01-16 | Bugfix | Correction req.user.userId → req.user.id dans adminController.js |
| 2026-01-16 | Refactor | Uniformisation du logging (console → logger) dans tous les controllers |

---

## ⚠️ Rappels Importants

> **Pour les LLM** : Toujours vérifier la date de dernière mise à jour des documents. Si une information semble obsolète, demander confirmation avant de l'utiliser.

> **Pour les Développeurs** : Cette documentation est vivante. Si vous trouvez une erreur ou une information manquante, mettez-la à jour immédiatement.

> **Règle d'Or** : Un code non documenté est un code incomplet.
