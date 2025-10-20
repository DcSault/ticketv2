import React from 'react';
import { useNavigate } from 'react-router-dom';

function Error404() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            404
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page non trouvée
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-lg">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Retour à l'accueil
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            Retour précédent
          </button>
        </div>

        {/* Code d'erreur */}
        <div className="mt-12 text-sm text-gray-500">
          Code erreur: <span className="font-mono font-bold">404 Not Found</span>
        </div>
      </div>
    </div>
  );
}

export default Error404;
