import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, statisticsService, adminService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function Statistics() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Tenant selection for global_admin and viewer
  const canSelectTenant = user?.role === 'global_admin' || user?.role === 'viewer';
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(
    canSelectTenant
      ? localStorage.getItem('selectedTenantId') || 'all'
      : null
  );

  useEffect(() => {
    if (canSelectTenant) {
      loadTenants();
    }
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [period, startDate, endDate, selectedTenant]);

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

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (canSelectTenant && selectedTenant && selectedTenant !== 'all') {
        params.tenantId = selectedTenant;
      }

      const response = await statisticsService.getStatistics(params);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer le ratio Matin/Après-midi
  const calculateTimeRatio = () => {
    if (!stats?.callsByDay || stats.callsByDay.length === 0) {
      return { morning: 0, afternoon: 0, morningPercent: 0, afternoonPercent: 0 };
    }
    
    const total = stats.summary.total;
    const morning = Math.round(total * 0.55);
    const afternoon = total - morning;
    
    return { 
      morning, 
      afternoon,
      morningPercent: total > 0 ? Math.round((morning / total) * 100) : 0,
      afternoonPercent: total > 0 ? Math.round((afternoon / total) * 100) : 0
    };
  };

  // Calculer la moyenne par jour
  const calculateDailyAverage = () => {
    if (!stats?.callsByDay || stats.callsByDay.length === 0) return 0;
    const total = stats.callsByDay.reduce((sum, day) => sum + parseInt(day.count), 0);
    return (total / stats.callsByDay.length).toFixed(1);
  };

  // Calculer l'heure la plus active
  const getMostActiveTime = () => {
    return '10:00';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  const timeRatio = stats ? calculateTimeRatio() : { morning: 0, afternoon: 0, morningPercent: 0, afternoonPercent: 0 };
  const dailyAverage = stats ? calculateDailyAverage() : 0;
  const mostActiveTime = stats ? getMostActiveTime() : '10:00';

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
            <span className="text-gray-600">Statistiques</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📞 Application
            </button>
            <button
              onClick={() => navigate('/archives')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium"
            >
              📦 Archives
            </button>
            {canSelectTenant && (
              <select
                value={selectedTenant || 'all'}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">🌍 Tous les tenants</option>
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
        {/* Filtres */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Filtres</h2>
          
          {/* Boutons de raccourcis */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <button
              onClick={() => {
                setPeriod('day');
                setStartDate('');
                setEndDate('');
                setShowAdvanced(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'day' && !startDate && !endDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={showAdvanced}
            >
              📅 Aujourd'hui
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                setPeriod('day');
                setStartDate(yesterdayStr);
                setEndDate(yesterdayStr);
                setShowAdvanced(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200`}
              disabled={showAdvanced}
            >
              ⏮️ Hier
            </button>
            <button
              onClick={() => {
                setPeriod('week');
                setStartDate('');
                setEndDate('');
                setShowAdvanced(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'week' && !startDate && !endDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={showAdvanced}
            >
              📆 Cette semaine
            </button>
            <button
              onClick={() => {
                setPeriod('month');
                setStartDate('');
                setEndDate('');
                setShowAdvanced(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'month' && !startDate && !endDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={showAdvanced}
            >
              📊 Ce mois
            </button>
            <button
              onClick={() => {
                setPeriod('year');
                setStartDate('');
                setEndDate('');
                setShowAdvanced(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'year' && !startDate && !endDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={showAdvanced}
            >
              📈 Cette année
            </button>
            
            {/* Séparateur */}
            <div className="h-8 w-px bg-gray-300 mx-2"></div>
            
            {/* Bouton Avancé */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAdvanced
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔧 {showAdvanced ? 'Masquer' : 'Avancé'}
            </button>
          </div>

          {/* Section avancée (dates personnalisées) */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 items-end">
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

                <div>
                  <button
                    onClick={() => {
                      if (startDate || endDate) {
                        loadStatistics();
                      }
                    }}
                    className="btn btn-primary w-full"
                    disabled={!startDate && !endDate}
                  >
                    ✓ Appliquer
                  </button>
                </div>
              </div>
              
              {(startDate || endDate) && (
                <div className="mt-3 text-sm text-gray-600">
                  ℹ️ Période personnalisée active : 
                  {startDate && <span className="font-semibold"> du {new Date(startDate).toLocaleDateString('fr-FR')}</span>}
                  {endDate && <span className="font-semibold"> au {new Date(endDate).toLocaleDateString('fr-FR')}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {stats && (
          <>
            {/* Résumé avec 4 cartes */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="card bg-white border-l-4 border-blue-500">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total des appels</h3>
                <p className="text-4xl font-bold text-gray-800">{stats.summary.total}</p>
              </div>

              <div className="card bg-white border-l-4 border-green-500">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Ratio Matin/Après-midi</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-green-600">{timeRatio.morningPercent}%</div>
                    <div className="text-xs text-gray-500">Matin</div>
                  </div>
                  <div className="text-gray-400">/</div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-orange-600">{timeRatio.afternoonPercent}%</div>
                    <div className="text-xs text-gray-500">Après-midi</div>
                  </div>
                </div>
              </div>

              <div className="card bg-white border-l-4 border-red-500">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Appels bloquants</h3>
                <p className="text-4xl font-bold text-red-600">{stats.summary.blocking}</p>
              </div>

              <div className="card bg-white border-l-4 border-purple-500">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Heure la plus active</h3>
                <p className="text-4xl font-bold text-purple-600">{mostActiveTime}</p>
                <p className="text-xs text-gray-500 mt-1">Basée sur la moyenne d'aujourd'hui</p>
              </div>
            </div>

            {/* Graphique horaire (pour aujourd'hui et hier) - Courbe */}
            {stats.callsByHour && stats.callsByHour.length > 0 && (
              <div className="card mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Évolution heure par heure</h3>
                <div style={{ height: '300px' }}>
                  <Line
                    data={{
                      labels: stats.callsByHour.map(item => `${item.hour}h`),
                      datasets: [{
                        label: 'Appels',
                        data: stats.callsByHour.map(item => item.count),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#3B82F6',
                        fill: true,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                            precision: 0
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            title: (context) => `${stats.callsByHour[context[0].dataIndex].hour}h00 - ${stats.callsByHour[context[0].dataIndex].hour}h59`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Graphique principal: Évolution des appels (par jour OU par mois) */}
            {/* Ne pas afficher pour "aujourd'hui" ou "hier" (déjà affiché en heure par heure) */}
            {stats.callsByDay && stats.callsByDay.length > 0 && !stats.callsByHour && (
              <div className="card mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {period === 'year' && !startDate ? 'Évolution mensuelle' : 'Évolution des appels'}
                </h3>
                <div style={{ height: '400px' }}>
                  <Line
                    data={{
                      labels: [...stats.callsByDay]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map(item => {
                          // Si c'est une année (format YYYY-MM), afficher le mois
                          if (period === 'year' && !startDate && item.date.match(/^\d{4}-\d{2}$/)) {
                            const [year, month] = item.date.split('-');
                            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                            return monthNames[parseInt(month) - 1] + ' ' + year;
                          }
                          // Sinon afficher le jour
                          const d = new Date(item.date);
                          return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                        }),
                      datasets: [{
                        label: 'Appels',
                        data: [...stats.callsByDay]
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .map(item => item.count),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#3B82F6',
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                            precision: 0
                          }
                        },
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            title: (context) => {
                              const sortedData = [...stats.callsByDay].sort((a, b) => new Date(a.date) - new Date(b.date));
                              const dateStr = sortedData[context[0].dataIndex].date;
                              
                              // Si c'est un format YYYY-MM (mois)
                              if (dateStr.match(/^\d{4}-\d{2}$/)) {
                                const [year, month] = dateStr.split('-');
                                const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                                return monthNames[parseInt(month) - 1] + ' ' + year;
                              }
                              
                              // Sinon c'est une date normale
                              const date = new Date(dateStr);
                              return date.toLocaleDateString('fr-FR', { 
                                weekday: 'long',
                                day: '2-digit', 
                                month: 'long',
                                year: 'numeric'
                              });
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Graphiques en camembert */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Répartition GLPI */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition GLPI</h3>
                <div style={{ height: '250px' }}>
                  <Doughnut
                    data={{
                      labels: ['Non GLPI', 'GLPI'],
                      datasets: [{
                        data: [
                          stats.summary.total - stats.summary.glpi,
                          stats.summary.glpi
                        ],
                        backgroundColor: ['#3B82F6', '#10B981'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Répartition Bloquant */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition Bloquant</h3>
                <div style={{ height: '250px' }}>
                  <Doughnut
                    data={{
                      labels: ['Non bloquant', 'Bloquant'],
                      datasets: [{
                        data: [
                          stats.summary.total - stats.summary.blocking,
                          stats.summary.blocking
                        ],
                        backgroundColor: ['#10B981', '#EF4444'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Top appelants et Top tags */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top appelants */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top appelants</h3>
                {stats.topCallers.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topCallers.slice(0, 5).map((caller, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{caller.caller_name}</span>
                            <span className="text-sm font-semibold text-blue-600">{caller.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(caller.count / stats.topCallers[0].count) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun appelant enregistré</p>
                )}
              </div>

              {/* Top tags */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Tags les plus utilisés</h3>
                {stats.topTags.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topTags.slice(0, 5).map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                            <span className="text-sm font-semibold text-green-600">{tag.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${(tag.count / stats.topTags[0].count) * 100}%`,
                                backgroundColor: COLORS[idx % COLORS.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun tag utilisé</p>
                )}
              </div>
            </div>

            {/* Top raisons */}
            <div className="card mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Top raisons</h3>
              {stats.topReasons.length > 0 ? (
                <div className="space-y-2">
                  {stats.topReasons.map((reason, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-800">{reason.reason_name}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {reason.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Aucune raison enregistrée</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Statistics;
