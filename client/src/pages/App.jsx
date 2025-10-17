import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService, adminService } from '../services/api';

function App() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tenant selection for global_admin and viewer
  const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    canSelectTenant
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

  // Quick form state
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState({ callers: [], reasons: [], tags: [] });
  const [quickFormData, setQuickFormData] = useState({
    caller: '',
    reason: '',
    tags: [],
    isBlocking: false
  });

  // Edit state
  const [editingCall, setEditingCall] = useState(null);

  useEffect(() => {
    if (canSelectTenant) {
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

  // Quick form functions
  const loadQuickSuggestions = async () => {
    try {
      const response = await callService.getQuickSuggestions();
      setQuickSuggestions(response.data);
    } catch (error) {
      console.error('Error loading quick suggestions:', error);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickFormData.caller.trim()) {
      alert('L\'appelant est obligatoire');
      return;
    }

    try {
      await callService.createCall({
        caller: quickFormData.caller.trim(),
        reason: quickFormData.reason.trim() || null,
        tags: quickFormData.tags,
        isGlpi: false,
        glpiNumber: null,
        isBlocking: quickFormData.isBlocking
      });

      // Réinitialiser le formulaire rapide
      setQuickFormData({
        caller: '',
        reason: '',
        tags: [],
        isBlocking: false
      });
      setShowQuickForm(false);

      // Recharger les appels et suggestions
      loadCalls();
      loadSuggestions();
      loadQuickSuggestions();
    } catch (error) {
      console.error('Error creating quick call:', error);
      alert('Erreur lors de la création de l\'appel');
    }
  };

  const addQuickTag = (tag) => {
    if (tag && !quickFormData.tags.includes(tag)) {
      setQuickFormData({ ...quickFormData, tags: [...quickFormData.tags, tag] });
    }
  };

  const removeQuickTag = (tagToRemove) => {
    setQuickFormData({
      ...quickFormData,
      tags: quickFormData.tags.filter(tag => tag !== tagToRemove)
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
    <div className="min-h-screen">
      {/* Quick Add Modal */}
      {showQuickForm && user?.role !== 'viewer' && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal animate-scale-in">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="icon-box icon-box-green">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-100">Ajout Rapide</h2>
              </div>
              <button
                onClick={() => setShowQuickForm(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="modal-body space-y-4">
              {/* Caller */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Appelant *
                </label>
                <select
                  value={quickFormData.caller}
                  onChange={(e) => setQuickFormData({ ...quickFormData, caller: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {quickSuggestions.callers.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count} utilisations)
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Raison
                </label>
                <select
                  value={quickFormData.reason}
                  onChange={(e) => setQuickFormData({ ...quickFormData, reason: e.target.value })}
                  className="select"
                >
                  <option value="">Sélectionner...</option>
                  {quickSuggestions.reasons.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count} utilisations)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <select
                  onChange={(e) => {
                    addQuickTag(e.target.value);
                    e.target.value = '';
                  }}
                  className="select"
                >
                  <option value="">Ajouter un tag...</option>
                  {quickSuggestions.tags.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count} utilisations)
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quickFormData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="badge badge-blue"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeQuickTag(tag)}
                        className="hover:text-blue-100 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Blocking */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="quickBlocking"
                  checked={quickFormData.isBlocking}
                  onChange={(e) => setQuickFormData({ ...quickFormData, isBlocking: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="quickBlocking" className="text-sm text-slate-300">
                  Appel bloquant
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowQuickForm(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="nav">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 text-slate-100 hover:text-blue-400 transition-colors group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold">CallFixV2</span>
                </div>
              </button>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">Application</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/statistics')}
                className="nav-button"
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistiques
              </button>
              <button
                onClick={() => navigate('/archives')}
                className="nav-button"
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archives
              </button>
              
              {canSelectTenant && tenants.length > 0 && (
                <select
                  value={selectedTenant || 'all'}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="select text-sm py-2"
                >
                  <option value="all">Tous les tenants</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.display_name}
                    </option>
                  ))}
                </select>
              )}
              
              {user?.role === 'global_admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="nav-button"
                >
                  <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </button>
              )}
              
              {user?.role === 'tenant_admin' && (
                <button
                  onClick={() => navigate('/admin-tenant')}
                  className="nav-button"
                >
                  <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Admin Tenant
                </button>
              )}
              
              <span className="text-slate-700">|</span>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {(user?.fullName || user?.username).charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-200">{user?.fullName || user?.username}</span>
              </div>
              
              <button
                onClick={() => authService.logout()}
                className="btn btn-secondary text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Form - Hidden for viewers */}
        {user?.role !== 'viewer' && (
        <div className="card mb-8 animate-fade-in">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-blue">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="card-title">Nouvel Appel</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                loadQuickSuggestions();
                setShowQuickForm(true);
              }}
              className="btn btn-success flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ajout Rapide
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Appelant */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Appelant *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Entrez le nom de l'appelant..."
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
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
                    {callerSuggestions
                      .filter(s => s.toLowerCase().includes(formData.caller.toLowerCase()))
                      .map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Raison
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Entrez la raison de l'appel..."
                    value={formData.reason}
                    onChange={(e) => {
                      setFormData({ ...formData, reason: e.target.value });
                      setShowReasonSuggestions(true);
                    }}
                    onFocus={() => setShowReasonSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReasonSuggestions(false), 200)}
                  />
                  {showReasonSuggestions && reasonSuggestions.length > 0 && formData.reason && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
                      {reasonSuggestions
                        .filter(s => s.toLowerCase().includes(formData.reason.toLowerCase()))
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge badge-blue"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-100"
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
                    placeholder="Ajoutez des tags..."
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
                  />
                  {showTagSuggestions && tagSuggestions.length > 0 && currentTag && (
                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-fade-in">
                      {tagSuggestions
                        .filter(s => s.toLowerCase().includes(currentTag.toLowerCase()))
                        .map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
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
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isGlpi}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    isGlpi: e.target.checked,
                    reason: e.target.checked ? '' : formData.reason,
                    tags: e.target.checked ? [] : formData.tags
                  })}
                  className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Ticket GLPI</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isBlocking}
                  onChange={(e) => setFormData({ ...formData, isBlocking: e.target.checked })}
                  className="w-5 h-5 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Bloquant</span>
              </label>
            </div>

            {formData.isGlpi && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-300 mb-2">
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

            <button type="submit" className="btn btn-primary w-full md:w-auto">
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Enregistrer l'appel
            </button>
          </form>
        </div>
        )}

        {/* Liste des appels */}
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-purple">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Appels d'aujourd'hui</h2>
                <p className="text-slate-400 text-sm">{calls.length} appel{calls.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/archives')}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archives
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
              <p className="text-slate-400 mt-4">Chargement...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-slate-700/30 rounded-2xl mb-4">
                <svg className="w-16 h-16 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-300 mb-2 text-lg font-medium">Aucun appel aujourd'hui</p>
              <p className="text-sm text-slate-500">
                Les appels des jours précédents sont dans les{' '}
                <button
                  onClick={() => navigate('/archives')}
                  className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
                >
                  Archives
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Appelant</label>
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
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-40 overflow-y-auto animate-fade-in">
                {callerSuggestions
                  .filter(s => s.toLowerCase().includes(editData.caller.toLowerCase()))
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm first:rounded-t-xl last:rounded-b-xl"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Raison</label>
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
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-40 overflow-y-auto animate-fade-in">
                  {reasonSuggestions
                    .filter(s => s.toLowerCase().includes(editData.reason.toLowerCase()))
                    .map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700/50 transition-colors text-sm first:rounded-t-xl last:rounded-b-xl"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags {editData.tags.length > 0 && `(${editData.tags.length})`}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editData.tags && editData.tags.length > 0 ? (
                  editData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="badge badge-blue"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Aucun tag</span>
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
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={editData.isGlpi}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  isGlpi: e.target.checked,
                  reason: e.target.checked ? '' : editData.reason,
                  tags: e.target.checked ? [] : editData.tags
                })}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Ticket GLPI</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={editData.isBlocking}
                onChange={(e) => setEditData({ ...editData, isBlocking: e.target.checked })}
                className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100 transition-colors">Bloquant</span>
            </label>
          </div>

          {editData.isGlpi && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
    <div className="bg-slate-700/20 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-slate-400">
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(call.created_at)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400 capitalize">
              {getDayName(call.created_at)}
            </span>
            {call.is_blocking && (
              <span className="badge badge-red">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Bloquant
              </span>
            )}
            {call.is_glpi && (
              <span className="badge badge-purple">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                GLPI {call.glpi_number && `- ${call.glpi_number}`}
              </span>
            )}
          </div>
          <p className="text-xl font-semibold text-slate-100 mb-2">
            {call.caller_name}
          </p>
          {call.reason_name && (
            <p className="text-slate-300 mb-3">{call.reason_name}</p>
          )}
          {call.tags && Array.isArray(call.tags) && call.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {call.tags
                .filter(t => t && (typeof t === 'string' ? t : t.name))
                .map((tag, idx) => (
                  <span
                    key={idx}
                    className="badge badge-blue"
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
            </div>
          )}
        </div>
        {authService.getCurrentUser()?.role !== 'viewer' && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
            title="Modifier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onArchive}
            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-all"
            title="Archiver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
            title="Supprimer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
