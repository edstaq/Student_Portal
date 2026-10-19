// EDSTAQ Student Portal Service Worker for PWA Support
const CACHE_NAME = 'edstaq-portal-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/edstaq-logo.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA initial asset caching skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Let external Google Drive and Apps Script requests pass through directly
  if (
    event.request.url.includes('google.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('script.google.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

// Handle push notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear icon badge on notification click
  if (self.navigator && 'clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  } else if (self.registration && 'clearAppBadge' in self.registration) {
    self.registration.clearAppBadge().catch(() => {});
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle push events from Web Push server
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'EDSTAQ Revision Reminder',
      body: event.data ? event.data.text() : 'You have a scheduled revision session due today.'
    };
  }

  const title = payload.title || 'EDSTAQ Revision Reminder';
  const count = payload.badgeCount || 1;
  const options = {
    body: payload.body || 'You have a scheduled revision session due today.',
    icon: '/edstaq-logo.png',
    badge: '/pwa-icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'edstaq-revision-alert',
    renotify: true,
    data: { url: payload.url || '/' }
  };

  const promiseList = [self.registration.showNotification(title, options)];

  if (self.navigator && 'setAppBadge' in self.navigator) {
    promiseList.push(self.navigator.setAppBadge(count).catch(() => {}));
  } else if (self.registration && 'setAppBadge' in self.registration) {
    promiseList.push(self.registration.setAppBadge(count).catch(() => {}));
  }

  event.waitUntil(Promise.all(promiseList));
});

// Listen to client messages (e.g. from App or Settings)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, badgeCount, url } = event.data;
    const count = badgeCount || 1;
    self.registration.showNotification(title || 'EDSTAQ Revision Reminder', {
      body: body || 'You have a revision task due today.',
      icon: '/edstaq-logo.png',
      badge: '/pwa-icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'edstaq-revision-alert',
      renotify: true,
      data: { url: url || '/' }
    });

    if (self.navigator && 'setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(count).catch(() => {});
    } else if (self.registration && 'setAppBadge' in self.registration) {
      self.registration.setAppBadge(count).catch(() => {});
    }
  } else if (event.data.type === 'SET_BADGE') {
    const count = event.data.count || 1;
    if (self.navigator && 'setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(count).catch(() => {});
    } else if (self.registration && 'setAppBadge' in self.registration) {
      self.registration.setAppBadge(count).catch(() => {});
    }
  } else if (event.data.type === 'CLEAR_BADGE') {
    if (self.navigator && 'clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge().catch(() => {});
    } else if (self.registration && 'clearAppBadge' in self.registration) {
      self.registration.clearAppBadge().catch(() => {});
    }
  }
});
