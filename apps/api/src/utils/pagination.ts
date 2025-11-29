import { z } from 'zod';
import { PaginationMeta, createPagination } from './responses';

/**
 * Pagination Utilities
 * 
 * Provides consistent pagination handling across all API endpoints
 * with standardized query parameter parsing and response formatting.
 */

// Standard pagination query schema
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Extended pagination with search
export const searchPaginationQuerySchema = paginationQuerySchema.extend({
  q: z.string().min(1).max(500).optional(),
  filter: z.string().optional()
});

// Date range pagination
export const dateRangePaginationQuerySchema = paginationQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  dateField: z.string().default('createdAt')
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  'From date must be before to date'
);

// Cursor-based pagination for real-time feeds
export const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  direction: z.enum(['before', 'after']).default('after')
});

// Pagination query types
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SearchPaginationQuery = z.infer<typeof searchPaginationQuerySchema>;
export type DateRangePaginationQuery = z.infer<typeof dateRangePaginationQuerySchema>;
export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * Calculate offset-based pagination parameters for database queries
 */
export function calculateOffset(page: number, limit: number): { skip: number; take: number } {
  return {
    skip: (page - 1) * limit,
    take: limit
  };
}

/**
 * Create Prisma orderBy clause from sort parameters
 */
export function createOrderBy(
  sort?: string, 
  order: 'asc' | 'desc' = 'desc',
  allowedFields: string[] = []
): Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] {
  if (!sort) {
    return { createdAt: order };
  }

  // Security: only allow sorting by approved fields
  if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
    return { createdAt: order };
  }

  // Handle nested field sorting (e.g., "user.name")
  if (sort.includes('.')) {
    const parts = sort.split('.');
    if (parts.length === 2) {
      return {
        [parts[0]]: {
          [parts[1]]: order
        }
      } as any;
    }
  }

  return { [sort]: order };
}

/**
 * Create Prisma where clause for date range filtering
 */
export function createDateRangeWhere(
  from?: Date,
  to?: Date,
  dateField: string = 'createdAt'
): Record<string, any> | undefined {
  if (!from && !to) return undefined;

  const where: Record<string, any> = {};
  
  if (from || to) {
    where[dateField] = {};
    if (from) where[dateField].gte = from;
    if (to) where[dateField].lte = to;
  }

  return where;
}

/**
 * Create Prisma where clause for text search
 */
export function createSearchWhere(
  query?: string,
  searchFields: string[] = ['name', 'title', 'content']
): Record<string, any> | undefined {
  if (!query) return undefined;

  const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
  if (searchTerms.length === 0) return undefined;

  // Create OR conditions for each search field
  const searchConditions = searchFields.flatMap(field => 
    searchTerms.map(term => ({
      [field]: {
        contains: term,
        mode: 'insensitive' as const
      }
    }))
  );

  return {
    OR: searchConditions
  };
}

/**
 * Enhanced pagination result with metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
  meta?: {
    searchQuery?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    dateRange?: {
      from?: string;
      to?: string;
    };
    filters?: Record<string, any>;
  };
}

/**
 * Create a complete paginated result
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  query: PaginationQuery,
  options: {
    searchQuery?: string;
    filters?: Record<string, any>;
    dateRange?: { from?: Date; to?: Date };
  } = {}
): PaginatedResult<T> {
  const pagination = createPagination(total, query.page, query.limit);
  
  const meta = {
    ...(options.searchQuery && { searchQuery: options.searchQuery }),
    ...(query.sort && { sortField: query.sort }),
    sortOrder: query.order,
    ...(options.dateRange && {
      dateRange: {
        from: options.dateRange.from?.toISOString(),
        to: options.dateRange.to?.toISOString()
      }
    }),
    ...(options.filters && { filters: options.filters })
  };

  return {
    items,
    pagination,
    meta: Object.keys(meta).length > 0 ? meta : undefined
  };
}

/**
 * Cursor-based pagination for real-time feeds
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
    count: number;
  };
}

/**
 * Create cursor-based pagination result
 */
export function createCursorPaginatedResult<T extends { id: string; createdAt: Date }>(
  items: T[],
  limit: number,
  direction: 'before' | 'after' = 'after'
): CursorPaginatedResult<T> {
  const hasMore = items.length === limit;
  
  // Remove the extra item used for hasMore detection
  if (hasMore && items.length > 0) {
    if (direction === 'after') {
      items.pop(); // Remove last item
    } else {
      items.shift(); // Remove first item
    }
  }

  const nextCursor = items.length > 0 && hasMore
    ? items[items.length - 1].id
    : undefined;
    
  const prevCursor = items.length > 0 && direction === 'after'
    ? items[0].id
    : undefined;

  return {
    items,
    pagination: {
      hasMore,
      nextCursor,
      prevCursor,
      count: items.length
    }
  };
}

/**
 * Advanced pagination with multiple sort fields
 */
export function createAdvancedOrderBy(
  sorts: Array<{ field: string; order: 'asc' | 'desc' }>,
  allowedFields: string[] = []
): Record<string, 'asc' | 'desc'>[] {
  const validSorts = sorts.filter(sort => 
    allowedFields.length === 0 || allowedFields.includes(sort.field)
  );

  if (validSorts.length === 0) {
    return [{ createdAt: 'desc' }];
  }

  return validSorts.map(sort => ({ [sort.field]: sort.order }));
}

/**
 * Combine multiple where clauses
 */
export function combineWhereClause(...clauses: (Record<string, any> | undefined)[]): Record<string, any> | undefined {
  const validClauses = clauses.filter(clause => clause !== undefined);
  
  if (validClauses.length === 0) return undefined;
  if (validClauses.length === 1) return validClauses[0];

  return {
    AND: validClauses
  };
}

/**
 * Pagination middleware helper for Fastify routes
 */
export function withPagination<T>(
  queryData: T,
  totalCount: number,
  items: any[],
  options: {
    searchQuery?: string;
    filters?: Record<string, any>;
    dateRange?: { from?: Date; to?: Date };
  } = {}
): PaginatedResult<any> {
  const query = queryData as any;
  return createPaginatedResult(items, totalCount, query, options);
}

/**
 * Export commonly used field lists for different entities
 */
export const SORTABLE_FIELDS = {
  users: ['createdAt', 'updatedAt', 'username', 'displayName', 'lastActiveAt'],
  posts: ['createdAt', 'updatedAt', 'title', 'score', 'commentCount'],
  comments: ['createdAt', 'updatedAt', 'score'],
  messages: ['timestamp', 'editedAt'],
  servers: ['createdAt', 'updatedAt', 'name', 'memberCount'],
  channels: ['createdAt', 'updatedAt', 'name', 'position'],
  communities: ['createdAt', 'updatedAt', 'name', 'memberCount', 'postCount']
};

export const SEARCHABLE_FIELDS = {
  users: ['username', 'displayName', 'bio'],
  posts: ['title', 'content'],
  comments: ['content'],
  messages: ['content'],
  servers: ['name', 'description'],
  channels: ['name', 'description'],
  communities: ['name', 'displayName', 'description']
};

/**
 * Performance optimization: limit deep pagination
 */
export const MAX_DEEP_PAGINATION_OFFSET = 10000; // Limit skip to 10k records

export function validatePaginationPerformance(page: number, limit: number): void {
  const offset = (page - 1) * limit;
  if (offset > MAX_DEEP_PAGINATION_OFFSET) {
    throw new Error(`Pagination too deep. Maximum offset is ${MAX_DEEP_PAGINATION_OFFSET}. Consider using cursor-based pagination for better performance.`);
  }
}