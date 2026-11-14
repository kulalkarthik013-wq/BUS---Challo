// Bus Timings service worker — offline-ish shell caching.
// Strategy: precache the app shell; network-first for pages (fresh data),
// cache-first for static assets. Never caches /env.js or cross-origin
// (Supabase) requests.
const CACHE = 'bt-v1';
const SHELL = [
  '/',
  '/style.css',
  '/js/shared.js',
  '/js/site.js',
  '/js/footer.js',
  '/js/cookies.js',
  '/manifest.webmanifest',
  '/icon.svg',
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

  // Page navigations: network first, fall back to cached home shell offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('/', copy)); }
        return res;
      }).catch(() => caches.match('/'))
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
