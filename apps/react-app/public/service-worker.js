/**
 * CRYB Platform Service Worker
 * Provides offline support, caching, and push notifications
 */

const CACHE_VERSION = 'cryb-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png'
];

// API routes to cache
const API_ROUTES = [
  '/api/v1/users/me',
  '/api/v1/communities',
  '/api/v1/servers'
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
  images: 50,
  dynamic: 100,
  api: 30
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('cryb-') &&
                     !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Skip Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle image requests - cache first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      await limitCacheSize(IMAGE_CACHE, MAX_CACHE_SIZE.images);
      await cache.put(request, responseClone);
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Image fetch failed:', error);
    // Return placeholder image
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e5e7eb"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af">Image Offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Handle API requests - network first with cache fallback
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);

    // Cache successful GET requests
    if (response.ok && request.method === 'GET') {
      const responseClone = response.clone();
      await limitCacheSize(API_CACHE, MAX_CACHE_SIZE.api);
      await cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] API fetch failed, trying cache:', error);
    const cached = await cache.match(request);

    if (cached) {
      // Add custom header to indicate cached response
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers
      });
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests - network first
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful navigation
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Navigation fetch failed, trying cache');

    // Try cache first
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }

    // Fallback offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - CRYB</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
            }
            h1 { font-size: 3rem; margin: 0 0 1rem; }
            p { font-size: 1.25rem; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📱 You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle static asset requests - cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Static fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Delete oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'CRYB Notification',
    body: 'You have a new notification',
    icon: '/logo-192.png',
    badge: '/badge-72.png',
    tag: 'notification',
    requireInteraction: false
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync messages when back online
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB or cache
    const pendingMessages = await getPendingMessages();

    // Send each message
    for (const message of pendingMessages) {
      try {
        await fetch('/api/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });

        // Remove from pending after successful send
        await removePendingMessage(message.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Helper functions for pending messages (implement with IndexedDB)
async function getPendingMessages() {
  // TODO: Implement with IndexedDB
  return [];
}

async function removePendingMessage(id) {
  // TODO: Implement with IndexedDB
}

// Message event - communicate with clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        ))
        .then(() => event.ports[0].postMessage({ success: true }))
    );
  }
});

console.log('[Service Worker] Loaded successfully');
