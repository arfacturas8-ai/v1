-- TimescaleDB Setup for CRYB Platform Analytics
-- This script sets up TimescaleDB extension and creates hypertables for time-series data

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create hypertables for analytics tables
-- These tables are optimized for time-series data with automatic partitioning

-- Message Analytics Hypertable
-- Partitioned by time with 1-day intervals for optimal query performance
SELECT create_hypertable(
    '"MessageAnalytics"', 
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Add compression policy for older data (compress data older than 7 days)
SELECT add_compression_policy(
    '"MessageAnalytics"', 
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Voice Analytics Hypertable
-- Partitioned by time with 1-day intervals
SELECT create_hypertable(
    '"VoiceAnalytics"', 
    'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Add compression policy for voice analytics (compress data older than 7 days)
SELECT add_compression_policy(
    '"VoiceAnalytics"', 
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Server Analytics Hypertable
-- Partitioned by time with 1-hour intervals for detailed server metrics
SELECT create_hypertable(
    '"ServerAnalytics"', 
    'timestamp',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Add compression policy for server analytics (compress data older than 3 days)
SELECT add_compression_policy(
    '"ServerAnalytics"', 
    INTERVAL '3 days',
    if_not_exists => TRUE
);

-- Create additional analytics tables for real-time metrics

-- Real-time user activity tracking
CREATE TABLE IF NOT EXISTS user_activity_metrics (
    user_id TEXT NOT NULL,
    server_id TEXT,
    activity_type TEXT NOT NULL,
    duration_seconds INTEGER,
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hypertable for user activity metrics
SELECT create_hypertable(
    'user_activity_metrics', 
    'timestamp',
    chunk_time_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- Channel activity metrics for trending analysis
CREATE TABLE IF NOT EXISTS channel_activity_metrics (
    channel_id TEXT NOT NULL,
    server_id TEXT,
    message_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    voice_minutes INTEGER DEFAULT 0,
    peak_concurrent_users INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hypertable for channel metrics
SELECT create_hypertable(
    'channel_activity_metrics', 
    'timestamp',
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    tags JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create hypertable for system metrics
SELECT create_hypertable(
    'system_metrics', 
    'timestamp',
    chunk_time_interval => INTERVAL '15 minutes',
    if_not_exists => TRUE
);

-- Create retention policies to automatically drop old data

-- Drop message analytics older than 90 days
SELECT add_retention_policy(
    '"MessageAnalytics"',
    INTERVAL '90 days',
    if_not_exists => TRUE
);

-- Drop voice analytics older than 60 days
SELECT add_retention_policy(
    '"VoiceAnalytics"',
    INTERVAL '60 days',
    if_not_exists => TRUE
);

-- Drop server analytics older than 30 days
SELECT add_retention_policy(
    '"ServerAnalytics"',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- Drop user activity metrics older than 30 days
SELECT add_retention_policy(
    'user_activity_metrics',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- Drop channel metrics older than 60 days
SELECT add_retention_policy(
    'channel_activity_metrics',
    INTERVAL '60 days',
    if_not_exists => TRUE
);

-- Drop system metrics older than 14 days
SELECT add_retention_policy(
    'system_metrics',
    INTERVAL '14 days',
    if_not_exists => TRUE
);

-- Create indexes for better query performance

-- Indexes for message analytics
CREATE INDEX IF NOT EXISTS idx_message_analytics_server_time 
ON "MessageAnalytics" (server_id, timestamp DESC) WHERE server_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_analytics_channel_time 
ON "MessageAnalytics" (channel_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_message_analytics_user_time 
ON "MessageAnalytics" (user_id, timestamp DESC);

-- Indexes for voice analytics
CREATE INDEX IF NOT EXISTS idx_voice_analytics_server_time 
ON "VoiceAnalytics" (server_id, timestamp DESC) WHERE server_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voice_analytics_channel_time 
ON "VoiceAnalytics" (channel_id, timestamp DESC);

-- Indexes for server analytics
CREATE INDEX IF NOT EXISTS idx_server_analytics_server_time 
ON "ServerAnalytics" (server_id, timestamp DESC);

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

-- Create materialized views for common analytics queries

-- Hourly server activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_server_activity AS
SELECT 
    server_id,
    date_trunc('hour', timestamp) as hour,
    SUM(message_count) as total_messages,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(member_count) as avg_members,
    MAX(online_count) as peak_online
FROM "ServerAnalytics"
WHERE server_id IS NOT NULL
GROUP BY server_id, date_trunc('hour', timestamp);

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

-- Create continuous aggregates for real-time dashboards

-- 5-minute server metrics aggregate
SELECT add_continuous_aggregate_policy('hourly_server_activity',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

-- Refresh materialized views every hour
SELECT add_refresh_continuous_aggregate_policy('hourly_server_activity',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Create functions for analytics queries

-- Function to get server activity trends
CREATE OR REPLACE FUNCTION get_server_activity_trend(
    p_server_id TEXT,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    hour TIMESTAMPTZ,
    messages BIGINT,
    users INTEGER,
    online INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('hour', sa.timestamp) as hour,
        SUM(sa.message_count) as messages,
        MAX(sa.member_count) as users,
        MAX(sa.online_count) as online
    FROM "ServerAnalytics" sa
    WHERE sa.server_id = p_server_id
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
        ma.channel_id,
        SUM(ma.message_count) as message_count,
        COUNT(DISTINCT ma.user_id) as unique_users
    FROM "MessageAnalytics" ma
    WHERE (p_server_id IS NULL OR ma.server_id = p_server_id)
        AND ma.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY ma.channel_id
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
        SUM(ma.message_count) as messages,
        COALESCE(va.voice_minutes, 0) as voice_minutes,
        COUNT(DISTINCT ma.server_id) as servers_active
    FROM "MessageAnalytics" ma
    LEFT JOIN (
        SELECT 
            timestamp::DATE as day,
            SUM(session_duration) / 60 as voice_minutes
        FROM "VoiceAnalytics"
        WHERE user_id = p_user_id
            AND timestamp >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY timestamp::DATE
    ) va ON ma.timestamp::DATE = va.day
    WHERE ma.user_id = p_user_id
        AND ma.timestamp >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY ma.timestamp::DATE, va.voice_minutes
    ORDER BY day;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO CURRENT_USER;

-- Create alerts for unusual activity patterns
-- (These would be implemented with external monitoring tools like Grafana alerts)

COMMENT ON EXTENSION timescaledb IS 'TimescaleDB extension for time-series analytics in CRYB platform';
COMMENT ON TABLE user_activity_metrics IS 'Real-time user activity tracking for analytics';
COMMENT ON TABLE channel_activity_metrics IS 'Channel-level activity metrics for trending analysis';
COMMENT ON TABLE system_metrics IS 'System performance and health metrics';