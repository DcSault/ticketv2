import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Home() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TicketV2</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.fullName || user?.username}
              {user?.tenantName && ` - ${user.tenantName}`}
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

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Bienvenue {user?.fullName || user?.username}
          </h2>
          <p className="text-lg text-gray-600">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/app')}
            className="card hover:shadow-lg transition-shadow duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  📞 Application
                </h3>
                <p className="text-gray-600">
                  Saisir des appels, consulter l'historique et gérer les tickets
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="card hover:shadow-lg transition-shadow duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  📊 Statistiques
                </h3>
                <p className="text-gray-600">
                  Consulter les statistiques et exporter les données
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {user?.role === 'global_admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="card hover:shadow-lg transition-shadow duration-200 text-left group md:col-span-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    🛠️ Administration
                  </h3>
                  <p className="text-gray-600">
                    Gérer les tenants, utilisateurs et consulter les statistiques globales
                  </p>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
