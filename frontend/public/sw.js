// frontend/public/sw.js
// Basic service worker — caches shell assets for offline support.
// Strategy: Cache-first for static assets, network-first for API calls.

const CACHE_NAME = 'chatflow-v1';

// Static shell assets to pre-cache
const PRECACHE_URLS = [
    '/',
    '/chat',
    '/login',
    '/manifest.json',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS).catch((err) => {
                console.warn('[SW] Pre-cache failed (some URLs may not exist yet):', err);
            });
        })
    );
    self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
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

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and cross-origin requests to API/socket
    if (request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;
    // Skip chrome-extension and other non-http(s) schemes
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(
        caches.match(request).then((cached) => {
            // Network-first for HTML navigation (always get fresh page shell)
            if (request.mode === 'navigate') {
                return fetch(request)
                    .then((response) => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                        return response;
                    })
                    .catch(() => cached || caches.match('/'));
            }

            // Cache-first for everything else (JS, CSS, fonts, images)
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});