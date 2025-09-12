import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from './errorHandler';

export interface RequestValidationOptions {
  maxBodySize?: number;
  maxQueryParams?: number;
  maxHeaders?: number;
  allowedMethods?: string[];
  requireContentType?: boolean;
}

/**
 * Comprehensive request validation middleware
 * Validates request structure, size limits, and format before processing
 */
export const requestValidationMiddleware = (options: RequestValidationOptions = {}) => {
  const {
    maxBodySize = 50 * 1024 * 1024, // 50MB
    maxQueryParams = 100,
    maxHeaders = 200,
    allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    requireContentType = false
  } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Validate HTTP method
      if (!allowedMethods.includes(request.method.toUpperCase())) {
        throw new AppError(`HTTP method ${request.method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
      }

      // 2. Validate URL length
      if (request.url.length > 2000) { // URLs over 2000 chars can cause issues
        throw new AppError('Request URL too long', 414, 'URI_TOO_LONG');
      }

      // 3. Validate query parameters count
      const queryKeys = Object.keys(request.query || {});
      if (queryKeys.length > maxQueryParams) {
        throw new AppError(`Too many query parameters. Maximum ${maxQueryParams} allowed`, 400, 'TOO_MANY_QUERY_PARAMS');
      }

      // 4. Validate headers count and common security headers
      const headerKeys = Object.keys(request.headers || {});
      if (headerKeys.length > maxHeaders) {
        throw new AppError(`Too many headers. Maximum ${maxHeaders} allowed`, 400, 'TOO_MANY_HEADERS');
      }

      // 5. Validate content-type for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
        const contentType = request.headers['content-type'];
        
        if (requireContentType && !contentType) {
          throw new AppError('Content-Type header is required', 400, 'MISSING_CONTENT_TYPE');
        }

        if (contentType) {
          const validContentTypes = [
            'application/json',
            'application/x-www-form-urlencoded',
            'multipart/form-data',
            'text/plain'
          ];

          const isValidContentType = validContentTypes.some(valid => 
            contentType.toLowerCase().startsWith(valid)
          );

          if (!isValidContentType) {
            throw new AppError(
              `Unsupported content-type: ${contentType}. Supported types: ${validContentTypes.join(', ')}`, 
              415, 
              'UNSUPPORTED_MEDIA_TYPE'
            );
          }
        }

        // Check content-length if provided
        const contentLength = request.headers['content-length'];
        if (contentLength && parseInt(contentLength) > maxBodySize) {
          throw new AppError(
            `Request body too large. Maximum ${Math.floor(maxBodySize / (1024 * 1024))}MB allowed`, 
            413, 
            'PAYLOAD_TOO_LARGE'
          );
        }
      }

      // 6. Validate common security headers patterns
      const userAgent = request.headers['user-agent'];
      if (userAgent && userAgent.length > 1000) {
        throw new AppError('User-Agent header too long', 400, 'INVALID_USER_AGENT');
      }

      const xForwardedFor = request.headers['x-forwarded-for'];
      if (xForwardedFor && typeof xForwardedFor === 'string') {
        // Basic validation for X-Forwarded-For format
        const ips = xForwardedFor.split(',').map(ip => ip.trim());
        if (ips.length > 10) { // Prevent potential DoS via huge proxy chains
          throw new AppError('Too many forwarded IPs', 400, 'INVALID_FORWARDED_IPS');
        }
      }

      // 7. Basic origin validation for CORS
      const origin = request.headers.origin;
      if (origin) {
        try {
          new URL(origin); // Basic URL format validation
        } catch {
          throw new AppError('Invalid origin format', 400, 'INVALID_ORIGIN');
        }
      }

      // 8. Authorization header basic validation
      const authHeader = request.headers.authorization;
      if (authHeader) {
        if (typeof authHeader !== 'string') {
          throw new AppError('Authorization header must be a string', 400, 'INVALID_AUTH_HEADER');
        }
        
        if (authHeader.length > 2000) { // Prevent huge tokens
          throw new AppError('Authorization header too long', 400, 'AUTH_HEADER_TOO_LONG');
        }

        // Basic Bearer token format validation
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          if (!token || token.includes('\n') || token.includes('\r')) {
            throw new AppError('Invalid Bearer token format', 400, 'INVALID_BEARER_TOKEN');
          }
        }
      }

      // 9. Rate limiting preparation - extract client identifier
      const clientId = getClientIdentifier(request);
      if (clientId.length > 100) { // Prevent identifier abuse
        throw new AppError('Client identifier too long', 400, 'INVALID_CLIENT_ID');
      }

      // 10. Add request validation metadata
      (request as any).validationPassed = true;
      (request as any).validatedAt = new Date();
      (request as any).clientId = clientId;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      request.log.error({ error }, 'Request validation failed');
      throw new AppError('Request validation failed', 400, 'VALIDATION_ERROR');
    }
  };
};

/**
 * Extract consistent client identifier for rate limiting
 */
function getClientIdentifier(request: FastifyRequest): string {
  // Priority order: userId > API key > IP address
  const userId = (request as any).userId;
  if (userId && typeof userId === 'string') {
    return `user:${userId}`;
  }

  const apiKey = request.headers['x-api-key'];
  if (apiKey && typeof apiKey === 'string') {
    return `api:${apiKey.substring(0, 10)}`;
  }

  // Fallback to IP with X-Forwarded-For support
  const forwardedFor = request.headers['x-forwarded-for'];
  const realIp = request.headers['x-real-ip'];
  
  const clientIp = (
    (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null) ||
    (typeof realIp === 'string' ? realIp : null) ||
    request.ip ||
    'unknown'
  );

  return `ip:${clientIp}`;
}

/**
 * Body size validation middleware for streaming requests
 */
export const bodySizeValidationMiddleware = (maxSize: number = 50 * 1024 * 1024) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
      let bodySize = 0;
      const originalBody = request.body;
      
      if (originalBody) {
        const bodyStr = typeof originalBody === 'string' 
          ? originalBody 
          : JSON.stringify(originalBody);
        bodySize = Buffer.byteLength(bodyStr, 'utf8');
        
        if (bodySize > maxSize) {
          throw new AppError(
            `Request body size ${Math.floor(bodySize / 1024)}KB exceeds maximum ${Math.floor(maxSize / 1024)}KB`,
            413,
            'PAYLOAD_TOO_LARGE'
          );
        }
      }
      
      (request as any).bodySize = bodySize;
    }
  };
};

/**
 * Security headers validation middleware
 */
export const securityHeadersValidationMiddleware = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const suspiciousHeaders = [
      'x-cluster-client-ip',
      'x-client-ip',
      'x-forwarded-host',
      'x-originating-ip'
    ];

    for (const header of suspiciousHeaders) {
      const value = request.headers[header];
      if (value && typeof value === 'string') {
        // Basic validation to prevent header injection
        if (value.includes('\n') || value.includes('\r') || value.includes('\x00')) {
          throw new AppError(`Invalid ${header} header format`, 400, 'HEADER_INJECTION_ATTEMPT');
        }
      }
    }

    // Validate custom headers don't contain control characters
    for (const [key, value] of Object.entries(request.headers)) {
      if (key.startsWith('x-') && typeof value === 'string') {
        if (/[\x00-\x1F\x7F]/.test(value)) {
          throw new AppError(`Invalid control characters in header ${key}`, 400, 'INVALID_HEADER_VALUE');
        }
      }
    }
  };
};