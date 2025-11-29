-- CRYB PLATFORM QUERY PERFORMANCE MONITORING
-- Advanced query analysis, optimization suggestions, and performance tracking
-- Integrates with pg_stat_statements for comprehensive query monitoring

\echo 'Setting up advanced query performance monitoring...';

-- ==============================================
-- PREREQUISITES AND EXTENSIONS
-- ==============================================

-- Enable pg_stat_statements extension for query tracking
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics to start fresh
SELECT pg_stat_statements_reset();

-- ==============================================
-- QUERY PERFORMANCE ANALYSIS SCHEMA
-- ==============================================

CREATE SCHEMA IF NOT EXISTS query_monitor;

-- Query fingerprinting and categorization
CREATE TABLE IF NOT EXISTS query_monitor.query_fingerprints (
    id SERIAL PRIMARY KEY,
    query_hash TEXT UNIQUE NOT NULL,
    query_pattern TEXT NOT NULL,
    query_type TEXT NOT NULL, -- SELECT, INSERT, UPDATE, DELETE, DDL, UTILITY
    table_names TEXT[],
    estimated_complexity TEXT, -- simple, medium, complex
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    -- Performance characteristics
    min_execution_time_ms NUMERIC,
    max_execution_time_ms NUMERIC,
    avg_execution_time_ms NUMERIC,
    total_execution_count BIGINT DEFAULT 0,
    
    -- Resource usage patterns
    avg_cpu_time_ms NUMERIC,
    avg_io_read_bytes BIGINT,
    avg_io_write_bytes BIGINT,
    avg_temp_files_size BIGINT,
    
    -- Optimization status
    optimization_suggestions JSONB DEFAULT '[]',
    optimization_status TEXT DEFAULT 'not_analyzed' -- not_analyzed, optimized, needs_attention, critical
);

-- Real-time query execution tracking
CREATE TABLE IF NOT EXISTS query_monitor.query_executions (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    query_hash TEXT NOT NULL,
    database_name TEXT DEFAULT 'cryb',
    username TEXT,
    application_name TEXT,
    client_ip TEXT,
    
    -- Execution metrics
    execution_time_ms NUMERIC NOT NULL,
    planning_time_ms NUMERIC,
    cpu_time_ms NUMERIC,
    
    -- I/O metrics
    shared_blks_hit BIGINT DEFAULT 0,
    shared_blks_read BIGINT DEFAULT 0,
    shared_blks_dirtied BIGINT DEFAULT 0,
    shared_blks_written BIGINT DEFAULT 0,
    local_blks_hit BIGINT DEFAULT 0,
    local_blks_read BIGINT DEFAULT 0,
    local_blks_dirtied BIGINT DEFAULT 0,
    local_blks_written BIGINT DEFAULT 0,
    temp_blks_read BIGINT DEFAULT 0,
    temp_blks_written BIGINT DEFAULT 0,
    
    -- Result metrics
    rows_returned BIGINT,
    rows_affected BIGINT,
    
    -- Error tracking
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT,
    
    -- Context information
    transaction_id BIGINT,
    query_plan JSONB,
    explain_analyze_output TEXT
);

-- Query optimization recommendations
CREATE TABLE IF NOT EXISTS query_monitor.optimization_recommendations (
    id SERIAL PRIMARY KEY,
    query_hash TEXT NOT NULL,
    recommendation_type TEXT NOT NULL, -- index, rewrite, partition, cache, etc.
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    estimated_benefit TEXT,
    implementation_complexity TEXT CHECK (implementation_complexity IN ('low', 'medium', 'high')),
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    implemented BOOLEAN DEFAULT false,
    implemented_at TIMESTAMPTZ,
    implementation_notes TEXT,
    
    -- Impact measurement
    before_avg_time_ms NUMERIC,
    after_avg_time_ms NUMERIC,
    performance_improvement_pct NUMERIC,
    
    FOREIGN KEY (query_hash) REFERENCES query_monitor.query_fingerprints(query_hash)
);

-- Query performance baselines and alerts
CREATE TABLE IF NOT EXISTS query_monitor.performance_baselines (
    id SERIAL PRIMARY KEY,
    query_hash TEXT NOT NULL,
    baseline_period_start TIMESTAMPTZ NOT NULL,
    baseline_period_end TIMESTAMPTZ NOT NULL,
    
    -- Baseline metrics
    baseline_avg_time_ms NUMERIC NOT NULL,
    baseline_95th_percentile_ms NUMERIC NOT NULL,
    baseline_execution_count BIGINT NOT NULL,
    
    -- Alert thresholds
    slow_query_threshold_ms NUMERIC NOT NULL,
    regression_threshold_pct NUMERIC DEFAULT 50, -- Alert if 50% slower than baseline
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (query_hash) REFERENCES query_monitor.query_fingerprints(query_hash)
);

-- Convert execution tracking to hypertable for time-series performance
SELECT create_hypertable('query_monitor.query_executions', 'timestamp', if_not_exists => TRUE);

-- ==============================================
-- QUERY ANALYSIS FUNCTIONS
-- ==============================================

-- Extract and fingerprint queries from pg_stat_statements
CREATE OR REPLACE FUNCTION query_monitor.update_query_fingerprints()
RETURNS TEXT AS $$
DECLARE
    stmt_record RECORD;
    query_hash_val TEXT;
    result_count INTEGER := 0;
BEGIN
    FOR stmt_record IN 
        SELECT 
            queryid,
            query,
            calls,
            total_exec_time,
            min_exec_time,
            max_exec_time,
            mean_exec_time,
            stddev_exec_time,
            rows,
            shared_blks_hit,
            shared_blks_read,
            shared_blks_dirtied,
            shared_blks_written,
            local_blks_hit,
            local_blks_read,
            local_blks_dirtied,
            local_blks_written,
            temp_blks_read,
            temp_blks_written
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%query_monitor%'
        AND calls > 1
    LOOP
        -- Create hash for query fingerprint
        query_hash_val := 'q_' || stmt_record.queryid::TEXT;
        
        -- Insert or update fingerprint
        INSERT INTO query_monitor.query_fingerprints (
            query_hash,
            query_pattern,
            query_type,
            table_names,
            estimated_complexity,
            min_execution_time_ms,
            max_execution_time_ms,
            avg_execution_time_ms,
            total_execution_count,
            last_seen
        ) VALUES (
            query_hash_val,
            LEFT(stmt_record.query, 500),
            CASE 
                WHEN UPPER(stmt_record.query) LIKE 'SELECT%' THEN 'SELECT'
                WHEN UPPER(stmt_record.query) LIKE 'INSERT%' THEN 'INSERT'
                WHEN UPPER(stmt_record.query) LIKE 'UPDATE%' THEN 'UPDATE'
                WHEN UPPER(stmt_record.query) LIKE 'DELETE%' THEN 'DELETE'
                WHEN UPPER(stmt_record.query) LIKE 'CREATE%' OR UPPER(stmt_record.query) LIKE 'ALTER%' OR UPPER(stmt_record.query) LIKE 'DROP%' THEN 'DDL'
                ELSE 'UTILITY'
            END,
            query_monitor.extract_table_names(stmt_record.query),
            CASE 
                WHEN stmt_record.mean_exec_time > 5000 THEN 'complex'
                WHEN stmt_record.mean_exec_time > 500 THEN 'medium'
                ELSE 'simple'
            END,
            stmt_record.min_exec_time,
            stmt_record.max_exec_time,
            stmt_record.mean_exec_time,
            stmt_record.calls,
            NOW()
        )
        ON CONFLICT (query_hash) DO UPDATE SET
            min_execution_time_ms = LEAST(query_monitor.query_fingerprints.min_execution_time_ms, stmt_record.min_exec_time),
            max_execution_time_ms = GREATEST(query_monitor.query_fingerprints.max_execution_time_ms, stmt_record.max_exec_time),
            avg_execution_time_ms = stmt_record.mean_exec_time,
            total_execution_count = stmt_record.calls,
            last_seen = NOW();
            
        result_count := result_count + 1;
    END LOOP;
    
    RETURN format('Updated %s query fingerprints', result_count);
END;
$$ LANGUAGE plpgsql;

-- Extract table names from SQL queries
CREATE OR REPLACE FUNCTION query_monitor.extract_table_names(query_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
    table_names TEXT[];
    normalized_query TEXT;
BEGIN
    -- Normalize query for parsing
    normalized_query := UPPER(TRIM(query_text));
    
    -- Simple table extraction (this is a basic implementation)
    -- In production, you might want to use a proper SQL parser
    table_names := ARRAY(
        SELECT DISTINCT unnest(
            regexp_split_to_array(
                regexp_replace(
                    regexp_replace(normalized_query, 
                        '.*FROM\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?).*', 
                        '\1', 'g'
                    ),
                    '.*UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?).*',
                    '\1', 'g'
                ),
                '\s*,\s*'
            )
        )
        WHERE LENGTH(unnest(regexp_split_to_array(
            regexp_replace(
                regexp_replace(normalized_query, 
                    '.*FROM\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?).*', 
                    '\1', 'g'
                ),
                '.*UPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?).*',
                '\1', 'g'
            ),
            '\s*,\s*'
        ))) > 0
    );
    
    RETURN COALESCE(table_names, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Generate optimization recommendations for slow queries
CREATE OR REPLACE FUNCTION query_monitor.generate_optimization_recommendations(
    p_query_hash TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    fingerprint_record RECORD;
    recommendation_count INTEGER := 0;
    result_text TEXT := '';
BEGIN
    FOR fingerprint_record IN 
        SELECT 
            qf.*,
            (SELECT COUNT(*) FROM query_monitor.optimization_recommendations 
             WHERE query_hash = qf.query_hash AND implemented = false) as existing_recommendations
        FROM query_monitor.query_fingerprints qf
        WHERE (p_query_hash IS NULL OR qf.query_hash = p_query_hash)
        AND qf.avg_execution_time_ms > 500  -- Focus on queries taking more than 500ms
        AND qf.total_execution_count > 10   -- With significant usage
    LOOP
        -- Skip if already has recommendations
        IF fingerprint_record.existing_recommendations > 0 THEN
            CONTINUE;
        END IF;
        
        -- Generate recommendations based on query patterns
        
        -- Slow SELECT queries
        IF fingerprint_record.query_type = 'SELECT' AND fingerprint_record.avg_execution_time_ms > 1000 THEN
            INSERT INTO query_monitor.optimization_recommendations (
                query_hash, recommendation_type, priority, title, description, 
                suggested_action, estimated_benefit, implementation_complexity, before_avg_time_ms
            ) VALUES (
                fingerprint_record.query_hash,
                'index',
                CASE 
                    WHEN fingerprint_record.avg_execution_time_ms > 5000 THEN 'critical'
                    WHEN fingerprint_record.avg_execution_time_ms > 2000 THEN 'high'
                    ELSE 'medium'
                END,
                'Add Missing Indexes',
                'Query execution time suggests missing or inefficient indexes',
                'Analyze query execution plan and add appropriate indexes for WHERE, JOIN, and ORDER BY clauses',
                format('Potential 50-80%% performance improvement (from %sms)', ROUND(fingerprint_record.avg_execution_time_ms, 0)),
                'medium',
                fingerprint_record.avg_execution_time_ms
            );
            recommendation_count := recommendation_count + 1;
        END IF;
        
        -- Queries with high I/O
        IF fingerprint_record.avg_io_read_bytes > 1024*1024*10 THEN -- 10MB+ reads
            INSERT INTO query_monitor.optimization_recommendations (
                query_hash, recommendation_type, priority, title, description,
                suggested_action, estimated_benefit, implementation_complexity, before_avg_time_ms
            ) VALUES (
                fingerprint_record.query_hash,
                'cache',
                'high',
                'High I/O Query Optimization',
                'Query performs excessive disk reads, impacting system performance',
                'Review query for unnecessary data retrieval, add covering indexes, or implement query result caching',
                'Reduced I/O and improved cache hit ratio',
                'medium',
                fingerprint_record.avg_execution_time_ms
            );
            recommendation_count := recommendation_count + 1;
        END IF;
        
        -- Complex queries that might benefit from rewriting
        IF fingerprint_record.estimated_complexity = 'complex' AND fingerprint_record.avg_execution_time_ms > 3000 THEN
            INSERT INTO query_monitor.optimization_recommendations (
                query_hash, recommendation_type, priority, title, description,
                suggested_action, estimated_benefit, implementation_complexity, before_avg_time_ms
            ) VALUES (
                fingerprint_record.query_hash,
                'rewrite',
                'high',
                'Complex Query Rewrite',
                'Query complexity suggests potential for optimization through rewriting',
                'Break down complex query into simpler parts, use CTEs or temporary tables, consider query rewrite patterns',
                'Significant performance improvement through better execution plan',
                'high',
                fingerprint_record.avg_execution_time_ms
            );
            recommendation_count := recommendation_count + 1;
        END IF;
        
        -- Frequent queries that might benefit from materialized views
        IF fingerprint_record.total_execution_count > 1000 AND fingerprint_record.query_type = 'SELECT' THEN
            INSERT INTO query_monitor.optimization_recommendations (
                query_hash, recommendation_type, priority, title, description,
                suggested_action, estimated_benefit, implementation_complexity, before_avg_time_ms
            ) VALUES (
                fingerprint_record.query_hash,
                'materialized_view',
                'medium',
                'Materialized View Candidate',
                'Frequently executed query could benefit from materialization',
                'Create materialized view with appropriate refresh strategy',
                'Near-instant query response for cached results',
                'medium',
                fingerprint_record.avg_execution_time_ms
            );
            recommendation_count := recommendation_count + 1;
        END IF;
    END LOOP;
    
    result_text := format('Generated %s new optimization recommendations', recommendation_count);
    
    -- Update optimization status for fingerprints
    UPDATE query_monitor.query_fingerprints 
    SET optimization_status = CASE 
        WHEN avg_execution_time_ms > 5000 THEN 'critical'
        WHEN avg_execution_time_ms > 2000 THEN 'needs_attention'
        WHEN avg_execution_time_ms > 500 THEN 'optimized'
        ELSE 'not_analyzed'
    END
    WHERE optimization_status = 'not_analyzed';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Analyze query performance trends and detect regressions
CREATE OR REPLACE FUNCTION query_monitor.detect_performance_regressions(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    query_hash TEXT,
    query_pattern TEXT,
    baseline_avg_ms NUMERIC,
    current_avg_ms NUMERIC,
    regression_pct NUMERIC,
    execution_count BIGINT,
    severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH baseline_performance AS (
        SELECT 
            qf.query_hash,
            qf.query_pattern,
            qf.avg_execution_time_ms as baseline_avg_ms
        FROM query_monitor.query_fingerprints qf
        WHERE qf.last_seen < NOW() - INTERVAL '7 days'  -- Use older data as baseline
    ),
    current_performance AS (
        SELECT 
            qe.query_hash,
            AVG(qe.execution_time_ms) as current_avg_ms,
            COUNT(*) as execution_count
        FROM query_monitor.query_executions qe
        WHERE qe.timestamp > NOW() - (p_hours_back || ' hours')::INTERVAL
        GROUP BY qe.query_hash
        HAVING COUNT(*) >= 5  -- Minimum executions for reliable comparison
    )
    SELECT 
        bp.query_hash,
        bp.query_pattern,
        bp.baseline_avg_ms,
        cp.current_avg_ms,
        ((cp.current_avg_ms - bp.baseline_avg_ms) / bp.baseline_avg_ms * 100) as regression_pct,
        cp.execution_count,
        CASE 
            WHEN ((cp.current_avg_ms - bp.baseline_avg_ms) / bp.baseline_avg_ms * 100) > 100 THEN 'critical'
            WHEN ((cp.current_avg_ms - bp.baseline_avg_ms) / bp.baseline_avg_ms * 100) > 50 THEN 'high'
            WHEN ((cp.current_avg_ms - bp.baseline_avg_ms) / bp.baseline_avg_ms * 100) > 25 THEN 'medium'
            ELSE 'low'
        END as severity
    FROM baseline_performance bp
    JOIN current_performance cp ON bp.query_hash = cp.query_hash
    WHERE ((cp.current_avg_ms - bp.baseline_avg_ms) / bp.baseline_avg_ms * 100) > 25  -- 25% regression threshold
    ORDER BY regression_pct DESC;
END;
$$ LANGUAGE plpgsql;

-- Get top resource-consuming queries
CREATE OR REPLACE FUNCTION query_monitor.get_top_resource_queries(
    p_hours_back INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    query_hash TEXT,
    query_pattern TEXT,
    total_execution_time_ms NUMERIC,
    avg_execution_time_ms NUMERIC,
    execution_count BIGINT,
    total_io_bytes BIGINT,
    cpu_efficiency_pct NUMERIC,
    optimization_priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qe.query_hash,
        qf.query_pattern,
        SUM(qe.execution_time_ms) as total_execution_time_ms,
        AVG(qe.execution_time_ms) as avg_execution_time_ms,
        COUNT(*) as execution_count,
        SUM(
            (qe.shared_blks_read + qe.local_blks_read + qe.temp_blks_read) * 8192 +
            (qe.shared_blks_written + qe.local_blks_written + qe.temp_blks_written) * 8192
        ) as total_io_bytes,
        CASE 
            WHEN AVG(qe.execution_time_ms) > 0 
            THEN (AVG(qe.cpu_time_ms) / AVG(qe.execution_time_ms)) * 100
            ELSE 0 
        END as cpu_efficiency_pct,
        CASE 
            WHEN SUM(qe.execution_time_ms) > 60000 THEN 'critical'  -- More than 1 minute total
            WHEN SUM(qe.execution_time_ms) > 30000 THEN 'high'      -- More than 30 seconds total
            WHEN AVG(qe.execution_time_ms) > 2000 THEN 'medium'     -- Average > 2 seconds
            ELSE 'low'
        END as optimization_priority
    FROM query_monitor.query_executions qe
    JOIN query_monitor.query_fingerprints qf ON qe.query_hash = qf.query_hash
    WHERE qe.timestamp > NOW() - (p_hours_back || ' hours')::INTERVAL
    GROUP BY qe.query_hash, qf.query_pattern
    ORDER BY total_execution_time_ms DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Generate query optimization report
CREATE OR REPLACE FUNCTION query_monitor.generate_optimization_report()
RETURNS TABLE (
    section TEXT,
    metric TEXT,
    value TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Query Performance Summary' as section,
        'Total Tracked Queries' as metric,
        COUNT(*)::TEXT as value,
        'Monitor high-frequency queries for optimization opportunities' as recommendation
    FROM query_monitor.query_fingerprints
    
    UNION ALL
    
    SELECT 
        'Query Performance Summary' as section,
        'Slow Queries (>2s avg)' as metric,
        COUNT(*)::TEXT as value,
        CASE 
            WHEN COUNT(*) > 10 THEN 'Critical: Many slow queries detected - immediate optimization needed'
            WHEN COUNT(*) > 5 THEN 'Warning: Several slow queries - review and optimize'
            ELSE 'Good: Few slow queries detected'
        END as recommendation
    FROM query_monitor.query_fingerprints
    WHERE avg_execution_time_ms > 2000
    
    UNION ALL
    
    SELECT 
        'Optimization Status' as section,
        'Pending Recommendations' as metric,
        COUNT(*)::TEXT as value,
        'Review and implement optimization recommendations' as recommendation
    FROM query_monitor.optimization_recommendations
    WHERE implemented = false
    
    UNION ALL
    
    SELECT 
        'Optimization Status' as section,
        'Critical Priority Items' as metric,
        COUNT(*)::TEXT as value,
        CASE 
            WHEN COUNT(*) > 0 THEN 'Immediate attention required for critical performance issues'
            ELSE 'No critical optimization issues detected'
        END as recommendation
    FROM query_monitor.optimization_recommendations
    WHERE implemented = false AND priority = 'critical';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- AUTOMATED MONITORING PROCEDURES
-- ==============================================

-- Main query monitoring collection procedure
CREATE OR REPLACE FUNCTION query_monitor.collect_query_metrics()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT := '';
    fingerprint_result TEXT;
    recommendation_result TEXT;
BEGIN
    -- Update query fingerprints from pg_stat_statements
    SELECT query_monitor.update_query_fingerprints() INTO fingerprint_result;
    result_text := result_text || fingerprint_result || '. ';
    
    -- Generate new optimization recommendations
    SELECT query_monitor.generate_optimization_recommendations() INTO recommendation_result;
    result_text := result_text || recommendation_result || '. ';
    
    -- Check for performance regressions
    IF EXISTS (
        SELECT 1 FROM query_monitor.detect_performance_regressions(24) 
        WHERE severity IN ('critical', 'high')
    ) THEN
        result_text := result_text || 'Performance regressions detected - review required. ';
    END IF;
    
    RETURN 'Query monitoring completed: ' || result_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PERMISSIONS AND CLEANUP
-- ==============================================

-- Grant permissions for query monitoring
GRANT USAGE ON SCHEMA query_monitor TO cryb_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA query_monitor TO cryb_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA query_monitor TO cryb_user;

-- Set up retention policy for query executions
SELECT add_retention_policy('query_monitor.query_executions', INTERVAL '30 days');

-- Create indexes for query monitoring performance
CREATE INDEX IF NOT EXISTS idx_query_executions_hash_time ON query_monitor.query_executions (query_hash, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_query_executions_slow ON query_monitor.query_executions (timestamp DESC, execution_time_ms DESC) WHERE execution_time_ms > 1000;
CREATE INDEX IF NOT EXISTS idx_query_fingerprints_performance ON query_monitor.query_fingerprints (avg_execution_time_ms DESC, total_execution_count DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_recommendations_priority ON query_monitor.optimization_recommendations (priority, implemented, created_at DESC);

-- Initial data collection
SELECT query_monitor.collect_query_metrics();

\echo 'Query performance monitoring system created successfully!';
\echo '';
\echo 'Available query monitoring functions:';
\echo '- query_monitor.collect_query_metrics() - Collect and analyze query performance';
\echo '- query_monitor.generate_optimization_recommendations(query_hash) - Generate optimization suggestions';
\echo '- query_monitor.detect_performance_regressions(hours_back) - Detect query performance degradation';
\echo '- query_monitor.get_top_resource_queries(hours_back, limit) - Find most resource-intensive queries';
\echo '- query_monitor.generate_optimization_report() - Generate comprehensive optimization report';
\echo '';
\echo 'Setup automatic collection with:';
\echo 'SELECT cron.schedule(''query-metrics'', ''*/10 * * * *'', ''SELECT query_monitor.collect_query_metrics();'');';
\echo '';
\echo 'View optimization opportunities with:';
\echo 'SELECT * FROM query_monitor.generate_optimization_report();';
\echo 'SELECT * FROM query_monitor.optimization_recommendations WHERE implemented = false ORDER BY priority;';