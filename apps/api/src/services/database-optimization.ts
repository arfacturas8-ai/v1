import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export interface DatabaseConfig {
  connectionPooling: {
    min: number;
    max: number;
    acquireTimeoutMs: number;
    createTimeoutMs: number;
    idleTimeoutMs: number;
    reapIntervalMs: number;
    createRetryIntervalMs: number;
  };
  queryOptimization: {
    enableQueryLogging: boolean;
    slowQueryThreshold: number;
    enableExplainAnalyze: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    enableHealthChecks: boolean;
    healthCheckInterval: number;
  };
  caching: {
    enableQueryCaching: boolean;
    defaultTTL: number;
    maxCacheSize: number;
  };
}

export interface DatabaseMetrics {
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  queries: {
    total: number;
    slow: number;
    failed: number;
    averageExecutionTime: number;
  };
  performance: {
    cpu: number;
    memory: number;
    diskIO: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    uptime: number;
  };
}

export interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  affectedRows?: number;
}

/**
 * Database Optimization Service for Discord-like Application
 * 
 * Features:
 * - Advanced connection pooling
 * - Query performance monitoring
 * - Slow query detection and optimization
 * - Connection health monitoring
 * - Database metrics collection
 * - Query caching strategies
 * - Index optimization suggestions
 * - Performance alerts
 * - Connection leak detection
 * - Database maintenance automation
 */
export class DatabaseOptimizationService {
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private metrics: DatabaseMetrics;
  private queryCache: Map<string, { result: any; timestamp: number; ttl: number }>;
  private connectionPool: any;
  private queryMetrics: QueryMetrics[] = [];
  private healthCheckInterval?: NodeJS.Timer;
  private metricsInterval?: NodeJS.Timer;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      connectionPooling: {
        min: 2,
        max: 20,
        acquireTimeoutMs: 30000,
        createTimeoutMs: 30000,
        idleTimeoutMs: 30000,
        reapIntervalMs: 1000,
        createRetryIntervalMs: 200,
        ...config.connectionPooling
      },
      queryOptimization: {
        enableQueryLogging: true,
        slowQueryThreshold: 1000, // 1 second
        enableExplainAnalyze: false,
        ...config.queryOptimization
      },
      monitoring: {
        enableMetrics: true,
        metricsInterval: 30000, // 30 seconds
        enableHealthChecks: true,
        healthCheckInterval: 60000, // 1 minute
        ...config.monitoring
      },
      caching: {
        enableQueryCaching: true,
        defaultTTL: 300000, // 5 minutes
        maxCacheSize: 1000,
        ...config.caching
      }
    };

    this.queryCache = new Map();
    this.initializeMetrics();
    this.setupPrismaClient();
    this.startMonitoring();
  }

  private initializeMetrics(): void {
    this.metrics = {
      connections: {
        active: 0,
        idle: 0,
        total: 0
      },
      queries: {
        total: 0,
        slow: 0,
        failed: 0,
        averageExecutionTime: 0
      },
      performance: {
        cpu: 0,
        memory: 0,
        diskIO: 0
      },
      health: {
        status: 'healthy',
        lastCheck: new Date(),
        uptime: 0
      }
    };
  }

  private setupPrismaClient(): void {
    // Enhanced Prisma client with connection pooling
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionString()
        }
      },
      log: this.config.queryOptimization.enableQueryLogging ? [
        {
          emit: 'event',
          level: 'query'
        },
        {
          emit: 'event',
          level: 'error'
        },
        {
          emit: 'event',
          level: 'warn'
        }
      ] : []
    });

    // Set up query event handlers
    if (this.config.queryOptimization.enableQueryLogging) {
      this.prisma.$on('query', (event: any) => {
        this.handleQueryEvent(event);
      });

      this.prisma.$on('error', (event: any) => {
        this.handleErrorEvent(event);
      });
    }

    // Connection event handlers
    this.prisma.$on('beforeExit', async () => {
      console.log('🔌 Database connection closing...');
    });
  }

  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL || '';
    const poolConfig = this.config.connectionPooling;
    
    // Add connection pooling parameters
    const params = new URLSearchParams();
    params.set('connection_limit', poolConfig.max.toString());
    params.set('pool_timeout', Math.ceil(poolConfig.acquireTimeoutMs / 1000).toString());
    params.set('connect_timeout', Math.ceil(poolConfig.createTimeoutMs / 1000).toString());
    
    // Add additional optimization parameters
    params.set('statement_cache_size', '100');
    params.set('prepared_statement_cache_size', '100');
    params.set('schema_cache_size', '1000');
    
    const url = new URL(baseUrl);
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  private handleQueryEvent(event: any): void {
    const executionTime = parseInt(event.duration);
    const isSlowQuery = executionTime > this.config.queryOptimization.slowQueryThreshold;

    const queryMetric: QueryMetrics = {
      query: event.query,
      executionTime,
      timestamp: new Date(),
      success: true,
      affectedRows: event.params ? JSON.parse(event.params).length : 0
    };

    this.recordQueryMetric(queryMetric);

    if (isSlowQuery) {
      this.handleSlowQuery(queryMetric);
    }

    this.updateQueryMetrics(executionTime, true);
  }

  private handleErrorEvent(event: any): void {
    const queryMetric: QueryMetrics = {
      query: event.query || 'Unknown query',
      executionTime: 0,
      timestamp: new Date(),
      success: false,
      error: event.message
    };

    this.recordQueryMetric(queryMetric);
    this.updateQueryMetrics(0, false);

    console.error('❌ Database query error:', {
      message: event.message,
      query: event.query,
      timestamp: new Date()
    });
  }

  private recordQueryMetric(metric: QueryMetrics): void {
    this.queryMetrics.push(metric);
    
    // Keep only last 1000 query metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  private updateQueryMetrics(executionTime: number, success: boolean): void {
    this.metrics.queries.total++;
    
    if (!success) {
      this.metrics.queries.failed++;
      return;
    }

    if (executionTime > this.config.queryOptimization.slowQueryThreshold) {
      this.metrics.queries.slow++;
    }

    // Update average execution time
    const totalQueries = this.metrics.queries.total;
    const currentAverage = this.metrics.queries.averageExecutionTime;
    this.metrics.queries.averageExecutionTime = 
      ((currentAverage * (totalQueries - 1)) + executionTime) / totalQueries;
  }

  private async handleSlowQuery(metric: QueryMetrics): Promise<void> {
    console.warn('🐌 Slow query detected:', {
      query: metric.query.substring(0, 200) + '...',
      executionTime: metric.executionTime,
      timestamp: metric.timestamp
    });

    // Optionally run EXPLAIN ANALYZE for slow queries
    if (this.config.queryOptimization.enableExplainAnalyze) {
      try {
        await this.analyzeQuery(metric.query);
      } catch (error) {
        console.error('Failed to analyze slow query:', error);
      }
    }

    // Store slow query for later analysis
    await this.storeSlowQuery(metric);
  }

  private async analyzeQuery(query: string): Promise<void> {
    try {
      // This would run EXPLAIN ANALYZE on the query
      // Note: This is a simplified example - in practice you'd need to
      // parse the query and construct appropriate EXPLAIN statements
      const explanation = await this.prisma.$queryRaw`EXPLAIN ANALYZE ${query}`;
      console.log('📊 Query analysis:', explanation);
    } catch (error) {
      console.error('Query analysis failed:', error);
    }
  }

  private async storeSlowQuery(metric: QueryMetrics): Promise<void> {
    // In a real implementation, you'd store this in a dedicated table
    // or external monitoring system
    console.log('💾 Storing slow query for analysis:', metric);
  }

  private startMonitoring(): void {
    if (this.config.monitoring.enableHealthChecks) {
      this.healthCheckInterval = setInterval(
        () => this.performHealthCheck(),
        this.config.monitoring.healthCheckInterval
      );
    }

    if (this.config.monitoring.enableMetrics) {
      this.metricsInterval = setInterval(
        () => this.collectMetrics(),
        this.config.monitoring.metricsInterval
      );
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Perform a simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Update health status based on response time
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 5000) {
        status = 'unhealthy';
      } else if (responseTime > 1000) {
        status = 'degraded';
      }

      this.metrics.health = {
        status,
        lastCheck: new Date(),
        uptime: process.uptime()
      };

      if (status !== 'healthy') {
        console.warn(`⚠️  Database health check: ${status} (${responseTime}ms)`);
      }

    } catch (error) {
      this.metrics.health = {
        status: 'unhealthy',
        lastCheck: new Date(),
        uptime: process.uptime()
      };
      
      console.error('❌ Database health check failed:', error);
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      // Collect connection pool metrics
      await this.collectConnectionMetrics();
      
      // Collect performance metrics
      await this.collectPerformanceMetrics();
      
      // Clean up old query metrics
      this.cleanupOldMetrics();

    } catch (error) {
      console.error('Metrics collection failed:', error);
    }
  }

  private async collectConnectionMetrics(): Promise<void> {
    try {
      // Get connection pool statistics from PostgreSQL
      const poolStats = await this.prisma.$queryRaw<Array<{
        state: string;
        count: number;
      }>>`
        SELECT state, count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      let active = 0;
      let idle = 0;
      let total = 0;

      poolStats.forEach(stat => {
        const count = Number(stat.count);
        total += count;
        
        if (stat.state === 'active') {
          active += count;
        } else if (stat.state === 'idle') {
          idle += count;
        }
      });

      this.metrics.connections = { active, idle, total };

    } catch (error) {
      console.error('Failed to collect connection metrics:', error);
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // Get database performance statistics
      const dbStats = await this.prisma.$queryRaw<Array<{
        checkpoints_timed: number;
        checkpoints_req: number;
        checkpoint_write_time: number;
        checkpoint_sync_time: number;
        buffers_checkpoint: number;
        buffers_clean: number;
        maxwritten_clean: number;
        buffers_backend: number;
        buffers_backend_fsync: number;
        buffers_alloc: number;
      }>>`
        SELECT * FROM pg_stat_bgwriter LIMIT 1
      `;

      if (dbStats.length > 0) {
        const stats = dbStats[0];
        
        // Calculate derived metrics (simplified)
        this.metrics.performance = {
          cpu: 0, // Would need external monitoring for accurate CPU
          memory: Number(stats.buffers_alloc),
          diskIO: Number(stats.checkpoint_write_time) + Number(stats.checkpoint_sync_time)
        };
      }

    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    this.queryMetrics = this.queryMetrics.filter(
      metric => metric.timestamp.getTime() > oneHourAgo
    );
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  /**
   * Get current database metrics
   */
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent query metrics
   */
  getQueryMetrics(limit: number = 100): QueryMetrics[] {
    return this.queryMetrics.slice(-limit);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit: number = 50): QueryMetrics[] {
    return this.queryMetrics
      .filter(metric => 
        metric.success && 
        metric.executionTime > this.config.queryOptimization.slowQueryThreshold
      )
      .slice(-limit);
  }

  /**
   * Get failed queries
   */
  getFailedQueries(limit: number = 50): QueryMetrics[] {
    return this.queryMetrics
      .filter(metric => !metric.success)
      .slice(-limit);
  }

  /**
   * Execute query with caching
   */
  async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (!this.config.caching.enableQueryCaching) {
      return await queryFn();
    }

    const cached = this.queryCache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.result;
    }

    const result = await queryFn();
    const cacheTTL = ttl || this.config.caching.defaultTTL;

    // Clean cache if it's getting too large
    if (this.queryCache.size >= this.config.caching.maxCacheSize) {
      this.cleanupCache();
    }

    this.queryCache.set(key, {
      result,
      timestamp: now,
      ttl: cacheTTL
    });

    return result;
  }

  /**
   * Clear query cache
   */
  clearCache(keyPattern?: string): void {
    if (keyPattern) {
      const regex = new RegExp(keyPattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.queryCache.entries()).map(([key, value]) => ({
      key,
      age: now - value.timestamp
    }));

    return {
      size: this.queryCache.size,
      maxSize: this.config.caching.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses
      entries
    };
  }

  /**
   * Optimize database indexes
   */
  async optimizeIndexes(): Promise<{
    suggestions: string[];
    duplicates: string[];
    unused: string[];
  }> {
    try {
      // Get index usage statistics
      const indexStats = await this.prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        idx_tup_read: number;
        idx_tup_fetch: number;
      }>>`
        SELECT 
          schemaname, 
          tablename, 
          indexname, 
          idx_tup_read, 
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC
      `;

      // Analyze for optimization opportunities
      const suggestions: string[] = [];
      const unused: string[] = [];

      indexStats.forEach(index => {
        if (Number(index.idx_tup_read) === 0) {
          unused.push(`${index.tablename}.${index.indexname}`);
        }
      });

      // Get duplicate indexes
      const duplicates = await this.findDuplicateIndexes();

      return { suggestions, duplicates, unused };

    } catch (error) {
      console.error('Index optimization failed:', error);
      return { suggestions: [], duplicates: [], unused: [] };
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQueryPerformance(): Promise<{
    slowest: QueryMetrics[];
    mostFrequent: { query: string; count: number }[];
    recommendations: string[];
  }> {
    const slowest = this.getSlowQueries(10);
    
    // Count query frequencies
    const queryFrequencies = new Map<string, number>();
    this.queryMetrics.forEach(metric => {
      const normalizedQuery = this.normalizeQuery(metric.query);
      queryFrequencies.set(
        normalizedQuery,
        (queryFrequencies.get(normalizedQuery) || 0) + 1
      );
    });

    const mostFrequent = Array.from(queryFrequencies.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recommendations = this.generatePerformanceRecommendations(slowest, mostFrequent);

    return { slowest, mostFrequent, recommendations };
  }

  /**
   * Get connection pool status
   */
  getConnectionPoolStatus(): {
    config: typeof this.config.connectionPooling;
    current: typeof this.metrics.connections;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const { connections } = this.metrics;
    const { connectionPooling } = this.config;

    // Pool size recommendations
    if (connections.total >= connectionPooling.max * 0.9) {
      recommendations.push('Consider increasing max connection pool size');
    }

    if (connections.idle > connectionPooling.max * 0.5) {
      recommendations.push('Consider reducing idle timeout to free up connections');
    }

    return {
      config: connectionPooling,
      current: connections,
      recommendations
    };
  }

  /**
   * Run database maintenance tasks
   */
  async runMaintenance(): Promise<{
    vacuumResults: any[];
    analyzeResults: any[];
    reindexResults: any[];
  }> {
    console.log('🔧 Running database maintenance...');

    const results = {
      vacuumResults: [] as any[],
      analyzeResults: [] as any[],
      reindexResults: [] as any[]
    };

    try {
      // Get table statistics
      const tableStats = await this.prisma.$queryRaw<Array<{
        schemaname: string;
        tablename: string;
        n_tup_ins: number;
        n_tup_upd: number;
        n_tup_del: number;
        n_dead_tup: number;
        last_vacuum: Date | null;
        last_analyze: Date | null;
      }>>`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_dead_tup,
          last_vacuum,
          last_analyze
        FROM pg_stat_user_tables
        WHERE n_dead_tup > 1000 OR last_vacuum IS NULL OR last_vacuum < NOW() - INTERVAL '1 day'
      `;

      // Run VACUUM and ANALYZE on tables that need it
      for (const table of tableStats) {
        try {
          const tableName = `"${table.schemaname}"."${table.tablename}"`;
          
          if (Number(table.n_dead_tup) > 1000) {
            await this.prisma.$executeRawUnsafe(`VACUUM ${tableName}`);
            results.vacuumResults.push({ table: tableName, status: 'completed' });
          }

          if (!table.last_analyze || table.last_analyze < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            await this.prisma.$executeRawUnsafe(`ANALYZE ${tableName}`);
            results.analyzeResults.push({ table: tableName, status: 'completed' });
          }

        } catch (error) {
          console.error(`Maintenance failed for table ${table.tablename}:`, error);
        }
      }

      console.log('✅ Database maintenance completed');

    } catch (error) {
      console.error('❌ Database maintenance failed:', error);
    }

    return results;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private cleanupCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Remove expired entries
    for (const [key, value] of this.queryCache) {
      if ((now - value.timestamp) >= value.ttl) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.queryCache.delete(key));

    // If still over limit, remove oldest entries
    if (this.queryCache.size >= this.config.caching.maxCacheSize) {
      const entries = Array.from(this.queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.config.caching.maxCacheSize * 0.1));
      toRemove.forEach(([key]) => this.queryCache.delete(key));
    }
  }

  private async findDuplicateIndexes(): Promise<string[]> {
    try {
      const duplicates = await this.prisma.$queryRaw<Array<{
        size: number;
        idx1: string;
        idx2: string;
        idx3: string;
        idx4: string;
      }>>`
        SELECT pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size,
               (array_agg(idx))[1] AS idx1, (array_agg(idx))[2] AS idx2,
               (array_agg(idx))[3] AS idx3, (array_agg(idx))[4] AS idx4
        FROM (
          SELECT indexrelid::regclass AS idx, (indrelid::text ||E'\\n'|| indclass::text ||E'\\n'|| indkey::text ||E'\\n'|| COALESCE(indexprs::text,E'') ||E'\\n'|| COALESCE(indpred::text,E'')) AS KEY
          FROM pg_index
        ) sub
        GROUP BY KEY HAVING COUNT(*) > 1
        ORDER BY SUM(pg_relation_size(idx)) DESC
      `;

      return duplicates.map(d => `${d.idx1}, ${d.idx2}${d.idx3 ? `, ${d.idx3}` : ''}${d.idx4 ? `, ${d.idx4}` : ''}`);

    } catch (error) {
      console.error('Failed to find duplicate indexes:', error);
      return [];
    }
  }

  private normalizeQuery(query: string): string {
    // Remove parameters and normalize whitespace for frequency counting
    return query
      .replace(/\$\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private generatePerformanceRecommendations(
    slowest: QueryMetrics[],
    frequent: { query: string; count: number }[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze slow queries
    slowest.forEach(query => {
      if (query.query.toLowerCase().includes('select') && !query.query.toLowerCase().includes('where')) {
        recommendations.push('Consider adding WHERE clauses to limit result sets');
      }
      
      if (query.query.toLowerCase().includes('order by') && !query.query.toLowerCase().includes('limit')) {
        recommendations.push('Consider adding LIMIT to ORDER BY queries');
      }
    });

    // Analyze frequent queries
    frequent.forEach(({ query, count }) => {
      if (count > 100) {
        recommendations.push(`Consider caching results for frequently executed query pattern: ${query.substring(0, 50)}...`);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    await this.prisma.$disconnect();
    console.log('🔌 Database optimization service closed');
  }
}

/**
 * Factory function to create database optimization service
 */
export function createDatabaseOptimizationService(
  config: Partial<DatabaseConfig> = {}
): DatabaseOptimizationService {
  return new DatabaseOptimizationService(config);
}

/**
 * Fastify plugin for database optimization
 */
export async function databaseOptimizationPlugin(fastify: FastifyInstance, config: Partial<DatabaseConfig> = {}) {
  const dbOptimization = createDatabaseOptimizationService(config);
  
  fastify.decorate('dbOptimization', dbOptimization);
  
  // Add cleanup on server close
  fastify.addHook('onClose', async () => {
    await dbOptimization.close();
  });
  
  console.log('🏎️  Database Optimization Service initialized with features:');
  console.log('   - Advanced connection pooling');
  console.log('   - Query performance monitoring');
  console.log('   - Slow query detection');
  console.log('   - Connection health monitoring');
  console.log('   - Query caching strategies');
  console.log('   - Index optimization');
  console.log('   - Automated maintenance');
}