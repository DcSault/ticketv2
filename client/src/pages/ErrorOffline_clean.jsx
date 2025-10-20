import React from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorOffline() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        {/* En-tête avec animation */}
        <div className="mb-8 animate-fade-in">
          <div className="text-6xl mb-4 animate-bounce">
            🦖
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Vous êtes <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">hors ligne</span>
          </h1>
          <p className="text-gray-300 text-lg mb-4">
            La page n'est pas disponible
          </p>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 animate-scale-in">
          <div className="mb-6">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Mode Hors Ligne
          </h2>

          <p className="text-gray-600 mb-6 text-base leading-relaxed">
            Vous êtes actuellement hors ligne. Les pages en cache sont disponibles, 
            mais les fonctionnalités en temps réel ne sont pas accessibles.
          </p>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6 text-left">
            <p className="text-amber-900 font-semibold flex items-center gap-2">
              <span>ℹ️</span>
              Vérifiez votre connexion Internet et essayez à nouveau.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Vérifier la connexion
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Accueil (cache)
            </button>
          </div>
        </div>

        {/* Informations techniques */}
        <div className="text-gray-400 text-sm space-y-1">
          <p>Code erreur: <span className="font-mono font-bold text-yellow-400">OFFLINE</span></p>
          <p className="text-xs text-gray-500">
            Les pages en cache restent accessibles • Synchronisation automatique à la reconnexion
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorOffline;
