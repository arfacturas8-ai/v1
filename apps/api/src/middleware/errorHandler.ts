import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@cryb/database';
import { sendError, ErrorResponses, ErrorResponse } from '../utils/responses';
import { randomUUID } from 'crypto';

export interface APIError {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Add request tracking for debugging
  const requestId = request.headers['x-request-id'] || 
                   request.headers['x-correlation-id'] || 
                   randomUUID();
  
  const startTime = (request as any).startTime || Date.now();
  const processingTime = Date.now() - startTime;

  // Handle custom AppError
  if (error instanceof AppError) {
    return sendError(reply, error.message, {
      code: error.code,
      details: {
        ...error.details,
        requestId,
        processingTime
      },
      statusCode: error.statusCode,
      path: request.url,
      method: request.method
    });
  }

  // Handle Prisma database errors with better messaging
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 500;
    let message = 'Database operation failed';
    let code = 'DATABASE_ERROR';
    let details: Record<string, any> = { requestId, processingTime };

    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'This resource already exists';
        code = 'DUPLICATE_RESOURCE';
        // Extract field information for user-friendly messages
        const target = error.meta?.target as string[] | undefined;
        if (target) {
          details.conflictingFields = target;
          message = `A resource with this ${target.join(' and ')} already exists`;
        }
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Referenced resource does not exist';
        code = 'INVALID_REFERENCE';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'The requested resource was not found';
        code = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relationship in request';
        code = 'INVALID_RELATION';
        break;
      case 'P2021':
        statusCode = 500;
        message = 'The table does not exist in the current database';
        code = 'TABLE_NOT_FOUND';
        break;
      case 'P2022':
        statusCode = 500;
        message = 'The column does not exist in the current database';
        code = 'COLUMN_NOT_FOUND';
        break;
    }

    // Add development details
    if (process.env.NODE_ENV === 'development') {
      details.prisma = {
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion
      };
    }

    return sendError(reply, message, {
      code,
      details,
      statusCode,
      path: request.url,
      method: request.method
    });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const details: Record<string, any> = { requestId, processingTime };
    
    if (process.env.NODE_ENV === 'development') {
      details.validation = error.message;
    }

    return sendError(reply, 'The provided data is invalid', {
      code: 'VALIDATION_ERROR',
      details,
      statusCode: 400,
      path: request.url,
      method: request.method
    });
  }

  // Handle Fastify validation errors with field-specific messages
  if (error.validation) {
    const validationDetails: Record<string, string[]> = {};
    
    if (Array.isArray(error.validation)) {
      error.validation.forEach((err: any) => {
        const path = err.instancePath || err.dataPath || 'unknown';
        const field = path.replace(/^\//, '') || 'root';
        
        if (!validationDetails[field]) {
          validationDetails[field] = [];
        }
        
        validationDetails[field].push(err.message || 'Invalid value');
      });
    }

    return sendError(reply, 'Request validation failed', {
      code: 'REQUEST_VALIDATION_ERROR',
      details: {
        validation: validationDetails,
        validationContext: error.validationContext,
        requestId,
        processingTime
      },
      statusCode: 400,
      path: request.url,
      method: request.method
    });
  }

  // Handle specific HTTP errors with better messages
  switch (error.statusCode) {
    case 400:
      return ErrorResponses.badRequest(reply, error.message || 'Bad request', {
        requestId,
        processingTime
      });
      
    case 401:
      return ErrorResponses.unauthorized(reply, error.message || 'Authentication required');
      
    case 403:
      return ErrorResponses.forbidden(reply, error.message || 'Access denied');
      
    case 404:
      return ErrorResponses.notFound(reply, error.message || 'Resource not found');
      
    case 409:
      return ErrorResponses.conflict(reply, error.message || 'Resource conflict', {
        requestId,
        processingTime
      });
      
    case 422:
      return ErrorResponses.unprocessableEntity(reply, error.message || 'Validation failed');
      
    case 429:
      const retryAfter = reply.getHeader('retry-after') as string;
      return ErrorResponses.tooManyRequests(reply, 'Rate limit exceeded', parseInt(retryAfter) || undefined);
      
    case 503:
      return ErrorResponses.serviceUnavailable(reply, error.message || 'Service temporarily unavailable');
  }

  // Log unexpected errors with full context
  request.log.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: (error as any).code
    },
    request: {
      id: requestId,
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers['user-agent'],
        'content-type': request.headers['content-type'],
        'authorization': request.headers.authorization ? '[REDACTED]' : undefined
      },
      params: request.params,
      query: request.query,
      ip: request.ip,
      processingTime
    }
  }, 'Unhandled error occurred');

  // Handle unexpected errors
  const statusCode = error.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';
  
  return sendError(reply, isDev ? error.message : 'An unexpected error occurred', {
    code: 'INTERNAL_SERVER_ERROR',
    details: {
      requestId,
      processingTime,
      ...(isDev && { 
        stack: error.stack,
        errorName: error.name
      })
    },
    statusCode,
    path: request.url,
    method: request.method
  });
};

// Helper functions for throwing common errors
export const throwNotFound = (resource: string, id?: string) => {
  throw new AppError(
    `${resource}${id ? ` with ID ${id}` : ''} not found`,
    404,
    'RESOURCE_NOT_FOUND',
    { resource, id }
  );
};

export const throwUnauthorized = (message: string = 'Authentication required') => {
  throw new AppError(message, 401, 'UNAUTHORIZED');
};

export const throwForbidden = (message: string = 'Access denied') => {
  throw new AppError(message, 403, 'FORBIDDEN');
};

export const throwBadRequest = (message: string, details?: Record<string, any>) => {
  throw new AppError(message, 400, 'BAD_REQUEST', details);
};

export const throwConflict = (message: string, details?: Record<string, any>) => {
  throw new AppError(message, 409, 'CONFLICT', details);
};

export const throwValidationError = (message: string, errors: Record<string, string[]>) => {
  throw new AppError(message, 422, 'VALIDATION_ERROR', { errors });
};

export const throwTooManyRequests = (message: string = 'Too many requests', retryAfter?: number) => {
  throw new AppError(message, 429, 'TOO_MANY_REQUESTS', { retryAfter });
};

export const throwServiceUnavailable = (message: string = 'Service temporarily unavailable', details?: Record<string, any>) => {
  throw new AppError(message, 503, 'SERVICE_UNAVAILABLE', details);
};

export const throwInternalError = (message: string = 'Internal server error', details?: Record<string, any>) => {
  throw new AppError(message, 500, 'INTERNAL_SERVER_ERROR', details);
};

export const throwPayloadTooLarge = (message: string = 'Payload too large', maxSize?: number) => {
  throw new AppError(message, 413, 'PAYLOAD_TOO_LARGE', { maxSize });
};

export const throwMethodNotAllowed = (method: string, allowedMethods: string[]) => {
  throw new AppError(
    `Method ${method} not allowed`,
    405,
    'METHOD_NOT_ALLOWED',
    { method, allowedMethods }
  );
};

export const throwUnsupportedMediaType = (contentType: string, supportedTypes: string[]) => {
  throw new AppError(
    `Unsupported media type: ${contentType}`,
    415,
    'UNSUPPORTED_MEDIA_TYPE',
    { contentType, supportedTypes }
  );
};

// Enhanced error response builder
export const createErrorResponse = (
  error: any,
  request: FastifyRequest,
  includeStack: boolean = false
): APIError => {
  const baseError: APIError = {
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
    statusCode: 500
  };

  if (error instanceof AppError) {
    return {
      ...baseError,
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode
    };
  }

  // Handle different error types
  if (error.name === 'ValidationError') {
    return {
      ...baseError,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: error.details || {}
    };
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      ...baseError,
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
      statusCode: 503
    };
  }

  if (error.code === 'TIMEOUT') {
    return {
      ...baseError,
      error: 'Request timeout',
      code: 'REQUEST_TIMEOUT',
      statusCode: 408
    };
  }

  // Default error response
  return {
    ...baseError,
    error: includeStack ? error.message : 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    details: includeStack ? { stack: error.stack } : undefined
  };
};

// Error classification helper
export const classifyError = (error: any): 'client' | 'server' | 'network' | 'validation' => {
  if (error instanceof AppError) {
    if (error.statusCode >= 400 && error.statusCode < 500) return 'client';
    if (error.statusCode >= 500) return 'server';
  }
  
  if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') return 'validation';
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'TIMEOUT') return 'network';
  
  return 'server';
};

// Error metrics helper
export const getErrorMetrics = (error: any) => {
  const classification = classifyError(error);
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorCode = error instanceof AppError ? error.code : 'UNKNOWN_ERROR';
  
  return {
    classification,
    statusCode,
    errorCode,
    timestamp: Date.now()
  };
};