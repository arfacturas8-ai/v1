import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { Prisma } from '@cryb/database';

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
  const baseError: APIError = {
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
    statusCode: 500
  };

  // Handle custom AppError
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      ...baseError,
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let statusCode = 500;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        code = 'INVALID_REFERENCE';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid relation reference';
        code = 'INVALID_RELATION';
        break;
    }

    return reply.code(statusCode).send({
      ...baseError,
      error: message,
      code,
      statusCode,
      details: process.env.NODE_ENV === 'development' ? {
        prismaCode: error.code,
        meta: error.meta
      } : undefined
    });
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.code(400).send({
      ...baseError,
      error: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: process.env.NODE_ENV === 'development' ? {
        validation: error.message
      } : undefined
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      ...baseError,
      error: 'Invalid request data',
      code: 'REQUEST_VALIDATION_ERROR',
      statusCode: 400,
      details: {
        validation: error.validation,
        validationContext: error.validationContext
      }
    });
  }

  // Handle rate limit errors
  if (error.statusCode === 429) {
    return reply.code(429).send({
      ...baseError,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      details: {
        retryAfter: reply.getHeader('retry-after')
      }
    });
  }

  // Handle authentication errors
  if (error.statusCode === 401) {
    return reply.code(401).send({
      ...baseError,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
      statusCode: 401
    });
  }

  // Handle authorization errors
  if (error.statusCode === 403) {
    return reply.code(403).send({
      ...baseError,
      error: 'Access denied',
      code: 'FORBIDDEN',
      statusCode: 403
    });
  }

  // Handle 404 errors
  if (error.statusCode === 404) {
    return reply.code(404).send({
      ...baseError,
      error: 'Resource not found',
      code: 'NOT_FOUND',
      statusCode: 404
    });
  }

  // Log unexpected errors
  request.log.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      params: request.params,
      query: request.query
    }
  }, 'Unexpected error occurred');

  // Handle unexpected errors
  const statusCode = error.statusCode || 500;
  return reply.code(statusCode).send({
    ...baseError,
    error: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error',
    statusCode,
    code: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? {
      stack: error.stack
    } : undefined
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