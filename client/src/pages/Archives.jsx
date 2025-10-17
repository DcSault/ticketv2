import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService, adminService } from '../services/api';

function Archives() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    caller: '',
    reason: '',
    tag: '',
    isBlocking: null,
    isGlpi: null
  });

  // Tenant selection for global_admin and multi-tenant viewer
  const isMultiTenant = user?.role === 'global_admin' || (user?.role === 'viewer' && !user?.tenantId);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    isMultiTenant
      ? localStorage.getItem('selectedTenantId') || 'all'
      : null
  );

  // Suggestions pour autocomplétion
  const [callerSuggestions, setCallerSuggestions] = useState([]);
  const [reasonSuggestions, setReasonSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);

  useEffect(() => {
    if (isMultiTenant) {
      loadTenants();
    }
  }, []);

  useEffect(() => {
    loadArchivedCalls();
    loadSuggestions();
  }, [filters, selectedTenant]);

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

  const loadArchivedCalls = async () => {
    setLoading(true);
    try {
      const params = { 
        archived: true,
        limit: 500
      };
      
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (isMultiTenant && selectedTenant && selectedTenant !== 'all') {
        params.tenantId = selectedTenant;
      }
      
      const response = await callService.getCalls(params);
      
      // Filtrer côté client pour les autres critères
      let filteredCalls = response.data;
      
      if (filters.caller) {
        filteredCalls = filteredCalls.filter(call => 
          call.caller_name.toLowerCase().includes(filters.caller.toLowerCase())
        );
      }
      
      if (filters.reason) {
        filteredCalls = filteredCalls.filter(call => 
          call.reason_name && call.reason_name.toLowerCase().includes(filters.reason.toLowerCase())
        );
      }
      
      if (filters.tag) {
        filteredCalls = filteredCalls.filter(call => 
          call.tags && call.tags.some(t => t.name && t.name.toLowerCase().includes(filters.tag.toLowerCase()))
        );
      }
      
      if (filters.isBlocking !== null) {
        filteredCalls = filteredCalls.filter(call => call.is_blocking === filters.isBlocking);
      }
      
      if (filters.isGlpi !== null) {
        filteredCalls = filteredCalls.filter(call => call.is_glpi === filters.isGlpi);
      }
      
      setCalls(filteredCalls);
    } catch (error) {
      console.error('Error loading archived calls:', error);
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

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      caller: '',
      reason: '',
      tag: '',
      isBlocking: null,
      isGlpi: null
    });
  };

  const handleUnarchive = async (id) => {
    if (!confirm('Désarchiver cet appel ? Il reviendra dans la liste principale.')) return;
    
    try {
      await callService.unarchiveCall(id);
      setCalls(calls.filter(call => call.id !== id));
      alert('✅ Appel désarchivé avec succès');
    } catch (error) {
      console.error('Error unarchiving call:', error);
      alert('Erreur lors du désarchivage');
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
            <span className="text-gray-600">Archives</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📞 Application
            </button>
            <button
              onClick={() => navigate('/statistics')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📊 Statistiques
            </button>
            {isMultiTenant && (
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
            )}
            {user?.role === 'global_admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium"
              >
                🛠️ Admin
              </button>
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
            <span className="text-sm text-gray-600">{user?.username}</span>
            <button
              onClick={() => {
                authService.logout();
                navigate('/login');
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📦 Appels archivés</h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            ℹ️ <strong>Archives automatiques :</strong> Cette page affiche tous les appels créés <strong>avant aujourd'hui</strong>. 
            Les appels d'aujourd'hui sont visibles dans l'application principale.
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtres</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            {/* Appelant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appelant
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.caller}
                onChange={(e) => setFilters({ ...filters, caller: e.target.value })}
                placeholder="Rechercher un appelant..."
                list="caller-suggestions"
              />
              <datalist id="caller-suggestions">
                {callerSuggestions.map((caller, idx) => (
                  <option key={idx} value={caller} />
                ))}
              </datalist>
            </div>

            {/* Raison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.reason}
                onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                placeholder="Rechercher une raison..."
                list="reason-suggestions"
              />
              <datalist id="reason-suggestions">
                {reasonSuggestions.map((reason, idx) => (
                  <option key={idx} value={reason} />
                ))}
              </datalist>
            </div>

            {/* Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                placeholder="Rechercher un tag..."
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {tagSuggestions.map((tag, idx) => (
                  <option key={idx} value={tag} />
                ))}
              </datalist>
            </div>

            {/* Filtres rapides */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtres rapides
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, isBlocking: filters.isBlocking === true ? null : true })}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.isBlocking === true
                      ? 'bg-red-100 text-red-800 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  🔴 Bloquants
                </button>
                <button
                  onClick={() => setFilters({ ...filters, isGlpi: filters.isGlpi === true ? null : true })}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.isGlpi === true
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-500'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  📋 GLPI
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              ❌ Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Liste des appels archivés */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Résultats ({calls.length} appels)
          </h2>

          {loading ? (
            <p className="text-gray-600">Chargement...</p>
          ) : calls.length === 0 ? (
            <p className="text-gray-600">Aucun appel archivé trouvé</p>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                >
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
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {typeof tag === 'string' ? tag : tag.name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {user?.role !== 'viewer' && (
                      <div className="ml-4">
                        <button
                          onClick={() => handleUnarchive(call.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ↩️ Désarchiver
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Archives;
