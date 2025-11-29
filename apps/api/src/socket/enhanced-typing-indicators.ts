import { Server } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { AdvancedRedisPubSub } from './advanced-redis-pubsub';

/**
 * ENHANCED TYPING INDICATORS SYSTEM
 * 
 * Features:
 * ✅ Redis-backed state for horizontal scaling
 * ✅ Intelligent debouncing to reduce bandwidth
 * ✅ Group typing indicators (multiple users)
 * ✅ Smart cleanup with TTL and garbage collection
 * ✅ Typing rate limiting to prevent spam
 * ✅ Channel-specific typing state management
 * ✅ Typing analytics and metrics
 * ✅ Auto-stop on message send
 * ✅ Graceful handling of disconnections
 * ✅ Memory-efficient with LRU cache
 */

export interface TypingUser {
  userId: string;
  username: string;
  displayName: string;
  startTime: number;
  lastUpdate: number;
  deviceType: 'web' | 'mobile' | 'desktop';
  sessionId: string;
}

export interface ChannelTypingState {
  channelId: string;
  users: Map<string, TypingUser>;
  lastUpdate: number;
  timeout?: NodeJS.Timeout;
}

export interface TypingMetrics {
  totalTypingEvents: number;
  typingUsersCount: number;
  channelsWithTyping: number;
  avgTypingDuration: number;
  peakConcurrentTypers: number;
  debouncedEvents: number;
  rateLimitedEvents: number;
  lastCleanup: Date;
}

export class EnhancedTypingIndicators {
  private io: Server;
  private redis: Redis;
  private pubsub: AdvancedRedisPubSub;
  private fastify: FastifyInstance;
  
  // Local state management
  private channelStates = new Map<string, ChannelTypingState>();
  private userChannels = new Map<string, Set<string>>(); // userId -> channelIds where typing
  private userDebounceTimers = new Map<string, NodeJS.Timeout>();
  
  // Configuration
  private readonly TYPING_TIMEOUT = 8000; // 8 seconds auto-stop
  private readonly DEBOUNCE_INTERVAL = 2000; // 2 seconds debounce
  private readonly REDIS_TTL = 10; // 10 seconds Redis TTL
  private readonly MAX_TYPING_USERS = 10; // Max users shown as typing
  private readonly RATE_LIMIT_WINDOW = 3000; // 3 seconds rate limit
  
  // Rate limiting
  private userRateLimit = new Map<string, number>();
  
  // Metrics
  private metrics: TypingMetrics = {
    totalTypingEvents: 0,
    typingUsersCount: 0,
    channelsWithTyping: 0,
    avgTypingDuration: 0,
    peakConcurrentTypers: 0,
    debouncedEvents: 0,
    rateLimitedEvents: 0,
    lastCleanup: new Date()
  };
  
  // LRU cache for user info
  private userInfoCache = new Map<string, { username: string; displayName: string }>();
  private readonly MAX_CACHE_SIZE = 10000;
  
  constructor(io: Server, redis: Redis, pubsub: AdvancedRedisPubSub, fastify: FastifyInstance) {
    this.io = io;
    this.redis = redis;
    this.pubsub = pubsub;
    this.fastify = fastify;
    
    this.initialize();
  }
  
  /**
   * Initialize typing indicators system
   */
  private async initialize(): Promise<void> {
    try {
      // Subscribe to cross-server typing events
      await this.pubsub.subscribe('typing:start', this.handleRemoteTypingStart.bind(this));
      await this.pubsub.subscribe('typing:stop', this.handleRemoteTypingStop.bind(this));
      await this.pubsub.subscribe('typing:cleanup', this.handleRemoteCleanup.bind(this));
      
      // Start background tasks
      this.startCleanupTasks();
      this.startMetricsCollection();
      
      this.fastify.log.info('✅ Enhanced Typing Indicators initialized');
      this.fastify.log.info('🔧 Configuration:');
      this.fastify.log.info(`   - Timeout: ${this.TYPING_TIMEOUT}ms`);
      this.fastify.log.info(`   - Debounce: ${this.DEBOUNCE_INTERVAL}ms`);
      this.fastify.log.info(`   - Redis TTL: ${this.REDIS_TTL}s`);
      this.fastify.log.info(`   - Max users: ${this.MAX_TYPING_USERS}`);
      this.fastify.log.info(`   - Rate limit: ${this.RATE_LIMIT_WINDOW}ms`);
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to initialize Enhanced Typing Indicators:', error);
      throw error;
    }
  }
  
  /**
   * Handle typing start event
   */
  async startTyping(userId: string, channelId: string, userInfo: {
    username: string;
    displayName: string;
    deviceType: 'web' | 'mobile' | 'desktop';
    sessionId: string;
  }): Promise<boolean> {
    
    try {
      // Rate limiting check
      if (!this.checkRateLimit(userId)) {
        this.metrics.rateLimitedEvents++;
        return false;
      }
      
      // Cache user info
      this.cacheUserInfo(userId, userInfo);
      
      // Check if user is already typing in this channel
      const channelState = this.getOrCreateChannelState(channelId);
      const existingUser = channelState.users.get(userId);
      
      if (existingUser) {
        // Update existing typing state
        existingUser.lastUpdate = Date.now();
        await this.updateRedisTypingState(channelId, userId, existingUser);
        return true; // Don't broadcast duplicate
      }
      
      // Check channel typing limit
      if (channelState.users.size >= this.MAX_TYPING_USERS) {
        this.fastify.log.debug(`Channel ${channelId} typing limit reached`);
        return false;
      }
      
      // Create new typing user
      const typingUser: TypingUser = {
        userId,
        username: userInfo.username,
        displayName: userInfo.displayName,
        startTime: Date.now(),
        lastUpdate: Date.now(),
        deviceType: userInfo.deviceType,
        sessionId: userInfo.sessionId
      };
      
      // Add to local state
      channelState.users.set(userId, typingUser);
      channelState.lastUpdate = Date.now();
      
      // Track user channels
      if (!this.userChannels.has(userId)) {
        this.userChannels.set(userId, new Set());
      }
      this.userChannels.get(userId)!.add(channelId);
      
      // Store in Redis for cross-server sync
      await this.updateRedisTypingState(channelId, userId, typingUser);
      
      // Debounced broadcast
      this.debouncedBroadcast(channelId, userId);
      
      // Set auto-stop timeout
      this.setTypingTimeout(channelId, userId);
      
      // Update metrics
      this.metrics.totalTypingEvents++;
      this.updateConcurrentMetrics();
      
      return true;
      
    } catch (error) {
      this.fastify.log.error('Error in startTyping:', error);
      return false;
    }
  }
  
  /**
   * Handle typing stop event
   */
  async stopTyping(userId: string, channelId: string): Promise<void> {
    try {
      const channelState = this.channelStates.get(channelId);
      if (!channelState || !channelState.users.has(userId)) {
        return; // User wasn't typing
      }
      
      // Calculate typing duration for metrics
      const typingUser = channelState.users.get(userId)!;
      const duration = Date.now() - typingUser.startTime;
      this.updateAverageTypingDuration(duration);
      
      // Remove from local state
      channelState.users.delete(userId);
      channelState.lastUpdate = Date.now();
      
      // Update user channels tracking
      const userChannels = this.userChannels.get(userId);
      if (userChannels) {
        userChannels.delete(channelId);
        if (userChannels.size === 0) {
          this.userChannels.delete(userId);
        }
      }
      
      // Clear timeout
      this.clearTypingTimeout(channelId, userId);
      
      // Remove from Redis
      await this.removeRedisTypingState(channelId, userId);
      
      // Broadcast stop event with debouncing
      this.debouncedBroadcast(channelId, userId, true);
      
      // Clean up empty channel state
      if (channelState.users.size === 0) {
        this.channelStates.delete(channelId);
      }
      
      // Update metrics
      this.updateConcurrentMetrics();
      
    } catch (error) {
      this.fastify.log.error('Error in stopTyping:', error);
    }
  }
  
  /**
   * Handle user disconnection
   */
  async handleUserDisconnect(userId: string, sessionId: string): Promise<void> {
    try {
      const userChannels = this.userChannels.get(userId);
      if (!userChannels) return;
      
      // Stop typing in all channels for this session
      for (const channelId of userChannels) {
        const channelState = this.channelStates.get(channelId);
        if (channelState) {
          const typingUser = channelState.users.get(userId);
          if (typingUser && typingUser.sessionId === sessionId) {
            await this.stopTyping(userId, channelId);
          }
        }
      }
      
      // Clear any debounce timers
      const timer = this.userDebounceTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        this.userDebounceTimers.delete(userId);
      }
      
      this.fastify.log.debug(`Cleaned up typing state for disconnected user: ${userId}`);
      
    } catch (error) {
      this.fastify.log.error('Error handling user disconnect:', error);
    }
  }
  
  /**
   * Handle message send (auto-stop typing)
   */
  async handleMessageSent(userId: string, channelId: string): Promise<void> {
    try {
      await this.stopTyping(userId, channelId);
      this.fastify.log.debug(`Auto-stopped typing for user ${userId} in channel ${channelId} due to message send`);
    } catch (error) {
      this.fastify.log.error('Error handling message sent:', error);
    }
  }
  
  /**
   * Get current typing users for a channel
   */
  getChannelTypingUsers(channelId: string): TypingUser[] {
    const channelState = this.channelStates.get(channelId);
    if (!channelState) return [];
    
    return Array.from(channelState.users.values())
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, this.MAX_TYPING_USERS);
  }
  
  /**
   * Get typing users count for a channel
   */
  getChannelTypingCount(channelId: string): number {
    const channelState = this.channelStates.get(channelId);
    return channelState ? channelState.users.size : 0;
  }
  
  /**
   * Private helper methods
   */
  
  private getOrCreateChannelState(channelId: string): ChannelTypingState {
    if (!this.channelStates.has(channelId)) {
      this.channelStates.set(channelId, {
        channelId,
        users: new Map(),
        lastUpdate: Date.now()
      });
    }
    return this.channelStates.get(channelId)!;
  }
  
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const lastEvent = this.userRateLimit.get(userId) || 0;
    
    if (now - lastEvent < this.RATE_LIMIT_WINDOW) {
      return false;
    }
    
    this.userRateLimit.set(userId, now);
    return true;
  }
  
  private cacheUserInfo(userId: string, userInfo: { username: string; displayName: string }): void {
    // LRU cache management
    if (this.userInfoCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.userInfoCache.keys().next().value;
      this.userInfoCache.delete(firstKey);
    }
    
    this.userInfoCache.set(userId, {
      username: userInfo.username,
      displayName: userInfo.displayName
    });
  }
  
  private debouncedBroadcast(channelId: string, userId: string, isStop: boolean = false): void {
    const debounceKey = `${channelId}-${userId}`;
    
    // Clear existing timer
    const existingTimer = this.userDebounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.metrics.debouncedEvents++;
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.broadcastTypingUpdate(channelId, isStop);
      this.userDebounceTimers.delete(debounceKey);
    }, this.DEBOUNCE_INTERVAL);
    
    this.userDebounceTimers.set(debounceKey, timer);
  }
  
  private async broadcastTypingUpdate(channelId: string, isStop: boolean = false): Promise<void> {
    try {
      const typingUsers = this.getChannelTypingUsers(channelId);
      
      // Local broadcast
      this.io.to(`channel:${channelId}`).emit('typing:update', {
        channel_id: channelId,
        typing_users: typingUsers.map(user => ({
          id: user.userId,
          username: user.username,
          display_name: user.displayName,
          device_type: user.deviceType,
          start_time: user.startTime
        })),
        count: typingUsers.length,
        timestamp: Date.now()
      });
      
      // Cross-server broadcast
      await this.pubsub.publish('typing:update', {
        channelId,
        typingUsers: typingUsers,
        isStop,
        serverId: process.env.SERVER_ID || 'unknown'
      }, {
        priority: 'low', // Typing updates are low priority
        compress: false, // Small payload, no compression needed
        dedupe: true
      });
      
    } catch (error) {
      this.fastify.log.error('Error broadcasting typing update:', error);
    }
  }
  
  private setTypingTimeout(channelId: string, userId: string): void {
    const timeoutKey = `${channelId}-${userId}`;
    
    const timeout = setTimeout(async () => {
      await this.stopTyping(userId, channelId);
      this.fastify.log.debug(`Auto-stopped typing timeout for user ${userId} in channel ${channelId}`);
    }, this.TYPING_TIMEOUT);
    
    const channelState = this.channelStates.get(channelId);
    if (channelState) {
      channelState.timeout = timeout;
    }
  }
  
  private clearTypingTimeout(channelId: string, userId: string): void {
    const channelState = this.channelStates.get(channelId);
    if (channelState?.timeout) {
      clearTimeout(channelState.timeout);
      channelState.timeout = undefined;
    }
  }
  
  /**
   * Redis operations
   */
  
  private async updateRedisTypingState(channelId: string, userId: string, typingUser: TypingUser): Promise<void> {
    try {
      const key = `typing:${channelId}:${userId}`;
      const data = JSON.stringify(typingUser);
      
      await this.redis.setex(key, this.REDIS_TTL, data);
      
      // Also update channel typing set
      await this.redis.sadd(`typing_channels:${channelId}`, userId);
      await this.redis.expire(`typing_channels:${channelId}`, this.REDIS_TTL);
      
    } catch (error) {
      this.fastify.log.error('Error updating Redis typing state:', error);
    }
  }
  
  private async removeRedisTypingState(channelId: string, userId: string): Promise<void> {
    try {
      const key = `typing:${channelId}:${userId}`;
      
      await this.redis.del(key);
      await this.redis.srem(`typing_channels:${channelId}`, userId);
      
    } catch (error) {
      this.fastify.log.error('Error removing Redis typing state:', error);
    }
  }
  
  private async loadTypingStateFromRedis(channelId: string): Promise<TypingUser[]> {
    try {
      const userIds = await this.redis.smembers(`typing_channels:${channelId}`);
      const typingUsers: TypingUser[] = [];
      
      for (const userId of userIds) {
        const key = `typing:${channelId}:${userId}`;
        const data = await this.redis.get(key);
        
        if (data) {
          try {
            const typingUser = JSON.parse(data) as TypingUser;
            typingUsers.push(typingUser);
          } catch (parseError) {
            this.fastify.log.warn('Failed to parse typing user data:', parseError);
          }
        }
      }
      
      return typingUsers;
      
    } catch (error) {
      this.fastify.log.error('Error loading typing state from Redis:', error);
      return [];
    }
  }
  
  /**
   * Cross-server event handlers
   */
  
  private async handleRemoteTypingStart(message: any): Promise<void> {
    try {
      // Don't process our own events
      if (message.serverId === process.env.SERVER_ID) return;
      
      const { channelId, userId, typingUser } = message.data;
      
      // Update local state
      const channelState = this.getOrCreateChannelState(channelId);
      channelState.users.set(userId, typingUser);
      
      // Broadcast to local clients
      this.io.to(`channel:${channelId}`).emit('typing:start', {
        channel_id: channelId,
        user_id: userId,
        username: typingUser.username,
        display_name: typingUser.displayName,
        device_type: typingUser.deviceType,
        timestamp: typingUser.startTime
      });
      
    } catch (error) {
      this.fastify.log.error('Error handling remote typing start:', error);
    }
  }
  
  private async handleRemoteTypingStop(message: any): Promise<void> {
    try {
      // Don't process our own events
      if (message.serverId === process.env.SERVER_ID) return;
      
      const { channelId, userId } = message.data;
      
      // Update local state
      const channelState = this.channelStates.get(channelId);
      if (channelState) {
        channelState.users.delete(userId);
        
        if (channelState.users.size === 0) {
          this.channelStates.delete(channelId);
        }
      }
      
      // Broadcast to local clients
      this.io.to(`channel:${channelId}`).emit('typing:stop', {
        channel_id: channelId,
        user_id: userId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      this.fastify.log.error('Error handling remote typing stop:', error);
    }
  }
  
  private async handleRemoteCleanup(message: any): Promise<void> {
    try {
      const { channelId, expiredUsers } = message.data;
      
      const channelState = this.channelStates.get(channelId);
      if (!channelState) return;
      
      for (const userId of expiredUsers) {
        channelState.users.delete(userId);
      }
      
      if (channelState.users.size === 0) {
        this.channelStates.delete(channelId);
      } else {
        // Broadcast updated typing state
        this.broadcastTypingUpdate(channelId);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling remote cleanup:', error);
    }
  }
  
  /**
   * Background tasks
   */
  
  private startCleanupTasks(): void {
    // Cleanup stale typing states every 30 seconds
    setInterval(() => {
      this.cleanupStaleTypingStates();
    }, 30000);
    
    // Cleanup rate limit cache every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitCache();
    }, 5 * 60 * 1000);
    
    // Sync with Redis every 2 minutes
    setInterval(() => {
      this.syncWithRedis();
    }, 2 * 60 * 1000);
  }
  
  private async cleanupStaleTypingStates(): Promise<void> {
    try {
      const now = Date.now();
      const staleThreshold = this.TYPING_TIMEOUT + 5000; // Add 5s buffer
      const expiredChannels: string[] = [];
      
      for (const [channelId, channelState] of this.channelStates.entries()) {
        const expiredUsers: string[] = [];
        
        for (const [userId, typingUser] of channelState.users.entries()) {
          if (now - typingUser.lastUpdate > staleThreshold) {
            expiredUsers.push(userId);
          }
        }
        
        // Remove expired users
        for (const userId of expiredUsers) {
          channelState.users.delete(userId);
          await this.removeRedisTypingState(channelId, userId);
        }
        
        // Clean up empty channels
        if (channelState.users.size === 0) {
          expiredChannels.push(channelId);
        } else if (expiredUsers.length > 0) {
          // Broadcast updated state
          this.broadcastTypingUpdate(channelId);
          
          // Notify other servers
          await this.pubsub.publish('typing:cleanup', {
            channelId,
            expiredUsers
          });
        }
      }
      
      // Remove empty channels
      for (const channelId of expiredChannels) {
        this.channelStates.delete(channelId);
      }
      
      if (expiredChannels.length > 0 || this.getTotalExpiredUsers() > 0) {
        this.fastify.log.debug(`🧹 Cleaned up ${this.getTotalExpiredUsers()} expired typing states in ${expiredChannels.length} channels`);
      }
      
      this.metrics.lastCleanup = new Date();
      
    } catch (error) {
      this.fastify.log.error('Error during typing cleanup:', error);
    }
  }
  
  private getTotalExpiredUsers(): number {
    let total = 0;
    for (const channelState of this.channelStates.values()) {
      const now = Date.now();
      for (const typingUser of channelState.users.values()) {
        if (now - typingUser.lastUpdate > this.TYPING_TIMEOUT + 5000) {
          total++;
        }
      }
    }
    return total;
  }
  
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [userId, lastEvent] of this.userRateLimit.entries()) {
      if (now - lastEvent > this.RATE_LIMIT_WINDOW * 2) {
        expiredKeys.push(userId);
      }
    }
    
    for (const key of expiredKeys) {
      this.userRateLimit.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      this.fastify.log.debug(`🧹 Cleaned up ${expiredKeys.length} expired rate limit entries`);
    }
  }
  
  private async syncWithRedis(): Promise<void> {
    try {
      // Sync typing states with Redis for consistency
      for (const [channelId, channelState] of this.channelStates.entries()) {
        const redisUsers = await this.loadTypingStateFromRedis(channelId);
        
        // Remove users that don't exist in Redis
        for (const userId of channelState.users.keys()) {
          if (!redisUsers.some(user => user.userId === userId)) {
            channelState.users.delete(userId);
          }
        }
        
        // Add users from Redis that we don't have locally
        for (const redisUser of redisUsers) {
          if (!channelState.users.has(redisUser.userId)) {
            channelState.users.set(redisUser.userId, redisUser);
          }
        }
        
        // Clean up empty channels
        if (channelState.users.size === 0) {
          this.channelStates.delete(channelId);
        }
      }
      
    } catch (error) {
      this.fastify.log.debug('Error syncing with Redis:', error);
    }
  }
  
  /**
   * Metrics and monitoring
   */
  
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
      this.logMetrics();
    }, 60000); // Every minute
  }
  
  private updateMetrics(): void {
    this.metrics.typingUsersCount = this.getTotalTypingUsers();
    this.metrics.channelsWithTyping = this.channelStates.size;
    this.updateConcurrentMetrics();
  }
  
  private updateConcurrentMetrics(): void {
    const currentTypers = this.getTotalTypingUsers();
    if (currentTypers > this.metrics.peakConcurrentTypers) {
      this.metrics.peakConcurrentTypers = currentTypers;
    }
  }
  
  private updateAverageTypingDuration(duration: number): void {
    this.metrics.avgTypingDuration = 
      (this.metrics.avgTypingDuration + duration) / 2;
  }
  
  private getTotalTypingUsers(): number {
    let total = 0;
    for (const channelState of this.channelStates.values()) {
      total += channelState.users.size;
    }
    return total;
  }
  
  private logMetrics(): void {
    this.fastify.log.debug('📊 Typing Indicators Metrics:', {
      ...this.metrics,
      activeChannels: this.channelStates.size,
      cacheSize: this.userInfoCache.size,
      rateLimitEntries: this.userRateLimit.size,
      debounceTimers: this.userDebounceTimers.size
    });
  }
  
  /**
   * Public API
   */
  
  /**
   * Get system metrics
   */
  getMetrics(): TypingMetrics & {
    activeChannels: number;
    cacheSize: number;
    rateLimitEntries: number;
    debounceTimers: number;
  } {
    this.updateMetrics();
    
    return {
      ...this.metrics,
      activeChannels: this.channelStates.size,
      cacheSize: this.userInfoCache.size,
      rateLimitEntries: this.userRateLimit.size,
      debounceTimers: this.userDebounceTimers.size
    };
  }
  
  /**
   * Force cleanup of all typing states
   */
  async forceCleanup(): Promise<void> {
    try {
      // Clear all local state
      this.channelStates.clear();
      this.userChannels.clear();
      
      // Clear all timers
      for (const timer of this.userDebounceTimers.values()) {
        clearTimeout(timer);
      }
      this.userDebounceTimers.clear();
      
      // Clear Redis typing data
      const pattern = 'typing:*';
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      // Clear typing channels
      const channelPattern = 'typing_channels:*';
      const channelKeys = await this.redis.keys(channelPattern);
      if (channelKeys.length > 0) {
        await this.redis.del(...channelKeys);
      }
      
      this.fastify.log.info('✅ Force cleanup of typing indicators completed');
      
    } catch (error) {
      this.fastify.log.error('Error during force cleanup:', error);
    }
  }
  
  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Shutting down Enhanced Typing Indicators...');
      
      // Clear all timers
      for (const timer of this.userDebounceTimers.values()) {
        clearTimeout(timer);
      }
      
      for (const channelState of this.channelStates.values()) {
        if (channelState.timeout) {
          clearTimeout(channelState.timeout);
        }
      }
      
      // Send final cleanup broadcast
      await this.pubsub.publish('typing:server_shutdown', {
        serverId: process.env.SERVER_ID || 'unknown',
        timestamp: Date.now()
      });
      
      this.fastify.log.info('✅ Enhanced Typing Indicators shutdown complete');
      
    } catch (error) {
      this.fastify.log.error('Error during typing indicators shutdown:', error);
    }
  }
}

/**
 * Factory function to create enhanced typing indicators
 */
export function createEnhancedTypingIndicators(
  io: Server,
  redis: Redis,
  pubsub: AdvancedRedisPubSub,
  fastify: FastifyInstance
): EnhancedTypingIndicators {
  return new EnhancedTypingIndicators(io, redis, pubsub, fastify);
}