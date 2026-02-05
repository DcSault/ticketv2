# 📡 API Reference

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

L'API REST de TicketV2 est accessible via le préfixe `/api`. Toutes les routes (sauf authentification) nécessitent un token JWT.

### Base URL

```
Development : http://localhost:3000/api
Production  : http://localhost:7979/api (Docker)
```

### Authentification

Toutes les requêtes authentifiées doivent inclure le header :
```
Authorization: Bearer <token>
```

### Format des Réponses

**Succès** :
```json
{
  "data": { ... }
}
// ou directement l'objet/array
```

**Erreur** :
```json
{
  "error": "Message d'erreur"
}
```

### Codes HTTP

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé (permissions) |
| 404 | Ressource non trouvée |
| 409 | Conflit (doublon) |
| 500 | Erreur serveur |

---

## 🔐 Auth (`/api/auth`)

### POST `/api/auth/login`

Authentifie un utilisateur et retourne un token JWT.

**Auth requise** : ❌

**Body** :
```json
{
  "username": "string",
  "password": "string"  // Optionnel si no_password_login = true
}
```

**Réponse 200** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Administrateur",
    "role": "global_admin",
    "tenantId": null,
    "tenantName": null
  }
}
```

**Réponse 401** :
```json
{
  "error": "Invalid credentials"
}
```

---

### GET `/api/auth/me`

Retourne les informations de l'utilisateur connecté.

**Auth requise** : ✅

**Réponse 200** :
```json
{
  "id": 1,
  "username": "admin",
  "fullName": "Administrateur",
  "role": "global_admin",
  "tenantId": null,
  "tenantName": null
}
```

---

### POST `/api/auth/logout`

Déconnecte l'utilisateur (côté client principalement).

**Auth requise** : ✅

**Réponse 200** :
```json
{
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/check/:username`

Vérifie si un utilisateur nécessite un mot de passe.

**Auth requise** : ❌

**Paramètres URL** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| username | string | Nom d'utilisateur |

**Réponse 200** :
```json
{
  "exists": true,
  "passwordRequired": false  // true si mot de passe requis
}
```

---

## 📞 Calls (`/api/calls`)

### GET `/api/calls`

Récupère la liste des appels.

**Auth requise** : ✅  
**Rôles** : Tous

**Query Parameters** :
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| startDate | string (YYYY-MM-DD) | - | Date de début |
| endDate | string (YYYY-MM-DD) | - | Date de fin |
| limit | number \| 'all' | 100 | Nombre max de résultats |
| offset | number | 0 | Décalage pour pagination |
| archived | 'true' \| 'false' | - | Filtre par statut d'archivage |
| tenantId | number | - | ID du tenant (admin/viewer) |

**Réponse 200** :
```json
[
  {
    "id": 1,
    "caller_id": 5,
    "caller_name": "Jean Dupont",
    "reason_id": 3,
    "reason_name": "Problème imprimante",
    "is_glpi": false,
    "glpi_number": null,
    "is_blocking": true,
    "is_archived": false,
    "archived_at": null,
    "archived_by": null,
    "created_at": "2026-01-16T10:30:00.000Z",
    "created_by": 2,
    "created_by_username": "user1",
    "created_by_name": "User One",
    "last_modified_at": "2026-01-16T10:30:00.000Z",
    "last_modified_by": 2,
    "tenant_id": 1,
    "tags": [
      {"id": 1, "name": "urgent"},
      {"id": 2, "name": "hardware"}
    ]
  }
]
```

---

### POST `/api/calls`

Crée un nouvel appel.

**Auth requise** : ✅  
**Rôles** : user, tenant_admin, global_admin (pas viewer)

**Body** :
```json
{
  "caller": "Jean Dupont",
  "reason": "Problème imprimante",
  "tags": ["urgent", "hardware"],
  "isGlpi": false,
  "glpiNumber": null,
  "isBlocking": true
}
```

**Règles métier** :
- Si `isGlpi = true`, `reason` et `tags` sont ignorés
- `caller` est obligatoire
- Les tags sont créés automatiquement s'ils n'existent pas
- L'appelant est créé automatiquement s'il n'existe pas (upsert)

**Réponse 201** :
```json
{
  "id": 1,
  "caller_name": "Jean Dupont",
  "reason_name": "Problème imprimante",
  "is_glpi": false,
  "is_blocking": true,
  "created_at": "2026-01-16T10:30:00.000Z",
  "tags": [{"id": 1, "name": "urgent"}, {"id": 2, "name": "hardware"}]
}
```

---

### PUT `/api/calls/:id`

Modifie un appel existant.

**Auth requise** : ✅  
**Rôles** : user, tenant_admin, global_admin (pas viewer)

**Paramètres URL** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| id | number | ID de l'appel |

**Body** (tous les champs optionnels) :
```json
{
  "caller": "Jean Dupont",
  "reason": "Nouveau problème",
  "tags": ["urgent"],
  "isGlpi": false,
  "glpiNumber": null,
  "isBlocking": false
}
```

**Réponse 200** : Appel mis à jour

---

### DELETE `/api/calls/:id`

Supprime définitivement un appel.

**Auth requise** : ✅  
**Rôles** : user, tenant_admin, global_admin (pas viewer)

**Réponse 200** :
```json
{
  "message": "Call deleted successfully"
}
```

---

### POST `/api/calls/:id/archive`

Archive un appel.

**Auth requise** : ✅  
**Rôles** : user, tenant_admin, global_admin (pas viewer)

**Réponse 200** :
```json
{
  "message": "Call archived successfully",
  "call": { ... }
}
```

---

### POST `/api/calls/:id/unarchive`

Désarchive un appel.

**Auth requise** : ✅  
**Rôles** : user, tenant_admin, global_admin (pas viewer)

**Réponse 200** :
```json
{
  "message": "Call unarchived successfully",
  "call": { ... }
}
```

---

### GET `/api/calls/suggestions/:type`

Récupère les suggestions pour l'autocomplétion.

**Auth requise** : ✅

**Paramètres URL** :
| Paramètre | Type | Valeurs |
|-----------|------|---------|
| type | string | `callers`, `reasons`, `tags` |

**Réponse 200** :
```json
[
  {"id": 1, "name": "Jean Dupont", "count": 15},
  {"id": 2, "name": "Marie Martin", "count": 8}
]
```

---

### GET `/api/calls/quick-suggestions`

Récupère les suggestions les plus utilisées pour le formulaire rapide.

**Auth requise** : ✅

**Réponse 200** :
```json
{
  "callers": [{"id": 1, "name": "Jean Dupont"}],
  "reasons": [{"id": 1, "name": "Imprimante"}],
  "tags": [{"id": 1, "name": "urgent"}]
}
```

---

## 📊 Statistics (`/api/statistics`)

### GET `/api/statistics`

Récupère les statistiques agrégées.

**Auth requise** : ✅

**Query Parameters** :
| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| period | string | 'day' | `day`, `week`, `month`, `year` |
| startDate | string | - | Date de début personnalisée |
| endDate | string | - | Date de fin personnalisée |
| tenantId | number \| 'all' | - | Filtre tenant |

**Réponse 200** :
```json
{
  "total": 150,
  "blocking": 23,
  "glpi": 45,
  "topCallers": [
    {"caller_name": "Jean Dupont", "count": "15"},
    {"caller_name": "Marie Martin", "count": "12"}
  ],
  "topReasons": [
    {"reason_name": "Imprimante", "count": "20"}
  ],
  "topTags": [
    {"name": "urgent", "count": "30"}
  ],
  "callsByDay": [
    {"date": "2026-01-15", "count": "25"},
    {"date": "2026-01-16", "count": "18"}
  ]
}
```

---

### GET `/api/statistics/export`

Exporte les données en JSON.

**Auth requise** : ✅

**Query Parameters** : Mêmes que `/api/statistics`

**Réponse 200** : Fichier JSON téléchargeable

---

## 👥 Admin (`/api/admin`)

### Tenants

#### GET `/api/admin/tenants`

Liste tous les tenants.

**Auth requise** : ✅  
**Rôles** : global_admin, tenant_admin (voit seulement le sien), viewer

**Réponse 200** :
```json
[
  {
    "id": 1,
    "name": "infra",
    "display_name": "Infrastructure",
    "created_at": "2026-01-01T00:00:00.000Z",
    "user_count": "5",
    "call_count": "150"
  }
]
```

---

#### POST `/api/admin/tenants`

Crée un nouveau tenant.

**Auth requise** : ✅  
**Rôles** : global_admin uniquement

**Body** :
```json
{
  "name": "support",
  "displayName": "Support Technique"
}
```

**Réponse 201** :
```json
{
  "id": 3,
  "name": "support",
  "display_name": "Support Technique",
  "created_at": "2026-01-16T10:00:00.000Z"
}
```

---

#### PUT `/api/admin/tenants/:id`

Modifie un tenant.

**Auth requise** : ✅  
**Rôles** : global_admin uniquement

**Body** :
```json
{
  "displayName": "Nouveau Nom"
}
```

---

#### DELETE `/api/admin/tenants/:id`

Supprime un tenant et toutes ses données.

**Auth requise** : ✅  
**Rôles** : global_admin uniquement

⚠️ **Attention** : Supprime également tous les utilisateurs, appels, callers, tags associés (CASCADE).

---

### Users

#### GET `/api/admin/users`

Liste les utilisateurs.

**Auth requise** : ✅  
**Rôles** : global_admin (tous), tenant_admin (son tenant)

**Query Parameters** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| tenantId | number | Filtre par tenant |

**Réponse 200** :
```json
[
  {
    "id": 1,
    "username": "admin",
    "full_name": "Administrateur",
    "role": "global_admin",
    "tenant_id": null,
    "tenant_name": null,
    "tenant_display_name": null,
    "no_password_login": false,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

---

#### POST `/api/admin/users`

Crée un nouvel utilisateur.

**Auth requise** : ✅  
**Rôles** : global_admin, tenant_admin

**Body** :
```json
{
  "username": "newuser",
  "password": "secret123",
  "fullName": "Nouvel Utilisateur",
  "role": "user",
  "tenantId": 1,
  "noPasswordLogin": false
}
```

**Règles** :
- `tenant_admin` ne peut créer que des `user` dans son tenant
- `global_admin` peut créer n'importe quel rôle
- `password` requis sauf si `noPasswordLogin = true`

---

#### PUT `/api/admin/users/:id`

Modifie un utilisateur.

**Auth requise** : ✅  
**Rôles** : global_admin, tenant_admin (son tenant uniquement)

**Body** (tous optionnels) :
```json
{
  "fullName": "Nouveau Nom",
  "password": "newpassword",
  "role": "tenant_admin",
  "tenantId": 2,
  "noPasswordLogin": true
}
```

---

#### DELETE `/api/admin/users/:id`

Supprime un utilisateur.

**Auth requise** : ✅  
**Rôles** : global_admin, tenant_admin (son tenant)

---

## 🗂️ Data Management (`/api/data-management`)

### Callers

#### GET `/api/data-management/callers`

Liste les appelants avec leur nombre d'utilisations.

**Auth requise** : ✅

**Query Parameters** :
| Paramètre | Type | Description |
|-----------|------|-------------|
| tenantId | number | Tenant (admin only) |

**Réponse 200** :
```json
[
  {"id": 1, "name": "Jean Dupont", "usage_count": "15"},
  {"id": 2, "name": "Marie Martin", "usage_count": "8"}
]
```

---

#### PUT `/api/data-management/callers/:id`

Renomme un appelant (et met à jour tous les appels associés).

**Body** :
```json
{
  "name": "Jean DUPONT"
}
```

---

#### DELETE `/api/data-management/callers/:id`

Supprime un appelant (les appels gardent le nom mais perdent la référence).

---

### Reasons

#### GET `/api/data-management/reasons`

Liste les raisons avec leur nombre d'utilisations.

#### PUT `/api/data-management/reasons/:id`

Renomme une raison.

#### DELETE `/api/data-management/reasons/:id`

Supprime une raison.

---

### Tags

#### GET `/api/data-management/tags`

Liste les tags avec leur nombre d'utilisations.

#### PUT `/api/data-management/tags/:id`

Renomme un tag.

#### DELETE `/api/data-management/tags/:id`

Supprime un tag.

---

## ❤️ Health Check

### GET `/api/health`

Vérifie que le serveur fonctionne.

**Auth requise** : ❌

**Réponse 200** :
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 📝 Notes pour les Développeurs

### Ajout d'un Nouveau Endpoint

1. Ajouter la route dans `server/routes/<module>.js`
2. Créer la fonction dans `server/controllers/<module>Controller.js`
3. **Mettre à jour ce document** avec la documentation complète
4. Tester avec différents rôles

### Pattern de Réponse Standard

```javascript
// Succès
res.json(data);
res.status(201).json(createdObject);

// Erreur
res.status(400).json({ error: 'Message descriptif' });

// Toujours logger les erreurs
logger.error('Context:', error);
res.status(500).json({ error: 'Server error' });
```

---

## Voir Aussi

- [BACKEND.md](./BACKEND.md) - Implémentation des controllers
- [SECURITY.md](./SECURITY.md) - Détails sur l'authentification
- [DATABASE.md](./DATABASE.md) - Structure des données
