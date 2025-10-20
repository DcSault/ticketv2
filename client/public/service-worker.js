const CACHE_NAME = 'callfix-v2-cache-v1';
const RUNTIME_CACHE = 'callfix-v2-runtime-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/vite.svg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be cached:', err);
        // Ne pas échouer si certains assets ne peuvent pas être mis en cache
      });
    })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Stratégie : Network First, Fall Back to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas mettre en cache les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ne pas mettre en cache les requêtes API (elles seront en Runtime Cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si c'est une réponse valide, la mettre en cache
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Si la requête échoue, chercher dans le cache runtime
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Retourner une page d'erreur hors ligne si c'est une requête API
            if (url.pathname.startsWith('/api/')) {
              return new Response(
                JSON.stringify({ offline: true, message: 'Vous êtes hors ligne' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            }
            throw new Error('Network request failed and no cache available');
          });
        })
    );
    return;
  }

  // Stratégie : Cache First pour les assets statiques
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Mettre en cache la réponse
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Stratégie : Network First pour les autres ressources
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Page de fallback si rien n'est disponible
          return new Response('Hors ligne - Page non disponible', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});
