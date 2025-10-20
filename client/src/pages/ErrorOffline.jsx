import React from 'react';
import { useNavigate } from 'react-router-dom';

function ErrorOffline() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-600">
            ⚠️
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Hors ligne
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-4 text-lg">
          Vous êtes actuellement hors ligne. Les pages en cache sont disponibles, mais les fonctionnalités en temps réel ne sont pas accessibles.
        </p>

        <p className="text-gray-500 mb-8 text-sm">
          Vérifiez votre connexion Internet et essayez à nouveau.
        </p>

        {/* Icône de connexion */}
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 animate-pulse"
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

        {/* Boutons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Vérifier la connexion
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Accueil (en cache)
          </button>
        </div>

        {/* Code d'erreur */}
        <div className="mt-12 text-sm text-gray-500">
          Code erreur: <span className="font-mono font-bold">OFFLINE</span>
        </div>
      </div>
    </div>
  );
}

export default ErrorOffline;
