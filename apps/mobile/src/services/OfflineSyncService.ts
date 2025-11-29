/**
 * OFFLINE SYNC SERVICE
 * Advanced offline support with intelligent data synchronization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { MMKV } from 'react-native-mmkv';
import { CrashDetector } from '../utils/CrashDetector';
import apiService from './RealApiService';

// Fast local storage for frequently accessed data
const storage = new MMKV({
  id: 'cryb-cache',
  encryptionKey: 'cryb-offline-key',
});

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface OfflineData {
  posts: Record<string, any>;
  comments: Record<string, any>;
  communities: Record<string, any>;
  users: Record<string, any>;
  messages: Record<string, any>;
  channels: Record<string, any>;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
}

class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isOnline: boolean = false;
  private syncQueue: SyncOperation[] = [];
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryInterval: NodeJS.Timeout | null = null;

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Load sync queue from storage
      await this.loadSyncQueue();
      
      // Set up network monitoring
      NetInfo.addEventListener(this.handleConnectivityChange.bind(this));
      
      // Check initial connectivity
      const netInfoState = await NetInfo.fetch();
      this.handleConnectivityChange(netInfoState);
      
      // Set up periodic sync
      this.setupPeriodicSync();
      
      console.log('[OfflineSyncService] Initialized successfully');
    } catch (error) {
      console.error('[OfflineSyncService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeOfflineSync' },
        'medium'
      );
    }
  }

  private handleConnectivityChange(state: NetInfoState): void {
    try {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true && state.isInternetReachable === true;
      
      console.log('[OfflineSyncService] Connectivity changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        wasOnline,
        isOnline: this.isOnline,
      });

      if (this.isOnline && !wasOnline) {
        // Coming back online
        this.onBackOnline();
      } else if (!this.isOnline && wasOnline) {
        // Going offline
        this.onGoingOffline();
      }
    } catch (error) {
      console.error('[OfflineSyncService] Handle connectivity change error:', error);
    }
  }

  private async onBackOnline(): Promise<void> {
    try {
      console.log('[OfflineSyncService] Back online - starting sync');
      
      // Process pending sync operations
      await this.processSyncQueue();
      
      // Sync critical data
      await this.syncCriticalData();
      
    } catch (error) {
      console.error('[OfflineSyncService] On back online error:', error);
    }
  }

  private onGoingOffline(): void {
    try {
      console.log('[OfflineSyncService] Going offline - preparing offline mode');
      
      // Stop sync operations
      this.stopSync();
      
      // Cache current user data
      this.cacheUserSession();
      
    } catch (error) {
      console.error('[OfflineSyncService] On going offline error:', error);
    }
  }

  private setupPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, 30000);

    // Retry failed operations every 2 minutes
    this.retryInterval = setInterval(() => {
      if (this.isOnline) {
        this.retryFailedOperations();
      }
    }, 120000);
  }

  // Data caching methods

  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 24 * 60 * 60 * 1000, // 24 hours default
      };
      
      storage.set(key, JSON.stringify(cacheEntry));
      console.log('[OfflineSyncService] Data cached:', key);
    } catch (error) {
      console.error('[OfflineSyncService] Cache data error:', error);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = storage.getString(key);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      const now = Date.now();
      
      // Check if data has expired
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        storage.delete(key);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.error('[OfflineSyncService] Get cached data error:', error);
      return null;
    }
  }

  async removeCachedData(key: string): Promise<void> {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('[OfflineSyncService] Remove cached data error:', error);
    }
  }

  // Offline operations queue

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const syncOp: SyncOperation = {
        ...operation,
        id: `${operation.type}_${operation.resource}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      this.syncQueue.push(syncOp);
      await this.saveSyncQueue();
      
      console.log('[OfflineSyncService] Operation queued:', syncOp.id);
      
      // Try to process immediately if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('[OfflineSyncService] Queue operation error:', error);
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      console.log('[OfflineSyncService] Processing sync queue:', this.syncQueue.length, 'operations');
      
      // Sort by priority and timestamp
      const sortedQueue = [...this.syncQueue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
      
      const batch = sortedQueue.slice(0, 10); // Process up to 10 operations at once
      const results = await Promise.allSettled(
        batch.map(operation => this.processOperation(operation))
      );
      
      // Remove successful operations
      let processedCount = 0;
      results.forEach((result, index) => {
        const operation = batch[index];
        const queueIndex = this.syncQueue.findIndex(op => op.id === operation.id);
        
        if (result.status === 'fulfilled' && result.value) {
          // Success - remove from queue
          if (queueIndex !== -1) {
            this.syncQueue.splice(queueIndex, 1);
            processedCount++;
          }
        } else {
          // Failed - increment retry count
          if (queueIndex !== -1) {
            this.syncQueue[queueIndex].retryCount++;
            
            // Remove operations that have failed too many times
            if (this.syncQueue[queueIndex].retryCount >= 5) {
              console.warn('[OfflineSyncService] Operation failed too many times, removing:', operation.id);
              this.syncQueue.splice(queueIndex, 1);
            }
          }
        }
      });
      
      await this.saveSyncQueue();
      this.lastSyncTime = Date.now();
      
      console.log('[OfflineSyncService] Sync batch completed:', processedCount, 'successful');
      
    } catch (error) {
      console.error('[OfflineSyncService] Process sync queue error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOperation(operation: SyncOperation): Promise<boolean> {
    try {
      console.log('[OfflineSyncService] Processing operation:', operation.id, operation.type, operation.resource);
      
      switch (operation.resource) {
        case 'post':
          return await this.syncPost(operation);
        case 'comment':
          return await this.syncComment(operation);
        case 'vote':
          return await this.syncVote(operation);
        case 'message':
          return await this.syncMessage(operation);
        case 'user_profile':
          return await this.syncUserProfile(operation);
        default:
          console.warn('[OfflineSyncService] Unknown resource type:', operation.resource);
          return false;
      }
    } catch (error) {
      console.error('[OfflineSyncService] Process operation error:', error);
      return false;
    }
  }

  private async syncPost(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'CREATE':
          const response = await apiService.createPost(operation.data);
          if (response.success) {
            // Update local cache with server response
            await this.cacheData(`post_${response.data.id}`, response.data);
            return true;
          }
          break;
        
        case 'UPDATE':
          const updateResponse = await apiService.updatePost(operation.data.id, operation.data);
          return updateResponse.success;
        
        case 'DELETE':
          const deleteResponse = await apiService.deletePost(operation.data.id);
          if (deleteResponse.success) {
            await this.removeCachedData(`post_${operation.data.id}`);
            return true;
          }
          break;
      }
      return false;
    } catch (error) {
      console.error('[OfflineSyncService] Sync post error:', error);
      return false;
    }
  }

  private async syncComment(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'CREATE':
          const response = await apiService.createComment(operation.data.postId, operation.data.content, operation.data.parentId);
          if (response.success) {
            await this.cacheData(`comment_${response.data.id}`, response.data);
            return true;
          }
          break;
        
        case 'UPDATE':
          const updateResponse = await apiService.updateComment(operation.data.id, operation.data.content);
          return updateResponse.success;
        
        case 'DELETE':
          const deleteResponse = await apiService.deleteComment(operation.data.id);
          if (deleteResponse.success) {
            await this.removeCachedData(`comment_${operation.data.id}`);
            return true;
          }
          break;
      }
      return false;
    } catch (error) {
      console.error('[OfflineSyncService] Sync comment error:', error);
      return false;
    }
  }

  private async syncVote(operation: SyncOperation): Promise<boolean> {
    try {
      if (operation.data.type === 'post') {
        const response = await apiService.votePost(operation.data.id, operation.data.voteType);
        return response.success;
      } else if (operation.data.type === 'comment') {
        const response = await apiService.voteComment(operation.data.id, operation.data.voteType);
        return response.success;
      }
      return false;
    } catch (error) {
      console.error('[OfflineSyncService] Sync vote error:', error);
      return false;
    }
  }

  private async syncMessage(operation: SyncOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case 'CREATE':
          const response = await apiService.sendMessage(operation.data.channelId, operation.data.content, operation.data.type);
          return response.success;
        
        case 'UPDATE':
          // Message updates not implemented in API yet
          return false;
        
        case 'DELETE':
          const deleteResponse = await apiService.deleteMessage(operation.data.id);
          return deleteResponse.success;
      }
      return false;
    } catch (error) {
      console.error('[OfflineSyncService] Sync message error:', error);
      return false;
    }
  }

  private async syncUserProfile(operation: SyncOperation): Promise<boolean> {
    try {
      const response = await apiService.updateProfile(operation.data);
      return response.success;
    } catch (error) {
      console.error('[OfflineSyncService] Sync user profile error:', error);
      return false;
    }
  }

  // Critical data synchronization

  private async syncCriticalData(): Promise<void> {
    try {
      console.log('[OfflineSyncService] Syncing critical data');
      
      // Sync user notifications
      await this.syncNotifications();
      
      // Sync recent messages
      await this.syncRecentMessages();
      
      // Sync user profile
      await this.syncUserProfileData();
      
    } catch (error) {
      console.error('[OfflineSyncService] Sync critical data error:', error);
    }
  }

  private async syncNotifications(): Promise<void> {
    try {
      const response = await apiService.getNotifications(1, 50);
      if (response.success) {
        await this.cacheData('notifications', response.data, 60 * 60 * 1000); // 1 hour
      }
    } catch (error) {
      console.error('[OfflineSyncService] Sync notifications error:', error);
    }
  }

  private async syncRecentMessages(): Promise<void> {
    try {
      // This would sync recent messages from active channels
      // Implementation depends on your specific message API structure
      console.log('[OfflineSyncService] Syncing recent messages');
    } catch (error) {
      console.error('[OfflineSyncService] Sync recent messages error:', error);
    }
  }

  private async syncUserProfileData(): Promise<void> {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        await this.cacheData('current_user', response.data, 60 * 60 * 1000); // 1 hour
      }
    } catch (error) {
      console.error('[OfflineSyncService] Sync user profile data error:', error);
    }
  }

  // Storage management

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('@cryb_sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        console.log('[OfflineSyncService] Loaded sync queue:', this.syncQueue.length, 'operations');
      }
    } catch (error) {
      console.error('[OfflineSyncService] Load sync queue error:', error);
      this.syncQueue = [];
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('@cryb_sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('[OfflineSyncService] Save sync queue error:', error);
    }
  }

  private async cacheUserSession(): Promise<void> {
    try {
      // Cache essential user data for offline access
      const user = await this.getCachedData('current_user');
      if (user) {
        await AsyncStorage.setItem('@cryb_offline_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('[OfflineSyncService] Cache user session error:', error);
    }
  }

  private async retryFailedOperations(): Promise<void> {
    try {
      const failedOps = this.syncQueue.filter(op => op.retryCount > 0 && op.retryCount < 3);
      if (failedOps.length > 0) {
        console.log('[OfflineSyncService] Retrying failed operations:', failedOps.length);
        // Process a few failed operations
        for (const op of failedOps.slice(0, 3)) {
          await this.processOperation(op);
        }
      }
    } catch (error) {
      console.error('[OfflineSyncService] Retry failed operations error:', error);
    }
  }

  // Public methods

  async isDataCached(key: string): Promise<boolean> {
    const data = await this.getCachedData(key);
    return data !== null;
  }

  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: this.syncQueue.length,
      failedOperations: this.syncQueue.filter(op => op.retryCount > 0).length,
      syncInProgress: this.syncInProgress,
    };
  }

  async clearCache(): Promise<void> {
    try {
      storage.clearAll();
      console.log('[OfflineSyncService] Cache cleared');
    } catch (error) {
      console.error('[OfflineSyncService] Clear cache error:', error);
    }
  }

  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
      await this.syncCriticalData();
    }
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  cleanup(): void {
    this.stopSync();
    this.syncQueue = [];
    console.log('[OfflineSyncService] Cleaned up');
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();