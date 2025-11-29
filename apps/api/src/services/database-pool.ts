import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

/**
 * Database Connection Pool Configuration
 * Provides optimized connection pooling for production
 */

interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Connection pool configuration
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'cryb',
  user: process.env.DB_USER || 'cryb_user',
  password: process.env.DB_PASSWORD || 'cryb_password',
  ssl: process.env.DB_SSL === 'true',
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '5'),  // Minimum connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'), // 2 seconds
};

// Create connection pool
export const dbPool = new Pool(poolConfig);

// Enhanced Prisma client with connection pooling
export const createOptimizedPrisma = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse URL to add connection pool parameters
  const url = new URL(databaseUrl);
  
  // Add connection pool parameters to URL
  url.searchParams.set('connection_limit', '20');
  url.searchParams.set('pool_timeout', '2');
  url.searchParams.set('connect_timeout', '10');
  url.searchParams.set('socket_timeout', '10');

  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString()
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Connection pool monitoring
export class DatabasePoolMonitor {
  private pool: Pool;
  
  constructor(pool: Pool) {
    this.pool = pool;
    this.startMonitoring();
  }

  private startMonitoring() {
    // Log pool stats every 30 seconds
    setInterval(() => {
      this.logPoolStats();
    }, 30000);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // Handle connection events
    this.pool.on('connect', (client) => {
      console.log('New database connection established');
    });

    this.pool.on('remove', (client) => {
      console.log('Database connection removed from pool');
    });
  }

  private logPoolStats() {
    const stats = {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
    
    console.log('Database pool stats:', stats);
    
    // Alert if pool is under pressure
    if (stats.waitingClients > 5) {
      console.warn('⚠️  High database connection pressure - consider increasing pool size');
    }
  }

  getStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      maxConnections: poolConfig.max,
      minConnections: poolConfig.min,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Initialize pool monitor
export const poolMonitor = new DatabasePoolMonitor(dbPool);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await dbPool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await dbPool.end();
  process.exit(0);
});

// Export helper functions
export const executeQuery = async (text: string, params?: any[]) => {
  const client = await dbPool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const executeTransaction = async (queries: Array<{text: string, params?: any[]}>) => {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    
    for (const query of queries) {
      const result = await client.query(query.text, query.params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};