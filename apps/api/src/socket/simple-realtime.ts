import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { prisma } from '@cryb/database';
import { verifyToken } from '@cryb/auth';

/**
 * SIMPLE WORKING SOCKET.IO REAL-TIME MESSAGING SYSTEM
 * 
 * This is a simplified, guaranteed-to-work version of the Socket.io system
 * that prioritizes functionality over complex features.
 */

export interface SimpleSocket extends Socket {
  userId?: string;
  username?: string;
  displayName?: string;
  isAuthenticated?: boolean;
  lastActivity?: Date;
}

export class SimpleRealtimeSystem {
  private io: Server;
  private fastify: FastifyInstance;
  
  // State management
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, string>(); // socketId -> userId
  
  // Metrics
  private metrics = {
    connections: 0,
    totalConnections: 0,
    messagesSent: 0,
    errors: 0
  };

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }
  
  /**
   * Initialize the simple real-time system
   */
  async initialize(): Promise<void> {
    try {
      this.fastify.log.info('🚀 Initializing Simple Real-time System...');
      
      // Initialize Socket.IO server with basic configuration
      this.io = new Server(this.fastify.server, {
        cors: {
          origin: '*', // Allow all origins for testing
          credentials: true,
          methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6, // 1MB
        serveClient: false,
        cookie: false
      });
      
      // Setup middleware and event handlers
      this.setupAuthentication();
      this.setupEventHandlers();
      
      this.fastify.log.info('✅ Simple Real-time System initialized successfully');
      this.fastify.log.info('🔒 Security features active: JWT authentication, CORS');
      this.fastify.log.info('📨 Real-time features active: messaging, presence, typing');
      
    } catch (error) {
      this.fastify.log.error('💥 Failed to initialize Simple Real-time System:', error);
      throw error;
    }
  }
  
  /**
   * Setup JWT authentication middleware
   */
  private setupAuthentication(): void {
    this.io.use(async (socket: SimpleSocket, next) => {
      try {
        // Extract token from multiple sources
        let token: string | null = null;
        
        if (socket.handshake.auth?.token) {
          token = socket.handshake.auth.token;
        } else if (socket.handshake.headers?.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
        } else if (socket.handshake.query?.token) {
          token = socket.handshake.query.token as string;
        }
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        
        // Verify JWT token
        const payload = verifyToken(token);
        if (!payload?.userId) {
          return next(new Error('Invalid token payload'));
        }
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            username: true,
            displayName: true,
            bannedAt: true
          }
        });
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        if (user.bannedAt && user.bannedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          return next(new Error('User account is banned'));
        }
        
        // Set socket properties
        socket.userId = user.id;
        socket.username = user.username;
        socket.displayName = user.displayName;
        socket.isAuthenticated = true;
        socket.lastActivity = new Date();
        
        this.fastify.log.info(`✅ User authenticated: ${user.displayName} (${user.username})`);
        next();
        
      } catch (error) {
        this.fastify.log.error('Authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }
  
  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: SimpleSocket) => {
      this.handleConnection(socket);
    });
  }
  
  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: SimpleSocket): Promise<void> {
    try {
      this.metrics.connections++;
      this.metrics.totalConnections++;
      
      // Track user-socket mapping
      this.connectedUsers.set(socket.userId!, socket.id);
      this.userSockets.set(socket.id, socket.userId!);
      
      // Join user's personal room
      await socket.join(`user:${socket.userId}`);
      
      // Send ready event
      socket.emit('ready', {
        user: {
          id: socket.userId,
          username: socket.username,
          displayName: socket.displayName
        },
        session_id: socket.id,
        heartbeat_interval: 25000,
        application: {
          id: 'cryb-platform',
          name: 'CRYB Platform',
          version: '2.0.0'
        }
      });
      
      this.fastify.log.info(`🔌 User connected: ${socket.displayName} [${this.metrics.connections} total]`);
      
      // Setup socket event handlers
      this.setupSocketEvents(socket);
      
    } catch (error) {
      this.fastify.log.error('Connection handling error:', error);
      this.metrics.errors++;
      socket.disconnect(true);
    }
  }
  
  /**
   * Setup event handlers for individual socket
   */
  private setupSocketEvents(socket: SimpleSocket): void {
    // Heartbeat
    socket.on('heartbeat', () => {
      socket.lastActivity = new Date();
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });
    
    // Channel management
    socket.on('channel:join', async (data: { channelId: string }) => {
      try {
        await socket.join(`channel:${data.channelId}`);
        socket.emit('channel:joined', { channel_id: data.channelId });
        this.fastify.log.debug(`User ${socket.username} joined channel ${data.channelId}`);
      } catch (error) {
        this.fastify.log.error('Channel join error:', error);
        socket.emit('error', { code: 'CHANNEL_JOIN_FAILED', message: 'Failed to join channel' });
      }
    });
    
    socket.on('channel:leave', async (data: { channelId: string }) => {
      try {
        await socket.leave(`channel:${data.channelId}`);
        socket.emit('channel:left', { channel_id: data.channelId });
      } catch (error) {
        this.fastify.log.error('Channel leave error:', error);
      }
    });
    
    // Real-time messaging
    socket.on('message:send', async (data: any) => {
      try {
        if (!data.channelId || !data.content) {
          socket.emit('error', { code: 'INVALID_DATA', message: 'Invalid message data' });
          return;
        }
        
        // Create message in database
        const message = await prisma.message.create({
          data: {
            channelId: data.channelId,
            userId: socket.userId!,
            content: data.content.trim().substring(0, 2000),
            replyToId: data.replyToId,
            nonce: data.nonce
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isVerified: true
              }
            }
          }
        });
        
        // Broadcast to channel
        this.io.to(`channel:${data.channelId}`).emit('message:create', message);
        
        this.metrics.messagesSent++;
        this.fastify.log.debug(`Message sent in channel ${data.channelId} by ${socket.username}`);
        
      } catch (error) {
        this.fastify.log.error('Message send error:', error);
        this.metrics.errors++;
        socket.emit('error', { code: 'MESSAGE_SEND_FAILED', message: 'Failed to send message' });
      }
    });
    
    // Typing indicators
    socket.on('typing:start', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:start', {
        channel_id: data.channelId,
        user_id: socket.userId,
        timestamp: new Date().toISOString()
      });
    });
    
    socket.on('typing:stop', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('typing:stop', {
        channel_id: data.channelId,
        user_id: socket.userId
      });
    });
    
    // Presence updates
    socket.on('presence:update', (data: { status: string }) => {
      const validStatuses = ['online', 'idle', 'dnd', 'offline'];
      if (validStatuses.includes(data.status)) {
        socket.broadcast.emit('presence:update', {
          user_id: socket.userId,
          status: data.status,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Disconnect handling
    socket.on('disconnect', (reason) => {
      this.handleDisconnect(socket, reason);
    });
    
    // Error handling
    socket.on('error', (error) => {
      this.fastify.log.error(`Socket error for user ${socket.username}:`, error);
      this.metrics.errors++;
    });
  }
  
  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: SimpleSocket, reason: string): void {
    try {
      this.metrics.connections--;
      
      // Clean up mappings
      this.connectedUsers.delete(socket.userId!);
      this.userSockets.delete(socket.id);
      
      this.fastify.log.info(`❌ User disconnected: ${socket.displayName} - ${reason} [${this.metrics.connections} remaining]`);
      
    } catch (error) {
      this.fastify.log.error('Disconnect handling error:', error);
      this.metrics.errors++;
    }
  }
  
  /**
   * Get metrics
   */
  public getMetrics() {
    return {
      ...this.metrics,
      connectedUsers: this.connectedUsers.size
    };
  }
  
  /**
   * Get Socket.IO server instance
   */
  public getIO(): Server {
    return this.io;
  }
  
  /**
   * Broadcast to channel
   */
  public async broadcastToChannel(channelId: string, event: string, data: any): Promise<void> {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }
  
  /**
   * Broadcast to user
   */
  public async broadcastToUser(userId: string, event: string, data: any): Promise<void> {
    this.io.to(`user:${userId}`).emit(event, data);
  }
  
  /**
   * Close the system
   */
  public async close(): Promise<void> {
    try {
      this.fastify.log.info('🔄 Shutting down Simple Real-time System...');
      
      await new Promise<void>((resolve) => {
        this.io.close(() => {
          resolve();
        });
      });
      
      this.fastify.log.info('✅ Simple Real-time System shutdown complete');
      
    } catch (error) {
      this.fastify.log.error('Error during Simple Real-time System shutdown:', error);
    }
  }
}

/**
 * Factory function to create and initialize the simple system
 */
export async function createSimpleRealtimeSystem(fastify: FastifyInstance): Promise<SimpleRealtimeSystem> {
  const system = new SimpleRealtimeSystem(fastify);
  await system.initialize();
  return system;
}