// ============================================================
//  sw.js — Service Worker GeoSmart SK Kiandongo
//  Ciri #8: PWA — cache aset, sokongan offline asas
// ============================================================
const CACHE_NAMA    = 'geosmart-v1';
const CACHE_STATIK  = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/admin.html',
  '/css/style.css',
  '/js/config.js',
  '/js/crypto.js',
  '/js/auth.js',
  '/js/geo.js',
  '/js/sheets.js',
  '/js/fonnte.js',
  '/js/app.js',
  '/js/admin.js',
  '/js/pdf.js',
  '/js/cron.js',
  '/manifest.json',
];

// ── Install: cache semua aset statik ─────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAMA).then(cache => {
      console.log('[SW] Caching aset statik...');
      return cache.addAll(CACHE_STATIK);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: buang cache lama ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAMA).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-first untuk aset statik, Network-first untuk API ─
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Biarkan API Google / Fonnte / Sheets terus ke rangkaian
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('fonnte.com') ||
    url.hostname.includes('sheets.googleapis.com')
  ) {
    event.respondWith(fetch(event.request).catch(() =>
      new Response(JSON.stringify({ error: 'Tiada rangkaian' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Cache-first untuk aset tempatan
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache respons baru yang berjaya
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAMA).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Halaman offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── Push Notification (untuk pemberitahuan masa hadapan) ──────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'GeoSmart', {
      body: data.body || 'Notifikasi GeoSmart SK Kiandongo',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'geosmart',
      data: data.url || '/dashboard.html',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
