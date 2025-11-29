#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function setupConnectionPooling() {
  try {
    console.log('🔗 Setting up database connection pooling for CRYB Platform...');
    
    const startTime = Date.now();
    
    // 1. Analyze current database configuration
    console.log('🔍 Analyzing current database configuration...');
    
    // Get PostgreSQL configuration
    const pgConfig = await prisma.$queryRaw`
      SELECT name, setting, unit, category, short_desc 
      FROM pg_settings 
      WHERE name IN (
        'max_connections',
        'shared_buffers',
        'effective_cache_size',
        'maintenance_work_mem',
        'checkpoint_completion_target',
        'wal_buffers',
        'default_statistics_target',
        'random_page_cost',
        'effective_io_concurrency',
        'work_mem',
        'min_wal_size',
        'max_wal_size'
      )
      ORDER BY category, name;
    `;
    
    console.log('📊 Current PostgreSQL Configuration:');
    for (const config of pgConfig) {
      console.log(`• ${config.name}: ${config.setting}${config.unit || ''} - ${config.short_desc}`);
    }
    
    // Get connection statistics
    const connectionStats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid();
    `;
    
    console.log('\n📊 Current Connection Statistics:');
    for (const stat of connectionStats) {
      console.log(`• Total connections: ${stat.total_connections}`);
      console.log(`• Active connections: ${stat.active_connections}`);
      console.log(`• Idle connections: ${stat.idle_connections}`);
      console.log(`• Idle in transaction: ${stat.idle_in_transaction}`);
    }
    
    // 2. Create optimal Prisma configuration
    console.log('\n⚙️  Creating optimized Prisma connection configuration...');
    
    const prismaConfig = {
      // Connection pool configuration
      datasource: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL,
        // Connection pool settings
        connection_limit: 20, // Recommended for production
        pool_timeout: 10, // seconds
        connect_timeout: 60, // seconds
      },
      
      // Generator configuration for optimal performance
      generator: {
        provider: 'prisma-client-js',
        output: '../node_modules/.prisma/client',
        // Precompiled binaries for better performance
        binaryTargets: ['native', 'linux-openssl-1.1.x'],
        // Engine configuration
        previewFeatures: ['metrics', 'tracing'],
      },
      
      // Recommended Prisma Client configuration
      client: {
        // Logging configuration
        log: [
          { level: 'warn', emit: 'event' },
          { level: 'info', emit: 'event' },
          { level: 'error', emit: 'event' },
        ],
        
        // Error formatting
        errorFormat: 'pretty',
        
        // Transaction options
        transactionOptions: {
          maxWait: 5000, // 5 seconds
          timeout: 10000, // 10 seconds
          isolationLevel: 'ReadCommitted', // Good balance of performance and consistency
        },
      },
      
      // Production optimizations
      optimizations: {
        // Connection pooling
        pool: {
          min: 2, // Minimum connections to maintain
          max: 20, // Maximum connections (should not exceed PostgreSQL max_connections / number_of_app_instances)
          acquireTimeoutMillis: 30000, // 30 seconds
          idleTimeoutMillis: 300000, // 5 minutes
          reapIntervalMillis: 1000, // Check for idle connections every second
          createRetryIntervalMillis: 100,
        },
        
        // Query optimization
        query: {
          timeout: 30000, // 30 seconds for complex queries
          batchTransactions: true,
          interactive_transactions: true,
        },
        
        // Memory management
        memory: {
          cache_size: '256MB',
          max_memory_usage: '512MB',
        }
      },
      
      // Environment-specific settings
      environments: {
        development: {
          pool_size: 5,
          log_level: 'debug',
          slow_query_threshold: 1000, // 1 second
        },
        
        production: {
          pool_size: 20,
          log_level: 'warn',
          slow_query_threshold: 2000, // 2 seconds
          connection_timeout: 30000,
          statement_timeout: 60000,
        },
        
        test: {
          pool_size: 2,
          log_level: 'error',
          connection_timeout: 5000,
        }
      }
    };
    
    // 3. Create environment-specific Prisma configurations
    const environments = ['development', 'production', 'test'];
    
    for (const env of environments) {
      const envConfig = prismaConfig.environments[env];
      
      const schemaContent = `// Prisma schema for ${env} environment
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
  binaryTargets = ["native", "linux-openssl-1.1.x"]
  previewFeatures = ["metrics", "tracing"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool configuration (set via environment variables):
// DATABASE_CONNECTION_LIMIT=${envConfig.pool_size}
// DATABASE_POOL_TIMEOUT=10
// DATABASE_CONNECT_TIMEOUT=60

// Copy your existing schema models here...
// (This would include all the models from your main schema.prisma)
`;
      
      const configPath = path.join(__dirname, `prisma-${env}.schema`);
      fs.writeFileSync(configPath, schemaContent);
      console.log(`✅ Created ${env} schema configuration`);
    }
    
    // 4. Create connection pool monitoring script
    console.log('📊 Creating connection pool monitoring...');
    
    const monitoringScript = `#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Create Prisma client with metrics enabled
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

// Enable metrics collection
const prometheus = require('prom-client');

// Connection pool metrics
const connectionPoolGauge = new prometheus.Gauge({
  name: 'cryb_database_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state']
});

const queryDurationHistogram = new prometheus.Histogram({
  name: 'cryb_database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation']
});

const queryCountCounter = new prometheus.Counter({
  name: 'cryb_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'status']
});

// Listen to Prisma events
prisma.$on('query', (e) => {
  queryDurationHistogram.observe({ operation: e.query.split(' ')[0] }, e.duration / 1000);
  queryCountCounter.inc({ operation: e.query.split(' ')[0], status: 'success' });
});

prisma.$on('info', (e) => {
  console.log('📊 Prisma Info:', e.message);
});

prisma.$on('warn', (e) => {
  console.warn('⚠️  Prisma Warning:', e.message);
});

prisma.$on('error', (e) => {
  console.error('❌ Prisma Error:', e.message);
  queryCountCounter.inc({ operation: 'unknown', status: 'error' });
});

async function monitorConnections() {
  try {
    // Get connection statistics
    const stats = await prisma.$queryRaw\`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) FILTER (WHERE state = 'idle in transaction (aborted)') as aborted_connections,
        count(*) FILTER (WHERE waiting = true) as waiting_connections
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid();
    \`;
    
    // Update Prometheus metrics
    for (const stat of stats) {
      connectionPoolGauge.set({ state: 'total' }, Number(stat.total_connections));
      connectionPoolGauge.set({ state: 'active' }, Number(stat.active_connections));
      connectionPoolGauge.set({ state: 'idle' }, Number(stat.idle_connections));
      connectionPoolGauge.set({ state: 'idle_in_transaction' }, Number(stat.idle_in_transaction));
      connectionPoolGauge.set({ state: 'waiting' }, Number(stat.waiting_connections));
    }
    
    // Log statistics
    const timestamp = new Date().toISOString();
    console.log(\`[\${timestamp}] 📊 Connection Pool Status:\`);
    for (const stat of stats) {
      console.log(\`  Total: \${stat.total_connections}, Active: \${stat.active_connections}, Idle: \${stat.idle_connections}\`);
      console.log(\`  In Transaction: \${stat.idle_in_transaction}, Waiting: \${stat.waiting_connections}\`);
    }
    
    // Check for potential issues
    for (const stat of stats) {
      const totalConn = Number(stat.total_connections);
      const activeConn = Number(stat.active_connections);
      const waitingConn = Number(stat.waiting_connections);
      
      if (totalConn > 15) {
        console.warn(\`⚠️  High connection count: \${totalConn}\`);
      }
      
      if (waitingConn > 0) {
        console.warn(\`⚠️  Connections waiting for resources: \${waitingConn}\`);
      }
      
      if (activeConn > 0 && (activeConn / totalConn) > 0.8) {
        console.warn(\`⚠️  High connection utilization: \${Math.round((activeConn / totalConn) * 100)}%\`);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection monitoring error:', error.message);
  }
}

async function monitorSlowQueries() {
  try {
    // Get slow queries from pg_stat_statements (if available)
    const slowQueries = await prisma.$queryRaw\`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE mean_time > 1000 -- Queries taking more than 1 second on average
      ORDER BY mean_time DESC
      LIMIT 10;
    \`;
    
    if (slowQueries.length > 0) {
      console.log('🐌 Slow Queries Detected:');
      for (const query of slowQueries) {
        console.log(\`  Query: \${query.query.substring(0, 100)}...\`);
        console.log(\`  Calls: \${query.calls}, Avg Time: \${query.mean_time.toFixed(2)}ms\`);
      }
    }
    
  } catch (error) {
    // pg_stat_statements might not be available
    console.log('📝 pg_stat_statements not available for slow query monitoring');
  }
}

// Start monitoring
async function startMonitoring() {
  console.log('🚀 Starting CRYB database connection monitoring...');
  
  // Monitor connections every 30 seconds
  setInterval(monitorConnections, 30000);
  
  // Monitor slow queries every 2 minutes
  setInterval(monitorSlowQueries, 120000);
  
  // Initial check
  await monitorConnections();
  
  // Expose metrics endpoint for Prometheus
  const express = require('express');
  const app = express();
  
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', prometheus.register.contentType);
      res.end(await prometheus.register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });
  
  const port = process.env.METRICS_PORT || 9090;
  app.listen(port, () => {
    console.log(\`📊 Metrics endpoint available at http://localhost:\${port}/metrics\`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down connection monitoring...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start if run directly
if (require.main === module) {
  startMonitoring().catch(console.error);
}

module.exports = { monitorConnections, monitorSlowQueries };
`;
    
    fs.writeFileSync(path.join(__dirname, 'monitor-connections.js'), monitoringScript);
    fs.chmodSync(path.join(__dirname, 'monitor-connections.js'), 0o755);
    console.log('✅ Created connection monitoring script');
    
    // 5. Create connection pool configuration guide
    const configGuide = `# Database Connection Pooling Configuration

## Overview
This guide provides optimal database connection pooling configuration for the CRYB platform to maximize performance and resource utilization.

## Environment Variables

### Required Variables
\`\`\`bash
# Database connection URL with optimized parameters
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=20&pool_timeout=10&connect_timeout=60"

# Connection pool limits
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=10
DATABASE_CONNECT_TIMEOUT=60
\`\`\`

### Optional Variables
\`\`\`bash
# Environment-specific overrides
NODE_ENV=production
PRISMA_CLIENT_ENGINE_TYPE=binary
METRICS_PORT=9090

# Query optimization
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_IDLE_IN_TRANSACTION_SESSION_TIMEOUT=60000
\`\`\`

## Production Recommendations

### Connection Pool Sizing
- **Development**: 5 connections per instance
- **Production**: 15-20 connections per instance  
- **Load Testing**: 10 connections per instance
- **Total limit**: Should not exceed PostgreSQL \`max_connections\` / number of app instances

### AWS RDS Specific Settings
For your RDS instance, consider these parameter group settings:

\`\`\`sql
-- Connection settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

-- Memory settings (adjust based on instance size)
shared_buffers = '25% of RAM'
effective_cache_size = '75% of RAM'
work_mem = '256MB'
maintenance_work_mem = '1GB'

-- Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = '16MB'

-- Query optimization
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

-- Connection timeouts
idle_in_transaction_session_timeout = 60000
statement_timeout = 30000
\`\`\`

## Prisma Client Configuration

### Optimal Configuration
\`\`\`javascript
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  errorFormat: 'pretty',
  transactionOptions: {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: 'ReadCommitted',
  },
});
\`\`\`

### Connection URL Parameters
\`\`\`
postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=10&connect_timeout=60&schema=public&sslmode=prefer
\`\`\`

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Connection Pool Utilization**: Should stay below 80%
2. **Active Connections**: Monitor for spikes
3. **Idle Connections**: Should not exceed 50% of pool
4. **Query Duration**: Alert on queries > 2 seconds
5. **Connection Timeouts**: Should be minimal

### Monitoring Commands
\`\`\`bash
# Start connection monitoring
node monitor-connections.js

# Check current connections
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Monitor slow queries
psql -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
\`\`\`

## Performance Optimization

### Query Optimization
1. Use appropriate indexes for frequent queries
2. Implement query result caching where possible
3. Use batch operations for bulk inserts/updates
4. Leverage Prisma's \`findMany\` with \`take\` and \`skip\` for pagination

### Connection Management
1. Close connections promptly after use
2. Use connection pooling middleware (PgBouncer) for high-load scenarios
3. Implement circuit breakers for database failures
4. Monitor and alert on connection pool exhaustion

### Application-Level Optimizations
1. Implement application-level caching (Redis)
2. Use read replicas for read-heavy workloads
3. Batch database operations where possible
4. Implement proper error handling and retry logic

## Troubleshooting

### Common Issues
1. **Connection Pool Exhaustion**
   - Increase pool size or optimize query performance
   - Check for connection leaks in application code

2. **High Connection Wait Times**
   - Optimize slow queries
   - Implement connection pooling middleware

3. **Database Timeout Errors**
   - Increase timeout values
   - Optimize query performance
   - Check network connectivity

### Diagnostic Queries
\`\`\`sql
-- Check current connections
SELECT pid, usename, application_name, client_addr, state, query_start, query 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;

-- Check connection limits
SELECT name, setting FROM pg_settings WHERE name = 'max_connections';

-- Check database locks
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON (blocking_locks.locktype = blocked_locks.locktype 
                                            AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database 
                                            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation 
                                            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page 
                                            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple 
                                            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid 
                                            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid 
                                            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid 
                                            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid 
                                            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid 
                                            AND blocking_locks.pid != blocked_locks.pid)
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
\`\`\`

## Load Testing

Test your connection pool configuration with realistic load:

\`\`\`bash
# Use artillery or similar tools
artillery quick --count 100 --num 1000 http://localhost:3001/api/v1/health

# Monitor during load test
watch -n 1 'psql -c "SELECT count(*), state FROM pg_stat_activity WHERE pid != pg_backend_pid() GROUP BY state;"'
\`\`\`

## Contact
For database performance issues, contact: admin@cryb.ai
`;

    fs.writeFileSync(path.join(__dirname, 'CONNECTION_POOLING_GUIDE.md'), configGuide);
    console.log('✅ Created connection pooling guide');
    
    // 6. Save configuration to JSON for reference
    fs.writeFileSync(
      path.join(__dirname, 'connection-pool-config.json'),
      JSON.stringify(prismaConfig, null, 2)
    );
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Connection pooling setup completed!');
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    console.log('\n📊 Connection Pool Recommendations:');
    console.log('• Production: 15-20 connections per app instance');
    console.log('• Development: 5 connections per instance');
    console.log('• Connection timeout: 30 seconds');
    console.log('• Query timeout: 30 seconds');
    console.log('• Idle timeout: 5 minutes');
    console.log('• Transaction timeout: 10 seconds');
    
    console.log('\n📁 Files Created:');
    console.log('• prisma-development.schema - Development configuration');
    console.log('• prisma-production.schema - Production configuration'); 
    console.log('• prisma-test.schema - Test configuration');
    console.log('• monitor-connections.js - Connection monitoring script');
    console.log('• connection-pool-config.json - Configuration reference');
    console.log('• CONNECTION_POOLING_GUIDE.md - Detailed documentation');
    
    console.log('\n⚡ Optimization Recommendations:');
    console.log('1. Set DATABASE_CONNECTION_LIMIT environment variable');
    console.log('2. Configure RDS parameter group for optimal performance');
    console.log('3. Implement application-level caching (Redis)');
    console.log('4. Set up connection monitoring and alerting');
    console.log('5. Consider PgBouncer for very high-load scenarios');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup connection pooling:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupConnectionPooling()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { setupConnectionPooling };