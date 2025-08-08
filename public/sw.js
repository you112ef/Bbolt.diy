const CACHE_NAME = 'ys-ai-cache-v1';
const ASSET_CACHE = 'ys-ai-assets-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // HTML: Network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Assets: stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      }),
    );
  }
});