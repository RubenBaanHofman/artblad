// Artblad service worker (2.6.0): lets the app open without a connection.
// Network first, always: when the site can be reached, the newest files are used and a copy is kept; only when the
// network fails is the kept copy used. So it never holds back an update. Only this site's own files are kept
// (not Supabase data or photos; the data copy for offline reading lives in IndexedDB, see js/02-data.js).
const CACHE = 'artblad-shell';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = (await cache.match('./')) || (await cache.match('index.html', { ignoreSearch: true }));
        if (home) return home;
      }
      throw err;
    }
  })());
});
