import * as Sentry from '@sentry/node';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Advanced Sentry Integration Service
 * 
 * Provides comprehensive error tracking, performance monitoring,
 * and business intelligence for CRYB Platform
 */
export class SentryIntegrationService {
  private initialized = false;
  private serviceName: string;
  private serviceVersion: string;
  private environment: string;
  
  constructor(options: {
    dsn?: string;
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    sampleRate?: number;
    tracesSampleRate?: number;
  } = {}) {
    this.serviceName = options.serviceName || 'cryb-api';
    this.serviceVersion = options.serviceVersion || '1.0.0';
    this.environment = options.environment || 'production';
    
    if (options.dsn) {
      this.initializeSentry(options);
    }
  }
  
  private initializeSentry(options: {
    dsn: string;
    sampleRate?: number;
    tracesSampleRate?: number;
  }): void {
    try {
      Sentry.init({
        dsn: options.dsn,
        environment: this.environment,
        release: `${this.serviceName}@${this.serviceVersion}`,
        
        // Performance monitoring
        tracesSampleRate: options.tracesSampleRate || 0.1, // 10% of transactions
        
        // Error sampling
        sampleRate: options.sampleRate || 1.0, // 100% of errors
        
        // Enhanced configuration
        maxBreadcrumbs: 100,
        attachStacktrace: true,
        sendDefaultPii: false, // Don't send PII for GDPR compliance
        
        // Custom tags
        initialScope: {
          tags: {
            service: this.serviceName,
            version: this.serviceVersion,
            environment: this.environment
          }
        },
        
        // Custom error filtering
        beforeSend: (event, hint) => {
          return this.filterEvent(event, hint);
        },
        
        // Custom breadcrumb filtering
        beforeBreadcrumb: (breadcrumb) => {
          return this.filterBreadcrumb(breadcrumb);
        }
      });
      
      this.initialized = true;
      console.log('🔍 Sentry Error Tracking initialized');
      console.log(`   Service: ${this.serviceName}@${this.serviceVersion}`);
      console.log(`   Environment: ${this.environment}`);
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }
  
  private filterEvent(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Skip certain error types
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Skip validation errors (handled by application)
        if (errorMessage.includes('validation') || errorMessage.includes('invalid input')) {
          return null;
        }
        
        // Skip rate limiting errors
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          return null;
        }
        
        // Skip authentication errors (expected)
        if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid token')) {
          return null;
        }
      }
    }
    
    // Add custom tags
    event.tags = {
      ...event.tags,
      component: 'api-server',
      team: 'platform-engineering'
    };
    
    return event;
  }
  
  private filterBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
      return null;
    }
    
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/metrics')) {
      return null;
    }
    
    return breadcrumb;
  }
  
  // ==============================================
  // ERROR TRACKING METHODS
  // ==============================================
  
  captureError(error: Error, context?: {
    user?: { id: string; username?: string; email?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }): string | undefined {
    if (!this.initialized) return undefined;
    
    return Sentry.withScope((scope) => {
      // Set user context
      if (context?.user) {
        scope.setUser(context.user);
      }
      
      // Set custom tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Set extra context
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      
      // Set severity level
      if (context?.level) {
        scope.setLevel(context.level);
      }
      
      return Sentry.captureException(error);
    });
  }
  
  captureMessage(message: string, context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id: string; username?: string; email?: string };
  }): string | undefined {
    if (!this.initialized) return undefined;
    
    return Sentry.withScope((scope) => {
      if (context?.user) {
        scope.setUser(context.user);
      }
      
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      
      return Sentry.captureMessage(message, context?.level || 'info');
    });
  }
  
  // ==============================================
  // CRYB-SPECIFIC TRACKING METHODS
  // ==============================================
  
  trackUserRegistration(userId: string, source: string, metadata?: Record<string, any>): void {
    this.captureMessage('New user registration', {
      level: 'info',
      tags: {
        event_type: 'user_registration',
        source
      },
      extra: {
        userId,
        ...metadata
      }
    });
  }
  
  trackUserAction(action: string, userId: string, metadata?: Record<string, any>): void {
    if (!this.initialized) return;
    
    Sentry.addBreadcrumb({
      category: 'user.action',
      message: action,
      level: 'info',
      data: {
        userId,
        ...metadata
      }
    });
  }
  
  trackAuthFailure(reason: string, ip: string, userAgent: string): void {
    this.captureMessage('Authentication failure', {
      level: 'warning',
      tags: {
        event_type: 'auth_failure',
        reason
      },
      extra: {
        ip,
        userAgent: userAgent.substring(0, 200)
      }
    });
  }
  
  // ==============================================
  // FASTIFY MIDDLEWARE
  // ==============================================
  
  createFastifyMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!this.initialized) return;
      
      // Set user context if available
      const user = (request as any).user;
      if (user) {
        Sentry.setUser({
          id: user.id,
          username: user.username,
          email: user.email
        });
      }
      
      reply.raw.on('finish', () => {
        // Track high-level request info
        if (reply.statusCode >= 400) {
          Sentry.addBreadcrumb({
            category: 'http',
            message: `${request.method} ${request.url}`,
            level: reply.statusCode >= 500 ? 'error' : 'warning',
            data: {
              method: request.method,
              url: request.url,
              statusCode: reply.statusCode,
              userId: user?.id
            }
          });
        }
      });
    };
  }
  
  // ==============================================
  // ERROR HANDLER
  // ==============================================
  
  createErrorHandler() {
    return (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      
      // Capture error in Sentry
      const eventId = this.captureError(error, {
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email
        } : undefined,
        tags: {
          endpoint: request.url,
          method: request.method,
          status_code: reply.statusCode.toString()
        },
        extra: {
          requestId: (request as any).id,
          query: request.query,
          params: request.params
        }
      });
      
      console.error('Request error captured in Sentry:', eventId, error.message);
    };
  }
  
  // ==============================================
  // UTILITY METHODS
  // ==============================================
  
  setUser(user: { id: string; username?: string; email?: string }): void {
    if (!this.initialized) return;
    Sentry.setUser(user);
  }
  
  async flush(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return true;
    return Sentry.flush(timeout);
  }
  
  close(timeout = 2000): Promise<boolean> {
    if (!this.initialized) return Promise.resolve(true);
    return Sentry.close(timeout);
  }
}

/**
 * Fastify plugin for Sentry integration
 */
export async function sentryIntegrationPlugin(
  fastify: FastifyInstance,
  options: {
    dsn?: string;
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    sampleRate?: number;
    tracesSampleRate?: number;
  } = {}
) {
  const sentry = new SentryIntegrationService(options);
  
  fastify.decorate('sentry', sentry);
  
  // Add middleware for request tracking
  fastify.addHook('onRequest', sentry.createFastifyMiddleware());
  
  // Add error handler
  fastify.setErrorHandler(sentry.createErrorHandler());
  
  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await sentry.flush();
    await sentry.close();
  });
  
  if (options.dsn) {
    console.log('🔍 Sentry Integration Service initialized');
    console.log('   📊 Error tracking and performance monitoring');
    console.log('   🎯 Business intelligence and user tracking');
    console.log('   🛡️  Security incident monitoring');
  } else {
    console.log('⚠️  Sentry DSN not provided - running in mock mode');
  }
}

export default SentryIntegrationService;