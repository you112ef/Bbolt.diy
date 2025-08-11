const CACHE_NAME = 'yousef-ai-cache-v2';
const ASSET_CACHE = 'yousef-ai-assets-v2';
const API_CACHE = 'yousef-ai-api-v2';

// Essential files to cache on install
const ESSENTIAL_FILES = [
  // Do not cache HTML shell to avoid stale app versions
  '/yousef-logo-enhanced.png',
  '/favicon-enhanced.png',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ESSENTIAL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const copy = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'manifest') {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        
        if (cached) {
          // Return cached version immediately and update in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
              }
            })
            .catch(() => {}); // Ignore network errors in background
          
          return cached;
        }
        
        // If not cached, fetch and cache
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Fallback for essential files
            if (request.url.includes('logo') || request.url.includes('favicon')) {
              return caches.match('/favicon-enhanced.png');
            }
            throw new Error('Resource not available');
          });
      }),
    );
  }
});

// Handle background sync (if needed for future features)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Placeholder for future background sync functionality
  console.log('Background sync triggered');
}

// Handle push notifications (if needed for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/favicon-enhanced.png',
      badge: '/favicon-enhanced.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'فتح التطبيق',
          icon: '/favicon-enhanced.png'
        },
        {
          action: 'close',
          title: 'إغلاق'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'يوسف شتيوي AI', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});