# 📏 Conventions de Code

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

Ce document définit les standards de code à respecter pour maintenir une codebase cohérente et maintenable.

> **⚠️ IMPORTANT pour LLM/Agents** : Respecter ces conventions lors de la génération de code.

---

## Conventions Générales

### Langue

| Élément | Langue |
|---------|--------|
| Code (variables, fonctions) | Anglais |
| Commentaires | Français ou Anglais |
| Messages utilisateur | Français |
| Documentation | Français |
| Commits | Français ou Anglais |

### Indentation et Formatage

```javascript
// ✅ Correct
const myFunction = async (param1, param2) => {
  if (condition) {
    return result;
  }
};

// ❌ Incorrect
const myFunction=async(param1,param2)=>{
if(condition){
return result;
}
};
```

| Règle | Valeur |
|-------|--------|
| Indentation | 2 espaces |
| Fin de ligne | LF (Unix) |
| Point-virgule | Obligatoire |
| Guillemets | Simple (`'`) |
| Virgule finale | Oui (trailing comma) |

---

## JavaScript / Node.js

### Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Fonctions | camelCase | `getUserById`, `calculateTotal` |
| Classes | PascalCase | `UserService`, `CallController` |
| Fichiers | camelCase | `authController.js`, `http-common.js` |

### Variables

```javascript
// ✅ Utiliser const par défaut
const user = { name: 'John' };

// ✅ Utiliser let si réassignation nécessaire
let count = 0;
count++;

// ❌ Ne jamais utiliser var
var oldStyle = 'bad';
```

### Fonctions

```javascript
// ✅ Arrow functions pour les callbacks et fonctions courtes
const double = (n) => n * 2;
const items = list.map((item) => item.name);

// ✅ Async/await plutôt que .then()
const getData = async () => {
  try {
    const result = await api.get('/data');
    return result.data;
  } catch (error) {
    logger.error('Error:', error);
    throw error;
  }
};

// ✅ Fonctions nommées pour les exports de controller
exports.getUsers = async (req, res) => {
  // ...
};
```

### Objets et Destructuring

```javascript
// ✅ Destructuring pour les paramètres
const { username, password } = req.body;
const { startDate, endDate, limit = 100 } = req.query;

// ✅ Shorthand properties
const user = { username, email, role };

// ✅ Spread operator pour cloner/merger
const updatedUser = { ...user, role: 'admin' };
```

### Imports

```javascript
// ✅ Ordre des imports
// 1. Modules Node.js natifs
const path = require('path');
const fs = require('fs');

// 2. Modules npm
const express = require('express');
const jwt = require('jsonwebtoken');

// 3. Modules locaux
const pool = require('../config/database');
const logger = require('../utils/logger');
```

---

## React / JSX

### Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `Dashboard`, `UserList` |
| Fichiers composants | PascalCase.jsx | `Dashboard.jsx`, `Login.jsx` |
| Hooks custom | use + PascalCase | `useAuth`, `useTenants` |
| Props | camelCase | `onClick`, `isDisabled` |
| Event handlers | handle + Event | `handleClick`, `handleSubmit` |

### Structure de Composant

```jsx
// ✅ Structure recommandée
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService } from '../services/api';

function Dashboard() {
  // 1. Hooks React Router
  const navigate = useNavigate();
  
  // 2. Données utilisateur
  const user = authService.getCurrentUser();
  
  // 3. État local (useState)
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 4. Effects (useEffect)
  useEffect(() => {
    loadData();
  }, []);
  
  // 5. Fonctions de chargement
  const loadData = async () => {
    try {
      const response = await callService.getCalls();
      setData(response.data);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };
  
  // 6. Handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    // ...
  };
  
  // 7. Render conditionnel
  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  
  // 8. Render principal
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}

export default Dashboard;
```

### JSX

```jsx
// ✅ Un composant par ligne avec props multiples
<Button
  type="submit"
  onClick={handleSubmit}
  disabled={loading}
  className="btn-primary"
>
  Enregistrer
</Button>

// ✅ Inline pour props simples
<span className="text-gray-500">{user.name}</span>

// ✅ Conditions avec &&
{isAdmin && <AdminPanel />}

// ✅ Conditions avec ternaire
{loading ? <Spinner /> : <Content />}

// ✅ Map avec key
{items.map((item) => (
  <ListItem key={item.id} data={item} />
))}
```

### Props

```jsx
// ✅ Destructuring des props
function UserCard({ user, onEdit, onDelete }) {
  return (
    <div>
      <span>{user.name}</span>
      <button onClick={() => onEdit(user)}>Éditer</button>
      <button onClick={() => onDelete(user.id)}>Supprimer</button>
    </div>
  );
}

// ✅ Valeurs par défaut
function Pagination({ page = 1, limit = 10, onPageChange }) {
  // ...
}
```

---

## SQL

### Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Tables | snake_case, pluriel | `users`, `call_tags` |
| Colonnes | snake_case | `created_at`, `tenant_id` |
| Clés primaires | `id` | `id SERIAL PRIMARY KEY` |
| Clés étrangères | `<table_singulier>_id` | `user_id`, `tenant_id` |
| Index | `idx_<table>_<column>` | `idx_calls_tenant` |

### Requêtes

```sql
-- ✅ Mots-clés en MAJUSCULES
SELECT 
  c.id,
  c.caller_name,
  COUNT(*) as call_count
FROM calls c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.tenant_id = $1
  AND c.created_at >= $2
GROUP BY c.id, c.caller_name
ORDER BY c.created_at DESC
LIMIT 100;

-- ✅ Paramètres numérotés ($1, $2, ...)
const result = await pool.query(
  'SELECT * FROM users WHERE tenant_id = $1 AND role = $2',
  [tenantId, 'admin']
);
```

### Transactions

```javascript
// ✅ Pattern de transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Opérations...
  await client.query('INSERT INTO ...', [...]);
  await client.query('UPDATE ...', [...]);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## API REST

### Endpoints

| Méthode | Convention | Exemple |
|---------|------------|---------|
| GET (liste) | `/resource` | `GET /api/calls` |
| GET (un) | `/resource/:id` | `GET /api/calls/123` |
| POST | `/resource` | `POST /api/calls` |
| PUT | `/resource/:id` | `PUT /api/calls/123` |
| DELETE | `/resource/:id` | `DELETE /api/calls/123` |
| Action | `/resource/:id/action` | `POST /api/calls/123/archive` |

### Réponses

```javascript
// ✅ Succès
res.json(data);                           // 200 implicite
res.status(201).json(createdObject);      // 201 Created

// ✅ Erreur client
res.status(400).json({ error: 'Validation failed' });
res.status(401).json({ error: 'Authentication required' });
res.status(403).json({ error: 'Permission denied' });
res.status(404).json({ error: 'Resource not found' });

// ✅ Erreur serveur
logger.error('Error:', error);
res.status(500).json({ error: 'Server error' });
```

### Query Parameters

```javascript
// ✅ Nommage camelCase
GET /api/calls?startDate=2026-01-01&endDate=2026-01-31&tenantId=1&limit=50

// ✅ Extraction avec valeurs par défaut
const { startDate, endDate, limit = 100, offset = 0 } = req.query;
```

---

## CSS / Tailwind

### Classes Tailwind

```jsx
// ✅ Ordre logique : layout → spacing → sizing → colors → effects
<div className="flex items-center justify-between p-4 w-full bg-white rounded-lg shadow-md">

// ✅ Responsive : mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ États
<button className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
```

### Composants Réutilisables

```jsx
// ✅ Classes communes extraites
const buttonBase = "font-medium py-2 px-4 rounded transition-colors";
const buttonPrimary = `${buttonBase} bg-blue-600 hover:bg-blue-700 text-white`;
const buttonDanger = `${buttonBase} bg-red-600 hover:bg-red-700 text-white`;

<button className={buttonPrimary}>Sauvegarder</button>
<button className={buttonDanger}>Supprimer</button>
```

---

## Gestion des Erreurs

### Backend

```javascript
// ✅ Pattern standard
exports.someAction = async (req, res) => {
  try {
    // Logique métier...
    res.json(result);
  } catch (error) {
    logger.error('someAction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Validation avec retour anticipé
if (!requiredField) {
  return res.status(400).json({ error: 'Field is required' });
}
```

### Frontend

```javascript
// ✅ Try/catch avec feedback utilisateur
const handleSubmit = async () => {
  try {
    await callService.createCall(formData);
    alert('✅ Appel créé avec succès');
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Erreur lors de la création');
  }
};
```

---

## Commentaires

### Quand Commenter

```javascript
// ✅ Commenter le "pourquoi", pas le "quoi"
// Utiliser une transaction car l'opération modifie plusieurs tables
const client = await pool.connect();

// ✅ TODOs avec contexte
// TODO: Ajouter la pagination côté serveur pour les grandes listes

// ✅ Documenter les comportements non évidents
// Si no_password_login est true, on ne vérifie pas le mot de passe
if (!user.no_password_login) {
  // Vérification mot de passe...
}
```

### JSDoc (optionnel mais recommandé)

```javascript
/**
 * Archive les appels de plus de 24 heures
 * @returns {Promise<number>} Nombre d'appels archivés
 */
async function archiveOldCalls() {
  // ...
}
```

---

## Commits

### Format

```
<type>: <description courte>

[corps optionnel]

[footer optionnel]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `style` | Formatage (pas de changement de code) |
| `refactor` | Refactoring |
| `test` | Ajout/modification de tests |
| `chore` | Maintenance, dépendances |

### Exemples

```
feat: ajout de l'archivage automatique des appels

fix: correction du filtre de date dans les statistiques

docs: mise à jour de la documentation API

refactor: extraction du middleware d'authentification
```

---

## Structure des Fichiers

### Backend

```
server/
├── index.js                 # Point d'entrée unique
├── config/
│   └── database.js          # Un fichier par config
├── controllers/
│   └── <module>Controller.js  # PascalCase pour le module
├── routes/
│   └── <module>.js          # Même nom que le controller
├── middleware/
│   └── auth.js              # Middlewares partagés
├── jobs/
│   └── <taskName>.js        # camelCase descriptif
├── scripts/
│   └── <action>.js          # Scripts one-shot
└── utils/
    └── logger.js            # Utilitaires partagés
```

### Frontend

```
client/src/
├── main.jsx                 # Bootstrap
├── App.jsx                  # Routing
├── index.css                # Styles globaux
├── pages/
│   └── <PageName>.jsx       # PascalCase
└── services/
    ├── api.js               # Export centralisé
    ├── http-common.js       # Config Axios
    └── <module>Service.js   # camelCase + Service
```

---

## Checklist Avant Commit

- [ ] Le code suit les conventions de nommage
- [ ] Les imports sont ordonnés correctement
- [ ] Les erreurs sont gérées et loggées
- [ ] Pas de `console.log` en production (utiliser `logger`)
- [ ] Les variables d'environnement sont documentées
- [ ] La documentation est mise à jour si nécessaire
- [ ] Le code est testé avec différents rôles utilisateur

---

## Voir Aussi

- [BACKEND.md](./BACKEND.md) - Patterns backend
- [FRONTEND.md](./FRONTEND.md) - Patterns frontend
- [API_REFERENCE.md](./API_REFERENCE.md) - Standards API
