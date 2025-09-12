-- Post-Migration TimescaleDB Setup
-- Run after Prisma migrations to convert analytics tables to hypertables
-- Author: Database Administrator

\echo 'Starting post-migration TimescaleDB setup...'

-- ========================================
-- CONVERT ANALYTICS TABLES TO HYPERTABLES
-- ========================================

-- Function to safely create hypertable with error handling
CREATE OR REPLACE FUNCTION safe_create_hypertable(
    table_name_param TEXT,
    time_column_param TEXT,
    chunk_interval_param INTERVAL DEFAULT INTERVAL '1 day'
) RETURNS VOID AS $$
BEGIN
    -- Check if table exists and is not already a hypertable
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param
        AND hypertable_schema = 'public'
    ) THEN
        -- Convert to hypertable
        PERFORM create_hypertable('public.' || table_name_param, time_column_param, 
                                chunk_time_interval => chunk_interval_param,
                                if_not_exists => TRUE);
        RAISE NOTICE 'Successfully created hypertable for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped hypertable creation for %: table does not exist or already is a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating hypertable for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Convert analytics tables to hypertables (these have timestamp columns)
SELECT safe_create_hypertable('MessageAnalytics', 'timestamp', INTERVAL '1 day');
SELECT safe_create_hypertable('VoiceAnalytics', 'timestamp', INTERVAL '1 day');  
SELECT safe_create_hypertable('ServerAnalytics', 'timestamp', INTERVAL '1 day');

-- ========================================
-- ADD OPTIMIZED INDEXES FOR ANALYTICS
-- ========================================

-- Function to safely create index with error handling
CREATE OR REPLACE FUNCTION safe_create_index(
    index_name_param TEXT,
    table_name_param TEXT,
    index_definition_param TEXT
) RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = index_name_param AND schemaname = 'public'
    ) THEN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %I %s',
            index_name_param, table_name_param, index_definition_param);
        RAISE NOTICE 'Successfully created index: %', index_name_param;
    ELSE
        RAISE NOTICE 'Skipped index creation for %: table does not exist or index already exists', index_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating index %: %', index_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add performance indexes for analytics tables
SELECT safe_create_index('idx_message_analytics_server_time', 'MessageAnalytics', '("serverId", timestamp DESC)');
SELECT safe_create_index('idx_message_analytics_channel_time', 'MessageAnalytics', '("channelId", timestamp DESC)');
SELECT safe_create_index('idx_message_analytics_user_time', 'MessageAnalytics', '("userId", timestamp DESC)');

SELECT safe_create_index('idx_voice_analytics_server_time', 'VoiceAnalytics', '("serverId", timestamp DESC)');
SELECT safe_create_index('idx_voice_analytics_channel_time', 'VoiceAnalytics', '("channelId", timestamp DESC)');
SELECT safe_create_index('idx_voice_analytics_user_time', 'VoiceAnalytics', '("userId", timestamp DESC)');

SELECT safe_create_index('idx_server_analytics_time', 'ServerAnalytics', '("serverId", timestamp DESC)');

-- ========================================
-- ADD ADDITIONAL PERFORMANCE INDEXES
-- ========================================

-- Message table indexes for better query performance
SELECT safe_create_index('idx_message_content_search', 'Message', 'USING gin(to_tsvector(''english'', content))');
SELECT safe_create_index('idx_message_channel_created', 'Message', '("channelId", "createdAt" DESC)');
SELECT safe_create_index('idx_message_user_created', 'Message', '("userId", "createdAt" DESC)');
SELECT safe_create_index('idx_message_thread_created', 'Message', '("threadId", "createdAt" DESC) WHERE "threadId" IS NOT NULL');

-- User activity indexes
SELECT safe_create_index('idx_user_last_seen', 'User', '("lastSeenAt" DESC NULLS LAST)');
SELECT safe_create_index('idx_user_created', 'User', '("createdAt" DESC)');
SELECT safe_create_index('idx_user_premium', 'User', '("premiumType") WHERE "premiumType" != ''NONE''');

-- Server member indexes
SELECT safe_create_index('idx_server_member_joined', 'ServerMember', '("serverId", "joinedAt" DESC)');
SELECT safe_create_index('idx_server_member_active', 'ServerMember', '("userId", "joinedAt" DESC) WHERE pending = false');

-- Post and comment indexes for Reddit functionality
SELECT safe_create_index('idx_post_community_score', 'Post', '("communityId", score DESC)');
SELECT safe_create_index('idx_post_community_created', 'Post', '("communityId", "createdAt" DESC)');
SELECT safe_create_index('idx_comment_post_score', 'Comment', '("postId", score DESC)');
SELECT safe_create_index('idx_comment_post_created', 'Comment', '("postId", "createdAt" DESC)');

-- Notification indexes
SELECT safe_create_index('idx_notification_user_unread', 'Notification', '("userId", "createdAt" DESC) WHERE "isRead" = false');
SELECT safe_create_index('idx_notification_user_created', 'Notification', '("userId", "createdAt" DESC)');

-- Voice state indexes
SELECT safe_create_index('idx_voice_state_channel', 'VoiceState', '("channelId", "connectedAt" DESC)');
SELECT safe_create_index('idx_voice_state_server', 'VoiceState', '("serverId", "connectedAt" DESC)');

-- ========================================
-- COMPRESSION POLICIES
-- ========================================

-- Function to safely add compression policy
CREATE OR REPLACE FUNCTION safe_add_compression_policy(
    table_name_param TEXT,
    compress_after_param INTERVAL DEFAULT INTERVAL '7 days',
    segment_by_param TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Check if table is a hypertable
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param AND hypertable_schema = 'public'
    ) THEN
        -- Enable compression with segmentation
        IF segment_by_param IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I SET (timescaledb.compress, timescaledb.compress_segmentby = %L)',
                table_name_param, segment_by_param);
        ELSE
            EXECUTE format('ALTER TABLE %I SET (timescaledb.compress)', table_name_param);
        END IF;
        
        -- Add compression policy
        PERFORM add_compression_policy('public.' || table_name_param, compress_after_param);
        
        RAISE NOTICE 'Successfully added compression policy for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped compression policy for %: not a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error adding compression policy for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add compression policies for analytics tables
SELECT safe_add_compression_policy('MessageAnalytics', INTERVAL '7 days', 'channelId');
SELECT safe_add_compression_policy('VoiceAnalytics', INTERVAL '7 days', 'channelId');
SELECT safe_add_compression_policy('ServerAnalytics', INTERVAL '30 days', 'serverId');

-- ========================================
-- RETENTION POLICIES
-- ========================================

-- Function to safely add retention policy
CREATE OR REPLACE FUNCTION safe_add_retention_policy(
    table_name_param TEXT,
    retain_for_param INTERVAL DEFAULT INTERVAL '90 days'
) RETURNS VOID AS $$
BEGIN
    -- Check if table is a hypertable
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param AND hypertable_schema = 'public'
    ) THEN
        -- Add retention policy
        PERFORM add_retention_policy('public.' || table_name_param, retain_for_param);
        RAISE NOTICE 'Successfully added retention policy for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped retention policy for %: not a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error adding retention policy for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add retention policies (keep data for different periods based on table importance)
SELECT safe_add_retention_policy('MessageAnalytics', INTERVAL '90 days');
SELECT safe_add_retention_policy('VoiceAnalytics', INTERVAL '90 days');  
SELECT safe_add_retention_policy('ServerAnalytics', INTERVAL '1 year');

-- ========================================
-- MAINTENANCE FUNCTIONS
-- ========================================

-- Function to get database health information
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS JSON AS $$
DECLARE
    result JSON;
    conn_count INTEGER;
    slow_query_count INTEGER;
    disk_usage BIGINT;
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Get connection count
    SELECT COUNT(*) INTO conn_count
    FROM pg_stat_activity 
    WHERE datname = current_database();
    
    -- Get slow query count (queries running > 30 seconds)
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_activity
    WHERE state = 'active' 
    AND query_start < (CURRENT_TIMESTAMP - INTERVAL '30 seconds')
    AND query NOT LIKE '%pg_stat_activity%';
    
    -- Get database size
    SELECT pg_database_size(current_database()) INTO disk_usage;
    
    -- Get table count
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- Get index count  
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    result := json_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'database_name', current_database(),
        'status', CASE 
            WHEN conn_count > 180 THEN 'warning_high_connections'
            WHEN slow_query_count > 5 THEN 'warning_slow_queries'
            ELSE 'healthy'
        END,
        'active_connections', conn_count,
        'max_connections', (SELECT setting FROM pg_settings WHERE name = 'max_connections'),
        'slow_queries', slow_query_count,
        'database_size_bytes', disk_usage,
        'database_size_mb', round(disk_usage / 1024.0 / 1024.0, 2),
        'table_count', table_count,
        'index_count', index_count,
        'timescaledb_version', (SELECT extversion FROM pg_extension WHERE extname = 'timescaledb')
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get TimescaleDB statistics
CREATE OR REPLACE FUNCTION get_timescaledb_stats()
RETURNS TABLE(
    hypertable_name TEXT,
    hypertable_size TEXT,
    chunk_count BIGINT,
    compressed_chunks BIGINT,
    compression_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.hypertable_name::TEXT,
        pg_size_pretty(h.total_size) as hypertable_size,
        h.num_chunks as chunk_count,
        COALESCE(cs.number_compressed_chunks, 0) as compressed_chunks,
        CASE 
            WHEN cs.uncompressed_total_size > 0 AND cs.compressed_total_size > 0
            THEN ROUND(cs.uncompressed_total_size::NUMERIC / cs.compressed_total_size, 2)
            ELSE NULL
        END as compression_ratio
    FROM timescaledb_information.hypertable_detailed_size h
    LEFT JOIN timescaledb_information.compression_settings cs 
        ON h.hypertable_name = cs.hypertable_name 
        AND h.hypertable_schema = cs.hypertable_schema
    WHERE h.hypertable_schema = 'public'
    ORDER BY h.total_size DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE MONITORING VIEWS
-- ========================================

-- Create view for slow queries monitoring
CREATE OR REPLACE VIEW slow_queries_monitor AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_exec_time > 100  -- Queries taking more than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Create view for connection monitoring
CREATE OR REPLACE VIEW connection_monitor AS
SELECT 
    datname as database,
    state,
    COUNT(*) as connection_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - query_start)))::INTEGER as avg_duration_seconds
FROM pg_stat_activity 
WHERE datname IS NOT NULL AND state IS NOT NULL
GROUP BY datname, state
ORDER BY connection_count DESC;

-- Create view for table sizes
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION safe_create_hypertable(TEXT, TEXT, INTERVAL) TO cryb_user;
GRANT EXECUTE ON FUNCTION safe_create_index(TEXT, TEXT, TEXT) TO cryb_user;  
GRANT EXECUTE ON FUNCTION safe_add_compression_policy(TEXT, INTERVAL, TEXT) TO cryb_user;
GRANT EXECUTE ON FUNCTION safe_add_retention_policy(TEXT, INTERVAL) TO cryb_user;
GRANT EXECUTE ON FUNCTION get_database_health() TO cryb_user;
GRANT EXECUTE ON FUNCTION get_timescaledb_stats() TO cryb_user;

-- Grant permissions on monitoring views
GRANT SELECT ON slow_queries_monitor TO cryb_user;
GRANT SELECT ON connection_monitor TO cryb_user;
GRANT SELECT ON table_sizes TO cryb_user;

-- ========================================
-- FINAL STEPS
-- ========================================

-- Update table statistics for better query planning
ANALYZE;

-- Enable query optimization
UPDATE pg_settings SET setting = 'on' WHERE name = 'enable_partitionwise_join';
UPDATE pg_settings SET setting = 'on' WHERE name = 'enable_partitionwise_aggregate';

\echo 'Post-migration TimescaleDB setup completed successfully!';
\echo '';
\echo 'Available monitoring functions:';
\echo '  - SELECT get_database_health();';
\echo '  - SELECT * FROM get_timescaledb_stats();';
\echo '  - SELECT * FROM slow_queries_monitor;';
\echo '  - SELECT * FROM connection_monitor;';
\echo '  - SELECT * FROM table_sizes;';
\echo '';
\echo 'TimescaleDB hypertables configured for analytics tables with compression and retention policies.';