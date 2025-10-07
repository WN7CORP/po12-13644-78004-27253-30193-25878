// Advanced Service Worker - Maximum Performance Optimization
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `juridico-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `juridico-dynamic-${CACHE_VERSION}`;
const API_CACHE = `juridico-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `juridico-images-${CACHE_VERSION}`;

// Critical resources - immediate cache
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
];

// Install - Cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CRITICAL_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheName.includes(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Images - Cache first with WebP
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => 
        cache.match(request).then(response => {
          if (response) return response;
          
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => response);
        })
      )
    );
    return;
  }

  // Scripts and Styles - Cache first with background update
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then(response => {
        const fetchPromise = fetch(request).then(fetchResponse => {
          if (fetchResponse.ok) {
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, fetchResponse.clone());
            });
          }
          return fetchResponse;
        }).catch(() => response);
        
        return response || fetchPromise;
      })
    );
    return;
  }

  // API - Stale-while-revalidate
  if (url.hostname.includes('supabase') || url.pathname.includes('/functions/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache =>
        cache.match(request).then(response => {
          const fetchPromise = fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
          return response || fetchPromise;
        }).catch(() => cache.match(request))
      )
    );
    return;
  }

  // Documents - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => caches.match(request) || caches.match('/'))
    );
  }
});

// Background sync for preloading
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_COMPONENTS') {
    const components = event.data.components || [];
    
    caches.open(DYNAMIC_CACHE).then(cache => {
      components.forEach(component => {
        fetch(component).then(response => {
          if (response.ok) {
            cache.put(component, response);
          }
        }).catch(() => {});
      });
    });
  }
});
