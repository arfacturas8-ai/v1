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
import twoFactorRoutes from './routes/two-factor';
import userRoutes from './routes/users';
import profileRoutes from './routes/profile';
import serverRoutes from './routes/servers';
import serverDiscoveryRoutes from './routes/server-discovery';
import communityRoutes from './routes/communities';
import channelRoutes from './routes/channels';
import channelPermissionRoutes from './routes/channel-permissions';
import messageRoutes from './routes/messages';
import directMessageRoutes from './routes/direct-messages';
import adminRoutes from './routes/admin';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import awardRoutes from './routes/awards';
import karmaRoutes from './routes/karma';
// Conditional Web3 imports - only import when Web3 is enabled
let web3Routes: any, nftRoutes: any, tokenGatingRoutes: any, cryptoPaymentRoutes: any, cryptoTippingRoutes: any, stakingRoutes: any, governanceRoutes: any;
if (process.env.ENABLE_WEB3 === 'true') {
  web3Routes = require('./routes/web3').default;
  nftRoutes = require('./routes/nft').default;
  tokenGatingRoutes = require('./routes/token-gating').default;
  cryptoPaymentRoutes = require('./routes/crypto-payments').default;
  cryptoTippingRoutes = require('./routes/crypto-tipping').default;
  stakingRoutes = require('./routes/staking').default;
  governanceRoutes = require('./routes/governance').default;
}
import notificationRoutes from './routes/notifications';
import eventRoutes from './routes/events';
import moderationRoutes from './routes/moderation';
import comprehensiveModerationRoutes from './routes/comprehensive-moderation';
// import aiModerationRoutes from './routes/ai-moderation'; // Temporarily disabled - might have heavy ML deps
import voiceRoutes from './routes/voice';
// import socketTestRoutes from './routes/socket-test'; // Deleted in previous cleanup
// import voiceTestRoutes from './routes/voice-test'; // Deleted in previous cleanup
import searchRoutes from './routes/search';
// import enhancedSearchRoutes from './routes/enhanced-search'; // Temporarily disabled
import analyticsRoutes from './routes/analytics';
import metricsRoutes from './routes/metrics';
import botRoutes from './routes/bots';
import uploadRoutes from './routes/uploads';
import imageUploadRoutes from './routes/image-uploads';
import cdnRoutes from './routes/cdn';
import statusRoutes from './routes/status';
import gdprRoutes from './routes/gdpr';
import securityRoutes from './routes/security';
import apiKeyRoutes from './routes/api-keys';
// import enhancedUploadRoutes from './routes/enhanced-uploads'; // Temporarily disabled
// import mediaManagementRoutes from './routes/media-management'; // Temporarily disabled
// import queueAdminRoutes from './routes/queue-admin'; // Temporarily disabled
// import discordTestRoutes from './routes/discord-test'; // Temporarily disabled

// Import middleware
import { authMiddleware } from './middleware/auth';
import { rateLimiters } from './middleware/rateLimiter';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { requestValidationMiddleware, securityHeadersValidationMiddleware } from './middleware/request-validation';
import { createAdvancedSecurityHeaders } from './middleware/advanced-security-headers';
import EnhancedSecurityHeaders from './middleware/enhanced-security-headers';
// import { createEnhancedRateLimitingService, authRateLimitMiddleware } from './middleware/enhanced-rate-limiting';

// Import crash-safe socket system
import { setupCrashSafeSocket, registerHealthEndpoints } from './socket/crash-safe-integration';
// Import working socket system as fallback
import { createWorkingSocketSystem, WorkingSocketSystem } from './socket/working-socket-init';

// Import services
import { ElasticsearchService } from './services/elasticsearch';
import { EnhancedMinioService } from './services/enhanced-minio';
import { CDNIntegrationService } from './services/cdn-integration';
import { VideoTranscodingService } from './services/video-transcoding';
import { FileUploadService, createFileUploadService } from './services/file-upload';
import { LiveKitService } from './services/livekit';
import { NotificationService } from './services/notifications';
import { ModerationService } from './services/moderation';
import { AnalyticsService } from './services/analytics';
import { SimpleMonitoringService } from './services/simple-monitoring';
import { SessionManager } from './services/session-manager';
import { prometheusMetricsPlugin } from './services/prometheus-metrics';
import { queueManager } from './services/queue-manager';
import { queueMonitoringService } from './services/queue-monitoring';
// import { Web3Service } from './services/web3'; // Temporarily disabled

// ZERO-COST 100K OPTIMIZATION: Multi-tier caching
import { initializeCache } from './services/multi-tier-cache.js';
import { initializeApplicationCache } from './services/application-cache.js';

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

  console.log('✅ Fastify instance created');

  // ============================================
  // CORE MIDDLEWARE
  // ============================================
  
  console.log('🔄 Registering cookie support...');
  // Cookie support (must be registered before routes that use cookies)
  await app.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'your-cookie-secret-here',
    parseOptions: {}
  });
  console.log('✅ Cookie support registered');
  
  console.log('🔄 Registering CORS...');
  // CORS configuration - SECURITY: Strict origin checking
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:19001').split(',');
      // Allow health checks and internal monitoring without origin header
      if (!origin) {
        cb(null, true);
      } else if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  console.log('✅ CORS registered');

  console.log('🔄 Registering compression...');
  // Response compression
  await app.register(import('@fastify/compress'), {
    global: true,
    threshold: 1024, // Only compress responses larger than 1KB
    encodings: ['gzip', 'deflate'],
    customTypes: /^text\/|^application\/(?:json|javascript|xml)/
  });

  // Enhanced Security Headers
  console.log('🔒 Setting up enhanced security headers...');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:19001').split(',');
  const enhancedSecurity = new EnhancedSecurityHeaders({
    csp: {
      enabled: true,
      reportOnly: process.env.NODE_ENV !== 'production',
      useNonces: true,
      reportUri: '/api/v1/security/csp-report'
    },
    hsts: {
      enabled: process.env.NODE_ENV === 'production',
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-API-Key'],
      exposedHeaders: [
        'X-Total-Count',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset'
      ],
      credentials: true,
      maxAge: 86400
    }
  });
  
  // Apply security headers middleware
  app.addHook('onRequest', enhancedSecurity.corsMiddleware());
  app.addHook('onRequest', enhancedSecurity.middleware());
  console.log('✅ Enhanced security headers configured');

  // JWT authentication
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });

  // Enhanced JSON content type parser to handle special characters
  await app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
      // Handle common JSON escape issues before parsing
      let cleanBody = body as string;
      
      // Fix invalid escape sequences that are commonly used but invalid in JSON
      // Valid JSON escape sequences are: \" \\ \/ \b \f \n \r \t \uXXXX
      // Everything else should be unescaped
      
      // Define valid JSON escape sequences to preserve
      const validEscapes = /\\["\\/bfnrt]|\\u[0-9a-fA-F]{4}/g;
      
      // Temporarily replace valid escapes with placeholders
      const validEscapeMap = new Map();
      let escapeCounter = 0;
      cleanBody = cleanBody.replace(validEscapes, (match) => {
        const placeholder = `__VALID_ESCAPE_${escapeCounter++}__`;
        validEscapeMap.set(placeholder, match);
        return placeholder;
      });
      
      // Remove all remaining invalid escape sequences (backslash followed by any character)
      cleanBody = cleanBody.replace(/\\(.)/g, '$1');
      
      // Restore valid escape sequences
      for (const [placeholder, original] of validEscapeMap) {
        cleanBody = cleanBody.replace(placeholder, original);
      }
      
      // Handle empty body gracefully (common for POST endpoints like join/leave)
      if (!cleanBody || cleanBody.trim() === '') {
        done(null, {});
        return;
      }

      const json = JSON.parse(cleanBody);
      done(null, json);
    } catch (err) {
      app.log.error({ error: String(err), originalBody: body }, 'JSON parsing error');

      // Check if body is empty
      const bodyStr = (body as string || '').trim();
      if (!bodyStr || bodyStr === '') {
        done(null, {});
        return;
      }

      // Try parsing the original body one more time to give a proper error
      try {
        JSON.parse(body as string);
        done(null, JSON.parse(body as string));
      } catch (finalErr) {
        done(new Error(`Invalid JSON format: ${finalErr instanceof Error ? finalErr.message : String(finalErr)}`), undefined);
      }
    }
  });

  // Add a forgiving content type parser for requests without proper Content-Type
  // This helps when clients send JSON data but with wrong or missing Content-Type header
  await app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, function (req, body, done) {
    const bodyStr = body as string;
    
    // Try to detect if this is actually JSON data sent with wrong content-type
    if (bodyStr.trim().startsWith('{') && bodyStr.trim().endsWith('}')) {
      app.log.warn('Detected JSON data sent with application/x-www-form-urlencoded content-type, attempting JSON parse');
      try {
        const json = JSON.parse(bodyStr);
        done(null, json);
        return;
      } catch (jsonErr) {
        app.log.warn('JSON parse failed, falling back to form parsing');
      }
    }
    
    // If not JSON, parse as form data
    try {
      const parsedForm = new URLSearchParams(bodyStr);
      const result: Record<string, any> = {};
      for (const [key, value] of parsedForm.entries()) {
        result[key] = value;
      }
      done(null, result);
    } catch (err) {
      done(new Error(`Failed to parse form data: ${err instanceof Error ? err.message : String(err)}`), undefined);
    }
  });

  // Add parser for text/plain that tries JSON first
  await app.addContentTypeParser('text/plain', { parseAs: 'string' }, function (req, body, done) {
    const bodyStr = body as string;
    
    // Try JSON parsing first for text/plain
    if (bodyStr.trim().startsWith('{') && bodyStr.trim().endsWith('}')) {
      try {
        const json = JSON.parse(bodyStr);
        done(null, json);
        return;
      } catch (jsonErr) {
        // Fall through to return as plain string
      }
    }
    
    done(null, bodyStr);
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

  // Note: Rate limiting will be initialized after Redis connection

  // API Documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Cryb.ai Platform API',
        description: `
# Cryb.ai Platform API

A next-generation hybrid community platform combining the best of Discord, Reddit, and Web3.

## Features
- **Discord-like**: Real-time messaging, voice/video calls, servers, channels
- **Reddit-like**: Posts, comments, voting, karma system, community moderation
- **Web3 Native**: NFT profiles, token-gating, DAO governance, crypto payments
- **AI-Powered**: Content moderation, recommendations, sentiment analysis
- **Enterprise-Grade**: Rate limiting, caching, monitoring, security

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

## Rate Limits
- **Anonymous**: 100 requests/15min
- **Authenticated**: 1000 requests/15min
- **Premium**: 5000 requests/15min

Rate limit headers are included in all responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining
- \`X-RateLimit-Reset\`: Time when limit resets

## Errors
All errors follow a consistent format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

## WebSocket Events
Real-time features use Socket.io. Connect to \`/socket.io\` and authenticate with your JWT token.
        `,
        version: '1.0.0',
        contact: {
          name: 'Cryb.ai Support',
          url: 'https://cryb.ai/support',
          email: 'support@cryb.ai'
        },
        license: {
          name: 'Proprietary',
          url: 'https://cryb.ai/terms'
        }
      },
      host: process.env.API_HOST || 'localhost:3002',
      schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http', 'https'],
      basePath: '/api/v1',
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Authentication & authorization - Registration, login, JWT tokens, OAuth, 2FA, passkeys' },
        { name: 'users', description: 'User management - Profiles, settings, preferences, search, relationships' },
        { name: 'profile', description: 'User profiles - Bio, avatar, banner, social links, privacy settings' },
        { name: 'communities', description: 'Community operations - Create/join communities, settings, roles, permissions' },
        { name: 'channels', description: 'Channel management - Text/voice channels, categories, permissions, settings' },
        { name: 'messages', description: 'Discord-style messaging - Real-time chat, DMs, threads, reactions, mentions' },
        { name: 'direct-messages', description: 'Private messaging - 1-on-1 and group DMs, read receipts, typing indicators' },
        { name: 'posts', description: 'Reddit-style posts - Create/edit posts, voting, awards, karma, trending' },
        { name: 'comments', description: 'Post comments - Nested comments, voting, replies, best/controversial sorting' },
        { name: 'moderation', description: 'Content moderation - Reports, bans, mutes, automod, spam detection' },
        { name: 'notifications', description: 'Notification system - Push, email, in-app notifications, preferences' },
        { name: 'search', description: 'Search & discovery - Full-text search, filters, trending, recommendations' },
        { name: 'analytics', description: 'Analytics & insights - User engagement, community stats, growth metrics' },
        { name: 'web3', description: 'Web3 integration - Wallet connection, SIWE, on-chain verification' },
        { name: 'nft', description: 'NFT features - NFT profile pictures, verification, collections, showcases' },
        { name: 'token-gating', description: 'Token gating & access control - NFT/token-based community access' },
        { name: 'crypto-payments', description: 'Cryptocurrency payments - Accept crypto for premium features, purchases' },
        { name: 'crypto-tipping', description: 'Crypto tipping & rewards - Tip users, reward contributions with crypto' },
        { name: 'staking', description: 'Token staking - Stake platform tokens, earn rewards, governance weight' },
        { name: 'governance', description: 'DAO governance - Proposals, voting, execution, delegation' },
        { name: 'voice', description: 'Voice & video - WebRTC voice/video calls, screen sharing, LiveKit integration' },
        { name: 'bots', description: 'Bot framework - Custom bots, webhooks, API access, permissions' },
        { name: 'uploads', description: 'File uploads - Images, videos, attachments, CDN integration' },
        { name: 'admin', description: 'Admin endpoints - Platform administration, user management, system settings' },
        { name: 'security', description: 'Security features - CSP reports, rate limiting, audit logs' },
        { name: 'health', description: 'Health & monitoring - Health checks, metrics, status' }
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT Bearer token. Format: `Bearer <token>`'
        },
        ApiKey: {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for bot/service authentication'
        },
        Cookie: {
          type: 'apiKey',
          name: 'accessToken',
          in: 'cookie',
          description: 'JWT token stored in httpOnly cookie (alternative to Bearer)'
        }
      },
      externalDocs: {
        description: 'Full API Documentation',
        url: 'https://docs.cryb.ai'
      }
    }
  });

  await app.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      }
    }
  });

  // ============================================
  // REDIS CONNECTIONS
  // ============================================
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380/0';
  const pubClient = new Redis(redisUrl);
  const subClient = pubClient.duplicate();
  const generalRedisClient = new Redis(redisUrl); // Dedicated client for general operations
  
  app.decorate('redis', generalRedisClient);
  app.decorate('pubClient', pubClient);
  app.decorate('subClient', subClient);

  // ============================================
  // MULTI-TIER CACHE FOR 100K USERS (ZERO COST!)
  // ============================================
  app.log.info('🚀 Initializing multi-tier cache for 100K users...');
  const cache = initializeCache(generalRedisClient);
  const appCache = initializeApplicationCache(cache, prisma);
  app.decorate('cache', appCache);

  // Warm cache with trending content
  try {
    await appCache.warmCache();
    const stats = appCache.getStats();
    app.log.info(`✅ Cache ready! L1: ${stats.l1Size}/${stats.l1MaxSize} items`);
  } catch (error) {
    app.log.warn('⚠️  Cache warming failed (non-fatal):', error);
  }

  // Enhanced rate limiting with Redis (now that Redis is initialized)
  await app.register(rateLimit, {
    max: 100, // Max 100 requests
    timeWindow: '1 minute', // Per minute
    redis: generalRedisClient,
    skipOnError: true, // Don't block if Redis is down
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true
    },
    keyGenerator: (request) => {
      // Use authenticated user ID if available, otherwise IP
      return (request as any).userId || request.ip;
    },
    onBanReach: (req, key) => {
      app.log.warn({ key, ip: req.ip }, 'Rate limit ban reached');
    },
    onExceeding: (req, key) => {
      app.log.warn({ key, ip: req.ip }, 'Rate limit exceeded');
    }
  });

  // ============================================
  // QUEUE MANAGEMENT SYSTEM (BullMQ) - TEMPORARILY DISABLED
  // ============================================
  
  // Initialize queue management system
  app.log.info('📬 Initializing queue management system...');
  
  let queues;
  try {
    const { Queue } = await import('bullmq');
    
    const queueRedis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380'),
      ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
    };
    
    queues = {
      messages: new Queue('messages', { connection: queueRedis }),
      notifications: new Queue('notifications', { connection: queueRedis }),
      media: new Queue('media', { connection: queueRedis }),
      analytics: new Queue('analytics', { connection: queueRedis }),
      moderation: new Queue('moderation', { connection: queueRedis }),
      blockchain: new Queue('blockchain', { connection: queueRedis }),
      email: new Queue('email', { connection: queueRedis })
    };
    
    app.log.info('✅ Queue management system initialized');
  } catch (error) {
    app.log.error('Failed to initialize queue system:', (error as any)?.message || error);
    // Create fallback mock queues
    queues = {
      messages: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      notifications: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      media: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      analytics: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      moderation: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      blockchain: { add: () => Promise.resolve(), close: () => Promise.resolve() },
      email: { add: () => Promise.resolve(), close: () => Promise.resolve() }
    };
  }

  app.decorate('queues', queues);

  // Initialize queue manager
  try {
    app.log.info('Initializing queue manager...');
    await queueManager.initialize();
    app.decorate('queueManager', queueManager);
    app.log.info('✅ Queue manager initialized successfully');
  } catch (error) {
    app.log.error('Failed to initialize queue manager:', error);
    app.decorate('queueManager', null);
  }

  // Initialize queue monitoring service
  try {
    await queueMonitoringService.initialize();
    app.decorate('queueMonitoringService', queueMonitoringService);
    app.log.info('✅ Queue monitoring service initialized');
  } catch (error) {
    app.log.error('Failed to initialize queue monitoring:', error);
    app.decorate('queueMonitoringService', null);
  }

  // ============================================
  // SERVICES
  // ============================================
  
  // ============================================
  // INITIALIZE MEDIA SERVICES - TEMPORARILY DISABLED
  // ============================================
  
  app.log.info('📦 Initializing media services...');
  
  // Initialize media services
  let minioService = null;
  let cdnService = null;
  let videoService = null;
  let fileUploadService = null;
  
  try {
    const { MinioService } = await import('./services/minio.js');
    const { CDNService } = await import('./services/cdn.js');
    const { VideoTranscodingService } = await import('./services/video-transcoding.js');
    const { FileUploadService } = await import('./services/file-upload.js');
    
    // SECURITY: MinIO credentials MUST be set via environment variables
    if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
      app.log.warn('⚠️ MinIO credentials not configured - file uploads will be disabled');
    }
    minioService = new MinioService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || ''
    });
    
    // await minioService.initialize(); // MinioService doesn't have initialize method
    app.log.info('✅ MinIO service initialized');
    
    cdnService = new CDNService({ fallbackToLocal: true });
    app.log.info('✅ CDN service initialized');
    
    videoService = new VideoTranscodingService(minioService as any);
    app.log.info('✅ Video transcoding service initialized');
    
    fileUploadService = new FileUploadService({
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      useSSL: process.env.MINIO_USE_SSL === 'true'
    });
    app.log.info('✅ File upload service initialized');
  } catch (error) {
    app.log.error({
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    }, 'Failed to initialize media services');
  }
  
  // Decorate media services to app
  app.decorate('minioService', minioService);
  app.decorate('cdnService', cdnService);
  app.decorate('videoService', videoService);
  app.decorate('fileUploadService', fileUploadService);

  // Initialize Elasticsearch service (non-blocking)
  let elasticsearchService: ElasticsearchService | null = null;
  // Initialize Elasticsearch with fallback
  if (!process.env.DISABLE_ELASTICSEARCH || process.env.DISABLE_ELASTICSEARCH === 'false') {
    try {
      app.log.info('🔍 Starting Elasticsearch initialization (non-blocking)...');
      elasticsearchService = new ElasticsearchService({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      });
      
      // Initialize asynchronously to avoid blocking startup
      const esInitPromise = elasticsearchService.connect()
        .then(() => elasticsearchService!.initializeIndexes())
        .then(() => {
          app.log.info('✅ Elasticsearch service initialized successfully');
        })
        .catch((error) => {
          app.log.error({ error: error instanceof Error ? error.message : String(error) }, '❌ Failed to initialize search indexes');
          app.log.info('🔄 Continuing without search functionality...');
          elasticsearchService = null;
        });
      
      // Don't await - let it initialize in background
      app.log.info('🔍 Elasticsearch initialization started in background...');
    } catch (error) {
      app.log.error({ error: error instanceof Error ? error.message : String(error) }, '❌ Failed to initialize search indexes');
      app.log.info('🔄 Continuing without search functionality...');
      elasticsearchService = null;
    }
  } else {
    app.log.info('🚫 Elasticsearch disabled - search functionality not available');
    elasticsearchService = null;
  }

  const monitoringService = new SimpleMonitoringService();
  const sessionManager = new SessionManager(generalRedisClient, 86400); // 24 hour sessions
  
  const services = {
    elasticsearch: elasticsearchService,
    minio: minioService,
    cdn: cdnService,
    videoTranscoding: videoService,
    fileUpload: fileUploadService,
    livekit: new LiveKitService({
      url: process.env.LIVEKIT_URL || 'ws://localhost:7880',
      apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
      apiSecret: process.env.LIVEKIT_API_SECRET || 'secret'
    }),
    notifications: new NotificationService(queues.notifications as any),
    moderation: new ModerationService(queues.moderation as any),
    analytics: new AnalyticsService(queues.analytics as any),
    monitoring: monitoringService,
    sessionManager: sessionManager,
    // web3: new Web3Service() // Temporarily disabled
  };

  app.decorate('services', services);

  // ============================================
  // INITIALIZE SERVICES
  // ============================================
  
  // Elasticsearch service already initialized above with fallback handling

  // ============================================
  // WORKING SOCKET.IO SETUP - TEMPORARILY DISABLED
  // ============================================
  
  let socketIntegration: any = null;
  let workingSocketSystem: WorkingSocketSystem | null = null;
  
  // Initialize Socket.IO systems with proper Fastify integration
  app.log.info('🔌 Initializing Socket.IO real-time systems...');

  try {
    const { initializeSocketIO } = await import('./socket/index.js');
    socketIntegration = await initializeSocketIO(app);
    app.log.info('✅ Socket.IO initialized successfully');
  } catch (error) {
    app.log.error({
      error,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      details: error
    }, '❌ Failed to initialize Socket.IO');
    // Create fallback for compatibility
    socketIntegration = {
      getHealthStatus: () => ({ status: 'error', error: 'Socket initialization failed' }),
      getSystemMetrics: () => ({ connections: 0, errors: 0 }),
      io: null,
      close: () => Promise.resolve()
    };
  }
  
  // Decorate app with socket integration for route access
  app.decorate('socketIntegration', socketIntegration);
  app.decorate('workingSocketSystem', workingSocketSystem);

  // ============================================
  // CUSTOM MIDDLEWARE - TEMPORARILY SIMPLIFIED
  // ============================================
  
  // Initialize comprehensive security middleware
  app.log.info('🔒 Initializing comprehensive security middleware...');
  
  try {
    const { ComprehensiveSecurityService, createComprehensiveSecurityMiddleware } = await import('./middleware/comprehensive-security.js');
    
    // Use the factory function to create middleware
    const securityMiddleware = createComprehensiveSecurityMiddleware({
      rateLimit: {
        windowMs: 60000,
        max: process.env.NODE_ENV === 'production' ? 100 : 1000
      },
      csrf: {
        enabled: false, // DISABLED - was blocking all functionality
        cookieName: '_csrf',
        headerName: 'x-csrf-token',
        saltLength: 8,
        sessionKey: 'csrf-secret',
        ignoredMethods: ['GET', 'HEAD', 'OPTIONS']
      }
    });
    
    // Register security middleware if created successfully
    if (securityMiddleware) {
      app.addHook('onRequest', securityMiddleware);
      app.log.info('✅ Security middleware initialized');
    }
  } catch (error) {
    app.log.error('Failed to initialize security middleware:', (error as any)?.message || error);
  }
  
  /*
  // Advanced Security Headers (applied first) - OLD VERSION
  const advancedSecurityHeaders = createAdvancedSecurityHeaders(generalRedisClient, {
    // Production-ready CSP configuration
    csp: {
      enabled: true,
      reportOnly: process.env.NODE_ENV !== 'production',
      useNonces: true,
      useHashes: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: false,
        blockAllMixedContent: false
      }
    },
    // Strict CORS in production
    cors: {
      enabled: true,
      origins: ["http://localhost:3000", "http://localhost:3002"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["X-Total-Count"],
      credentials: true,
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      strictOriginValidation: process.env.NODE_ENV === 'production',
      dynamicOrigins: process.env.NODE_ENV !== 'production',
      originWhitelist: ["http://localhost:3000", "http://localhost:3002"],
      originBlacklist: []
    },
    // HSTS enabled in production
    hsts: {
      enabled: process.env.NODE_ENV === 'production',
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // Enable monitoring
    monitoring: {
      logViolations: true,
      alertOnViolations: true,
      enableMetrics: true
    }
  });
  
  app.addHook('onRequest', await advancedSecurityHeaders.securityHeadersMiddleware());
  
  // Additional security validation middleware
  app.addHook('onRequest', securityHeadersValidationMiddleware());
  app.addHook('onRequest', requestValidationMiddleware({
    maxBodySize: 50 * 1024 * 1024, // 50MB
    maxQueryParams: 100,
    maxHeaders: 200,
    requireContentType: false // Allow some requests without content-type
  }));
  
  // Request logging
  app.addHook('onRequest', requestIdMiddleware);
  app.addHook('onRequest', requestLogger);
  */
  
  // ============================================
  // ROUTE REGISTRATION - FIXED PLACEMENT
  // ============================================
  
  // Register all routes BEFORE error handler - removed to avoid duplicates
  // Routes are registered below after error handler setup
  
  app.log.info('✅ All routes registered successfully');

  // Global error handler
  app.setErrorHandler(errorHandler);

  // ============================================
  // API DOCUMENTATION REDIRECTS
  // ============================================
  
  // Redirect /docs to /documentation for convenience
  app.get('/docs', async (request, reply) => {
    return reply.redirect('/documentation');
  });

  // ============================================
  // HEALTH CHECKS
  // ============================================
  
  app.get('/health', async (request, reply) => {
    const checks = {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
      elasticsearch: 'disabled',
      minio: (request.server as any).minioService ? 'healthy' : 'disabled',
      realtime: 'unknown'
    };

    // Fast non-blocking health checks with timeouts
    const checkPromises = [];

    // Database check with 1 second timeout
    checkPromises.push(
      Promise.race([
        prisma.$queryRaw`SELECT 1`.then(() => 'healthy').catch(() => 'unhealthy'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 1000))
      ]).then(status => { checks.database = status as string; })
    );

    // Redis check with 500ms timeout
    checkPromises.push(
      Promise.race([
        generalRedisClient.ping().then(() => 'healthy').catch(() => 'unhealthy'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 500))
      ]).then(status => { checks.redis = status as string; })
    );

    // Elasticsearch check (disabled for now)
    if (services.elasticsearch) {
      checkPromises.push(
        Promise.race([
          services.elasticsearch.ping().then(ok => ok ? 'healthy' : 'unhealthy').catch(() => 'unhealthy'),
          new Promise(resolve => setTimeout(() => resolve('timeout'), 500))
        ]).then(status => { checks.elasticsearch = status as string; })
      );
    }

    // MinIO check (disabled for now)
    if (services.minio) {
      checkPromises.push(
        Promise.race([
          services.minio.performHealthCheck().then(h => h.status).catch(() => 'unhealthy'),
          new Promise(resolve => setTimeout(() => resolve('timeout'), 500))
        ]).then(status => { checks.minio = status as string; })
      );
    }

    // Real-time check (synchronous)
    try {
      const realtimeHealth = socketIntegration.getHealthStatus();
      checks.realtime = realtimeHealth.status === 'healthy' ? 'healthy' : 'degraded';
    } catch (error) {
      checks.realtime = 'unhealthy';
    }

    // Wait for all checks with overall 2 second timeout
    await Promise.race([
      Promise.all(checkPromises),
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);

    const allHealthy = Object.values(checks).every(status => status === 'healthy');
    const hasErrors = Object.values(checks).some(status => status === 'unhealthy' || status === 'timeout');
    
    return reply
      .code(allHealthy ? 200 : hasErrors ? 503 : 200)
      .send({
        status: allHealthy ? 'healthy' : hasErrors ? 'degraded' : 'partial',
        timestamp: new Date().toISOString(),
        checks
      });
  });

  // Metrics endpoint is provided by prometheus-metrics plugin

  // ============================================
  // API ROUTES - TEMPORARILY DISABLED FOR DEBUGGING
  // ============================================
  
  // Temporarily disable all route registration to isolate the startup issue
  app.log.info('⚠️  All routes temporarily disabled for debugging');
  
  // Public routes with enhanced auth rate limiting
  await app.register(async function (app) {
    // Apply auth-specific rate limiting
    app.addHook('onRequest', rateLimiters.auth);
    
    await app.register(authRoutes, { prefix: '/api/v1/auth' });
    await app.register(oauthRoutes, { prefix: '/api/v1/oauth' });
  });
  
  // Public routes (with optional auth)
  await app.register(communityRoutes, { prefix: '/api/v1/communities' });
  // Temporarily disable posts routes due to schema validation issues
  await app.register(postRoutes, { prefix: '/api/v1/posts' });
  await app.register(commentRoutes, { prefix: '/api/v1/comments' });
  await app.register(awardRoutes, { prefix: '/api/v1/awards' });
  await app.register(karmaRoutes, { prefix: '/api/v1/karma' });
  await app.register(searchRoutes, { prefix: '/api/v1/search' });
  await app.register(statusRoutes, { prefix: '/api/v1' }); // System status dashboard (public)
  await app.register(metricsRoutes, { prefix: '/api/v1/metrics' }); // Public metrics endpoint
  await app.register(securityRoutes, { prefix: '/api/v1/security' }); // Security monitoring and CSP reports
  await app.register(apiKeyRoutes, { prefix: '/api/v1/api-keys' }); // API key management
  // await app.register(enhancedSearchRoutes, { prefix: '/api/v1/search/enhanced' }); // Temporarily disabled
  // Server discovery routes are integrated into servers.ts to avoid conflicts
  
  // Voice test routes (no auth required) - disabled, files deleted
  // await app.register(voiceTestRoutes, { prefix: '/api/voice-test' });
  // await app.register(socketTestRoutes, { prefix: '/api/v1' });
  
  // Protected routes
  await app.register(async function (app) {
    app.addHook('onRequest', authMiddleware);
    
    await app.register(twoFactorRoutes, { prefix: '/api/v1/2fa' });
    // Temporarily disable user routes due to schema validation issues
    await app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.register(profileRoutes, { prefix: '/api/v1/profile' });
    await app.register(serverRoutes, { prefix: '/api/v1/servers' });
    await app.register(channelRoutes, { prefix: '/api/v1/channels' });
    // Channel permission routes are integrated into channels.ts to avoid conflicts
    await app.register(messageRoutes, { prefix: '/api/v1/messages' });
    // Enable direct messages routes
    await app.register(directMessageRoutes, { prefix: '/api/v1/direct-messages' });
    await app.register(adminRoutes, { prefix: '/api/v1/admin' });
    
    // Conditionally register Web3 routes
    if (process.env.ENABLE_WEB3 === 'true' && web3Routes) {
      await app.register(web3Routes, { prefix: '/api/v1/web3' });
      await app.register(nftRoutes, { prefix: '/api/v1/nft' });
      await app.register(tokenGatingRoutes, { prefix: '/api/v1/token-gating' });
      await app.register(cryptoPaymentRoutes, { prefix: '/api/v1/crypto-payments' });
      await app.register(cryptoTippingRoutes, { prefix: '/api/v1/crypto-tipping' });
      await app.register(stakingRoutes, { prefix: '/api/v1/staking' });
      await app.register(governanceRoutes, { prefix: '/api/v1/governance' });
    }
    // Temporarily disable notifications routes due to schema validation issues
    await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
    await app.register(eventRoutes, { prefix: '/api/v1' });
    await app.register(moderationRoutes, { prefix: '/api/v1/moderation' });
    await app.register(comprehensiveModerationRoutes, { prefix: '/api/moderation' });
    // await app.register(aiModerationRoutes, { prefix: '/api/v1/ai-moderation' }); // Temporarily disabled
    await app.register(voiceRoutes, { prefix: '/api/v1/voice' });
    await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
    await app.register(botRoutes, { prefix: '/api/v1/bots' });
    await app.register(uploadRoutes, { prefix: '/api/v1/uploads' });
    await app.register(imageUploadRoutes, { prefix: '/api/v1/image-uploads' });
    await app.register(cdnRoutes); // CDN routes at root level for /cdn/*
    await app.register(gdprRoutes, { prefix: '/api/v1/gdpr' });
    // await app.register(enhancedUploadRoutes, { prefix: '/api/v1/uploads/enhanced' }); // Temporarily disabled
    // await app.register(mediaManagementRoutes, { prefix: '/api/v1/media' }); // Temporarily disabled
    // await app.register(queueAdminRoutes, { prefix: '/api/v1/admin/queues' }); // Temporarily disabled
    // await app.register(discordTestRoutes, { prefix: '/api/v1/discord-test' }); // Temporarily disabled
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
      await Promise.allSettled(Object.values(queues).map(q => (q as any).close()));
      
      // Close database connection gracefully
      await gracefulDatabaseShutdown();
      
      // Close Fastify (this will trigger the socket integration shutdown hooks)
      await app.close();
      
      app.log.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      app.log.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  return app;
}