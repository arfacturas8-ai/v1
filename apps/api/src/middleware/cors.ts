import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';

/**
 * Enhanced CORS Configuration
 * 
 * Provides flexible, secure CORS handling with support for:
 * - Dynamic origin validation
 * - Environment-based configuration
 * - Detailed error responses
 * - Security best practices
 */

interface CorsOptions {
  // Allowed origins (can be patterns, functions, or strings)
  origins?: Array<string | RegExp | ((origin: string | undefined) => boolean)>;
  // Methods allowed for CORS requests
  methods?: string[];
  // Headers allowed in requests
  allowedHeaders?: string[];
  // Headers exposed to the client
  exposedHeaders?: string[];
  // Allow credentials (cookies, authorization headers, etc.)
  credentials?: boolean;
  // How long the browser can cache preflight results
  maxAge?: number;
  // Whether to pass the CORS preflight response to the next handler
  preflightContinue?: boolean;
  // Status code for successful OPTIONS requests
  optionsSuccessStatus?: number;
}

// Development origins (localhost variations)
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:19001', // Expo dev
  'http://localhost:19006', // Expo web
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://0.0.0.0:3000',
  'http://0.0.0.0:3001',
  'http://0.0.0.0:3002'
];

// Production domains (from environment variables)
const PRODUCTION_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Mobile app schemes
const MOBILE_ORIGINS = [
  'cryb://',
  'exp://192.168.',
  'exp://10.',
  'exp://172.'
];

/**
 * Create CORS configuration based on environment
 */
export function createCorsOptions(): CorsOptions {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Base allowed origins
  let allowedOrigins: Array<string | RegExp | ((origin: string | undefined) => boolean)> = [];

  if (isDevelopment) {
    // In development, allow common localhost variations
    allowedOrigins = [
      ...DEVELOPMENT_ORIGINS,
      // Allow any localhost with any port for development
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/0\.0\.0\.0(:\d+)?$/,
      // Allow Expo development
      /^exp:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/,
      // Allow mobile app schemes
      (origin) => {
        if (!origin) return true; // Allow no-origin requests (mobile apps, Postman, etc.)
        return MOBILE_ORIGINS.some(scheme => origin.startsWith(scheme));
      }
    ];
  }

  if (isProduction) {
    // In production, use configured origins
    allowedOrigins = [
      ...PRODUCTION_ORIGINS,
      // Allow subdomains for production domains
      ...PRODUCTION_ORIGINS.map(origin => {
        try {
          const url = new URL(origin);
          return new RegExp(`^https://(.*\\.)?${url.hostname.replace('.', '\\.')}$`);
        } catch {
          return origin;
        }
      }),
      // Allow mobile apps in production
      (origin) => {
        if (!origin) return false; // Require origin in production for web requests
        return MOBILE_ORIGINS.some(scheme => origin.startsWith(scheme));
      }
    ];
  }

  return {
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Forwarded-For',
      'X-Real-IP',
      'User-Agent',
      'X-Request-ID',
      'X-Correlation-ID',
      'Cache-Control',
      'Pragma',
      'If-None-Match',
      'If-Modified-Since'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Request-ID',
      'X-Response-Time'
    ],
    credentials: true,
    maxAge: isDevelopment ? 86400 : 7200, // 24h dev, 2h prod
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
}

/**
 * Validate if an origin is allowed
 */
export function isOriginAllowed(
  origin: string | undefined, 
  allowedOrigins: Array<string | RegExp | ((origin: string | undefined) => boolean)>
): boolean {
  // No origin header is allowed for certain requests (mobile apps, server-to-server)
  if (!origin) {
    return allowedOrigins.some(allowed => 
      typeof allowed === 'function' && allowed(origin)
    );
  }

  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    if (typeof allowed === 'function') {
      return allowed(origin);
    }
    return false;
  });
}

/**
 * Enhanced CORS middleware with detailed logging and error handling
 */
export function createCorsMiddleware(options: CorsOptions = {}) {
  const config = { ...createCorsOptions(), ...options };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const origin = request.headers.origin;
    const method = request.method;
    const requestedHeaders = request.headers['access-control-request-headers'];
    const requestedMethod = request.headers['access-control-request-method'];

    // Log CORS requests in development
    if (process.env.NODE_ENV === 'development') {
      request.log.debug({
        origin,
        method,
        requestedHeaders,
        requestedMethod,
        url: request.url
      }, 'CORS request');
    }

    // Check if origin is allowed
    const originAllowed = !config.origins || isOriginAllowed(origin, config.origins);

    if (!originAllowed) {
      request.log.warn({
        origin,
        method,
        url: request.url,
        ip: request.ip
      }, 'CORS request blocked: origin not allowed');

      // Return detailed error in development, generic error in production
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `Origin '${origin}' is not allowed by CORS policy`
        : 'CORS policy violation';

      return reply.code(403).send({
        success: false,
        error: errorMessage,
        code: 'CORS_POLICY_VIOLATION',
        timestamp: new Date().toISOString()
      });
    }

    // Set CORS headers
    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin);
    }

    if (config.credentials) {
      reply.header('Access-Control-Allow-Credentials', 'true');
    }

    if (config.exposedHeaders && config.exposedHeaders.length > 0) {
      reply.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      request.log.debug('Handling CORS preflight request');

      // Check if method is allowed
      if (requestedMethod && config.methods && !config.methods.includes(requestedMethod)) {
        return reply.code(405).send({
          success: false,
          error: `Method '${requestedMethod}' not allowed`,
          code: 'METHOD_NOT_ALLOWED',
          details: {
            allowedMethods: config.methods
          },
          timestamp: new Date().toISOString()
        });
      }

      // Check if headers are allowed
      if (requestedHeaders && config.allowedHeaders) {
        const requestedHeadersArray = requestedHeaders.split(',').map(h => h.trim());
        const disallowedHeaders = requestedHeadersArray.filter(
          header => !config.allowedHeaders!.some(allowed => 
            allowed.toLowerCase() === header.toLowerCase()
          )
        );

        if (disallowedHeaders.length > 0) {
          return reply.code(403).send({
            success: false,
            error: 'Requested headers not allowed',
            code: 'HEADERS_NOT_ALLOWED',
            details: {
              disallowedHeaders,
              allowedHeaders: config.allowedHeaders
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Set preflight headers
      if (config.methods) {
        reply.header('Access-Control-Allow-Methods', config.methods.join(', '));
      }

      if (config.allowedHeaders) {
        reply.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      }

      if (config.maxAge) {
        reply.header('Access-Control-Max-Age', config.maxAge.toString());
      }

      // Send preflight response
      return reply.code(config.optionsSuccessStatus || 204).send();
    }

    // For non-preflight requests, just continue
  };
}

/**
 * Register CORS middleware with Fastify
 */
export async function registerCors(fastify: FastifyInstance, options: CorsOptions = {}) {
  const corsMiddleware = createCorsMiddleware(options);

  // Apply CORS to all routes
  fastify.addHook('onRequest', corsMiddleware);

  // Log CORS configuration
  const config = { ...createCorsOptions(), ...options };
  const isDevelopment = process.env.NODE_ENV === 'development';

  fastify.log.info({
    environment: process.env.NODE_ENV,
    credentials: config.credentials,
    methods: config.methods,
    maxAge: config.maxAge,
    allowedOrigins: isDevelopment ? 'development-mode (permissive)' : 'production-mode (strict)'
  }, 'CORS middleware registered');
}

/**
 * Quick CORS validation for testing
 */
export function validateCorsRequest(
  origin: string | undefined,
  method: string,
  requestedHeaders?: string
): { allowed: boolean; reason?: string } {
  const config = createCorsOptions();

  if (!isOriginAllowed(origin, config.origins || [])) {
    return { allowed: false, reason: `Origin '${origin}' not allowed` };
  }

  if (config.methods && !config.methods.includes(method)) {
    return { allowed: false, reason: `Method '${method}' not allowed` };
  }

  if (requestedHeaders && config.allowedHeaders) {
    const headers = requestedHeaders.split(',').map(h => h.trim());
    const disallowed = headers.filter(header => 
      !config.allowedHeaders!.some(allowed => 
        allowed.toLowerCase() === header.toLowerCase()
      )
    );

    if (disallowed.length > 0) {
      return { allowed: false, reason: `Headers not allowed: ${disallowed.join(', ')}` };
    }
  }

  return { allowed: true };
}

/**
 * Development helper to test CORS configuration
 */
export function getCorsInfo() {
  const config = createCorsOptions();
  return {
    environment: process.env.NODE_ENV,
    allowedOrigins: config.origins,
    allowedMethods: config.methods,
    allowedHeaders: config.allowedHeaders,
    exposedHeaders: config.exposedHeaders,
    credentials: config.credentials,
    maxAge: config.maxAge
  };
}