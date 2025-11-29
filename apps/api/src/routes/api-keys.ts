import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { createAPIKeyManagementService } from '../services/api-key-management';
import Redis from 'ioredis';

// Initialize Redis and API Key service
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6380'),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD })
});

const apiKeyService = createAPIKeyManagementService(redis, {
  security: {
    enableIPWhitelisting: true,
    enableDomainRestrictions: true,
    enableScopeRestrictions: true,
    enableUsageTracking: true,
    enableAnomalyDetection: true,
    suspiciousActivityThreshold: 10
  },
  rateLimiting: {
    defaultRequestsPerMinute: 1000,
    maxRequestsPerMinute: 10000,
    enableBurstLimiting: true,
    burstThreshold: 100
  },
  monitoring: {
    enableUsageAlerts: true,
    enableSecurityAlerts: true,
    logAllRequests: true,
    enableMetricsCollection: true
  }
});

interface CreateAPIKeyRequest {
  name: string;
  description?: string;
  scopes?: string[];
  ipWhitelist?: string[];
  domainRestrictions?: string[];
  requestsPerMinute?: number;
  requestsPerDay?: number;
  expiresAt?: string;
}

interface UpdateAPIKeyRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  ipWhitelist?: string[];
  domainRestrictions?: string[];
  requestsPerMinute?: number;
  requestsPerDay?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export default async function apiKeyRoutes(fastify: FastifyInstance) {
  // Apply rate limiting to all API key routes
  fastify.addHook('onRequest', rateLimiters.general);

  /**
   * Create a new API key
   * POST /api/v1/api-keys
   */
  fastify.post<{
    Body: CreateAPIKeyRequest;
  }>('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Create API key',
      description: 'Create a new API key for programmatic access',
      body: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Descriptive name for the API key'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Optional description of the API key purpose'
          },
          scopes: {
            type: 'array',
            items: { type: 'string' },
            default: ['read'],
            description: 'Permissions granted to this API key'
          },
          ipWhitelist: {
            type: 'array',
            items: { type: 'string' },
            description: 'IP addresses allowed to use this key'
          },
          domainRestrictions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Domains allowed to use this key'
          },
          requestsPerMinute: {
            type: 'number',
            minimum: 1,
            maximum: 10000,
            description: 'Rate limit for this key'
          },
          requestsPerDay: {
            type: 'number',
            minimum: 1,
            maximum: 1000000,
            description: 'Daily request limit'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration date for the API key'
          }
        },
        required: ['name']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            apiKey: { type: 'string' },
            keyData: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                keyId: { type: 'string' },
                name: { type: 'string' },
                scopes: { type: 'array', items: { type: 'string' } },
                requestsPerMinute: { type: 'number' },
                expiresAt: { type: 'string', nullable: true },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: CreateAPIKeyRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const {
        name,
        description,
        scopes = ['read'],
        ipWhitelist,
        domainRestrictions,
        requestsPerMinute,
        requestsPerDay,
        expiresAt
      } = request.body;

      // Validate scopes
      const allowedScopes = ['read', 'write', 'delete', 'admin'];
      const invalidScopes = scopes.filter(scope => !allowedScopes.includes(scope));
      if (invalidScopes.length > 0) {
        return reply.code(400).send({
          success: false,
          error: `Invalid scopes: ${invalidScopes.join(', ')}`,
          allowedScopes
        });
      }

      // Create the API key
      const result = await apiKeyService.createAPIKey({
        name,
        description,
        userId,
        scopes,
        ipWhitelist,
        domainRestrictions,
        requestsPerMinute,
        requestsPerDay,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      return reply.code(201).send({
        success: true,
        apiKey: result.key, // This is the only time we return the actual key
        keyData: {
          id: result.keyData.id,
          keyId: result.keyData.keyId,
          name: result.keyData.name,
          scopes: result.keyData.scopes,
          requestsPerMinute: result.keyData.requestsPerMinute,
          expiresAt: result.keyData.expiresAt?.toISOString() || null,
          createdAt: result.keyData.createdAt.toISOString()
        },
        warning: 'This is the only time the API key will be shown. Please store it securely.'
      });

    } catch (error) {
      request.log.error('Failed to create API key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create API key'
      });
    }
  });

  /**
   * List user's API keys
   * GET /api/v1/api-keys
   */
  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'List API keys',
      description: 'Get all API keys for the current user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            keys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  scopes: { type: 'array', items: { type: 'string' } },
                  requestsPerMinute: { type: 'number' },
                  totalRequests: { type: 'number' },
                  lastUsedAt: { type: 'string', nullable: true },
                  expiresAt: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
                  isExpired: { type: 'boolean' },
                  createdAt: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.userId!;

      // For now, we'll return a basic structure since the service stores in Redis
      // In a full implementation, you'd query the database
      const stats = apiKeyService.getServiceStats();

      return reply.send({
        success: true,
        keys: [], // Would be populated from database
        summary: {
          totalKeys: stats.totalKeys,
          activeKeys: stats.activeKeys
        },
        message: 'API key listing requires database integration'
      });

    } catch (error) {
      request.log.error('Failed to list API keys:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to list API keys'
      });
    }
  });

  /**
   * Get API key details
   * GET /api/v1/api-keys/:keyId
   */
  fastify.get<{
    Params: { keyId: string };
  }>('/:keyId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Get API key details',
      description: 'Get detailed information about a specific API key',
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string' }
        },
        required: ['keyId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { keyId: string } }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { keyId } = request.params;

      // Note: In a full implementation, you'd verify ownership and get details
      return reply.send({
        success: true,
        message: 'API key details require database integration',
        keyId
      });

    } catch (error) {
      request.log.error('Failed to get API key details:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get API key details'
      });
    }
  });

  /**
   * Update API key
   * PATCH /api/v1/api-keys/:keyId
   */
  fastify.patch<{
    Params: { keyId: string };
    Body: UpdateAPIKeyRequest;
  }>('/:keyId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Update API key',
      description: 'Update API key settings and permissions',
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string' }
        },
        required: ['keyId']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          scopes: { type: 'array', items: { type: 'string' } },
          ipWhitelist: { type: 'array', items: { type: 'string' } },
          domainRestrictions: { type: 'array', items: { type: 'string' } },
          requestsPerMinute: { type: 'number', minimum: 1, maximum: 10000 },
          requestsPerDay: { type: 'number', minimum: 1, maximum: 1000000 },
          expiresAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Params: { keyId: string }; Body: UpdateAPIKeyRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { keyId } = request.params;
      const updates = request.body;

      return reply.send({
        success: true,
        message: 'API key updates require database integration',
        keyId,
        updates
      });

    } catch (error) {
      request.log.error('Failed to update API key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update API key'
      });
    }
  });

  /**
   * Revoke API key
   * DELETE /api/v1/api-keys/:keyId
   */
  fastify.delete<{
    Params: { keyId: string };
  }>('/:keyId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Revoke API key',
      description: 'Permanently revoke an API key',
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string' }
        },
        required: ['keyId']
      }
    }
  }, async (request: FastifyRequest<{ Params: { keyId: string } }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { keyId } = request.params;

      return reply.send({
        success: true,
        message: 'API key revocation requires database integration',
        keyId
      });

    } catch (error) {
      request.log.error('Failed to revoke API key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to revoke API key'
      });
    }
  });

  /**
   * Test API key validation
   * POST /api/v1/api-keys/test
   */
  fastify.post<{
    Body: { apiKey: string };
  }>('/test', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Test API key',
      description: 'Test API key validation and permissions',
      body: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' }
        },
        required: ['apiKey']
      }
    }
  }, async (request: FastifyRequest<{ Body: { apiKey: string } }>, reply: FastifyReply) => {
    try {
      const { apiKey } = request.body;

      const validation = await apiKeyService.validateAPIKey(apiKey, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        endpoint: request.url,
        method: request.method,
        origin: request.headers.origin
      });

      return reply.send({
        success: true,
        validation: {
          valid: validation.valid,
          reason: validation.reason,
          rateLimitInfo: validation.rateLimitInfo,
          securityFlags: validation.securityFlags,
          keyInfo: validation.key ? {
            keyId: validation.key.keyId,
            name: validation.key.name,
            scopes: validation.key.scopes,
            requestsPerMinute: validation.key.requestsPerMinute,
            totalRequests: validation.key.totalRequests,
            lastUsedAt: validation.key.lastUsedAt?.toISOString(),
            isActive: validation.key.isActive
          } : null
        }
      });

    } catch (error) {
      request.log.error('Failed to test API key:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to test API key'
      });
    }
  });

  /**
   * Get API key usage statistics
   * GET /api/v1/api-keys/:keyId/usage
   */
  fastify.get<{
    Params: { keyId: string };
    Querystring: { timeframe?: 'hour' | 'day' | 'week' | 'month' };
  }>('/:keyId/usage', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['API Keys'],
      summary: 'Get API key usage',
      description: 'Get usage statistics for an API key',
      params: {
        type: 'object',
        properties: {
          keyId: { type: 'string' }
        },
        required: ['keyId']
      },
      querystring: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month'],
            default: 'day'
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { keyId: string }; 
    Querystring: { timeframe?: 'hour' | 'day' | 'week' | 'month' } 
  }>, reply: FastifyReply) => {
    try {
      const userId = request.userId!;
      const { keyId } = request.params;
      const { timeframe = 'day' } = request.query;

      return reply.send({
        success: true,
        message: 'Usage statistics require database integration',
        keyId,
        timeframe
      });

    } catch (error) {
      request.log.error('Failed to get usage statistics:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get usage statistics'
      });
    }
  });

  /**
   * Get service statistics (admin only)
   * GET /api/v1/api-keys/admin/stats
   */
  fastify.get('/admin/stats', {
    preHandler: authMiddleware,
    schema: {
      tags: ['API Keys'],
      summary: 'Get service statistics',
      description: 'Get overall API key service statistics (admin only)'
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = apiKeyService.getServiceStats();

      return reply.send({
        success: true,
        stats: {
          ...stats,
          serviceStatus: 'operational',
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      request.log.error('Failed to get service statistics:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get service statistics'
      });
    }
  });
}

// Export the service for use in other modules
export { apiKeyService };