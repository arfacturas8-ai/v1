import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  username?: string;
  userAgent?: string;
  ip: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    context: RequestContext;
  }
}

export const requestLogger = async (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  
  // Extract client info
  const userAgent = request.headers['user-agent'];
  const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] || 
            (request.headers['x-real-ip'] as string) || 
            request.ip;

  // Create request context
  request.context = {
    requestId,
    startTime,
    userAgent,
    ip
  };

  // Set response headers
  reply.header('X-Request-ID', requestId);
  
  // Set response time header (calculated at request time)
  reply.header('X-Response-Time', `${Date.now() - startTime}ms`);

  // Log incoming request with filtered sensitive data
  const filteredQuery = filterSensitiveData(request.query);
  const filteredHeaders = filterSensitiveHeaders(request.headers);
  
  request.log.info({
    requestId,
    method: request.method,
    url: request.url,
    userAgent,
    ip,
    query: filteredQuery,
    params: request.params,
    headers: filteredHeaders,
    timestamp: new Date().toISOString()
  }, `Incoming request: ${request.method} ${request.url}`);
};

// Helper functions for data filtering
const filterSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'jwt', 'refresh', 'csrf', 'signature'
  ];
  
  for (const key in filtered) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      filtered[key] = '[REDACTED]';
    }
  }
  
  return filtered;
};

const filterSensitiveHeaders = (headers: any): any => {
  if (!headers) return {};
  
  const filtered = { ...headers };
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-access-token', 'x-csrf-token'
  ];
  
  for (const header in filtered) {
    if (sensitiveHeaders.some(sensitive => header.toLowerCase().includes(sensitive))) {
      filtered[header] = '[REDACTED]';
    }
  }
  
  return filtered;
};

export const sensitiveDataFilter = (key: string, value: any): any => {
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'jwt', 'refresh', 'csrf'
  ];
  
  if (typeof key === 'string' && 
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
    return '[REDACTED]';
  }
  
  return value;
};

// Enhanced logging with structured data
export interface LogContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  operation: string;
  resource?: string;
  metadata?: Record<string, any>;
}

export const createStructuredLog = (
  level: 'debug' | 'info' | 'warn' | 'error',
  context: LogContext,
  message: string,
  error?: Error
) => {
  return {
    level,
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    userId: context.userId,
    sessionId: context.sessionId,
    operation: context.operation,
    resource: context.resource,
    message,
    metadata: context.metadata,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined
  };
};

// Performance metrics helper
export const captureMetrics = (request: FastifyRequest, reply: FastifyReply) => {
  const startTime = Date.now();
  
  return {
    start: () => startTime,
    end: () => {
      const duration = Date.now() - startTime;
      const metrics = {
        duration,
        statusCode: reply.statusCode,
        method: request.method,
        route: request.url,
        timestamp: new Date().toISOString()
      };
      
      // You could send these metrics to a monitoring service here
      return metrics;
    }
  };
};