import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { prisma, ensureDatabaseConnection } from "@cryb/database";
import Fastify, { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

// Import crash-safe socket system
import { setupCrashSafeSocket, registerHealthEndpoints } from './socket/crash-safe-integration';

// Import essential routes for testing
import authRoutes from './routes/auth';
import communityRoutes from './routes/communities';
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import postRoutes from './routes/posts';
import serverRoutes from './routes/servers';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

/**
 * Minimal API Server for Testing
 */

async function initializeDatabase() {
  try {
    console.log('🔄 Attempting to connect to database...');
    await ensureDatabaseConnection(3);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function start() {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Build the Fastify application
    const app = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'development' ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
          }
        } : undefined
      }
    });

    // ============================================
    // CORE MIDDLEWARE
    // ============================================
    
    // CORS configuration
    await app.register(cors, {
      origin: (origin, cb) => {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:19001').split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'), false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-client-version', 'x-request-id']
    });

    // JWT configuration 
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

    // File upload support
    await app.register(multipart, {
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10
      }
    });

    // ============================================
    // REDIS CONNECTIONS
    // ============================================
    
    const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
    const generalRedisClient = new Redis(redisUrl);
    
    app.decorate('redis', generalRedisClient);

    // ============================================
    // SOCKET.IO INTEGRATION
    // ============================================
    
    // Initialize the crash-safe socket system
    const socketIntegration = await setupCrashSafeSocket(app);
    
    // Register health endpoints for socket system
    registerHealthEndpoints(app, socketIntegration);
    
    // Decorate app with socket integration for route access
    app.decorate('socketIntegration', socketIntegration);

    console.log('🔌 Socket.io integration initialized successfully!');
    console.log('📡 Real-time features active:');
    console.log('   - Discord-style messaging and events');
    console.log('   - Real-time presence and typing indicators');
    console.log('   - Voice channel state management');
    console.log('   - Comprehensive JWT authentication');
    console.log('   - Crash-safe error handling');

    // ============================================
    // MIDDLEWARE SETUP
    // ============================================
    
    // Request logging
    app.addHook('onRequest', requestLogger);
    
    // Global error handler
    app.setErrorHandler(errorHandler);

    // ============================================
    // API ROUTES REGISTRATION
    // ============================================
    
    // Public routes
    await app.register(authRoutes, { prefix: '/api/v1/auth' });
    
    // Public routes (with optional auth)
    await app.register(communityRoutes, { prefix: '/api/v1/communities' });
    await app.register(postRoutes, { prefix: '/api/v1/posts' });
    
    // Protected routes
    await app.register(async function (app) {
      app.addHook('onRequest', authMiddleware);
      
      await app.register(serverRoutes, { prefix: '/api/v1/servers' });
      await app.register(channelRoutes, { prefix: '/api/v1/channels' });
      await app.register(messageRoutes, { prefix: '/api/v1/messages' });
    });

    console.log('📡 Essential API routes registered:');
    console.log('   - Authentication endpoints');
    console.log('   - Community management (Reddit-style)');
    console.log('   - Server management (Discord-style)');
    console.log('   - Channel management');
    console.log('   - Message endpoints');
    console.log('   - Post endpoints');

    // Add health endpoint
    app.get('/health', async (request, reply) => {
      const checks = {
        api: 'healthy',
        database: 'checking',
        realtime: 'checking'
      };

      const dbHealthy = await ensureDatabaseConnection(1);
      checks.database = dbHealthy ? 'healthy' : 'unhealthy';
      
      // Check real-time system health
      const realtimeHealth = socketIntegration.getHealthStatus();
      checks.realtime = realtimeHealth.status === 'healthy' ? 'healthy' : 'degraded';

      const allHealthy = Object.values(checks).every(status => status === 'healthy');
      
      return reply
        .code(allHealthy ? 200 : 503)
        .send({
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          checks,
          realtime: {
            status: realtimeHealth.status,
            connections: realtimeHealth.metrics?.socket?.activeConnections || 0,
            uptime: realtimeHealth.uptime || 0
          }
        });
    });

    // Server configuration
    const PORT = parseInt(process.env.PORT || '3002');
    const HOST = process.env.HOST || '0.0.0.0';
    
    // Start the server
    await app.listen({ 
      port: PORT, 
      host: HOST
    });
    
    console.log(`🚀 CRYB Minimal API Server started successfully!`);
    console.log(`📡 Server listening at http://${HOST}:${PORT}`);
    console.log(`🔍 Health checks available at http://${HOST}:${PORT}/health`);
    console.log(`🔌 Socket.io health at http://${HOST}:${PORT}/health/socket`);
    console.log(`📊 Socket.io metrics at http://${HOST}:${PORT}/metrics/socket`);
    
    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`🔄 Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();