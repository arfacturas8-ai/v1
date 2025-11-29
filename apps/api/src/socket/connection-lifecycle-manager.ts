import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

/**
 * CONNECTION LIFECYCLE MANAGER
 * 
 * Enterprise-grade connection lifecycle management with advanced reconnection logic,
 * connection pooling, and graceful degradation for maximum reliability.
 * 
 * Features:
 * ✅ Intelligent reconnection with exponential backoff
 * ✅ Connection health monitoring and heartbeat
 * ✅ Session persistence across reconnections
 * ✅ Connection pooling and load balancing
 * ✅ Graceful degradation during failures
 * ✅ Connection rate limiting and abuse protection
 * ✅ Multi-device session management
 * ✅ Connection state synchronization
 * ✅ Automatic cleanup of stale connections
 * ✅ Performance monitoring and analytics
 */

export interface ConnectionSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'desktop';
  userAgent: string;
  ipAddress: string;
  connectedAt: Date;
  lastSeen: Date;
  lastHeartbeat: Date;
  reconnectCount: number;
  isAuthenticated: boolean;
  permissions: string[];
  rooms: Set<string>;
  metadata: {
    version: string;
    features: string[];
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
    performance: {
      latency: number;
      packetLoss: number;
      bandwidth: number;
    };
  };
  state: {
    isActive: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
    lastReconnectAt?: Date;
    degradationLevel: 'none' | 'partial' | 'severe';
  };
}

export interface ConnectionPool {
  id: string;
  maxConnections: number;
  currentConnections: number;
  activeConnections: Map<string, ConnectionSession>;
  waitingQueue: string[];
  healthScore: number;
  lastBalanced: Date;
}

export interface ReconnectionConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: boolean;
  sessionTimeout: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  reconnectingConnections: number;
  failedConnections: number;
  averageConnectionTime: number;
  averageReconnectTime: number;
  connectionSuccess: number;
  connectionFailures: number;
  byDeviceType: {
    web: number;
    mobile: number;
    desktop: number;
  };
  healthScore: number;
  degradationEvents: number;
}

export class ConnectionLifecycleManager extends EventEmitter {
  private fastify: FastifyInstance;
  private io: Server;
  private redis: Redis;
  
  // Connection management
  private sessions = new Map<string, ConnectionSession>();
  private socketToSession = new Map<string, string>();
  private userSessions = new Map<string, Set<string>>();
  
  // Connection pools
  private pools = new Map<string, ConnectionPool>();
  
  // Configuration
  private config = {
    maxConnectionsPerUser: 5,
    maxConnectionsPerIP: 10,
    sessionTimeout: 1800000, // 30 minutes
    heartbeatInterval: 30000, // 30 seconds
    heartbeatTimeout: 10000, // 10 seconds
    reconnection: {
      enabled: true,
      maxAttempts: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 1.5,
      jitter: true,
      sessionTimeout: 300000 // 5 minutes
    } as ReconnectionConfig,
    pooling: {
      enabled: true,
      maxPoolSize: 1000,
      balancingInterval: 60000 // 1 minute
    }
  };
  
  // Metrics and monitoring
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    reconnectingConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    averageReconnectTime: 0,
    connectionSuccess: 0,
    connectionFailures: 0,
    byDeviceType: { web: 0, mobile: 0, desktop: 0 },
    healthScore: 100,
    degradationEvents: 0
  };
  
  // Rate limiting
  private connectionAttempts = new Map<string, {
    count: number;
    resetTime: number;
    blocked: boolean;
  }>();
  
  // Cleanup timers
  private cleanupTimers = new Map<string, NodeJS.Timeout>();
  private heartbeatTimers = new Map<string, NodeJS.Timeout>();
  
  constructor(fastify: FastifyInstance, io: Server, redis: Redis) {
    super();
    this.fastify = fastify;
    this.io = io;
    this.redis = redis;
    
    this.setupConnectionHandling();
    this.setupHeartbeatSystem();
    this.setupCleanupTasks();
    this.setupLoadBalancing();
    this.setupMetricsCollection();
  }
  
  private setupConnectionHandling() {
    this.io.engine.on('connection_error', (error) => {
      this.handleConnectionError(error);
    });
    
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }
  
  private async handleConnection(socket: Socket) {
    const connectionStart = Date.now();
    const ipAddress = this.getClientIP(socket);
    const userAgent = socket.handshake.headers['user-agent'] || '';
    const deviceId = socket.handshake.headers['x-device-id'] as string || randomUUID();
    const userId = (socket as any).userId;
    
    try {
      // Rate limiting check
      if (!this.checkConnectionRateLimit(ipAddress)) {
        socket.disconnect(true);
        this.metrics.connectionFailures++;
        return;
      }
      
      // Connection limit checks
      if (!await this.checkConnectionLimits(userId, ipAddress)) {
        socket.emit('connection:rejected', {
          reason: 'Connection limit exceeded',
          retryAfter: 60000
        });
        socket.disconnect(true);
        return;
      }
      
      // Create or restore session
      const session = await this.createOrRestoreSession({
        sessionId: socket.handshake.auth?.sessionId || randomUUID(),
        userId,
        deviceId,
        deviceType: this.detectDeviceType(userAgent),
        userAgent,
        ipAddress,
        socketId: socket.id
      });
      
      // Register session
      this.registerSession(socket, session);
      
      // Setup socket event handlers
      this.setupSocketEvents(socket, session);
      
      // Start heartbeat
      this.startHeartbeat(socket, session);
      
      // Connection success
      const connectionTime = Date.now() - connectionStart;
      this.updateConnectionMetrics(true, connectionTime, session.deviceType);
      
      this.fastify.log.info(
        `✅ Connection established: ${session.sessionId} (${session.deviceType}, ${connectionTime}ms)`
      );
      
      socket.emit('connection:established', {
        sessionId: session.sessionId,
        reconnection: session.reconnectCount > 0,
        serverTime: new Date(),
        config: {
          heartbeatInterval: this.config.heartbeatInterval,
          reconnection: this.config.reconnection
        }
      });
      
      this.emit('connection:established', { socket, session });
      
    } catch (error) {
      this.handleConnectionError(error as Error, socket);
    }
  }
  
  private async createOrRestoreSession(params: {
    sessionId: string;
    userId: string;
    deviceId: string;
    deviceType: 'web' | 'mobile' | 'desktop';
    userAgent: string;
    ipAddress: string;
    socketId: string;
  }): Promise<ConnectionSession> {
    
    // Try to restore existing session
    let session = await this.getSessionFromRedis(params.sessionId);
    
    if (session && session.userId === params.userId) {
      // Restore session
      session.reconnectCount++;
      session.lastSeen = new Date();
      session.lastHeartbeat = new Date();
      session.state.isReconnecting = false;
      session.state.lastReconnectAt = new Date();
      
      this.fastify.log.info(
        `🔄 Session restored: ${session.sessionId} (reconnect #${session.reconnectCount})`
      );
      
    } else {
      // Create new session
      session = {
        sessionId: params.sessionId,
        userId: params.userId,
        deviceId: params.deviceId,
        deviceType: params.deviceType,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        connectedAt: new Date(),
        lastSeen: new Date(),
        lastHeartbeat: new Date(),
        reconnectCount: 0,
        isAuthenticated: true,
        permissions: [],
        rooms: new Set(),
        metadata: {
          version: '1.0.0',
          features: [],
          performance: {
            latency: 0,
            packetLoss: 0,
            bandwidth: 0
          }
        },
        state: {
          isActive: true,
          isReconnecting: false,
          reconnectAttempts: 0,
          degradationLevel: 'none'
        }
      };
    }
    
    // Persist session
    await this.persistSession(session);
    
    return session;
  }
  
  private registerSession(socket: Socket, session: ConnectionSession) {
    // Map socket to session
    this.socketToSession.set(socket.id, session.sessionId);
    this.sessions.set(session.sessionId, session);
    
    // Track user sessions
    if (!this.userSessions.has(session.userId)) {
      this.userSessions.set(session.userId, new Set());
    }
    this.userSessions.get(session.userId)!.add(session.sessionId);
    
    // Add to connection pool
    this.addToPool(session);
    
    this.metrics.activeConnections++;
    this.metrics.totalConnections++;
  }
  
  private setupSocketEvents(socket: Socket, session: ConnectionSession) {
    // Heartbeat/ping response
    socket.on('heartbeat:pong', (data: { timestamp: number; latency?: number }) => {
      this.handleHeartbeatResponse(session, data);
    });
    
    // Reconnection events
    socket.on('reconnection:request', async (data: { reason?: string }) => {
      await this.handleReconnectionRequest(socket, session, data.reason);
    });
    
    // Session restore
    socket.on('session:restore', async (data: { sessionId: string; state?: any }) => {
      await this.handleSessionRestore(socket, session, data);
    });
    
    // Performance updates
    socket.on('performance:update', (data: {
      latency: number;
      packetLoss?: number;
      bandwidth?: number;
    }) => {
      this.updateSessionPerformance(session, data);
    });
    
    // Room join/leave tracking
    socket.on('room:joined', (data: { roomId: string }) => {
      session.rooms.add(data.roomId);
      this.persistSession(session);
    });
    
    socket.on('room:left', (data: { roomId: string }) => {
      session.rooms.delete(data.roomId);
      this.persistSession(session);
    });
    
    // Disconnection handling
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, session, reason);
    });
    
    // Error handling
    socket.on('error', (error) => {
      this.handleSocketError(socket, session, error);
    });
  }
  
  // Heartbeat system
  private setupHeartbeatSystem() {
    // Global heartbeat check
    setInterval(() => {
      this.checkAllHeartbeats();
    }, this.config.heartbeatInterval);
  }
  
  private startHeartbeat(socket: Socket, session: ConnectionSession) {
    const timer = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat:ping', {
          timestamp: Date.now(),
          sessionId: session.sessionId
        });
        
        // Set timeout for response
        setTimeout(() => {
          this.checkHeartbeatTimeout(session);
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
    
    this.heartbeatTimers.set(session.sessionId, timer);
  }
  
  private handleHeartbeatResponse(session: ConnectionSession, data: {
    timestamp: number;
    latency?: number;
  }) {
    session.lastHeartbeat = new Date();
    session.lastSeen = new Date();
    
    // Update performance metrics
    if (data.latency !== undefined) {
      session.metadata.performance.latency = data.latency;
    }
    
    // Reset degradation if connection is healthy
    if (session.state.degradationLevel !== 'none') {
      session.state.degradationLevel = 'none';
      this.emit('connection:recovered', session);
    }
  }
  
  private checkHeartbeatTimeout(session: ConnectionSession) {
    const timeSinceHeartbeat = Date.now() - session.lastHeartbeat.getTime();
    
    if (timeSinceHeartbeat > this.config.heartbeatTimeout) {
      this.handleHeartbeatTimeout(session);
    }
  }
  
  private checkAllHeartbeats() {
    const now = Date.now();
    
    for (const session of this.sessions.values()) {
      const timeSinceHeartbeat = now - session.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > this.config.heartbeatTimeout * 2) {
        this.handleHeartbeatTimeout(session);
      } else if (timeSinceHeartbeat > this.config.heartbeatTimeout) {
        this.triggerDegradation(session, 'partial');
      }
    }
  }
  
  private handleHeartbeatTimeout(session: ConnectionSession) {
    this.fastify.log.warn(`💔 Heartbeat timeout for session ${session.sessionId}`);
    
    this.triggerDegradation(session, 'severe');
    
    // Attempt reconnection if enabled
    if (this.config.reconnection.enabled) {
      this.initiateReconnection(session);
    }
  }
  
  // Reconnection logic
  private async initiateReconnection(session: ConnectionSession) {
    if (session.state.isReconnecting) {
      return; // Already reconnecting
    }
    
    session.state.isReconnecting = true;
    session.state.reconnectAttempts++;
    
    if (session.state.reconnectAttempts > this.config.reconnection.maxAttempts) {
      this.handleReconnectionFailure(session);
      return;
    }
    
    const delay = this.calculateReconnectionDelay(session.state.reconnectAttempts);
    
    this.fastify.log.info(
      `🔄 Initiating reconnection for session ${session.sessionId} (attempt ${session.state.reconnectAttempts}/${this.config.reconnection.maxAttempts}) in ${delay}ms`
    );
    
    setTimeout(() => {
      this.performReconnection(session);
    }, delay);
  }
  
  private calculateReconnectionDelay(attempt: number): number {
    const { initialDelay, maxDelay, multiplier, jitter } = this.config.reconnection;
    
    let delay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay);
    
    if (jitter) {
      // Add random jitter to prevent thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }
  
  private async performReconnection(session: ConnectionSession) {
    try {
      // Check if session is still valid
      if (!this.sessions.has(session.sessionId)) {
        return; // Session was cleaned up
      }
      
      // Emit reconnection event to client
      this.io.emit('connection:reconnect-required', {
        sessionId: session.sessionId,
        reason: 'heartbeat_timeout',
        attempt: session.state.reconnectAttempts
      });
      
      // Wait for client reconnection
      const reconnectionTimeout = setTimeout(() => {
        if (session.state.isReconnecting) {
          this.initiateReconnection(session);
        }
      }, 30000); // 30 second timeout
      
      this.cleanupTimers.set(session.sessionId, reconnectionTimeout);
      
    } catch (error) {
      this.fastify.log.error('Reconnection attempt failed:', error);
      this.initiateReconnection(session);
    }
  }
  
  private async handleReconnectionRequest(
    socket: Socket, 
    session: ConnectionSession, 
    reason?: string
  ) {
    this.fastify.log.info(
      `🔄 Reconnection requested for session ${session.sessionId}: ${reason || 'unknown'}`
    );
    
    // Reset reconnection state
    session.state.isReconnecting = false;
    session.state.reconnectAttempts = 0;
    
    // Clear any pending reconnection timers
    const timer = this.cleanupTimers.get(session.sessionId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(session.sessionId);
    }
    
    // Restore session state
    await this.restoreSessionState(socket, session);
    
    socket.emit('reconnection:success', {
      sessionId: session.sessionId,
      reconnectCount: session.reconnectCount,
      restoredRooms: Array.from(session.rooms)
    });
  }
  
  private handleReconnectionFailure(session: ConnectionSession) {
    this.fastify.log.error(
      `❌ Reconnection failed for session ${session.sessionId} after ${session.state.reconnectAttempts} attempts`
    );
    
    session.state.isReconnecting = false;
    this.metrics.failedConnections++;
    
    // Clean up session
    this.cleanupSession(session.sessionId);
    
    this.emit('connection:failed', session);
  }
  
  // Session management
  private async restoreSessionState(socket: Socket, session: ConnectionSession) {
    try {
      // Rejoin all rooms
      for (const roomId of session.rooms) {
        socket.join(roomId);
      }
      
      // Restore any pending data
      const pendingData = await this.getPendingData(session.sessionId);
      if (pendingData.length > 0) {
        socket.emit('session:pending-data', pendingData);
      }
      
      this.fastify.log.info(
        `✅ Session state restored for ${session.sessionId} (${session.rooms.size} rooms)`
      );
      
    } catch (error) {
      this.fastify.log.error('Failed to restore session state:', error);
    }
  }
  
  private async handleSessionRestore(
    socket: Socket, 
    session: ConnectionSession, 
    data: { sessionId: string; state?: any }
  ) {
    if (data.sessionId !== session.sessionId) {
      socket.emit('session:error', {
        error: 'Session ID mismatch'
      });
      return;
    }
    
    await this.restoreSessionState(socket, session);
    
    socket.emit('session:restored', {
      sessionId: session.sessionId,
      state: data.state
    });
  }
  
  // Degradation handling
  private triggerDegradation(session: ConnectionSession, level: 'partial' | 'severe') {
    if (session.state.degradationLevel === level) {
      return; // Already at this level
    }
    
    session.state.degradationLevel = level;
    this.metrics.degradationEvents++;
    
    this.fastify.log.warn(
      `⚠️ Connection degradation: ${session.sessionId} -> ${level}`
    );
    
    // Emit degradation event to client
    const socket = this.getSocketBySessionId(session.sessionId);
    if (socket) {
      socket.emit('connection:degraded', {
        level,
        reason: 'poor_connection',
        suggestions: this.getDegradationSuggestions(level)
      });
    }
    
    this.emit('connection:degraded', { session, level });
  }
  
  private getDegradationSuggestions(level: 'partial' | 'severe'): string[] {
    switch (level) {
      case 'partial':
        return [
          'Reduce message frequency',
          'Disable non-essential features',
          'Check network connection'
        ];
      
      case 'severe':
        return [
          'Switch to offline mode',
          'Reconnect to server',
          'Check internet connection',
          'Contact support if issues persist'
        ];
      
      default:
        return [];
    }
  }
  
  // Connection pooling and load balancing
  private setupLoadBalancing() {
    if (!this.config.pooling.enabled) return;
    
    setInterval(() => {
      this.balanceConnectionPools();
    }, this.config.pooling.balancingInterval);
  }
  
  private addToPool(session: ConnectionSession) {
    // Simple round-robin pool assignment
    const poolId = `pool-${session.deviceType}`;
    
    if (!this.pools.has(poolId)) {
      this.pools.set(poolId, {
        id: poolId,
        maxConnections: this.config.pooling.maxPoolSize,
        currentConnections: 0,
        activeConnections: new Map(),
        waitingQueue: [],
        healthScore: 100,
        lastBalanced: new Date()
      });
    }
    
    const pool = this.pools.get(poolId)!;
    pool.activeConnections.set(session.sessionId, session);
    pool.currentConnections++;
  }
  
  private balanceConnectionPools() {
    for (const pool of this.pools.values()) {
      // Calculate health score based on load
      const loadRatio = pool.currentConnections / pool.maxConnections;
      pool.healthScore = Math.max(0, 100 - (loadRatio * 100));
      
      // Process waiting queue if there's capacity
      while (pool.waitingQueue.length > 0 && pool.currentConnections < pool.maxConnections) {
        const sessionId = pool.waitingQueue.shift()!;
        const session = this.sessions.get(sessionId);
        
        if (session) {
          pool.activeConnections.set(sessionId, session);
          pool.currentConnections++;
          
          // Notify client of pool assignment
          const socket = this.getSocketBySessionId(sessionId);
          if (socket) {
            socket.emit('pool:assigned', {
              poolId: pool.id,
              healthScore: pool.healthScore
            });
          }
        }
      }
      
      pool.lastBalanced = new Date();
    }
  }
  
  // Event handlers
  private handleDisconnection(socket: Socket, session: ConnectionSession, reason: string) {
    this.fastify.log.info(
      `🔌 Disconnection: ${session.sessionId} (reason: ${reason})`
    );
    
    // Update session state
    session.state.isActive = false;
    session.lastSeen = new Date();
    
    // Clean up mappings
    this.socketToSession.delete(socket.id);
    
    // Stop heartbeat
    const heartbeatTimer = this.heartbeatTimers.get(session.sessionId);
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      this.heartbeatTimers.delete(session.sessionId);
    }
    
    // Schedule session cleanup if not reconnecting
    if (!session.state.isReconnecting) {
      const cleanupTimer = setTimeout(() => {
        this.cleanupSession(session.sessionId);
      }, this.config.sessionTimeout);
      
      this.cleanupTimers.set(session.sessionId, cleanupTimer);
    }
    
    this.metrics.activeConnections--;
    
    this.emit('connection:disconnected', { session, reason });
  }
  
  private handleSocketError(socket: Socket, session: ConnectionSession, error: Error) {
    this.fastify.log.error(
      `❌ Socket error for session ${session.sessionId}:`,
      error
    );
    
    this.triggerDegradation(session, 'severe');
    this.emit('connection:error', { session, error });
  }
  
  private handleConnectionError(error: Error, socket?: Socket) {
    this.fastify.log.error('❌ Connection error:', error);
    
    this.metrics.connectionFailures++;
    
    if (socket) {
      socket.emit('connection:error', {
        error: error.message,
        code: (error as any).code
      });
    }
  }
  
  // Utility methods
  private getClientIP(socket: Socket): string {
    return (
      socket.handshake.headers['x-forwarded-for'] as string ||
      socket.handshake.headers['x-real-ip'] as string ||
      socket.handshake.address ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }
  
  private detectDeviceType(userAgent: string): 'web' | 'mobile' | 'desktop' {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Electron/.test(userAgent)) {
      return 'desktop';
    } else {
      return 'web';
    }
  }
  
  private checkConnectionRateLimit(ipAddress: string): boolean {
    const now = Date.now();
    const attempt = this.connectionAttempts.get(ipAddress);
    
    if (!attempt) {
      this.connectionAttempts.set(ipAddress, {
        count: 1,
        resetTime: now + 60000, // 1 minute window
        blocked: false
      });
      return true;
    }
    
    if (attempt.blocked && now < attempt.resetTime) {
      return false;
    }
    
    if (now > attempt.resetTime) {
      attempt.count = 1;
      attempt.resetTime = now + 60000;
      attempt.blocked = false;
      return true;
    }
    
    attempt.count++;
    
    if (attempt.count > 10) { // 10 connections per minute
      attempt.blocked = true;
      return false;
    }
    
    return true;
  }
  
  private async checkConnectionLimits(userId: string, ipAddress: string): Promise<boolean> {
    // Check per-user limit
    const userSessions = this.userSessions.get(userId);
    if (userSessions && userSessions.size >= this.config.maxConnectionsPerUser) {
      return false;
    }
    
    // Check per-IP limit
    let ipCount = 0;
    for (const session of this.sessions.values()) {
      if (session.ipAddress === ipAddress) {
        ipCount++;
      }
    }
    
    return ipCount < this.config.maxConnectionsPerIP;
  }
  
  private getSocketBySessionId(sessionId: string): Socket | null {
    for (const [socketId, mappedSessionId] of this.socketToSession.entries()) {
      if (mappedSessionId === sessionId) {
        return this.io.sockets.sockets.get(socketId) || null;
      }
    }
    return null;
  }
  
  private updateSessionPerformance(session: ConnectionSession, data: {
    latency: number;
    packetLoss?: number;
    bandwidth?: number;
  }) {
    session.metadata.performance.latency = data.latency;
    
    if (data.packetLoss !== undefined) {
      session.metadata.performance.packetLoss = data.packetLoss;
    }
    
    if (data.bandwidth !== undefined) {
      session.metadata.performance.bandwidth = data.bandwidth;
    }
    
    // Trigger degradation based on performance
    if (data.latency > 1000 || (data.packetLoss && data.packetLoss > 5)) {
      this.triggerDegradation(session, 'partial');
    } else if (data.latency > 2000 || (data.packetLoss && data.packetLoss > 10)) {
      this.triggerDegradation(session, 'severe');
    }
  }
  
  // Persistence methods
  private async persistSession(session: ConnectionSession): Promise<void> {
    try {
      await this.redis.setex(
        `session:${session.sessionId}`,
        this.config.sessionTimeout / 1000,
        JSON.stringify({
          ...session,
          rooms: Array.from(session.rooms) // Convert Set to Array for JSON
        })
      );
    } catch (error) {
      this.fastify.log.error('Failed to persist session:', error);
    }
  }
  
  private async getSessionFromRedis(sessionId: string): Promise<ConnectionSession | null> {
    try {
      const data = await this.redis.get(`session:${sessionId}`);
      if (data) {
        const session = JSON.parse(data);
        // Convert Array back to Set
        session.rooms = new Set(session.rooms);
        // Convert date strings back to Date objects
        session.connectedAt = new Date(session.connectedAt);
        session.lastSeen = new Date(session.lastSeen);
        session.lastHeartbeat = new Date(session.lastHeartbeat);
        return session;
      }
    } catch (error) {
      this.fastify.log.error('Failed to get session from Redis:', error);
    }
    return null;
  }
  
  private async getPendingData(sessionId: string): Promise<any[]> {
    try {
      const data = await this.redis.lrange(`pending:${sessionId}`, 0, -1);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      this.fastify.log.error('Failed to get pending data:', error);
      return [];
    }
  }
  
  // Cleanup methods
  private setupCleanupTasks() {
    // Clean up expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000); // Every 5 minutes
    
    // Clean up rate limit entries
    setInterval(() => {
      this.cleanupRateLimits();
    }, 60000); // Every minute
    
    // Update metrics
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Every 30 seconds
  }
  
  private cleanupExpiredSessions() {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastSeen = now - session.lastSeen.getTime();
      
      if (timeSinceLastSeen > this.config.sessionTimeout && !session.state.isActive) {
        expiredSessions.push(sessionId);
      }
    }
    
    for (const sessionId of expiredSessions) {
      this.cleanupSession(sessionId);
    }
    
    if (expiredSessions.length > 0) {
      this.fastify.log.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
  
  private cleanupSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Remove from user sessions
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      // Remove from pools
      for (const pool of this.pools.values()) {
        if (pool.activeConnections.has(sessionId)) {
          pool.activeConnections.delete(sessionId);
          pool.currentConnections--;
        }
      }
      
      // Clear timers
      const heartbeatTimer = this.heartbeatTimers.get(sessionId);
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        this.heartbeatTimers.delete(sessionId);
      }
      
      const cleanupTimer = this.cleanupTimers.get(sessionId);
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        this.cleanupTimers.delete(sessionId);
      }
      
      // Remove session
      this.sessions.delete(sessionId);
      
      // Clean up Redis
      this.redis.del(`session:${sessionId}`);
      this.redis.del(`pending:${sessionId}`);
      
      this.emit('session:cleaned', session);
    }
  }
  
  private cleanupRateLimits() {
    const now = Date.now();
    
    for (const [ip, attempt] of this.connectionAttempts.entries()) {
      if (now > attempt.resetTime && !attempt.blocked) {
        this.connectionAttempts.delete(ip);
      }
    }
  }
  
  // Metrics collection
  private setupMetricsCollection() {
    setInterval(() => {
      this.updateMetrics();
      this.emit('metrics', this.metrics);
    }, 30000); // Every 30 seconds
  }
  
  private updateMetrics() {
    this.metrics.activeConnections = this.sessions.size;
    
    // Count by device type
    this.metrics.byDeviceType = { web: 0, mobile: 0, desktop: 0 };
    for (const session of this.sessions.values()) {
      this.metrics.byDeviceType[session.deviceType]++;
    }
    
    // Calculate health score
    const totalCapacity = Array.from(this.pools.values())
      .reduce((sum, pool) => sum + pool.maxConnections, 0);
    const currentLoad = this.metrics.activeConnections;
    
    this.metrics.healthScore = totalCapacity > 0 ? 
      Math.max(0, 100 - ((currentLoad / totalCapacity) * 100)) : 100;
  }
  
  private updateConnectionMetrics(
    success: boolean, 
    connectionTime: number, 
    deviceType: 'web' | 'mobile' | 'desktop'
  ) {
    if (success) {
      this.metrics.connectionSuccess++;
      
      // Update average connection time (simple moving average)
      this.metrics.averageConnectionTime = 
        (this.metrics.averageConnectionTime * 0.9) + (connectionTime * 0.1);
      
    } else {
      this.metrics.connectionFailures++;
    }
  }
  
  // Public API
  public getSession(sessionId: string): ConnectionSession | null {
    return this.sessions.get(sessionId) || null;
  }
  
  public getUserSessions(userId: string): ConnectionSession[] {
    const sessionIds = this.userSessions.get(userId);
    if (!sessionIds) return [];
    
    return Array.from(sessionIds)
      .map(id => this.sessions.get(id))
      .filter(session => session !== undefined) as ConnectionSession[];
  }
  
  public getMetrics(): ConnectionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  
  public getHealth() {
    return {
      status: this.metrics.healthScore > 70 ? 'healthy' : 'degraded',
      connections: {
        active: this.metrics.activeConnections,
        total: this.metrics.totalConnections,
        pools: Object.fromEntries(
          Array.from(this.pools.entries()).map(([id, pool]) => [
            id,
            {
              current: pool.currentConnections,
              max: pool.maxConnections,
              health: pool.healthScore
            }
          ])
        )
      },
      metrics: this.metrics
    };
  }
  
  public async gracefulShutdown(): Promise<void> {
    this.fastify.log.info('Shutting down connection lifecycle manager...');
    
    // Stop all timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    
    // Notify all connected clients
    this.io.emit('server:shutdown', {
      reason: 'maintenance',
      reconnectAfter: 30000
    });
    
    // Give clients time to prepare for shutdown
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Persist all active sessions
    const persistPromises = Array.from(this.sessions.values())
      .map(session => this.persistSession(session));
    
    await Promise.allSettled(persistPromises);
    
    this.fastify.log.info('Connection lifecycle manager shutdown complete');
  }
}

// Factory function
export function createConnectionLifecycleManager(
  fastify: FastifyInstance,
  io: Server,
  redis: Redis
): ConnectionLifecycleManager {
  return new ConnectionLifecycleManager(fastify, io, redis);
}
