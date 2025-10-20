import { useState, useEffect } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const handleError = (code, message) => {
    setErrorCode(code);
    setError(message);
    
    // Afficher dans la console pour le débogage
    console.error(`Error ${code}: ${message}`);
  };

  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  useEffect(() => {
    // Écouter les erreurs globales non traitées
    const handleUnhandledError = (event) => {
      handleError(500, event.message || 'Une erreur inconnue s\'est produite');
    };

    window.addEventListener('error', handleUnhandledError);
    return () => window.removeEventListener('error', handleUnhandledError);
  }, []);

  return { error, errorCode, handleError, clearError };
};

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
