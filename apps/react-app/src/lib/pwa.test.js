/**
 * PWA Utilities Tests
 * Comprehensive test coverage for service worker, PWA features, and offline functionality
 */

import {
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
} from './pwa.js';

// Mock environment variables
const mockEnv = {
  VITE_VAPID_PUBLIC_KEY: 'BNFPGLsWxY1234567890abcdefghijklmnopqrstuvwxyz',
  VITE_API_URL: 'https://api.test.com/api/v1'
};

// Helper to mock import.meta.env
global.importMetaEnv = mockEnv;

describe('Service Worker Registration', () => {
  let mockRegistration;
  let mockServiceWorker;

  beforeEach(() => {
    // Mock service worker registration
    mockServiceWorker = {
      state: 'installed',
      addEventListener: jest.fn()
    };

    mockRegistration = {
      scope: '/',
      installing: mockServiceWorker,
      addEventListener: jest.fn(),
      update: jest.fn()
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        register: jest.fn(),
        getRegistration: jest.fn(),
        ready: Promise.resolve(mockRegistration),
        controller: {}
      }
    });

    // Mock console methods
    global.console.log = jest.fn();
    global.console.error = jest.fn();

    // Clear timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('registerServiceWorker()', () => {
    test('should register service worker successfully', async () => {
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);

      const result = await registerServiceWorker();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/service-worker.js',
        { scope: '/' }
      );
      expect(result).toBe(mockRegistration);
      expect(console.log).toHaveBeenCalledWith('Service Worker registered:', '/');
    });

    test('should return null if service worker not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      delete navigator.serviceWorker;

      const result = await registerServiceWorker();

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('Service Worker not supported');

      navigator.serviceWorker = originalServiceWorker;
    });

    test('should handle registration failure', async () => {
      const error = new Error('Registration failed');
      navigator.serviceWorker.register.mockRejectedValue(error);

      const result = await registerServiceWorker();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Service Worker registration failed:',
        error
      );
    });

    test('should listen for updatefound event', async () => {
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);

      await registerServiceWorker();

      expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
        'updatefound',
        expect.any(Function)
      );
    });

    test('should schedule automatic updates every hour', async () => {
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);

      await registerServiceWorker();

      // Fast-forward 1 hour
      jest.advanceTimersByTime(60 * 60 * 1000);

      expect(mockRegistration.update).toHaveBeenCalledTimes(1);

      // Fast-forward another hour
      jest.advanceTimersByTime(60 * 60 * 1000);

      expect(mockRegistration.update).toHaveBeenCalledTimes(2);
    });

    test('should detect service worker updates', async () => {
      navigator.serviceWorker.register.mockResolvedValue(mockRegistration);
      navigator.serviceWorker.controller = {}; // Existing controller

      // Mock document.body for update notification
      document.body.appendChild = jest.fn();

      await registerServiceWorker();

      // Get the updatefound callback
      const updateFoundCallback = mockRegistration.addEventListener.mock.calls[0][1];

      // Trigger updatefound
      updateFoundCallback();

      // Get the statechange callback
      const stateChangeCallback = mockServiceWorker.addEventListener.mock.calls[0][1];

      // Trigger statechange
      stateChangeCallback();

      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('unregisterServiceWorker()', () => {
    test('should unregister service worker successfully', async () => {
      const mockUnregister = jest.fn().mockResolvedValue(true);
      mockRegistration.unregister = mockUnregister;
      navigator.serviceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const result = await unregisterServiceWorker();

      expect(result).toBe(true);
      expect(mockUnregister).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Service Worker unregistered:', true);
    });

    test('should return false if no registration exists', async () => {
      navigator.serviceWorker.getRegistration.mockResolvedValue(null);

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);
    });

    test('should return false if service worker not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      delete navigator.serviceWorker;

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);

      navigator.serviceWorker = originalServiceWorker;
    });

    test('should handle unregistration failure', async () => {
      const error = new Error('Unregistration failed');
      navigator.serviceWorker.getRegistration.mockRejectedValue(error);

      const result = await unregisterServiceWorker();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Service Worker unregistration failed:',
        error
      );
    });
  });
});

describe('Notification Permissions', () => {
  beforeEach(() => {
    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn()
    };
    global.console.log = jest.fn();
    global.console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermission()', () => {
    test('should return true if permission already granted', async () => {
      global.Notification.permission = 'granted';

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });

    test('should request permission and return true if granted', async () => {
      global.Notification.permission = 'default';
      global.Notification.requestPermission.mockResolvedValue('granted');

      const result = await requestNotificationPermission();

      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('should request permission and return false if denied', async () => {
      global.Notification.permission = 'default';
      global.Notification.requestPermission.mockResolvedValue('denied');

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
    });

    test('should return false if permission already denied', async () => {
      global.Notification.permission = 'denied';

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });

    test('should return false if Notification API not supported', async () => {
      const originalNotification = global.Notification;
      delete global.Notification;

      const result = await requestNotificationPermission();

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Notifications not supported');

      global.Notification = originalNotification;
    });
  });
});

describe('Push Notifications', () => {
  let mockRegistration;
  let mockSubscription;

  beforeEach(() => {
    mockSubscription = {
      endpoint: 'https://push.test.com/sub123',
      toJSON: jest.fn().mockReturnValue({
        endpoint: 'https://push.test.com/sub123'
      }),
      unsubscribe: jest.fn()
    };

    mockRegistration = {
      pushManager: {
        subscribe: jest.fn(),
        getSubscription: jest.fn()
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted')
    };

    global.fetch = jest.fn();
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ token: 'test-token' }))
    };
    global.console.log = jest.fn();
    global.console.error = jest.fn();

    // Mock atob for base64 decoding
    global.atob = jest.fn((str) => str);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToPushNotifications()', () => {
    test('should subscribe to push notifications successfully', async () => {
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      global.fetch.mockResolvedValue({ ok: true });

      const result = await subscribeToPushNotifications();

      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array)
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/push-notifications/subscribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          })
        })
      );
      expect(result).toBe(mockSubscription);
    });

    test('should return null if permission denied', async () => {
      global.Notification.permission = 'denied';

      const result = await subscribeToPushNotifications();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle subscription failure', async () => {
      const error = new Error('Subscription failed');
      mockRegistration.pushManager.subscribe.mockRejectedValue(error);

      const result = await subscribeToPushNotifications();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Push subscription failed:', error);
    });

    test('should handle fetch failure gracefully', async () => {
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await subscribeToPushNotifications();

      expect(result).toBeNull();
    });
  });

  describe('unsubscribeFromPushNotifications()', () => {
    test('should unsubscribe from push notifications successfully', async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      mockSubscription.unsubscribe.mockResolvedValue(true);
      global.fetch.mockResolvedValue({ ok: true });

      const result = await unsubscribeFromPushNotifications();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/push-notifications/unsubscribe',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Push unsubscribed');
    });

    test('should return false if no subscription exists', async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(null);

      const result = await unsubscribeFromPushNotifications();

      expect(result).toBe(false);
    });

    test('should handle unsubscription failure', async () => {
      const error = new Error('Unsubscription failed');
      mockRegistration.pushManager.getSubscription.mockRejectedValue(error);

      const result = await unsubscribeFromPushNotifications();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Push unsubscription failed:', error);
    });
  });
});

describe('PWA Install Prompt', () => {
  beforeEach(() => {
    global.console.log = jest.fn();
    global.window = {
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      matchMedia: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAppInstalled()', () => {
    test('should return true if app is in standalone mode', () => {
      window.matchMedia.mockReturnValue({ matches: true });
      window.navigator = { standalone: false };
      document.referrer = '';

      const result = isAppInstalled();

      expect(result).toBe(true);
    });

    test('should return true if iOS standalone mode', () => {
      window.matchMedia.mockReturnValue({ matches: false });
      window.navigator = { standalone: true };
      document.referrer = '';

      const result = isAppInstalled();

      expect(result).toBe(true);
    });

    test('should return true if Android TWA', () => {
      window.matchMedia.mockReturnValue({ matches: false });
      window.navigator = { standalone: false };
      document.referrer = 'android-app://com.example.app';

      const result = isAppInstalled();

      expect(result).toBe(true);
    });

    test('should return false if app not installed', () => {
      window.matchMedia.mockReturnValue({ matches: false });
      window.navigator = { standalone: false };
      document.referrer = 'https://example.com';

      const result = isAppInstalled();

      expect(result).toBe(false);
    });
  });

  describe('initInstallPrompt()', () => {
    test('should listen for beforeinstallprompt event', () => {
      initInstallPrompt();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
    });

    test('should listen for appinstalled event', () => {
      initInstallPrompt();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      );
    });

    test('should prevent default and store deferred prompt', () => {
      initInstallPrompt();

      const beforeInstallPromptCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )[1];

      const mockEvent = {
        preventDefault: jest.fn()
      };

      beforeInstallPromptCallback(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'pwa-install-available' })
      );
    });

    test('should dispatch pwa-install-complete on app installed', () => {
      initInstallPrompt();

      const appInstalledCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'appinstalled'
      )[1];

      appInstalledCallback();

      expect(console.log).toHaveBeenCalledWith('PWA installed');
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'pwa-install-complete' })
      );
    });
  });

  describe('promptInstall()', () => {
    test('should show install prompt and return true if accepted', async () => {
      // Setup deferred prompt
      const mockPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      initInstallPrompt();
      const beforeInstallPromptCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )[1];
      beforeInstallPromptCallback({ preventDefault: jest.fn(), ...mockPrompt });

      const result = await promptInstall();

      expect(mockPrompt.prompt).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Install prompt outcome:', 'accepted');
    });

    test('should return false if user dismisses prompt', async () => {
      const mockPrompt = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };

      initInstallPrompt();
      const beforeInstallPromptCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )[1];
      beforeInstallPromptCallback({ preventDefault: jest.fn(), ...mockPrompt });

      const result = await promptInstall();

      expect(result).toBe(false);
    });

    test('should return false if prompt not available', async () => {
      const result = await promptInstall();

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Install prompt not available');
    });
  });
});

describe('Background Sync', () => {
  let mockRegistration;

  beforeEach(() => {
    mockRegistration = {
      sync: {
        register: jest.fn()
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.console.log = jest.fn();
    global.console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncWhenOnline()', () => {
    test('should register background sync successfully', async () => {
      mockRegistration.sync.register.mockResolvedValue(undefined);

      const result = await syncWhenOnline('test-sync', { data: 'test' });

      expect(mockRegistration.sync.register).toHaveBeenCalledWith('test-sync');
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Background sync registered:', 'test-sync');
    });

    test('should handle background sync failure', async () => {
      const error = new Error('Sync failed');
      mockRegistration.sync.register.mockRejectedValue(error);

      const result = await syncWhenOnline('test-sync', { data: 'test' });

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Background sync failed:', error);
    });

    test('should log data storage for sync', async () => {
      mockRegistration.sync.register.mockResolvedValue(undefined);
      const testData = { id: 1, action: 'create' };

      await syncWhenOnline('test-sync', testData);

      expect(console.log).toHaveBeenCalledWith('Storing for sync:', 'test-sync', testData);
    });
  });
});

describe('Network Information', () => {
  beforeEach(() => {
    global.navigator = {
      onLine: true
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNetworkInfo()', () => {
    test('should return network info with connection API', () => {
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      };

      global.navigator.connection = mockConnection;

      const result = getNetworkInfo();

      expect(result).toEqual({
        online: true,
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      });
    });

    test('should return basic info when connection API not available', () => {
      const result = getNetworkInfo();

      expect(result).toEqual({
        online: true,
        effectiveType: 'unknown',
        downlink: null,
        rtt: null,
        saveData: false
      });
    });

    test('should detect offline status', () => {
      global.navigator.onLine = false;

      const result = getNetworkInfo();

      expect(result.online).toBe(false);
    });

    test('should handle mozConnection prefix', () => {
      const mockConnection = {
        effectiveType: '3g',
        downlink: 5,
        rtt: 100,
        saveData: true
      };

      global.navigator.mozConnection = mockConnection;

      const result = getNetworkInfo();

      expect(result.effectiveType).toBe('3g');
      expect(result.saveData).toBe(true);
    });

    test('should handle webkitConnection prefix', () => {
      const mockConnection = {
        effectiveType: '2g',
        downlink: 1,
        rtt: 200
      };

      global.navigator.webkitConnection = mockConnection;

      const result = getNetworkInfo();

      expect(result.effectiveType).toBe('2g');
    });
  });

  describe('monitorNetwork()', () => {
    let mockConnection;

    beforeEach(() => {
      mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: jest.fn()
      };

      global.navigator.connection = mockConnection;
      global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    });

    test('should call callback on online event', () => {
      const callback = jest.fn();
      monitorNetwork(callback);

      const onlineCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];

      onlineCallback();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ online: true })
      );
    });

    test('should call callback on offline event', () => {
      const callback = jest.fn();
      monitorNetwork(callback);

      const offlineCallback = window.addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )[1];

      global.navigator.onLine = false;
      offlineCallback();

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ online: false })
      );
    });

    test('should listen to connection change events', () => {
      const callback = jest.fn();
      monitorNetwork(callback);

      expect(mockConnection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('should return cleanup function', () => {
      const callback = jest.fn();
      const cleanup = monitorNetwork(callback);

      expect(typeof cleanup).toBe('function');

      cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );
    });

    test('should work without connection API', () => {
      delete global.navigator.connection;
      const callback = jest.fn();

      const cleanup = monitorNetwork(callback);

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(typeof cleanup).toBe('function');
    });
  });
});

describe('Cache Management', () => {
  beforeEach(() => {
    global.caches = {
      keys: jest.fn(),
      delete: jest.fn()
    };

    global.navigator = {
      storage: {
        estimate: jest.fn()
      }
    };

    global.console.log = jest.fn();
    global.console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('clearAllCaches()', () => {
    test('should clear all caches successfully', async () => {
      const cacheNames = ['cache-v1', 'cache-v2', 'cache-v3'];
      global.caches.keys.mockResolvedValue(cacheNames);
      global.caches.delete.mockResolvedValue(true);

      const result = await clearAllCaches();

      expect(result).toBe(true);
      expect(global.caches.keys).toHaveBeenCalled();
      expect(global.caches.delete).toHaveBeenCalledTimes(3);
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v1');
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v2');
      expect(global.caches.delete).toHaveBeenCalledWith('cache-v3');
      expect(console.log).toHaveBeenCalledWith('All caches cleared');
    });

    test('should handle empty cache list', async () => {
      global.caches.keys.mockResolvedValue([]);

      const result = await clearAllCaches();

      expect(result).toBe(true);
      expect(global.caches.delete).not.toHaveBeenCalled();
    });

    test('should handle cache clearing failure', async () => {
      const error = new Error('Cache deletion failed');
      global.caches.keys.mockRejectedValue(error);

      const result = await clearAllCaches();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to clear caches:', error);
    });

    test('should handle partial cache deletion failures', async () => {
      global.caches.keys.mockResolvedValue(['cache-v1', 'cache-v2']);
      global.caches.delete
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Delete failed'));

      const result = await clearAllCaches();

      // Promise.all will reject if any promise rejects
      expect(result).toBe(false);
    });
  });

  describe('getCacheSize()', () => {
    test('should return cache size information', async () => {
      const mockEstimate = {
        usage: 5000000,
        quota: 50000000
      };

      global.navigator.storage.estimate.mockResolvedValue(mockEstimate);

      const result = await getCacheSize();

      expect(result).toEqual({
        usage: 5000000,
        quota: 50000000,
        percentage: 10
      });
    });

    test('should calculate percentage correctly', async () => {
      const mockEstimate = {
        usage: 25000000,
        quota: 100000000
      };

      global.navigator.storage.estimate.mockResolvedValue(mockEstimate);

      const result = await getCacheSize();

      expect(result.percentage).toBe(25);
    });

    test('should return null if storage API not available', async () => {
      delete global.navigator.storage;

      const result = await getCacheSize();

      expect(result).toBeNull();
    });

    test('should return null if estimate method not available', async () => {
      global.navigator.storage = {};

      const result = await getCacheSize();

      expect(result).toBeNull();
    });

    test('should handle zero quota', async () => {
      const mockEstimate = {
        usage: 0,
        quota: 0
      };

      global.navigator.storage.estimate.mockResolvedValue(mockEstimate);

      const result = await getCacheSize();

      expect(result.percentage).toBeNaN(); // 0/0 = NaN
    });
  });
});

describe('Update Notification', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.appendChild = jest.fn();
    global.setTimeout = jest.fn((fn, delay) => {
      return { id: 123, fn, delay };
    });
    global.console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should show update notification banner', async () => {
    const mockRegistration = {
      scope: '/',
      installing: {
        state: 'installed',
        addEventListener: jest.fn()
      },
      addEventListener: jest.fn(),
      update: jest.fn()
    };

    navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue(mockRegistration),
      controller: {}
    };

    await registerServiceWorker();

    // Trigger updatefound
    const updateFoundCallback = mockRegistration.addEventListener.mock.calls[0][1];
    updateFoundCallback();

    // Trigger statechange
    const stateChangeCallback = mockRegistration.installing.addEventListener.mock.calls[0][1];
    stateChangeCallback();

    expect(document.body.appendChild).toHaveBeenCalled();

    // Check that update banner contains expected elements
    const appendedElement = document.body.appendChild.mock.calls[0][0];
    expect(appendedElement.id).toBe('sw-update-banner');
  });
});

describe('VAPID Key Conversion', () => {
  beforeEach(() => {
    global.atob = jest.fn((str) => {
      // Simple mock that returns the input
      return str;
    });
    global.Uint8Array = class extends Array {
      constructor(length) {
        super();
        this.length = length;
      }
    };
  });

  test('should convert base64 URL to Uint8Array in subscribeToPushNotifications', async () => {
    const mockRegistration = {
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://push.test.com/sub123'
        })
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.Notification = {
      permission: 'granted'
    };

    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ token: 'test-token' }))
    };

    await subscribeToPushNotifications();

    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationServerKey: expect.any(Object)
      })
    );
  });
});

describe('Browser Compatibility', () => {
  test('should handle missing serviceWorker API', async () => {
    delete global.navigator.serviceWorker;

    const result = await registerServiceWorker();

    expect(result).toBeNull();
  });

  test('should handle missing Notification API', async () => {
    delete global.Notification;

    const result = await requestNotificationPermission();

    expect(result).toBe(false);
  });

  test('should handle missing connection API in getNetworkInfo', () => {
    delete global.navigator.connection;

    const result = getNetworkInfo();

    expect(result.effectiveType).toBe('unknown');
    expect(result.downlink).toBeNull();
  });

  test('should handle missing storage API in getCacheSize', async () => {
    delete global.navigator.storage;

    const result = await getCacheSize();

    expect(result).toBeNull();
  });
});

describe('Edge Cases and Error Handling', () => {
  test('should handle null localStorage token', async () => {
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(null)
    };

    const mockRegistration = {
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://push.test.com/sub123'
        })
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.Notification = {
      permission: 'granted'
    };

    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const result = await subscribeToPushNotifications();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer '
        })
      })
    );
  });

  test('should handle malformed localStorage token', async () => {
    global.localStorage = {
      getItem: jest.fn().mockReturnValue('invalid-json')
    };

    const mockRegistration = {
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://push.test.com/sub123'
        })
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.Notification = {
      permission: 'granted'
    };

    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    // This should throw an error and be caught
    const result = await subscribeToPushNotifications();

    expect(result).toBeNull();
  });

  test('should handle network change event without connection API', () => {
    delete global.navigator.connection;
    delete global.navigator.mozConnection;
    delete global.navigator.webkitConnection;

    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    const callback = jest.fn();
    const cleanup = monitorNetwork(callback);

    expect(window.addEventListener).toHaveBeenCalledTimes(2); // online and offline only
    expect(typeof cleanup).toBe('function');
  });

  test('should handle empty VAPID key', async () => {
    const mockRegistration = {
      pushManager: {
        subscribe: jest.fn().mockResolvedValue({
          endpoint: 'https://push.test.com/sub123'
        })
      }
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    global.Notification = {
      permission: 'granted'
    };

    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(JSON.stringify({ token: 'test-token' }))
    };

    // Mock empty VAPID key
    global.importMetaEnv.VITE_VAPID_PUBLIC_KEY = '';

    await subscribeToPushNotifications();

    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled();
  });
});

describe('Module Default Export', () => {
  test('should export all functions in default object', async () => {
    const defaultExport = await import('./pwa.js');

    expect(defaultExport.default).toHaveProperty('registerServiceWorker');
    expect(defaultExport.default).toHaveProperty('unregisterServiceWorker');
    expect(defaultExport.default).toHaveProperty('requestNotificationPermission');
    expect(defaultExport.default).toHaveProperty('subscribeToPushNotifications');
    expect(defaultExport.default).toHaveProperty('unsubscribeFromPushNotifications');
    expect(defaultExport.default).toHaveProperty('isAppInstalled');
    expect(defaultExport.default).toHaveProperty('initInstallPrompt');
    expect(defaultExport.default).toHaveProperty('promptInstall');
    expect(defaultExport.default).toHaveProperty('syncWhenOnline');
    expect(defaultExport.default).toHaveProperty('getNetworkInfo');
    expect(defaultExport.default).toHaveProperty('monitorNetwork');
    expect(defaultExport.default).toHaveProperty('clearAllCaches');
    expect(defaultExport.default).toHaveProperty('getCacheSize');
  });
});
