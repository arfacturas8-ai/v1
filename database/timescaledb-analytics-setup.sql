-- CRYB Platform TimescaleDB Analytics Setup
-- Time-series analytics for user behavior, platform metrics, and real-time monitoring
-- Author: Database Infrastructure Team
-- Version: 1.0
-- Target: TimescaleDB 2.11+ on PostgreSQL 15+

-- ==========================================
-- TIMESCALEDB INITIALIZATION
-- ==========================================

-- Ensure TimescaleDB extension is enabled
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Tune TimescaleDB settings for analytics workload
ALTER SYSTEM SET timescaledb.max_background_workers = 16;
ALTER SYSTEM SET timescaledb.telemetry_level = 'off';
ALTER SYSTEM SET max_worker_processes = 32;
SELECT pg_reload_conf();

-- ==========================================
-- USER ACTIVITY ANALYTICS
-- ==========================================

-- User activity tracking with automatic partitioning
CREATE TABLE user_activity_events (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL,
    session_id UUID,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Geographic data
    country_code CHAR(2),
    region_code TEXT,
    city TEXT,
    timezone TEXT,
    
    -- Device information
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Performance metrics
    page_load_time INTEGER, -- milliseconds
    response_time INTEGER,   -- milliseconds
    
    -- Additional tracking
    ab_test_group TEXT,
    feature_flags TEXT[],
    
    -- Indexes for fast queries
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'page_view', 'click', 'scroll', 'form_submit', 'search', 'post_create', 
        'comment_create', 'vote', 'share', 'follow', 'join_community', 
        'message_send', 'voice_join', 'video_join', 'file_upload', 'login', 
        'logout', 'signup', 'password_change', 'profile_update'
    )),
    CONSTRAINT valid_category CHECK (event_category IN (
        'navigation', 'engagement', 'content', 'social', 'communication', 
        'media', 'authentication', 'profile', 'monetization', 'admin'
    ))
);

-- Convert to hypertable with 1-hour chunks for high-volume analytics
SELECT create_hypertable('user_activity_events', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for efficient querying
CREATE INDEX CONCURRENTLY idx_user_activity_user_time ON user_activity_events (user_id, time DESC);
CREATE INDEX CONCURRENTLY idx_user_activity_event_type ON user_activity_events (event_type, time DESC);
CREATE INDEX CONCURRENTLY idx_user_activity_session ON user_activity_events (session_id, time DESC);
CREATE INDEX CONCURRENTLY idx_user_activity_country ON user_activity_events (country_code, time DESC);
CREATE INDEX CONCURRENTLY idx_user_activity_device ON user_activity_events (device_type, time DESC);

-- ==========================================
-- PLATFORM PERFORMANCE METRICS
-- ==========================================

-- Application performance metrics
CREATE TABLE platform_metrics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_name TEXT NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit TEXT DEFAULT 'count',
    
    -- Service information
    service_name TEXT NOT NULL,
    service_version TEXT,
    instance_id TEXT,
    
    -- Labels for grouping and filtering
    labels JSONB DEFAULT '{}',
    
    -- Additional context
    environment TEXT DEFAULT 'production',
    region TEXT,
    
    CONSTRAINT valid_metric_unit CHECK (metric_unit IN (
        'count', 'gauge', 'timer', 'histogram', 'bytes', 'percentage', 
        'rate', 'duration_ms', 'duration_s'
    ))
);

-- Convert to hypertable with 5-minute chunks for detailed monitoring
SELECT create_hypertable('platform_metrics', 'time', chunk_time_interval => INTERVAL '5 minutes');

-- Create indexes for metrics querying
CREATE INDEX CONCURRENTLY idx_platform_metrics_name_time ON platform_metrics (metric_name, time DESC);
CREATE INDEX CONCURRENTLY idx_platform_metrics_service ON platform_metrics (service_name, metric_name, time DESC);
CREATE INDEX CONCURRENTLY idx_platform_metrics_labels ON platform_metrics USING GIN (labels);

-- ==========================================
-- CONTENT PERFORMANCE ANALYTICS
-- ==========================================

-- Post engagement tracking over time
CREATE TABLE post_analytics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    post_id UUID NOT NULL,
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Engagement metrics snapshots
    view_count BIGINT DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- Calculated metrics
    engagement_rate DOUBLE PRECISION DEFAULT 0,
    virality_score DOUBLE PRECISION DEFAULT 0,
    controversy_score DOUBLE PRECISION DEFAULT 0,
    
    -- Time-based metrics
    time_to_first_comment INTEGER, -- minutes
    time_to_first_share INTEGER,   -- minutes
    
    -- Trending indicators
    velocity_score DOUBLE PRECISION DEFAULT 0, -- Rate of change
    momentum_score DOUBLE PRECISION DEFAULT 0, -- Acceleration
    
    PRIMARY KEY (time, post_id)
);

-- Convert to hypertable with 1-hour chunks
SELECT create_hypertable('post_analytics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for content analytics
CREATE INDEX CONCURRENTLY idx_post_analytics_post ON post_analytics (post_id, time DESC);
CREATE INDEX CONCURRENTLY idx_post_analytics_community ON post_analytics (community_id, time DESC);
CREATE INDEX CONCURRENTLY idx_post_analytics_engagement ON post_analytics (engagement_rate DESC, time DESC);

-- ==========================================
-- REAL-TIME SYSTEM METRICS
-- ==========================================

-- WebSocket connection metrics
CREATE TABLE websocket_metrics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    connection_id UUID,
    user_id UUID,
    server_id UUID,
    channel_id UUID,
    
    -- Connection lifecycle events
    event_type TEXT NOT NULL CHECK (event_type IN (
        'connect', 'disconnect', 'message_send', 'message_receive', 
        'join_room', 'leave_room', 'ping', 'pong', 'error'
    )),
    
    -- Performance metrics
    latency_ms INTEGER,
    message_size_bytes INTEGER,
    
    -- Error tracking
    error_code TEXT,
    error_message TEXT,
    
    -- Connection metadata
    transport_type TEXT DEFAULT 'websocket', -- websocket, polling
    client_version TEXT,
    
    PRIMARY KEY (time, connection_id)
);

-- Convert to hypertable with 15-minute chunks for real-time monitoring
SELECT create_hypertable('websocket_metrics', 'time', chunk_time_interval => INTERVAL '15 minutes');

-- Create indexes for real-time monitoring
CREATE INDEX CONCURRENTLY idx_websocket_metrics_user ON websocket_metrics (user_id, time DESC);
CREATE INDEX CONCURRENTLY idx_websocket_metrics_server ON websocket_metrics (server_id, time DESC);
CREATE INDEX CONCURRENTLY idx_websocket_metrics_event ON websocket_metrics (event_type, time DESC);

-- ==========================================
-- VOICE/VIDEO ANALYTICS
-- ==========================================

-- Voice and video session analytics
CREATE TABLE voice_video_analytics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL,
    server_id UUID,
    channel_id UUID,
    
    -- Session details
    session_type TEXT NOT NULL CHECK (session_type IN ('voice', 'video', 'screen_share')),
    session_duration INTEGER, -- seconds
    
    -- Quality metrics
    audio_quality_score DOUBLE PRECISION,
    video_quality_score DOUBLE PRECISION,
    connection_quality TEXT,
    packet_loss_percentage DOUBLE PRECISION,
    jitter_ms DOUBLE PRECISION,
    latency_ms INTEGER,
    
    -- Bandwidth usage
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    peak_bandwidth_mbps DOUBLE PRECISION,
    
    -- Participant metrics
    participant_count INTEGER DEFAULT 1,
    max_participants INTEGER DEFAULT 1,
    
    -- Technical details
    codec_used TEXT,
    resolution TEXT,
    frame_rate INTEGER,
    
    PRIMARY KEY (time, session_id)
);

-- Convert to hypertable with 30-minute chunks
SELECT create_hypertable('voice_video_analytics', 'time', chunk_time_interval => INTERVAL '30 minutes');

-- Create indexes for voice/video analytics
CREATE INDEX CONCURRENTLY idx_voice_video_user ON voice_video_analytics (user_id, time DESC);
CREATE INDEX CONCURRENTLY idx_voice_video_server ON voice_video_analytics (server_id, time DESC);
CREATE INDEX CONCURRENTLY idx_voice_video_quality ON voice_video_analytics (connection_quality, time DESC);

-- ==========================================
-- BUSINESS INTELLIGENCE METRICS
-- ==========================================

-- Revenue and monetization tracking
CREATE TABLE revenue_analytics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_id UUID,
    user_id UUID,
    
    -- Transaction details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'subscription', 'tip', 'nft_purchase', 'nft_sale', 'boost_purchase', 
        'premium_upgrade', 'server_boost', 'custom_emoji', 'ad_revenue'
    )),
    
    -- Financial data
    amount_usd DECIMAL(10,2) NOT NULL,
    amount_crypto DECIMAL(18,8),
    currency_type TEXT,
    
    -- Fee structure
    platform_fee_usd DECIMAL(10,2) DEFAULT 0,
    payment_processor_fee_usd DECIMAL(10,2) DEFAULT 0,
    net_revenue_usd DECIMAL(10,2),
    
    -- Geographic and user segmentation
    country_code CHAR(2),
    user_segment TEXT, -- 'new', 'returning', 'power_user', 'whale'
    
    -- Attribution
    referral_source TEXT,
    marketing_campaign TEXT,
    
    PRIMARY KEY (time, transaction_id)
);

-- Convert to hypertable with 1-day chunks for financial data
SELECT create_hypertable('revenue_analytics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes for revenue analytics
CREATE INDEX CONCURRENTLY idx_revenue_user ON revenue_analytics (user_id, time DESC);
CREATE INDEX CONCURRENTLY idx_revenue_type ON revenue_analytics (transaction_type, time DESC);
CREATE INDEX CONCURRENTLY idx_revenue_country ON revenue_analytics (country_code, time DESC);

-- ==========================================
-- MODERATION AND SAFETY ANALYTICS
-- ==========================================

-- Content moderation events
CREATE TABLE moderation_analytics (
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'media')),
    
    -- Moderation action
    action_type TEXT NOT NULL CHECK (action_type IN (
        'flagged', 'reviewed', 'approved', 'removed', 'banned', 'warned', 
        'auto_flagged', 'ai_reviewed', 'human_reviewed'
    )),
    
    -- Actor information
    moderator_id UUID,
    moderator_type TEXT CHECK (moderator_type IN ('human', 'ai', 'system')),
    
    -- Moderation details
    violation_type TEXT,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5),
    confidence_score DOUBLE PRECISION,
    
    -- AI moderation specifics
    ai_model_version TEXT,
    ai_flags JSONB DEFAULT '{}',
    
    -- Community context
    community_id UUID,
    reporter_id UUID,
    
    PRIMARY KEY (time, content_id, action_type)
);

-- Convert to hypertable with 2-hour chunks for moderation tracking
SELECT create_hypertable('moderation_analytics', 'time', chunk_time_interval => INTERVAL '2 hours');

-- Create indexes for moderation analytics
CREATE INDEX CONCURRENTLY idx_moderation_content ON moderation_analytics (content_id, time DESC);
CREATE INDEX CONCURRENTLY idx_moderation_action ON moderation_analytics (action_type, time DESC);
CREATE INDEX CONCURRENTLY idx_moderation_community ON moderation_analytics (community_id, time DESC);

-- ==========================================
-- REAL-TIME AGGREGATION VIEWS
-- ==========================================

-- Real-time user engagement continuous aggregate (15-minute buckets)
CREATE MATERIALIZED VIEW user_engagement_15min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('15 minutes', time) AS bucket,
    user_id,
    event_category,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as session_count,
    AVG(page_load_time) as avg_page_load_time
FROM user_activity_events
GROUP BY bucket, user_id, event_category
WITH NO DATA;

-- Add refresh policy for continuous aggregates
SELECT add_continuous_aggregate_policy('user_engagement_15min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes');

-- Platform performance continuous aggregate (5-minute buckets)
CREATE MATERIALIZED VIEW platform_performance_5min
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('5 minutes', time) AS bucket,
    service_name,
    metric_name,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value,
    COUNT(*) as sample_count
FROM platform_metrics
GROUP BY bucket, service_name, metric_name
WITH NO DATA;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('platform_performance_5min',
    start_offset => INTERVAL '30 minutes',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');

-- Content virality continuous aggregate (1-hour buckets)
CREATE MATERIALIZED VIEW content_virality_1hour
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS bucket,
    community_id,
    COUNT(*) as post_count,
    AVG(engagement_rate) as avg_engagement_rate,
    AVG(virality_score) as avg_virality_score,
    MAX(virality_score) as max_virality_score
FROM post_analytics
GROUP BY bucket, community_id
WITH NO DATA;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('content_virality_1hour',
    start_offset => INTERVAL '2 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- ==========================================
-- ADVANCED ANALYTICS FUNCTIONS
-- ==========================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(
    p_user_id UUID,
    p_timeframe INTERVAL DEFAULT INTERVAL '7 days'
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    engagement_score DOUBLE PRECISION := 0;
    activity_score DOUBLE PRECISION;
    content_score DOUBLE PRECISION;
    social_score DOUBLE PRECISION;
BEGIN
    -- Calculate activity score (30% weight)
    SELECT COALESCE(LOG(COUNT(*) + 1) * 10, 0) INTO activity_score
    FROM user_activity_events 
    WHERE user_id = p_user_id 
        AND time > NOW() - p_timeframe;
    
    -- Calculate content creation score (40% weight)
    WITH content_metrics AS (
        SELECT 
            COALESCE(SUM(upvote_count - downvote_count), 0) as net_votes,
            COALESCE(SUM(comment_count), 0) as total_comments
        FROM posts p
        WHERE p.user_id = p_user_id 
            AND p.created_at > NOW() - p_timeframe
    )
    SELECT COALESCE(LOG(net_votes + total_comments + 1) * 15, 0) INTO content_score
    FROM content_metrics;
    
    -- Calculate social interaction score (30% weight)
    SELECT COALESCE(LOG(COUNT(*) + 1) * 8, 0) INTO social_score
    FROM user_activity_events 
    WHERE user_id = p_user_id 
        AND time > NOW() - p_timeframe
        AND event_type IN ('comment_create', 'vote', 'share', 'follow');
    
    -- Combine scores with weights
    engagement_score := (activity_score * 0.3) + (content_score * 0.4) + (social_score * 0.3);
    
    RETURN LEAST(engagement_score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Function to detect trending content
CREATE OR REPLACE FUNCTION detect_trending_content(
    p_hours INTEGER DEFAULT 2
) RETURNS TABLE(
    post_id UUID,
    velocity_score DOUBLE PRECISION,
    current_engagement DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_activity AS (
        SELECT 
            pa.post_id,
            FIRST_VALUE(pa.engagement_rate) OVER (
                PARTITION BY pa.post_id 
                ORDER BY pa.time DESC
            ) as current_rate,
            FIRST_VALUE(pa.engagement_rate) OVER (
                PARTITION BY pa.post_id 
                ORDER BY pa.time ASC
            ) as initial_rate,
            COUNT(*) OVER (PARTITION BY pa.post_id) as data_points
        FROM post_analytics pa
        WHERE pa.time > NOW() - (p_hours || ' hours')::INTERVAL
    )
    SELECT DISTINCT
        ra.post_id,
        CASE 
            WHEN ra.initial_rate > 0 THEN 
                ((ra.current_rate - ra.initial_rate) / ra.initial_rate) * 100
            ELSE ra.current_rate * 100
        END as velocity_score,
        ra.current_rate as current_engagement
    FROM recent_activity ra
    WHERE ra.data_points >= 3
        AND ra.current_rate > ra.initial_rate
    ORDER BY velocity_score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DATA RETENTION POLICIES
-- ==========================================

-- Retention policy for user activity events (keep 90 days)
SELECT add_retention_policy('user_activity_events', INTERVAL '90 days');

-- Retention policy for platform metrics (keep 30 days for raw data)
SELECT add_retention_policy('platform_metrics', INTERVAL '30 days');

-- Retention policy for websocket metrics (keep 7 days)
SELECT add_retention_policy('websocket_metrics', INTERVAL '7 days');

-- Retention policy for voice/video analytics (keep 60 days)
SELECT add_retention_policy('voice_video_analytics', INTERVAL '60 days');

-- Keep revenue and moderation analytics longer for compliance
-- Revenue analytics: 7 years
SELECT add_retention_policy('revenue_analytics', INTERVAL '7 years');

-- Moderation analytics: 2 years
SELECT add_retention_policy('moderation_analytics', INTERVAL '2 years');

-- ==========================================
-- COMPRESSION POLICIES
-- ==========================================

-- Enable compression on older data to save storage
SELECT add_compression_policy('user_activity_events', INTERVAL '7 days');
SELECT add_compression_policy('platform_metrics', INTERVAL '1 day');
SELECT add_compression_policy('websocket_metrics', INTERVAL '1 day');
SELECT add_compression_policy('post_analytics', INTERVAL '7 days');
SELECT add_compression_policy('voice_video_analytics', INTERVAL '7 days');

-- ==========================================
-- MONITORING AND ALERTING VIEWS
-- ==========================================

-- View for monitoring system health
CREATE VIEW system_health_dashboard AS
SELECT 
    'platform_metrics' as metric_source,
    service_name,
    metric_name,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    COUNT(*) as sample_count
FROM platform_metrics 
WHERE time > NOW() - INTERVAL '5 minutes'
GROUP BY service_name, metric_name

UNION ALL

SELECT 
    'user_activity' as metric_source,
    'user_engagement' as service_name,
    event_type as metric_name,
    COUNT(*)::DOUBLE PRECISION as avg_value,
    COUNT(*)::DOUBLE PRECISION as max_value,
    COUNT(*) as sample_count
FROM user_activity_events 
WHERE time > NOW() - INTERVAL '5 minutes'
GROUP BY event_type;

-- View for real-time error monitoring
CREATE VIEW error_monitoring AS
SELECT 
    time_bucket('1 minute', time) AS minute,
    COUNT(*) as error_count,
    COUNT(DISTINCT user_id) as affected_users
FROM websocket_metrics 
WHERE event_type = 'error' 
    AND time > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- ==========================================
-- BACKGROUND JOBS AND MAINTENANCE
-- ==========================================

-- Function to update post analytics (call every 15 minutes)
CREATE OR REPLACE FUNCTION update_post_analytics()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO post_analytics (
        time, post_id, community_id, user_id,
        view_count, upvote_count, downvote_count, comment_count,
        engagement_rate, velocity_score
    )
    SELECT 
        NOW(),
        p.id,
        p.community_id,
        p.user_id,
        COALESCE(p.view_count, 0),
        COALESCE(p.upvote_count, 0),
        COALESCE(p.downvote_count, 0),
        COALESCE(p.comment_count, 0),
        -- Calculate engagement rate
        CASE 
            WHEN p.view_count > 0 THEN 
                (p.upvote_count + p.downvote_count + p.comment_count)::DOUBLE PRECISION / p.view_count
            ELSE 0
        END as engagement_rate,
        -- Calculate velocity (simplified)
        CASE 
            WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN
                (p.upvote_count + p.comment_count)::DOUBLE PRECISION / 
                GREATEST(EXTRACT(EPOCH FROM NOW() - p.created_at) / 3600, 1)
            ELSE 0
        END as velocity_score
    FROM posts p
    WHERE p.created_at > NOW() - INTERVAL '48 hours'
        AND p.is_published = TRUE
        AND p.is_removed = FALSE;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

-- Grant permissions to application user
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO cryb_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryb_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryb_app;

-- Grant permissions to analytics/reporting user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cryb_analytics;
GRANT EXECUTE ON FUNCTION calculate_user_engagement_score TO cryb_analytics;
GRANT EXECUTE ON FUNCTION detect_trending_content TO cryb_analytics;

-- ==========================================
-- COMPLETED: TimescaleDB Analytics Setup
-- ==========================================

-- This setup provides:
-- 1. High-performance time-series tables with automatic partitioning
-- 2. Real-time user behavior tracking and analytics
-- 3. Platform performance monitoring with alerting
-- 4. Content engagement and virality detection
-- 5. Voice/video session quality analytics
-- 6. Revenue and business intelligence tracking
-- 7. Moderation and safety event monitoring
-- 8. Continuous aggregates for real-time dashboards
-- 9. Advanced analytics functions for insights
-- 10. Automated data retention and compression policies

COMMENT ON SCHEMA public IS 'CRYB Platform - TimescaleDB Analytics for Reddit/Discord scale monitoring and insights';