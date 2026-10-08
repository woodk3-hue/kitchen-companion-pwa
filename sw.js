// PantryFit — Service Worker
// Caches the app shell so it works fully offline after first load.

const CACHE_NAME = 'pantryfit-v30';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './recipes-seed.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/plus-jakarta-sans.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first for the HTML (so updates are picked up when online),
// falling back to cache when offline. Cache-first for static assets.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Leave API calls (Anthropic, TheMealDB) and anything that isn't a GET to the network
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.url.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
