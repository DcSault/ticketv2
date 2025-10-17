import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService, adminService } from '../services/api';

function App() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tenant selection for global_admin
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    user?.role === 'global_admin' 
      ? localStorage.getItem('selectedTenantId') || 'all'
      : null
  );

  // Form state
  const [formData, setFormData] = useState({
    caller: '',
    reason: '',
    tags: [],
    isGlpi: false,
    glpiNumber: '',
    isBlocking: false
  });

  // Suggestions
  const [callerSuggestions, setCallerSuggestions] = useState([]);
  const [reasonSuggestions, setReasonSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showCallerSuggestions, setShowCallerSuggestions] = useState(false);
  const [showReasonSuggestions, setShowReasonSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  // Edit state
  const [editingCall, setEditingCall] = useState(null);

  useEffect(() => {
    if (user?.role === 'global_admin') {
      loadTenants();
    }
  }, []);

  useEffect(() => {
    loadCalls();
    loadSuggestions();
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const response = await adminService.getTenants();
      setTenants(response.data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleTenantChange = (tenantId) => {
    setSelectedTenant(tenantId);
    if (tenantId === 'all') {
      localStorage.removeItem('selectedTenantId');
    } else {
      localStorage.setItem('selectedTenantId', tenantId);
    }
  };

  const loadCalls = async () => {
    try {
      const params = { limit: 100 };
      if (user?.role === 'global_admin' && selectedTenant && selectedTenant !== 'all') {
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

  const loadSuggestions = async () => {
    try {
      const [callers, reasons, tags] = await Promise.all([
        callService.getSuggestions('callers'),
        callService.getSuggestions('reasons'),
        callService.getSuggestions('tags')
      ]);
      setCallerSuggestions(callers.data);
      setReasonSuggestions(reasons.data);
      setTagSuggestions(tags.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await callService.createCall(formData);
      setCalls([response.data, ...calls]);
      
      // Reset form
      setFormData({
        caller: '',
        reason: '',
        tags: [],
        isGlpi: false,
        glpiNumber: '',
        isBlocking: false
      });
      
      // Reload suggestions et appels pour voir les nouveaux dans les stats
      await loadSuggestions();
      await loadCalls();
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Erreur lors de la création de l\'appel');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const response = await callService.updateCall(id, updates);
      setCalls(calls.map(call => call.id === id ? response.data : call));
      setEditingCall(null);
      
      // Reload suggestions pour mettre à jour l'autocomplétion
      await loadSuggestions();
    } catch (error) {
      console.error('Error updating call:', error);
      alert('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appel ?')) return;
    
    try {
      await callService.deleteCall(id);
      setCalls(calls.filter(call => call.id !== id));
    } catch (error) {
      console.error('Error deleting call:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archiver cet appel ? Il sera déplacé dans les archives.')) return;
    
    try {
      await callService.archiveCall(id);
      setCalls(calls.filter(call => call.id !== id));
      alert('✅ Appel archivé avec succès');
    } catch (error) {
      console.error('Error archiving call:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
    setCurrentTag('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayName = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
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
            <span className="text-gray-600">Application</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/statistics')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📊 Statistiques
            </button>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
            </button>
            {user?.role === 'global_admin' && (
              <>
                <select
                  value={selectedTenant || 'all'}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">🌍 Tous les tenants</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => navigate('/admin')}
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium"
                >
                  🛠️ Admin
                </button>
              </>
            )}
            {user?.role === 'tenant_admin' && (
              <button
                onClick={() => navigate('/admin-tenant')}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium"
              >
                👥 Admin Tenant
              </button>
            )}
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
        {/* Form */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Nouvel Appel</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Appelant */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appelant *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.caller}
                  onChange={(e) => {
                    setFormData({ ...formData, caller: e.target.value });
                    setShowCallerSuggestions(true);
                  }}
                  onFocus={() => setShowCallerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCallerSuggestions(false), 200)}
                  required
                />
                {showCallerSuggestions && callerSuggestions.length > 0 && formData.caller && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {callerSuggestions
                      .filter(s => s.toLowerCase().includes(formData.caller.toLowerCase()))
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                          onClick={() => {
                            setFormData({ ...formData, caller: suggestion });
                            setShowCallerSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Raison */}
              {!formData.isGlpi && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.reason}
                    onChange={(e) => {
                      setFormData({ ...formData, reason: e.target.value });
                      setShowReasonSuggestions(true);
                    }}
                    onFocus={() => setShowReasonSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReasonSuggestions(false), 200)}
                  />
                  {showReasonSuggestions && reasonSuggestions.length > 0 && formData.reason && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {reasonSuggestions
                        .filter(s => s.toLowerCase().includes(formData.reason.toLowerCase()))
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            onClick={() => {
                              setFormData({ ...formData, reason: suggestion });
                              setShowReasonSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {!formData.isGlpi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="input"
                    value={currentTag}
                    onChange={(e) => {
                      setCurrentTag(e.target.value);
                      setShowTagSuggestions(true);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(currentTag);
                      }
                    }}
                    onFocus={() => setShowTagSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    placeholder="Ajouter un tag..."
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && currentTag && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {tagSuggestions
                        .filter(s => s.toLowerCase().includes(currentTag.toLowerCase()))
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                            onClick={() => addTag(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isGlpi}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    isGlpi: e.target.checked,
                    reason: e.target.checked ? '' : formData.reason,
                    tags: e.target.checked ? [] : formData.tags
                  })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Ticket GLPI</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBlocking}
                  onChange={(e) => setFormData({ ...formData, isBlocking: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Bloquant</span>
              </label>
            </div>

            {formData.isGlpi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro GLPI
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.glpiNumber}
                  onChange={(e) => setFormData({ ...formData, glpiNumber: e.target.value })}
                  placeholder="Ex: GLPI-12345"
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Enregistrer l'appel
            </button>
          </form>
        </div>

        {/* Liste des appels */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Appels d'aujourd'hui ({calls.length})
            </h2>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              📦 Voir les appels précédents
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Chargement...</p>
          ) : calls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">Aucun appel aujourd'hui</p>
              <p className="text-sm text-gray-500">
                Les appels des jours précédents sont dans les{' '}
                <button
                  onClick={() => navigate('/archives')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Archives
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {calls.map((call) => (
                <CallItem
                  key={call.id}
                  call={call}
                  isEditing={editingCall === call.id}
                  onEdit={() => setEditingCall(call.id)}
                  onCancel={() => setEditingCall(null)}
                  onSave={(updates) => handleUpdate(call.id, updates)}
                  onDelete={() => handleDelete(call.id)}
                  onArchive={() => handleArchive(call.id)}
                  formatDate={formatDate}
                  getDayName={getDayName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant pour un appel
function CallItem({ call, isEditing, onEdit, onCancel, onSave, onDelete, onArchive, formatDate, getDayName }) {
  // Parser les tags correctement dès l'initialisation
  const initialTags = (call.tags && Array.isArray(call.tags)) 
    ? call.tags.filter(t => t && t.name).map(t => t.name) 
    : [];
  
  const [editData, setEditData] = useState({
    caller: call.caller_name,
    reason: call.reason_name || '',
    tags: initialTags,
    isGlpi: call.is_glpi,
    glpiNumber: call.glpi_number || '',
    isBlocking: call.is_blocking,
    createdAt: call.created_at
  });

  const [callerSuggestions, setCallerSuggestions] = useState([]);
  const [reasonSuggestions, setReasonSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showCallerSuggestions, setShowCallerSuggestions] = useState(false);
  const [showReasonSuggestions, setShowReasonSuggestions] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  // Réinitialiser editData quand on passe en mode édition
  useEffect(() => {
    if (isEditing) {
      // Parser les tags correctement
      let parsedTags = [];
      if (call.tags && Array.isArray(call.tags)) {
        parsedTags = call.tags
          .filter(t => t && (typeof t === 'string' ? t : t.name)) // Support string ou objet
          .map(t => typeof t === 'string' ? t : t.name);
      }
      
      console.log('🔍 Call complet:', call);
      console.log('🏷️ call.tags brut:', call.tags);
      console.log('🏷️ Type de call.tags:', typeof call.tags, Array.isArray(call.tags));
      console.log('🏷️ Tags parsés pour editData:', parsedTags);
      
      setEditData({
        caller: call.caller_name,
        reason: call.reason_name || '',
        tags: parsedTags,
        isGlpi: call.is_glpi,
        glpiNumber: call.glpi_number || '',
        isBlocking: call.is_blocking,
        createdAt: call.created_at
      });
      loadSuggestions();
    }
  }, [isEditing]);

  const loadSuggestions = async () => {
    try {
      const [callers, reasons, tags] = await Promise.all([
        callService.getSuggestions('callers'),
        callService.getSuggestions('reasons'),
        callService.getSuggestions('tags')
      ]);
      setCallerSuggestions(callers.data);
      setReasonSuggestions(reasons.data);
      setTagSuggestions(tags.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const addTag = (tag) => {
    if (tag && !editData.tags.includes(tag)) {
      setEditData({ ...editData, tags: [...editData.tags, tag] });
    }
    setCurrentTag('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setEditData({
      ...editData,
      tags: editData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  if (isEditing) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 bg-blue-50">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date/Heure</label>
            <input
              type="datetime-local"
              className="input text-sm"
              value={new Date(editData.createdAt).toISOString().slice(0, 16)}
              onChange={(e) => setEditData({ ...editData, createdAt: e.target.value })}
            />
          </div>
          
          {/* Appelant avec autocomplétion */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Appelant</label>
            <input
              type="text"
              className="input text-sm"
              value={editData.caller}
              onChange={(e) => {
                setEditData({ ...editData, caller: e.target.value });
                setShowCallerSuggestions(true);
              }}
              onFocus={() => setShowCallerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCallerSuggestions(false), 200)}
            />
            {showCallerSuggestions && callerSuggestions.length > 0 && editData.caller && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {callerSuggestions
                  .filter(s => s.toLowerCase().includes(editData.caller.toLowerCase()))
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setEditData({ ...editData, caller: suggestion });
                        setShowCallerSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Raison avec autocomplétion */}
          {!editData.isGlpi && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
              <input
                type="text"
                className="input text-sm"
                value={editData.reason}
                onChange={(e) => {
                  setEditData({ ...editData, reason: e.target.value });
                  setShowReasonSuggestions(true);
                }}
                onFocus={() => setShowReasonSuggestions(true)}
                onBlur={() => setTimeout(() => setShowReasonSuggestions(false), 200)}
              />
              {showReasonSuggestions && reasonSuggestions.length > 0 && editData.reason && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {reasonSuggestions
                    .filter(s => s.toLowerCase().includes(editData.reason.toLowerCase()))
                    .map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => {
                          setEditData({ ...editData, reason: suggestion });
                          setShowReasonSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Tags avec autocomplétion */}
          {!editData.isGlpi && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags {editData.tags.length > 0 && `(${editData.tags.length})`}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editData.tags && editData.tags.length > 0 ? (
                  editData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Aucun tag</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  className="input text-sm"
                  value={currentTag}
                  onChange={(e) => {
                    setCurrentTag(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(currentTag);
                    }
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  placeholder="Ajouter un tag..."
                />
                {showTagSuggestions && tagSuggestions.length > 0 && currentTag && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {tagSuggestions
                      .filter(s => s.toLowerCase().includes(currentTag.toLowerCase()))
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          onClick={() => addTag(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.isGlpi}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  isGlpi: e.target.checked,
                  reason: e.target.checked ? '' : editData.reason,
                  tags: e.target.checked ? [] : editData.tags
                })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Ticket GLPI</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.isBlocking}
                onChange={(e) => setEditData({ ...editData, isBlocking: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Bloquant</span>
            </label>
          </div>

          {editData.isGlpi && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro GLPI
              </label>
              <input
                type="text"
                className="input text-sm"
                value={editData.glpiNumber}
                onChange={(e) => setEditData({ ...editData, glpiNumber: e.target.value })}
                placeholder="Ex: GLPI-12345"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onSave(editData)}
              className="btn btn-primary text-sm"
            >
              Enregistrer
            </button>
            <button
              onClick={onCancel}
              className="btn btn-secondary text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              {formatDate(call.created_at)}
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 capitalize">
              {getDayName(call.created_at)}
            </span>
            {call.is_blocking && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Bloquant
              </span>
            )}
            {call.is_glpi && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                GLPI {call.glpi_number && `- ${call.glpi_number}`}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-gray-800 mb-1">
            {call.caller_name}
          </p>
          {call.reason_name && (
            <p className="text-gray-600 mb-2">{call.reason_name}</p>
          )}
          {call.tags && Array.isArray(call.tags) && call.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {call.tags
                .filter(t => t && (typeof t === 'string' ? t : t.name))
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Modifier
          </button>
          <button
            onClick={onArchive}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
          >
            📦 Archiver
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
