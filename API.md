# 📡 Documentation API - TicketV2

## Base URL

```
http://localhost:3000/api
```

## Authentification

Toutes les routes (sauf `/auth/login`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

---

## 🔐 Authentification

### POST /auth/login
Connexion utilisateur

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Administrateur Global",
    "role": "global_admin",
    "tenantId": null,
    "tenantName": null
  }
}
```

### GET /auth/me
Obtenir l'utilisateur connecté

**Response 200:**
```json
{
  "id": 1,
  "username": "admin",
  "fullName": "Administrateur Global",
  "role": "global_admin",
  "tenantId": null,
  "tenantName": null
}
```

### POST /auth/logout
Déconnexion (côté client principalement)

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 📞 Appels

### GET /calls
Obtenir la liste des appels du tenant

**Query params:**
- `limit` (default: 100) - Nombre d'appels
- `offset` (default: 0) - Pagination
- `startDate` - Date de début (ISO)
- `endDate` - Date de fin (ISO)

**Response 200:**
```json
[
  {
    "id": 1,
    "caller_name": "John Doe",
    "reason_name": "Problème réseau",
    "tags": [
      { "id": 1, "name": "réseau" },
      { "id": 2, "name": "urgent" }
    ],
    "is_blocking": false,
    "is_glpi": false,
    "glpi_number": null,
    "created_at": "2025-10-15T10:00:00Z",
    "created_by": 1,
    "created_by_username": "admin",
    "last_modified_at": "2025-10-15T10:00:00Z",
    "last_modified_by": 1
  }
]
```

### POST /calls
Créer un nouvel appel

**Body:**
```json
{
  "caller": "John Doe",
  "reason": "Problème réseau",
  "tags": ["réseau", "urgent"],
  "isGlpi": false,
  "glpiNumber": null,
  "isBlocking": false
}
```

**Response 201:**
```json
{
  "id": 1,
  "caller_name": "John Doe",
  "reason_name": "Problème réseau",
  "tags": [
    { "id": 1, "name": "réseau" },
    { "id": 2, "name": "urgent" }
  ],
  "is_blocking": false,
  "is_glpi": false,
  "created_at": "2025-10-15T10:00:00Z"
}
```

### PUT /calls/:id
Modifier un appel

**Body:**
```json
{
  "caller": "Jane Doe",
  "reason": "Problème serveur",
  "tags": ["serveur"],
  "isBlocking": true,
  "createdAt": "2025-10-15T09:00:00Z"
}
```

**Response 200:**
```json
{
  "id": 1,
  "caller_name": "Jane Doe",
  "reason_name": "Problème serveur",
  "tags": [{ "id": 3, "name": "serveur" }],
  "is_blocking": true,
  "updated_at": "2025-10-15T10:30:00Z"
}
```

### DELETE /calls/:id
Supprimer un appel

**Response 200:**
```json
{
  "message": "Call deleted successfully"
}
```

### GET /calls/suggestions/:type
Obtenir les suggestions (type: callers | reasons | tags)

**Response 200:**
```json
["John Doe", "Jane Smith", "Bob Wilson"]
```

---

## 📊 Statistiques

### GET /statistics
Obtenir les statistiques du tenant

**Query params:**
- `period` - day | week | month | year
- `startDate` - Date de début (ISO)
- `endDate` - Date de fin (ISO)

**Response 200:**
```json
{
  "summary": {
    "total": 150,
    "blocking": 20,
    "glpi": 45
  },
  "topCallers": [
    { "caller_name": "John Doe", "count": "25" },
    { "caller_name": "Jane Smith", "count": "18" }
  ],
  "topReasons": [
    { "reason_name": "Problème réseau", "count": "30" },
    { "reason_name": "Problème serveur", "count": "22" }
  ],
  "topTags": [
    { "name": "réseau", "count": "40" },
    { "name": "urgent", "count": "35" }
  ],
  "callsByDay": [
    { "date": "2025-10-15", "count": "12" },
    { "date": "2025-10-14", "count": "15" }
  ]
}
```

### GET /statistics/export
Exporter les données en JSON

**Query params:**
- `startDate` - Date de début
- `endDate` - Date de fin

**Response 200:**
```json
[
  {
    "id": 1,
    "caller": "John Doe",
    "reason": "Problème réseau",
    "tags": [
      { "id": 1, "name": "réseau" },
      { "id": 2, "name": "urgent" }
    ],
    "isBlocking": false,
    "isGLPI": false,
    "glpiNumber": null,
    "isArchived": false,
    "archivedAt": null,
    "archivedBy": null,
    "createdAt": "2025-10-15T10:00:00Z",
    "createdBy": "admin",
    "lastModifiedAt": "2025-10-16T14:30:00Z",
    "lastModifiedBy": "admin",
    "updatedAt": "2025-10-16T14:30:00Z"
  }
]
```

---

## 🛠️ Administration (Global Admin uniquement)

### Tenants

#### GET /admin/tenants
Liste tous les tenants

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "infra",
    "display_name": "Infrastructure",
    "created_at": "2025-10-01T00:00:00Z",
    "user_count": "5",
    "call_count": "150"
  }
]
```

#### POST /admin/tenants
Créer un tenant

**Body:**
```json
{
  "name": "support",
  "displayName": "Support Technique"
}
```

**Response 201:**
```json
{
  "id": 3,
  "name": "support",
  "display_name": "Support Technique",
  "created_at": "2025-10-17T10:00:00Z"
}
```

#### PUT /admin/tenants/:id
Modifier un tenant

**Body:**
```json
{
  "displayName": "Support IT"
}
```

#### DELETE /admin/tenants/:id
Supprimer un tenant (supprime aussi tous les utilisateurs et appels associés)

**Response 200:**
```json
{
  "message": "Tenant deleted successfully"
}
```

### Utilisateurs

#### GET /admin/users
Liste tous les utilisateurs

**Query params:**
- `tenantId` - Filtrer par tenant

**Response 200:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "full_name": "Administrateur Global",
    "role": "global_admin",
    "tenant_id": null,
    "tenant_name": null,
    "tenant_display_name": null,
    "created_at": "2025-10-01T00:00:00Z"
  }
]
```

#### POST /admin/users
Créer un utilisateur

**Body:**
```json
{
  "username": "john.doe",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "role": "user",
  "tenantId": 1
}
```

**Rôles disponibles:**
- `user` - Utilisateur standard
- `tenant_admin` - Admin de tenant
- `global_admin` - Admin global

**Response 201:**
```json
{
  "id": 4,
  "username": "john.doe",
  "full_name": "John Doe",
  "role": "user",
  "tenant_id": 1,
  "created_at": "2025-10-17T10:00:00Z"
}
```

#### PUT /admin/users/:id
Modifier un utilisateur

**Body:**
```json
{
  "fullName": "John Smith",
  "role": "tenant_admin",
  "tenantId": 2,
  "password": "NewPassword123"
}
```

*Note: Le champ `password` est optionnel*

#### DELETE /admin/users/:id
Supprimer un utilisateur (impossible pour l'admin ID 1)

**Response 200:**
```json
{
  "message": "User deleted successfully"
}
```

### Statistiques Globales

#### GET /admin/statistics
Statistiques tous tenants confondus

**Response 200:**
```json
{
  "summary": {
    "totalCalls": 450,
    "totalUsers": 12,
    "totalTenants": 3
  },
  "callsByTenant": [
    {
      "name": "infra",
      "display_name": "Infrastructure",
      "call_count": "200"
    },
    {
      "name": "dev",
      "display_name": "Développement",
      "call_count": "250"
    }
  ],
  "recentCalls": [
    {
      "id": 150,
      "caller_name": "John Doe",
      "tenant_display_name": "Infrastructure",
      "created_at": "2025-10-17T09:45:00Z",
      "created_by_username": "infra_admin",
      "is_blocking": false
    }
  ]
}
```

---

## ⚠️ Codes d'erreur

- **400** - Requête invalide
- **401** - Non authentifié
- **403** - Accès refusé (rôle insuffisant)
- **404** - Ressource non trouvée
- **409** - Conflit (ex: username déjà existant)
- **500** - Erreur serveur

**Format d'erreur:**
```json
{
  "error": "Message d'erreur descriptif"
}
```

---

## 🔒 Sécurité

- Tous les mots de passe sont hashés avec bcrypt
- Les tokens JWT expirent après 7 jours (configurable)
- Les données sont isolées par tenant automatiquement
- Les admins globaux peuvent accéder à tous les tenants
- Validation des entrées sur toutes les routes

---

## 📝 Notes

- Les timestamps sont en format ISO 8601 (UTC)
- Les suggestions sont automatiquement mises à jour lors de la création
- L'export JSON respecte le format spécifié
- La pagination utilise limit/offset standard
