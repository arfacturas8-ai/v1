-- CRYB PLATFORM DATABASE MONITORING SYSTEM
-- Comprehensive monitoring and alerting for PostgreSQL with TimescaleDB
-- Real-time performance tracking, anomaly detection, and automated reporting

\echo 'Creating comprehensive database monitoring system...';

-- ==============================================
-- MONITORING SCHEMA AND TABLES
-- ==============================================

-- Create monitoring schema for system metrics
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Real-time database metrics collection
CREATE TABLE IF NOT EXISTS monitoring.database_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    database_name TEXT DEFAULT 'cryb',
    instance_name TEXT DEFAULT 'primary',
    tags JSONB DEFAULT '{}',
    
    -- Performance categorization
    category TEXT CHECK (category IN ('performance', 'availability', 'security', 'storage', 'connections')),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'debug'))
);

-- Query performance tracking
CREATE TABLE IF NOT EXISTS monitoring.query_performance (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    query_id TEXT,
    database_name TEXT,
    user_name TEXT,
    query_text TEXT,
    execution_time_ms NUMERIC,
    rows_returned BIGINT,
    rows_examined BIGINT,
    cpu_time_ms NUMERIC,
    io_read_bytes BIGINT,
    io_write_bytes BIGINT,
    temp_files_count INTEGER DEFAULT 0,
    temp_files_size BIGINT DEFAULT 0,
    query_plan JSONB,
    error_message TEXT,
    is_slow_query BOOLEAN DEFAULT false,
    optimization_suggestions TEXT[]
);

-- Connection monitoring
CREATE TABLE IF NOT EXISTS monitoring.connection_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_connections INTEGER,
    active_connections INTEGER,
    idle_connections INTEGER,
    waiting_connections INTEGER,
    max_connections INTEGER,
    connection_utilization NUMERIC,
    pgbouncer_pools JSONB,
    connection_errors INTEGER DEFAULT 0,
    avg_connection_age INTERVAL
);

-- Storage and disk usage tracking
CREATE TABLE IF NOT EXISTS monitoring.storage_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    database_name TEXT,
    table_name TEXT,
    schema_name TEXT DEFAULT 'public',
    table_size_bytes BIGINT,
    index_size_bytes BIGINT,
    total_size_bytes BIGINT,
    row_count BIGINT,
    dead_tuples BIGINT,
    live_tuples BIGINT,
    autovacuum_count INTEGER DEFAULT 0,
    autoanalyze_count INTEGER DEFAULT 0,
    last_vacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ,
    bloat_percentage NUMERIC
);

-- Index usage and efficiency tracking
CREATE TABLE IF NOT EXISTS monitoring.index_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size_bytes BIGINT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    scan_efficiency NUMERIC,
    is_unique BOOLEAN,
    is_primary BOOLEAN,
    unused_days INTEGER DEFAULT 0,
    suggestion TEXT
);

-- TimescaleDB specific monitoring
CREATE TABLE IF NOT EXISTS monitoring.timescaledb_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hypertable_name TEXT,
    chunk_count INTEGER,
    compressed_chunks INTEGER,
    compression_ratio NUMERIC,
    total_size_bytes BIGINT,
    compressed_size_bytes BIGINT,
    last_compression TIMESTAMPTZ,
    retention_policy INTERVAL,
    continuous_aggregates INTEGER DEFAULT 0
);

-- Alert configuration and history
CREATE TABLE IF NOT EXISTS monitoring.alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name TEXT UNIQUE NOT NULL,
    metric_name TEXT NOT NULL,
    condition_operator TEXT NOT NULL CHECK (condition_operator IN ('>', '<', '>=', '<=', '=', '!=')),
    threshold_value NUMERIC NOT NULL,
    duration_minutes INTEGER DEFAULT 5,
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('critical', 'warning', 'info')),
    notification_channels TEXT[] DEFAULT ARRAY['email'],
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring.alert_history (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER REFERENCES monitoring.alert_rules(id),
    alert_triggered_at TIMESTAMPTZ DEFAULT NOW(),
    alert_resolved_at TIMESTAMPTZ,
    duration INTERVAL,
    triggered_value NUMERIC,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'suppressed')),
    notification_sent BOOLEAN DEFAULT false,
    acknowledgment_user TEXT,
    acknowledgment_notes TEXT
);

-- Convert monitoring tables to hypertables for time-series optimization
SELECT create_hypertable('monitoring.database_metrics', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.query_performance', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.connection_metrics', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.storage_metrics', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.index_metrics', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.timescaledb_metrics', 'timestamp', if_not_exists => TRUE);
SELECT create_hypertable('monitoring.alert_history', 'alert_triggered_at', if_not_exists => TRUE);

-- ==============================================
-- MONITORING FUNCTIONS
-- ==============================================

-- Collect comprehensive database metrics
CREATE OR REPLACE FUNCTION monitoring.collect_database_metrics()
RETURNS VOID AS $$
DECLARE
    metric_timestamp TIMESTAMPTZ := NOW();
BEGIN
    -- Database size and growth metrics
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'database_size_bytes',
        pg_database_size(datname),
        'bytes',
        'storage'
    FROM pg_database WHERE datname = 'cryb';
    
    -- Connection metrics
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'active_connections',
        COUNT(*),
        'count',
        'connections'
    FROM pg_stat_activity 
    WHERE state = 'active' AND datname = 'cryb';
    
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'idle_connections',
        COUNT(*),
        'count',
        'connections'
    FROM pg_stat_activity 
    WHERE state = 'idle' AND datname = 'cryb';
    
    -- Transaction metrics
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'transactions_per_second',
        (xact_commit + xact_rollback) / GREATEST(EXTRACT(EPOCH FROM (NOW() - stats_reset)), 1),
        'tps',
        'performance'
    FROM pg_stat_database WHERE datname = 'cryb';
    
    -- Cache hit ratio
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'cache_hit_ratio',
        CASE 
            WHEN (blks_hit + blks_read) > 0 
            THEN (blks_hit::NUMERIC / (blks_hit + blks_read)) * 100 
            ELSE 0 
        END,
        'percentage',
        'performance'
    FROM pg_stat_database WHERE datname = 'cryb';
    
    -- Deadlock detection
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category, severity)
    SELECT 
        metric_timestamp,
        'deadlocks_total',
        deadlocks,
        'count',
        'performance',
        CASE WHEN deadlocks > 0 THEN 'warning' ELSE 'info' END
    FROM pg_stat_database WHERE datname = 'cryb';
    
    -- WAL metrics
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category)
    SELECT 
        metric_timestamp,
        'wal_bytes_written',
        pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0'),
        'bytes',
        'performance';
    
    -- Table bloat detection
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category, severity)
    WITH bloat_stats AS (
        SELECT 
            schemaname,
            tablename,
            (n_dead_tup::NUMERIC / GREATEST(n_live_tup, 1)) * 100 as bloat_percentage
        FROM pg_stat_user_tables
        WHERE n_live_tup > 1000  -- Only check tables with significant data
    )
    SELECT 
        metric_timestamp,
        'table_bloat_percentage',
        AVG(bloat_percentage),
        'percentage',
        'storage',
        CASE 
            WHEN AVG(bloat_percentage) > 20 THEN 'warning'
            WHEN AVG(bloat_percentage) > 50 THEN 'critical'
            ELSE 'info'
        END
    FROM bloat_stats;
    
    -- Long-running queries
    INSERT INTO monitoring.database_metrics (timestamp, metric_name, metric_value, metric_unit, category, severity)
    SELECT 
        metric_timestamp,
        'long_running_queries',
        COUNT(*),
        'count',
        'performance',
        CASE 
            WHEN COUNT(*) > 5 THEN 'warning'
            WHEN COUNT(*) > 10 THEN 'critical'
            ELSE 'info'
        END
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '5 minutes'
    AND query NOT LIKE '%IDLE%';
    
END;
$$ LANGUAGE plpgsql;

-- Collect detailed connection metrics
CREATE OR REPLACE FUNCTION monitoring.collect_connection_metrics()
RETURNS VOID AS $$
DECLARE
    metric_timestamp TIMESTAMPTZ := NOW();
    total_conn INTEGER;
    active_conn INTEGER;
    idle_conn INTEGER;
    waiting_conn INTEGER;
    max_conn INTEGER;
BEGIN
    -- Get connection counts
    SELECT COUNT(*) INTO total_conn FROM pg_stat_activity WHERE datname = 'cryb';
    SELECT COUNT(*) INTO active_conn FROM pg_stat_activity WHERE datname = 'cryb' AND state = 'active';
    SELECT COUNT(*) INTO idle_conn FROM pg_stat_activity WHERE datname = 'cryb' AND state = 'idle';
    SELECT COUNT(*) INTO waiting_conn FROM pg_stat_activity WHERE datname = 'cryb' AND wait_event IS NOT NULL;
    
    -- Get max connections setting
    SELECT setting::INTEGER INTO max_conn FROM pg_settings WHERE name = 'max_connections';
    
    -- Insert connection metrics
    INSERT INTO monitoring.connection_metrics (
        timestamp, total_connections, active_connections, idle_connections, 
        waiting_connections, max_connections, connection_utilization,
        avg_connection_age
    )
    SELECT 
        metric_timestamp,
        total_conn,
        active_conn,
        idle_conn,
        waiting_conn,
        max_conn,
        (total_conn::NUMERIC / max_conn) * 100,
        AVG(NOW() - backend_start)
    FROM pg_stat_activity 
    WHERE datname = 'cryb';
    
END;
$$ LANGUAGE plpgsql;

-- Collect storage and table metrics
CREATE OR REPLACE FUNCTION monitoring.collect_storage_metrics()
RETURNS VOID AS $$
DECLARE
    metric_timestamp TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO monitoring.storage_metrics (
        timestamp, database_name, table_name, schema_name,
        table_size_bytes, index_size_bytes, total_size_bytes,
        row_count, dead_tuples, live_tuples,
        last_vacuum, last_analyze, bloat_percentage
    )
    SELECT 
        metric_timestamp,
        'cryb',
        tablename,
        schemaname,
        pg_total_relation_size(schemaname||'.'||tablename) - pg_indexes_size(schemaname||'.'||tablename),
        pg_indexes_size(schemaname||'.'||tablename),
        pg_total_relation_size(schemaname||'.'||tablename),
        n_live_tup,
        n_dead_tup,
        n_live_tup,
        last_vacuum,
        last_analyze,
        CASE 
            WHEN n_live_tup > 0 
            THEN (n_dead_tup::NUMERIC / n_live_tup) * 100 
            ELSE 0 
        END
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    AND n_live_tup > 100;  -- Only track tables with significant data
    
END;
$$ LANGUAGE plpgsql;

-- Collect index usage metrics
CREATE OR REPLACE FUNCTION monitoring.collect_index_metrics()
RETURNS VOID AS $$
DECLARE
    metric_timestamp TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO monitoring.index_metrics (
        timestamp, schema_name, table_name, index_name,
        index_size_bytes, index_scans, tuples_read, tuples_fetched,
        scan_efficiency, is_unique, is_primary, suggestion
    )
    SELECT 
        metric_timestamp,
        schemaname,
        tablename,
        indexrelname,
        pg_relation_size(indexrelid),
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE 
            WHEN idx_tup_read > 0 
            THEN (idx_tup_fetch::NUMERIC / idx_tup_read) * 100 
            ELSE 0 
        END,
        indisunique,
        indisprimary,
        CASE 
            WHEN idx_scan = 0 AND pg_relation_size(indexrelid) > 1024*1024 
            THEN 'Consider dropping unused index'
            WHEN idx_tup_read > 0 AND (idx_tup_fetch::NUMERIC / idx_tup_read) < 0.1 
            THEN 'Low efficiency index - review query patterns'
            ELSE 'Index performing well'
        END
    FROM pg_stat_user_indexes psu
    JOIN pg_index pi ON psu.indexrelid = pi.indexrelid
    WHERE schemaname = 'public';
    
END;
$$ LANGUAGE plpgsql;

-- Collect TimescaleDB specific metrics
CREATE OR REPLACE FUNCTION monitoring.collect_timescaledb_metrics()
RETURNS VOID AS $$
DECLARE
    metric_timestamp TIMESTAMPTZ := NOW();
BEGIN
    INSERT INTO monitoring.timescaledb_metrics (
        timestamp, hypertable_name, chunk_count, compressed_chunks,
        compression_ratio, total_size_bytes, compressed_size_bytes
    )
    SELECT 
        metric_timestamp,
        hypertable_name,
        chunk_count,
        compressed_chunk_count,
        CASE 
            WHEN compressed_total_size > 0 
            THEN uncompressed_total_size::NUMERIC / compressed_total_size 
            ELSE 1 
        END,
        uncompressed_total_size,
        compressed_total_size
    FROM (
        SELECT 
            h.hypertable_name,
            COUNT(c.chunk_name) as chunk_count,
            COUNT(cc.chunk_name) as compressed_chunk_count,
            COALESCE(SUM(pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name))), 0) as uncompressed_total_size,
            COALESCE(SUM(CASE WHEN cc.chunk_name IS NOT NULL THEN pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name)) ELSE 0 END), 0) as compressed_total_size
        FROM timescaledb_information.hypertables h
        LEFT JOIN timescaledb_information.chunks c ON h.hypertable_name = c.hypertable_name
        LEFT JOIN timescaledb_information.compressed_chunks cc ON c.chunk_name = cc.chunk_name
        WHERE h.hypertable_schema = 'public'
        GROUP BY h.hypertable_name
    ) stats;
    
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- ALERTING SYSTEM
-- ==============================================

-- Check alert conditions and trigger notifications
CREATE OR REPLACE FUNCTION monitoring.check_alert_conditions()
RETURNS TABLE (
    rule_name TEXT,
    current_value NUMERIC,
    threshold_value NUMERIC,
    severity TEXT,
    should_alert BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_metrics AS (
        SELECT 
            metric_name,
            AVG(metric_value) as avg_value,
            MAX(metric_value) as max_value,
            MIN(metric_value) as min_value
        FROM monitoring.database_metrics
        WHERE timestamp > NOW() - INTERVAL '10 minutes'
        GROUP BY metric_name
    )
    SELECT 
        ar.rule_name,
        CASE ar.metric_name
            WHEN 'cache_hit_ratio' THEN rm.avg_value
            WHEN 'connection_utilization' THEN rm.max_value
            ELSE rm.avg_value
        END as current_value,
        ar.threshold_value,
        ar.severity,
        CASE ar.condition_operator
            WHEN '>' THEN rm.avg_value > ar.threshold_value
            WHEN '<' THEN rm.avg_value < ar.threshold_value
            WHEN '>=' THEN rm.avg_value >= ar.threshold_value
            WHEN '<=' THEN rm.avg_value <= ar.threshold_value
            WHEN '=' THEN rm.avg_value = ar.threshold_value
            WHEN '!=' THEN rm.avg_value != ar.threshold_value
            ELSE false
        END as should_alert
    FROM monitoring.alert_rules ar
    JOIN recent_metrics rm ON ar.metric_name = rm.metric_name
    WHERE ar.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Process alerts and create alert history
CREATE OR REPLACE FUNCTION monitoring.process_alerts()
RETURNS TEXT AS $$
DECLARE
    alert_record RECORD;
    result_text TEXT := '';
    alerts_triggered INTEGER := 0;
BEGIN
    FOR alert_record IN 
        SELECT * FROM monitoring.check_alert_conditions() WHERE should_alert = true
    LOOP
        -- Check if alert is already active
        IF NOT EXISTS (
            SELECT 1 FROM monitoring.alert_history ah
            JOIN monitoring.alert_rules ar ON ah.rule_id = ar.id
            WHERE ar.rule_name = alert_record.rule_name
            AND ah.status = 'active'
            AND ah.alert_triggered_at > NOW() - INTERVAL '1 hour'
        ) THEN
            -- Create new alert
            INSERT INTO monitoring.alert_history (
                rule_id, triggered_value, status
            )
            SELECT 
                ar.id,
                alert_record.current_value,
                'active'
            FROM monitoring.alert_rules ar
            WHERE ar.rule_name = alert_record.rule_name;
            
            alerts_triggered := alerts_triggered + 1;
            result_text := result_text || 
                format('ALERT: %s - Current: %s, Threshold: %s, Severity: %s' || E'\n',
                    alert_record.rule_name,
                    alert_record.current_value,
                    alert_record.threshold_value,
                    alert_record.severity
                );
        END IF;
    END LOOP;
    
    IF alerts_triggered = 0 THEN
        result_text := 'No new alerts triggered';
    ELSE
        result_text := format('%s new alerts triggered:' || E'\n%s', alerts_triggered, result_text);
    END IF;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- REPORTING FUNCTIONS
-- ==============================================

-- Generate comprehensive database health report
CREATE OR REPLACE FUNCTION monitoring.generate_health_report(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    report_section TEXT,
    metric_name TEXT,
    current_value TEXT,
    trend TEXT,
    status TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH metric_trends AS (
        SELECT 
            dm.metric_name,
            AVG(dm.metric_value) as avg_value,
            MAX(dm.metric_value) as max_value,
            MIN(dm.metric_value) as min_value,
            STDDEV(dm.metric_value) as stddev_value,
            COUNT(*) as measurement_count
        FROM monitoring.database_metrics dm
        WHERE dm.timestamp > NOW() - (p_hours_back || ' hours')::INTERVAL
        GROUP BY dm.metric_name
    )
    SELECT 
        'Database Performance' as report_section,
        mt.metric_name,
        ROUND(mt.avg_value, 2)::TEXT as current_value,
        CASE 
            WHEN mt.stddev_value / NULLIF(mt.avg_value, 0) > 0.3 THEN 'High Variance'
            WHEN mt.max_value / NULLIF(mt.avg_value, 0) > 2 THEN 'Spiky'
            ELSE 'Stable'
        END as trend,
        CASE mt.metric_name
            WHEN 'cache_hit_ratio' THEN 
                CASE WHEN mt.avg_value >= 95 THEN 'Good' WHEN mt.avg_value >= 90 THEN 'Warning' ELSE 'Critical' END
            WHEN 'connection_utilization' THEN
                CASE WHEN mt.avg_value <= 70 THEN 'Good' WHEN mt.avg_value <= 85 THEN 'Warning' ELSE 'Critical' END
            WHEN 'deadlocks_total' THEN
                CASE WHEN mt.avg_value = 0 THEN 'Good' WHEN mt.avg_value <= 5 THEN 'Warning' ELSE 'Critical' END
            ELSE 'Info'
        END as status,
        CASE mt.metric_name
            WHEN 'cache_hit_ratio' THEN 
                CASE WHEN mt.avg_value < 90 THEN 'Consider increasing shared_buffers or optimizing queries' ELSE 'Cache performance is good' END
            WHEN 'connection_utilization' THEN
                CASE WHEN mt.avg_value > 85 THEN 'Consider connection pooling optimization' ELSE 'Connection usage is healthy' END
            WHEN 'deadlocks_total' THEN
                CASE WHEN mt.avg_value > 0 THEN 'Review transaction patterns and lock ordering' ELSE 'No deadlock issues detected' END
            ELSE 'Monitor trends for anomalies'
        END as recommendation
    FROM metric_trends mt
    ORDER BY mt.metric_name;
END;
$$ LANGUAGE plpgsql;

-- Get slow query analysis
CREATE OR REPLACE FUNCTION monitoring.get_slow_query_analysis(
    p_hours_back INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    query_pattern TEXT,
    avg_execution_time_ms NUMERIC,
    execution_count BIGINT,
    total_time_ms NUMERIC,
    avg_rows_returned NUMERIC,
    optimization_priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        LEFT(qp.query_text, 100) as query_pattern,
        AVG(qp.execution_time_ms) as avg_execution_time_ms,
        COUNT(*) as execution_count,
        SUM(qp.execution_time_ms) as total_time_ms,
        AVG(qp.rows_returned) as avg_rows_returned,
        CASE 
            WHEN AVG(qp.execution_time_ms) > 5000 THEN 'High'
            WHEN AVG(qp.execution_time_ms) > 1000 THEN 'Medium'
            ELSE 'Low'
        END as optimization_priority
    FROM monitoring.query_performance qp
    WHERE qp.timestamp > NOW() - (p_hours_back || ' hours')::INTERVAL
    AND qp.execution_time_ms > 100  -- Only queries taking more than 100ms
    GROUP BY LEFT(qp.query_text, 100)
    ORDER BY total_time_ms DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- DEFAULT ALERT RULES
-- ==============================================

-- Insert default monitoring alert rules
INSERT INTO monitoring.alert_rules (rule_name, metric_name, condition_operator, threshold_value, severity, duration_minutes) VALUES
('High Cache Miss Rate', 'cache_hit_ratio', '<', 90, 'warning', 5),
('Critical Cache Miss Rate', 'cache_hit_ratio', '<', 80, 'critical', 3),
('High Connection Usage', 'connection_utilization', '>', 80, 'warning', 5),
('Critical Connection Usage', 'connection_utilization', '>', 90, 'critical', 2),
('Deadlock Detection', 'deadlocks_total', '>', 0, 'warning', 1),
('Long Running Queries', 'long_running_queries', '>', 5, 'warning', 10),
('Critical Long Running Queries', 'long_running_queries', '>', 10, 'critical', 5),
('High Table Bloat', 'table_bloat_percentage', '>', 25, 'warning', 30),
('Critical Table Bloat', 'table_bloat_percentage', '>', 50, 'critical', 60)
ON CONFLICT (rule_name) DO NOTHING;

-- ==============================================
-- AUTOMATION PROCEDURES
-- ==============================================

-- Main monitoring collection procedure
CREATE OR REPLACE FUNCTION monitoring.collect_all_metrics()
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ := NOW();
    result_text TEXT := '';
BEGIN
    -- Collect all metrics
    PERFORM monitoring.collect_database_metrics();
    PERFORM monitoring.collect_connection_metrics();
    PERFORM monitoring.collect_storage_metrics();
    PERFORM monitoring.collect_index_metrics();
    
    -- Collect TimescaleDB metrics if extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM monitoring.collect_timescaledb_metrics();
        result_text := result_text || 'TimescaleDB metrics collected. ';
    END IF;
    
    -- Process alerts
    result_text := result_text || monitoring.process_alerts();
    
    -- Add execution summary
    result_text := 'Monitoring collection completed in ' || 
                  EXTRACT(EPOCH FROM (NOW() - start_time))::TEXT || ' seconds. ' || 
                  result_text;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PERMISSIONS AND CLEANUP
-- ==============================================

-- Grant permissions for monitoring functions
GRANT USAGE ON SCHEMA monitoring TO cryb_user;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA monitoring TO cryb_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA monitoring TO cryb_user;

-- Set up retention policies for monitoring data
SELECT add_retention_policy('monitoring.database_metrics', INTERVAL '90 days');
SELECT add_retention_policy('monitoring.query_performance', INTERVAL '30 days');
SELECT add_retention_policy('monitoring.connection_metrics', INTERVAL '90 days');
SELECT add_retention_policy('monitoring.storage_metrics', INTERVAL '180 days');
SELECT add_retention_policy('monitoring.index_metrics', INTERVAL '90 days');
SELECT add_retention_policy('monitoring.timescaledb_metrics', INTERVAL '180 days');
SELECT add_retention_policy('monitoring.alert_history', INTERVAL '1 year');

-- Create indexes for monitoring queries
CREATE INDEX IF NOT EXISTS idx_database_metrics_name_time ON monitoring.database_metrics (metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_performance_time_exec ON monitoring.query_performance (timestamp DESC, execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_rule_status ON monitoring.alert_history (rule_id, status, alert_triggered_at DESC);

\echo 'Database monitoring system created successfully!';
\echo '';
\echo 'Available monitoring functions:';
\echo '- monitoring.collect_all_metrics() - Collect all metrics and process alerts';
\echo '- monitoring.generate_health_report(hours_back) - Generate health report';
\echo '- monitoring.get_slow_query_analysis(hours_back, limit) - Analyze slow queries';
\echo '- monitoring.check_alert_conditions() - Check current alert conditions';
\echo '';
\echo 'Setup automatic collection with:';
\echo 'SELECT cron.schedule(''collect-metrics'', ''*/5 * * * *'', ''SELECT monitoring.collect_all_metrics();'');';
\echo '';
\echo 'View current health with:';
\echo 'SELECT * FROM monitoring.generate_health_report(24);';