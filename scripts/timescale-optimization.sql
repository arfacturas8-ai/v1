-- TimescaleDB Optimization and Configuration Script
-- Optimizes database for CRYB Platform analytics and time-series data
-- Author: Database Administrator

\echo 'Starting TimescaleDB optimization...'

-- ========================================
-- TIMESCALEDB CONFIGURATION
-- ========================================

-- Configure TimescaleDB settings
ALTER SYSTEM SET timescaledb.max_background_workers = 8;
ALTER SYSTEM SET timescaledb.telemetry_level = off;

-- Enable TimescaleDB features
SET timescaledb.enable_optimizations = on;
SET timescaledb.enable_chunk_skipping = on;
SET timescaledb.enable_constraint_aware_append = on;
SET timescaledb.enable_ordered_append = on;
SET timescaledb.enable_chunk_append = on;

-- ========================================
-- POST-MIGRATION HYPERTABLE SETUP
-- ========================================

-- This script runs after Prisma migrations
-- Convert analytics tables to hypertables if they exist and aren't already converted

-- Function to safely create hypertables
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
        EXECUTE format('SELECT create_hypertable(%L, %L, chunk_time_interval => %L::INTERVAL)',
            'public.' || table_name_param, time_column_param, chunk_interval_param);
        RAISE NOTICE 'Created hypertable for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped hypertable creation for %: table does not exist or already is a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating hypertable for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Convert analytics tables to hypertables (if they exist after Prisma migration)
SELECT safe_create_hypertable('MessageAnalytics', 'timestamp', INTERVAL '1 day');
SELECT safe_create_hypertable('VoiceAnalytics', 'timestamp', INTERVAL '1 day');
SELECT safe_create_hypertable('ServerAnalytics', 'timestamp', INTERVAL '1 day');

-- ========================================
-- COMPRESSION POLICIES
-- ========================================

-- Function to safely add compression policy
CREATE OR REPLACE FUNCTION safe_add_compression_policy(
    table_name_param TEXT,
    compress_after_param INTERVAL DEFAULT INTERVAL '7 days'
) RETURNS VOID AS $$
BEGIN
    -- Check if table is a hypertable
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param
        AND hypertable_schema = 'public'
    ) THEN
        -- Enable compression
        EXECUTE format('ALTER TABLE %I SET (timescaledb.compress, timescaledb.compress_segmentby = %L)',
            table_name_param, 
            CASE 
                WHEN table_name_param = 'MessageAnalytics' THEN 'channelId'
                WHEN table_name_param = 'VoiceAnalytics' THEN 'channelId'
                WHEN table_name_param = 'ServerAnalytics' THEN 'serverId'
                ELSE 'id'
            END
        );
        
        -- Add compression policy
        EXECUTE format('SELECT add_compression_policy(%L, %L::INTERVAL)',
            'public.' || table_name_param, compress_after_param);
        
        RAISE NOTICE 'Added compression policy for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped compression policy for %: not a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding compression policy for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add compression policies
SELECT safe_add_compression_policy('MessageAnalytics', INTERVAL '7 days');
SELECT safe_add_compression_policy('VoiceAnalytics', INTERVAL '7 days');
SELECT safe_add_compression_policy('ServerAnalytics', INTERVAL '30 days');

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
        WHERE hypertable_name = table_name_param
        AND hypertable_schema = 'public'
    ) THEN
        -- Add retention policy
        EXECUTE format('SELECT add_retention_policy(%L, %L::INTERVAL)',
            'public.' || table_name_param, retain_for_param);
        
        RAISE NOTICE 'Added retention policy for table: %', table_name_param;
    ELSE
        RAISE NOTICE 'Skipped retention policy for %: not a hypertable', table_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding retention policy for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add retention policies
SELECT safe_add_retention_policy('MessageAnalytics', INTERVAL '90 days');
SELECT safe_add_retention_policy('VoiceAnalytics', INTERVAL '90 days');
SELECT safe_add_retention_policy('ServerAnalytics', INTERVAL '1 year');

-- ========================================
-- CONTINUOUS AGGREGATES
-- ========================================

-- Function to safely create continuous aggregate
CREATE OR REPLACE FUNCTION safe_create_continuous_aggregate(
    view_name_param TEXT,
    table_name_param TEXT,
    query_param TEXT
) RETURNS VOID AS $$
BEGIN
    -- Check if table is a hypertable and view doesn't exist
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param
        AND hypertable_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = view_name_param
        AND table_schema = 'public'
    ) THEN
        -- Create continuous aggregate
        EXECUTE format('CREATE MATERIALIZED VIEW %I WITH (timescaledb.continuous) AS %s',
            view_name_param, query_param);
        
        RAISE NOTICE 'Created continuous aggregate: %', view_name_param;
    ELSE
        RAISE NOTICE 'Skipped continuous aggregate %: base table not a hypertable or view already exists', view_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating continuous aggregate %: %', view_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Hourly message analytics aggregate
SELECT safe_create_continuous_aggregate(
    'hourly_message_analytics',
    'MessageAnalytics',
    'SELECT 
        time_bucket(''1 hour'', timestamp) as bucket,
        "serverId",
        "channelId",
        SUM("messageCount") as total_messages,
        SUM("characterCount") as total_characters,
        AVG("characterCount"::FLOAT / NULLIF("messageCount", 0)) as avg_message_length,
        COUNT(DISTINCT "userId") as unique_users
    FROM "MessageAnalytics"
    GROUP BY bucket, "serverId", "channelId"'
);

-- Daily server analytics aggregate
SELECT safe_create_continuous_aggregate(
    'daily_server_analytics',
    'ServerAnalytics',
    'SELECT 
        time_bucket(''1 day'', timestamp) as bucket,
        "serverId",
        AVG("memberCount") as avg_members,
        AVG("onlineCount") as avg_online,
        SUM("messageCount") as total_messages,
        SUM("voiceMinutes") as total_voice_minutes
    FROM "ServerAnalytics"
    GROUP BY bucket, "serverId"'
);

-- ========================================
-- REFRESH POLICIES FOR CONTINUOUS AGGREGATES
-- ========================================

-- Function to safely add refresh policy
CREATE OR REPLACE FUNCTION safe_add_refresh_policy(
    view_name_param TEXT,
    refresh_interval_param INTERVAL DEFAULT INTERVAL '1 hour'
) RETURNS VOID AS $$
BEGIN
    -- Check if continuous aggregate exists
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.continuous_aggregates
        WHERE view_name = view_name_param
        AND view_schema = 'public'
    ) THEN
        -- Add refresh policy
        EXECUTE format('SELECT add_continuous_aggregate_policy(%L, start_offset => NULL, end_offset => %L::INTERVAL, schedule_interval => %L::INTERVAL)',
            'public.' || view_name_param, INTERVAL '1 hour', refresh_interval_param);
        
        RAISE NOTICE 'Added refresh policy for continuous aggregate: %', view_name_param;
    ELSE
        RAISE NOTICE 'Skipped refresh policy for %: continuous aggregate does not exist', view_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding refresh policy for %: %', view_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add refresh policies
SELECT safe_add_refresh_policy('hourly_message_analytics', INTERVAL '15 minutes');
SELECT safe_add_refresh_policy('daily_server_analytics', INTERVAL '1 hour');

-- ========================================
-- OPTIMIZATION INDEXES
-- ========================================

-- Function to safely create index
CREATE OR REPLACE FUNCTION safe_create_index(
    index_name_param TEXT,
    table_name_param TEXT,
    index_definition_param TEXT
) RETURNS VOID AS $$
BEGIN
    -- Check if table exists and index doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = index_name_param
        AND schemaname = 'public'
    ) THEN
        EXECUTE format('CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %I %s',
            index_name_param, table_name_param, index_definition_param);
        
        RAISE NOTICE 'Created index: %', index_name_param;
    ELSE
        RAISE NOTICE 'Skipped index %: table does not exist or index already exists', index_name_param;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating index %: %', index_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add optimized indexes for analytics tables
SELECT safe_create_index('idx_message_analytics_server_time', 'MessageAnalytics', '("serverId", timestamp DESC)');
SELECT safe_create_index('idx_message_analytics_channel_time', 'MessageAnalytics', '("channelId", timestamp DESC)');
SELECT safe_create_index('idx_message_analytics_user_time', 'MessageAnalytics', '("userId", timestamp DESC)');

SELECT safe_create_index('idx_voice_analytics_server_time', 'VoiceAnalytics', '("serverId", timestamp DESC)');
SELECT safe_create_index('idx_voice_analytics_channel_time', 'VoiceAnalytics', '("channelId", timestamp DESC)');

SELECT safe_create_index('idx_server_analytics_time', 'ServerAnalytics', '("serverId", timestamp DESC)');

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- Create function to get TimescaleDB chunk information
CREATE OR REPLACE FUNCTION get_chunk_stats()
RETURNS TABLE(
    hypertable_name TEXT,
    chunk_schema TEXT,
    chunk_name TEXT,
    range_start TIMESTAMPTZ,
    range_end TIMESTAMPTZ,
    chunk_size TEXT,
    compressed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ht.hypertable_name::TEXT,
        c.chunk_schema::TEXT,
        c.chunk_name::TEXT,
        c.range_start,
        c.range_end,
        pg_size_pretty(pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name))) as chunk_size,
        COALESCE(comp.compressed_chunk_id IS NOT NULL, false) as compressed
    FROM timescaledb_information.chunks c
    JOIN timescaledb_information.hypertables ht ON c.hypertable_name = ht.hypertable_name
    LEFT JOIN timescaledb_information.compressed_chunks comp ON c.chunk_name = comp.chunk_name
    ORDER BY ht.hypertable_name, c.range_start DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get compression stats
CREATE OR REPLACE FUNCTION get_compression_stats()
RETURNS TABLE(
    hypertable_name TEXT,
    total_chunks BIGINT,
    compressed_chunks BIGINT,
    compression_ratio NUMERIC,
    uncompressed_size TEXT,
    compressed_size TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.hypertable_name::TEXT,
        cs.total_chunks,
        cs.number_compressed_chunks as compressed_chunks,
        ROUND(cs.uncompressed_total_size::NUMERIC / NULLIF(cs.compressed_total_size, 0), 2) as compression_ratio,
        pg_size_pretty(cs.uncompressed_total_size) as uncompressed_size,
        pg_size_pretty(cs.compressed_total_size) as compressed_size
    FROM timescaledb_information.compression_settings cs
    WHERE cs.compressed_total_size > 0;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MAINTENANCE PROCEDURES
-- ========================================

-- Function to manually refresh all continuous aggregates
CREATE OR REPLACE FUNCTION refresh_all_continuous_aggregates()
RETURNS TEXT AS $$
DECLARE
    agg_name TEXT;
    result TEXT := '';
BEGIN
    FOR agg_name IN 
        SELECT view_name 
        FROM timescaledb_information.continuous_aggregates 
        WHERE view_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('CALL refresh_continuous_aggregate(%L, NULL, NULL)', 'public.' || agg_name);
            result := result || 'Refreshed: ' || agg_name || E'\n';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || 'Error refreshing ' || agg_name || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze all hypertables
CREATE OR REPLACE FUNCTION analyze_hypertables()
RETURNS TEXT AS $$
DECLARE
    table_name TEXT;
    result TEXT := '';
BEGIN
    FOR table_name IN 
        SELECT hypertable_name 
        FROM timescaledb_information.hypertables 
        WHERE hypertable_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('ANALYZE %I', table_name);
            result := result || 'Analyzed: ' || table_name || E'\n';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || 'Error analyzing ' || table_name || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_chunk_stats() TO cryb_user;
GRANT EXECUTE ON FUNCTION get_compression_stats() TO cryb_user;
GRANT EXECUTE ON FUNCTION refresh_all_continuous_aggregates() TO cryb_user;
GRANT EXECUTE ON FUNCTION analyze_hypertables() TO cryb_user;

-- ========================================
-- FINAL STEPS
-- ========================================

-- Update table statistics
ANALYZE;

-- Log completion
\echo 'TimescaleDB optimization completed successfully!';
\echo 'Hypertables, compression, retention policies, and continuous aggregates configured.';
\echo 'Use SELECT * FROM get_chunk_stats(); to monitor chunk information.';
\echo 'Use SELECT * FROM get_compression_stats(); to monitor compression.';