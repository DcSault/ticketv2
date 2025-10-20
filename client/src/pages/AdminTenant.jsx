import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService } from '../services/api';

function AdminTenant() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'user',
    noPasswordLogin: false
  });

  useEffect(() => {
    if (user?.role !== 'tenant_admin' && user?.role !== 'global_admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers();
      // Le backend filtre déjà selon le rôle (tenant_admin voit son tenant, global_admin voit tous)
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser({
        ...userForm,
        tenant_id: user.tenant_id
      });
      setShowUserModal(false);
      setUserForm({ username: '', password: '', fullName: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updates = { ...userForm };
      if (!updates.password) delete updates.password;
      
      await adminService.updateUser(editingUser.id, updates);
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', fullName: '', role: 'user' });
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      password: '',
      fullName: u.full_name || '',
      role: u.role,
      noPasswordLogin: u.no_password_login || false
    });
    setShowUserModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', fullName: '', role: 'user', noPasswordLogin: false });
    setShowUserModal(true);
  };

  const closeModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ username: '', password: '', fullName: '', role: 'user', noPasswordLogin: false });
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
            <span className="text-gray-600">Administration Tenant</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/data-management')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📋 Gestion des données
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/export-manager')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📊 Exports avancés
            </button>
            <span className="text-gray-300">|</span>
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
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">👥 Gestion des Utilisateurs</h2>
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
            >
              ➕ Nouvel Utilisateur
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nom d'utilisateur</th>
                    <th className="text-left py-3 px-4">Nom complet</th>
                    <th className="text-left py-3 px-4">Rôle</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{u.username}</td>
                      <td className="py-3 px-4">{u.full_name || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          u.role === 'tenant_admin' ? 'bg-purple-100 text-purple-800' : 
                          u.role === 'viewer' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role === 'tenant_admin' ? 'Admin Tenant' : 
                           u.role === 'viewer' ? 'Viewer' : 
                           'Utilisateur'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Utilisateur */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  className="input"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={userForm.noPasswordLogin}
                    onChange={(e) => setUserForm({ ...userForm, noPasswordLogin: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🔓 Connexion sans mot de passe
                  </span>
                </label>
              </div>

              {!userForm.noPasswordLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe {!editingUser && '*'}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? 'Laisser vide pour ne pas changer' : ''}
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
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  className="input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                >
                  <option value="user">Utilisateur</option>
                  <option value="tenant_admin">Admin Tenant</option>
                  <option value="viewer">Viewer (Lecture seule - Multi-tenant)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Le rôle Viewer a accès à tous les tenants en lecture seule
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTenant;
