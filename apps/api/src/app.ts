import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import pino from 'pino';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import communityRoutes from './routes/communities';
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import web3Routes from './routes/web3';
import notificationRoutes from './routes/notifications';
import moderationRoutes from './routes/moderation';
import voiceRoutes from './routes/voice';
import searchRoutes from './routes/search';
import analyticsRoutes from './routes/analytics';
import botRoutes from './routes/bots';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import socket handlers
import { setupSocketHandlers } from './socket';

// Import services
import { ElasticsearchService } from './services/elasticsearch';
import { MinioService } from './services/minio';
import { LiveKitService } from './services/livekit';
import { NotificationService } from './services/notifications';
import { ModerationService } from './services/moderation';
import { AnalyticsService } from './services/analytics';
import { Web3Service } from './services/web3';

export async function buildApp(opts = {}): Promise<FastifyInstance> {
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  });

  const app = Fastify({
    logger,
    trustProxy: true,
    bodyLimit: 50 * 1024 * 1024, // 50MB
    ...opts
  });

  // ============================================
  // CORE MIDDLEWARE
  // ============================================
  
  // CORS configuration
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false // Configure based on needs
  });

  // JWT authentication
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    sign: {
      expiresIn: '7d'
    }
  });

  // File upload support
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 10
    }
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for'] as string || 
             req.headers['x-real-ip'] as string || 
             req.ip;
    }
  });

  // API Documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'CRYB Platform API',
        description: 'Next-generation hybrid community platform API',
        version: '1.0.0'
      },
      host: process.env.API_HOST || 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management' },
        { name: 'communities', description: 'Community operations' },
        { name: 'channels', description: 'Channel management' },
        { name: 'messages', description: 'Messaging system' },
        { name: 'posts', description: 'Reddit-style posts' },
        { name: 'web3', description: 'Web3 integration' },
        { name: 'voice', description: 'Voice & video' },
        { name: 'bots', description: 'Bot framework' }
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // ============================================
  // REDIS CONNECTIONS
  // ============================================
  
  const redisUrl = process.env.REDIS_URL || 'redis://:cryb_redis_password@localhost:6380/0';
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();
  
  app.decorate('redis', pubClient);

  // ============================================
  // QUEUES (BullMQ)
  // ============================================
  
  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6380'),
    password: process.env.REDIS_PASSWORD || 'cryb_redis_password'
  };

  const queues = {
    messages: new Queue('messages', { connection }),
    notifications: new Queue('notifications', { connection }),
    media: new Queue('media', { connection }),
    analytics: new Queue('analytics', { connection }),
    moderation: new Queue('moderation', { connection }),
    blockchain: new Queue('blockchain', { connection })
  };

  app.decorate('queues', queues);

  // ============================================
  // SERVICES
  // ============================================
  
  const services = {
    elasticsearch: new ElasticsearchService({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9201'
    }),
    minio: new MinioService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY || 'cryb_minio_admin',
      secretKey: process.env.MINIO_SECRET_KEY || 'cryb_minio_password',
      useSSL: process.env.MINIO_USE_SSL === 'true'
    }),
    livekit: new LiveKitService({
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
      apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
      apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
    }),
    notifications: new NotificationService(queues.notifications),
    moderation: new ModerationService(queues.moderation),
    analytics: new AnalyticsService(queues.analytics),
    web3: new Web3Service()
  };

  app.decorate('services', services);

  // ============================================
  // SOCKET.IO SETUP
  // ============================================
  
  const io = new Server(app.server, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002').split(','),
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e8 // 100MB
  });

  // Use Redis adapter for Socket.io scaling
  io.adapter(createAdapter(pubClient, subClient));
  
  // Setup socket handlers
  setupSocketHandlers(io, app);
  
  app.decorate('io', io);

  // ============================================
  // CUSTOM MIDDLEWARE
  // ============================================
  
  app.addHook('onRequest', requestLogger);
  app.setErrorHandler(errorHandler);

  // ============================================
  // HEALTH CHECKS
  // ============================================
  
  app.get('/health', async (request, reply) => {
    const checks = {
      api: 'healthy',
      database: 'checking',
      redis: 'checking',
      elasticsearch: 'checking',
      minio: 'checking'
    };

    try {
      // Check Redis
      await pubClient.ping();
      checks.redis = 'healthy';
    } catch (error) {
      checks.redis = 'unhealthy';
    }

    try {
      // Check Elasticsearch
      await services.elasticsearch.ping();
      checks.elasticsearch = 'healthy';
    } catch (error) {
      checks.elasticsearch = 'unhealthy';
    }

    try {
      // Check MinIO
      await services.minio.ping();
      checks.minio = 'healthy';
    } catch (error) {
      checks.minio = 'unhealthy';
    }

    const allHealthy = Object.values(checks).every(status => status === 'healthy');
    
    return reply
      .code(allHealthy ? 200 : 503)
      .send({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks
      });
  });

  app.get('/metrics', async (request, reply) => {
    // Prometheus metrics endpoint
    const metrics = {
      http_requests_total: 0,
      http_request_duration_seconds: 0,
      websocket_connections: io.engine.clientsCount,
      redis_connections: 2,
      queued_jobs: {
        messages: await queues.messages.getWaitingCount(),
        notifications: await queues.notifications.getWaitingCount(),
        media: await queues.media.getWaitingCount(),
        analytics: await queues.analytics.getWaitingCount()
      }
    };
    
    return reply.send(metrics);
  });

  // ============================================
  // API ROUTES
  // ============================================
  
  // Public routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  
  // Protected routes
  await app.register(async function (app) {
    app.addHook('onRequest', authMiddleware);
    
    await app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.register(communityRoutes, { prefix: '/api/v1/communities' });
    await app.register(channelRoutes, { prefix: '/api/v1/channels' });
    await app.register(messageRoutes, { prefix: '/api/v1/messages' });
    await app.register(postRoutes, { prefix: '/api/v1/posts' });
    await app.register(commentRoutes, { prefix: '/api/v1/comments' });
    await app.register(web3Routes, { prefix: '/api/v1/web3' });
    await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
    await app.register(moderationRoutes, { prefix: '/api/v1/moderation' });
    await app.register(voiceRoutes, { prefix: '/api/v1/voice' });
    await app.register(searchRoutes, { prefix: '/api/v1/search' });
    await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
    await app.register(botRoutes, { prefix: '/api/v1/bots' });
  });

  // ============================================
  // WEBHOOKS
  // ============================================
  
  app.post('/webhooks/livekit', async (request, reply) => {
    // LiveKit webhook handler
    const event = request.body;
    app.log.info({ event }, 'LiveKit webhook received');
    
    // Process LiveKit events
    switch (event.event) {
      case 'room_started':
        await services.analytics.trackVoiceRoomStart(event);
        break;
      case 'room_finished':
        await services.analytics.trackVoiceRoomEnd(event);
        break;
      case 'participant_joined':
        await services.analytics.trackParticipantJoin(event);
        break;
      case 'participant_left':
        await services.analytics.trackParticipantLeave(event);
        break;
    }
    
    return { received: true };
  });

  app.post('/webhooks/stripe', async (request, reply) => {
    // Stripe webhook handler for premium subscriptions
    const sig = request.headers['stripe-signature'];
    // Verify webhook signature and process payment events
    return { received: true };
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
      message: `Route ${request.method} ${request.url} not found`
    });
  });

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================
  
  process.on('SIGTERM', async () => {
    app.log.info('SIGTERM received, shutting down gracefully...');
    
    // Close Socket.io connections
    io.close();
    
    // Close Redis connections
    await pubClient.quit();
    await subClient.quit();
    
    // Close queues
    await Promise.all(Object.values(queues).map(q => q.close()));
    
    // Close Fastify
    await app.close();
    
    process.exit(0);
  });

  return app;
}