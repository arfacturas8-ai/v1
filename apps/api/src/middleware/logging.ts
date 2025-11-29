import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * Enhanced Request/Response Logging Middleware
 * 
 * Provides comprehensive logging with:
 * - Request/response correlation tracking
 * - Performance metrics
 * - Sensitive data redaction
 * - Structured logging format
 * - Error context capture
 * - User activity tracking
 * - API usage analytics
 */

interface LoggingOptions {
  // Include request body in logs (be careful with sensitive data)
  includeRequestBody?: boolean;
  // Include response body in logs
  includeResponseBody?: boolean;
  // Maximum body size to log (bytes)
  maxBodySize?: number;
  // Fields to redact from logs
  redactFields?: string[];
  // Headers to redact
  redactHeaders?: string[];
  // Include user information in logs
  includeUser?: boolean;
  // Log successful requests
  logSuccess?: boolean;
  // Log slow requests (threshold in ms)
  slowRequestThreshold?: number;
  // Custom log level for different status codes
  logLevels?: Record<number, 'trace' | 'debug' | 'info' | 'warn' | 'error'>;
  // Skip logging for certain paths
  skipPaths?: string[];
  // Skip logging for certain user agents
  skipUserAgents?: string[];
}

interface RequestContext {
  requestId: string;
  correlationId?: string;
  userId?: string;
  userAgent?: string;
  ip: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  contentLength?: number;
  error?: any;
  userInfo?: {
    id: string;
    username?: string;
    role?: string;
    premiumType?: string;
  };
}

// Default configuration
const DEFAULT_OPTIONS: Required<LoggingOptions> = {
  includeRequestBody: false,
  includeResponseBody: false,
  maxBodySize: 10000, // 10KB
  redactFields: [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'session',
    'ssn',
    'creditCard',
    'cvv'
  ],
  redactHeaders: [
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token'
  ],
  includeUser: true,
  logSuccess: true,
  slowRequestThreshold: 1000, // 1 second
  logLevels: {
    200: 'info',
    201: 'info',
    204: 'info',
    300: 'info',
    301: 'info',
    302: 'info',
    304: 'debug',
    400: 'warn',
    401: 'warn',
    403: 'warn',
    404: 'debug',
    409: 'warn',
    422: 'warn',
    429: 'warn',
    500: 'error',
    502: 'error',
    503: 'error',
    504: 'error'
  },
  skipPaths: ['/health', '/metrics', '/favicon.ico'],
  skipUserAgents: ['kube-probe', 'health-check']
};

export class RequestLogger {
  private requestCounts = new Map<string, number>();
  private userActivity = new Map<string, { lastSeen: number; requestCount: number }>();

  constructor(private options: LoggingOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Create logging middleware
   */
  createLoggingMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = request.headers['x-request-id'] as string || 
                       request.headers['x-correlation-id'] as string || 
                       randomUUID();

      // Skip logging for configured paths and user agents
      if (this.shouldSkipLogging(request)) {
        return;
      }

      // Create request context
      const context: RequestContext = {
        requestId,
        correlationId: request.headers['x-correlation-id'] as string,
        userId: (request as any).userId,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        method: request.method,
        url: request.url,
        startTime
      };

      // Add request ID to request for use in other middleware
      (request as any).requestId = requestId;
      (request as any).startTime = startTime;

      // Set correlation header
      reply.header('x-request-id', requestId);

      // Get user info if available and configured
      if (this.options.includeUser && context.userId) {
        context.userInfo = await this.getUserInfo(context.userId, request);
      }

      // Track user activity
      if (context.userId) {
        this.trackUserActivity(context.userId);
      }

      // Log request start
      this.logRequestStart(request, context);

      // Intercept response to log completion
      this.interceptResponse(request, reply, context);
    };
  }

  /**
   * Check if request should be skipped
   */
  private shouldSkipLogging(request: FastifyRequest): boolean {
    const path = request.url.split('?')[0];
    const userAgent = request.headers['user-agent'] || '';

    // Skip configured paths
    if (this.options.skipPaths?.some(skipPath => path === skipPath)) {
      return true;
    }

    // Skip configured user agents
    if (this.options.skipUserAgents?.some(skipUA => userAgent.includes(skipUA))) {
      return true;
    }

    return false;
  }

  /**
   * Get user information for logging
   */
  private async getUserInfo(userId: string, request: FastifyRequest): Promise<RequestContext['userInfo']> {
    try {
      // Try to get user info from request context first
      const user = (request as any).user;
      if (user) {
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          premiumType: user.premiumType
        };
      }

      // Fallback to database query (consider caching this)
      const { prisma } = await import('@cryb/database');
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          role: true,
          premiumType: true
        }
      });

      return dbUser || { id: userId };
    } catch (error) {
      return { id: userId };
    }
  }

  /**
   * Track user activity
   */
  private trackUserActivity(userId: string) {
    const now = Date.now();
    const activity = this.userActivity.get(userId) || { lastSeen: 0, requestCount: 0 };
    
    activity.lastSeen = now;
    activity.requestCount += 1;
    
    this.userActivity.set(userId, activity);

    // Clean up old activity data every 1000 requests
    if (this.userActivity.size > 1000) {
      const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
      for (const [uid, act] of this.userActivity.entries()) {
        if (act.lastSeen < cutoff) {
          this.userActivity.delete(uid);
        }
      }
    }
  }

  /**
   * Log request start
   */
  private logRequestStart(request: FastifyRequest, context: RequestContext) {
    const logData: any = {
      type: 'request_start',
      requestId: context.requestId,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      ip: context.ip,
      userAgent: context.userAgent,
      headers: this.redactHeaders(request.headers),
      query: request.query,
      params: request.params,
      timestamp: new Date(context.startTime).toISOString()
    };

    // Add user info
    if (context.userInfo) {
      logData.user = context.userInfo;
    }

    // Add request body if configured
    if (this.options.includeRequestBody && request.body) {
      logData.body = this.redactSensitiveData(
        this.truncateData(request.body, this.options.maxBodySize!)
      );
    }

    request.log.info(logData, 'Request started');
  }

  /**
   * Intercept response for logging
   */
  private interceptResponse(request: FastifyRequest, reply: FastifyReply, context: RequestContext) {
    const originalSend = reply.send.bind(reply);

    reply.send = function(payload: any) {
      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;
      context.statusCode = reply.statusCode;
      context.contentLength = this.getContentLength(payload);

      // Log response
      this.logRequestComplete(request, context, payload);

      return originalSend(payload);
    }.bind(this);

    // Handle errors
    reply.addHook('onError', async (request, reply, error) => {
      context.endTime = Date.now();
      context.duration = context.endTime - context.startTime;
      context.statusCode = reply.statusCode;
      context.error = {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };

      this.logRequestError(request, context, error);
    });
  }

  /**
   * Log request completion
   */
  private logRequestComplete(request: FastifyRequest, context: RequestContext, payload: any) {
    const logLevel = this.getLogLevel(context.statusCode!);
    
    // Skip successful requests if not configured to log them
    if (!this.options.logSuccess && context.statusCode! < 400) {
      return;
    }

    const logData: any = {
      type: 'request_complete',
      requestId: context.requestId,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      statusCode: context.statusCode,
      duration: context.duration,
      contentLength: context.contentLength,
      ip: context.ip,
      timestamp: new Date(context.endTime!).toISOString()
    };

    // Add user info
    if (context.userInfo) {
      logData.user = context.userInfo;
    }

    // Add performance flags
    if (context.duration! > this.options.slowRequestThreshold!) {
      logData.slow = true;
    }

    // Add response body if configured
    if (this.options.includeResponseBody && payload) {
      logData.response = this.redactSensitiveData(
        this.truncateData(payload, this.options.maxBodySize!)
      );
    }

    request.log[logLevel](logData, `Request completed - ${context.statusCode} in ${context.duration}ms`);

    // Update request counts
    const endpoint = `${context.method} ${context.url.split('?')[0]}`;
    this.requestCounts.set(endpoint, (this.requestCounts.get(endpoint) || 0) + 1);
  }

  /**
   * Log request error
   */
  private logRequestError(request: FastifyRequest, context: RequestContext, error: Error) {
    const logData: any = {
      type: 'request_error',
      requestId: context.requestId,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      statusCode: context.statusCode,
      duration: context.duration,
      ip: context.ip,
      error: context.error,
      timestamp: new Date(context.endTime!).toISOString()
    };

    // Add user info
    if (context.userInfo) {
      logData.user = context.userInfo;
    }

    request.log.error(logData, `Request failed - ${error.message}`);
  }

  /**
   * Get appropriate log level for status code
   */
  private getLogLevel(statusCode: number): 'trace' | 'debug' | 'info' | 'warn' | 'error' {
    return this.options.logLevels![statusCode] || 
           (statusCode >= 500 ? 'error' :
            statusCode >= 400 ? 'warn' : 'info');
  }

  /**
   * Redact sensitive data from object
   */
  private redactSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const result = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      
      if (this.options.redactFields!.some(field => keyLower.includes(field.toLowerCase()))) {
        (result as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (result as any)[key] = this.redactSensitiveData(value);
      } else {
        (result as any)[key] = value;
      }
    }

    return result;
  }

  /**
   * Redact sensitive headers
   */
  private redactHeaders(headers: any): any {
    const result = { ...headers };
    
    this.options.redactHeaders!.forEach(header => {
      if (result[header]) {
        result[header] = '[REDACTED]';
      }
      if (result[header.toLowerCase()]) {
        result[header.toLowerCase()] = '[REDACTED]';
      }
    });

    return result;
  }

  /**
   * Truncate data to maximum size
   */
  private truncateData(data: any, maxSize: number): any {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length <= maxSize) {
      return data;
    }

    const truncated = jsonString.substring(0, maxSize);
    return `${truncated}... [TRUNCATED - ${jsonString.length} bytes total]`;
  }

  /**
   * Get content length from payload
   */
  private getContentLength(payload: any): number {
    if (!payload) return 0;
    
    if (typeof payload === 'string') {
      return Buffer.byteLength(payload, 'utf8');
    }
    
    if (Buffer.isBuffer(payload)) {
      return payload.length;
    }
    
    return Buffer.byteLength(JSON.stringify(payload), 'utf8');
  }

  /**
   * Get logging statistics
   */
  getStats(): {
    totalRequests: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    activeUsers: number;
    averageUserActivity: number;
  } {
    const totalRequests = Array.from(this.requestCounts.values())
      .reduce((sum, count) => sum + count, 0);

    const topEndpoints = Array.from(this.requestCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    const now = Date.now();
    const recentUsers = Array.from(this.userActivity.values())
      .filter(activity => now - activity.lastSeen < 60 * 60 * 1000); // Active in last hour

    const averageUserActivity = recentUsers.length > 0
      ? recentUsers.reduce((sum, activity) => sum + activity.requestCount, 0) / recentUsers.length
      : 0;

    return {
      totalRequests,
      topEndpoints,
      activeUsers: recentUsers.length,
      averageUserActivity: Math.round(averageUserActivity * 100) / 100
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.requestCounts.clear();
    this.userActivity.clear();
  }
}

/**
 * Factory function to create request logger
 */
export function createRequestLogger(options: LoggingOptions = {}): RequestLogger {
  return new RequestLogger(options);
}

/**
 * Predefined logging configurations
 */
export const LoggingConfigs = {
  // Development logging (verbose)
  development: {
    includeRequestBody: true,
    includeResponseBody: true,
    maxBodySize: 50000,
    logSuccess: true,
    slowRequestThreshold: 500
  },

  // Production logging (minimal)
  production: {
    includeRequestBody: false,
    includeResponseBody: false,
    logSuccess: false,
    slowRequestThreshold: 2000,
    skipPaths: ['/health', '/metrics', '/favicon.ico', '/robots.txt']
  },

  // Debug logging (everything)
  debug: {
    includeRequestBody: true,
    includeResponseBody: true,
    maxBodySize: 100000,
    logSuccess: true,
    slowRequestThreshold: 100,
    skipPaths: []
  },

  // Security focused logging
  security: {
    includeRequestBody: false,
    includeResponseBody: false,
    includeUser: true,
    logSuccess: false,
    redactFields: [
      'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
      'secret', 'apiKey', 'authorization', 'cookie', 'session',
      'ssn', 'creditCard', 'cvv', 'pin', 'otp'
    ]
  }
};

/**
 * Middleware factory for common logging patterns
 */
export function createLoggingMiddleware(options: LoggingOptions = {}) {
  const logger = createRequestLogger(options);
  return logger.createLoggingMiddleware();
}