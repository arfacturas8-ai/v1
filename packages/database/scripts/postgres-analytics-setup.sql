-- PostgreSQL Analytics Setup for CRYB Platform
-- Standard PostgreSQL tables optimized for analytics without TimescaleDB

-- Create additional analytics tables for real-time metrics

-- Real-time user activity tracking
CREATE TABLE IF NOT EXISTS user_activity_metrics (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    server_id TEXT,
    activity_type TEXT NOT NULL,
    duration_seconds INTEGER,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Channel activity metrics for trending analysis  
CREATE TABLE IF NOT EXISTS channel_activity_metrics (
    id SERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL,
    server_id TEXT,
    message_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    voice_minutes INTEGER DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    tags JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics tables using correct column names

-- Indexes for message analytics (using Prisma column names)
CREATE INDEX IF NOT EXISTS idx_message_analytics_server_time 
ON "MessageAnalytics" ("serverId", timestamp DESC) WHERE "serverId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_analytics_channel_time 
ON "MessageAnalytics" ("channelId", timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_message_analytics_user_time 
ON "MessageAnalytics" ("userId", timestamp DESC);

-- Indexes for voice analytics (using Prisma column names)
CREATE INDEX IF NOT EXISTS idx_voice_analytics_server_time 
ON "VoiceAnalytics" ("serverId", timestamp DESC) WHERE "serverId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_analytics_channel_time 
ON "VoiceAnalytics" ("channelId", timestamp DESC);

-- Indexes for server analytics (using Prisma column names)
CREATE INDEX IF NOT EXISTS idx_server_analytics_server_time 
ON "ServerAnalytics" ("serverId", timestamp DESC);

-- Indexes for user activity metrics
CREATE INDEX IF NOT EXISTS idx_user_activity_user_time 
ON user_activity_metrics (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_type_time 
ON user_activity_metrics (activity_type, timestamp DESC);

-- Indexes for channel activity metrics  
CREATE INDEX IF NOT EXISTS idx_channel_activity_channel_time 
ON channel_activity_metrics (channel_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_channel_activity_server_time 
ON channel_activity_metrics (server_id, timestamp DESC) WHERE server_id IS NOT NULL;

-- Indexes for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time 
ON system_metrics (metric_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_tags 
ON system_metrics USING GIN (tags);

-- Time-based partitioning indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_analytics_timestamp_month
ON "MessageAnalytics" (date_trunc('month', timestamp), "serverId");

CREATE INDEX IF NOT EXISTS idx_voice_analytics_timestamp_month
ON "VoiceAnalytics" (date_trunc('month', timestamp), "serverId");

CREATE INDEX IF NOT EXISTS idx_server_analytics_timestamp_day
ON "ServerAnalytics" (date_trunc('day', timestamp), "serverId");

-- Create materialized views for common analytics queries

-- Hourly server activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_server_activity AS
SELECT 
    "serverId" as server_id,
    date_trunc('hour', timestamp) as hour,
    SUM("messageCount") as total_messages,
    AVG("memberCount") as avg_members,
    MAX("onlineCount") as peak_online
FROM "ServerAnalytics"
WHERE "serverId" IS NOT NULL
GROUP BY "serverId", date_trunc('hour', timestamp);

-- Daily user activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_user_activity AS
SELECT 
    user_id,
    date_trunc('day', timestamp) as day,
    COUNT(*) as activity_count,
    SUM(duration_seconds) as total_duration,
    COUNT(DISTINCT activity_type) as unique_activities
FROM user_activity_metrics
GROUP BY user_id, date_trunc('day', timestamp);

-- Daily channel activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_channel_activity AS
SELECT 
    "channelId" as channel_id,
    "serverId" as server_id,
    date_trunc('day', timestamp) as day,
    SUM("messageCount") as total_messages,
    COUNT(DISTINCT "userId") as unique_users
FROM "MessageAnalytics"
WHERE "channelId" IS NOT NULL
GROUP BY "channelId", "serverId", date_trunc('day', timestamp);

-- Create indexes on materialized views
CREATE INDEX IF NOT EXISTS idx_hourly_server_activity_server_hour
ON hourly_server_activity (server_id, hour DESC);

CREATE INDEX IF NOT EXISTS idx_daily_user_activity_user_day
ON daily_user_activity (user_id, day DESC);

CREATE INDEX IF NOT EXISTS idx_daily_channel_activity_channel_day
ON daily_channel_activity (channel_id, day DESC);

-- Create functions for analytics queries using correct Prisma column names

-- Function to get server activity trends
CREATE OR REPLACE FUNCTION get_server_activity_trend(
    p_server_id TEXT,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    hour TIMESTAMPTZ,
    messages BIGINT,
    members INTEGER,
    online INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('hour', sa.timestamp) as hour,
        SUM(sa."messageCount") as messages,
        MAX(sa."memberCount") as members,
        MAX(sa."onlineCount") as online
    FROM "ServerAnalytics" sa
    WHERE sa."serverId" = p_server_id
        AND sa.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY date_trunc('hour', sa.timestamp)
    ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- Function to get most active channels
CREATE OR REPLACE FUNCTION get_most_active_channels(
    p_server_id TEXT DEFAULT NULL,
    p_hours INTEGER DEFAULT 24,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    channel_id TEXT,
    message_count BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma."channelId",
        SUM(ma."messageCount") as message_count,
        COUNT(DISTINCT ma."userId") as unique_users
    FROM "MessageAnalytics" ma
    WHERE (p_server_id IS NULL OR ma."serverId" = p_server_id)
        AND ma.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY ma."channelId"
    ORDER BY message_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(
    p_user_id TEXT,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    day DATE,
    messages BIGINT,
    voice_minutes INTEGER,
    servers_active BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.timestamp::DATE as day,
        SUM(ma."messageCount") as messages,
        COALESCE(va.voice_minutes, 0) as voice_minutes,
        COUNT(DISTINCT ma."serverId") as servers_active
    FROM "MessageAnalytics" ma
    LEFT JOIN (
        SELECT 
            timestamp::DATE as day,
            SUM("sessionDuration") / 60 as voice_minutes
        FROM "VoiceAnalytics"
        WHERE "userId" = p_user_id
            AND timestamp >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY timestamp::DATE
    ) va ON ma.timestamp::DATE = va.day
    WHERE ma."userId" = p_user_id
        AND ma.timestamp >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY ma.timestamp::DATE, va.voice_minutes
    ORDER BY day;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW hourly_server_activity;
    REFRESH MATERIALIZED VIEW daily_user_activity;
    REFRESH MATERIALIZED VIEW daily_channel_activity;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup function for old data (run as scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Delete message analytics older than 90 days
    DELETE FROM "MessageAnalytics" WHERE timestamp < NOW() - INTERVAL '90 days';
    
    -- Delete voice analytics older than 60 days
    DELETE FROM "VoiceAnalytics" WHERE timestamp < NOW() - INTERVAL '60 days';
    
    -- Delete server analytics older than 30 days
    DELETE FROM "ServerAnalytics" WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete user activity metrics older than 30 days
    DELETE FROM user_activity_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete channel metrics older than 60 days
    DELETE FROM channel_activity_metrics WHERE timestamp < NOW() - INTERVAL '60 days';
    
    -- Delete system metrics older than 14 days
    DELETE FROM system_metrics WHERE timestamp < NOW() - INTERVAL '14 days';
    
    -- Vacuum tables to reclaim space
    VACUUM ANALYZE "MessageAnalytics";
    VACUUM ANALYZE "VoiceAnalytics";  
    VACUUM ANALYZE "ServerAnalytics";
    VACUUM ANALYZE user_activity_metrics;
    VACUUM ANALYZE channel_activity_metrics;
    VACUUM ANALYZE system_metrics;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO CURRENT_USER;

COMMENT ON TABLE user_activity_metrics IS 'Real-time user activity tracking for analytics';
COMMENT ON TABLE channel_activity_metrics IS 'Channel-level activity metrics for trending analysis';
COMMENT ON TABLE system_metrics IS 'System performance and health metrics';
COMMENT ON MATERIALIZED VIEW hourly_server_activity IS 'Hourly aggregated server activity data';
COMMENT ON MATERIALIZED VIEW daily_user_activity IS 'Daily aggregated user activity data';
COMMENT ON MATERIALIZED VIEW daily_channel_activity IS 'Daily aggregated channel activity data';