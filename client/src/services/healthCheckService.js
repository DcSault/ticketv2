/**
 * Health Check Service
 * Gère la communication avec le Health Check Worker
 */

class HealthCheckService {
  constructor() {
    this.worker = null;
    this.listeners = {
      onHealthStatusChanged: null,
      onHealthCheckResult: null,
      onHealthCheckError: null,
      onWorkerReady: null,
      onHealthCheckStarted: null,
      onHealthCheckStopped: null,
    };
    this.isRunning = false;
    this.lastStatus = true;
  }

  /**
   * Initialiser le service avec un worker
   */
  initialize() {
    return new Promise((resolve, reject) => {
      try {
        // Vérifier si les Web Workers sont supportés
        if (typeof Worker === 'undefined') {
          console.warn('Web Workers not supported, health checks disabled');
          reject(new Error('Web Workers not supported'));
          return;
        }

        // Créer le worker
        this.worker = new Worker('/health-check-worker.js');

        // Gérer les messages du worker
        this.worker.onmessage = (event) => {
          this.handleWorkerMessage(event.data);
        };

        // Gérer les erreurs du worker
        this.worker.onerror = (error) => {
          console.error('Health Check Worker Error:', error);
          this.handleWorkerError(error);
        };

        // Attendre que le worker soit prêt
        const readyTimeout = setTimeout(() => {
          reject(new Error('Worker initialization timeout'));
        }, 5000);

        const originalOnReady = this.listeners.onWorkerReady;
        this.listeners.onWorkerReady = () => {
          clearTimeout(readyTimeout);
          if (originalOnReady) originalOnReady();
          resolve();
        };
      } catch (error) {
        console.error('Failed to initialize Health Check Service:', error);
        reject(error);
      }
    });
  }

  /**
   * Démarrer les vérifications de santé
   */
  start(interval = 30000) {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.isRunning = true;
    this.worker.postMessage({
      type: 'START',
      payload: { interval },
    });
  }

  /**
   * Arrêter les vérifications
   */
  stop() {
    if (!this.worker) return;

    this.isRunning = false;
    this.worker.postMessage({ type: 'STOP' });
  }

  /**
   * Effectuer une vérification maintenant
   */
  checkNow() {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.worker.postMessage({ type: 'CHECK_NOW' });
  }

  /**
   * Mettre à jour la configuration
   */
  updateConfig(config) {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.worker.postMessage({
      type: 'UPDATE_CONFIG',
      payload: config,
    });
  }

  /**
   * Obtenir l'état actuel
   */
  getStatus() {
    if (!this.worker) {
      console.error('Worker not initialized');
      return null;
    }

    this.worker.postMessage({ type: 'GET_STATUS' });
  }

  /**
   * Enregistrer un écouteur
   */
  on(event, callback) {
    if (this.listeners.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      this.listeners[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
    } else {
      console.warn(`Unknown event: ${event}`);
    }
  }

  /**
   * Traiter les messages du worker
   */
  handleWorkerMessage(data) {
    const { type } = data;

    switch (type) {
      case 'WORKER_READY':
        console.log('Health Check Worker is ready');
        if (this.listeners.onWorkerReady) {
          this.listeners.onWorkerReady(data);
        }
        break;

      case 'HEALTH_STATUS_CHANGED':
        console.log('Health status changed:', data.status ? 'Online' : 'Offline');
        this.lastStatus = data.status;
        if (this.listeners.onHealthStatusChanged) {
          this.listeners.onHealthStatusChanged(data);
        }
        break;

      case 'HEALTH_CHECK_RESULT':
        console.log('Health check result:', data);
        this.lastStatus = data.status;
        if (this.listeners.onHealthCheckResult) {
          this.listeners.onHealthCheckResult(data);
        }
        break;

      case 'HEALTH_CHECK_ERROR':
        console.warn('Health check error:', data.error);
        this.lastStatus = false;
        if (this.listeners.onHealthCheckError) {
          this.listeners.onHealthCheckError(data);
        }
        break;

      case 'HEALTH_CHECK_STARTED':
        console.log('Health checks started with interval:', data.interval);
        this.isRunning = true;
        if (this.listeners.onHealthCheckStarted) {
          this.listeners.onHealthCheckStarted(data);
        }
        break;

      case 'HEALTH_CHECK_STOPPED':
        console.log('Health checks stopped');
        this.isRunning = false;
        if (this.listeners.onHealthCheckStopped) {
          this.listeners.onHealthCheckStopped(data);
        }
        break;

      case 'CONFIG_UPDATED':
        console.log('Health check config updated:', data.config);
        break;

      case 'STATUS_RESPONSE':
        console.log('Health check status:', data);
        break;

      default:
        console.warn('Unknown message type from worker:', type);
    }
  }

  /**
   * Gérer les erreurs du worker
   */
  handleWorkerError(error) {
    console.error('Worker error:', error.message, error.filename, error.lineno);
  }

  /**
   * Terminer le service
   */
  terminate() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isRunning = false;
  }
}

// Créer une instance singleton
const healthCheckService = new HealthCheckService();

export default healthCheckService;
