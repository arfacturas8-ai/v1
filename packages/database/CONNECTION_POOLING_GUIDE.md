# Database Connection Pooling Configuration

## Overview
This guide provides optimal database connection pooling configuration for the CRYB platform to maximize performance and resource utilization.

## Environment Variables

### Required Variables
```bash
# Database connection URL with optimized parameters
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=20&pool_timeout=10&connect_timeout=60"

# Connection pool limits
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=10
DATABASE_CONNECT_TIMEOUT=60
```

### Optional Variables
```bash
# Environment-specific overrides
NODE_ENV=production
PRISMA_CLIENT_ENGINE_TYPE=binary
METRICS_PORT=9090

# Query optimization
DATABASE_STATEMENT_TIMEOUT=30000
DATABASE_QUERY_TIMEOUT=30000
DATABASE_IDLE_IN_TRANSACTION_SESSION_TIMEOUT=60000
```

## Production Recommendations

### Connection Pool Sizing
- **Development**: 5 connections per instance
- **Production**: 15-20 connections per instance  
- **Load Testing**: 10 connections per instance
- **Total limit**: Should not exceed PostgreSQL `max_connections` / number of app instances

### AWS RDS Specific Settings
For your RDS instance, consider these parameter group settings:

```sql
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
```

## Prisma Client Configuration

### Optimal Configuration
```javascript
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
```

### Connection URL Parameters
```
postgresql://user:pass@host:port/db?connection_limit=20&pool_timeout=10&connect_timeout=60&schema=public&sslmode=prefer
```

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Connection Pool Utilization**: Should stay below 80%
2. **Active Connections**: Monitor for spikes
3. **Idle Connections**: Should not exceed 50% of pool
4. **Query Duration**: Alert on queries > 2 seconds
5. **Connection Timeouts**: Should be minimal

### Monitoring Commands
```bash
# Start connection monitoring
node monitor-connections.js

# Check current connections
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Monitor slow queries
psql -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Performance Optimization

### Query Optimization
1. Use appropriate indexes for frequent queries
2. Implement query result caching where possible
3. Use batch operations for bulk inserts/updates
4. Leverage Prisma's `findMany` with `take` and `skip` for pagination

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
```sql
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
```

## Load Testing

Test your connection pool configuration with realistic load:

```bash
# Use artillery or similar tools
artillery quick --count 100 --num 1000 http://localhost:3001/api/v1/health

# Monitor during load test
watch -n 1 'psql -c "SELECT count(*), state FROM pg_stat_activity WHERE pid != pg_backend_pid() GROUP BY state;"'
```

## Contact
For database performance issues, contact: admin@cryb.ai
