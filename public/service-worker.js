const CACHE_NAME = 'clinic-management-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/favicon-96x96.png',
  '/assets/favicon.svg',
  '/assets/apple-touch-icon.png',
  '/assets/logo.png',
  '/vite.svg'
];


// Install & cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate & cleanup old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (!cacheWhitelist.includes(name)) return caches.delete(name);
        })
      )
    )
  );
  return self.clients.claim();
});

// Fetch requests handling
self.addEventListener('fetch', event => {
  // Ignore non-GET requests or non-http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  // Network-first for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for other GET requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));

        return networkResponse;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', event => {
  let payload = { title: 'إشعار', body: 'لقد وصلك إشعار', icon: '/assets/web-app-manifest-192x192.png', url: '/' };

  try {
    const data = event.data ? event.data.json() : null;
    if (data) payload = Object.assign(payload, data);
  } catch (e) {
    try { payload.body = event.data.text(); } catch (e) {}
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    data: { url: payload.url },
    actions: payload.actions || []
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Click on notifications
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
