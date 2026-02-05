# ⚛️ Frontend Documentation

> **Dernière mise à jour**: 2026-01-16 - Création initiale

---

## Vue d'Ensemble

Le frontend de TicketV2 est une **Single Page Application (SPA)** construite avec React 18 et Vite.

### Stack Technique

| Package | Version | Rôle |
|---------|---------|------|
| react | 18.2.x | Bibliothèque UI |
| react-dom | 18.2.x | Rendu DOM |
| react-router-dom | 6.20.x | Routing client |
| axios | 1.6.x | Client HTTP |
| vite | 5.0.x | Build tool & dev server |
| tailwindcss | 3.3.x | Framework CSS |
| chart.js | 4.5.x | Graphiques |
| react-chartjs-2 | 5.3.x | Wrapper React Chart.js |
| recharts | 2.10.x | Graphiques alternatifs |

---

## Architecture

```
client/
├── src/
│   ├── main.jsx              # Bootstrap React
│   ├── App.jsx               # Composant racine, routing
│   ├── index.css             # Styles Tailwind
│   │
│   ├── pages/                # Composants de pages
│   │   ├── Admin.jsx         # Administration globale
│   │   ├── AdminTenant.jsx   # Administration tenant
│   │   ├── Archives.jsx      # Gestion des archives
│   │   ├── Dashboard.jsx     # Page principale
│   │   ├── DataManagement.jsx# Gestion données
│   │   ├── ExportManager.jsx # Export
│   │   ├── Home.jsx          # Accueil
│   │   ├── ImportManager.jsx # Import
│   │   ├── Login.jsx         # Authentification
│   │   └── Statistics.jsx    # Statistiques
│   │
│   └── services/             # Couche API
│       ├── api.js            # Export centralisé
│       ├── http-common.js    # Config Axios
│       ├── authService.js    # Service auth
│       ├── callService.js    # Service appels
│       ├── adminService.js   # Service admin
│       └── statisticsService.js
│
├── index.html                # Template HTML
├── package.json
├── vite.config.js            # Configuration Vite
├── tailwind.config.js        # Configuration Tailwind
└── postcss.config.js
```

---

## Configuration Vite

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

Le proxy permet d'appeler `/api/*` en développement sans problèmes CORS.

---

## Configuration Tailwind

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### `index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Styles personnalisés ici */
```

---

## Point d'Entrée

### `main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## Routing (`App.jsx`)

### Composants de Protection

```jsx
// Route protégée (authentification requise)
function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Route admin global uniquement
function AdminRoute({ children }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'global_admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

// Route tenant admin (ou global admin)
function TenantAdminRoute({ children }) {
  const user = authService.getCurrentUser();
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'tenant_admin' && user?.role !== 'global_admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
```

### Définition des Routes

```jsx
function AppRouter() {
  return (
    <Routes>
      {/* Route publique */}
      <Route 
        path="/login" 
        element={
          authService.isAuthenticated() 
            ? <Navigate to="/" replace /> 
            : <Login />
        } 
      />
      
      {/* Routes protégées (tous les utilisateurs) */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />
      
      {/* Routes tenant admin */}
      <Route path="/admin-tenant" element={<TenantAdminRoute><AdminTenant /></TenantAdminRoute>} />
      <Route path="/data" element={<TenantAdminRoute><DataManagement /></TenantAdminRoute>} />
      <Route path="/export" element={<TenantAdminRoute><ExportManager /></TenantAdminRoute>} />
      <Route path="/import" element={<TenantAdminRoute><ImportManager /></TenantAdminRoute>} />
      
      {/* Routes global admin */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
    </Routes>
  );
}
```

---

## Services API

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Pages                               │
│  Dashboard │ Statistics │ Admin │ Login │ ...              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Services Layer                         │
│  authService │ callService │ adminService │ statisticsService│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      http-common.js                         │
│              (Axios instance + intercepteurs)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                      API REST /api/*
```

### `http-common.js`

Configuration centralisée d'Axios avec intercepteurs.

```javascript
import axios from 'axios';

const API_URL = '/api';

// Instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur REQUEST : Ajoute le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur RESPONSE : Gère les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config.url?.includes('/auth/login');
    const isLoginPage = window.location.pathname === '/login';

    // Redirection si token invalide (sauf sur login)
    if (error.response?.status === 401 && !isLoginRequest && !isLoginPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### `authService.js`

Gestion de l'authentification.

```javascript
import api from './http-common';

export const authService = {
  // Connexion
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Récupérer l'utilisateur courant
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Vérifier si connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};
```

---

### `callService.js`

Gestion des appels.

```javascript
import api from './http-common';

export const callService = {
  // Liste des appels
  getCalls: (params = {}) => {
    return api.get('/calls', { params });
  },

  // Créer un appel
  createCall: (data) => {
    return api.post('/calls', data);
  },

  // Modifier un appel
  updateCall: (id, data) => {
    return api.put(`/calls/${id}`, data);
  },

  // Supprimer un appel
  deleteCall: (id) => {
    return api.delete(`/calls/${id}`);
  },

  // Archiver un appel
  archiveCall: (id) => {
    return api.post(`/calls/${id}/archive`);
  },

  // Désarchiver un appel
  unarchiveCall: (id) => {
    return api.post(`/calls/${id}/unarchive`);
  },

  // Suggestions (autocomplétion)
  getSuggestions: (type) => {
    return api.get(`/calls/suggestions/${type}`);
  },

  // Suggestions rapides
  getQuickSuggestions: () => {
    return api.get('/calls/quick-suggestions');
  }
};
```

---

### `adminService.js`

Administration des tenants et utilisateurs.

```javascript
import api from './http-common';

export const adminService = {
  // Tenants
  getTenants: () => api.get('/admin/tenants'),
  createTenant: (data) => api.post('/admin/tenants', data),
  updateTenant: (id, data) => api.put(`/admin/tenants/${id}`, data),
  deleteTenant: (id) => api.delete(`/admin/tenants/${id}`),

  // Users
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};
```

---

### `statisticsService.js`

Statistiques et export.

```javascript
import api from './http-common';

export const statisticsService = {
  getStatistics: (params = {}) => {
    return api.get('/statistics', { params });
  },

  exportData: (params = {}) => {
    return api.get('/statistics/export', { params });
  }
};
```

---

## Composants de Pages

### Structure Standard d'une Page

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, someService } from '../services/api';

function ExamplePage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // État
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await someService.getData();
      setData(response.data);
    } catch (err) {
      setError('Erreur lors du chargement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Affichage conditionnel
  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Titre de la Page
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Contenu */}
      </main>
    </div>
  );
}

export default ExamplePage;
```

---

### Pages Existantes

| Page | Fichier | Description | Accès |
|------|---------|-------------|-------|
| Login | `Login.jsx` | Formulaire de connexion | Public |
| Home | `Home.jsx` | Page d'accueil, menu | Authentifié |
| Dashboard | `Dashboard.jsx` | Gestion des appels | Authentifié |
| Statistics | `Statistics.jsx` | Graphiques et stats | Authentifié |
| Archives | `Archives.jsx` | Appels archivés | Authentifié |
| Admin | `Admin.jsx` | Gestion tenants/users | Global Admin |
| AdminTenant | `AdminTenant.jsx` | Gestion users du tenant | Tenant Admin |
| DataManagement | `DataManagement.jsx` | Gestion callers/tags | Tenant Admin |
| ExportManager | `ExportManager.jsx` | Export données | Tenant Admin |
| ImportManager | `ImportManager.jsx` | Import données | Tenant Admin |

---

## Dashboard - Composant Principal

### État

```jsx
// Données
const [calls, setCalls] = useState([]);
const [loading, setLoading] = useState(true);

// Sélection tenant (admin/viewer)
const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';
const [tenants, setTenants] = useState([]);
const [selectedTenant, setSelectedTenant] = useState(
  canSelectTenant
    ? localStorage.getItem('selectedTenantId') || 'all'
    : null
);

// Formulaire
const [formData, setFormData] = useState({
  caller: '',
  reason: '',
  tags: [],
  isGlpi: false,
  glpiNumber: '',
  isBlocking: false
});

// Suggestions (autocomplétion)
const [callerSuggestions, setCallerSuggestions] = useState([]);
const [reasonSuggestions, setReasonSuggestions] = useState([]);
const [tagSuggestions, setTagSuggestions] = useState([]);

// Mode édition
const [editingCall, setEditingCall] = useState(null);
```

### Chargement des Données

```jsx
useEffect(() => {
  if (canSelectTenant) {
    loadTenants();
  }
  loadQuickSuggestions();
}, []);

useEffect(() => {
  loadCalls();
  loadSuggestions();
}, [selectedTenant]);

const loadCalls = async () => {
  try {
    const params = { 
      limit: 100,
      archived: 'false'
    };
    if (canSelectTenant && selectedTenant && selectedTenant !== 'all') {
      params.tenantId = selectedTenant;
    }
    const response = await callService.getCalls(params);
    setCalls(response.data);
  } catch (error) {
    console.error('Error loading calls:', error);
  } finally {
    setLoading(false);
  }
};
```

### Actions CRUD

```jsx
// Créer
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await callService.createCall(formData);
    setCalls([response.data, ...calls]);
    setFormData({ caller: '', reason: '', tags: [], isGlpi: false, glpiNumber: '', isBlocking: false });
    await loadSuggestions();
  } catch (error) {
    alert('Erreur lors de la création');
  }
};

// Modifier
const handleUpdate = async (id, updates) => {
  try {
    const response = await callService.updateCall(id, updates);
    setCalls(calls.map(call => call.id === id ? response.data : call));
    setEditingCall(null);
  } catch (error) {
    alert('Erreur lors de la modification');
  }
};

// Supprimer
const handleDelete = async (id) => {
  if (!confirm('Êtes-vous sûr ?')) return;
  try {
    await callService.deleteCall(id);
    setCalls(calls.filter(call => call.id !== id));
  } catch (error) {
    alert('Erreur lors de la suppression');
  }
};

// Archiver
const handleArchive = async (id) => {
  if (!confirm('Archiver cet appel ?')) return;
  try {
    await callService.archiveCall(id);
    setCalls(calls.filter(call => call.id !== id));
  } catch (error) {
    alert('Erreur lors de l\'archivage');
  }
};
```

---

## Patterns de Code

### Gestion des Rôles dans le JSX

```jsx
{/* Afficher seulement pour certains rôles */}
{(user?.role === 'global_admin' || user?.role === 'tenant_admin') && (
  <button onClick={handleEdit}>Modifier</button>
)}

{/* Désactiver pour les viewers */}
{user?.role !== 'viewer' && (
  <button onClick={handleCreate}>Créer</button>
)}
```

### Sélecteur de Tenant

```jsx
{canSelectTenant && (
  <select
    value={selectedTenant}
    onChange={(e) => handleTenantChange(e.target.value)}
    className="border rounded px-3 py-2"
  >
    <option value="all">Tous les tenants</option>
    {tenants.map(tenant => (
      <option key={tenant.id} value={tenant.id}>
        {tenant.display_name}
      </option>
    ))}
  </select>
)}
```

### Formulaire avec Suggestions

```jsx
<div className="relative">
  <input
    type="text"
    value={formData.caller}
    onChange={(e) => {
      setFormData({ ...formData, caller: e.target.value });
      setShowCallerSuggestions(true);
    }}
    onBlur={() => setTimeout(() => setShowCallerSuggestions(false), 200)}
    placeholder="Nom de l'appelant"
    className="w-full border rounded px-3 py-2"
  />
  
  {showCallerSuggestions && filteredSuggestions.length > 0 && (
    <ul className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-48 overflow-auto">
      {filteredSuggestions.map(suggestion => (
        <li
          key={suggestion.id}
          onClick={() => {
            setFormData({ ...formData, caller: suggestion.name });
            setShowCallerSuggestions(false);
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {suggestion.name}
        </li>
      ))}
    </ul>
  )}
</div>
```

---

## Styles Tailwind Courants

### Layout

```jsx
// Container centré avec max-width
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Flexbox
<div className="flex items-center justify-between">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Composants

```jsx
// Bouton primaire
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">

// Bouton danger
<button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded">

// Input
<input className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">

// Card
<div className="bg-white rounded-lg shadow-md p-6">

// Badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
```

---

## Ajouter une Nouvelle Page

### 1. Créer le Composant

```jsx
// client/src/pages/NewPage.jsx
import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';

function NewPage() {
  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold">Nouvelle Page</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Contenu */}
      </main>
    </div>
  );
}

export default NewPage;
```

### 2. Ajouter la Route

```jsx
// App.jsx
import NewPage from './pages/NewPage';

// Dans Routes
<Route 
  path="/new-page" 
  element={<ProtectedRoute><NewPage /></ProtectedRoute>} 
/>
```

### 3. Ajouter au Menu

Dans `Home.jsx` ou composant de navigation, ajouter un lien.

### 4. Documenter

Mettre à jour ce fichier avec la nouvelle page.

---

## Ajouter un Nouveau Service

### 1. Créer le Service

```javascript
// client/src/services/newService.js
import api from './http-common';

export const newService = {
  getItems: (params = {}) => api.get('/new-endpoint', { params }),
  createItem: (data) => api.post('/new-endpoint', data),
  updateItem: (id, data) => api.put(`/new-endpoint/${id}`, data),
  deleteItem: (id) => api.delete(`/new-endpoint/${id}`)
};
```

### 2. Exporter depuis api.js

```javascript
// client/src/services/api.js
export { newService } from './newService';
```

### 3. Utiliser dans un Composant

```jsx
import { newService } from '../services/api';

const loadItems = async () => {
  const response = await newService.getItems();
  setItems(response.data);
};
```

---

## Voir Aussi

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Vue d'ensemble
- [API_REFERENCE.md](./API_REFERENCE.md) - Endpoints API
- [CONVENTIONS.md](./CONVENTIONS.md) - Standards de code
