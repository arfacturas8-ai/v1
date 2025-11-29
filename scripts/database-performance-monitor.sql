-- CRYB PLATFORM DATABASE PERFORMANCE MONITORING
-- Run this script to analyze current database performance and identify bottlenecks

-- ==============================================
-- 1. CONNECTION AND ACTIVITY MONITORING
-- ==============================================

SELECT 
    'DATABASE CONNECTIONS' as metric_type,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') as idle_in_transaction,
    (SELECT count(*) FROM pg_stat_activity) as total_connections,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections;

-- ==============================================
-- 2. SLOW QUERIES AND PERFORMANCE
-- ==============================================

-- Show slow queries from pg_stat_statements (if enabled)
SELECT 
    'TOP SLOW QUERIES' as metric_type,
    query,
    calls,
    total_exec_time / calls as avg_time_ms,
    rows / calls as avg_rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_percent
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY total_exec_time DESC 
LIMIT 10;

-- ==============================================
-- 3. TABLE STATISTICS AND INDEX USAGE
-- ==============================================

-- Table sizes and statistics
SELECT 
    'TABLE SIZES' as metric_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as tuples_returned,
    pg_stat_get_tuples_fetched(c.oid) as tuples_fetched,
    pg_stat_get_tuples_inserted(c.oid) as tuples_inserted,
    pg_stat_get_tuples_updated(c.oid) as tuples_updated,
    pg_stat_get_tuples_deleted(c.oid) as tuples_deleted
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Index usage statistics
SELECT 
    'INDEX USAGE' as metric_type,
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC
LIMIT 20;

-- Unused indexes (potential candidates for removal)
SELECT 
    'UNUSED INDEXES' as metric_type,
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ==============================================
-- 4. CACHE HIT RATIOS
-- ==============================================

-- Buffer cache hit ratio (should be > 95%)
SELECT 
    'CACHE HIT RATIO' as metric_type,
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;

-- Index cache hit ratio
SELECT 
    'INDEX CACHE HIT RATIO' as metric_type,
    sum(idx_blks_read) as idx_read,
    sum(idx_blks_hit) as idx_hit,
    sum(idx_blks_hit) / (sum(idx_blks_hit) + sum(idx_blks_read)) * 100 as idx_cache_hit_ratio
FROM pg_statio_user_indexes;

-- ==============================================
-- 5. LOCK MONITORING
-- ==============================================

-- Current locks
SELECT 
    'CURRENT LOCKS' as metric_type,
    mode,
    locktype,
    count(*)
FROM pg_locks 
WHERE NOT granted
GROUP BY mode, locktype
ORDER BY count(*) DESC;

-- Blocking queries
SELECT 
    'BLOCKING QUERIES' as metric_type,
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process,
    blocked_activity.application_name AS blocked_application,
    blocking_activity.application_name AS blocking_application
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON (blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
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

-- ==============================================
-- 6. VACUUM AND ANALYZE STATISTICS
-- ==============================================

-- Tables that need vacuum/analyze
SELECT 
    'VACUUM STATISTICS' as metric_type,
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
LIMIT 10;

-- ==============================================
-- 7. REPLICATION AND WAL STATISTICS
-- ==============================================

-- WAL statistics
SELECT 
    'WAL STATISTICS' as metric_type,
    pg_current_wal_lsn() as current_wal_lsn,
    pg_walfile_name(pg_current_wal_lsn()) as current_wal_file,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as wal_bytes;

-- ==============================================
-- 8. TIMESCALEDB SPECIFIC STATISTICS
-- ==============================================

-- Hypertables information
SELECT 
    'HYPERTABLES' as metric_type,
    hypertable_schema,
    hypertable_name,
    num_dimensions,
    num_chunks,
    compression_enabled,
    compressed_chunks,
    pg_size_pretty(total_bytes) as total_size,
    pg_size_pretty(index_bytes) as index_size,
    pg_size_pretty(toast_bytes) as toast_size,
    pg_size_pretty(compressed_total_bytes) as compressed_size
FROM timescaledb_information.hypertables h
LEFT JOIN timescaledb_information.hypertable_detailed_size s 
    ON h.hypertable_schema = s.hypertable_schema 
    AND h.hypertable_name = s.hypertable_name
LEFT JOIN (
    SELECT 
        hypertable_schema,
        hypertable_name,
        COUNT(*) as compressed_chunks
    FROM timescaledb_information.compressed_chunk_stats 
    GROUP BY hypertable_schema, hypertable_name
) cc ON h.hypertable_schema = cc.hypertable_schema 
    AND h.hypertable_name = cc.hypertable_name;

-- ==============================================
-- 9. PERFORMANCE RECOMMENDATIONS
-- ==============================================

-- Generate performance recommendations
WITH table_stats AS (
    SELECT 
        schemaname,
        tablename,
        n_tup_ins + n_tup_upd + n_tup_del as total_writes,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        pg_total_relation_size(schemaname||'.'||tablename) as table_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
),
recommendations AS (
    SELECT 
        'PERFORMANCE RECOMMENDATIONS' as metric_type,
        tablename,
        CASE 
            WHEN seq_scan > idx_scan AND table_size > 1000000 THEN 'Consider adding indexes - high sequential scans'
            WHEN total_writes > 10000 AND (last_vacuum IS NULL OR last_vacuum < NOW() - INTERVAL '1 day') THEN 'Needs vacuum - high write activity'
            WHEN idx_scan = 0 AND table_size > 100000 THEN 'No index usage detected'
            ELSE 'Performance looks good'
        END as recommendation
    FROM table_stats
    LEFT JOIN pg_stat_user_tables USING (schemaname, tablename)
)
SELECT * FROM recommendations WHERE recommendation != 'Performance looks good';

-- ==============================================
-- 10. SYSTEM RESOURCE USAGE
-- ==============================================

-- Database size and growth
SELECT 
    'DATABASE SIZE' as metric_type,
    datname,
    pg_size_pretty(pg_database_size(datname)) as size,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) as connections
FROM pg_database 
WHERE datname NOT IN ('template0', 'template1', 'postgres')
ORDER BY pg_database_size(datname) DESC;

-- Summary of key metrics
SELECT 
    'PERFORMANCE SUMMARY' as metric_type,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
    (SELECT max(extract(epoch from clock_timestamp() - query_start)) FROM pg_stat_activity WHERE state = 'active') as longest_running_query_seconds,
    (SELECT count(*) FROM pg_stat_activity WHERE waiting) as waiting_queries,
    round((sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100)::numeric, 2) as cache_hit_ratio_percent
FROM pg_statio_user_tables;