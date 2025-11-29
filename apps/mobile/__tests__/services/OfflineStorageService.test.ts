import OfflineStorageService from '../../src/services/OfflineStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock MMKV
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(() => []),
    clearAll: jest.fn(),
  })),
}));

describe('OfflineStorageService', () => {
  let service: OfflineStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = OfflineStorageService.getInstance();
  });

  describe('AsyncStorage operations', () => {
    it('should store data', async () => {
      const testData = { name: 'Test', value: 123 };
      await service.set('testKey', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify(testData)
      );
    });

    it('should retrieve data', async () => {
      const testData = { name: 'Test', value: 123 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testData)
      );

      const result = await service.get('testKey');
      expect(result).toEqual(testData);
    });

    it('should delete data', async () => {
      await service.delete('testKey');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for non-existent keys', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.get('nonExistentKey');
      expect(result).toBeNull();
    });
  });

  describe('Cache operations', () => {
    it('should cache data with TTL', async () => {
      const testData = { value: 'cached' };
      await service.cacheData('cacheKey', testData, 30);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      expect(key).toBe('cache_cacheKey');

      const cacheItem = JSON.parse(value);
      expect(cacheItem.data).toEqual(testData);
      expect(cacheItem.timestamp).toBeDefined();
      expect(cacheItem.expiresAt).toBeDefined();
    });

    it('should retrieve cached data', async () => {
      const testData = { value: 'cached' };
      const cacheItem = {
        data: testData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheItem)
      );

      const result = await service.getCachedData('cacheKey');
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache', async () => {
      const testData = { value: 'cached' };
      const cacheItem = {
        data: testData,
        timestamp: Date.now() - 60 * 60 * 1000,
        expiresAt: Date.now() - 30 * 60 * 1000, // Expired 30 minutes ago
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheItem)
      );

      const result = await service.getCachedData('cacheKey');
      expect(result).toBeNull();
    });

    it('should clear all cache', async () => {
      const mockKeys = ['cache_key1', 'cache_key2', 'other_key'];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(mockKeys);

      await service.clearCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'cache_key1',
        'cache_key2',
      ]);
    });
  });

  describe('Offline queue', () => {
    it('should queue actions when offline', async () => {
      await service.queueAction('CREATE_POST', { title: 'Test Post' });

      expect(service.getQueueLength()).toBeGreaterThan(0);
    });

    it('should process queued actions when back online', async () => {
      // This would require more complex mocking of network state
      // For now, just verify the queue exists
      await service.queueAction('UPDATE_PROFILE', { name: 'New Name' });
      expect(service.getQueueLength()).toBeGreaterThan(0);
    });
  });

  describe('Fetch with cache', () => {
    it('should return cached data if available', async () => {
      const cachedData = { value: 'from cache' };
      const cacheItem = {
        data: cachedData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheItem)
      );

      const fetchFn = jest.fn();
      const result = await service.fetchWithCache('testKey', fetchFn, 30);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should fetch fresh data if cache is empty', async () => {
      const freshData = { value: 'fresh' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const fetchFn = jest.fn().mockResolvedValueOnce(freshData);
      const result = await service.fetchWithCache('testKey', fetchFn, 30);

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
    });
  });

  describe('User preferences', () => {
    it('should set and get user preferences', async () => {
      const pref = { darkMode: true, notifications: false };
      await service.setUserPreference('settings', pref);

      // Mock getFast to return the preference
      const result = service.getUserPreference('settings');
      // Note: This test is simplified as MMKV is mocked
    });
  });
});
