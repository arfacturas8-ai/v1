import { FastifyReply } from 'fastify';

/**
 * Standardized API Response Utilities
 * 
 * Provides consistent response formatting across all API endpoints
 * to ensure frontend can reliably parse and handle responses.
 */

// Standard success response structure
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: ResponseMeta;
  timestamp: string;
}

// Standard error response structure  
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  path?: string;
  method?: string;
  statusCode: number;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

// General response metadata
export interface ResponseMeta {
  pagination?: PaginationMeta;
  requestId?: string;
  processingTime?: number;
  version?: string;
  [key: string]: any;
}

// Paginated data wrapper
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Send standardized success response
 */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  options: {
    message?: string;
    meta?: ResponseMeta;
    statusCode?: number;
  } = {}
): void {
  const { message, meta, statusCode = 200 } = options;

  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    meta,
    timestamp: new Date().toISOString()
  };

  reply.code(statusCode).send(response);
}

/**
 * Send standardized error response
 */
export function sendError(
  reply: FastifyReply,
  error: string,
  options: {
    message?: string;
    code?: string;
    details?: Record<string, any>;
    statusCode?: number;
    path?: string;
    method?: string;
  } = {}
): void {
  const { 
    message, 
    code, 
    details, 
    statusCode = 500, 
    path, 
    method 
  } = options;

  const response: ErrorResponse = {
    success: false,
    error,
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path,
    method,
    statusCode
  };

  reply.code(statusCode).send(response);
}

/**
 * Send paginated success response
 */
export function sendPaginated<T>(
  reply: FastifyReply,
  items: T[],
  pagination: PaginationMeta,
  options: {
    message?: string;
    statusCode?: number;
    additionalMeta?: Record<string, any>;
  } = {}
): void {
  const { message, statusCode = 200, additionalMeta = {} } = options;

  const data: PaginatedData<T> = {
    items,
    pagination
  };

  const meta: ResponseMeta = {
    pagination,
    ...additionalMeta
  };

  sendSuccess(reply, data, { message, meta, statusCode });
}

/**
 * Create pagination metadata
 */
export function createPagination(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    hasPrevious: page > 1
  };
}

/**
 * Send created resource response (201)
 */
export function sendCreated<T>(
  reply: FastifyReply,
  data: T,
  options: {
    message?: string;
    resourceId?: string;
    resourceType?: string;
  } = {}
): void {
  const { message = 'Resource created successfully', resourceId, resourceType } = options;

  const meta: ResponseMeta = {};
  if (resourceId) meta.resourceId = resourceId;
  if (resourceType) meta.resourceType = resourceType;

  sendSuccess(reply, data, {
    message,
    meta,
    statusCode: 201
  });
}

/**
 * Send no content response (204)
 */
export function sendNoContent(reply: FastifyReply): void {
  reply.code(204).send();
}

/**
 * Send accepted response (202) for async operations
 */
export function sendAccepted<T>(
  reply: FastifyReply,
  data: T,
  options: {
    message?: string;
    taskId?: string;
    estimatedCompletion?: string;
  } = {}
): void {
  const { message = 'Request accepted for processing', taskId, estimatedCompletion } = options;

  const meta: ResponseMeta = {};
  if (taskId) meta.taskId = taskId;
  if (estimatedCompletion) meta.estimatedCompletion = estimatedCompletion;

  sendSuccess(reply, data, {
    message,
    meta,
    statusCode: 202
  });
}

/**
 * Common error response helpers
 */
export const ErrorResponses = {
  badRequest: (reply: FastifyReply, message: string, details?: Record<string, any>) =>
    sendError(reply, message, { 
      statusCode: 400, 
      code: 'BAD_REQUEST',
      details 
    }),

  unauthorized: (reply: FastifyReply, message: string = 'Authentication required') =>
    sendError(reply, message, { 
      statusCode: 401, 
      code: 'UNAUTHORIZED' 
    }),

  forbidden: (reply: FastifyReply, message: string = 'Access denied') =>
    sendError(reply, message, { 
      statusCode: 403, 
      code: 'FORBIDDEN' 
    }),

  notFound: (reply: FastifyReply, resource: string = 'Resource') =>
    sendError(reply, `${resource} not found`, { 
      statusCode: 404, 
      code: 'NOT_FOUND' 
    }),

  conflict: (reply: FastifyReply, message: string, details?: Record<string, any>) =>
    sendError(reply, message, { 
      statusCode: 409, 
      code: 'CONFLICT',
      details 
    }),

  unprocessableEntity: (reply: FastifyReply, message: string, validation?: Record<string, string[]>) =>
    sendError(reply, message, { 
      statusCode: 422, 
      code: 'VALIDATION_ERROR',
      details: { validation } 
    }),

  tooManyRequests: (reply: FastifyReply, message: string = 'Too many requests', retryAfter?: number) =>
    sendError(reply, message, { 
      statusCode: 429, 
      code: 'RATE_LIMIT_EXCEEDED',
      details: { retryAfter } 
    }),

  internalError: (reply: FastifyReply, message: string = 'Internal server error', details?: Record<string, any>) =>
    sendError(reply, message, { 
      statusCode: 500, 
      code: 'INTERNAL_SERVER_ERROR',
      details 
    }),

  serviceUnavailable: (reply: FastifyReply, message: string = 'Service temporarily unavailable') =>
    sendError(reply, message, { 
      statusCode: 503, 
      code: 'SERVICE_UNAVAILABLE' 
    })
};

/**
 * Validation error helper
 */
export function sendValidationError(
  reply: FastifyReply,
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): void {
  ErrorResponses.unprocessableEntity(reply, message, errors);
}

/**
 * Empty response helper for when data exists but is empty
 */
export function sendEmpty<T extends any[]>(
  reply: FastifyReply,
  emptyArray: T,
  message?: string
): void {
  sendSuccess(reply, emptyArray, { message });
}

/**
 * Response timing middleware helper
 */
export function withTiming<T>(
  startTime: number,
  reply: FastifyReply,
  data: T,
  options: Parameters<typeof sendSuccess>[2] = {}
): void {
  const processingTime = Date.now() - startTime;
  
  const meta: ResponseMeta = {
    ...options.meta,
    processingTime
  };

  sendSuccess(reply, data, { ...options, meta });
}

/**
 * Health check response helper
 */
export function sendHealthCheck(
  reply: FastifyReply,
  checks: Record<string, 'healthy' | 'unhealthy' | 'degraded' | 'unknown'>,
  overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
): void {
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  sendSuccess(reply, {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, { statusCode });
}

/**
 * File upload response helper
 */
export function sendFileUpload(
  reply: FastifyReply,
  fileData: {
    id?: string;
    filename: string;
    url: string;
    size: number;
    type: string;
    uploadedAt?: string;
  },
  message: string = 'File uploaded successfully'
): void {
  sendCreated(reply, {
    ...fileData,
    uploadedAt: fileData.uploadedAt || new Date().toISOString()
  }, {
    message,
    resourceType: 'file',
    resourceId: fileData.id
  });
}

/**
 * Bulk operation response helper
 */
export function sendBulkOperation<T>(
  reply: FastifyReply,
  results: {
    successful: T[];
    failed: Array<{ item: any; error: string; }>;
    total: number;
  },
  operation: string,
  statusCode: number = 200
): void {
  const successCount = results.successful.length;
  const failureCount = results.failed.length;
  
  const message = failureCount === 0 
    ? `All ${results.total} items processed successfully`
    : `${successCount} items succeeded, ${failureCount} items failed`;

  sendSuccess(reply, results, {
    message: `${operation}: ${message}`,
    statusCode,
    meta: {
      operation,
      successCount,
      failureCount,
      totalCount: results.total
    }
  });
}

/**
 * Export type guards for response checking
 */
export function isSuccessResponse(response: any): response is SuccessResponse {
  return response && typeof response === 'object' && response.success === true;
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response === 'object' && response.success === false;
}