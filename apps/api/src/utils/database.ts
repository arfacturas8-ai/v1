import { PrismaClient } from '@cryb/database';
import { createOptimizedPrisma, poolMonitor } from '../services/database-pool';
import { randomUUID } from 'crypto';

/**
 * Database Optimization Utilities
 * 
 * Provides enhanced database operations with:
 * - Connection pooling optimization
 * - Retry logic for transient failures
 * - Query performance monitoring
 * - Transaction helpers
 * - Bulk operation utilities
 */

// Query performance monitoring
interface QueryMetrics {
  operation: string;
  duration: number;
  recordCount?: number;
  error?: string;
  timestamp: Date;
  requestId?: string;
}

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100, // 100ms
  maxDelay: 5000, // 5s
  backoffMultiplier: 2,
  retryableErrors: [
    'P1008', // Operations timed out
    'P1017', // Server has closed the connection
    'P2024', // Timed out fetching a new connection from the connection pool
    'P2034', // Transaction failed due to a write conflict or a deadlock
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN'
  ]
};

/**
 * Enhanced database client with retry logic and monitoring
 */
export class DatabaseManager {
  private metrics: QueryMetrics[] = [];
  private maxMetricsHistory = 1000;

  constructor(
    private prisma: PrismaClient,
    private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.setupMetricsCollection();
  }

  /**
   * Setup automatic metrics collection
   */
  private setupMetricsCollection() {
    // Get slow query threshold from environment (default: 1000ms)
    const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableVerboseLogging = process.env.ENABLE_VERBOSE_QUERY_LOGGING === 'true';

    // Intercept Prisma queries for metrics
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();
      const requestId = randomUUID();

      try {
        const result = await next(params);
        const duration = Date.now() - startTime;

        // Record successful query metrics
        this.recordMetrics({
          operation: `${params.model}.${params.action}`,
          duration,
          recordCount: Array.isArray(result) ? result.length : result ? 1 : 0,
          timestamp: new Date(),
          requestId
        });

        // Log slow queries with enhanced details
        if (duration > slowQueryThreshold) {
          const logData: any = {
            requestId,
            operation: `${params.model}.${params.action}`,
            duration: `${duration}ms`,
            threshold: `${slowQueryThreshold}ms`,
            recordCount: Array.isArray(result) ? result.length : result ? 1 : 0,
            timestamp: new Date().toISOString()
          };

          // Include query details in development or with verbose logging
          if (isDevelopment || enableVerboseLogging) {
            logData.query = {
              model: params.model,
              action: params.action,
              args: params.args
            };
          }

          console.warn(`⚠️  SLOW QUERY DETECTED (${duration}ms > ${slowQueryThreshold}ms):`, logData);

          // Also log to structured logging if available
          if (enableVerboseLogging) {
            console.log(`[SLOW_QUERY_METRICS] ${JSON.stringify({
              type: 'slow_query',
              duration,
              threshold: slowQueryThreshold,
              operation: `${params.model}.${params.action}`,
              timestamp: new Date().toISOString()
            })}`);
          }
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        this.recordMetrics({
          operation: `${params.model}.${params.action}`,
          duration,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          requestId
        });

        // Log failed queries
        console.error(`❌ Database query failed:`, {
          requestId,
          operation: `${params.model}.${params.action}`,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          ...(isDevelopment || enableVerboseLogging ? { query: params.args } : {})
        });

        throw error;
      }
    });
  }

  /**
   * Record query metrics
   */
  private recordMetrics(metric: QueryMetrics) {
    this.metrics.push(metric);
    
    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Execute query with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'database_operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.retryConfig.maxAttempts;
        
        if (!isRetryable || isLastAttempt) {
          console.error(`${operationName} failed after ${attempt} attempts:`, error);
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.warn(`${operationName} failed (attempt ${attempt}), retrying in ${delay}ms:`, error);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const errorCode = error.code;
    const errorMessage = error.message || '';
    
    return this.retryConfig.retryableErrors.some(retryableError => 
      errorCode === retryableError || errorMessage.includes(retryableError)
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute multiple operations in a transaction with retry
   */
  async executeTransaction<T>(
    operations: (tx: PrismaClient) => Promise<T>,
    options: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    } = {}
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.prisma.$transaction(operations, {
        maxWait: options.maxWait || 5000, // 5s max wait
        timeout: options.timeout || 30000, // 30s timeout
        isolationLevel: options.isolationLevel
      }),
      'transaction'
    );
  }

  /**
   * Bulk upsert utility
   */
  async bulkUpsert<T>(
    model: string,
    data: any[],
    uniqueFields: string[],
    batchSize: number = 1000
  ): Promise<{ created: number; updated: number; errors: any[] }> {
    const results = { created: 0, updated: 0, errors: [] as any[] };
    
    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        await this.executeTransaction(async (tx) => {
          for (const item of batch) {
            try {
              // Build where clause from unique fields
              const where = uniqueFields.reduce((acc, field) => {
                acc[field] = item[field];
                return acc;
              }, {} as any);

              const result = await (tx as any)[model].upsert({
                where,
                update: item,
                create: item
              });

              // Count created vs updated (this is a simplified check)
              if (result.createdAt === result.updatedAt) {
                results.created++;
              } else {
                results.updated++;
              }
            } catch (error) {
              results.errors.push({
                item,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }
        });
      } catch (error) {
        console.error(`Batch upsert failed for batch starting at index ${i}:`, error);
        results.errors.push({
          batchIndex: i,
          batchSize: batch.length,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }

  /**
   * Optimized bulk delete with batching
   */
  async bulkDelete(
    model: string,
    where: any,
    batchSize: number = 1000
  ): Promise<{ deletedCount: number; errors: any[] }> {
    const results = { deletedCount: 0, errors: [] as any[] };
    
    try {
      // First, get IDs to delete to avoid deleting while iterating
      const idsToDelete = await (this.prisma as any)[model].findMany({
        where,
        select: { id: true },
        take: batchSize * 10 // Get more IDs than we'll process per batch
      });

      // Process deletions in batches
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batchIds = idsToDelete.slice(i, i + batchSize).map((item: any) => item.id);
        
        try {
          const deleteResult = await this.executeWithRetry(
            () => (this.prisma as any)[model].deleteMany({
              where: {
                id: {
                  in: batchIds
                }
              }
            })
          );
          
          results.deletedCount += deleteResult.count || 0;
        } catch (error) {
          results.errors.push({
            batchIndex: i,
            batchSize: batchIds.length,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } catch (error) {
      results.errors.push({
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return results;
  }

  /**
   * Get database performance metrics
   */
  getMetrics(since?: Date): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    topOperations: Array<{ operation: string; count: number; averageTime: number }>;
  } {
    const relevantMetrics = since 
      ? this.metrics.filter(m => m.timestamp >= since)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorRate: 0,
        topOperations: []
      };
    }

    const totalQueries = relevantMetrics.length;
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageQueryTime = totalTime / totalQueries;
    const slowQueries = relevantMetrics.filter(m => m.duration > 1000).length;
    const errorQueries = relevantMetrics.filter(m => m.error).length;
    const errorRate = (errorQueries / totalQueries) * 100;

    // Calculate top operations
    const operationStats = new Map<string, { count: number; totalTime: number }>();
    
    relevantMetrics.forEach(metric => {
      const existing = operationStats.get(metric.operation) || { count: 0, totalTime: 0 };
      operationStats.set(metric.operation, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.duration
      });
    });

    const topOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        averageTime: Math.round(stats.totalTime / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      errorRate: Math.round(errorRate * 100) / 100,
      topOperations
    };
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime: number;
    details: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      await this.executeWithRetry(
        () => this.prisma.$queryRaw`SELECT 1 as test`,
        'health_check'
      );
      
      const responseTime = Date.now() - startTime;
      
      // Get recent metrics for health assessment
      const recentMetrics = this.getMetrics(new Date(Date.now() - 60000)); // Last minute
      
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      
      // Determine health status based on metrics
      if (recentMetrics.errorRate > 10) {
        status = 'unhealthy';
      } else if (recentMetrics.averageQueryTime > 2000 || recentMetrics.errorRate > 5) {
        status = 'degraded';
      }
      
      return {
        status,
        responseTime,
        details: {
          ...recentMetrics,
          connectionPool: await this.getConnectionPoolInfo()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get connection pool information from the pool monitor
   */
  private async getConnectionPoolInfo(): Promise<any> {
    try {
      // Use the pool monitor for real connection pool stats
      const poolStats = poolMonitor.getStats();
      const poolHealthy = await poolMonitor.healthCheck();
      
      return {
        status: poolHealthy ? 'active' : 'unhealthy',
        ...poolStats,
        health: poolHealthy
      };
    } catch (error) {
      return {
        status: 'unknown',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clear metrics history
   */
  clearMetrics() {
    this.metrics = [];
  }
}

/**
 * Connection pool optimization helper - now uses the optimized pool service
 */
export function createOptimizedPrismaClient(): PrismaClient {
  // Use the optimized Prisma client with connection pooling
  return createOptimizedPrisma();
}

/**
 * Export singleton database manager
 */
export const databaseManager = new DatabaseManager(
  createOptimizedPrismaClient(),
  DEFAULT_RETRY_CONFIG
);

/**
 * Utility functions for common database operations
 */
export const DatabaseUtils = {
  /**
   * Execute with automatic retry
   */
  withRetry: <T>(operation: () => Promise<T>, operationName?: string) => 
    databaseManager.executeWithRetry(operation, operationName),

  /**
   * Execute in transaction
   */
  withTransaction: <T>(
    operations: (tx: PrismaClient) => Promise<T>, 
    options?: Parameters<DatabaseManager['executeTransaction']>[1]
  ) => 
    databaseManager.executeTransaction(operations, options),

  /**
   * Bulk operations
   */
  bulkUpsert: (model: string, data: any[], uniqueFields: string[], batchSize?: number) =>
    databaseManager.bulkUpsert(model, data, uniqueFields, batchSize),

  bulkDelete: (model: string, where: any, batchSize?: number) =>
    databaseManager.bulkDelete(model, where, batchSize),

  /**
   * Get performance metrics
   */
  getMetrics: (since?: Date) => databaseManager.getMetrics(since),

  /**
   * Health check
   */
  healthCheck: () => databaseManager.healthCheck()
};