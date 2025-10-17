import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, statisticsService } from '../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function Statistics() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadStatistics();
  }, [period, startDate, endDate]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await statisticsService.getStatistics(params);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  // Déterminer le thème selon la période
  const isDailyView = period === 'day';
  const bgColor = isDailyView ? 'bg-gray-50' : 'bg-[#0A1929]';
  const cardBg = isDailyView ? 'bg-white' : 'bg-[#132F4C]';
  const textPrimary = isDailyView ? 'text-gray-800' : 'text-white';
  const textSecondary = isDailyView ? 'text-gray-600' : 'text-gray-300';
  const borderColor = isDailyView ? 'border-gray-200' : 'border-gray-700';

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={isDailyView ? 'bg-white shadow-sm' : 'bg-[#0A1929] border-b border-gray-700'}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`text-2xl font-bold ${isDailyView ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-400'}`}
            >
              ← TicketV2
            </button>
            <span className="text-gray-500">|</span>
            <span className={isDailyView ? 'text-gray-600' : 'text-gray-300'}>Statistiques</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${textSecondary}`}>
              {user?.fullName || user?.username}
            </span>
            <button
              onClick={() => authService.logout()}
              className={isDailyView ? 'btn btn-secondary text-sm' : 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors'}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtres */}
        <div className={`${cardBg} rounded-xl p-6 shadow-lg mb-8 border ${borderColor}`}>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-6`}>Filtres</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Période
              </label>
              <select
                className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${cardBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
              >
                <option value="day">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Date de début
              </label>
              <input
                type="date"
                className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${cardBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Date de fin
              </label>
              <input
                type="date"
                className={`w-full px-4 py-2 rounded-lg border ${borderColor} ${cardBg} ${textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {stats && (
          <>
            {/* Résumé */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor} ${isDailyView ? 'bg-blue-50' : ''}`}>
                <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Total d'appels</h3>
                <p className={`text-4xl font-bold ${isDailyView ? 'text-blue-600' : 'text-blue-400'}`}>{stats.summary.total}</p>
              </div>

              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor} ${isDailyView ? 'bg-red-50' : ''}`}>
                <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Appels bloquants</h3>
                <p className={`text-4xl font-bold ${isDailyView ? 'text-red-600' : 'text-red-400'}`}>{stats.summary.blocking}</p>
              </div>

              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor} ${isDailyView ? 'bg-purple-50' : ''}`}>
                <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Tickets GLPI</h3>
                <p className={`text-4xl font-bold ${isDailyView ? 'text-purple-600' : 'text-purple-400'}`}>{stats.summary.glpi}</p>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Évolution des appels */}
              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor}`}>
                <h3 className={`text-lg font-bold ${textPrimary} mb-4`}>
                  {isDailyView ? 'Évolution des appels' : 'Évolution des Appels'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.callsByDay.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDailyView ? '#E5E7EB' : '#374151'} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      stroke={isDailyView ? '#6B7280' : '#9CA3AF'}
                      style={{ fill: isDailyView ? '#6B7280' : '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke={isDailyView ? '#6B7280' : '#9CA3AF'}
                      style={{ fill: isDailyView ? '#6B7280' : '#9CA3AF' }}
                    />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                      contentStyle={{
                        backgroundColor: isDailyView ? '#FFFFFF' : '#132F4C',
                        border: `1px solid ${isDailyView ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        color: isDailyView ? '#1F2937' : '#FFFFFF'
                      }}
                    />
                    <Legend wrapperStyle={{ color: isDailyView ? '#1F2937' : '#FFFFFF' }} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={isDailyView ? '#3B82F6' : '#60A5FA'} 
                      name="Appels" 
                      strokeWidth={2}
                      dot={{ fill: isDailyView ? '#3B82F6' : '#60A5FA' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top appelants */}
              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor}`}>
                <h3 className={`text-lg font-bold ${textPrimary} mb-4`}>Top appelants</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topCallers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDailyView ? '#E5E7EB' : '#374151'} />
                    <XAxis 
                      dataKey="caller_name"
                      stroke={isDailyView ? '#6B7280' : '#9CA3AF'}
                      style={{ fill: isDailyView ? '#6B7280' : '#9CA3AF' }}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke={isDailyView ? '#6B7280' : '#9CA3AF'}
                      style={{ fill: isDailyView ? '#6B7280' : '#9CA3AF' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDailyView ? '#FFFFFF' : '#132F4C',
                        border: `1px solid ${isDailyView ? '#E5E7EB' : '#374151'}`,
                        borderRadius: '8px',
                        color: isDailyView ? '#1F2937' : '#FFFFFF'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={isDailyView ? '#3B82F6' : '#60A5FA'} 
                      name="Appels"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tables */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top raisons */}
              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor}`}>
                <h3 className={`text-lg font-bold ${textPrimary} mb-4`}>
                  {isDailyView ? 'Top raisons' : 'Répartition GLPI'}
                </h3>
                {stats.topReasons.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topReasons.map((reason, idx) => (
                      <div 
                        key={idx} 
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          isDailyView ? 'bg-gray-50' : 'bg-[#0A1929] border border-gray-700'
                        }`}
                      >
                        <span className={`font-medium ${textPrimary}`}>{reason.reason_name}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isDailyView 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {reason.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={textSecondary}>Aucune raison enregistrée</p>
                )}
              </div>

              {/* Top tags */}
              <div className={`${cardBg} rounded-xl p-6 shadow-lg border ${borderColor}`}>
                <h3 className={`text-lg font-bold ${textPrimary} mb-4`}>
                  {isDailyView ? 'Top tags' : 'Tags les plus utilisés'}
                </h3>
                {stats.topTags.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topTags.map((tag, idx) => {
                      const tagColors = isDailyView 
                        ? ['bg-blue-100 text-blue-800', 'bg-orange-100 text-orange-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800']
                        : ['bg-blue-500/20 text-blue-400', 'bg-orange-500/20 text-orange-400', 'bg-green-500/20 text-green-400', 'bg-purple-500/20 text-purple-400', 'bg-pink-500/20 text-pink-400'];
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            isDailyView ? 'bg-gray-50' : 'bg-[#0A1929] border border-gray-700'
                          }`}
                        >
                          <span className={`font-medium ${textPrimary}`}>{tag.name}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tagColors[idx % tagColors.length]}`}>
                            {tag.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={textSecondary}>Aucun tag utilisé</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Statistics;
