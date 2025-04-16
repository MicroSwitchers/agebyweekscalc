const CACHE_NAME = 'age-category-calculator-v1';
const urlsToCache = [
    './',
    './index.html',
    './script.js',
    './styles.css',
    './calicon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event (serve cached files first)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});

// Activate event (clean up old caches)
self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheAllowlist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
