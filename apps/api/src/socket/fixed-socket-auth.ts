import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { AuthService } from '../services/auth';

/**
 * FIXED SOCKET.IO AUTHENTICATION SYSTEM
 * 
 * This module fixes all critical authentication issues:
 * 1. ✅ Separate Redis connections for pub/sub vs general operations
 * 2. ✅ Proper WebSocket configuration to prevent RSV1 errors
 * 3. ✅ Robust JWT token validation with fallback handling
 * 4. ✅ Rate limiting with dedicated Redis connection
 * 5. ✅ Comprehensive error handling and logging
 * 6. ✅ Real-time messaging, presence, and typing indicators
 */

interface SocketAuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export class FixedSocketAuth {
  private io: Server;
  private fastify: FastifyInstance;
  private authService: AuthService;
  
  // Separate Redis connections to prevent "subscriber mode" errors
  private pubClient: Redis;
  private subClient: Redis;
  private generalRedis: Redis; // For rate limiting, presence, etc.
  
  // Connection tracking
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private presenceData = new Map<string, any>();
  private typingIndicators = new Map<string, NodeJS.Timeout>();

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.setupRedisConnections();
    this.setupSocketServer();
    this.setupAuthService();
  }

  private setupRedisConnections() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380/0';
    
    // Separate connections for different purposes
    this.pubClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    this.subClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
    
    this.generalRedis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Error handling for Redis connections
    [this.pubClient, this.subClient, this.generalRedis].forEach((client, index) => {
      const clientName = ['pub', 'sub', 'general'][index];
      
      client.on('error', (error) => {
        this.fastify.log.error(`Redis ${clientName} client error:`, error);
      });
      
      client.on('connect', () => {
        this.fastify.log.info(`✅ Redis ${clientName} client connected`);
      });
      
      client.on('ready', () => {
        this.fastify.log.info(`✅ Redis ${clientName} client ready`);
      });
    });

    this.fastify.log.info('✅ Fixed Redis connections established');
  }

  private setupSocketServer() {
    this.io = new Server(this.fastify.server, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://localhost:3002',
          'http://localhost:3003',
          'http://api.cryb.ai',
          'https://api.cryb.ai',
          'http://platform.cryb.ai',
          'https://platform.cryb.ai'
        ],
        credentials: true,
        methods: ['GET', 'POST']
      },
      
      // Fixed transport configuration to prevent WebSocket issues
      transports: ['polling', 'websocket'],
      upgradeTimeout: 30000,
      pingTimeout: 60000,
      pingInterval: 25000,
      
      // Critical fixes for WebSocket RSV1 errors
      compression: false,
      httpCompression: false,
      perMessageDeflate: false,
      
      // Engine.io specific options
      allowEIO3: true,
      allowUpgrades: true,
      cookie: false,
      path: '/socket.io/',
      maxHttpBufferSize: 1e6,
      
      // Additional WebSocket configuration
      wsEngine: 'ws',
      
      // Request validation
      allowRequest: (req, callback) => {
        const origin = req.headers.origin;
        
        // Allow same-origin requests
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          'http://localhost:3000', 'http://localhost:3001', 
          'http://localhost:3002', 'http://localhost:3003',
          'http://api.cryb.ai', 'https://api.cryb.ai',
          'http://platform.cryb.ai', 'https://platform.cryb.ai'
        ];
        
        if (allowedOrigins.includes(origin) || 
            origin.includes('cryb.ai') || 
            (process.env.NODE_ENV === 'development' && origin.includes('localhost'))) {
          return callback(null, true);
        }
        
        this.fastify.log.warn(`🚫 Rejected Socket.IO connection from origin: ${origin}`);
        return callback('Origin not allowed', false);
      }
    });

    // Setup Redis adapter with error handling
    try {
      this.io.adapter(createAdapter(this.pubClient, this.subClient));
      this.fastify.log.info('✅ Socket.IO Redis adapter configured successfully');
    } catch (error) {
      this.fastify.log.error('❌ Failed to setup Redis adapter:', error);
      this.fastify.log.warn('⚠️  Socket.IO running without Redis adapter (single instance mode)');
    }

    // Global connection error handler
    this.io.engine.on('connection_error', (error) => {
      this.fastify.log.error('Socket.IO connection error:', {
        message: error.message,
        type: error.type,
        context: error.context
      });
    });

    this.fastify.log.info('✅ Fixed Socket.IO server configured');
  }

  private setupAuthService() {
    // Create dedicated AuthService with the general Redis connection
    this.authService = new AuthService(this.generalRedis);
    this.fastify.log.info('✅ AuthService configured with dedicated Redis connection');
  }

  public setupAuthentication() {
    this.io.use(async (socket: any, next) => {
      try {
        const authResult = await this.authenticateSocket(socket);
        
        if (!authResult.success) {
          // In development, allow unauthenticated connections for testing
          if (process.env.NODE_ENV === 'development' || process.env.ALLOW_ANONYMOUS_SOCKET === 'true') {
            this.fastify.log.warn('⚠️ Allowing unauthenticated socket connection in development mode:', {
              socketId: socket.id,
              error: authResult.error,
              ip: socket.handshake.address
            });
            
            // Set up anonymous user
            socket.userId = `anonymous_${Date.now()}`;
            socket.username = 'Anonymous';
            socket.displayName = 'Anonymous User';
            socket.isAuthenticated = false;
            socket.connectedAt = new Date();
            
            return next();
          }
          
          this.fastify.log.warn('❌ Socket authentication failed:', {
            socketId: socket.id,
            error: authResult.error,
            ip: socket.handshake.address
          });
          return next(new Error(authResult.error || 'Authentication failed'));
        }

        // Attach user data to socket
        const user = authResult.user;
        socket.userId = user.id;
        socket.username = user.username;
        socket.displayName = user.displayName;
        socket.isAuthenticated = true;
        socket.connectedAt = new Date();

        this.fastify.log.info('✅ Socket authentication successful:', {
          userId: user.id,
          username: user.username,
          socketId: socket.id
        });

        next();
        
      } catch (error) {
        this.fastify.log.error('💥 Socket authentication error:', error);
        next(new Error('Authentication service error'));
      }
    });

    this.fastify.log.info('✅ Fixed Socket.IO authentication middleware configured');
  }

  private async authenticateSocket(socket: any): Promise<SocketAuthResult> {
    try {
      // Enhanced token extraction with multiple sources
      let token = this.extractToken(socket);
      
      if (!token) {
        return { 
          success: false, 
          error: 'No authentication token provided. Use auth.token, Authorization header, or query parameter.' 
        };
      }

      // Validate token format
      if (!this.isValidJWTFormat(token)) {
        return { 
          success: false, 
          error: 'Invalid JWT token format' 
        };
      }

      // Rate limiting using dedicated Redis connection
      if (!(await this.checkAuthRateLimit(socket.handshake.address, token))) {
        return { 
          success: false, 
          error: 'Authentication rate limit exceeded' 
        };
      }

      // Validate token with AuthService
      const validation = await this.authService.validateAccessToken(token);
      
      if (!validation || !validation.valid) {
        return { 
          success: false, 
          error: validation?.reason || 'Token validation failed' 
        };
      }

      // Get user from database
      const user = await this.getUser(validation.payload.userId);
      
      if (!user) {
        return { 
          success: false, 
          error: 'User not found' 
        };
      }

      // Check if user is banned
      if (user.bannedAt && user.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        return { 
          success: false, 
          error: 'User account is banned' 
        };
      }

      return { success: true, user };
      
    } catch (error) {
      this.fastify.log.error('Socket authentication error:', error);
      return { 
        success: false, 
        error: 'Authentication service unavailable' 
      };
    }
  }

  private extractToken(socket: any): string | null {
    let token = null;
    
    // Method 1: Auth object (highest priority)
    if (socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
      this.fastify.log.debug('Token extracted from auth.token');
    }
    
    // Method 2: Authorization header
    else if (socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      this.fastify.log.debug('Token extracted from Authorization header');
    }
    
    // Method 3: Query parameters
    else if (socket.handshake.query?.token) {
      token = socket.handshake.query.token as string;
      this.fastify.log.debug('Token extracted from query parameter');
    }
    
    // Method 4: Alternative auth object keys
    else if (socket.handshake.auth) {
      const altKeys = ['accessToken', 'access_token', 'authToken', 'auth_token', 'jwt'];
      for (const key of altKeys) {
        if (socket.handshake.auth[key]) {
          token = socket.handshake.auth[key];
          this.fastify.log.debug(`Token extracted from auth.${key}`);
          break;
        }
      }
    }

    return token;
  }

  private isValidJWTFormat(token: string): boolean {
    if (typeof token !== 'string' || token.length < 10) return false;
    const parts = token.split('.');
    return parts.length === 3;
  }

  private async checkAuthRateLimit(ip: string, token: string): Promise<boolean> {
    try {
      const key = `auth_rate_limit:${ip}`;
      const current = await this.generalRedis.get(key);
      const limit = 10; // 10 auth attempts per minute per IP
      
      if (!current) {
        await this.generalRedis.setex(key, 60, '1');
        return true;
      }
      
      const count = parseInt(current);
      if (count >= limit) {
        return false;
      }
      
      await this.generalRedis.incr(key);
      return true;
      
    } catch (error) {
      this.fastify.log.warn('Rate limiting check failed:', error);
      return true; // Allow on error
    }
  }

  private async getUser(userId: string) {
    try {
      const { prisma } = await import('@cryb/database');
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          isVerified: true,
          lastSeenAt: true,
          bannedAt: true
        }
      });
    } catch (error) {
      this.fastify.log.error('Database query failed:', error);
      return null;
    }
  }

  public setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: any) {
    const userId = socket.userId;
    
    // Track connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    this.fastify.log.info(`🔌 User connected: ${socket.displayName} (${socket.username}) [${socket.id}]`);

    // Join user room for notifications
    socket.join(`user:${userId}`);

    // Update presence
    this.updatePresence(userId, {
      status: 'online',
      lastSeen: new Date(),
      socketId: socket.id
    });

    // Setup event handlers
    this.setupRealtimeEvents(socket);

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Send ready event
    socket.emit('ready', {
      user: {
        id: socket.userId,
        username: socket.username,
        displayName: socket.displayName
      },
      session_id: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  private setupRealtimeEvents(socket: any) {
    // Heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
      this.updatePresence(socket.userId, {
        status: 'online',
        lastSeen: new Date(),
        socketId: socket.id
      });
    });

    // Presence updates
    socket.on('presence:update', (data: any) => {
      this.updatePresence(socket.userId, {
        status: data.status || 'online',
        activity: data.activity,
        lastSeen: new Date(),
        socketId: socket.id
      });

      // Broadcast presence update
      socket.broadcast.emit('presence:update', {
        user_id: socket.userId,
        status: data.status || 'online',
        activity: data.activity
      });
    });

    // Typing indicators
    socket.on('typing:start', (data: { channelId: string }) => {
      this.handleTypingStart(socket, data.channelId);
    });

    socket.on('typing:stop', (data: { channelId: string }) => {
      this.handleTypingStop(socket, data.channelId);
    });

    // Basic messaging (can be expanded)
    socket.on('message:send', (data: any) => {
      // Basic message relay for testing
      socket.to(`channel:${data.channelId}`).emit('message:new', {
        id: Date.now().toString(),
        channelId: data.channelId,
        content: data.content,
        user: {
          id: socket.userId,
          username: socket.username,
          displayName: socket.displayName
        },
        timestamp: new Date().toISOString()
      });
    });

    this.fastify.log.info(`✅ Real-time events configured for user ${socket.username}`);
  }

  private handleTypingStart(socket: any, channelId: string) {
    const key = `${socket.userId}:${channelId}`;
    
    // Clear existing timeout
    if (this.typingIndicators.has(key)) {
      clearTimeout(this.typingIndicators.get(key)!);
    }

    // Broadcast typing start
    socket.to(`channel:${channelId}`).emit('typing:user_start', {
      userId: socket.userId,
      channelId,
      timestamp: Date.now()
    });

    // Auto-stop after 5 seconds
    const timeout = setTimeout(() => {
      this.handleTypingStop(socket, channelId);
      this.typingIndicators.delete(key);
    }, 5000);

    this.typingIndicators.set(key, timeout);
  }

  private handleTypingStop(socket: any, channelId: string) {
    const key = `${socket.userId}:${channelId}`;
    
    if (this.typingIndicators.has(key)) {
      clearTimeout(this.typingIndicators.get(key)!);
      this.typingIndicators.delete(key);
    }

    socket.to(`channel:${channelId}`).emit('typing:user_stop', {
      userId: socket.userId,
      channelId,
      timestamp: Date.now()
    });
  }

  private updatePresence(userId: string, presence: any) {
    this.presenceData.set(userId, presence);
    
    // Store in Redis with error handling
    this.generalRedis.setex(
      `presence:${userId}`,
      300, // 5 minutes
      JSON.stringify(presence)
    ).catch(error => {
      this.fastify.log.warn('Failed to store presence in Redis:', error);
    });
  }

  private handleDisconnection(socket: any, reason: string) {
    const userId = socket.userId;
    
    this.fastify.log.info(`❌ User disconnected: ${socket.displayName} (${reason})`);

    // Remove from connection tracking
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId)!.delete(socket.id);
      if (this.connectedUsers.get(userId)!.size === 0) {
        this.connectedUsers.delete(userId);
        
        // Update presence to offline only if no other connections
        this.updatePresence(userId, {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        });
      }
    }

    // Clean up typing indicators
    this.typingIndicators.forEach((timeout, key) => {
      if (key.startsWith(`${userId}:`)) {
        clearTimeout(timeout);
        this.typingIndicators.delete(key);
      }
    });
  }

  public getSocketServer(): Server {
    return this.io;
  }

  public getMetrics() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: Array.from(this.connectedUsers.values())
        .reduce((total, sockets) => total + sockets.size, 0),
      presenceEntries: this.presenceData.size,
      typingIndicators: this.typingIndicators.size
    };
  }

  public async close() {
    try {
      // Clear all timeouts
      this.typingIndicators.forEach(timeout => clearTimeout(timeout));
      this.typingIndicators.clear();

      // Close Socket.IO
      this.io.close();

      // Close Redis connections
      await Promise.allSettled([
        this.pubClient.quit(),
        this.subClient.quit(),
        this.generalRedis.quit()
      ]);

      this.fastify.log.info('✅ Fixed Socket.IO authentication system closed gracefully');
      
    } catch (error) {
      this.fastify.log.error('Error closing Socket.IO system:', error);
    }
  }
}

/**
 * Factory function to initialize the fixed Socket.IO authentication system
 */
export function createFixedSocketAuth(fastify: FastifyInstance): FixedSocketAuth {
  const socketAuth = new FixedSocketAuth(fastify);
  
  // Setup authentication middleware
  socketAuth.setupAuthentication();
  
  // Setup event handlers
  socketAuth.setupEventHandlers();
  
  fastify.log.info('🎉 Fixed Socket.IO authentication system initialized successfully');
  
  return socketAuth;
}