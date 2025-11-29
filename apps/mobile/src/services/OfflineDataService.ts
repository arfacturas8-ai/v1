/**
 * OFFLINE DATA SERVICE
 * Handles local data caching for offline functionality with comprehensive error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import * as FileSystem from 'expo-file-system';
import { CrashDetector } from '../utils/CrashDetector';

export interface CacheConfig {
  maxAge: number; // in milliseconds
  maxSize: number; // in bytes
  compression?: boolean;
  encryption?: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  expiry: number;
  size: number;
  version: string;
  metadata?: any;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'low' | 'medium' | 'high';
}

export interface OfflineStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  pendingSyncs: number;
  lastCleanup: number;
  expiredEntries: number;
}

class OfflineDataService {
  private static instance: OfflineDataService;
  private mmkv!: MMKV;
  private isInitialized = false;
  private cacheStats = {
    hits: 0,
    misses: 0,
    reads: 0,
    writes: 0,
  };
  private pendingSyncs: Map<string, SyncOperation> = new Map();
  private syncQueue: string[] = [];
  private maxRetries = 5;
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Progressive backoff

  private readonly CACHE_PREFIX = 'cache_';
  private readonly SYNC_PREFIX = 'sync_';
  private readonly METADATA_KEY = 'cache_metadata';
  private readonly STATS_KEY = 'cache_stats';
  
  static getInstance(): OfflineDataService {
    if (!OfflineDataService.instance) {
      OfflineDataService.instance = new OfflineDataService();
    }
    return OfflineDataService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize MMKV for fast caching
      this.mmkv = new MMKV({
        id: 'cryb_offline_cache',
        encryptionKey: 'your-encryption-key-here', // In production, use secure key storage
      });

      // Load existing sync operations
      await this.loadPendingSyncs();

      // Load cache stats
      await this.loadCacheStats();

      // Schedule periodic cleanup
      this.scheduleCleanup();

      this.isInitialized = true;
      console.log('[OfflineDataService] Initialized successfully');

    } catch (error) {
      console.error('[OfflineDataService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeOfflineData' },
        'high'
      );

      throw error;
    }
  }

  // Cache Management
  async set<T>(
    key: string,
    data: T,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      const {
        maxAge = 24 * 60 * 60 * 1000, // 24 hours default
        maxSize = 10 * 1024 * 1024, // 10MB default
      } = config;

      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;

      if (size > maxSize) {
        throw new Error(`Data size (${size}) exceeds maximum allowed size (${maxSize})`);
      }

      const entry: CacheEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + maxAge,
        size,
        version: '1.0.0',
        metadata: config,
      };

      // Store in MMKV for fast access
      this.mmkv.set(`${this.CACHE_PREFIX}${key}`, JSON.stringify(entry));

      // Update stats
      this.cacheStats.writes++;
      await this.updateCacheStats();

      console.log(`[OfflineDataService] Cached data for key: ${key}`);

    } catch (error) {
      console.error('[OfflineDataService] Set cache error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'setCacheData', key },
        'medium'
      );

      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      this.cacheStats.reads++;

      const cachedData = this.mmkv.getString(`${this.CACHE_PREFIX}${key}`);
      
      if (!cachedData) {
        this.cacheStats.misses++;
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cachedData);

      // Check if expired
      if (entry.expiry < Date.now()) {
        this.cacheStats.misses++;
        await this.delete(key);
        return null;
      }

      this.cacheStats.hits++;
      await this.updateCacheStats();

      return entry.data;

    } catch (error) {
      console.error('[OfflineDataService] Get cache error:', error);
      
      this.cacheStats.misses++;
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'getCacheData', key },
        'low'
      );

      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.mmkv.delete(`${this.CACHE_PREFIX}${key}`);
      console.log(`[OfflineDataService] Deleted cache for key: ${key}`);

    } catch (error) {
      console.error('[OfflineDataService] Delete cache error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = this.mmkv.getAllKeys();
      
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          this.mmkv.delete(key);
        }
      });

      // Reset stats
      this.cacheStats = { hits: 0, misses: 0, reads: 0, writes: 0 };
      await this.updateCacheStats();

      console.log('[OfflineDataService] Cache cleared');

    } catch (error) {
      console.error('[OfflineDataService] Clear cache error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.mmkv.contains(`${this.CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('[OfflineDataService] Has cache error:', error);
      return false;
    }
  }

  async size(): Promise<number> {
    try {
      const keys = this.mmkv.getAllKeys();
      let totalSize = 0;

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const data = this.mmkv.getString(key);
          if (data) {
            totalSize += new Blob([data]).size;
          }
        }
      });

      return totalSize;
    } catch (error) {
      console.error('[OfflineDataService] Size calculation error:', error);
      return 0;
    }
  }

  // Offline Sync Management
  async addSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const id = `${operation.type}_${operation.resource}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const syncOperation: SyncOperation = {
        ...operation,
        id,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Store sync operation
      this.pendingSyncs.set(id, syncOperation);
      this.syncQueue.push(id);

      // Persist to storage
      await this.savePendingSyncs();

      console.log(`[OfflineDataService] Added sync operation: ${id}`);
      return id;

    } catch (error) {
      console.error('[OfflineDataService] Add sync operation error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'addSyncOperation', type: operation.type },
        'medium'
      );

      throw error;
    }
  }

  async executePendingSyncs(): Promise<void> {
    try {
      console.log(`[OfflineDataService] Executing ${this.syncQueue.length} pending sync operations`);

      // Sort by priority and timestamp
      const sortedOps = Array.from(this.pendingSyncs.values())
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
        });

      for (const operation of sortedOps) {
        try {
          await this.executeSyncOperation(operation);
          
          // Remove successful operation
          this.pendingSyncs.delete(operation.id);
          this.syncQueue = this.syncQueue.filter(id => id !== operation.id);

        } catch (error) {
          console.error(`[OfflineDataService] Sync operation failed: ${operation.id}`, error);
          
          // Increment retry count
          operation.retryCount++;

          if (operation.retryCount >= this.maxRetries) {
            console.error(`[OfflineDataService] Max retries reached for operation: ${operation.id}`);
            
            // Remove failed operation after max retries
            this.pendingSyncs.delete(operation.id);
            this.syncQueue = this.syncQueue.filter(id => id !== operation.id);

            await CrashDetector.reportError(
              new Error(`Sync operation failed after ${this.maxRetries} retries`),
              { 
                operationId: operation.id,
                type: operation.type,
                resource: operation.resource 
              },
              'medium'
            );
          }
        }
      }

      // Save updated sync state
      await this.savePendingSyncs();

    } catch (error) {
      console.error('[OfflineDataService] Execute pending syncs error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'executePendingSyncs' },
        'medium'
      );
    }
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    try {
      // This would integrate with your API client
      // For now, we'll simulate the sync operation
      console.log(`[OfflineDataService] Executing sync: ${operation.type} ${operation.resource}`);

      const apiUrl = __DEV__ ? 'http://localhost:3002' : 'https://api.cryb.ai';
      const response = await fetch(`${apiUrl}/api/sync/${operation.resource}`, {
        method: operation.type === 'create' ? 'POST' : 
                operation.type === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers here
        },
        body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[OfflineDataService] Sync operation completed: ${operation.id}`);

    } catch (error) {
      // Add exponential backoff delay before retry
      const delay = this.retryDelays[Math.min(operation.retryCount, this.retryDelays.length - 1)];
      await new Promise(resolve => setTimeout(resolve, delay));
      
      throw error;
    }
  }

  async getPendingSyncs(): Promise<SyncOperation[]> {
    return Array.from(this.pendingSyncs.values());
  }

  async clearPendingSyncs(): Promise<void> {
    try {
      this.pendingSyncs.clear();
      this.syncQueue = [];
      await AsyncStorage.removeItem(`${this.SYNC_PREFIX}operations`);
      
      console.log('[OfflineDataService] Cleared all pending sync operations');

    } catch (error) {
      console.error('[OfflineDataService] Clear pending syncs error:', error);
    }
  }

  // File Caching for Media
  async cacheFile(url: string, filename?: string): Promise<string | null> {
    try {
      const cacheDir = `${FileSystem.documentDirectory}cache/`;
      
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      const finalFilename = filename || url.split('/').pop() || `file_${Date.now()}`;
      const localPath = `${cacheDir}${finalFilename}`;

      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }

      // Download and cache file
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      
      if (downloadResult.status === 200) {
        console.log(`[OfflineDataService] Cached file: ${finalFilename}`);
        return localPath;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

    } catch (error) {
      console.error('[OfflineDataService] Cache file error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'cacheFile', url },
        'low'
      );

      return null;
    }
  }

  async getCachedFile(filename: string): Promise<string | null> {
    try {
      const localPath = `${FileSystem.documentDirectory}cache/${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      
      return fileInfo.exists ? localPath : null;
    } catch (error) {
      console.error('[OfflineDataService] Get cached file error:', error);
      return null;
    }
  }

  async clearFileCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.documentDirectory}cache/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        console.log('[OfflineDataService] File cache cleared');
      }
    } catch (error) {
      console.error('[OfflineDataService] Clear file cache error:', error);
    }
  }

  // Cleanup and Maintenance
  async cleanup(): Promise<void> {
    try {
      console.log('[OfflineDataService] Starting cache cleanup');
      
      const keys = this.mmkv.getAllKeys();
      let expiredCount = 0;
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          try {
            const data = this.mmkv.getString(key);
            if (data) {
              const entry: CacheEntry = JSON.parse(data);
              if (entry.expiry < now) {
                this.mmkv.delete(key);
                expiredCount++;
              }
            }
          } catch (error) {
            // Remove corrupted entries
            this.mmkv.delete(key);
            expiredCount++;
          }
        }
      });

      // Update metadata
      const metadata = {
        lastCleanup: now,
        expiredEntries: expiredCount,
      };

      this.mmkv.set(this.METADATA_KEY, JSON.stringify(metadata));

      console.log(`[OfflineDataService] Cleanup completed. Removed ${expiredCount} expired entries`);

    } catch (error) {
      console.error('[OfflineDataService] Cleanup error:', error);
    }
  }

  private scheduleCleanup(): void {
    // Run cleanup every 6 hours
    setInterval(() => {
      this.cleanup();
    }, 6 * 60 * 60 * 1000);
  }

  private async loadPendingSyncs(): Promise<void> {
    try {
      const syncData = await AsyncStorage.getItem(`${this.SYNC_PREFIX}operations`);
      if (syncData) {
        const operations: SyncOperation[] = JSON.parse(syncData);
        
        this.pendingSyncs.clear();
        this.syncQueue = [];

        operations.forEach(op => {
          this.pendingSyncs.set(op.id, op);
          this.syncQueue.push(op.id);
        });

        console.log(`[OfflineDataService] Loaded ${operations.length} pending sync operations`);
      }
    } catch (error) {
      console.error('[OfflineDataService] Load pending syncs error:', error);
    }
  }

  private async savePendingSyncs(): Promise<void> {
    try {
      const operations = Array.from(this.pendingSyncs.values());
      await AsyncStorage.setItem(`${this.SYNC_PREFIX}operations`, JSON.stringify(operations));
    } catch (error) {
      console.error('[OfflineDataService] Save pending syncs error:', error);
    }
  }

  private async loadCacheStats(): Promise<void> {
    try {
      const statsData = this.mmkv.getString(this.STATS_KEY);
      if (statsData) {
        this.cacheStats = JSON.parse(statsData);
      }
    } catch (error) {
      console.error('[OfflineDataService] Load cache stats error:', error);
    }
  }

  private async updateCacheStats(): Promise<void> {
    try {
      this.mmkv.set(this.STATS_KEY, JSON.stringify(this.cacheStats));
    } catch (error) {
      console.error('[OfflineDataService] Update cache stats error:', error);
    }
  }

  // Public Stats and Info
  async getStats(): Promise<OfflineStats> {
    try {
      const keys = this.mmkv.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      const totalSize = await this.size();
      const hitRate = this.cacheStats.reads > 0 ? this.cacheStats.hits / this.cacheStats.reads : 0;
      
      const metadata = this.mmkv.getString(this.METADATA_KEY);
      const { lastCleanup = 0, expiredEntries = 0 } = metadata ? JSON.parse(metadata) : {};

      return {
        totalEntries: cacheKeys.length,
        totalSize,
        hitRate,
        pendingSyncs: this.pendingSyncs.size,
        lastCleanup,
        expiredEntries,
      };
    } catch (error) {
      console.error('[OfflineDataService] Get stats error:', error);
      
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        pendingSyncs: 0,
        lastCleanup: 0,
        expiredEntries: 0,
      };
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  async destroy(): Promise<void> {
    try {
      await this.clear();
      await this.clearFileCache();
      await this.clearPendingSyncs();
      
      this.isInitialized = false;
      
      console.log('[OfflineDataService] Service destroyed');

    } catch (error) {
      console.error('[OfflineDataService] Destroy error:', error);
    }
  }
}

export const offlineDataService = OfflineDataService.getInstance();