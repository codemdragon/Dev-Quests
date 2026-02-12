const CACHE_NAME = 'devquest-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - caching assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch event - Cache-First strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Filter what to cache if needed, but for 100% offline we should cache everything fetched
                    // if it wasn't in the initial list (e.g. fonts loaded by FA)
                    if (event.request.url.startsWith('http') || event.request.url.startsWith(self.location.origin)) {
                        cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Fallback for offline (optional, as we aim for 100% cache)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
