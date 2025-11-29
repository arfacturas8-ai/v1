// CRYB Platform Service Worker
// Enables offline functionality and caching for better mobile performance

const CACHE_NAME = 'cryb-v1.0.0'
const RUNTIME_CACHE = 'cryb-runtime-v1.0.0'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Core CSS and JS will be added automatically by build process
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for dynamic content
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for API calls
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        console.log('[SW] Installation complete')
        // Take control immediately
        return self.skipWaiting()
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Activation complete')
        // Take control of all clients
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Route to appropriate caching strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
  } else if (isAPIRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidateStrategy(request))
  } else {
    event.respondWith(networkFirstStrategy(request))
  }
})

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for:', request.url)
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      return cache.match('/offline.html') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

// Network-first strategy for pages
async function networkFirstStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for:', request.url)
    
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback for navigation requests
    if (request.destination === 'document') {
      return cache.match('/') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

// Stale-while-revalidate strategy for API calls
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await cache.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Silently fail network requests in background
    console.log('[SW] Background fetch failed for:', request.url)
  })
  
  // Return cached version immediately, update in background
  if (cachedResponse) {
    // Trigger background update
    event.waitUntil(fetchPromise)
    return cachedResponse
  }
  
  // If no cache, wait for network
  return fetchPromise
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/') || pathname.startsWith('/socket.io/')
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline actions when back online
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'BACKGROUND_SYNC' })
  })
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let notificationData
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData = {
        title: 'New Notification',
        body: event.data.text() || 'You have a new notification from CRYB',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
      }
    }
  } else {
    notificationData = {
      title: 'New Notification',
      body: 'You have a new notification from CRYB',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    image: notificationData.image,
    data: notificationData.data || {},
    tag: notificationData.tag || 'cryb-notification',
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    actions: notificationData.actions || [
      {
        action: 'open',
        title: 'Open',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192x192.png'
      }
    ]
  }

  // Show notification and track
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        return sendNotificationEvent('shown', notificationData)
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error)
      })
  )
})

// Notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  // Track notification click
  event.waitUntil(
    sendNotificationEvent('clicked', { 
      action, 
      data,
      title: notification.title,
      body: notification.body 
    })
  )

  if (action === 'dismiss') {
    return
  }

  // Determine URL to open based on notification type
  let targetUrl = '/'
  
  if (data.type) {
    switch (data.type) {
      case 'message':
      case 'dm':
        targetUrl = data.channelId ? `/channels/${data.channelId}` : '/messages'
        break
      case 'mention':
        if (data.postId) {
          targetUrl = `/posts/${data.postId}`
        } else if (data.commentId) {
          targetUrl = `/comments/${data.commentId}`
        } else if (data.channelId) {
          targetUrl = `/channels/${data.channelId}`
        }
        break
      case 'post_comment':
      case 'post_like':
        targetUrl = data.postId ? `/posts/${data.postId}` : '/'
        break
      case 'comment_reply':
        targetUrl = data.parentCommentId ? `/comments/${data.parentCommentId}` : '/'
        break
      case 'follow':
        targetUrl = data.followerId ? `/users/${data.followerId}` : '/'
        break
      case 'friend_request':
        targetUrl = '/friends/requests'
        break
      case 'voice_call':
      case 'video_call':
        targetUrl = data.channelId ? `/voice/${data.channelId}` : '/'
        break
      case 'server_invite':
        targetUrl = data.serverId ? `/servers/${data.serverId}` : '/servers'
        break
      case 'community_invite':
        targetUrl = data.communityId ? `/communities/${data.communityId}` : '/communities'
        break
      case 'crypto_tip':
        targetUrl = '/wallet/tips'
        break
      case 'nft_transfer':
        targetUrl = '/wallet/nfts'
        break
      case 'security_alert':
        targetUrl = '/settings/security'
        break
      case 'maintenance':
        targetUrl = '/status'
        break
      default:
        targetUrl = '/notifications'
    }
  }

  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if any client is already open to the target URL
        for (const client of clientList) {
          if (client.url.includes(new URL(targetUrl, self.location.origin).pathname) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Check for any open client to navigate
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus().then(() => {
              return client.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetUrl,
                data: data
              })
            })
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(new URL(targetUrl, self.location.origin).href)
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error)
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event)

  const notification = event.notification
  const data = notification.data || {}

  // Track notification close
  event.waitUntil(
    sendNotificationEvent('closed', { 
      data,
      title: notification.title,
      body: notification.body 
    })
  )
})

// Message handling
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Helper function to send notification events to API
async function sendNotificationEvent(eventType, data) {
  try {
    const API_BASE_URL = self.location.origin.includes('localhost') 
      ? 'http://localhost:3002' 
      : 'https://api.cryb.ai'

    // Get auth token
    const token = await getAuthToken()
    
    if (!token) {
      console.warn('[SW] No auth token available for notification tracking')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/push-notifications/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log(`[SW] Notification event '${eventType}' tracked successfully`)
  } catch (error) {
    console.error('[SW] Error tracking notification event:', error)
    
    // Store failed events for retry
    await storeFailedEvent(eventType, data)
  }
}

// Get auth token from storage
async function getAuthToken() {
  try {
    // Try to get token from clients
    const clients = await self.clients.matchAll()
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.token)
        }
        
        clients[0].postMessage({
          type: 'GET_AUTH_TOKEN'
        }, [messageChannel.port2])
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(null), 5000)
      })
    }

    return null
  } catch (error) {
    console.error('[SW] Error getting auth token:', error)
    return null
  }
}

// Store failed events for retry
async function storeFailedEvent(eventType, data) {
  try {
    const request = indexedDB.open('cryb-notifications', 1)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('failed_events')) {
        const store = db.createObjectStore('failed_events', { keyPath: 'id', autoIncrement: true })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['failed_events'], 'readwrite')
      const store = transaction.objectStore('failed_events')
      
      store.add({
        eventType,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      })
    }
  } catch (error) {
    console.error('[SW] Error storing failed event:', error)
  }
}

console.log('[SW] CRYB Service Worker with Push Notifications loaded')