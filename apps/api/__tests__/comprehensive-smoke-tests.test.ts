// Comprehensive smoke tests for critical API endpoints
import { mockDb, createMockUser, createMockPost, createMockServer } from './setup';

describe('Comprehensive API Smoke Tests', () => {
  describe('Authentication Endpoints', () => {
    test('should import auth route successfully', async () => {
      const authModule = await import('../src/routes/auth');
      expect(authModule).toBeDefined();
      expect(typeof authModule.default).toBe('function');
    });

    test('should import enhanced auth service', async () => {
      const { EnhancedAuthService } = await import('../src/services/enhanced-auth');
      expect(EnhancedAuthService).toBeDefined();
      expect(typeof EnhancedAuthService).toBe('function');
    });

    test('should handle auth middleware import', async () => {
      const { authMiddleware } = await import('../src/middleware/auth');
      expect(authMiddleware).toBeDefined();
      expect(typeof authMiddleware).toBe('function');
    });
  });

  describe('Core API Routes', () => {
    test('should import health route', async () => {
      const healthModule = await import('../src/routes/health');
      expect(healthModule).toBeDefined();
      expect(typeof healthModule.default).toBe('function');
    });

    test('should import users route', async () => {
      const usersModule = await import('../src/routes/users');
      expect(usersModule).toBeDefined();
      expect(typeof usersModule.default).toBe('function');
    });

    test('should import posts route', async () => {
      const postsModule = await import('../src/routes/posts');
      expect(postsModule).toBeDefined();
      expect(typeof postsModule.default).toBe('function');
    });

    test('should import servers route', async () => {
      const serversModule = await import('../src/routes/servers');
      expect(serversModule).toBeDefined();
      expect(typeof serversModule.default).toBe('function');
    });

    test('should import channels route', async () => {
      const channelsModule = await import('../src/routes/channels');
      expect(channelsModule).toBeDefined();
      expect(typeof channelsModule.default).toBe('function');
    });

    test('should import messages route', async () => {
      const messagesModule = await import('../src/routes/messages');
      expect(messagesModule).toBeDefined();
      expect(typeof messagesModule.default).toBe('function');
    });

    test('should import communities route', async () => {
      const communitiesModule = await import('../src/routes/communities');
      expect(communitiesModule).toBeDefined();
      expect(typeof communitiesModule.default).toBe('function');
    });

    test('should import comments route', async () => {
      const commentsModule = await import('../src/routes/comments');
      expect(commentsModule).toBeDefined();
      expect(typeof commentsModule.default).toBe('function');
    });

    test('should import notifications route', async () => {
      const notificationsModule = await import('../src/routes/notifications');
      expect(notificationsModule).toBeDefined();
      expect(typeof notificationsModule.default).toBe('function');
    });

    test('should import search route', async () => {
      const searchModule = await import('../src/routes/search');
      expect(searchModule).toBeDefined();
      expect(typeof searchModule.default).toBe('function');
    });
  });

  describe('Feature Routes', () => {
    test('should import uploads route', async () => {
      const uploadsModule = await import('../src/routes/uploads');
      expect(uploadsModule).toBeDefined();
      expect(typeof uploadsModule.default).toBe('function');
    });

    test('should import moderation route', async () => {
      const moderationModule = await import('../src/routes/moderation');
      expect(moderationModule).toBeDefined();
      expect(typeof moderationModule.default).toBe('function');
    });

    test('should import analytics route', async () => {
      const analyticsModule = await import('../src/routes/analytics');
      expect(analyticsModule).toBeDefined();
      expect(typeof analyticsModule.default).toBe('function');
    });

    test('should import voice route', async () => {
      const voiceModule = await import('../src/routes/voice');
      expect(voiceModule).toBeDefined();
      expect(typeof voiceModule.default).toBe('function');
    });

    test('should import direct messages route', async () => {
      const dmModule = await import('../src/routes/direct-messages');
      expect(dmModule).toBeDefined();
      expect(typeof dmModule.default).toBe('function');
    });
  });

  describe('Web3 & Crypto Routes', () => {
    test('should import web3 route', async () => {
      const web3Module = await import('../src/routes/web3');
      expect(web3Module).toBeDefined();
      expect(typeof web3Module.default).toBe('function');
    });

    test('should import nft route', async () => {
      const nftModule = await import('../src/routes/nft');
      expect(nftModule).toBeDefined();
      expect(typeof nftModule.default).toBe('function');
    });

    test('should import crypto payments route', async () => {
      const cryptoModule = await import('../src/routes/crypto-payments');
      expect(cryptoModule).toBeDefined();
      expect(typeof cryptoModule.default).toBe('function');
    });

    test('should import token gating route', async () => {
      const tokenGatingModule = await import('../src/routes/token-gating');
      expect(tokenGatingModule).toBeDefined();
      expect(typeof tokenGatingModule.default).toBe('function');
    });
  });

  describe('Admin Routes', () => {
    test('should import admin route', async () => {
      const adminModule = await import('../src/routes/admin');
      expect(adminModule).toBeDefined();
      expect(typeof adminModule.default).toBe('function');
    });

    test('should import admin content route', async () => {
      const adminContentModule = await import('../src/routes/admin-content');
      expect(adminContentModule).toBeDefined();
      expect(typeof adminContentModule.default).toBe('function');
    });

    test('should import queue admin route', async () => {
      const queueAdminModule = await import('../src/routes/queue-admin');
      expect(queueAdminModule).toBeDefined();
      expect(typeof queueAdminModule.default).toBe('function');
    });
  });

  describe('Middleware', () => {
    test('should import validation middleware', async () => {
      const { validate, validationSchemas } = await import('../src/middleware/validation');
      expect(validate).toBeDefined();
      expect(validationSchemas).toBeDefined();
      expect(typeof validate).toBe('function');
      expect(typeof validationSchemas).toBe('object');
    });

    test('should import error handler middleware', async () => {
      const { 
        throwBadRequest, 
        throwUnauthorized, 
        throwConflict, 
        throwNotFound, 
        AppError 
      } = await import('../src/middleware/errorHandler');
      
      expect(throwBadRequest).toBeDefined();
      expect(throwUnauthorized).toBeDefined();
      expect(throwConflict).toBeDefined();
      expect(throwNotFound).toBeDefined();
      expect(AppError).toBeDefined();
    });

    test('should import middleware modules', async () => {
      // Test basic module imports without strict structure requirements
      const requestLoggerModule = await import('../src/middleware/requestLogger');
      expect(requestLoggerModule).toBeDefined();
      
      const securityModule = await import('../src/middleware/security-headers');
      expect(securityModule).toBeDefined();
    });
  });

  describe('Services', () => {
    test('should import auth service', async () => {
      const { EnhancedAuthService } = await import('../src/services/enhanced-auth');
      expect(EnhancedAuthService).toBeDefined();
      expect(typeof EnhancedAuthService).toBe('function');
    });

    test('should import service modules', async () => {
      // Test basic module imports without strict structure requirements
      const emailModule = await import('../src/services/email-service');
      expect(emailModule).toBeDefined();
      
      const analyticsModule = await import('../src/services/analytics');
      expect(analyticsModule).toBeDefined();
      
      const notificationModule = await import('../src/services/notifications');
      expect(notificationModule).toBeDefined();
      
      const queueModule = await import('../src/services/queue-manager');
      expect(queueModule).toBeDefined();
    });
  });

  describe('Socket Integration', () => {
    test('should import socket modules', async () => {
      // Test basic module imports without strict structure requirements
      const socketModule = await import('../src/socket/index');
      expect(socketModule).toBeDefined();
      
      const realtimeModule = await import('../src/socket/realtime-messaging');
      expect(realtimeModule).toBeDefined();
      
      const metricsModule = await import('../src/socket/realtime-metrics');
      expect(metricsModule).toBeDefined();
    });
  });

  describe('Database Integration', () => {
    test('should mock database operations successfully', async () => {
      // Test user operations
      mockDb.user.findUnique.mockResolvedValue(createMockUser());
      const user = await mockDb.user.findUnique({ where: { id: '1' } });
      expect(user).toBeDefined();
      expect(user.id).toBe('1');

      // Test post operations
      mockDb.post.findMany.mockResolvedValue([createMockPost()]);
      const posts = await mockDb.post.findMany();
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Test Post');

      // Test server operations
      mockDb.server.create.mockResolvedValue(createMockServer());
      const server = await mockDb.server.create({ data: {} });
      expect(server).toBeDefined();
      expect(server.name).toBe('Test Server');
    });

    test('should handle database retry mechanism', async () => {
      const { executeWithDatabaseRetry } = await import('@cryb/database');
      
      const mockFunction = jest.fn().mockResolvedValue('success');
      const result = await executeWithDatabaseRetry(mockFunction);
      
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Security & Validation', () => {
    test('should create and validate error objects', async () => {
      const { AppError } = await import('../src/middleware/errorHandler');
      
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
    });

    test('should import auth utilities', async () => {
      const { 
        generateAccessToken, 
        verifyToken, 
        hashPassword, 
        verifyPassword 
      } = await import('@cryb/auth');
      
      expect(generateAccessToken).toBeDefined();
      expect(verifyToken).toBeDefined();
      expect(hashPassword).toBeDefined();
      expect(verifyPassword).toBeDefined();
    });
  });

  describe('Configuration & Environment', () => {
    test('should have required environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.REDIS_URL).toBeDefined();
    });

    test('should import configuration modules', async () => {
      const configModule = await import('../src/config/server.config');
      expect(configModule).toBeDefined();
      
      const envModule = await import('../src/config/env-validation');
      expect(envModule).toBeDefined();
    });
  });

  describe('Utilities', () => {
    test('should import utility modules', async () => {
      const loggerModule = await import('../src/utils/logger');
      expect(loggerModule).toBeDefined();
    });

    test('should verify mock implementations', () => {
      // Verify Redis mock
      const Redis = require('ioredis');
      const client = new Redis();
      expect(client.ping).toBeDefined();
      expect(typeof client.ping).toBe('function');

      // Verify Elasticsearch mock
      const { Client } = require('@elastic/elasticsearch');
      const esClient = new Client();
      expect(esClient.ping).toBeDefined();
      expect(typeof esClient.ping).toBe('function');

      // Verify MinIO mock
      const { Client: MinIOClient } = require('minio');
      const minioClient = new MinIOClient();
      expect(minioClient.bucketExists).toBeDefined();
      expect(typeof minioClient.bucketExists).toBe('function');
    });
  });

  describe('App Initialization', () => {
    test('should import app modules', async () => {
      const appModule = await import('../src/app');
      expect(appModule).toBeDefined();
    });

    test('should import index file without throwing', () => {
      // Note: We can't actually start the server in tests, but we can verify the import
      expect(() => require('../src/index')).not.toThrow();
    });
  });
});

// Test helpers
export const runBasicEndpointTest = async (routePath: string) => {
  const routeModule = await import(`../src/routes/${routePath}`);
  expect(routeModule).toBeDefined();
  expect(typeof routeModule.default).toBe('function');
  return routeModule;
};

export const verifyServiceImport = async (servicePath: string) => {
  const serviceModule = await import(`../src/services/${servicePath}`);
  expect(serviceModule).toBeDefined();
  return serviceModule;
};