-- CRYB PLATFORM TIMESCALEDB COMPLETE SETUP
-- Comprehensive TimescaleDB configuration for high-performance time-series analytics
-- Optimized for social platform analytics and real-time monitoring

\echo 'Starting comprehensive TimescaleDB setup...';

-- ==============================================
-- PREREQUISITES CHECK
-- ==============================================

-- Check if TimescaleDB is installed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        RAISE EXCEPTION 'TimescaleDB extension not found. Please install TimescaleDB first.';
    END IF;
    RAISE NOTICE 'TimescaleDB extension found and loaded.';
END $$;

-- ==============================================
-- TIMESCALEDB CONFIGURATION
-- ==============================================

-- Configure TimescaleDB settings for optimal performance
ALTER SYSTEM SET timescaledb.max_background_workers = 16;           -- Increased for better parallel processing
ALTER SYSTEM SET timescaledb.telemetry_level = off;                 -- Disable telemetry for privacy
ALTER SYSTEM SET timescaledb.restoring = off;                       -- Ensure not in restore mode

-- Configure TimescaleDB runtime settings
SET timescaledb.enable_optimizations = on;
SET timescaledb.enable_chunk_skipping = on;
SET timescaledb.enable_constraint_aware_append = on;
SET timescaledb.enable_ordered_append = on;
SET timescaledb.enable_chunk_append = on;
SET timescaledb.enable_parallel_aggregation = on;
SET timescaledb.enable_runtime_exclusion = on;
SET timescaledb.enable_transparent_decompression = on;

-- ==============================================
-- ENHANCED HYPERTABLE CREATION FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION create_optimized_hypertable(
    table_name_param TEXT,
    time_column_param TEXT DEFAULT 'timestamp',
    chunk_interval_param INTERVAL DEFAULT INTERVAL '1 day',
    partition_column_param TEXT DEFAULT NULL,
    partition_number INTEGER DEFAULT NULL,
    compress_after_param INTERVAL DEFAULT INTERVAL '7 days',
    drop_after_param INTERVAL DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    full_table_name TEXT;
    compression_config TEXT;
BEGIN
    full_table_name := 'public.' || table_name_param;
    
    -- Check if table exists and is not already a hypertable
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = table_name_param AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping hypertable creation', table_name_param;
        RETURN;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = table_name_param AND hypertable_schema = 'public'
    ) THEN
        RAISE NOTICE 'Table % is already a hypertable, skipping creation', table_name_param;
        RETURN;
    END IF;

    -- Create hypertable with optional partitioning
    IF partition_column_param IS NOT NULL AND partition_number IS NOT NULL THEN
        PERFORM create_hypertable(
            full_table_name, 
            time_column_param,
            partitioning_column => partition_column_param,
            number_partitions => partition_number,
            chunk_time_interval => chunk_interval_param,
            create_default_indexes => TRUE,
            if_not_exists => TRUE
        );
        RAISE NOTICE 'Created partitioned hypertable % with partition column %', table_name_param, partition_column_param;
    ELSE
        PERFORM create_hypertable(
            full_table_name, 
            time_column_param,
            chunk_time_interval => chunk_interval_param,
            create_default_indexes => TRUE,
            if_not_exists => TRUE
        );
        RAISE NOTICE 'Created hypertable %', table_name_param;
    END IF;

    -- Configure compression based on table type
    compression_config := CASE table_name_param
        WHEN 'MessageAnalytics' THEN 'timescaledb.compress_segmentby = ''serverId,channelId'''
        WHEN 'VoiceAnalytics' THEN 'timescaledb.compress_segmentby = ''serverId,channelId'''
        WHEN 'ServerAnalytics' THEN 'timescaledb.compress_segmentby = ''serverId'''
        WHEN 'FileAccessLog' THEN 'timescaledb.compress_segmentby = ''fileId'''
        WHEN 'SecurityLog' THEN 'timescaledb.compress_segmentby = ''userId,ipAddress'''
        ELSE 'timescaledb.compress_segmentby = ''id'''
    END;

    -- Enable compression with optimized settings
    EXECUTE format('ALTER TABLE %I SET (timescaledb.compress, timescaledb.compress_orderby = %L, %s)',
        table_name_param, 
        time_column_param || ' DESC',
        compression_config
    );

    -- Add compression policy
    PERFORM add_compression_policy(full_table_name, compress_after_param);
    RAISE NOTICE 'Added compression policy for % (compress after %)', table_name_param, compress_after_param;

    -- Add retention policy if specified
    IF drop_after_param IS NOT NULL THEN
        PERFORM add_retention_policy(full_table_name, drop_after_param);
        RAISE NOTICE 'Added retention policy for % (drop after %)', table_name_param, drop_after_param;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating hypertable for %: %', table_name_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CREATE HYPERTABLES FOR ANALYTICS
-- ==============================================

-- Convert existing analytics tables to hypertables
SELECT create_optimized_hypertable(
    'MessageAnalytics', 
    'timestamp', 
    INTERVAL '6 hours',  -- Smaller chunks for high-frequency data
    'serverId',          -- Partition by server for better performance
    4,                   -- 4 partitions for load distribution
    INTERVAL '3 days',   -- Compress after 3 days
    INTERVAL '90 days'   -- Retain for 90 days
);

SELECT create_optimized_hypertable(
    'VoiceAnalytics', 
    'timestamp', 
    INTERVAL '1 day',
    'serverId',
    4,
    INTERVAL '7 days',
    INTERVAL '180 days'  -- Longer retention for voice analytics
);

SELECT create_optimized_hypertable(
    'ServerAnalytics', 
    'timestamp', 
    INTERVAL '1 day',
    NULL,                -- No partitioning for server analytics
    NULL,
    INTERVAL '30 days',  -- Compress after 30 days
    INTERVAL '2 years'   -- Long-term retention for server metrics
);

-- Create hypertables for file and security analytics
SELECT create_optimized_hypertable(
    'FileAccessLog', 
    'accessedAt', 
    INTERVAL '1 day',
    NULL,
    NULL,
    INTERVAL '7 days',
    INTERVAL '1 year'
);

SELECT create_optimized_hypertable(
    'SecurityLog', 
    'createdAt', 
    INTERVAL '1 day',
    NULL,
    NULL,
    INTERVAL '14 days',
    INTERVAL '2 years'   -- Long retention for security compliance
);

-- ==============================================
-- ADVANCED CONTINUOUS AGGREGATES
-- ==============================================

-- Enhanced hourly message analytics with advanced metrics
DROP MATERIALIZED VIEW IF EXISTS cagg_hourly_message_analytics CASCADE;
CREATE MATERIALIZED VIEW cagg_hourly_message_analytics
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', timestamp) as hour_bucket,
    "serverId",
    "channelId",
    -- Basic counts
    SUM("messageCount") as total_messages,
    SUM("characterCount") as total_characters,
    SUM("attachmentCount") as total_attachments,
    SUM("mentionCount") as total_mentions,
    SUM("reactionCount") as total_reactions,
    
    -- Advanced metrics
    COUNT(DISTINCT "userId") as unique_users,
    AVG("characterCount"::FLOAT / NULLIF("messageCount", 0)) as avg_message_length,
    AVG("messageCount") as avg_messages_per_entry,
    
    -- Peak activity detection
    MAX("messageCount") as peak_messages_in_period,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "messageCount") as messages_95th_percentile,
    
    -- User engagement patterns
    COUNT(*) as data_points,
    STDDEV("messageCount") as message_count_stddev
FROM "MessageAnalytics"
WHERE timestamp >= NOW() - INTERVAL '90 days'  -- Only aggregate recent data
GROUP BY hour_bucket, "serverId", "channelId";

-- Daily server activity aggregation with trend analysis
DROP MATERIALIZED VIEW IF EXISTS cagg_daily_server_analytics CASCADE;
CREATE MATERIALIZED VIEW cagg_daily_server_analytics
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', timestamp) as day_bucket,
    "serverId",
    
    -- Member metrics
    AVG("memberCount") as avg_member_count,
    MIN("memberCount") as min_member_count,
    MAX("memberCount") as max_member_count,
    
    -- Activity metrics
    AVG("onlineCount") as avg_online_count,
    MAX("onlineCount") as peak_online_count,
    SUM("messageCount") as total_daily_messages,
    SUM("voiceMinutes") as total_voice_minutes,
    
    -- Engagement ratios
    AVG("onlineCount"::FLOAT / NULLIF("memberCount", 0)) as avg_online_ratio,
    AVG("messageCount"::FLOAT / NULLIF("memberCount", 0)) as messages_per_member,
    
    -- Data quality
    COUNT(*) as measurement_count
FROM "ServerAnalytics"
WHERE timestamp >= NOW() - INTERVAL '2 years'
GROUP BY day_bucket, "serverId";

-- Weekly user engagement trends
DROP MATERIALIZED VIEW IF EXISTS cagg_weekly_voice_analytics CASCADE;
CREATE MATERIALIZED VIEW cagg_weekly_voice_analytics
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 week', timestamp) as week_bucket,
    "serverId",
    "channelId",
    
    -- Voice activity metrics
    COUNT(DISTINCT "userId") as unique_voice_users,
    SUM("sessionDuration") as total_voice_minutes,
    AVG("sessionDuration") as avg_session_duration,
    MAX("sessionDuration") as max_session_duration,
    
    -- Session patterns
    COUNT(*) as total_sessions,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "sessionDuration") as median_session_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "sessionDuration") as session_duration_95th
FROM "VoiceAnalytics"
WHERE timestamp >= NOW() - INTERVAL '1 year'
GROUP BY week_bucket, "serverId", "channelId";

-- ==============================================
-- REFRESH POLICIES FOR CONTINUOUS AGGREGATES
-- ==============================================

-- Configure automatic refresh policies with optimized intervals
SELECT add_continuous_aggregate_policy('cagg_hourly_message_analytics',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '30 minutes',
    schedule_interval => INTERVAL '15 minutes'
);

SELECT add_continuous_aggregate_policy('cagg_daily_server_analytics',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '2 hours',
    schedule_interval => INTERVAL '1 hour'
);

SELECT add_continuous_aggregate_policy('cagg_weekly_voice_analytics',
    start_offset => INTERVAL '1 week',
    end_offset => INTERVAL '6 hours',
    schedule_interval => INTERVAL '4 hours'
);

-- ==============================================
-- REAL-TIME ANALYTICS FUNCTIONS
-- ==============================================

-- Get real-time server activity with TimescaleDB optimizations
CREATE OR REPLACE FUNCTION get_server_realtime_analytics(
    p_server_id TEXT,
    p_time_window INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
    time_bucket TIMESTAMPTZ,
    message_count BIGINT,
    unique_users BIGINT,
    voice_minutes BIGINT,
    peak_online_users INTEGER,
    activity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH message_activity AS (
        SELECT 
            time_bucket('1 hour', timestamp) as bucket,
            SUM("messageCount") as messages,
            COUNT(DISTINCT "userId") as users
        FROM "MessageAnalytics"
        WHERE "serverId" = p_server_id
        AND timestamp >= NOW() - p_time_window
        GROUP BY bucket
    ),
    voice_activity AS (
        SELECT 
            time_bucket('1 hour', timestamp) as bucket,
            SUM("sessionDuration") as voice_mins
        FROM "VoiceAnalytics"
        WHERE "serverId" = p_server_id
        AND timestamp >= NOW() - p_time_window
        GROUP BY bucket
    ),
    server_metrics AS (
        SELECT 
            time_bucket('1 hour', timestamp) as bucket,
            MAX("onlineCount") as peak_online
        FROM "ServerAnalytics"
        WHERE "serverId" = p_server_id
        AND timestamp >= NOW() - p_time_window
        GROUP BY bucket
    )
    SELECT 
        COALESCE(ma.bucket, va.bucket, sm.bucket) as time_bucket,
        COALESCE(ma.messages, 0) as message_count,
        COALESCE(ma.users, 0) as unique_users,
        COALESCE(va.voice_mins, 0) as voice_minutes,
        COALESCE(sm.peak_online, 0) as peak_online_users,
        -- Activity score calculation
        (
            COALESCE(ma.messages, 0) * 0.001 +
            COALESCE(ma.users, 0) * 0.1 +
            COALESCE(va.voice_mins, 0) * 0.01 +
            COALESCE(sm.peak_online, 0) * 0.05
        ) as activity_score
    FROM message_activity ma
    FULL OUTER JOIN voice_activity va ON ma.bucket = va.bucket
    FULL OUTER JOIN server_metrics sm ON COALESCE(ma.bucket, va.bucket) = sm.bucket
    ORDER BY time_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- Get trending content with time-series analytics
CREATE OR REPLACE FUNCTION get_trending_analysis(
    p_community_id TEXT DEFAULT NULL,
    p_time_window INTERVAL DEFAULT INTERVAL '24 hours',
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    content_id TEXT,
    content_type TEXT,
    trend_score NUMERIC,
    velocity_score NUMERIC,
    engagement_rate NUMERIC,
    time_series_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH time_buckets AS (
        SELECT generate_series(
            date_trunc('hour', NOW() - p_time_window),
            date_trunc('hour', NOW()),
            '1 hour'::interval
        ) as bucket
    ),
    post_activity AS (
        SELECT 
            p."id" as content_id,
            'post' as content_type,
            p."communityId",
            p."createdAt",
            p.score,
            p."viewCount",
            p."commentCount"
        FROM "Post" p
        WHERE (p_community_id IS NULL OR p."communityId" = p_community_id)
        AND p."createdAt" >= NOW() - p_time_window
        AND p."isRemoved" = false
    ),
    engagement_time_series AS (
        SELECT 
            pa.content_id,
            pa.content_type,
            jsonb_agg(
                jsonb_build_object(
                    'time', tb.bucket,
                    'score', COALESCE(pa.score, 0),
                    'views', COALESCE(pa."viewCount", 0),
                    'comments', COALESCE(pa."commentCount", 0)
                ) ORDER BY tb.bucket
            ) as time_data
        FROM post_activity pa
        CROSS JOIN time_buckets tb
        GROUP BY pa.content_id, pa.content_type
    )
    SELECT 
        pa.content_id,
        pa.content_type,
        -- Trend score based on recency and engagement
        (
            pa.score * 0.4 +
            pa."viewCount" * 0.001 +
            pa."commentCount" * 0.1 +
            EXTRACT(EPOCH FROM (p_time_window - (NOW() - pa."createdAt"))) / EXTRACT(EPOCH FROM p_time_window) * 50
        ) as trend_score,
        -- Velocity score (engagement rate over time)
        (
            (pa.score + pa."commentCount") / 
            GREATEST(1, EXTRACT(EPOCH FROM (NOW() - pa."createdAt")) / 3600)
        ) as velocity_score,
        -- Engagement rate
        (
            pa."commentCount"::NUMERIC / GREATEST(1, pa."viewCount") * 100
        ) as engagement_rate,
        ets.time_data as time_series_data
    FROM post_activity pa
    LEFT JOIN engagement_time_series ets ON pa.content_id = ets.content_id
    ORDER BY trend_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- MONITORING AND MAINTENANCE FUNCTIONS
-- ==============================================

-- Enhanced TimescaleDB status and performance monitoring
CREATE OR REPLACE FUNCTION get_timescaledb_health_status()
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT,
    status TEXT,
    recommendation TEXT
) AS $$
DECLARE
    total_chunks INTEGER;
    compressed_chunks INTEGER;
    compression_ratio NUMERIC;
    oldest_chunk_age INTERVAL;
BEGIN
    -- Get chunk statistics
    SELECT COUNT(*) INTO total_chunks FROM timescaledb_information.chunks;
    SELECT COUNT(*) INTO compressed_chunks FROM timescaledb_information.compressed_chunks;
    
    IF total_chunks > 0 THEN
        compression_ratio := compressed_chunks::NUMERIC / total_chunks * 100;
    ELSE
        compression_ratio := 0;
    END IF;
    
    -- Get oldest chunk age
    SELECT NOW() - MIN(range_start) INTO oldest_chunk_age
    FROM timescaledb_information.chunks;
    
    -- Return health metrics
    RETURN QUERY VALUES
        ('Total Chunks', total_chunks::TEXT, 
         CASE WHEN total_chunks < 1000 THEN 'GOOD' WHEN total_chunks < 5000 THEN 'WARNING' ELSE 'CRITICAL' END,
         CASE WHEN total_chunks >= 5000 THEN 'Consider increasing chunk intervals or adding retention policies' ELSE 'Chunk count is healthy' END),
        
        ('Compressed Chunks', compressed_chunks::TEXT, 
         CASE WHEN compression_ratio > 50 THEN 'GOOD' WHEN compression_ratio > 20 THEN 'WARNING' ELSE 'POOR' END,
         CASE WHEN compression_ratio < 20 THEN 'Review compression policies and settings' ELSE 'Compression is working well' END),
        
        ('Compression Ratio', ROUND(compression_ratio, 2)::TEXT || '%', 
         CASE WHEN compression_ratio > 50 THEN 'GOOD' WHEN compression_ratio > 20 THEN 'WARNING' ELSE 'POOR' END,
         'Target >50% compression ratio for optimal storage efficiency'),
        
        ('Oldest Data Age', oldest_chunk_age::TEXT,
         CASE WHEN oldest_chunk_age > INTERVAL '2 years' THEN 'WARNING' ELSE 'GOOD' END,
         CASE WHEN oldest_chunk_age > INTERVAL '2 years' THEN 'Consider retention policies for very old data' ELSE 'Data retention is reasonable' END);
END;
$$ LANGUAGE plpgsql;

-- Function to optimize TimescaleDB performance
CREATE OR REPLACE FUNCTION optimize_timescaledb_performance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    hypertable_name TEXT;
BEGIN
    result := 'TimescaleDB Optimization Results:' || E'\n';
    
    -- Analyze all hypertables
    FOR hypertable_name IN 
        SELECT ht.hypertable_name 
        FROM timescaledb_information.hypertables ht 
        WHERE ht.hypertable_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('ANALYZE %I', hypertable_name);
            result := result || '✓ Analyzed hypertable: ' || hypertable_name || E'\n';
        EXCEPTION
            WHEN OTHERS THEN
                result := result || '✗ Error analyzing ' || hypertable_name || ': ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Update TimescaleDB statistics
    PERFORM _timescaledb_internal.policy_job_stat_history_retention();
    result := result || '✓ Updated TimescaleDB internal statistics' || E'\n';
    
    -- Log compression statistics
    result := result || E'\n' || 'Compression Status:' || E'\n';
    FOR hypertable_name IN 
        SELECT cs.hypertable_name
        FROM timescaledb_information.compression_settings cs
    LOOP
        result := result || '• ' || hypertable_name || ': Compression enabled' || E'\n';
    END LOOP;
    
    result := result || E'\n' || 'Optimization completed at ' || NOW()::TEXT;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- GRANTS AND PERMISSIONS
-- ==============================================

-- Grant execute permissions on all TimescaleDB functions
GRANT EXECUTE ON FUNCTION get_server_realtime_analytics(TEXT, INTERVAL) TO cryb_user;
GRANT EXECUTE ON FUNCTION get_trending_analysis(TEXT, INTERVAL, INTEGER) TO cryb_user;
GRANT EXECUTE ON FUNCTION get_timescaledb_health_status() TO cryb_user;
GRANT EXECUTE ON FUNCTION optimize_timescaledb_performance() TO cryb_user;

-- Grant select permissions on continuous aggregates
GRANT SELECT ON cagg_hourly_message_analytics TO cryb_user;
GRANT SELECT ON cagg_daily_server_analytics TO cryb_user;
GRANT SELECT ON cagg_weekly_voice_analytics TO cryb_user;

-- ==============================================
-- INITIAL OPTIMIZATION
-- ==============================================

-- Run initial optimization
SELECT optimize_timescaledb_performance();

-- Update statistics for all tables
ANALYZE;

\echo 'TimescaleDB complete setup finished successfully!';
\echo '';
\echo 'Available functions:';
\echo '- get_server_realtime_analytics(server_id, time_window)';
\echo '- get_trending_analysis(community_id, time_window, limit)';
\echo '- get_timescaledb_health_status()';
\echo '- optimize_timescaledb_performance()';
\echo '';
\echo 'Available continuous aggregates:';
\echo '- cagg_hourly_message_analytics';
\echo '- cagg_daily_server_analytics';
\echo '- cagg_weekly_voice_analytics';
\echo '';
\echo 'Monitor health with: SELECT * FROM get_timescaledb_health_status();';