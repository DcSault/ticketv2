import React from 'react';
import { useNavigate } from 'react-router-dom';

function Error500() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
            500
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Erreur serveur
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-lg">
          Une erreur interne s'est produite. Nos équipes ont été notifiées et travaillent à la résolution du problème.
        </p>

        {/* Icône */}
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Rafraîchir
          </button>
        </div>

        {/* Code d'erreur */}
        <div className="mt-12 text-sm text-gray-500">
          Code erreur: <span className="font-mono font-bold">500 Internal Server Error</span>
        </div>
      </div>
    </div>
  );
}

export default Error500;
