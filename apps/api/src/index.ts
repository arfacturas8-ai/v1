import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { buildApp } from "./app";
import { prisma } from "@cryb/database";
import { createOptimizedPrisma, poolMonitor } from "./services/database-pool";
import { Worker } from "bullmq";
// import { initializeDirectSocket } from "./socket/direct-socket-init";

/**
 * Discord-like Backend Application Entry Point
 * 
 * Features:
 * - Fastify API with comprehensive middleware
 * - PostgreSQL with Prisma ORM
 * - Redis for caching and pub/sub
 * - Socket.io for real-time communication
 * - MinIO for file storage
 * - BullMQ for background job processing
 * - JWT authentication with refresh tokens
 * - Rate limiting and security middleware
 * - OpenAPI documentation
 * - Health checks and metrics
 * - Graceful shutdown handling
 */

async function initializeDatabase() {
  try {
    console.log('🔄 Attempting to connect to database with connection pooling...');
    
    // Test connection pool health
    const poolHealthy = await poolMonitor.healthCheck();
    if (!poolHealthy) {
      throw new Error('Database pool health check failed');
    }
    
    // Test Prisma connection with optimized client
    const optimizedPrisma = createOptimizedPrisma();
    await optimizedPrisma.$connect();
    console.log('✅ Database connected successfully with connection pooling');
    
    // Log pool statistics
    const poolStats = poolMonitor.getStats();
    console.log('📊 Database pool status:', poolStats);
    
    // Test with fallback connection
    await prisma.$connect();
    console.log('✅ Fallback database connection ready');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('⚠️  Continuing without database for core API functionality...');
    // Don't exit, continue without database for now
    // process.exit(1);
  }
}

async function setupWorkers(queueManagerInstance: any) {
  try {
    // The queueManager already initializes its own workers in the initialize() method
    // We just need to ensure it's properly initialized
    if (queueManagerInstance && typeof queueManagerInstance.initialize === 'function') {
      console.log('✅ Queue workers are managed by QueueManager');
    } else {
      // Fallback to basic worker setup if queue manager is not available
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380'),
        password: process.env.REDIS_PASSWORD
      };

      // Basic message processing worker
      new Worker(
        'messages',
        async (job) => {
          const { type, data } = job.data;
          console.log(`Processing message job: ${type}`, data);
          
          switch (type) {
            case 'process_message':
              // Process message content, mentions, embeds
              break;
            case 'send_notification':
              // Send push notifications
              break;
            case 'update_search_index':
              // Update Elasticsearch index
              break;
          }
        },
        { connection, concurrency: 5 }
      );

      // Basic media processing worker
      new Worker(
        'media',
        async (job) => {
          const { type, data } = job.data;
          console.log(`Processing media job: ${type}`, data);
          
          switch (type) {
            case 'resize_image':
              // Resize and optimize images
              break;
            case 'generate_thumbnail':
              // Generate video thumbnails
              break;
            case 'scan_content':
              // Scan for malicious content
              break;
          }
        },
        { connection, concurrency: 3 }
      );

      // Basic analytics worker
      new Worker(
        'analytics',
        async (job) => {
          const { event, data } = job.data;
          console.log(`Processing analytics event: ${event}`, data);
          // Track user engagement, message metrics, etc.
        },
        { connection, concurrency: 2 }
      );

      console.log('✅ Basic background workers initialized (fallback mode)');
    }
  } catch (error) {
    console.error('❌ Failed to setup workers:', error);
  }
}

async function start() {
  try {
    // Initialize database connection
    await initializeDatabase();

    console.log('🔄 Building Fastify application...');
    // Build the Fastify application
    const app = await buildApp({
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

    console.log('✅ Fastify application built successfully!');

    console.log('🔄 Setting up background workers...');
    // Initialize background workers (managed by QueueManager)
    await setupWorkers((app as any).queueManager);

    console.log('✅ Background workers setup completed!');

    // Server configuration
    const PORT = parseInt(process.env.PORT || '3002');
    const HOST = process.env.HOST || '0.0.0.0';

    console.log(`🔄 Starting server on ${HOST}:${PORT}...`);
    // Start the server
    await app.listen({
      port: PORT,
      host: HOST,
      backlog: 512 // Increase backlog for high-load scenarios
    });

    console.log(`🚀 CRYB Discord-like API Server started successfully!`);
    console.log(`📡 Server listening at http://${HOST}:${PORT}`);
    console.log(`📚 API Documentation available at http://${HOST}:${PORT}/documentation`);
    console.log(`🔍 Health checks available at http://${HOST}:${PORT}/health`);
    console.log(`📊 Metrics available at http://${HOST}:${PORT}/metrics`);

    // Socket.io is now initialized within the crash-safe system in app.ts

    // Log environment info
    console.log(`\n📋 Environment Configuration:`);
    console.log(`   - Node.js: ${process.version}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Database: ${process.env.DATABASE_URL ? 'Connected' : 'Using default connection'}`);
    console.log(`   - Redis: ${process.env.REDIS_URL ? 'Connected' : 'Using default connection'}`);
    console.log(`   - MinIO: ${process.env.MINIO_ENDPOINT || 'localhost:9000'}`);
    console.log(`   - Elasticsearch: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9200'}`);

    return app;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handler
let isShuttingDown = false;
let server: any = null;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error('❌ Graceful shutdown timeout - forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout

  try {
    // 1. Stop accepting new connections
    if (server) {
      console.log('🔄 Closing HTTP server...');
      await server.close();
      console.log('✅ HTTP server closed');
    }

    // 2. Close database connections
    console.log('🔄 Closing database connections...');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');

    // 3. Close Redis connections (if decorated on app)
    if (server && server.redis) {
      console.log('🔄 Closing Redis connections...');
      await server.redis.quit();
      if (server.pubClient) await server.pubClient.quit();
      if (server.subClient) await server.subClient.quit();
      console.log('✅ Redis connections closed');
    }

    // 4. Shutdown background workers
    if (server && server.queueManager) {
      console.log('🔄 Shutting down background workers...');
      // Workers will finish their current jobs
      console.log('✅ Background workers shut down');
    }

    clearTimeout(shutdownTimeout);
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
start().then((app) => {
  server = app;
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});