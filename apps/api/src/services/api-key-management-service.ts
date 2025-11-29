import crypto from 'crypto';
import { Redis } from 'ioredis';
import { prisma } from '@cryb/database';
import { AUTH_CONSTANTS } from '../models/auth-models';
import logger from '../utils/logger';

export interface ApiKeyData {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  description?: string;
  permissions: string[];
  rate_limit: number;
  last_used?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApiKeyUsage {
  requests_count: number;
  last_request: Date;
  rate_limit_hits: number;
  endpoints_used: string[];
  ip_addresses: string[];
}

export interface ApiKeyCreateResult {
  api_key: string;
  key_data: ApiKeyData;
  warning: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  key_data?: ApiKeyData;
  user_permissions?: string[];
  rate_limit_remaining?: number;
  error?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: Date;
  retry_after?: number;
}

export class ApiKeyManagementService {
  private redis: Redis;
  private readonly API_KEY_PREFIX = 'cryb_';
  private readonly RATE_LIMIT_PREFIX = 'api_rate_limit:';
  private readonly USAGE_PREFIX = 'api_usage:';
  private readonly CACHE_PREFIX = 'api_key_cache:';
  private readonly VALIDATION_CACHE_TTL = 300; // 5 minutes
  private readonly RATE_LIMIT_WINDOW = 60; // 1 minute

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create new API key
   */
  async createApiKey(data: {
    user_id: string;
    name: string;
    description?: string;
    permissions: string[];
    rate_limit?: number;
    expires_in_days?: number;
  }): Promise<ApiKeyCreateResult> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: data.user_id }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Validate permissions are valid
      const validPermissions = await this.validatePermissions(data.permissions);
      if (validPermissions.length !== data.permissions.length) {
        throw new Error('Some permissions are invalid');
      }

      // Check user's existing API keys count
      const existingKeysCount = await prisma.apiKey.count({
        where: {
          user_id: data.user_id,
          is_active: true
        }
      });

      const maxApiKeys = parseInt(process.env.MAX_API_KEYS_PER_USER || '10');
      if (existingKeysCount >= maxApiKeys) {
        throw new Error(`Maximum ${maxApiKeys} API keys allowed per user`);
      }

      // Check for duplicate name
      const existingName = await prisma.apiKey.findFirst({
        where: {
          user_id: data.user_id,
          name: data.name,
          is_active: true
        }
      });

      if (existingName) {
        throw new Error('API key with this name already exists');
      }

      // Generate API key
      const { apiKey, keyHash, keyPrefix } = this.generateApiKey();

      // Calculate expiry date
      let expiresAt: Date | undefined;
      if (data.expires_in_days) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + data.expires_in_days);
      }

      // Create API key record
      const apiKeyData = await prisma.apiKey.create({
        data: {
          user_id: data.user_id,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          rate_limit: data.rate_limit || 1000,
          expires_at: expiresAt,
          is_active: true
        }
      });

      // Initialize usage tracking
      await this.initializeUsageTracking(apiKeyData.id);

      // Log API key creation
      await this.logSecurityEvent({
        user_id: data.user_id,
        event_type: 'api_key_created',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          api_key_id: apiKeyData.id,
          api_key_name: data.name,
          permissions: data.permissions,
          rate_limit: data.rate_limit,
          expires_at: expiresAt
        }
      });

      logger.info(`API key created for user ${data.user_id}: ${data.name}`);

      return {
        api_key: apiKey,
        key_data: apiKeyData,
        warning: 'Store this API key securely. It will not be shown again.'
      };

    } catch (error) {
      logger.error('Error creating API key:', error);
      throw error;
    }
  }

  /**
   * Validate API key and check permissions
   */
  async validateApiKey(
    apiKey: string,
    requiredPermission?: string,
    context?: {
      ip_address?: string;
      user_agent?: string;
      endpoint?: string;
    }
  ): Promise<ApiKeyValidationResult> {
    try {
      // Validate key format
      if (!this.isValidApiKeyFormat(apiKey)) {
        return {
          valid: false,
          error: 'Invalid API key format'
        };
      }

      const keyHash = this.hashApiKey(apiKey);
      const keyPrefix = this.extractKeyPrefix(apiKey);

      // Check cache first
      const cacheKey = `${this.CACHE_PREFIX}${keyHash}`;
      const cached = await this.redis.get(cacheKey);

      let keyData: ApiKeyData;
      let userPermissions: string[];

      if (cached) {
        const cachedData = JSON.parse(cached);
        keyData = {
          ...cachedData.key_data,
          created_at: new Date(cachedData.key_data.created_at),
          updated_at: new Date(cachedData.key_data.updated_at),
          last_used: cachedData.key_data.last_used ? new Date(cachedData.key_data.last_used) : undefined,
          expires_at: cachedData.key_data.expires_at ? new Date(cachedData.key_data.expires_at) : undefined
        };
        userPermissions = cachedData.user_permissions;
      } else {
        // Get from database
        const apiKeyRecord = await prisma.apiKey.findFirst({
          where: {
            key_hash: keyHash,
            key_prefix: keyPrefix,
            is_active: true
          },
          include: {
            user: {
              include: {
                user_roles: {
                  include: {
                    role: true
                  },
                  where: {
                    OR: [
                      { expires_at: null },
                      { expires_at: { gt: new Date() } }
                    ]
                  }
                }
              }
            }
          }
        });

        if (!apiKeyRecord) {
          await this.logSecurityEvent({
            event_type: 'api_key_invalid',
            ip_address: context?.ip_address || '0.0.0.0',
            user_agent: context?.user_agent || 'unknown',
            metadata: {
              api_key_prefix: keyPrefix,
              endpoint: context?.endpoint
            },
            risk_score: 30
          });

          return {
            valid: false,
            error: 'Invalid API key'
          };
        }

        keyData = apiKeyRecord;

        // Check if key is expired
        if (keyData.expires_at && keyData.expires_at < new Date()) {
          return {
            valid: false,
            error: 'API key has expired'
          };
        }

        // Get user permissions
        userPermissions = this.extractUserPermissions(apiKeyRecord.user);

        // Cache the result
        await this.redis.setex(
          cacheKey,
          this.VALIDATION_CACHE_TTL,
          JSON.stringify({
            key_data: {
              ...keyData,
              created_at: keyData.created_at.toISOString(),
              updated_at: keyData.updated_at.toISOString(),
              last_used: keyData.last_used?.toISOString(),
              expires_at: keyData.expires_at?.toISOString()
            },
            user_permissions: userPermissions
          })
        );
      }

      // Check rate limit
      const rateLimitInfo = await this.checkRateLimit(keyData.id, keyData.rate_limit);
      if (rateLimitInfo.remaining <= 0) {
        await this.logSecurityEvent({
          user_id: keyData.user_id,
          event_type: 'api_key_rate_limited',
          ip_address: context?.ip_address || '0.0.0.0',
          user_agent: context?.user_agent || 'unknown',
          metadata: {
            api_key_id: keyData.id,
            api_key_name: keyData.name,
            endpoint: context?.endpoint,
            rate_limit: keyData.rate_limit
          },
          risk_score: 20
        });

        return {
          valid: false,
          error: 'Rate limit exceeded',
          rate_limit_remaining: 0
        };
      }

      // Check permission if required
      if (requiredPermission) {
        const hasPermission = this.checkApiKeyPermission(
          keyData.permissions,
          userPermissions,
          requiredPermission
        );

        if (!hasPermission) {
          await this.logSecurityEvent({
            user_id: keyData.user_id,
            event_type: 'api_key_unauthorized',
            ip_address: context?.ip_address || '0.0.0.0',
            user_agent: context?.user_agent || 'unknown',
            metadata: {
              api_key_id: keyData.id,
              api_key_name: keyData.name,
              required_permission: requiredPermission,
              endpoint: context?.endpoint
            },
            risk_score: 40
          });

          return {
            valid: false,
            error: 'Insufficient permissions'
          };
        }
      }

      // Update usage tracking
      await this.trackApiKeyUsage(keyData.id, context);

      // Update last used timestamp (async)
      this.updateLastUsed(keyData.id).catch(error => {
        logger.warn('Failed to update API key last used timestamp:', error);
      });

      return {
        valid: true,
        key_data: keyData,
        user_permissions: userPermissions,
        rate_limit_remaining: rateLimitInfo.remaining
      };

    } catch (error) {
      logger.error('Error validating API key:', error);
      return {
        valid: false,
        error: 'Validation failed'
      };
    }
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string, userId?: string): Promise<void> {
    try {
      const whereClause: any = { id: keyId };
      if (userId) {
        whereClause.user_id = userId;
      }

      const apiKey = await prisma.apiKey.findFirst({
        where: whereClause
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          is_active: false,
          updated_at: new Date()
        }
      });

      // Clear cache
      const keyHash = apiKey.key_hash;
      const cacheKey = `${this.CACHE_PREFIX}${keyHash}`;
      await this.redis.del(cacheKey);

      // Clean up rate limit data
      await this.cleanupRateLimitData(keyId);

      // Log revocation
      await this.logSecurityEvent({
        user_id: apiKey.user_id,
        event_type: 'api_key_revoked',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          api_key_id: keyId,
          api_key_name: apiKey.name
        }
      });

      logger.info(`API key revoked: ${apiKey.name} (${keyId})`);

    } catch (error) {
      logger.error('Error revoking API key:', error);
      throw error;
    }
  }

  /**
   * Get user's API keys
   */
  async getUserApiKeys(userId: string): Promise<Array<Omit<ApiKeyData, 'key_hash'>>> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          user_id: userId,
          is_active: true
        },
        orderBy: { created_at: 'desc' }
      });

      return apiKeys.map(key => ({
        id: key.id,
        user_id: key.user_id,
        key_prefix: key.key_prefix,
        name: key.name,
        description: key.description,
        permissions: Array.isArray(key.permissions) ? key.permissions : JSON.parse(key.permissions as string || '[]'),
        rate_limit: key.rate_limit,
        last_used: key.last_used,
        expires_at: key.expires_at,
        is_active: key.is_active,
        created_at: key.created_at,
        updated_at: key.updated_at
      }));

    } catch (error) {
      logger.error('Error getting user API keys:', error);
      return [];
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(keyId: string, userId: string, updates: {
    name?: string;
    description?: string;
    permissions?: string[];
    rate_limit?: number;
  }): Promise<ApiKeyData> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          user_id: userId,
          is_active: true
        }
      });

      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Validate permissions if provided
      if (updates.permissions) {
        const validPermissions = await this.validatePermissions(updates.permissions);
        if (validPermissions.length !== updates.permissions.length) {
          throw new Error('Some permissions are invalid');
        }
      }

      // Check for duplicate name if name is being updated
      if (updates.name && updates.name !== apiKey.name) {
        const existingName = await prisma.apiKey.findFirst({
          where: {
            user_id: userId,
            name: updates.name,
            is_active: true,
            id: { not: keyId }
          }
        });

        if (existingName) {
          throw new Error('API key with this name already exists');
        }
      }

      const updatedApiKey = await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      // Clear cache
      const cacheKey = `${this.CACHE_PREFIX}${apiKey.key_hash}`;
      await this.redis.del(cacheKey);

      // Log update
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'api_key_updated',
        ip_address: '0.0.0.0',
        user_agent: 'system',
        metadata: {
          api_key_id: keyId,
          api_key_name: updatedApiKey.name,
          updates: Object.keys(updates)
        }
      });

      logger.info(`API key updated: ${updatedApiKey.name} (${keyId})`);

      return updatedApiKey;

    } catch (error) {
      logger.error('Error updating API key:', error);
      throw error;
    }
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyUsage(keyId: string, userId?: string): Promise<ApiKeyUsage | null> {
    try {
      const whereClause: any = { id: keyId };
      if (userId) {
        whereClause.user_id = userId;
      }

      const apiKey = await prisma.apiKey.findFirst({
        where: whereClause
      });

      if (!apiKey) {
        return null;
      }

      const usageKey = `${this.USAGE_PREFIX}${keyId}`;
      const usageData = await this.redis.hgetall(usageKey);

      return {
        requests_count: parseInt(usageData.requests_count || '0'),
        last_request: usageData.last_request ? new Date(usageData.last_request) : new Date(0),
        rate_limit_hits: parseInt(usageData.rate_limit_hits || '0'),
        endpoints_used: usageData.endpoints_used ? JSON.parse(usageData.endpoints_used) : [],
        ip_addresses: usageData.ip_addresses ? JSON.parse(usageData.ip_addresses) : []
      };

    } catch (error) {
      logger.error('Error getting API key usage:', error);
      return null;
    }
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredApiKeys(): Promise<number> {
    try {
      const expiredKeys = await prisma.apiKey.findMany({
        where: {
          expires_at: { lt: new Date() },
          is_active: true
        }
      });

      await prisma.apiKey.updateMany({
        where: {
          expires_at: { lt: new Date() },
          is_active: true
        },
        data: {
          is_active: false,
          updated_at: new Date()
        }
      });

      // Clean up cache and rate limit data
      for (const key of expiredKeys) {
        const cacheKey = `${this.CACHE_PREFIX}${key.key_hash}`;
        await this.redis.del(cacheKey);
        await this.cleanupRateLimitData(key.id);
      }

      logger.info(`Cleaned up ${expiredKeys.length} expired API keys`);
      return expiredKeys.length;

    } catch (error) {
      logger.error('Error cleaning up expired API keys:', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */

  private generateApiKey(): { apiKey: string, keyHash: string, keyPrefix: string } {
    const randomBytes = crypto.randomBytes(AUTH_CONSTANTS.API_KEY_SECRET_LENGTH);
    const keySecret = randomBytes.toString('hex');
    const keyPrefix = crypto.randomBytes(AUTH_CONSTANTS.API_KEY_PREFIX_LENGTH / 2).toString('hex');
    
    const apiKey = `${this.API_KEY_PREFIX}${keyPrefix}_${keySecret}`;
    const keyHash = this.hashApiKey(apiKey);

    return { apiKey, keyHash, keyPrefix };
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  private extractKeyPrefix(apiKey: string): string {
    const parts = apiKey.split('_');
    if (parts.length !== 2 || !parts[0].startsWith(this.API_KEY_PREFIX)) {
      throw new Error('Invalid API key format');
    }
    return parts[0].substring(this.API_KEY_PREFIX.length);
  }

  private isValidApiKeyFormat(apiKey: string): boolean {
    try {
      const parts = apiKey.split('_');
      return parts.length === 2 && 
             parts[0].startsWith(this.API_KEY_PREFIX) &&
             parts[0].length === this.API_KEY_PREFIX.length + AUTH_CONSTANTS.API_KEY_PREFIX_LENGTH &&
             parts[1].length === AUTH_CONSTANTS.API_KEY_SECRET_LENGTH * 2; // hex encoding doubles length
    } catch {
      return false;
    }
  }

  private async validatePermissions(permissionNames: string[]): Promise<any[]> {
    return await prisma.permission.findMany({
      where: {
        name: {
          in: permissionNames
        }
      }
    });
  }

  private extractUserPermissions(user: any): string[] {
    const permissions = new Set<string>();
    
    user.user_roles.forEach((userRole: any) => {
      const rolePermissions = Array.isArray(userRole.role.permissions) 
        ? userRole.role.permissions 
        : JSON.parse(userRole.role.permissions || '[]');
      rolePermissions.forEach((p: string) => permissions.add(p));
    });

    return Array.from(permissions);
  }

  private checkApiKeyPermission(
    apiKeyPermissions: string[],
    userPermissions: string[],
    requiredPermission: string
  ): boolean {
    const allPermissions = [...apiKeyPermissions, ...userPermissions];
    
    // Direct permission check
    if (allPermissions.includes(requiredPermission)) {
      return true;
    }

    // Wildcard permission check
    const [resource, action] = requiredPermission.split(':');
    
    return allPermissions.some(permission => {
      if (permission === '*:*' || permission === 'admin:*') {
        return true;
      }
      if (permission === `${resource}:*`) {
        return true;
      }
      if (permission === `*:${action}`) {
        return true;
      }
      return false;
    });
  }

  private async checkRateLimit(keyId: string, limit: number): Promise<RateLimitInfo> {
    const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${keyId}`;
    const now = Date.now();
    const windowStart = Math.floor(now / (this.RATE_LIMIT_WINDOW * 1000)) * this.RATE_LIMIT_WINDOW * 1000;
    const windowEnd = windowStart + this.RATE_LIMIT_WINDOW * 1000;

    const current = await this.redis.get(`${rateLimitKey}:${windowStart}`);
    const currentCount = current ? parseInt(current) : 0;
    const remaining = Math.max(0, limit - currentCount);

    // Increment counter
    const pipeline = this.redis.pipeline();
    pipeline.incr(`${rateLimitKey}:${windowStart}`);
    pipeline.expire(`${rateLimitKey}:${windowStart}`, this.RATE_LIMIT_WINDOW * 2);
    await pipeline.exec();

    return {
      limit,
      remaining: Math.max(0, remaining - 1),
      reset_time: new Date(windowEnd),
      retry_after: remaining <= 1 ? Math.ceil((windowEnd - now) / 1000) : undefined
    };
  }

  private async trackApiKeyUsage(keyId: string, context?: any): Promise<void> {
    try {
      const usageKey = `${this.USAGE_PREFIX}${keyId}`;
      const pipeline = this.redis.pipeline();

      pipeline.hincrby(usageKey, 'requests_count', 1);
      pipeline.hset(usageKey, 'last_request', new Date().toISOString());

      if (context?.endpoint) {
        const endpointsUsed = await this.redis.hget(usageKey, 'endpoints_used');
        const endpoints = endpointsUsed ? JSON.parse(endpointsUsed) : [];
        if (!endpoints.includes(context.endpoint)) {
          endpoints.push(context.endpoint);
          pipeline.hset(usageKey, 'endpoints_used', JSON.stringify(endpoints.slice(-50))); // Keep last 50
        }
      }

      if (context?.ip_address) {
        const ipAddresses = await this.redis.hget(usageKey, 'ip_addresses');
        const ips = ipAddresses ? JSON.parse(ipAddresses) : [];
        if (!ips.includes(context.ip_address)) {
          ips.push(context.ip_address);
          pipeline.hset(usageKey, 'ip_addresses', JSON.stringify(ips.slice(-20))); // Keep last 20
        }
      }

      pipeline.expire(usageKey, 30 * 24 * 60 * 60); // 30 days
      await pipeline.exec();

    } catch (error) {
      logger.warn('Failed to track API key usage:', error);
    }
  }

  private async initializeUsageTracking(keyId: string): Promise<void> {
    const usageKey = `${this.USAGE_PREFIX}${keyId}`;
    const pipeline = this.redis.pipeline();
    
    pipeline.hset(usageKey, 'requests_count', '0');
    pipeline.hset(usageKey, 'rate_limit_hits', '0');
    pipeline.hset(usageKey, 'endpoints_used', '[]');
    pipeline.hset(usageKey, 'ip_addresses', '[]');
    pipeline.expire(usageKey, 30 * 24 * 60 * 60); // 30 days
    
    await pipeline.exec();
  }

  private async updateLastUsed(keyId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { last_used: new Date() }
    });
  }

  private async cleanupRateLimitData(keyId: string): Promise<void> {
    const pattern = `${this.RATE_LIMIT_PREFIX}${keyId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    const usageKey = `${this.USAGE_PREFIX}${keyId}`;
    await this.redis.del(usageKey);
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: {
    user_id?: string;
    event_type: string;
    ip_address: string;
    user_agent: string;
    location?: any;
    metadata?: any;
    risk_score?: number;
  }): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          user_id: event.user_id,
          event_type: event.event_type as any,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          location: event.location,
          metadata: event.metadata || {},
          risk_score: event.risk_score || 0
        }
      });
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}