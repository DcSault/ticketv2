import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService } from '../services/api';

function Admin() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (user?.role !== 'global_admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tenants') {
        const response = await adminService.getTenants();
        setTenants(response.data);
      } else if (activeTab === 'users') {
        const response = await adminService.getUsers();
        setUsers(response.data);
      } else if (activeTab === 'statistics') {
        const response = await adminService.getGlobalStatistics();
        setGlobalStats(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-2xl font-bold text-gray-800 hover:text-blue-600"
            >
              ← CallFixV2
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">Administration</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.fullName || user?.username}
            </span>
            <button
              onClick={() => authService.logout()}
              className="btn btn-secondary text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'tenants'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏢 Tenants
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📥 Import Appels
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'statistics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Statistiques Globales
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : (
          <>
            {activeTab === 'tenants' && (
              <TenantsTab
                tenants={tenants}
                onAdd={() => {
                  setEditingTenant(null);
                  setShowTenantModal(true);
                }}
                onEdit={(tenant) => {
                  setEditingTenant(tenant);
                  setShowTenantModal(true);
                }}
                onDelete={async (id) => {
                  if (!confirm('Supprimer ce tenant ? Toutes les données associées seront supprimées.')) return;
                  try {
                    await adminService.deleteTenant(id);
                    loadData();
                  } catch (error) {
                    alert('Erreur lors de la suppression');
                  }
                }}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab
                users={users}
                tenants={tenants}
                onAdd={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                onEdit={(user) => {
                  setEditingUser(user);
                  setShowUserModal(true);
                }}
                onDelete={async (id) => {
                  if (!confirm('Supprimer cet utilisateur ?')) return;
                  try {
                    await adminService.deleteUser(id);
                    loadData();
                  } catch (error) {
                    alert('Erreur lors de la suppression');
                  }
                }}
                loadTenants={async () => {
                  const response = await adminService.getTenants();
                  setTenants(response.data);
                }}
              />
            )}

            {activeTab === 'import' && (
              <ImportTab tenants={tenants} loadTenants={async () => {
                const response = await adminService.getTenants();
                setTenants(response.data);
              }} />
            )}

            {activeTab === 'statistics' && globalStats && (
              <StatisticsTab stats={globalStats} />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showTenantModal && (
        <TenantModal
          tenant={editingTenant}
          onClose={() => setShowTenantModal(false)}
          onSave={async (data) => {
            try {
              if (editingTenant) {
                await adminService.updateTenant(editingTenant.id, data);
              } else {
                await adminService.createTenant(data);
              }
              setShowTenantModal(false);
              loadData();
            } catch (error) {
              alert(error.response?.data?.error || 'Erreur');
            }
          }}
        />
      )}

      {showUserModal && (
        <UserModal
          user={editingUser}
          tenants={tenants}
          onClose={() => setShowUserModal(false)}
          onSave={async (data) => {
            try {
              if (editingUser) {
                await adminService.updateUser(editingUser.id, data);
              } else {
                await adminService.createUser(data);
              }
              setShowUserModal(false);
              loadData();
            } catch (error) {
              alert(error.response?.data?.error || 'Erreur');
            }
          }}
        />
      )}
    </div>
  );
}

// Tab Import
function ImportTab({ tenants, loadTenants }) {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (tenants.length === 0) {
      loadTenants();
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        alert('Veuillez sélectionner un fichier JSON');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !selectedTenant) {
      alert('Veuillez sélectionner un tenant et un fichier JSON');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      // Valider que c'est un JSON valide
      const fileContent = await file.text();
      try {
        JSON.parse(fileContent);
      } catch (e) {
        throw new Error('Fichier JSON invalide');
      }

      // Importer les appels via l'API (le backend détectera le format)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', selectedTenant);

      const response = await adminService.importCalls(formData);
      
      const { imported, duplicates = 0, total } = response.data;
      let message = `${imported} appel(s) importé(s) avec succès`;
      if (duplicates > 0) {
        message += ` (${duplicates} doublon(s) ignoré(s))`;
      }
      
      setResult({
        success: true,
        message,
        details: response.data
      });
      
      // Réinitialiser le formulaire
      setFile(null);
      setSelectedTenant('');
      document.getElementById('file-input').value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || error.message || 'Erreur lors de l\'import'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Importer des Appels (JSON)</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Formats supportés :</h3>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">✅ Format nouveau (CallFixV2) :</p>
            <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "caller": "Nom de l'appelant",
    "reason": "Raison de l'appel",
    "tags": [{"name": "tag1"}, {"name": "tag2"}],
    "isBlocking": false,
    "isGLPI": false,
    "glpiNumber": "",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">✅ Format ancien (v2.0.7) :</p>
            <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`{
  "metadata": { "version": "2.0.7", ... },
  "data": {
    "tickets": [
      {
        "caller": "...",
        "reason": "...",
        "tags": ["tag1", "tag2"],
        "isBlocking": false,
        "isGLPI": false,
        "createdAt": "..."
      }
    ]
  }
}`}
            </pre>
          </div>

          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-800">
              💡 <strong>Conversion automatique :</strong> Les exports de l'ancienne version sont automatiquement 
              convertis lors de l'import. Les tickets archivés sont ignorés.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner le tenant de destination *
          </label>
          <select
            className="input"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            disabled={importing}
          >
            <option value="">-- Choisir un tenant --</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier JSON *
          </label>
          <input
            id="file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            disabled={importing}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              📄 Fichier sélectionné : <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={!file || !selectedTenant || importing}
          className="btn btn-primary w-full"
        >
          {importing ? '⏳ Import en cours...' : '📥 Importer les appels'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-semibold ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ ' : '❌ '}{result.message}
            </p>
            {result.details && (
              <div className="mt-2 text-sm text-gray-700">
                <p>• Total analysé : {result.details.total}</p>
                <p>• ✅ Appels importés : {result.details.imported}</p>
                {result.details.duplicates > 0 && (
                  <p>• 🔄 Doublons ignorés : {result.details.duplicates}</p>
                )}
                {(result.details.skipped - (result.details.duplicates || 0)) > 0 && (
                  <p>• ⚠️ Erreurs : {result.details.skipped - (result.details.duplicates || 0)}</p>
                )}
                {result.details.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Détails des erreurs :</p>
                    <ul className="list-disc list-inside">
                      {result.details.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Tab Tenants
function TenantsTab({ tenants, onAdd, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Tenants</h2>
        <button onClick={onAdd} className="btn btn-primary">
          + Ajouter un tenant
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom d'affichage</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Utilisateurs</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Appels</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{tenant.id}</td>
                <td className="py-3 px-4 font-medium">{tenant.name}</td>
                <td className="py-3 px-4">{tenant.display_name}</td>
                <td className="py-3 px-4">{tenant.user_count || 0}</td>
                <td className="py-3 px-4">{tenant.call_count || 0}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onEdit(tenant)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(tenant.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab Users
function UsersTab({ users, tenants, onAdd, onEdit, onDelete, loadTenants }) {
  useEffect(() => {
    if (tenants.length === 0) {
      loadTenants();
    }
  }, []);

  const getRoleName = (role) => {
    const roles = {
      user: 'Utilisateur',
      tenant_admin: 'Admin Tenant',
      global_admin: 'Admin Global',
      viewer: 'Viewer'
    };
    return roles[role] || role;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <button onClick={onAdd} className="btn btn-primary">
          + Ajouter un utilisateur
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom complet</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Rôle</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4 font-medium">{user.username}</td>
                <td className="py-3 px-4">{user.full_name || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'global_admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'tenant_admin' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'viewer' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getRoleName(user.role)}
                  </span>
                </td>
                <td className="py-3 px-4">{user.tenant_display_name || '-'}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={user.id === 1}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tab Statistics
function StatisticsTab({ stats }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-blue-50">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total d'appels</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.summary.totalCalls}</p>
        </div>
        <div className="card bg-green-50">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total utilisateurs</h3>
          <p className="text-4xl font-bold text-green-600">{stats.summary.totalUsers}</p>
        </div>
        <div className="card bg-purple-50">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total tenants</h3>
          <p className="text-4xl font-bold text-purple-600">{stats.summary.totalTenants}</p>
        </div>
      </div>

      {/* Calls by tenant */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Appels par tenant</h3>
        <div className="space-y-3">
          {stats.callsByTenant.map((tenant) => (
            <div key={tenant.name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-800">{tenant.display_name}</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
                {tenant.call_count} appels
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent calls */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Appels récents (tous tenants)</h3>
        <div className="space-y-2">
          {stats.recentCalls.slice(0, 10).map((call) => (
            <div key={call.id} className="flex justify-between items-center p-3 border-b">
              <div>
                <p className="font-medium text-gray-800">{call.caller_name}</p>
                <p className="text-sm text-gray-600">
                  {call.tenant_display_name} • {new Date(call.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              {call.is_blocking && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Bloquant
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal Tenant
function TenantModal({ tenant, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    displayName: tenant?.display_name || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {tenant ? 'Modifier le tenant' : 'Nouveau tenant'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom (identifiant) *
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={!!tenant}
              placeholder="ex: infra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'affichage *
            </label>
            <input
              type="text"
              className="input"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              placeholder="ex: Infrastructure"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              {tenant ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal User
function UserModal({ user, tenants, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    fullName: user?.full_name || '',
    role: user?.role || 'user',
    tenantId: user?.tenant_id || '',
    noPasswordLogin: user?.no_password_login || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.password) delete data.password; // Ne pas envoyer si vide
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={!!user}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={formData.noPasswordLogin}
                onChange={(e) => setFormData({ ...formData, noPasswordLogin: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🔓 Connexion sans mot de passe
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mb-3">
              L'utilisateur pourra se connecter uniquement avec son nom d'utilisateur
            </p>
          </div>

          {!formData.noPasswordLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe {!user && '*'}
              </label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user && !formData.noPasswordLogin}
                placeholder={user ? 'Laisser vide pour ne pas changer' : ''}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              className="input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle *
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="user">Utilisateur</option>
              <option value="tenant_admin">Admin Tenant</option>
              <option value="viewer">Viewer (Lecture seule - Multi-tenant)</option>
              <option value="global_admin">Admin Global</option>
            </select>
            {formData.role === 'viewer' && (
              <p className="text-xs text-gray-500 mt-1">
                Le rôle Viewer a accès à tous les tenants en lecture seule
              </p>
            )}
          </div>

          {formData.role !== 'global_admin' && formData.role !== 'viewer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant *
              </label>
              <select
                className="input"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required={formData.role !== 'global_admin' && formData.role !== 'viewer'}
              >
                <option value="">Sélectionner un tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              {user ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Admin;
