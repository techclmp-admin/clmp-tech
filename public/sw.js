// Bump cache name to force clients to drop old cached JS/CSS that can cause UI/version mismatches
const CACHE_NAME = 'clmp-tech-v4';
const OFFLINE_URL = '/';

// Core assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/projects',
  '/budget',
  '/chat',
  '/calendar',
  '/compliance',
  '/favicon.png',
  '/favicon.ico',
  '/clmp-share-image.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache static assets
      await cache.addAll(STATIC_ASSETS);
      // Activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Take control immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for Supabase API
  if (url.origin !== self.location.origin && !url.origin.includes('supabase.co')) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          // Cache the response
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          // If network fails, try cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline page
          return caches.match(OFFLINE_URL);
        }
      })()
    );
    return;
  }

  // Handle API requests (Supabase) - network first
  if (url.origin.includes('supabase.co')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (error) {
          // Return cached response if available
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return error response
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Handle static assets
  // - JS/CSS: NetworkFirst to avoid serving stale UI after deploy
  // - Images/Fonts: CacheFirst for performance
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      (async () => {
        const isJsOrCss = request.destination === 'script' || request.destination === 'style';

        // JS/CSS: Network First (prevents stale app code)
        if (isJsOrCss) {
          try {
            const networkResponse = await fetch(request);
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse.clone());
            return networkResponse;
          } catch (error) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;
            throw error;
          }
        }

        // Images/Fonts: Cache First (fast), background update
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          event.waitUntil(
            (async () => {
              try {
                const networkResponse = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, networkResponse);
              } catch {
                // ignore
              }
            })()
          );
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          if (request.destination === 'image') return new Response('', { status: 404 });
          throw error;
        }
      })()
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    })()
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = { title: 'CLMP Tech', body: 'New notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/dashboard'
    },
    actions: [
      { action: 'open', title: 'View', icon: '/favicon.png' },
      { action: 'close', title: 'Dismiss', icon: '/favicon.png' }
    ],
    tag: data.tag || 'default',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window' });
      // Focus existing window if available
      for (const client of windows) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          await client.navigate(url);
          return;
        }
      }
      // Open new window
      await self.clients.openWindow(url);
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Get pending actions from IndexedDB and sync with server
  console.log('Background sync triggered');
  // Implementation would go here
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-data') {
    event.waitUntil(refreshCachedData());
  }
});

async function refreshCachedData() {
  // Refresh cached data in background
  console.log('Periodic sync triggered');
  // Implementation would go here
}
