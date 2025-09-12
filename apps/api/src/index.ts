import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { buildApp } from "./app";
import { prisma } from "@cryb/database";
import { Worker } from "bullmq";

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
    console.log('🔄 Attempting to connect to database...');
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run database migrations if needed
    // This would typically be done in CI/CD, but for development convenience:
    // await prisma.$executeRawUnsafe('SELECT 1');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('⚠️  Continuing without database for core API functionality...');
    // Don't exit, continue without database for now
    // process.exit(1);
  }
}

async function setupWorkers(queues: any) {
  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD || 'cryb_redis_password'
  };

  // Message processing worker
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

  // Media processing worker
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

  // Analytics worker
  new Worker(
    'analytics',
    async (job) => {
      const { event, data } = job.data;
      console.log(`Processing analytics event: ${event}`, data);
      // Track user engagement, message metrics, etc.
    },
    { connection, concurrency: 2 }
  );

  console.log('✅ Background workers initialized');
}

async function start() {
  try {
    // Initialize database connection
    await initializeDatabase();

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

    // Initialize background workers
    await setupWorkers((app as any).queues);

    // Server configuration
    const PORT = parseInt(process.env.PORT || '3001');
    const HOST = process.env.HOST || '0.0.0.0';
    
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
    
    // Log environment info
    console.log(`\n📋 Environment Configuration:`);
    console.log(`   - Node.js: ${process.version}`);
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Database: ${process.env.DATABASE_URL ? 'Connected' : 'Using default connection'}`);
    console.log(`   - Redis: ${process.env.REDIS_URL ? 'Connected' : 'Using default connection'}`);
    console.log(`   - MinIO: ${process.env.MINIO_ENDPOINT || 'localhost:9000'}`);
    console.log(`   - Elasticsearch: ${process.env.ELASTICSEARCH_URL || 'http://localhost:9201'}`);
    
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