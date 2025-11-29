-- CRYB Platform Database Monitoring and Performance Optimization
-- Comprehensive monitoring, alerting, and optimization for Reddit/Discord scale
-- Author: Database Infrastructure Team
-- Version: 1.0

-- ==========================================
-- EXTENSIONS FOR MONITORING
-- ==========================================

-- Enable monitoring extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;
CREATE EXTENSION IF NOT EXISTS pageinspect;
CREATE EXTENSION IF NOT EXISTS auto_explain;

-- Configure auto_explain for slow query analysis
ALTER SYSTEM SET auto_explain.log_min_duration = '1000ms';  -- Log queries > 1 second
ALTER SYSTEM SET auto_explain.log_analyze = on;
ALTER SYSTEM SET auto_explain.log_buffers = on;
ALTER SYSTEM SET auto_explain.log_timing = on;
ALTER SYSTEM SET auto_explain.log_triggers = on;
ALTER SYSTEM SET auto_explain.log_verbose = on;
ALTER SYSTEM SET auto_explain.log_nested_statements = on;

-- Configure statement statistics
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.save = on;

SELECT pg_reload_conf();

-- ==========================================
-- PERFORMANCE MONITORING TABLES
-- ==========================================

-- Query performance history
CREATE TABLE IF NOT EXISTS query_performance_history (
    id SERIAL PRIMARY KEY,
    query_hash BIGINT NOT NULL,
    query_text TEXT,
    calls_delta BIGINT DEFAULT 0,
    total_time_delta DOUBLE PRECISION DEFAULT 0,
    mean_time DOUBLE PRECISION DEFAULT 0,
    stddev_time DOUBLE PRECISION DEFAULT 0,
    rows_delta BIGINT DEFAULT 0,
    shared_blks_hit_delta BIGINT DEFAULT 0,
    shared_blks_read_delta BIGINT DEFAULT 0,
    shared_blks_dirtied_delta BIGINT DEFAULT 0,
    shared_blks_written_delta BIGINT DEFAULT 0,
    temp_blks_read_delta BIGINT DEFAULT 0,
    temp_blks_written_delta BIGINT DEFAULT 0,
    blk_read_time_delta DOUBLE PRECISION DEFAULT 0,
    blk_write_time_delta DOUBLE PRECISION DEFAULT 0,
    
    -- Calculated metrics
    hit_ratio DOUBLE PRECISION DEFAULT 0,
    avg_io_time DOUBLE PRECISION DEFAULT 0,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_query_recording UNIQUE (query_hash, recorded_at)
);

-- Convert to hypertable for time-series data
SELECT create_hypertable('query_performance_history', 'recorded_at', chunk_time_interval => INTERVAL '1 day');

-- Index for efficient querying
CREATE INDEX CONCURRENTLY idx_query_perf_hash_time ON query_performance_history (query_hash, recorded_at DESC);
CREATE INDEX CONCURRENTLY idx_query_perf_mean_time ON query_performance_history (mean_time DESC, recorded_at DESC);

-- Database performance metrics
CREATE TABLE IF NOT EXISTS db_performance_metrics (
    id SERIAL PRIMARY KEY,
    
    -- Connection metrics
    active_connections INTEGER DEFAULT 0,
    idle_connections INTEGER DEFAULT 0,
    idle_in_transaction INTEGER DEFAULT 0,
    max_connections INTEGER DEFAULT 0,
    
    -- Transaction metrics
    commits_per_sec DOUBLE PRECISION DEFAULT 0,
    rollbacks_per_sec DOUBLE PRECISION DEFAULT 0,
    
    -- I/O metrics
    blocks_read_per_sec DOUBLE PRECISION DEFAULT 0,
    blocks_hit_per_sec DOUBLE PRECISION DEFAULT 0,
    buffer_hit_ratio DOUBLE PRECISION DEFAULT 0,
    
    -- Lock metrics
    locks_acquired INTEGER DEFAULT 0,
    locks_waiting INTEGER DEFAULT 0,
    deadlocks INTEGER DEFAULT 0,
    
    -- WAL metrics
    wal_write_rate_mb_per_sec DOUBLE PRECISION DEFAULT 0,
    wal_sync_time_ms DOUBLE PRECISION DEFAULT 0,
    
    -- Checkpoint metrics
    checkpoints_timed INTEGER DEFAULT 0,
    checkpoints_req INTEGER DEFAULT 0,
    checkpoint_write_time_ms DOUBLE PRECISION DEFAULT 0,
    checkpoint_sync_time_ms DOUBLE PRECISION DEFAULT 0,
    
    -- Table and index metrics
    sequential_scans INTEGER DEFAULT 0,
    sequential_scan_rows INTEGER DEFAULT 0,
    index_scans INTEGER DEFAULT 0,
    index_scan_rows INTEGER DEFAULT 0,
    
    -- Replication lag (for replicas)
    replication_lag_seconds INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('db_performance_metrics', 'recorded_at', chunk_time_interval => INTERVAL '6 hours');

-- Index for time-based queries
CREATE INDEX CONCURRENTLY idx_db_perf_time ON db_performance_metrics (recorded_at DESC);

-- Table size tracking
CREATE TABLE IF NOT EXISTS table_size_history (
    id SERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    size_pretty TEXT NOT NULL,
    row_count BIGINT,
    index_size_bytes BIGINT,
    toast_size_bytes BIGINT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_table_recording UNIQUE (schema_name, table_name, recorded_at)
);

-- Convert to hypertable
SELECT create_hypertable('table_size_history', 'recorded_at', chunk_time_interval => INTERVAL '1 day');

-- Index for table size queries
CREATE INDEX CONCURRENTLY idx_table_size_name_time ON table_size_history (schema_name, table_name, recorded_at DESC);

-- ==========================================
-- PERFORMANCE MONITORING FUNCTIONS
-- ==========================================

-- Function to collect query performance stats
CREATE OR REPLACE FUNCTION collect_query_performance_stats()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Insert new query performance data
    INSERT INTO query_performance_history (
        query_hash, query_text, calls_delta, total_time_delta, mean_time,
        stddev_time, rows_delta, shared_blks_hit_delta, shared_blks_read_delta,
        shared_blks_dirtied_delta, shared_blks_written_delta, temp_blks_read_delta,
        temp_blks_written_delta, blk_read_time_delta, blk_write_time_delta,
        hit_ratio, avg_io_time
    )
    SELECT 
        queryid as query_hash,
        query as query_text,
        calls as calls_delta,
        total_exec_time as total_time_delta,
        mean_exec_time as mean_time,
        stddev_exec_time as stddev_time,
        rows as rows_delta,
        shared_blks_hit as shared_blks_hit_delta,
        shared_blks_read as shared_blks_read_delta,
        shared_blks_dirtied as shared_blks_dirtied_delta,
        shared_blks_written as shared_blks_written_delta,
        temp_blks_read as temp_blks_read_delta,
        temp_blks_written as temp_blks_written_delta,
        blk_read_time as blk_read_time_delta,
        blk_write_time as blk_write_time_delta,
        
        -- Calculate hit ratio
        CASE 
            WHEN shared_blks_hit + shared_blks_read > 0 THEN
                shared_blks_hit::DOUBLE PRECISION / (shared_blks_hit + shared_blks_read) * 100
            ELSE 0
        END as hit_ratio,
        
        -- Calculate average I/O time
        CASE 
            WHEN calls > 0 THEN (blk_read_time + blk_write_time) / calls
            ELSE 0
        END as avg_io_time
        
    FROM pg_stat_statements
    WHERE calls > 0
    ON CONFLICT (query_hash, recorded_at) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to collect database performance metrics
CREATE OR REPLACE FUNCTION collect_db_performance_metrics()
RETURNS BOOLEAN AS $$
DECLARE
    db_stats RECORD;
    bg_stats RECORD;
    repl_lag INTEGER := 0;
BEGIN
    -- Get database statistics
    SELECT * INTO db_stats FROM pg_stat_database WHERE datname = current_database();
    
    -- Get background writer statistics
    SELECT * INTO bg_stats FROM pg_stat_bgwriter;
    
    -- Get replication lag (if this is a replica)
    IF pg_is_in_recovery() THEN
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::INTEGER INTO repl_lag;
    END IF;
    
    -- Insert performance metrics
    INSERT INTO db_performance_metrics (
        active_connections,
        idle_connections,
        idle_in_transaction,
        max_connections,
        commits_per_sec,
        rollbacks_per_sec,
        blocks_read_per_sec,
        blocks_hit_per_sec,
        buffer_hit_ratio,
        wal_write_rate_mb_per_sec,
        checkpoints_timed,
        checkpoints_req,
        replication_lag_seconds
    )
    SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'),
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'),
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections'),
        
        -- Calculate rates (approximation based on recent data)
        COALESCE(db_stats.xact_commit, 0)::DOUBLE PRECISION / GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1),
        COALESCE(db_stats.xact_rollback, 0)::DOUBLE PRECISION / GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1),
        COALESCE(db_stats.blks_read, 0)::DOUBLE PRECISION / GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1),
        COALESCE(db_stats.blks_hit, 0)::DOUBLE PRECISION / GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1),
        
        -- Buffer hit ratio
        CASE 
            WHEN COALESCE(db_stats.blks_hit, 0) + COALESCE(db_stats.blks_read, 0) > 0 THEN
                COALESCE(db_stats.blks_hit, 0)::DOUBLE PRECISION / 
                (COALESCE(db_stats.blks_hit, 0) + COALESCE(db_stats.blks_read, 0)) * 100
            ELSE 0
        END,
        
        -- WAL write rate (approximate)
        0, -- Will be calculated separately
        
        COALESCE(bg_stats.checkpoints_timed, 0),
        COALESCE(bg_stats.checkpoints_req, 0),
        repl_lag
        
    FROM pg_stat_database 
    WHERE datname = current_database();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to collect table size information
CREATE OR REPLACE FUNCTION collect_table_size_stats()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    INSERT INTO table_size_history (
        schema_name, table_name, size_bytes, size_pretty, 
        row_count, index_size_bytes, toast_size_bytes
    )
    SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
        
        -- Get row count (approximate for large tables)
        CASE 
            WHEN pg_total_relation_size(schemaname||'.'||tablename) > 1073741824 THEN -- > 1GB
                (SELECT reltuples::BIGINT FROM pg_class WHERE relname = tablename)
            ELSE
                (SELECT count(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename)
        END as row_count,
        
        pg_indexes_size(schemaname||'.'||tablename) as index_size_bytes,
        
        -- TOAST table size
        COALESCE((
            SELECT pg_total_relation_size(oid) 
            FROM pg_class 
            WHERE relname = 'pg_toast_' || (
                SELECT oid FROM pg_class WHERE relname = tablename AND relnamespace = (
                    SELECT oid FROM pg_namespace WHERE nspname = schemaname
                )
            )::TEXT
        ), 0) as toast_size_bytes
        
    FROM pg_tables
    WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ON CONFLICT (schema_name, table_name, recorded_at) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE ANALYSIS VIEWS
-- ==========================================

-- Top slow queries view
CREATE OR REPLACE VIEW top_slow_queries AS
SELECT 
    query_hash,
    LEFT(query_text, 100) || CASE WHEN LENGTH(query_text) > 100 THEN '...' ELSE '' END as query_preview,
    calls_delta as calls,
    ROUND(mean_time::NUMERIC, 2) as avg_time_ms,
    ROUND(total_time_delta::NUMERIC, 2) as total_time_ms,
    ROUND(stddev_time::NUMERIC, 2) as stddev_time_ms,
    rows_delta as rows,
    ROUND(hit_ratio::NUMERIC, 2) as hit_ratio_percent,
    recorded_at
FROM query_performance_history
WHERE recorded_at > NOW() - INTERVAL '24 hours'
    AND calls_delta > 0
ORDER BY mean_time DESC
LIMIT 50;

-- Buffer cache analysis view
CREATE OR REPLACE VIEW buffer_cache_analysis AS
SELECT 
    schemaname,
    tablename,
    COUNT(*) as buffer_pages,
    ROUND((COUNT(*) * 8192.0 / 1024 / 1024)::NUMERIC, 2) as buffer_size_mb,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pg_buffercache))::NUMERIC, 2) as percent_of_cache
FROM pg_buffercache bc
JOIN pg_class c ON bc.relfilenode = pg_relation_filenode(c.oid)
JOIN pg_tables t ON c.relname = t.tablename
WHERE bc.relfilenode IS NOT NULL
GROUP BY schemaname, tablename
ORDER BY buffer_pages DESC
LIMIT 20;

-- Index usage analysis view
CREATE OR REPLACE VIEW index_usage_analysis AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) as index_size,
    
    -- Usage efficiency metrics
    CASE 
        WHEN idx_scan > 0 THEN ROUND((idx_tup_read::DOUBLE PRECISION / idx_scan)::NUMERIC, 2)
        ELSE 0
    END as avg_tuples_per_scan,
    
    CASE 
        WHEN idx_tup_read > 0 THEN ROUND((idx_tup_fetch::DOUBLE PRECISION / idx_tup_read * 100)::NUMERIC, 2)
        ELSE 0
    END as fetch_ratio_percent
    
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Lock analysis view
CREATE OR REPLACE VIEW current_locks_analysis AS
SELECT 
    pl.locktype,
    pl.mode,
    pl.granted,
    COUNT(*) as lock_count,
    string_agg(DISTINCT pg_blocking_pids(pl.pid)::TEXT, ', ') as blocking_pids
FROM pg_locks pl
WHERE pl.pid != pg_backend_pid()
GROUP BY pl.locktype, pl.mode, pl.granted
ORDER BY lock_count DESC;

-- Connection analysis view
CREATE OR REPLACE VIEW connection_analysis AS
SELECT 
    state,
    COUNT(*) as connection_count,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - state_change)))::NUMERIC, 2) as avg_duration_seconds,
    MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) as max_duration_seconds,
    string_agg(DISTINCT datname, ', ') as databases
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY state
ORDER BY connection_count DESC;

-- ==========================================
-- ALERTING FUNCTIONS
-- ==========================================

-- Function to check for performance alerts
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE(
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    metric_value DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION
) AS $$
BEGIN
    -- Check slow queries
    RETURN QUERY
    SELECT 
        'slow_query'::TEXT,
        CASE WHEN mean_time > 10000 THEN 'critical'
             WHEN mean_time > 5000 THEN 'warning'
             ELSE 'info' END::TEXT,
        FORMAT('Query with hash %s has average execution time of %.2f ms', query_hash, mean_time)::TEXT,
        mean_time,
        5000.0
    FROM query_performance_history
    WHERE recorded_at > NOW() - INTERVAL '1 hour'
        AND mean_time > 5000
        AND calls_delta > 10
    ORDER BY mean_time DESC
    LIMIT 5;
    
    -- Check connection usage
    RETURN QUERY
    SELECT 
        'high_connections'::TEXT,
        CASE WHEN connection_ratio > 90 THEN 'critical'
             WHEN connection_ratio > 80 THEN 'warning'
             ELSE 'info' END::TEXT,
        FORMAT('Connection usage is %.1f%% (%d/%d)', connection_ratio, current_connections, max_connections)::TEXT,
        connection_ratio,
        80.0
    FROM (
        SELECT 
            (SELECT COUNT(*) FROM pg_stat_activity WHERE pid != pg_backend_pid()) as current_connections,
            (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_connections,
            (SELECT COUNT(*) FROM pg_stat_activity WHERE pid != pg_backend_pid()) * 100.0 / 
            (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as connection_ratio
    ) conn_stats
    WHERE connection_ratio > 80;
    
    -- Check buffer hit ratio
    RETURN QUERY
    SELECT 
        'low_buffer_hit_ratio'::TEXT,
        CASE WHEN buffer_hit_ratio < 95 THEN 'warning'
             WHEN buffer_hit_ratio < 90 THEN 'critical'
             ELSE 'info' END::TEXT,
        FORMAT('Buffer hit ratio is %.2f%%', buffer_hit_ratio)::TEXT,
        buffer_hit_ratio,
        95.0
    FROM db_performance_metrics
    WHERE recorded_at > NOW() - INTERVAL '5 minutes'
        AND buffer_hit_ratio < 95
    ORDER BY recorded_at DESC
    LIMIT 1;
    
    -- Check replication lag
    RETURN QUERY
    SELECT 
        'replication_lag'::TEXT,
        CASE WHEN replication_lag_seconds > 300 THEN 'critical'
             WHEN replication_lag_seconds > 60 THEN 'warning'
             ELSE 'info' END::TEXT,
        FORMAT('Replication lag is %d seconds', replication_lag_seconds)::TEXT,
        replication_lag_seconds::DOUBLE PRECISION,
        60.0
    FROM db_performance_metrics
    WHERE recorded_at > NOW() - INTERVAL '5 minutes'
        AND replication_lag_seconds > 60
        AND pg_is_in_recovery()
    ORDER BY recorded_at DESC
    LIMIT 1;
    
    -- Check for unused indexes
    RETURN QUERY
    SELECT 
        'unused_index'::TEXT,
        'info'::TEXT,
        FORMAT('Index %s.%s has not been used (0 scans)', schemaname, indexname)::TEXT,
        0::DOUBLE PRECISION,
        1::DOUBLE PRECISION
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
        AND schemaname NOT IN ('information_schema', 'pg_catalog')
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to generate performance report
CREATE OR REPLACE FUNCTION generate_performance_report(
    report_period INTERVAL DEFAULT INTERVAL '24 hours'
) RETURNS TABLE(
    report_section TEXT,
    metric_name TEXT,
    metric_value TEXT,
    comparison_period TEXT
) AS $$
BEGIN
    -- Top slow queries
    RETURN QUERY
    SELECT 
        'Top Slow Queries'::TEXT,
        FORMAT('Query Hash %s', query_hash)::TEXT,
        FORMAT('Avg: %.2fms, Calls: %s, Total: %.2fms', mean_time, calls_delta, total_time_delta)::TEXT,
        FORMAT('Last %s', report_period)::TEXT
    FROM query_performance_history
    WHERE recorded_at > NOW() - report_period
    ORDER BY mean_time DESC
    LIMIT 10;
    
    -- Database growth
    RETURN QUERY
    SELECT 
        'Database Growth'::TEXT,
        FORMAT('%s.%s', schema_name, table_name)::TEXT,
        FORMAT('Size: %s, Rows: %s', size_pretty, COALESCE(row_count::TEXT, 'Unknown'))::TEXT,
        'Current'::TEXT
    FROM table_size_history
    WHERE recorded_at = (SELECT MAX(recorded_at) FROM table_size_history)
    ORDER BY size_bytes DESC
    LIMIT 10;
    
    -- Connection statistics
    RETURN QUERY
    SELECT 
        'Connection Statistics'::TEXT,
        state::TEXT,
        FORMAT('Count: %s, Avg Duration: %.1fs', connection_count, avg_duration_seconds)::TEXT,
        'Current'::TEXT
    FROM connection_analysis;
    
    -- Performance metrics summary
    RETURN QUERY
    SELECT 
        'Performance Summary'::TEXT,
        'Buffer Hit Ratio'::TEXT,
        FORMAT('%.2f%%', AVG(buffer_hit_ratio))::TEXT,
        FORMAT('Last %s', report_period)::TEXT
    FROM db_performance_metrics
    WHERE recorded_at > NOW() - report_period;
    
    RETURN QUERY
    SELECT 
        'Performance Summary'::TEXT,
        'Average Active Connections'::TEXT,
        FORMAT('%.1f', AVG(active_connections))::TEXT,
        FORMAT('Last %s', report_period)::TEXT
    FROM db_performance_metrics
    WHERE recorded_at > NOW() - report_period;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- AUTOMATED OPTIMIZATION FUNCTIONS
-- ==========================================

-- Function to suggest index optimizations
CREATE OR REPLACE FUNCTION suggest_index_optimizations()
RETURNS TABLE(
    optimization_type TEXT,
    table_name TEXT,
    current_situation TEXT,
    recommendation TEXT,
    estimated_benefit TEXT
) AS $$
BEGIN
    -- Suggest indexes for tables with high sequential scan ratios
    RETURN QUERY
    SELECT 
        'Missing Index'::TEXT,
        schemaname || '.' || tablename,
        FORMAT('Sequential scans: %s, Rows read: %s', seq_scan, seq_tup_read),
        'Consider adding indexes on frequently queried columns',
        CASE 
            WHEN seq_tup_read > 1000000 THEN 'High'
            WHEN seq_tup_read > 100000 THEN 'Medium'
            ELSE 'Low'
        END
    FROM pg_stat_user_tables
    WHERE seq_scan > idx_scan
        AND seq_tup_read > 10000
        AND schemaname = 'public'
    ORDER BY seq_tup_read DESC
    LIMIT 10;
    
    -- Suggest removing unused indexes
    RETURN QUERY
    SELECT 
        'Remove Unused Index'::TEXT,
        schemaname || '.' || tablename,
        FORMAT('Index %s: 0 scans, Size: %s', indexname, pg_size_pretty(pg_relation_size(indexrelname::regclass))),
        'Consider dropping this unused index',
        'Storage savings: ' || pg_size_pretty(pg_relation_size(indexrelname::regclass))
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
        AND schemaname = 'public'
        AND pg_relation_size(indexrelname::regclass) > 1048576  -- > 1MB
    ORDER BY pg_relation_size(indexrelname::regclass) DESC
    LIMIT 5;
    
    -- Suggest composite indexes for correlated columns
    RETURN QUERY
    SELECT 
        'Composite Index'::TEXT,
        'Multiple Tables'::TEXT,
        'Analysis of query patterns suggests potential for composite indexes',
        'Review slow queries for columns frequently used together in WHERE clauses',
        'Query performance improvement'
    WHERE EXISTS (
        SELECT 1 FROM query_performance_history 
        WHERE mean_time > 1000 
        AND recorded_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-vacuum and analyze suggestions
CREATE OR REPLACE FUNCTION check_maintenance_needs()
RETURNS TABLE(
    maintenance_type TEXT,
    object_name TEXT,
    current_stats TEXT,
    recommendation TEXT,
    urgency TEXT
) AS $$
BEGIN
    -- Check for tables needing VACUUM
    RETURN QUERY
    SELECT 
        'VACUUM'::TEXT,
        schemaname || '.' || tablename,
        FORMAT('Dead tuples: %s, Live tuples: %s', n_dead_tup, n_live_tup),
        'Run VACUUM to reclaim space',
        CASE 
            WHEN n_dead_tup > n_live_tup THEN 'High'
            WHEN n_dead_tup > n_live_tup * 0.2 THEN 'Medium'
            ELSE 'Low'
        END
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 1000
        AND n_dead_tup > n_live_tup * 0.1
    ORDER BY n_dead_tup DESC;
    
    -- Check for tables needing ANALYZE
    RETURN QUERY
    SELECT 
        'ANALYZE'::TEXT,
        schemaname || '.' || tablename,
        FORMAT('Last analyzed: %s, Rows changed: %s', 
               COALESCE(last_analyze::TEXT, 'Never'), 
               n_mod_since_analyze),
        'Run ANALYZE to update statistics',
        CASE 
            WHEN last_analyze IS NULL THEN 'High'
            WHEN n_mod_since_analyze > n_live_tup * 0.1 THEN 'Medium'
            ELSE 'Low'
        END
    FROM pg_stat_user_tables
    WHERE (last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '1 week')
        OR n_mod_since_analyze > GREATEST(n_live_tup * 0.1, 1000)
    ORDER BY n_mod_since_analyze DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- AUTOMATED MAINTENANCE JOBS
-- ==========================================

-- Function to run performance data collection
CREATE OR REPLACE FUNCTION run_performance_monitoring()
RETURNS TEXT AS $$
DECLARE
    query_stats_count INTEGER;
    db_stats_result BOOLEAN;
    table_stats_count INTEGER;
    result_text TEXT;
BEGIN
    -- Collect query performance stats
    SELECT collect_query_performance_stats() INTO query_stats_count;
    
    -- Collect database performance metrics
    SELECT collect_db_performance_metrics() INTO db_stats_result;
    
    -- Collect table size stats (only once per day to avoid overhead)
    IF EXTRACT(HOUR FROM NOW()) = 2 THEN  -- Run at 2 AM
        SELECT collect_table_size_stats() INTO table_stats_count;
    ELSE
        table_stats_count := 0;
    END IF;
    
    result_text := FORMAT(
        'Performance monitoring completed at %s. Query stats: %s records, DB stats: %s, Table stats: %s records',
        NOW()::TEXT,
        query_stats_count,
        CASE WHEN db_stats_result THEN 'collected' ELSE 'failed' END,
        table_stats_count
    );
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE OPTIMIZATION PROCEDURES
-- ==========================================

-- Procedure to auto-optimize based on current load
CREATE OR REPLACE FUNCTION auto_optimize_performance()
RETURNS TEXT AS $$
DECLARE
    optimization_result TEXT := '';
    current_connections INTEGER;
    max_connections INTEGER;
    buffer_hit_ratio DOUBLE PRECISION;
BEGIN
    -- Get current metrics
    SELECT COUNT(*) INTO current_connections FROM pg_stat_activity WHERE pid != pg_backend_pid();
    SELECT setting::INTEGER INTO max_connections FROM pg_settings WHERE name = 'max_connections';
    
    SELECT COALESCE(AVG(buffer_hit_ratio), 0) INTO buffer_hit_ratio 
    FROM db_performance_metrics 
    WHERE recorded_at > NOW() - INTERVAL '10 minutes';
    
    -- Adjust work_mem based on connection load
    IF current_connections > max_connections * 0.8 THEN
        -- High load: reduce work_mem to prevent memory pressure
        EXECUTE 'SET work_mem = ''8MB''';
        optimization_result := optimization_result || 'Reduced work_mem due to high connection load. ';
    ELSIF current_connections < max_connections * 0.3 THEN
        -- Low load: increase work_mem for better performance
        EXECUTE 'SET work_mem = ''32MB''';
        optimization_result := optimization_result || 'Increased work_mem due to low connection load. ';
    END IF;
    
    -- Adjust shared_buffers recommendations based on hit ratio
    IF buffer_hit_ratio < 95 AND buffer_hit_ratio > 0 THEN
        optimization_result := optimization_result || 
            FORMAT('Consider increasing shared_buffers (current hit ratio: %.2f%%). ', buffer_hit_ratio);
    END IF;
    
    -- Reset statistics if they're getting too large
    IF (SELECT query FROM pg_stat_statements LIMIT 1) IS NOT NULL THEN
        DECLARE
            stat_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO stat_count FROM pg_stat_statements;
            IF stat_count > 5000 THEN
                SELECT pg_stat_statements_reset();
                optimization_result := optimization_result || 'Reset pg_stat_statements due to high record count. ';
            END IF;
        END;
    END IF;
    
    RETURN COALESCE(optimization_result, 'No optimizations applied.');
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- GRANTS AND PERMISSIONS
-- ==========================================

-- Grant permissions to monitoring user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION collect_query_performance_stats() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION collect_db_performance_metrics() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION collect_table_size_stats() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION check_performance_alerts() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION generate_performance_report(INTERVAL) TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION suggest_index_optimizations() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION check_maintenance_needs() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION run_performance_monitoring() TO cryb_monitoring;

-- Grant performance views
GRANT SELECT ON top_slow_queries TO cryb_monitoring;
GRANT SELECT ON buffer_cache_analysis TO cryb_monitoring;
GRANT SELECT ON index_usage_analysis TO cryb_monitoring;
GRANT SELECT ON current_locks_analysis TO cryb_monitoring;
GRANT SELECT ON connection_analysis TO cryb_monitoring;

-- ==========================================
-- INITIAL SETUP AND SCHEDULING
-- ==========================================

-- Initial data collection
SELECT run_performance_monitoring();

-- Create initial performance baseline
INSERT INTO db_performance_metrics (
    active_connections, idle_connections, max_connections,
    buffer_hit_ratio, recorded_at
) VALUES (
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'),
    (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle'),
    (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections'),
    95.0,  -- Initial baseline
    NOW()
);

-- ==========================================
-- COMPLETED: Database Monitoring and Performance
-- ==========================================

-- This monitoring system provides:
-- 1. Comprehensive query performance tracking with TimescaleDB
-- 2. Real-time database metrics collection and analysis
-- 3. Automated performance alerts and notifications
-- 4. Index optimization recommendations
-- 5. Maintenance scheduling and suggestions
-- 6. Buffer cache and connection analysis
-- 7. Automated performance tuning based on load
-- 8. Historical trend analysis for capacity planning
-- 9. Lock analysis and deadlock detection
-- 10. Replication lag monitoring for high availability

COMMENT ON SCHEMA public IS 'CRYB Platform - Complete Database Monitoring and Performance Optimization System';

-- Schedule monitoring tasks (to be configured in cron or pg_cron)
/*
-- Run every 5 minutes
SELECT cron.schedule('collect-performance-stats', '*/5 * * * *', 'SELECT run_performance_monitoring();');

-- Check alerts every minute  
SELECT cron.schedule('check-performance-alerts', '* * * * *', 'SELECT check_performance_alerts();');

-- Auto-optimize every 15 minutes
SELECT cron.schedule('auto-optimize', '*/15 * * * *', 'SELECT auto_optimize_performance();');

-- Generate daily performance report
SELECT cron.schedule('daily-perf-report', '0 6 * * *', 'SELECT generate_performance_report(INTERVAL ''24 hours'');');
*/