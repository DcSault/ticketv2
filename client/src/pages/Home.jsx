import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

function Home() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  return (
    <div className="min-h-screen">
      <nav className="nav">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">TicketV2</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {(user?.fullName || user?.username).charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <div className="text-slate-800 dark:text-slate-200 font-medium">{user?.fullName || user?.username}</div>
                {user?.tenantName && <div className="text-slate-600 dark:text-slate-400 text-xs">{user.tenantName}</div>}
              </div>
            </div>
            <ThemeToggle />
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
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Bienvenue {user?.fullName || user?.username}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Que souhaitez-vous faire aujourd'hui ?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/app')}
            className="card hover:scale-105 transition-all duration-300 text-left group animate-slide-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="icon-box icon-box-blue mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  Application
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Saisir des appels, consulter l'historique et gérer les tickets
                </p>
              </div>
              <svg className="w-6 h-6 text-slate-400 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="card hover:scale-105 transition-all duration-300 text-left group animate-slide-in"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="icon-box icon-box-purple mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                  Statistiques
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Consulter les statistiques et exporter les données
                </p>
              </div>
              <svg className="w-6 h-6 text-slate-400 dark:text-slate-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {user?.role === 'global_admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="card hover:scale-105 transition-all duration-300 text-left group md:col-span-2 animate-slide-in"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="icon-box icon-box-red mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                    Administration
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Gérer les tenants, utilisateurs et consulter les statistiques globales
                  </p>
                </div>
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-600 group-hover:text-red-500 dark:group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
