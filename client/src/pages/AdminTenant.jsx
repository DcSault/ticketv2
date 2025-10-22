import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, adminService } from '../services/api';

function AdminTenant() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // Onglets
  const [activeTab, setActiveTab] = useState('dashboard');

  // Users
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
  const [archiving, setArchiving] = useState(false);

  // CLI
  const [cliQuery, setCliQuery] = useState('');
  const [cliResults, setCliResults] = useState(null);
  const [cliLoading, setCliLoading] = useState(false);
  const [cliError, setCliError] = useState(null);

  // Stats Dashboard
  const [stats, setStats] = useState({
    totalCalls: 0,
    todayCalls: 0,
    archivedCalls: 0,
    totalUsers: 0
  });

  useEffect(() => {
    if (user?.role !== 'tenant_admin' && user?.role !== 'global_admin') {
      navigate('/');
      return;
    }
    loadUsers();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

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

  const handleForceArchive = async () => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir archiver tous les appels de plus de 24h ?\n\nCette action archivera tous les appels créés il y a plus de 24 heures qui ne sont pas encore archivés.')) {
      return;
    }

    setArchiving(true);
    try {
      const response = await adminService.forceArchive();
      const { count, message, examples } = response.data;
      
      let detailMessage = `✅ ${message}`;
      
      if (count > 0 && examples && examples.length > 0) {
        detailMessage += '\n\nExemples d\'appels archivés :';
        examples.forEach(ex => {
          const date = new Date(ex.date).toLocaleString('fr-FR');
          detailMessage += `\n• ${ex.caller} (${date})`;
        });
      }
      
      alert(detailMessage);
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Force archive error:', error);
      const errorMsg = error.response?.data?.details || error.response?.data?.error || 'Erreur inconnue';
      alert(`❌ Erreur lors de l'archivage forcé:\n${errorMsg}`);
    } finally {
      setArchiving(false);
    }
  };

  const executeCLI = async () => {
    if (!cliQuery.trim()) {
      setCliError('Veuillez entrer une requête SQL');
      return;
    }

    setCliLoading(true);
    setCliError(null);
    setCliResults(null);

    try {
      const response = await adminService.executeSQL({ query: cliQuery });
      setCliResults(response.data);
    } catch (error) {
      console.error('CLI error:', error);
      setCliError(error.response?.data?.error || 'Erreur lors de l\'exécution');
    } finally {
      setCliLoading(false);
    }
  };

  const quickQuery = (query) => {
    setCliQuery(query);
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
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
            </button>
            <span className="text-gray-300">|</span>
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
        {/* Onglets */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('cli')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cli'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💻 CLI SQL
            </button>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="text-sm opacity-90">Appels Total</div>
                <div className="text-3xl font-bold mt-2">{stats.totalCalls}</div>
              </div>
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="text-sm opacity-90">Appels Aujourd'hui</div>
                <div className="text-3xl font-bold mt-2">{stats.todayCalls}</div>
              </div>
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="text-sm opacity-90">Appels Archivés</div>
                <div className="text-3xl font-bold mt-2">{stats.archivedCalls}</div>
              </div>
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="text-sm opacity-90">Utilisateurs</div>
                <div className="text-3xl font-bold mt-2">{stats.totalUsers}</div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Actions Rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📞</div>
                  <div className="font-semibold">Nouveau Ticket</div>
                  <div className="text-sm text-gray-500">Créer un appel</div>
                </button>
                
                <button
                  onClick={() => navigate('/archives')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📦</div>
                  <div className="font-semibold">Archives</div>
                  <div className="text-sm text-gray-500">Consulter l'historique</div>
                </button>

                <button
                  onClick={() => navigate('/data-management')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <div className="font-semibold">Gestion Données</div>
                  <div className="text-sm text-gray-500">Appelants & Raisons</div>
                </button>

                <button
                  onClick={() => navigate('/export-manager')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold">Exports Avancés</div>
                  <div className="text-sm text-gray-500">Exporter les données</div>
                </button>

                <button
                  onClick={handleForceArchive}
                  disabled={archiving}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
                >
                  <div className="text-2xl mb-2">🗂️</div>
                  <div className="font-semibold">
                    {archiving ? 'Archivage...' : 'Forcer Archivage'}
                  </div>
                  <div className="text-sm text-gray-500">Archiver appels &gt; 24h</div>
                </button>

                <button
                  onClick={() => setActiveTab('cli')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-semibold">CLI SQL</div>
                  <div className="text-sm text-gray-500">Requêtes manuelles</div>
                </button>
              </div>
            </div>

            {/* Informations système */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ℹ️ Informations Système</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tenant</span>
                  <span className="font-semibold">{user?.tenant_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Utilisateur</span>
                  <span className="font-semibold">{user?.fullName || user?.username}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Rôle</span>
                  <span className="font-semibold">
                    {user?.role === 'global_admin' ? '👑 Admin Global' : 
                     user?.role === 'tenant_admin' ? '🔑 Admin Tenant' : 'Utilisateur'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Version</span>
                  <span className="font-semibold">CallFixV2 v2.1.0</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
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
        )}

        {/* CLI Tab */}
        {activeTab === 'cli' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💻 CLI SQL - Requêtes Manuelles</h3>
              
              {/* Quick Queries */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">⚡ Requêtes rapides :</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => quickQuery('SELECT COUNT(*) as total FROM calls WHERE is_archived = false;')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    Compter appels actifs
                  </button>
                  <button
                    onClick={() => quickQuery('SELECT COUNT(*) as total FROM calls WHERE is_archived = true;')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    Compter archivés
                  </button>
                  <button
                    onClick={() => quickQuery('SELECT * FROM calls WHERE created_at < (NOW() - INTERVAL \'24 hours\') AND is_archived = false ORDER BY created_at DESC LIMIT 10;')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    Appels &gt; 24h non archivés
                  </button>
                  <button
                    onClick={() => quickQuery('SELECT caller_name, COUNT(*) as count FROM calls GROUP BY caller_name ORDER BY count DESC LIMIT 10;')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    Top 10 appelants
                  </button>
                  <button
                    onClick={() => quickQuery('SELECT * FROM calls ORDER BY created_at DESC LIMIT 20;')}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    20 derniers appels
                  </button>
                </div>
              </div>

              {/* Query Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requête SQL :
                </label>
                <textarea
                  value={cliQuery}
                  onChange={(e) => setCliQuery(e.target.value)}
                  className="input font-mono text-sm"
                  rows="6"
                  placeholder="SELECT * FROM calls WHERE ..."
                />
              </div>

              {/* Execute Button */}
              <div className="flex gap-2">
                <button
                  onClick={executeCLI}
                  disabled={cliLoading}
                  className="btn btn-primary"
                >
                  {cliLoading ? '⏳ Exécution...' : '▶️ Exécuter'}
                </button>
                <button
                  onClick={() => {
                    setCliQuery('');
                    setCliResults(null);
                    setCliError(null);
                  }}
                  className="btn btn-secondary"
                >
                  🗑️ Effacer
                </button>
              </div>

              {/* Error */}
              {cliError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <div className="font-semibold mb-1">❌ Erreur</div>
                  <div className="text-sm">{cliError}</div>
                </div>
              )}

              {/* Results */}
              {cliResults && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold text-gray-700">
                      ✅ Résultats ({cliResults.rowCount} ligne{cliResults.rowCount > 1 ? 's' : ''})
                    </div>
                    {cliResults.command && (
                      <div className="text-xs text-gray-500">
                        Commande: {cliResults.command}
                      </div>
                    )}
                  </div>

                  {cliResults.rows && cliResults.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {Object.keys(cliResults.rows[0]).map(key => (
                              <th key={key} className="text-left py-2 px-3 border-b border-gray-200 font-semibold">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                          {cliResults.rows.map((row, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="py-2 px-3">
                                  {val === null ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : typeof val === 'boolean' ? (
                                    val ? '✓' : '✗'
                                  ) : val instanceof Date ? (
                                    new Date(val).toLocaleString('fr-FR')
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                      Aucune ligne retournée
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-semibold text-yellow-800 mb-1">Attention</div>
                  <div className="text-sm text-yellow-700">
                    • Les requêtes UPDATE/DELETE sont autorisées - faites attention !<br/>
                    • Seules les requêtes sur votre tenant sont autorisées (filtrage automatique)<br/>
                    • Les transactions ne sont pas supportées<br/>
                    • Évitez les requêtes lourdes qui pourraient ralentir le système
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
