const CACHE = 'cili-2026-v1';

// Files to cache for offline use
const PRECACHE = [
  '/tracker/',
  '/tracker/index.html',
  '/tracker/manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
];

// Install — cache core files
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      // Cache what we can, don't fail on errors
      return Promise.allSettled(
        PRECACHE.map(function(url) {
          return cache.add(url).catch(function() {});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — cache-first for assets, network-first for Firebase
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Firebase — always network, no cache
  if (url.includes('firebase') || url.includes('firebasedatabase')) {
    return;
  }

  // Google Fonts — cache first
  if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          return resp;
        });
      })
    );
    return;
  }

  // HTML/JS/CSS — network first, fallback to cache
  e.respondWith(
    fetch(e.request).then(function(resp) {
      var clone = resp.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      return resp;
    }).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match('/tracker/');
      });
    })
  );
});
