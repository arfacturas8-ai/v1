import { Server } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { AdvancedRedisPubSub } from './advanced-redis-pubsub';

/**
 * PRODUCTION PRESENCE SYSTEM
 * 
 * Features:
 * ✅ Redis-backed distributed presence state
 * ✅ Heartbeat monitoring with configurable intervals
 * ✅ Multi-device presence support (web, mobile, desktop)
 * ✅ Status broadcasting with intelligent throttling
 * ✅ Activity tracking and rich presence
 * ✅ Offline detection with graceful degradation
 * ✅ Presence analytics and insights
 * ✅ Custom status messages and activities
 * ✅ Server-level presence aggregation
 * ✅ Memory-efficient with TTL cleanup
 * ✅ Cross-server synchronization
 * ✅ Batch presence updates for performance
 */

export interface UserPresence {
  userId: string;
  status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
  lastSeen: number;
  lastActivity: number;
  customStatus?: {
    text: string;
    emoji?: string;
    expiresAt?: number;
  };
  activity?: {
    type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom' | 'competing';
    name: string;
    details?: string;
    state?: string;
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
    timestamps?: {
      start?: number;
      end?: number;
    };
    party?: {
      id?: string;
      size?: [number, number];
    };
    buttons?: Array<{
      label: string;
      url: string;
    }>;
    secrets?: {
      join?: string;
      spectate?: string;
      match?: string;
    };
  };
  devices: Map<string, DevicePresence>;
  servers: Set<string>; // Server IDs where user is present
  channels: Set<string>; // Channel IDs where user is active
}

export interface DevicePresence {
  deviceId: string;
  type: 'web' | 'mobile' | 'desktop';
  platform: string; // browser, iOS, Android, Windows, etc.
  status: 'online' | 'idle' | 'dnd' | 'offline';
  lastSeen: number;
  lastActivity: number;
  sessionId: string;
  serverId: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface PresenceMetrics {
  totalUsers: number;
  onlineUsers: number;
  idleUsers: number;
  dndUsers: number;
  offlineUsers: number;
  invisibleUsers: number;
  devicesOnline: number;
  serversActive: number;
  presenceUpdates: number;
  heartbeatsReceived: number;
  broadcastsSent: number;
  batchesSent: number;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  peakConcurrentUsers: number;
  lastCleanup: Date;
}

export interface HeartbeatData {
  userId: string;
  sessionId: string;
  deviceId: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: any;
  customStatus?: any;
  timestamp: number;
}

export class ProductionPresenceSystem {
  private io: Server;
  private redis: Redis;
  private pubsub: AdvancedRedisPubSub;
  private fastify: FastifyInstance;
  
  // Local presence cache for performance
  private userPresenceCache = new Map<string, UserPresence>();
  private deviceSessionMap = new Map<string, string>(); // sessionId -> userId
  private userSessionMap = new Map<string, Set<string>>(); // userId -> sessionIds
  
  // Heartbeat tracking
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  private missedHeartbeats = new Map<string, number>();
  
  // Batch update system
  private pendingUpdates = new Map<string, UserPresence>();
  private batchUpdateTimer: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 90000; // 90 seconds (3 missed heartbeats)
  private readonly IDLE_THRESHOLD = 300000; // 5 minutes
  private readonly OFFLINE_THRESHOLD = 900000; // 15 minutes
  private readonly BATCH_UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly PRESENCE_TTL = 1800; // 30 minutes in Redis
  private readonly MAX_CACHE_SIZE = 50000;
  private readonly MAX_MISSED_HEARTBEATS = 3;
  
  // Metrics
  private metrics: PresenceMetrics = {
    totalUsers: 0,
    onlineUsers: 0,
    idleUsers: 0,
    dndUsers: 0,
    offlineUsers: 0,
    invisibleUsers: 0,
    devicesOnline: 0,
    serversActive: 0,
    presenceUpdates: 0,
    heartbeatsReceived: 0,
    broadcastsSent: 0,
    batchesSent: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    peakConcurrentUsers: 0,
    lastCleanup: new Date()
  };
  
  // Rate limiting for presence updates
  private userUpdateRateLimit = new Map<string, number>();
  private readonly UPDATE_RATE_LIMIT = 10000; // 10 seconds between updates
  
  constructor(io: Server, redis: Redis, pubsub: AdvancedRedisPubSub, fastify: FastifyInstance) {
    this.io = io;
    this.redis = redis;
    this.pubsub = pubsub;
    this.fastify = fastify;
    
    this.initialize();
  }
  
  /**
   * Initialize the presence system
   */
  private async initialize(): Promise<void> {
    try {
      // Subscribe to cross-server presence events
      await this.pubsub.subscribe('presence:update', this.handleRemotePresenceUpdate.bind(this));
      await this.pubsub.subscribe('presence:heartbeat', this.handleRemoteHeartbeat.bind(this));
      await this.pubsub.subscribe('presence:bulk_update', this.handleBulkPresenceUpdate.bind(this));
      await this.pubsub.subscribe('presence:server_shutdown', this.handleServerShutdown.bind(this));
      
      // Start background tasks
      this.startHeartbeatMonitoring();
      this.startBatchUpdates();
      this.startCleanupTasks();
      this.startMetricsCollection();
      
      // Load existing presence data from Redis
      await this.loadPresenceFromRedis();
      
      this.fastify.log.info('✅ Production Presence System initialized');
      this.fastify.log.info('⚙️ Configuration:');
      this.fastify.log.info(`   - Heartbeat interval: ${this.HEARTBEAT_INTERVAL}ms`);
      this.fastify.log.info(`   - Heartbeat timeout: ${this.HEARTBEAT_TIMEOUT}ms`);
      this.fastify.log.info(`   - Idle threshold: ${this.IDLE_THRESHOLD}ms`);
      this.fastify.log.info(`   - Batch updates: ${this.BATCH_UPDATE_INTERVAL}ms`);
      this.fastify.log.info(`   - Redis TTL: ${this.PRESENCE_TTL}s`);
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to initialize Production Presence System:', error);
      throw error;
    }
  }
  
  /**
   * Handle user connection
   */
  async handleUserConnect(userId: string, sessionId: string, deviceInfo: {
    type: 'web' | 'mobile' | 'desktop';
    platform: string;
    userAgent?: string;
    location?: any;
  }): Promise<void> {
    
    try {
      const deviceId = this.generateDeviceId(deviceInfo);
      const now = Date.now();
      
      // Update session mappings
      this.deviceSessionMap.set(sessionId, userId);
      if (!this.userSessionMap.has(userId)) {
        this.userSessionMap.set(userId, new Set());
      }
      this.userSessionMap.get(userId)!.add(sessionId);
      
      // Get or create user presence
      let userPresence = await this.getUserPresence(userId);
      if (!userPresence) {
        userPresence = this.createEmptyPresence(userId);
      }
      
      // Add/update device presence
      const devicePresence: DevicePresence = {
        deviceId,
        type: deviceInfo.type,
        platform: deviceInfo.platform,
        status: 'online',
        lastSeen: now,
        lastActivity: now,
        sessionId,
        serverId: process.env.SERVER_ID || 'unknown',
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location
      };
      
      userPresence.devices.set(deviceId, devicePresence);
      userPresence.status = this.calculateOverallStatus(userPresence);
      userPresence.lastSeen = now;
      userPresence.lastActivity = now;
      
      // Update cache and Redis
      this.userPresenceCache.set(userId, userPresence);
      await this.savePresenceToRedis(userId, userPresence);
      
      // Start heartbeat monitoring for this session
      this.startSessionHeartbeat(userId, sessionId, deviceId);
      
      // Broadcast presence update
      await this.broadcastPresenceUpdate(userId, userPresence);
      
      // Update metrics
      this.metrics.presenceUpdates++;
      this.updateUserCountMetrics();
      
      this.fastify.log.debug(`User connected: ${userId} on ${deviceInfo.type} (${deviceInfo.platform})`);
      
    } catch (error) {
      this.fastify.log.error('Error handling user connect:', error);
    }
  }
  
  /**
   * Handle user disconnection
   */
  async handleUserDisconnect(userId: string, sessionId: string): Promise<void> {
    try {
      // Clean up session mappings
      this.deviceSessionMap.delete(sessionId);
      const userSessions = this.userSessionMap.get(userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessionMap.delete(userId);
        }
      }
      
      // Stop heartbeat monitoring
      this.stopSessionHeartbeat(sessionId);
      
      // Get user presence
      const userPresence = await this.getUserPresence(userId);
      if (!userPresence) return;
      
      // Remove device by sessionId
      let deviceToRemove: string | null = null;
      for (const [deviceId, device] of userPresence.devices.entries()) {
        if (device.sessionId === sessionId) {
          deviceToRemove = deviceId;
          break;
        }
      }
      
      if (deviceToRemove) {
        userPresence.devices.delete(deviceToRemove);
      }
      
      // Update overall status
      if (userPresence.devices.size === 0) {
        // No devices connected, mark as offline
        userPresence.status = 'offline';
        userPresence.lastSeen = Date.now();
      } else {
        userPresence.status = this.calculateOverallStatus(userPresence);
      }
      
      // Update cache and Redis
      this.userPresenceCache.set(userId, userPresence);
      await this.savePresenceToRedis(userId, userPresence);
      
      // Broadcast presence update
      await this.broadcastPresenceUpdate(userId, userPresence);
      
      // Update metrics
      this.updateUserCountMetrics();
      
      this.fastify.log.debug(`User disconnected: ${userId} (session: ${sessionId})`);
      
    } catch (error) {
      this.fastify.log.error('Error handling user disconnect:', error);
    }
  }
  
  /**
   * Handle heartbeat from user
   */
  async handleHeartbeat(heartbeatData: HeartbeatData): Promise<void> {
    try {
      const { userId, sessionId, deviceId, status, activity, customStatus, timestamp } = heartbeatData;
      
      this.metrics.heartbeatsReceived++;
      
      // Reset missed heartbeat counter
      this.missedHeartbeats.delete(sessionId);
      
      // Get user presence
      let userPresence = await this.getUserPresence(userId);
      if (!userPresence) {
        this.fastify.log.warn(`Received heartbeat for unknown user: ${userId}`);
        return;
      }
      
      const device = userPresence.devices.get(deviceId);
      if (!device) {
        this.fastify.log.warn(`Received heartbeat for unknown device: ${deviceId}`);
        return;
      }
      
      // Update device presence
      device.lastSeen = timestamp;
      device.lastActivity = timestamp;
      if (status) {
        device.status = status;
      }
      
      // Update user presence
      userPresence.lastSeen = timestamp;
      userPresence.lastActivity = timestamp;
      
      if (activity !== undefined) {
        userPresence.activity = activity;
      }
      
      if (customStatus !== undefined) {
        userPresence.customStatus = customStatus;
      }
      
      // Calculate new overall status
      const newStatus = this.calculateOverallStatus(userPresence);
      const statusChanged = userPresence.status !== newStatus;
      userPresence.status = newStatus;
      
      // Update cache
      this.userPresenceCache.set(userId, userPresence);
      
      // Queue for batch update
      this.queuePresenceUpdate(userId, userPresence);
      
      // Broadcast immediately if status changed
      if (statusChanged) {
        await this.broadcastPresenceUpdate(userId, userPresence);
      }
      
      // Reset heartbeat timer
      this.resetSessionHeartbeat(userId, sessionId, deviceId);
      
    } catch (error) {
      this.fastify.log.error('Error handling heartbeat:', error);
    }
  }
  
  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible', activity?: any, customStatus?: any): Promise<boolean> {
    try {
      // Rate limiting check
      if (!this.checkUpdateRateLimit(userId)) {
        return false;
      }
      
      const userPresence = await this.getUserPresence(userId);
      if (!userPresence) {
        return false;
      }
      
      const now = Date.now();
      const oldStatus = userPresence.status;
      
      // Update presence
      userPresence.status = status;
      userPresence.lastActivity = now;
      
      if (activity !== undefined) {
        userPresence.activity = activity;
      }
      
      if (customStatus !== undefined) {
        userPresence.customStatus = customStatus;
      }
      
      // Update all devices to match status
      for (const device of userPresence.devices.values()) {
        device.status = status;
        device.lastActivity = now;
      }
      
      // Update cache and Redis
      this.userPresenceCache.set(userId, userPresence);
      await this.savePresenceToRedis(userId, userPresence);
      
      // Broadcast if status changed
      if (oldStatus !== status) {
        await this.broadcastPresenceUpdate(userId, userPresence);
        this.metrics.presenceUpdates++;
        this.updateUserCountMetrics();
      }
      
      return true;
      
    } catch (error) {
      this.fastify.log.error('Error updating user status:', error);
      return false;
    }
  }
  
  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const startTime = Date.now();
      
      // Check cache first
      const cached = this.userPresenceCache.get(userId);
      if (cached) {
        this.metrics.cacheHits++;
        this.updateResponseTime(Date.now() - startTime);
        return cached;
      }
      
      // Load from Redis
      this.metrics.cacheMisses++;
      const presence = await this.loadPresenceFromRedis(userId);
      
      if (presence) {
        // Cache for future requests
        this.userPresenceCache.set(userId, presence);
        this.manageCacheSize();
      }
      
      this.updateResponseTime(Date.now() - startTime);
      return presence;
      
    } catch (error) {
      this.fastify.log.error('Error getting user presence:', error);
      return null;
    }
  }
  
  /**
   * Get multiple user presences efficiently
   */
  async getBulkUserPresence(userIds: string[]): Promise<Map<string, UserPresence>> {
    try {
      const result = new Map<string, UserPresence>();
      const uncachedIds: string[] = [];
      
      // Check cache first
      for (const userId of userIds) {
        const cached = this.userPresenceCache.get(userId);
        if (cached) {
          result.set(userId, cached);
          this.metrics.cacheHits++;
        } else {
          uncachedIds.push(userId);
          this.metrics.cacheMisses++;
        }
      }
      
      // Load uncached from Redis in bulk
      if (uncachedIds.length > 0) {
        const pipeline = this.redis.pipeline();
        for (const userId of uncachedIds) {
          pipeline.get(`presence:${userId}`);
        }
        
        const redisResults = await pipeline.exec();
        
        for (let i = 0; i < uncachedIds.length; i++) {
          const userId = uncachedIds[i];
          const redisResult = redisResults?.[i];
          
          if (redisResult && redisResult[1]) {
            try {
              const presence = this.deserializePresence(redisResult[1] as string);
              result.set(userId, presence);
              this.userPresenceCache.set(userId, presence);
            } catch (parseError) {
              this.fastify.log.warn(`Failed to parse presence for user ${userId}:`, parseError);
            }
          }
        }
      }
      
      return result;
      
    } catch (error) {
      this.fastify.log.error('Error getting bulk user presence:', error);
      return new Map();
    }
  }
  
  /**
   * Get server presence statistics
   */
  getServerPresenceStats(): {
    online: number;
    idle: number;
    dnd: number;
    offline: number;
    invisible: number;
    total: number;
  } {
    
    const stats = {
      online: 0,
      idle: 0,
      dnd: 0,
      offline: 0,
      invisible: 0,
      total: 0
    };
    
    for (const presence of this.userPresenceCache.values()) {
      stats.total++;
      switch (presence.status) {
        case 'online':
          stats.online++;
          break;
        case 'idle':
          stats.idle++;
          break;
        case 'dnd':
          stats.dnd++;
          break;
        case 'offline':
          stats.offline++;
          break;
        case 'invisible':
          stats.invisible++;
          break;
      }
    }
    
    return stats;
  }
  
  /**
   * Private helper methods
   */
  
  private createEmptyPresence(userId: string): UserPresence {
    return {
      userId,
      status: 'offline',
      lastSeen: Date.now(),
      lastActivity: Date.now(),
      devices: new Map(),
      servers: new Set(),
      channels: new Set()
    };
  }
  
  private generateDeviceId(deviceInfo: { type: string; platform: string; userAgent?: string }): string {
    const hash = require('crypto').createHash('md5');
    hash.update(`${deviceInfo.type}-${deviceInfo.platform}-${deviceInfo.userAgent || ''}`);
    return hash.digest('hex').substring(0, 16);
  }
  
  private calculateOverallStatus(presence: UserPresence): 'online' | 'idle' | 'dnd' | 'offline' | 'invisible' {
    if (presence.devices.size === 0) {
      return 'offline';
    }
    
    const statuses = Array.from(presence.devices.values()).map(d => d.status);
    
    // Priority: online > idle > dnd > invisible > offline
    if (statuses.includes('online')) return 'online';
    if (statuses.includes('idle')) return 'idle';
    if (statuses.includes('dnd')) return 'dnd';
    if (statuses.includes('invisible')) return 'invisible';
    return 'offline';
  }
  
  private checkUpdateRateLimit(userId: string): boolean {
    const now = Date.now();
    const lastUpdate = this.userUpdateRateLimit.get(userId) || 0;
    
    if (now - lastUpdate < this.UPDATE_RATE_LIMIT) {
      return false;
    }
    
    this.userUpdateRateLimit.set(userId, now);
    return true;
  }
  
  private manageCacheSize(): void {
    if (this.userPresenceCache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest 10% of entries
      const entries = Array.from(this.userPresenceCache.entries());
      entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen);
      
      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.userPresenceCache.delete(entries[i][0]);
      }
    }
  }
  
  private updateResponseTime(time: number): void {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + time) / 2;
  }
  
  /**
   * Redis operations
   */
  
  private async savePresenceToRedis(userId: string, presence: UserPresence): Promise<void> {
    try {
      const key = `presence:${userId}`;
      const data = this.serializePresence(presence);
      
      await this.redis.setex(key, this.PRESENCE_TTL, data);
      
    } catch (error) {
      this.fastify.log.error('Error saving presence to Redis:', error);
    }
  }
  
  private async loadPresenceFromRedis(userId?: string): Promise<UserPresence | null> {
    try {
      if (userId) {
        const key = `presence:${userId}`;
        const data = await this.redis.get(key);
        
        if (data) {
          return this.deserializePresence(data);
        }
        return null;
      } else {
        // Load all presence data
        const keys = await this.redis.keys('presence:*');
        const pipeline = this.redis.pipeline();
        
        for (const key of keys) {
          pipeline.get(key);
        }
        
        const results = await pipeline.exec();
        
        for (let i = 0; i < keys.length; i++) {
          const userId = keys[i].replace('presence:', '');
          const result = results?.[i];
          
          if (result && result[1]) {
            try {
              const presence = this.deserializePresence(result[1] as string);
              this.userPresenceCache.set(userId, presence);
            } catch (parseError) {
              this.fastify.log.warn(`Failed to parse presence for user ${userId}:`, parseError);
            }
          }
        }
        
        return null;
      }
    } catch (error) {
      this.fastify.log.error('Error loading presence from Redis:', error);
      return null;
    }
  }
  
  private serializePresence(presence: UserPresence): string {
    const serializable = {
      ...presence,
      devices: Array.from(presence.devices.entries()),
      servers: Array.from(presence.servers),
      channels: Array.from(presence.channels)
    };
    
    return JSON.stringify(serializable);
  }
  
  private deserializePresence(data: string): UserPresence {
    const parsed = JSON.parse(data);
    
    return {
      ...parsed,
      devices: new Map(parsed.devices),
      servers: new Set(parsed.servers),
      channels: new Set(parsed.channels)
    };
  }
  
  /**
   * Heartbeat monitoring
   */
  
  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      this.checkMissedHeartbeats();
    }, this.HEARTBEAT_INTERVAL);
  }
  
  private startSessionHeartbeat(userId: string, sessionId: string, deviceId: string): void {
    const timer = setTimeout(() => {
      this.handleMissedHeartbeat(userId, sessionId, deviceId);
    }, this.HEARTBEAT_TIMEOUT);
    
    this.heartbeatTimers.set(sessionId, timer);
  }
  
  private resetSessionHeartbeat(userId: string, sessionId: string, deviceId: string): void {
    const existingTimer = this.heartbeatTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    this.startSessionHeartbeat(userId, sessionId, deviceId);
  }
  
  private stopSessionHeartbeat(sessionId: string): void {
    const timer = this.heartbeatTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.heartbeatTimers.delete(sessionId);
    }
    
    this.missedHeartbeats.delete(sessionId);
  }
  
  private async handleMissedHeartbeat(userId: string, sessionId: string, deviceId: string): Promise<void> {
    try {
      const missed = (this.missedHeartbeats.get(sessionId) || 0) + 1;
      this.missedHeartbeats.set(sessionId, missed);
      
      if (missed >= this.MAX_MISSED_HEARTBEATS) {
        // Consider session disconnected
        this.fastify.log.warn(`Session ${sessionId} missed ${missed} heartbeats, marking as disconnected`);
        await this.handleUserDisconnect(userId, sessionId);
      } else {
        // Mark device as idle
        const userPresence = await this.getUserPresence(userId);
        if (userPresence) {
          const device = userPresence.devices.get(deviceId);
          if (device && device.status === 'online') {
            device.status = 'idle';
            userPresence.status = this.calculateOverallStatus(userPresence);
            
            this.userPresenceCache.set(userId, userPresence);
            await this.savePresenceToRedis(userId, userPresence);
            await this.broadcastPresenceUpdate(userId, userPresence);
          }
        }
        
        // Reset timer for next check
        this.startSessionHeartbeat(userId, sessionId, deviceId);
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling missed heartbeat:', error);
    }
  }
  
  private checkMissedHeartbeats(): void {
    // This is handled by individual session timers
    // This method can be used for additional cleanup if needed
  }
  
  /**
   * Batch updates
   */
  
  private startBatchUpdates(): void {
    this.batchUpdateTimer = setInterval(() => {
      this.processBatchUpdates();
    }, this.BATCH_UPDATE_INTERVAL);
  }
  
  private queuePresenceUpdate(userId: string, presence: UserPresence): void {
    this.pendingUpdates.set(userId, presence);
  }
  
  private async processBatchUpdates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;
    
    try {
      const updates = Array.from(this.pendingUpdates.entries());
      this.pendingUpdates.clear();
      
      // Save all to Redis in batch
      const pipeline = this.redis.pipeline();
      for (const [userId, presence] of updates) {
        const key = `presence:${userId}`;
        const data = this.serializePresence(presence);
        pipeline.setex(key, this.PRESENCE_TTL, data);
      }
      
      await pipeline.exec();
      
      // Broadcast bulk update to other servers
      if (updates.length > 1) {
        await this.pubsub.publish('presence:bulk_update', {
          updates: updates.map(([userId, presence]) => ({
            userId,
            status: presence.status,
            lastSeen: presence.lastSeen,
            activity: presence.activity,
            customStatus: presence.customStatus
          })),
          serverId: process.env.SERVER_ID || 'unknown'
        });
        
        this.metrics.batchesSent++;
      }
      
      this.fastify.log.debug(`Processed ${updates.length} presence updates in batch`);
      
    } catch (error) {
      this.fastify.log.error('Error processing batch updates:', error);
    }
  }
  
  /**
   * Broadcasting
   */
  
  private async broadcastPresenceUpdate(userId: string, presence: UserPresence): Promise<void> {
    try {
      const presenceData = {
        user_id: userId,
        status: presence.status,
        last_seen: presence.lastSeen,
        last_activity: presence.lastActivity,
        custom_status: presence.customStatus,
        activity: presence.activity,
        devices: Array.from(presence.devices.values()).map(d => ({
          type: d.type,
          platform: d.platform,
          status: d.status,
          last_seen: d.lastSeen
        }))
      };
      
      // Broadcast to all servers where user is present
      for (const serverId of presence.servers) {
        this.io.to(`server:${serverId}`).emit('presence:update', presenceData);
      }
      
      // Broadcast to user's personal room
      this.io.to(`user:${userId}`).emit('presence:update', presenceData);
      
      // Cross-server broadcast
      await this.pubsub.publish('presence:update', {
        userId,
        presence: presenceData,
        serverId: process.env.SERVER_ID || 'unknown'
      }, {
        priority: 'low',
        compress: false,
        dedupe: true
      });
      
      this.metrics.broadcastsSent++;
      
    } catch (error) {
      this.fastify.log.error('Error broadcasting presence update:', error);
    }
  }
  
  /**
   * Cross-server event handlers
   */
  
  private async handleRemotePresenceUpdate(message: any): Promise<void> {
    try {
      // Don't process our own events
      if (message.serverId === process.env.SERVER_ID) return;
      
      const { userId, presence } = message.data;
      
      // Update local cache
      const cachedPresence = this.userPresenceCache.get(userId);
      if (cachedPresence) {
        cachedPresence.status = presence.status;
        cachedPresence.lastSeen = presence.last_seen;
        cachedPresence.lastActivity = presence.last_activity;
        cachedPresence.customStatus = presence.custom_status;
        cachedPresence.activity = presence.activity;
        
        this.userPresenceCache.set(userId, cachedPresence);
      }
      
      // Broadcast to local clients
      this.io.to(`user:${userId}`).emit('presence:update', presence);
      
    } catch (error) {
      this.fastify.log.error('Error handling remote presence update:', error);
    }
  }
  
  private async handleRemoteHeartbeat(message: any): Promise<void> {
    // Heartbeats are handled locally, no cross-server processing needed
  }
  
  private async handleBulkPresenceUpdate(message: any): Promise<void> {
    try {
      // Don't process our own events
      if (message.serverId === process.env.SERVER_ID) return;
      
      const { updates } = message.data;
      
      for (const update of updates) {
        const { userId, status, lastSeen, activity, customStatus } = update;
        
        const cachedPresence = this.userPresenceCache.get(userId);
        if (cachedPresence) {
          cachedPresence.status = status;
          cachedPresence.lastSeen = lastSeen;
          cachedPresence.activity = activity;
          cachedPresence.customStatus = customStatus;
          
          this.userPresenceCache.set(userId, cachedPresence);
        }
      }
      
    } catch (error) {
      this.fastify.log.error('Error handling bulk presence update:', error);
    }
  }
  
  private async handleServerShutdown(message: any): Promise<void> {
    try {
      const { serverId } = message.data;
      
      // Mark all users from that server as potentially offline
      for (const [userId, presence] of this.userPresenceCache.entries()) {
        let needsUpdate = false;
        
        for (const [deviceId, device] of presence.devices.entries()) {
          if (device.serverId === serverId) {
            presence.devices.delete(deviceId);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          presence.status = this.calculateOverallStatus(presence);
          if (presence.devices.size === 0) {
            presence.status = 'offline';
            presence.lastSeen = Date.now();
          }
          
          this.userPresenceCache.set(userId, presence);
          await this.savePresenceToRedis(userId, presence);
          await this.broadcastPresenceUpdate(userId, presence);
        }
      }
      
      this.fastify.log.info(`Handled server shutdown for server: ${serverId}`);
      
    } catch (error) {
      this.fastify.log.error('Error handling server shutdown:', error);
    }
  }
  
  /**
   * Background tasks
   */
  
  private startCleanupTasks(): void {
    // Cleanup stale presence data every 5 minutes
    setInterval(() => {
      this.cleanupStalePresence();
    }, 5 * 60 * 1000);
    
    // Cleanup rate limit cache every 10 minutes
    setInterval(() => {
      this.cleanupRateLimitCache();
    }, 10 * 60 * 1000);
  }
  
  private async cleanupStalePresence(): Promise<void> {
    try {
      const now = Date.now();
      const staleCutoff = now - this.OFFLINE_THRESHOLD;
      let cleanedCount = 0;
      
      for (const [userId, presence] of this.userPresenceCache.entries()) {
        if (presence.lastSeen < staleCutoff) {
          if (presence.status !== 'offline') {
            presence.status = 'offline';
            presence.lastSeen = now;
            
            this.userPresenceCache.set(userId, presence);
            await this.savePresenceToRedis(userId, presence);
            await this.broadcastPresenceUpdate(userId, presence);
            
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        this.fastify.log.debug(`🧹 Cleaned up ${cleanedCount} stale presence records`);
      }
      
      this.metrics.lastCleanup = new Date();
      
    } catch (error) {
      this.fastify.log.error('Error during presence cleanup:', error);
    }
  }
  
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [userId, lastUpdate] of this.userUpdateRateLimit.entries()) {
      if (now - lastUpdate > this.UPDATE_RATE_LIMIT * 2) {
        expiredKeys.push(userId);
      }
    }
    
    for (const key of expiredKeys) {
      this.userUpdateRateLimit.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      this.fastify.log.debug(`🧹 Cleaned up ${expiredKeys.length} expired rate limit entries`);
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
    this.updateUserCountMetrics();
    this.metrics.devicesOnline = this.getTotalDevices();
    this.metrics.serversActive = this.getActiveServers();
    
    const currentOnline = this.metrics.onlineUsers + this.metrics.idleUsers + this.metrics.dndUsers;
    if (currentOnline > this.metrics.peakConcurrentUsers) {
      this.metrics.peakConcurrentUsers = currentOnline;
    }
  }
  
  private updateUserCountMetrics(): void {
    let online = 0, idle = 0, dnd = 0, offline = 0, invisible = 0;
    
    for (const presence of this.userPresenceCache.values()) {
      switch (presence.status) {
        case 'online': online++; break;
        case 'idle': idle++; break;
        case 'dnd': dnd++; break;
        case 'offline': offline++; break;
        case 'invisible': invisible++; break;
      }
    }
    
    this.metrics.totalUsers = this.userPresenceCache.size;
    this.metrics.onlineUsers = online;
    this.metrics.idleUsers = idle;
    this.metrics.dndUsers = dnd;
    this.metrics.offlineUsers = offline;
    this.metrics.invisibleUsers = invisible;
  }
  
  private getTotalDevices(): number {
    let total = 0;
    for (const presence of this.userPresenceCache.values()) {
      total += presence.devices.size;
    }
    return total;
  }
  
  private getActiveServers(): number {
    const servers = new Set<string>();
    for (const presence of this.userPresenceCache.values()) {
      for (const serverId of presence.servers) {
        servers.add(serverId);
      }
    }
    return servers.size;
  }
  
  private logMetrics(): void {
    this.fastify.log.debug('📊 Presence System Metrics:', {
      ...this.metrics,
      cacheSize: this.userPresenceCache.size,
      sessionMappings: this.deviceSessionMap.size,
      heartbeatTimers: this.heartbeatTimers.size,
      pendingUpdates: this.pendingUpdates.size
    });
  }
  
  /**
   * Public API
   */
  
  /**
   * Get system metrics
   */
  getMetrics(): PresenceMetrics & {
    cacheSize: number;
    sessionMappings: number;
    heartbeatTimers: number;
    pendingUpdates: number;
  } {
    this.updateMetrics();
    
    return {
      ...this.metrics,
      cacheSize: this.userPresenceCache.size,
      sessionMappings: this.deviceSessionMap.size,
      heartbeatTimers: this.heartbeatTimers.size,
      pendingUpdates: this.pendingUpdates.size
    };
  }
  
  /**
   * Force cleanup of all presence data
   */
  async forceCleanup(): Promise<void> {
    try {
      // Clear all local state
      this.userPresenceCache.clear();
      this.deviceSessionMap.clear();
      this.userSessionMap.clear();
      this.pendingUpdates.clear();
      
      // Clear all timers
      for (const timer of this.heartbeatTimers.values()) {
        clearTimeout(timer);
      }
      this.heartbeatTimers.clear();
      
      // Clear Redis presence data
      const keys = await this.redis.keys('presence:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      this.fastify.log.info('✅ Force cleanup of presence system completed');
      
    } catch (error) {
      this.fastify.log.error('Error during force cleanup:', error);
    }
  }
  
  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Shutting down Production Presence System...');
      
      // Clear batch update timer
      if (this.batchUpdateTimer) {
        clearInterval(this.batchUpdateTimer);
      }
      
      // Process any pending updates
      await this.processBatchUpdates();
      
      // Clear all heartbeat timers
      for (const timer of this.heartbeatTimers.values()) {
        clearTimeout(timer);
      }
      
      // Notify other servers of shutdown
      await this.pubsub.publish('presence:server_shutdown', {
        serverId: process.env.SERVER_ID || 'unknown',
        timestamp: Date.now()
      });
      
      this.fastify.log.info('✅ Production Presence System shutdown complete');
      
    } catch (error) {
      this.fastify.log.error('Error during presence system shutdown:', error);
    }
  }
}

/**
 * Factory function to create production presence system
 */
export function createProductionPresenceSystem(
  io: Server,
  redis: Redis,
  pubsub: AdvancedRedisPubSub,
  fastify: FastifyInstance
): ProductionPresenceSystem {
  return new ProductionPresenceSystem(io, redis, pubsub, fastify);
}