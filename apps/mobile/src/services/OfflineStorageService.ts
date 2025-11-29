import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private isOnline: boolean = true;
  private syncQueue: QueuedAction[] = [];
  private readonly SYNC_QUEUE_KEY = 'offline_sync_queue';
  private readonly CACHE_PREFIX = 'cache_';

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  private async initialize() {
    // Listen to network changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Back online, syncing queued actions...');
        this.syncQueuedActions();
      }
    });

    // Load sync queue from storage
    await this.loadSyncQueue();
  }

  // MMKV Storage (Fast, synchronous storage for small data)
  setFast(key: string, value: string | number | boolean): void {
    try {
      if (typeof value === 'string') {
        storage.set(key, value);
      } else if (typeof value === 'number') {
        storage.set(key, value);
      } else if (typeof value === 'boolean') {
        storage.set(key, value);
      }
    } catch (error) {
      console.error('Error setting fast storage:', error);
    }
  }

  getFast(key: string): string | number | boolean | undefined {
    try {
      return storage.getString(key) || storage.getNumber(key) || storage.getBoolean(key);
    } catch (error) {
      console.error('Error getting fast storage:', error);
      return undefined;
    }
  }

  deleteFast(key: string): void {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('Error deleting fast storage:', error);
    }
  }

  // AsyncStorage (For larger data)
  async set(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting storage:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting storage:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting storage:', error);
    }
  }

  // Cache with expiration
  async cacheData<T>(key: string, data: T, ttlMinutes?: number): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: ttlMinutes ? Date.now() + ttlMinutes * 60 * 1000 : undefined,
    };
    await this.set(this.CACHE_PREFIX + key, cacheItem);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    const cacheItem = await this.get<CacheItem<T>>(this.CACHE_PREFIX + key);
    if (!cacheItem) {
      return null;
    }

    // Check if expired
    if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
      await this.delete(this.CACHE_PREFIX + key);
      return null;
    }

    return cacheItem.data;
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Offline queue management
  async queueAction(
    type: string,
    payload: any,
    maxRetries: number = 3
  ): Promise<void> {
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    this.syncQueue.push(action);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncQueuedActions();
    }
  }

  private async loadSyncQueue(): Promise<void> {
    const queue = await this.get<QueuedAction[]>(this.SYNC_QUEUE_KEY);
    if (queue) {
      this.syncQueue = queue;
    }
  }

  private async saveSyncQueue(): Promise<void> {
    await this.set(this.SYNC_QUEUE_KEY, this.syncQueue);
  }

  private async syncQueuedActions(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const actionsToSync = [...this.syncQueue];
    for (const action of actionsToSync) {
      try {
        // Process action based on type
        await this.processAction(action);

        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter((a) => a.id !== action.id);
      } catch (error) {
        console.error('Error syncing action:', error);

        // Increment retry count
        const actionIndex = this.syncQueue.findIndex((a) => a.id === action.id);
        if (actionIndex !== -1) {
          this.syncQueue[actionIndex].retryCount++;

          // Remove if max retries exceeded
          if (this.syncQueue[actionIndex].retryCount >= action.maxRetries) {
            console.log(`Max retries exceeded for action ${action.id}, removing from queue`);
            this.syncQueue.splice(actionIndex, 1);
          }
        }
      }
    }

    await this.saveSyncQueue();
  }

  private async processAction(action: QueuedAction): Promise<void> {
    // This should be implemented based on your API structure
    // For now, just a placeholder
    console.log('Processing action:', action.type, action.payload);
  }

  // Offline-first data patterns
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMinutes: number = 30
  ): Promise<T> {
    // Try cache first
    const cached = await this.getCachedData<T>(key);
    if (cached) {
      // Return cached data and optionally refresh in background
      if (this.isOnline) {
        fetchFn()
          .then((fresh) => this.cacheData(key, fresh, ttlMinutes))
          .catch((error) => console.error('Background fetch failed:', error));
      }
      return cached;
    }

    // Fetch fresh data
    if (this.isOnline) {
      const fresh = await fetchFn();
      await this.cacheData(key, fresh, ttlMinutes);
      return fresh;
    }

    // Offline and no cache
    throw new Error('No cached data available and device is offline');
  }

  // User preferences
  async setUserPreference(key: string, value: any): Promise<void> {
    this.setFast(`pref_${key}`, JSON.stringify(value));
  }

  getUserPreference<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.getFast(`pref_${key}`);
    if (value === undefined) {
      return defaultValue;
    }
    try {
      return JSON.parse(value as string);
    } catch {
      return value as T;
    }
  }

  // Session data
  async setSessionData(key: string, value: any): Promise<void> {
    this.setFast(`session_${key}`, JSON.stringify(value));
  }

  getSessionData<T>(key: string): T | undefined {
    const value = this.getFast(`session_${key}`);
    if (value === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(value as string);
    } catch {
      return value as T;
    }
  }

  clearSessionData(): void {
    const keys = storage.getAllKeys();
    keys.forEach((key) => {
      if (key.startsWith('session_')) {
        storage.delete(key);
      }
    });
  }

  // Utility methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  getQueueLength(): number {
    return this.syncQueue.length;
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
    storage.clearAll();
  }
}

export default OfflineStorageService.getInstance();
