/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Workbox injects the precache manifest here at build time.
// Each entry includes a content-hash revision, so when you deploy new code
// the SW automatically detects changed files and purges stale caches.
precacheAndRoute(self.__WB_MANIFEST);

// Remove caches from previous SW versions (including the old manual 'clmp-tech-v4')
cleanupOutdatedCaches();

// Activate immediately and take control of all open tabs
self.skipWaiting();
self.clients.claim();

// --- Runtime caching rules ---

// Supabase API: NetworkFirst with 10s timeout
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Images: CacheFirst for 30 days
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Fonts: CacheFirst for 1 year
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// --- Push Notifications ---

self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string; tag?: string } = {
    title: 'CLMP Tech',
    body: 'New notification',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/dashboard',
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
    tag: data.tag || 'default',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title || 'CLMP Tech', options));
});

// --- Notification Click ---

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url: string = event.notification.data?.url || '/dashboard';

  if (event.action === 'close') return;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          await (client as WindowClient).navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
