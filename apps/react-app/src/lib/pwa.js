/**
 * PWA Utilities
 * Service Worker registration and PWA features
 */

/**
 * Register service worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('Service Worker update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          showUpdateNotification();
        }
      });
    });

    // Auto-update check every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Show update notification
 */
function showUpdateNotification() {
  const updateBanner = document.createElement('div');
  updateBanner.id = 'sw-update-banner';
  updateBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideUp 0.3s ease-out;
    ">
      <span>🎉 New version available!</span>
      <button onclick="window.location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.3);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">Update Now</button>
      <button onclick="this.closest('div').remove()" style="
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0;
        width: 30px;
        height: 30px;
      ">×</button>
    </div>
  `;

  document.body.appendChild(updateBanner);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    updateBanner.remove();
  }, 10000);
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      )
    });

    console.log('Push subscription:', subscription);

    // Send subscription to backend
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
    await fetch(`${API_URL}/push-notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('cryb_session_token') ? JSON.parse(localStorage.getItem('cryb_session_token')).token : ''}`
      },
      body: JSON.stringify(subscription)
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Notify backend
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
      await fetch(`${API_URL}/push-notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cryb_session_token') ? JSON.parse(localStorage.getItem('cryb_session_token')).token : ''}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      console.log('Push unsubscribed');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    return false;
  }
}

/**
 * Check if app is installed (PWA)
 */
export function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
}

/**
 * Prompt to install app
 */
let deferredPrompt = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    deferredPrompt = null;
    hideInstallPromotion();
  });
}

export async function promptInstall() {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Install prompt outcome:', outcome);

  deferredPrompt = null;
  return outcome === 'accepted';
}

function showInstallPromotion() {
  // Dispatch custom event for UI to show install banner
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
}

function hideInstallPromotion() {
  window.dispatchEvent(new CustomEvent('pwa-install-complete'));
}

/**
 * Background sync for offline actions
 */
export async function syncWhenOnline(tag, data) {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Store data in IndexedDB for later sync
    await storeForSync(tag, data);

    // Register background sync
    await registration.sync.register(tag);

    console.log('Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('Background sync failed:', error);
    return false;
  }
}

/**
 * Store data for background sync (IndexedDB)
 */
async function storeForSync(tag, data) {
  // TODO: Implement with IndexedDB
  console.log('Storing for sync:', tag, data);
}

/**
 * Utility: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  if (!('connection' in navigator)) {
    return {
      online: navigator.onLine,
      effectiveType: 'unknown',
      downlink: null,
      rtt: null,
      saveData: false
    };
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    online: navigator.onLine,
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || null,
    rtt: connection.rtt || null,
    saveData: connection.saveData || false
  };
}

/**
 * Monitor network changes
 */
export function monitorNetwork(callback) {
  const handleOnline = () => callback({ ...getNetworkInfo(), online: true });
  const handleOffline = () => callback({ ...getNetworkInfo(), online: false });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection.addEventListener('change', () => callback(getNetworkInfo()));
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('All caches cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    return false;
  }
}

/**
 * Get cache size
 */
export async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: (estimate.usage / estimate.quota) * 100
    };
  }
  return null;
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isAppInstalled,
  initInstallPrompt,
  promptInstall,
  syncWhenOnline,
  getNetworkInfo,
  monitorNetwork,
  clearAllCaches,
  getCacheSize
};
