import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, callService } from '../services/api';

function ExportManager() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // États
  const [exportType, setExportType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [exportFormat, setExportFormat] = useState('json');
  
  // Filtres avancés
  const [filters, setFilters] = useState({
    includeArchived: false,
    onlyBlocking: false,
    onlyGLPI: false,
    searchTerm: '',
    groupBy: 'none' // none, caller, reason, hour, location
  });

  // Statistiques du jour
  const [dayStats, setDayStats] = useState({
    total: 0,
    blocking: 0,
    glpi: 0,
    archived: 0,
    byHour: {}
  });

  useEffect(() => {
    if (!user || (user.role !== 'tenant_admin' && user.role !== 'global_admin')) {
      navigate('/');
      return;
    }
  }, []);

  useEffect(() => {
    if (exportType === 'daily' && selectedDate) {
      loadDailyCalls();
    } else if (exportType === 'range' && startDate && endDate) {
      loadRangeCalls();
    }
  }, [selectedDate, startDate, endDate, exportType]);

  useEffect(() => {
    applyFilters();
  }, [calls, filters]);

  const loadDailyCalls = async () => {
    setLoading(true);
    try {
      const response = await callService.getCalls({
        startDate: selectedDate,
        endDate: selectedDate,
        all: true
      });
      setCalls(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error loading calls:', error);
      alert('Erreur lors du chargement des appels');
    } finally {
      setLoading(false);
    }
  };

  const loadRangeCalls = async () => {
    setLoading(true);
    try {
      const response = await callService.getCalls({
        startDate: startDate,
        endDate: endDate,
        all: true
      });
      setCalls(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error loading calls:', error);
      alert('Erreur lors du chargement des appels');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (callsData) => {
    const stats = {
      total: callsData.length,
      blocking: callsData.filter(c => c.is_blocking).length,
      glpi: callsData.filter(c => c.is_glpi).length,
      archived: callsData.filter(c => c.is_archived).length,
      byHour: {}
    };

    callsData.forEach(call => {
      const hour = new Date(call.created_at).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    setDayStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...calls];

    if (!filters.includeArchived) {
      filtered = filtered.filter(c => !c.is_archived);
    }

    if (filters.onlyBlocking) {
      filtered = filtered.filter(c => c.is_blocking);
    }

    if (filters.onlyGLPI) {
      filtered = filtered.filter(c => c.is_glpi);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.caller_name?.toLowerCase().includes(term) ||
        c.reason_name?.toLowerCase().includes(term) ||
        c.caller_phone?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term)
      );
    }

    setFilteredCalls(filtered);
  };

  const exportToJSON = () => {
    const dataToExport = prepareExportData();
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    downloadFile(blob, `export_calls_${getFilename()}.json`);
  };

  const exportToCSV = () => {
    const dataToExport = prepareExportData();
    
    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    // En-têtes CSV
    const headers = [
      'Date/Heure',
      'Appelant',
      'Téléphone',
      'Raison',
      'Lieu',
      'Bloquant',
      'GLPI',
      'N° GLPI',
      'Archivé',
      'Créé par',
      'Modifié le',
      'Modifié par'
    ];

    // Lignes CSV
    const rows = dataToExport.map(call => [
      new Date(call.created_at).toLocaleString('fr-FR'),
      call.caller_name || '',
      call.caller_phone || '',
      call.reason_name || '',
      call.location || '',
      call.is_blocking ? 'Oui' : 'Non',
      call.is_glpi ? 'Oui' : 'Non',
      call.glpi_number || '',
      call.is_archived ? 'Oui' : 'Non',
      call.created_by_username || '',
      call.last_modified_at ? new Date(call.last_modified_at).toLocaleString('fr-FR') : '',
      call.last_modified_by_username || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `export_calls_${getFilename()}.csv`);
  };

  const exportToExcel = () => {
    // Pour Excel, on utilise un format CSV compatible
    const dataToExport = prepareExportData();
    
    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'Date/Heure',
      'Appelant',
      'Téléphone',
      'Raison',
      'Lieu',
      'Bloquant',
      'GLPI',
      'N° GLPI',
      'Tags',
      'Archivé',
      'Créé par',
      'Modifié le',
      'Modifié par',
      'Commentaire'
    ];

    const rows = dataToExport.map(call => [
      new Date(call.created_at).toLocaleString('fr-FR'),
      call.caller_name || '',
      call.caller_phone || '',
      call.reason_name || '',
      call.location || '',
      call.is_blocking ? 'Oui' : 'Non',
      call.is_glpi ? 'Oui' : 'Non',
      call.glpi_number || '',
      call.tags ? call.tags.map(t => t.name).join(', ') : '',
      call.is_archived ? 'Oui' : 'Non',
      call.created_by_username || '',
      call.last_modified_at ? new Date(call.last_modified_at).toLocaleString('fr-FR') : '',
      call.last_modified_by_username || '',
      call.comments || ''
    ]);

    const csvContent = [
      headers.join('\t'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join('\t'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadFile(blob, `export_calls_${getFilename()}.xls`);
  };

  const exportGrouped = () => {
    const dataToExport = prepareExportData();
    let grouped = {};

    switch (filters.groupBy) {
      case 'caller':
        grouped = groupByCaller(dataToExport);
        break;
      case 'reason':
        grouped = groupByReason(dataToExport);
        break;
      case 'hour':
        grouped = groupByHour(dataToExport);
        break;
      case 'location':
        grouped = groupByLocation(dataToExport);
        break;
      default:
        grouped = { 'all': dataToExport };
    }

    const blob = new Blob([JSON.stringify(grouped, null, 2)], { type: 'application/json' });
    downloadFile(blob, `export_grouped_${filters.groupBy}_${getFilename()}.json`);
  };

  const groupByCaller = (data) => {
    return data.reduce((acc, call) => {
      const caller = call.caller_name || 'Inconnu';
      if (!acc[caller]) acc[caller] = [];
      acc[caller].push(call);
      return acc;
    }, {});
  };

  const groupByReason = (data) => {
    return data.reduce((acc, call) => {
      const reason = call.reason_name || 'Non spécifié';
      if (!acc[reason]) acc[reason] = [];
      acc[reason].push(call);
      return acc;
    }, {});
  };

  const groupByHour = (data) => {
    return data.reduce((acc, call) => {
      const hour = new Date(call.created_at).getHours();
      const key = `${hour}h - ${hour + 1}h`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(call);
      return acc;
    }, {});
  };

  const groupByLocation = (data) => {
    return data.reduce((acc, call) => {
      const location = call.location || 'Non spécifié';
      if (!acc[location]) acc[location] = [];
      acc[location].push(call);
      return acc;
    }, {});
  };

  const prepareExportData = () => {
    return filteredCalls;
  };

  const getFilename = () => {
    if (exportType === 'daily') {
      return selectedDate;
    } else {
      return `${startDate}_to_${endDate}`;
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getQuickDate = (type) => {
    const today = new Date();
    const date = new Date();
    
    switch(type) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
      case 'week-start':
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        date.setDate(diff);
        return date.toISOString().split('T')[0];
      case 'month-start':
        date.setDate(1);
        return date.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
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
            <span className="text-gray-600">📊 Gestionnaire d'Exports</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-tenant')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              👥 Admin Tenant
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
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
        {/* En-tête avec statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Appels</div>
            <div className="text-3xl font-bold text-blue-600">{dayStats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Bloquants</div>
            <div className="text-3xl font-bold text-red-600">{dayStats.blocking}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tickets GLPI</div>
            <div className="text-3xl font-bold text-purple-600">{dayStats.glpi}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Archivés</div>
            <div className="text-3xl font-bold text-gray-600">{dayStats.archived}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1">
            <div className="card space-y-6">
              <h2 className="text-xl font-bold text-gray-800">⚙️ Configuration Export</h2>
              
              {/* Type d'export */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'export
                </label>
                <select
                  className="input"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                >
                  <option value="daily">📅 Export journalier</option>
                  <option value="range">📆 Export par période</option>
                </select>
              </div>

              {/* Export journalier */}
              {exportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date sélectionnée
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  
                  {/* Boutons rapides */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedDate(getQuickDate('today'))}
                      className="btn btn-secondary text-xs"
                    >
                      Aujourd'hui
                    </button>
                    <button
                      onClick={() => setSelectedDate(getQuickDate('yesterday'))}
                      className="btn btn-secondary text-xs"
                    >
                      Hier
                    </button>
                  </div>
                </div>
              )}

              {/* Export par période */}
              {exportType === 'range' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      className="input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  
                  {/* Boutons rapides */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setStartDate(getQuickDate('week-start'));
                        setEndDate(getQuickDate('today'));
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      Cette semaine
                    </button>
                    <button
                      onClick={() => {
                        setStartDate(getQuickDate('month-start'));
                        setEndDate(getQuickDate('today'));
                      }}
                      className="btn btn-secondary text-xs"
                    >
                      Ce mois
                    </button>
                  </div>
                </div>
              )}

              {/* Filtres avancés */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">🔍 Filtres Avancés</h3>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.includeArchived}
                      onChange={(e) => setFilters({...filters, includeArchived: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Inclure archivés</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.onlyBlocking}
                      onChange={(e) => setFilters({...filters, onlyBlocking: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Seulement bloquants</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.onlyGLPI}
                      onChange={(e) => setFilters({...filters, onlyGLPI: e.target.checked})}
                      className="rounded"
                    />
                    <span className="text-sm">Seulement GLPI</span>
                  </label>
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="🔎 Rechercher..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                </div>
              </div>

              {/* Groupement */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">📊 Groupement</h3>
                <select
                  className="input text-sm"
                  value={filters.groupBy}
                  onChange={(e) => setFilters({...filters, groupBy: e.target.value})}
                >
                  <option value="none">Aucun groupement</option>
                  <option value="caller">Par appelant</option>
                  <option value="reason">Par raison</option>
                  <option value="hour">Par heure</option>
                  <option value="location">Par lieu</option>
                </select>
              </div>

              {/* Format d'export */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">💾 Format</h3>
                <select
                  className="input text-sm"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel (XLS)</option>
                  <option value="grouped">JSON Groupé</option>
                </select>
              </div>

              {/* Bouton d'export */}
              <button
                onClick={() => {
                  if (exportFormat === 'json') exportToJSON();
                  else if (exportFormat === 'csv') exportToCSV();
                  else if (exportFormat === 'excel') exportToExcel();
                  else if (exportFormat === 'grouped') exportGrouped();
                }}
                className="btn btn-primary w-full"
                disabled={filteredCalls.length === 0}
              >
                📥 Exporter ({filteredCalls.length} appels)
              </button>
            </div>
          </div>

          {/* Aperçu des données */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  👁️ Aperçu des Données
                </h2>
                <span className="text-sm text-gray-600">
                  {filteredCalls.length} / {calls.length} appels
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
              ) : filteredCalls.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Aucun appel pour cette sélection</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredCalls.slice(0, 50).map((call) => (
                    <div
                      key={call.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {call.caller_name || 'Appelant inconnu'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {call.reason_name || 'Pas de raison'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(call.created_at).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {call.is_blocking && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            🚨 Bloquant
                          </span>
                        )}
                        {call.is_glpi && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            🎫 GLPI {call.glpi_number}
                          </span>
                        )}
                        {call.is_archived && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            📦 Archivé
                          </span>
                        )}
                        {call.location && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            📍 {call.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredCalls.length > 50 && (
                    <div className="text-center py-3 text-sm text-gray-500">
                      ... et {filteredCalls.length - 50} autres appels
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Distribution par heure */}
            {Object.keys(dayStats.byHour).length > 0 && (
              <div className="card mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  ⏰ Distribution par Heure
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(dayStats.byHour)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([hour, count]) => (
                      <div
                        key={hour}
                        className="text-center p-2 bg-blue-50 rounded"
                      >
                        <div className="text-xs text-gray-600">{hour}h</div>
                        <div className="text-lg font-bold text-blue-600">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportManager;
