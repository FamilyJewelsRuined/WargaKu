// WargaKu Service Worker
// Handles: Web Push Notifications + Basic caching

const CACHE_NAME = 'wargaku-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
];

// ============================================================
// INSTALL EVENT - Cache static assets
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing WargaKu Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache install warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE EVENT - Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating WargaKu Service Worker...');
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

// ============================================================
// PUSH EVENT - Handle incoming push notifications
// ============================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: 'WargaKu',
      body: event.data.text(),
    };
  }

  const { title, body, icon, badge, tag, url } = payload;

  const options = {
    body: body || 'Ada notifikasi baru dari WargaKu',
    icon: icon || '/icons/icon-192.png',
    badge: badge || '/icons/icon-192.png',
    tag: tag || 'wargaku-notification',
    requireInteraction: tag === 'panic-alert', // Panic alerts require user interaction
    vibrate: tag === 'panic-alert' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    data: { url: url || '/dashboard' },
    actions: tag === 'panic-alert'
      ? [{ action: 'view', title: 'Lihat Detail' }]
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(title || 'WargaKu', options)
  );
});

// ============================================================
// NOTIFICATION CLICK EVENT
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================
// FETCH EVENT - Network first, fallback to cache
// ============================================================
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip API and auth requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline - Buka WargaKu saat ada koneksi', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});
