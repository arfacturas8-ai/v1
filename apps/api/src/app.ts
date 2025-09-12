import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import pino from 'pino';
import { prisma, ensureDatabaseConnection, gracefulDatabaseShutdown } from '@cryb/database';
import { initializeEnvironment } from './config/env-validation';

// Import routes
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import userRoutes from './routes/users';
import serverRoutes from './routes/servers';
import serverDiscoveryRoutes from './routes/server-discovery';
import communityRoutes from './routes/communities';
import channelRoutes from './routes/channels';
import channelPermissionRoutes from './routes/channel-permissions';
import messageRoutes from './routes/messages';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import awardRoutes from './routes/awards';
import karmaRoutes from './routes/karma';
// Conditional Web3 imports - only import when Web3 is enabled
let web3Routes: any, nftRoutes: any, tokenGatingRoutes: any, cryptoPaymentRoutes: any, cryptoTippingRoutes: any;
if (process.env.ENABLE_WEB3 === 'true') {
  web3Routes = require('./routes/web3').default;
  nftRoutes = require('./routes/nft').default;
  tokenGatingRoutes = require('./routes/token-gating').default;
  cryptoPaymentRoutes = require('./routes/crypto-payments').default;
  cryptoTippingRoutes = require('./routes/crypto-tipping').default;
}
import notificationRoutes from './routes/notifications';
import moderationRoutes from './routes/moderation';
import aiModerationRoutes from './routes/ai-moderation';
import voiceRoutes from './routes/voice';
import voiceTestRoutes from './routes/voice-test';
import searchRoutes from './routes/search';
import enhancedSearchRoutes from './routes/enhanced-search';
import analyticsRoutes from './routes/analytics';
import botRoutes from './routes/bots';
import uploadRoutes from './routes/uploads';
import enhancedUploadRoutes from './routes/enhanced-uploads';
import mediaManagementRoutes from './routes/media-management';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestValidationMiddleware, securityHeadersValidationMiddleware } from './middleware/request-validation';

// Import crash-safe socket system
import { setupCrashSafeSocket, registerHealthEndpoints } from './socket/crash-safe-integration';

// Import services
// import { CrashProofElasticsearchService } from './services/crash-proof-elasticsearch'; // Disabled due to import issues
import { EnhancedMinioService } from './services/enhanced-minio';
import { EnhancedCDNIntegrationService } from './services/enhanced-cdn-integration';
import { FileUploadService, createFileUploadService } from './services/file-upload';
import { LiveKitService } from './services/livekit';
import { NotificationService } from './services/notifications';
import { ModerationService } from './services/moderation';
import { AnalyticsService } from './services/analytics';
import { prometheusMetricsPlugin } from './services/prometheus-metrics';
// import { Web3Service } from './services/web3'; // Temporarily disabled

export async function buildApp(opts = {}): Promise<FastifyInstance> {
  // Validate environment configuration early
  const env = initializeEnvironment();
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
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:19001').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
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
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });

  // File upload support
  await app.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 10
    }
  });

  // Prometheus Metrics
  await app.register(prometheusMetricsPlugin);


  // Remove custom JSON parser - use Fastify's default JSON parsing which handles special characters properly
  // The custom JSON parser was causing issues with special characters in JSON strings
  // Fastify's default parser handles this correctly

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
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
        { name: 'nft', description: 'NFT management & profile pictures' },
        { name: 'token-gating', description: 'Token gating & access control' },
        { name: 'crypto-payments', description: 'Cryptocurrency payments & purchases' },
        { name: 'crypto-tipping', description: 'Cryptocurrency tipping & rewards system' },
        { name: 'voice', description: 'Voice & video' },
        { name: 'bots', description: 'Bot framework' },
        { name: 'ai-moderation', description: 'AI-powered moderation and content analysis' }
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
  const generalRedisClient = new Redis(redisUrl); // Dedicated client for general operations
  
  app.decorate('redis', generalRedisClient);
  app.decorate('pubClient', pubClient);
  app.decorate('subClient', subClient);

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
  
  // ============================================
  // INITIALIZE MEDIA SERVICES
  // ============================================
  
  let minioService: EnhancedMinioService | null = null;
  let cdnService: EnhancedCDNIntegrationService | null = null;
  let fileUploadService: FileUploadService | null = null;
  
  // Initialize File Upload Service independently (critical service)
  try {
    fileUploadService = createFileUploadService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      useSSL: process.env.MINIO_USE_SSL === 'true',
      cdnBaseUrl: process.env.CDN_BASE_URL
    });
    app.log.info('✅ File Upload Service initialized successfully');
  } catch (error) {
    app.log.error('❌ Failed to initialize File Upload Service:', error instanceof Error ? error.message : String(error));
  }
  
  // Initialize enhanced media services (optional)
  try {
    // Initialize Enhanced MinIO Service
    minioService = new EnhancedMinioService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      useSSL: process.env.MINIO_USE_SSL === 'true'
    });
    
    // Wait for MinIO initialization
    await minioService.waitForInitialization();
    app.log.info('✅ Enhanced MinIO Service initialized successfully');

    // Initialize CDN Integration Service with providers
    const cdnProviders = [];
    
    // Add Cloudflare CDN if configured
    if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
      cdnProviders.push({
        name: 'cloudflare',
        enabled: true,
        priority: 1,
        config: {
          baseUrl: `https://cdn.cryb.ai`,
          apiKey: process.env.CLOUDFLARE_API_TOKEN,
          zone: process.env.CLOUDFLARE_ZONE_ID,
          customHeaders: {
            'CF-Access-Client-Id': process.env.CLOUDFLARE_ACCESS_CLIENT_ID || '',
            'CF-Access-Client-Secret': process.env.CLOUDFLARE_ACCESS_CLIENT_SECRET || ''
          }
        }
      });
    }

    // Add BunnyCDN if configured
    if (process.env.BUNNYCDN_STORAGE_ZONE && process.env.BUNNYCDN_API_KEY) {
      cdnProviders.push({
        name: 'bunnycdn',
        enabled: true,
        priority: 2,
        config: {
          baseUrl: `https://${process.env.BUNNYCDN_PULLZONE_NAME}.b-cdn.net`,
          apiKey: process.env.BUNNYCDN_API_KEY,
          pullZone: process.env.BUNNYCDN_PULLZONE_NAME
        }
      });
    }

    cdnService = new EnhancedCDNIntegrationService(minioService, cdnProviders);
    app.log.info(`✅ Enhanced CDN Integration Service initialized with ${cdnProviders.length} providers`);

  } catch (error) {
    app.log.error('❌ Failed to initialize enhanced media services:', error instanceof Error ? error.message : String(error));
  }

  const services = {
    // elasticsearch: new CrashProofElasticsearchService({
    //   nodes: [(process.env.ELASTICSEARCH_URL || 'http://localhost:9201')],
    //   maxRetries: 3,
    //   requestTimeout: 30000,
    //   pingTimeout: 3000,
    //   circuitBreaker: {
    //     failureThreshold: 5,
    //     timeout: 60000,
    //     monitoringPeriod: 120000
    //   }
    // }), // Disabled due to import issues
    minio: minioService,
    cdn: cdnService,
    fileUpload: fileUploadService,
    livekit: new LiveKitService({
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
      apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
      apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
    }),
    notifications: new NotificationService(queues.notifications),
    moderation: new ModerationService(queues.moderation),
    analytics: new AnalyticsService(queues.analytics),
    // web3: new Web3Service() // Temporarily disabled
  };

  app.decorate('services', services);

  // ============================================
  // INITIALIZE SERVICES
  // ============================================
  
  // Initialize Elasticsearch service - currently disabled
  // TODO: Re-enable when elasticsearch service is properly imported
  app.log.info('⚠️ Elasticsearch service is disabled due to import issues');

  // ============================================
  // CRASH-SAFE SOCKET.IO SETUP
  // ============================================
  
  // Initialize the crash-safe socket system
  const socketIntegration = await setupCrashSafeSocket(app);
  
  // Register health endpoints for monitoring
  registerHealthEndpoints(app, socketIntegration);
  
  // Decorate app with socket integration for route access
  app.decorate('socketIntegration', socketIntegration);

  // ============================================
  // CUSTOM MIDDLEWARE
  // ============================================
  
  // Security and validation middleware (applied first)
  app.addHook('onRequest', securityHeadersValidationMiddleware());
  app.addHook('onRequest', requestValidationMiddleware({
    maxBodySize: 50 * 1024 * 1024, // 50MB
    maxQueryParams: 100,
    maxHeaders: 200,
    requireContentType: false // Allow some requests without content-type
  }));
  
  // Request logging
  app.addHook('onRequest', requestLogger);
  
  // Global error handler
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
      minio: 'checking',
      realtime: 'checking'
    };

    // Check Database with retry logic
    const dbHealthy = await ensureDatabaseConnection(1);
    checks.database = dbHealthy ? 'healthy' : 'unhealthy';

    try {
      // Check Redis (use general client for health checks)
      await generalRedisClient.ping();
      checks.redis = 'healthy';
    } catch (error) {
      checks.redis = 'unhealthy';
    }

    // Elasticsearch disabled due to import issues
    checks.elasticsearch = 'disabled';

    try {
      // Check Enhanced MinIO Service
      if (services.minio) {
        const minioHealth = await services.minio.performHealthCheck();
        checks.minio = minioHealth.status;
      } else {
        checks.minio = 'disabled';
      }
    } catch (error) {
      checks.minio = 'unhealthy';
    }

    try {
      // Check Crash-Safe Real-time Communication System
      const realtimeHealth = socketIntegration.getHealthStatus();
      checks.realtime = realtimeHealth.status === 'healthy' ? 'healthy' : 'degraded';
    } catch (error) {
      checks.realtime = 'unhealthy';
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

  // Metrics endpoint is provided by prometheus-metrics plugin

  // ============================================
  // API ROUTES
  // ============================================
  
  // Public routes
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(oauthRoutes, { prefix: '/api/v1/oauth' });
  
  // Public routes (with optional auth)
  await app.register(communityRoutes, { prefix: '/api/v1/communities' });
  await app.register(postRoutes, { prefix: '/api/v1/posts' });
  await app.register(commentRoutes, { prefix: '/api/v1/comments' });
  await app.register(awardRoutes, { prefix: '/api/v1/awards' });
  await app.register(karmaRoutes, { prefix: '/api/v1/karma' });
  // Server discovery routes are integrated into servers.ts to avoid conflicts
  
  // Voice test routes (no auth required)
  await app.register(voiceTestRoutes, { prefix: '/api/voice-test' });
  
  // Protected routes
  await app.register(async function (app) {
    app.addHook('onRequest', authMiddleware);
    
    await app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.register(serverRoutes, { prefix: '/api/v1/servers' });
    await app.register(channelRoutes, { prefix: '/api/v1/channels' });
    // Channel permission routes are integrated into channels.ts to avoid conflicts
    await app.register(messageRoutes, { prefix: '/api/v1/messages' });
    
    // Conditionally register Web3 routes
    if (process.env.ENABLE_WEB3 === 'true' && web3Routes) {
      await app.register(web3Routes, { prefix: '/api/v1/web3' });
      await app.register(nftRoutes, { prefix: '/api/v1/nft' });
      await app.register(tokenGatingRoutes, { prefix: '/api/v1/token-gating' });
      await app.register(cryptoPaymentRoutes, { prefix: '/api/v1/crypto-payments' });
      await app.register(cryptoTippingRoutes, { prefix: '/api/v1/crypto-tipping' });
    }
    await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
    await app.register(moderationRoutes, { prefix: '/api/v1/moderation' });
    await app.register(aiModerationRoutes, { prefix: '/api/v1/ai-moderation' });
    await app.register(voiceRoutes, { prefix: '/api/v1/voice' });
    await app.register(searchRoutes, { prefix: '/api/v1/search' });
    await app.register(enhancedSearchRoutes, { prefix: '/api/v1/search/enhanced' });
    await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
    await app.register(botRoutes, { prefix: '/api/v1/bots' });
    await app.register(uploadRoutes, { prefix: '/api/v1/uploads' });
    await app.register(enhancedUploadRoutes, { prefix: '/api/v1/uploads/enhanced' });
    await app.register(mediaManagementRoutes, { prefix: '/api/v1/media' });
  });

  // ============================================
  // WEBHOOKS
  // ============================================
  
  app.post('/webhooks/livekit', async (request, reply) => {
    // LiveKit webhook handler
    const event = request.body;
    app.log.info({ event }, 'LiveKit webhook received');
    
    // Process LiveKit events
    switch ((event as any).event) {
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

  app.post('/webhooks/transak', async (request, reply) => {
    // Transak webhook handler for crypto payments
    const signature = request.headers['x-transak-signature'] || request.headers['signature'];
    const { cryptoPaymentService } = await import('./services/crypto-payments');
    
    app.log.info({ 
      body: request.body,
      headers: request.headers 
    }, 'Transak webhook received');
    
    try {
      const result = await cryptoPaymentService.handleWebhook(
        request.body, 
        signature as string,
        request.headers as Record<string, string>
      );
      
      if (!result.success) {
        app.log.error({ error: result.error }, 'Transak webhook processing failed');
        return reply.code(400).send({ error: result.error });
      }
      
      return { received: true, processed: true };
    } catch (error) {
      app.log.error({ error }, 'Transak webhook error');
      return reply.code(500).send({ error: 'Webhook processing failed' });
    }
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
    
    try {
      // The crash-safe socket integration handles its own shutdown through hooks
      // registered during initialization
      
      // Close Redis connections
      await Promise.allSettled([
        generalRedisClient.quit(),
        pubClient.quit(),
        subClient.quit()
      ]);
      
      // Close queues
      await Promise.allSettled(Object.values(queues).map(q => q.close()));
      
      // Close database connection gracefully
      await gracefulDatabaseShutdown();
      
      // Close Fastify (this will trigger the socket integration shutdown hooks)
      await app.close();
      
      app.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      app.log.error('Error during graceful shutdown:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

  return app;
}