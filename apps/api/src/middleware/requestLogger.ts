import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
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
  
  // Calculate and set response time
  const duration = Date.now() - startTime;
  reply.header('X-Response-Time', `${duration}ms`);

  // Log incoming request
  request.log.info({
    requestId,
    method: request.method,
    url: request.url,
    userAgent,
    ip,
    query: request.query,
    params: request.params
  }, `${request.method} ${request.url}`);
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