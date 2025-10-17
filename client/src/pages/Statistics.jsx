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

  const handleExport = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await statisticsService.exportData(params);
      
      // Télécharger le JSON
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-calls-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Chargement des statistiques...</p>
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
              ← TicketV2
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">Statistiques</span>
          </div>
          <div className="flex items-center gap-4">
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
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période
              </label>
              <select
                className="input"
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

            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="btn btn-primary w-full"
              >
                📥 Exporter JSON
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <>
            {/* Résumé */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-blue-50">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total d'appels</h3>
                <p className="text-4xl font-bold text-blue-600">{stats.summary.total}</p>
              </div>

              <div className="card bg-red-50">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Appels bloquants</h3>
                <p className="text-4xl font-bold text-red-600">{stats.summary.blocking}</p>
              </div>

              <div className="card bg-purple-50">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Tickets GLPI</h3>
                <p className="text-4xl font-bold text-purple-600">{stats.summary.glpi}</p>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Appels par jour */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Appels par jour</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.callsByDay.reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3B82F6" name="Appels" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top appelants */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top appelants</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topCallers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="caller_name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" name="Appels" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tables */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top raisons */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top raisons</h3>
                {stats.topReasons.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topReasons.map((reason, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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

              {/* Top tags */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top tags</h3>
                {stats.topTags.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topTags.map((tag, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{tag.name}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {tag.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Aucun tag utilisé</p>
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
