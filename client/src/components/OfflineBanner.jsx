import React, { useEffect, useState } from 'react';
import healthCheckService from '../services/healthCheckService';

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [serverStatus, setServerStatus] = useState(true); // État du serveur selon le worker
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
      setConnectionAttempts(0);
      // Afficher une notification de reconnexion
      setTimeout(() => {
        const banner = document.getElementById('reconnect-banner');
        if (banner) {
          banner.style.display = 'block';
          setTimeout(() => {
            banner.style.display = 'none';
          }, 3000);
        }
      }, 100);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écouter les changements de statut du serveur via le health check worker
    const handleServerStatusChange = (data) => {
      setServerStatus(data.status);
      
      if (!data.status) {
        setConnectionAttempts(prev => prev + 1);
      }
    };

    const handleHealthCheckError = (data) => {
      setServerStatus(false);
      setConnectionAttempts(prev => prev + 1);
    };

    healthCheckService.on('healthStatusChanged', handleServerStatusChange);
    healthCheckService.on('healthCheckError', handleHealthCheckError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Banneau hors ligne */}
      {showBanner && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Vous êtes hors ligne</p>
                  <p className="text-sm opacity-90">
                    {connectionAttempts > 0 && `Tentatives de reconnexion : ${connectionAttempts} • `}
                    Les pages en cache sont disponibles.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banneau serveur indisponible (mais connexion internet OK) */}
      {showBanner && isOnline && !serverStatus && (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2M6 9h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V11a2 2 0 012-2z"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Le serveur est indisponible</p>
                  <p className="text-sm opacity-90">
                    {connectionAttempts > 0 && `Tentatives : ${connectionAttempts} • `}
                    Pages en cache accessibles.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-white hover:text-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banneau de reconnexion */}
      <div
        id="reconnect-banner"
        style={{ display: 'none' }}
        className="fixed top-0 left-0 right-0 z-50 animate-slide-down"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="font-semibold">Reconnecté - Vos données se synchronisent</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default OfflineBanner;
