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

// Fetch event - Correct Cache-First strategy
self.addEventListener('fetch', (event) => {
    // 1. Check if the request is in the cache.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 2. If it's in the cache, return the cached response immediately.
            if (cachedResponse) {
                return cachedResponse;
            }

            // 3. If not in cache, fetch from the network.
            return fetch(event.request).then((networkResponse) => {
                // 4. (Optional but Recommended) Clone the response and add it to the cache for future offline access.
                return caches.open(CACHE_NAME).then((cache) => {
                    // Cache the new resource for next time
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            // This part is crucial for when both cache and network fail (i.e., you are offline
            // and the resource was never cached). It can return a fallback page.
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
