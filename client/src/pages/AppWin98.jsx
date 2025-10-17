import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService, adminService } from '../services/api';
import { Window, Button, Icon, Taskbar } from '../components/win98';

function AppWin98() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tenant selection for global_admin and viewer
  const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    canSelectTenant ? localStorage.getItem('selectedTenantId') || 'all' : null
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
  const [editingCallId, setEditingCallId] = useState(null);

  useEffect(() => {
    if (canSelectTenant) loadTenants();
    loadCalls();
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

  const loadQuickSuggestions = async () => {
    try {
      const [callers, reasons, tags] = await Promise.all([
        callService.getSuggestions('callers'),
        callService.getSuggestions('reasons'),
        callService.getSuggestions('tags')
      ]);
      setQuickSuggestions({
        callers: callers.data,
        reasons: reasons.data,
        tags: tags.data
      });
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await callService.createCall(formData);
      setFormData({
        caller: '',
        reason: '',
        tags: [],
        isGlpi: false,
        glpiNumber: '',
        isBlocking: false
      });
      loadCalls();
    } catch (error) {
      console.error('Error creating call:', error);
      alert('Erreur lors de la création de l\'appel');
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    try {
      await callService.createCall(quickFormData);
      setShowQuickForm(false);
      setQuickFormData({
        caller: '',
        reason: '',
        tags: [],
        isBlocking: false
      });
      loadCalls();
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

  const handleArchive = async (callId) => {
    if (window.confirm('Archiver cet appel ?')) {
      try {
        await callService.archiveCall(callId);
        loadCalls();
      } catch (error) {
        console.error('Error archiving call:', error);
        alert('Erreur lors de l\'archivage');
      }
    }
  };

  const handleDelete = async (callId) => {
    if (window.confirm('Supprimer définitivement cet appel ?')) {
      try {
        await callService.deleteCall(callId);
        loadCalls();
      } catch (error) {
        console.error('Error deleting call:', error);
        alert('Erreur lors de la suppression');
      }
    }
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

  const tasks = [{ id: 'app', title: 'CallFixV2 - Application', icon: 'phone' }];

  return (
    <div className="win98-body" style={{ padding: '0', margin: '0' }}>
      {/* Quick Add Modal */}
      {showQuickForm && user?.role !== 'viewer' && (
        <div className="win98-modal-overlay">
          <Window
            title="Ajout Rapide"
            width="450px"
            height="auto"
            onClose={() => setShowQuickForm(false)}
          >
            <form onSubmit={handleQuickSubmit} style={{ padding: '16px', backgroundColor: '#c0c0c0' }}>
              {/* Caller */}
              <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
                <legend className="win98-legend">Appelant *</legend>
                <select
                  value={quickFormData.caller}
                  onChange={(e) => setQuickFormData({ ...quickFormData, caller: e.target.value })}
                  className="win98-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Sélectionner...</option>
                  {quickSuggestions.callers.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
                <legend className="win98-legend">Raison</legend>
                <select
                  value={quickFormData.reason}
                  onChange={(e) => setQuickFormData({ ...quickFormData, reason: e.target.value })}
                  className="win98-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Sélectionner...</option>
                  {quickSuggestions.reasons.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
                <legend className="win98-legend">Tags</legend>
                <select
                  onChange={(e) => {
                    addQuickTag(e.target.value);
                    e.target.value = '';
                  }}
                  className="win98-select"
                  style={{ width: '100%', marginBottom: '8px' }}
                >
                  <option value="">Ajouter un tag...</option>
                  {quickSuggestions.tags.map((item, index) => (
                    <option key={index} value={item.name}>
                      {item.name} ({item.count})
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {quickFormData.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#000080',
                        color: 'white',
                        padding: '2px 6px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeQuickTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: 0,
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Blocking */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    className="win98-checkbox"
                    checked={quickFormData.isBlocking}
                    onChange={(e) => setQuickFormData({ ...quickFormData, isBlocking: e.target.checked })}
                  />
                  <span style={{ fontSize: '11px' }}>Appel bloquant</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Button type="submit" isDefault>OK</Button>
                <Button type="button" onClick={() => setShowQuickForm(false)}>Annuler</Button>
              </div>
            </form>
          </Window>
        </div>
      )}

      {/* Main Application Window */}
      <div style={{ padding: '8px', height: 'calc(100vh - 28px)', overflow: 'auto' }} className="win98-scrollbar">
        <Window 
          title="CallFixV2 - Application" 
          width="100%"
          height="auto"
        >
          {/* Menu Bar */}
          <div className="win98-menu-bar">
            <div className="win98-menu-item" onClick={() => navigate('/')}>Fichier</div>
            <div className="win98-menu-item" onClick={() => navigate('/statistics')}>Statistiques</div>
            <div className="win98-menu-item" onClick={() => navigate('/archives')}>Archives</div>
            {user?.role === 'global_admin' && (
              <div className="win98-menu-item" onClick={() => navigate('/admin')}>Admin</div>
            )}
            <div className="win98-menu-item" onClick={() => authService.logout()}>?</div>
          </div>

          {/* Content */}
          <div style={{ padding: '12px', backgroundColor: '#c0c0c0', minHeight: '500px' }}>
            {/* Toolbar */}
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {user?.role !== 'viewer' && (
                <>
                  <Button
                    onClick={() => {
                      loadQuickSuggestions();
                      setShowQuickForm(true);
                    }}
                  >
                    <Icon type="phone" size={16} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                    Nouvel Appel
                  </Button>
                  <div className="win98-divider-v" style={{ height: '20px' }} />
                </>
              )}
              
              <Button onClick={() => navigate('/statistics')}>
                <Icon type="chart" size={16} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                Statistiques
              </Button>
              
              <Button onClick={() => navigate('/archives')}>
                <Icon type="archive" size={16} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                Archives
              </Button>

              {canSelectTenant && tenants.length > 0 && (
                <>
                  <div className="win98-divider-v" style={{ height: '20px' }} />
                  <select
                    value={selectedTenant || 'all'}
                    onChange={(e) => handleTenantChange(e.target.value)}
                    className="win98-select"
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">Tous les tenants</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.display_name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div style={{ marginLeft: 'auto', fontSize: '11px' }}>
                Utilisateur: <strong>{user?.fullName || user?.username}</strong>
              </div>
            </div>

            {/* New Call Form - Hidden for viewers */}
            {user?.role !== 'viewer' && (
              <div className="win98-fieldset" style={{ marginBottom: '12px' }}>
                <legend className="win98-legend">Saisie Rapide</legend>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Appelant *</label>
                    <input
                      type="text"
                      className="win98-input"
                      style={{ width: '100%' }}
                      value={formData.caller}
                      onChange={(e) => setFormData({ ...formData, caller: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Raison</label>
                    <input
                      type="text"
                      className="win98-input"
                      style={{ width: '100%' }}
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                  <Button type="submit">Ajouter</Button>
                </form>
              </div>
            )}

            {/* Calls List */}
            <div className="win98-fieldset">
              <legend className="win98-legend">
                Liste des appels ({calls.length})
              </legend>
              
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Icon type="computer" size={48} />
                  <p style={{ marginTop: '12px', fontSize: '11px' }}>Chargement...</p>
                </div>
              ) : calls.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Icon type="document" size={48} />
                  <p style={{ marginTop: '12px', fontSize: '11px' }}>Aucun appel enregistré</p>
                </div>
              ) : (
                <div className="win98-list" style={{ height: '400px' }}>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#000080', color: 'white' }}>
                        <th style={{ padding: '4px', textAlign: 'left' }}>Date/Heure</th>
                        <th style={{ padding: '4px', textAlign: 'left' }}>Appelant</th>
                        <th style={{ padding: '4px', textAlign: 'left' }}>Raison</th>
                        <th style={{ padding: '4px', textAlign: 'left' }}>Tags</th>
                        <th style={{ padding: '4px', textAlign: 'center' }}>Status</th>
                        {user?.role !== 'viewer' && (
                          <th style={{ padding: '4px', textAlign: 'center' }}>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map((call) => (
                        <tr
                          key={call.id}
                          className="win98-list-item"
                          style={{ borderBottom: '1px solid #808080' }}
                        >
                          <td style={{ padding: '4px' }}>{formatDate(call.created_at)}</td>
                          <td style={{ padding: '4px', fontWeight: 'bold' }}>{call.caller_name}</td>
                          <td style={{ padding: '4px' }}>{call.reason_name || '-'}</td>
                          <td style={{ padding: '4px', fontSize: '10px' }}>
                            {call.tags && Array.isArray(call.tags) && call.tags.length > 0
                              ? call.tags
                                  .filter(t => t && (typeof t === 'string' ? t : t.name))
                                  .map(tag => typeof tag === 'string' ? tag : tag.name)
                                  .join(', ')
                              : '-'}
                          </td>
                          <td style={{ padding: '4px', textAlign: 'center' }}>
                            {call.is_blocking && <span style={{ color: '#ff0000', fontWeight: 'bold' }}>!</span>}
                            {call.is_glpi && <span style={{ color: '#0000ff' }}>GLPI</span>}
                          </td>
                          {user?.role !== 'viewer' && (
                            <td style={{ padding: '4px', textAlign: 'center' }}>
                              <Button
                                onClick={() => handleArchive(call.id)}
                                style={{ padding: '2px 6px', fontSize: '10px', marginRight: '4px' }}
                              >
                                Arch
                              </Button>
                              <Button
                                onClick={() => handleDelete(call.id)}
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                              >
                                Supp
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="win98-status-bar">
            <div className="win98-status-panel" style={{ flex: 1 }}>
              {calls.length} appel(s) affiché(s)
            </div>
            <div className="win98-status-panel" style={{ width: '150px' }}>
              Tenant: {selectedTenant === 'all' ? 'Tous' : tenants.find(t => t.id === parseInt(selectedTenant))?.display_name || 'N/A'}
            </div>
          </div>
        </Window>
      </div>

      {/* Taskbar */}
      <Taskbar tasks={tasks} activeTaskId="app" />
    </div>
  );
}

export default AppWin98;
