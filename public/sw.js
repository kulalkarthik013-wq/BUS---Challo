// Bus Timings service worker — offline-ish shell caching.
// Strategy: precache the app shell; network-first for pages (fresh data),
// cache-first for static assets. Never caches /env.js or cross-origin
// (Supabase) requests.
const CACHE = 'bt-v5';
const SHELL = [
  '/',
  '/style.css',
  '/js/shared.js',
  '/js/site.js',
  '/js/footer.js',
  '/js/cookies.js',
  '/js/lang.js',
  '/js/theme-init.js',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon-32.png',
  '/favicon-16.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname === '/env.js' || url.pathname === '/admin' || url.pathname === '/admin.html') return;

  // Page navigations: network first, cache each page under its own URL so a
  // cached /s/<slug> never serves the wrong page offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('/')))
    );
    return;
  }

  // Static assets: cache first, refresh in background.
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
