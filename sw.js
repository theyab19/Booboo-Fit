/* بوبو فت — Booboo Fit · Service Worker
 * - Cache-first for the app shell (HTML/CSS/JS/icons)
 * - Cache-first (stale-while-revalidate) for Google Fonts
 * - Stale-while-revalidate for hotlinked GIFs; a failed GIF never breaks the page
 */

const VERSION = 'booboo-fit-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const FONT_CACHE = `${VERSION}-fonts`;
const GIF_CACHE = `${VERSION}-gifs`;

// App shell — everything needed to run offline (shell + SVG fallbacks live in JS).
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll fails if any single asset 404s; add individually to stay resilient.
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

const isFontRequest = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

const isGifRequest = (url) =>
  url.pathname.toLowerCase().endsWith('.gif') ||
  url.hostname.includes('nourishmovelove.com') ||
  url.hostname.includes('fitnessprogramer.com');

// Stale-while-revalidate: serve cache immediately, refresh in background.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // offline / blocked: fall back to whatever we have
  return cached || network;
}

// Cache-first: shell assets rarely change within a version.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // GIFs: never let a failure surface as an error — <img onerror> shows the SVG.
  if (isGifRequest(url)) {
    event.respondWith(
      staleWhileRevalidate(request, GIF_CACHE).catch(() => Response.error())
    );
    return;
  }

  // Google Fonts (CSS + font files).
  if (isFontRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // Navigations: try network, fall back to cached shell so the app opens offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('./index.html').then((r) => r || caches.match('./'))
      )
    );
    return;
  }

  // Same-origin shell assets: cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheFirst(request, SHELL_CACHE).catch(() => caches.match(request))
    );
    return;
  }

  // Anything else: network with cache fallback.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
