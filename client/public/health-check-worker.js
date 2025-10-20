/**
 * Health Check Worker
 * Vérifie la connexion avec le serveur à intervalles réguliers
 * Envoie des notifications au thread principal via postMessage
 */

let healthCheckInterval;
let lastHealthStatus = true;

// Configuration
const CONFIG = {
  CHECK_INTERVAL: 30000, // 30 secondes par défaut
  TIMEOUT: 5000, // 5 secondes timeout
  ENDPOINT: '/api/health',
};

/**
 * Effectue un health check du serveur
 */
async function performHealthCheck() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    const response = await fetch(CONFIG.ENDPOINT, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store', // Pas de cache pour les health checks
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok && response.status === 200;

    // Notifier le thread principal du changement d'état
    if (isHealthy !== lastHealthStatus) {
      lastHealthStatus = isHealthy;
      postMessage({
        type: 'HEALTH_STATUS_CHANGED',
        status: isHealthy,
        timestamp: new Date().toISOString(),
      });
    }

    // Envoyer un rapport détaillé
    postMessage({
      type: 'HEALTH_CHECK_RESULT',
      status: isHealthy,
      statusCode: response.status,
      responseTime: performance.now(),
      timestamp: new Date().toISOString(),
    });

    return isHealthy;
  } catch (error) {
    // Notifier d'une erreur
    if (lastHealthStatus !== false) {
      lastHealthStatus = false;
      postMessage({
        type: 'HEALTH_STATUS_CHANGED',
        status: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    postMessage({
      type: 'HEALTH_CHECK_ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    return false;
  }
}

/**
 * Démarrer les vérifications périodiques
 */
function startHealthChecks(interval = CONFIG.CHECK_INTERVAL) {
  // Effectuer une première vérification immédiate
  performHealthCheck();

  // Configurer les vérifications périodiques
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(() => {
    performHealthCheck();
  }, interval);

  postMessage({
    type: 'HEALTH_CHECK_STARTED',
    interval: interval,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Arrêter les vérifications
 */
function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  postMessage({
    type: 'HEALTH_CHECK_STOPPED',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Écouter les messages du thread principal
 */
self.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START':
      startHealthChecks(payload?.interval || CONFIG.CHECK_INTERVAL);
      break;

    case 'STOP':
      stopHealthChecks();
      break;

    case 'CHECK_NOW':
      performHealthCheck();
      break;

    case 'UPDATE_CONFIG':
      if (payload?.endpoint) CONFIG.ENDPOINT = payload.endpoint;
      if (payload?.checkInterval) CONFIG.CHECK_INTERVAL = payload.checkInterval;
      if (payload?.timeout) CONFIG.TIMEOUT = payload.timeout;
      
      // Si un intervalle est fourni et les checks sont actifs, redémarrer
      if (healthCheckInterval && payload?.checkInterval) {
        startHealthChecks(payload.checkInterval);
      }
      
      postMessage({
        type: 'CONFIG_UPDATED',
        config: CONFIG,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'GET_STATUS':
      postMessage({
        type: 'STATUS_RESPONSE',
        isRunning: !!healthCheckInterval,
        lastStatus: lastHealthStatus,
        config: CONFIG,
        timestamp: new Date().toISOString(),
      });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

// Notifier que le worker est prêt
postMessage({
  type: 'WORKER_READY',
  timestamp: new Date().toISOString(),
});
