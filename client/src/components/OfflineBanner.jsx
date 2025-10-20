import React, { useEffect, useState } from 'react';

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(false);
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
                    Les pages en cache sont disponibles, mais certaines fonctionnalités ne sont pas accessibles.
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
