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
              ← TicketV2
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
      global_admin: 'Admin Global'
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
    tenantId: user?.tenant_id || ''
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe {!user && '*'}
            </label>
            <input
              type="password"
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              placeholder={user ? 'Laisser vide pour ne pas changer' : ''}
            />
          </div>

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
              <option value="global_admin">Admin Global</option>
            </select>
          </div>

          {formData.role !== 'global_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant *
              </label>
              <select
                className="input"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required={formData.role !== 'global_admin'}
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
