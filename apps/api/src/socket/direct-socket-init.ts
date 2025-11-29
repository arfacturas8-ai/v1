import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';

/**
 * DIRECT SOCKET.IO INITIALIZATION
 * 
 * This bypasses all the complex crash-safe initialization and directly
 * creates a working Socket.io server attached to Fastify.
 */

export interface DirectSocket extends Socket {
  userId?: string;
  username?: string;
  isAuthenticated?: boolean;
}

export async function initializeDirectSocket(fastify: FastifyInstance): Promise<Server> {
  fastify.log.info('🔌 Initializing Direct Socket.io...');
  
  try {
    // Wait for server to be ready
    await fastify.ready();
    
    // Create Socket.io server directly attached to Fastify
    const io = new Server(fastify.server, {
      path: '/socket.io/',
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      serveClient: false,
      cookie: false
    });

    // Simple authentication middleware
    io.use(async (socket: DirectSocket, next) => {
      try {
        // Get token from auth object
        const token = socket.handshake.auth?.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // For testing, accept any valid JWT structure
        try {
          const jwt = require('jsonwebtoken');
          const payload = jwt.decode(token);
          
          if (payload && payload.userId) {
            socket.userId = payload.userId;
            socket.username = payload.username || payload.email?.split('@')[0] || 'testuser';
            socket.isAuthenticated = true;
            
            fastify.log.info(`✅ Socket authenticated: ${socket.username} (${socket.userId})`);
            next();
          } else {
            next(new Error('Invalid token payload'));
          }
        } catch (jwtError) {
          next(new Error('Invalid token format'));
        }
      } catch (error) {
        fastify.log.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    io.on('connection', (socket: DirectSocket) => {
      fastify.log.info(`🔌 User connected: ${socket.username} (${socket.id})`);

      // Send ready event
      socket.emit('ready', {
        user: {
          id: socket.userId,
          username: socket.username,
          displayName: socket.username
        },
        session_id: socket.id,
        heartbeat_interval: 25000,
        application: {
          id: 'cryb-platform',
          name: 'CRYB Platform',
          version: '2.0.0'
        }
      });

      // Basic event handlers
      socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('channel:join', (data) => {
        socket.join(`channel:${data.channelId}`);
        socket.emit('channel:joined', { channel_id: data.channelId });
      });

      socket.on('message:send', (data) => {
        const message = {
          id: `msg_${Date.now()}`,
          channelId: data.channelId,
          content: data.content,
          user: {
            id: socket.userId,
            username: socket.username
          },
          createdAt: new Date()
        };
        
        io.to(`channel:${data.channelId}`).emit('message:create', message);
      });

      socket.on('typing:start', (data) => {
        socket.to(`channel:${data.channelId}`).emit('typing:start', {
          channel_id: data.channelId,
          user_id: socket.userId
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(`channel:${data.channelId}`).emit('typing:stop', {
          channel_id: data.channelId,
          user_id: socket.userId
        });
      });

      socket.on('presence:update', (data) => {
        socket.broadcast.emit('presence:update', {
          user_id: socket.userId,
          status: data.status
        });
      });

      socket.on('disconnect', (reason) => {
        fastify.log.info(`❌ User disconnected: ${socket.username} - ${reason}`);
      });

      socket.on('error', (error) => {
        fastify.log.error(`Socket error for ${socket.username}:`, error);
      });
    });

    fastify.log.info('✅ Direct Socket.io initialized successfully');
    fastify.log.info(`🔗 Socket.io endpoint: /socket.io/`);
    
    return io;

  } catch (error) {
    fastify.log.error('💥 Direct Socket.io initialization failed:', error);
    throw error;
  }
}