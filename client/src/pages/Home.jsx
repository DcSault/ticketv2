import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Home() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      {/* Navigation avec effet glassmorphism */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
            TicketV2
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
              <span className="font-medium">{user?.fullName || user?.username}</span>
              {user?.tenantName && <span className="text-gray-400"> • {user.tenantName}</span>}
            </div>
            <button
              onClick={() => authService.logout()}
              className="btn btn-secondary text-sm hover:scale-105 transition-transform duration-200"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* En-tête avec animation de fade-in */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Bienvenue <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">{user?.fullName || user?.username}</span>
          </h2>
          <p className="text-xl text-gray-600">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        {/* Grille de cartes avec animations décalées */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Carte Application */}
          <button
            onClick={() => navigate('/app')}
            className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 text-left overflow-hidden transform hover:-translate-y-2 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: '100ms' }}
          >
            {/* Effet de gradient au survol */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-700 transition-colors duration-300">
                  Application
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Saisir des appels, consulter l'historique et gérer les tickets
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-300 group-hover:text-green-700 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Carte Statistiques */}
          <button
            onClick={() => navigate('/statistics')}
            className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 text-left overflow-hidden transform hover:-translate-y-2 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: '200ms' }}
          >
            {/* Effet de gradient au survol */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-700 to-green-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-800 transition-colors duration-300">
                  Statistiques
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Consulter les statistiques et exporter les données
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-300 group-hover:text-green-800 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Carte Administration (si admin) */}
          {user?.role === 'global_admin' && (
            <button
              onClick={() => navigate('/admin')}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 text-left overflow-hidden md:col-span-2 transform hover:-translate-y-2 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: '300ms' }}
            >
              {/* Effet de gradient au survol */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-800 to-green-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-900 transition-colors duration-300">
                    Administration
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Gérer les tenants, utilisateurs et consulter les statistiques globales
                  </p>
                </div>
                <svg className="w-6 h-6 text-gray-300 group-hover:text-green-900 group-hover:translate-x-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
