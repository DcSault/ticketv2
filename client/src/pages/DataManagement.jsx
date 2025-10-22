import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import axios from 'axios';

const API_URL = '/api';

function DataManagement() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState('callers'); // callers, reasons, tags

  // États pour les données
  const [callers, setCallers] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [tags, setTags] = useState([]);
  
  // États pour les modales
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' ou 'delete'
  const [selectedItem, setSelectedItem] = useState(null);
  const [editName, setEditName] = useState('');

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [callersRes, reasonsRes, tagsRes] = await Promise.all([
        axios.get(`${API_URL}/data-management/callers`, config),
        axios.get(`${API_URL}/data-management/reasons`, config),
        axios.get(`${API_URL}/data-management/tags`, config)
      ]);

      setCallers(callersRes.data);
      setReasons(reasonsRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Erreur lors du chargement des données');
    }
  };

  const handleEdit = (item, type) => {
    setSelectedItem({ ...item, type });
    setEditName(item.name);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = (item, type) => {
    setSelectedItem({ ...item, type });
    setModalMode('delete');
    setShowModal(true);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      alert('Le nom ne peut pas être vide');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(
        `${API_URL}/data-management/${selectedItem.type}/${selectedItem.id}`,
        { name: editName.trim() },
        config
      );

      await loadData();
      setShowModal(false);
      setSelectedItem(null);
      setEditName('');
    } catch (error) {
      console.error('Error saving:', error);
      alert(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(
        `${API_URL}/data-management/${selectedItem.type}/${selectedItem.id}`,
        config
      );

      await loadData();
      setShowModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'callers': return 'appelant';
      case 'reasons': return 'raison';
      case 'tags': return 'tag';
      default: return 'élément';
    }
  };

  const renderTable = (data, type, icon) => (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span>
          {type === 'callers' && 'Appelants'}
          {type === 'reasons' && 'Raisons'}
          {type === 'tags' && 'Tags'}
        </h2>
        <span className="text-sm text-gray-600">
          {data.length} {data.length > 1 ? 'éléments' : 'élément'}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun élément trouvé
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nom</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Utilisation</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100 table-row-hover animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="py-3 px-4 text-gray-800">{item.name}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 transition-all hover:shadow-md">
                      {item.usage_count} appel{item.usage_count > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleEdit(item, type)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3 transition-all hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(item, type)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-all hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (!user || (user.role !== 'global_admin' && user.role !== 'tenant_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas les droits pour accéder à cette page</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

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
            <span className="text-gray-600">Gestion des données</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📱 Application
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
            </button>
            <span className="text-gray-300">|</span>
            {user?.role === 'global_admin' && (
              <>
                <button
                  onClick={() => navigate('/admin')}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  🔐 Admin Global
                </button>
                <span className="text-gray-300">|</span>
              </>
            )}
            {(user?.role === 'tenant_admin' || user?.role === 'global_admin') && (
              <>
                <button
                  onClick={() => navigate('/admin-tenant')}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  👥 Admin Tenant
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => navigate('/export-manager')}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  📊 Exports
                </button>
                <span className="text-gray-300">|</span>
              </>
            )}
            <span className="text-sm text-gray-600">{user?.fullName || user?.username}</span>
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
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('callers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'callers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Appelants ({callers.length})
            </button>
            <button
              onClick={() => setActiveTab('reasons')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'reasons'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Raisons ({reasons.length})
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'tags'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Tags ({tags.length})
            </button>
          </nav>
        </div>

        {/* Contenu */}
        {activeTab === 'callers' && renderTable(callers, 'callers', '')}
        {activeTab === 'reasons' && renderTable(reasons, 'reasons', '')}
        {activeTab === 'tags' && renderTable(tags, 'tags', '')}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            {modalMode === 'edit' ? (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Modifier {getTypeLabel(selectedItem?.type)}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedItem(null);
                      setEditName('');
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button onClick={saveEdit} className="btn btn-primary">
                    Enregistrer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Confirmer la suppression
                </h3>
                <p className="text-gray-600 mb-2">
                  Êtes-vous sûr de vouloir supprimer "{selectedItem?.name}" ?
                </p>
                {selectedItem?.usage_count > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      Attention : Cet élément est utilisé dans <strong>{selectedItem.usage_count}</strong> appel{selectedItem.usage_count > 1 ? 's' : ''}.
                      {selectedItem.type === 'callers' && ' Le nom de l\'appelant sera supprimé des appels concernés.'}
                      {selectedItem.type === 'reasons' && ' Le nom de la raison sera supprimé des appels concernés.'}
                      {selectedItem.type === 'tags' && ' Le tag sera retiré des appels concernés.'}
                    </p>
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedItem(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button onClick={confirmDelete} className="btn btn-danger">
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataManagement;
