-- ==============================================
-- CRYB PLATFORM TIMESCALEDB ANALYTICS VIEWS
-- ==============================================
-- Comprehensive time-series analytics views
-- for real-time and historical data analysis
-- ==============================================

-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ==============================================
-- USER ANALYTICS VIEWS
-- ==============================================

-- User activity aggregated by hour
CREATE OR REPLACE VIEW user_activity_hourly AS
SELECT 
    time_bucket('1 hour', "lastSeenAt") AS hour,
    COUNT(DISTINCT id) as active_users,
    COUNT(DISTINCT CASE WHEN "createdAt" >= NOW() - INTERVAL '24 hours' THEN id END) as new_users_24h,
    COUNT(DISTINCT CASE WHEN "premiumType" != 'NONE' THEN id END) as premium_users,
    AVG(EXTRACT(EPOCH FROM (NOW() - "lastSeenAt"))/3600) as avg_hours_since_active
FROM "User" 
WHERE "lastSeenAt" IS NOT NULL 
    AND "lastSeenAt" >= NOW() - INTERVAL '30 days'
GROUP BY hour
ORDER BY hour DESC;

-- User engagement metrics by day
CREATE OR REPLACE VIEW user_engagement_daily AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    user_id,
    COUNT(*) as total_activities,
    COUNT(DISTINCT CASE WHEN type = 'PLAYING' THEN id END) as gaming_activities,
    COUNT(DISTINCT CASE WHEN type = 'LISTENING' THEN id END) as listening_activities,
    COUNT(DISTINCT CASE WHEN type = 'WATCHING' THEN id END) as watching_activities,
    MAX("createdAt") as last_activity
FROM "UserActivity"
WHERE "createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY day, user_id
ORDER BY day DESC, total_activities DESC;

-- User retention cohort analysis
CREATE OR REPLACE VIEW user_retention_cohorts AS
WITH user_cohorts AS (
    SELECT 
        id as user_id,
        DATE_TRUNC('month', "createdAt") as cohort_month,
        "createdAt" as registration_date
    FROM "User"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
),
user_activities AS (
    SELECT 
        uc.user_id,
        uc.cohort_month,
        DATE_TRUNC('month', u."lastSeenAt") as activity_month,
        EXTRACT(EPOCH FROM (DATE_TRUNC('month', u."lastSeenAt") - uc.cohort_month))/2629746 as months_since_registration
    FROM user_cohorts uc
    JOIN "User" u ON u.id = uc.user_id
    WHERE u."lastSeenAt" IS NOT NULL
)
SELECT 
    cohort_month,
    months_since_registration,
    COUNT(DISTINCT user_id) as active_users,
    LAG(COUNT(DISTINCT user_id)) OVER (PARTITION BY cohort_month ORDER BY months_since_registration) as previous_month_active,
    ROUND(
        COUNT(DISTINCT user_id)::DECIMAL / 
        FIRST_VALUE(COUNT(DISTINCT user_id)) OVER (PARTITION BY cohort_month ORDER BY months_since_registration)::DECIMAL * 100, 
        2
    ) as retention_rate
FROM user_activities
GROUP BY cohort_month, months_since_registration
ORDER BY cohort_month DESC, months_since_registration;

-- ==============================================
-- CONTENT ANALYTICS VIEWS
-- ==============================================

-- Post and comment metrics by hour
CREATE OR REPLACE VIEW content_metrics_hourly AS
SELECT 
    time_bucket('1 hour', "createdAt") AS hour,
    COUNT(*) as total_posts,
    COUNT(DISTINCT "userId") as unique_authors,
    COUNT(DISTINCT "communityId") as active_communities,
    AVG("score") as avg_score,
    AVG("viewCount") as avg_views,
    AVG("commentCount") as avg_comments,
    COUNT(CASE WHEN "nsfw" = true THEN 1 END) as nsfw_posts,
    COUNT(CASE WHEN "isPinned" = true THEN 1 END) as pinned_posts
FROM "Post" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;

-- Community growth and engagement
CREATE OR REPLACE VIEW community_analytics_daily AS
SELECT 
    DATE_TRUNC('day', p."createdAt") as day,
    c.id as community_id,
    c.name as community_name,
    COUNT(p.id) as daily_posts,
    COUNT(DISTINCT p."userId") as unique_posters,
    SUM(p."viewCount") as total_views,
    SUM(p."commentCount") as total_comments,
    AVG(p."score") as avg_post_score,
    COUNT(CASE WHEN p."nsfw" = true THEN 1 END) as nsfw_content_count
FROM "Community" c
LEFT JOIN "Post" p ON p."communityId" = c.id 
    AND p."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY day, c.id, c.name
ORDER BY day DESC, daily_posts DESC;

-- Top trending content
CREATE OR REPLACE VIEW trending_content_hourly AS
SELECT 
    time_bucket('1 hour', "createdAt") AS hour,
    id as post_id,
    title,
    "communityId",
    "userId",
    score,
    "viewCount",
    "commentCount",
    ROUND(
        (score + "viewCount" * 0.1 + "commentCount" * 2) / 
        GREATEST(EXTRACT(EPOCH FROM (NOW() - "createdAt"))/3600, 1), 2
    ) as trending_score
FROM "Post" 
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
    AND "isRemoved" = false
ORDER BY hour DESC, trending_score DESC
LIMIT 100;

-- ==============================================
-- COMMUNICATION ANALYTICS VIEWS
-- ==============================================

-- Message volume and patterns
CREATE OR REPLACE VIEW message_analytics_hourly AS
SELECT 
    time_bucket('1 hour', m."createdAt") AS hour,
    c."type" as channel_type,
    c."serverId",
    COUNT(m.id) as message_count,
    COUNT(DISTINCT m."userId") as unique_senders,
    AVG(LENGTH(m.content)) as avg_message_length,
    COUNT(CASE WHEN m."mentionEveryone" = true THEN 1 END) as mention_everyone_count,
    COUNT(CASE WHEN m.mentions IS NOT NULL AND jsonb_array_length(m.mentions::jsonb) > 0 THEN 1 END) as messages_with_mentions
FROM "Message" m
JOIN "Channel" c ON c.id = m."channelId"
WHERE m."createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY hour, c."type", c."serverId"
ORDER BY hour DESC, message_count DESC;

-- Voice call analytics
CREATE OR REPLACE VIEW voice_analytics_daily AS
SELECT 
    DATE_TRUNC('day', "connectedAt") as day,
    "serverId",
    "channelId",
    COUNT(*) as total_connections,
    COUNT(DISTINCT "userId") as unique_users,
    AVG(EXTRACT(EPOCH FROM ("updatedAt" - "connectedAt"))/60) as avg_duration_minutes,
    COUNT(CASE WHEN "selfMute" = true THEN 1 END) as muted_connections,
    COUNT(CASE WHEN "selfDeaf" = true THEN 1 END) as deafened_connections,
    COUNT(CASE WHEN "selfVideo" = true THEN 1 END) as video_connections
FROM "VoiceState" 
WHERE "connectedAt" >= NOW() - INTERVAL '30 days'
GROUP BY day, "serverId", "channelId"
ORDER BY day DESC, total_connections DESC;

-- ==============================================
-- BUSINESS ANALYTICS VIEWS
-- ==============================================

-- Revenue analytics from crypto tips
CREATE OR REPLACE VIEW revenue_analytics_daily AS
SELECT 
    DATE_TRUNC('day', "createdAt") as day,
    currency,
    COUNT(*) as tip_count,
    SUM(CAST("amount" as DECIMAL)) as total_amount,
    AVG(CAST("amount" as DECIMAL)) as avg_tip_amount,
    SUM(CASE WHEN "usdAmount" IS NOT NULL THEN CAST("usdAmount" as DECIMAL) ELSE 0 END) as total_usd_value,
    COUNT(DISTINCT "senderId") as unique_senders,
    COUNT(DISTINCT "recipientId") as unique_recipients
FROM "CryptoTip" 
WHERE "createdAt" >= NOW() - INTERVAL '90 days'
    AND status = 'COMPLETED'
GROUP BY day, currency
ORDER BY day DESC, total_usd_value DESC;

-- NFT marketplace analytics
CREATE OR REPLACE VIEW nft_analytics_daily AS
SELECT 
    DATE_TRUNC('day', ms."createdAt") as day,
    nc.name as collection_name,
    nc.symbol as collection_symbol,
    COUNT(ms.id) as sales_count,
    SUM(CAST(ms."salePrice" as DECIMAL)) as total_volume,
    AVG(CAST(ms."salePrice" as DECIMAL)) as avg_sale_price,
    COUNT(DISTINCT ms."buyerId") as unique_buyers,
    COUNT(DISTINCT ms."sellerId") as unique_sellers
FROM "MarketplaceSale" ms
JOIN "MarketplaceListing" ml ON ml.id = ms."listingId"
JOIN "NFTCollection" nc ON nc.id = ml."collectionId"
WHERE ms."createdAt" >= NOW() - INTERVAL '90 days'
    AND ms.status = 'COMPLETED'
GROUP BY day, nc.name, nc.symbol
ORDER BY day DESC, total_volume DESC;

-- ==============================================
-- SYSTEM PERFORMANCE VIEWS
-- ==============================================

-- API performance metrics
CREATE OR REPLACE VIEW api_performance_hourly AS
SELECT 
    time_bucket('1 hour', timestamp) AS hour,
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND(COUNT(CASE WHEN status_code >= 400 THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100, 2) as error_rate
FROM api_metrics 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY hour, endpoint, method
ORDER BY hour DESC, request_count DESC;

-- Real-time connection metrics
CREATE OR REPLACE VIEW realtime_metrics_minute AS
SELECT 
    time_bucket('1 minute', timestamp) AS minute,
    connection_type,
    AVG(active_connections) as avg_connections,
    MAX(active_connections) as peak_connections,
    SUM(new_connections) as total_new_connections,
    SUM(disconnections) as total_disconnections,
    AVG(latency_ms) as avg_latency
FROM realtime_metrics 
WHERE timestamp >= NOW() - INTERVAL '2 hours'
GROUP BY minute, connection_type
ORDER BY minute DESC;

-- ==============================================
-- ALERTS AND ANOMALY DETECTION VIEWS
-- ==============================================

-- Anomaly detection for user activity
CREATE OR REPLACE VIEW user_activity_anomalies AS
WITH hourly_stats AS (
    SELECT 
        time_bucket('1 hour', "lastSeenAt") AS hour,
        COUNT(DISTINCT id) as active_users
    FROM "User" 
    WHERE "lastSeenAt" >= NOW() - INTERVAL '7 days'
    GROUP BY hour
),
stats_with_moving_avg AS (
    SELECT 
        hour,
        active_users,
        AVG(active_users) OVER (ORDER BY hour ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as moving_avg_24h,
        STDDEV(active_users) OVER (ORDER BY hour ROWS BETWEEN 23 PRECEDING AND CURRENT ROW) as stddev_24h
    FROM hourly_stats
)
SELECT 
    hour,
    active_users,
    moving_avg_24h,
    stddev_24h,
    CASE 
        WHEN ABS(active_users - moving_avg_24h) > 2 * stddev_24h THEN 'ANOMALY'
        WHEN ABS(active_users - moving_avg_24h) > 1.5 * stddev_24h THEN 'WARNING'
        ELSE 'NORMAL'
    END as status
FROM stats_with_moving_avg
WHERE stddev_24h > 0
ORDER BY hour DESC;

-- Content moderation alerts
CREATE OR REPLACE VIEW moderation_alerts_hourly AS
SELECT 
    time_bucket('1 hour', "createdAt") AS hour,
    'HIGH_REPORT_VOLUME' as alert_type,
    COUNT(*) as report_count,
    COUNT(DISTINCT "reporterId") as unique_reporters,
    'Reports per hour exceeded threshold' as description
FROM "Report" 
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
    AND status = 'PENDING'
GROUP BY hour
HAVING COUNT(*) > 50  -- Threshold for high report volume
UNION ALL
SELECT 
    time_bucket('1 hour', "createdAt") AS hour,
    'HIGH_NSFW_CONTENT' as alert_type,
    COUNT(*) as nsfw_count,
    COUNT(DISTINCT "userId") as unique_users,
    'NSFW content creation rate exceeded threshold' as description
FROM "Post" 
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
    AND nsfw = true
GROUP BY hour
HAVING COUNT(*) > 20  -- Threshold for high NSFW content
ORDER BY hour DESC;

-- ==============================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ==============================================

-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
    DATE_TRUNC('day', "lastSeenAt") as day,
    COUNT(DISTINCT id) as active_users,
    COUNT(DISTINCT CASE WHEN "createdAt" >= DATE_TRUNC('day', "lastSeenAt") THEN id END) as new_users,
    COUNT(DISTINCT CASE WHEN "premiumType" != 'NONE' THEN id END) as premium_users
FROM "User" 
WHERE "lastSeenAt" >= NOW() - INTERVAL '90 days'
GROUP BY day;

CREATE MATERIALIZED VIEW IF NOT EXISTS content_summary AS
SELECT 
    DATE_TRUNC('day', "createdAt") as day,
    COUNT(*) as total_posts,
    COUNT(DISTINCT "userId") as unique_authors,
    COUNT(DISTINCT "communityId") as active_communities,
    SUM("viewCount") as total_views,
    SUM("commentCount") as total_comments
FROM "Post" 
WHERE "createdAt" >= NOW() - INTERVAL '90 days'
GROUP BY day;

-- Refresh materialized views (should be run via cron job)
-- REFRESH MATERIALIZED VIEW user_activity_summary;
-- REFRESH MATERIALIZED VIEW content_summary;

-- ==============================================
-- INDEXES FOR OPTIMIZATION
-- ==============================================

-- Indexes for time-series queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_last_seen_at_bucket 
ON "User" USING BTREE (date_trunc('hour', "lastSeenAt"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_created_at_bucket 
ON "Post" USING BTREE (date_trunc('hour', "createdAt"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_created_at_bucket 
ON "Message" USING BTREE (date_trunc('hour', "createdAt"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_connected_at_bucket 
ON "VoiceState" USING BTREE (date_trunc('hour', "connectedAt"));

-- Composite indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_community_created_score 
ON "Post" USING BTREE ("communityId", "createdAt", "score");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_created_user 
ON "Message" USING BTREE ("channelId", "createdAt", "userId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_created_type 
ON "UserActivity" USING BTREE ("createdAt", "type", "userId");

-- ==============================================
-- FUNCTIONS FOR ANALYTICS
-- ==============================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(user_id_param TEXT, days_back INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
    engagement_score DECIMAL := 0;
    post_count INTEGER;
    comment_count INTEGER;
    message_count INTEGER;
    voice_minutes INTEGER;
    days_active INTEGER;
BEGIN
    -- Count posts
    SELECT COUNT(*) INTO post_count
    FROM "Post" 
    WHERE "userId" = user_id_param 
        AND "createdAt" >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Count comments
    SELECT COUNT(*) INTO comment_count
    FROM "Comment" 
    WHERE "userId" = user_id_param 
        AND "createdAt" >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Count messages
    SELECT COUNT(*) INTO message_count
    FROM "Message" 
    WHERE "userId" = user_id_param 
        AND "createdAt" >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Count voice activity (approximate)
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM ("updatedAt" - "connectedAt"))/60), 0) INTO voice_minutes
    FROM "VoiceState" 
    WHERE "userId" = user_id_param 
        AND "connectedAt" >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Count active days
    SELECT COUNT(DISTINCT DATE("lastSeenAt")) INTO days_active
    FROM "User" 
    WHERE id = user_id_param 
        AND "lastSeenAt" >= NOW() - INTERVAL '1 day' * days_back;
    
    -- Calculate engagement score (0-100)
    engagement_score := LEAST(100, 
        (post_count * 5) + 
        (comment_count * 2) + 
        (message_count * 0.5) + 
        (voice_minutes * 0.1) + 
        (days_active * 2)
    );
    
    RETURN engagement_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get platform health score
CREATE OR REPLACE FUNCTION get_platform_health_score()
RETURNS DECIMAL AS $$
DECLARE
    health_score DECIMAL := 100;
    error_rate DECIMAL;
    active_users INTEGER;
    response_time DECIMAL;
BEGIN
    -- Check error rate (last hour)
    SELECT COALESCE(AVG(error_rate), 0) INTO error_rate
    FROM api_performance_hourly 
    WHERE hour >= NOW() - INTERVAL '1 hour';
    
    -- Check active users (last hour)
    SELECT COALESCE(COUNT(DISTINCT id), 0) INTO active_users
    FROM "User" 
    WHERE "lastSeenAt" >= NOW() - INTERVAL '1 hour';
    
    -- Check response time (last hour)
    SELECT COALESCE(AVG(avg_response_time), 0) INTO response_time
    FROM api_performance_hourly 
    WHERE hour >= NOW() - INTERVAL '1 hour';
    
    -- Adjust health score based on metrics
    health_score := health_score - (error_rate * 2);  -- Reduce by 2 points per % error rate
    health_score := health_score - GREATEST(0, (response_time - 200) / 10);  -- Reduce for slow responses
    
    IF active_users < 10 THEN
        health_score := health_score - 20;  -- Reduce for low activity
    END IF;
    
    RETURN GREATEST(0, LEAST(100, health_score));
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CONTINUOUS AGGREGATES (TIMESCALEDB FEATURE)
-- ==============================================

-- Create continuous aggregates for real-time analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_1h
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', "lastSeenAt") AS bucket,
    COUNT(DISTINCT id) as active_users,
    COUNT(DISTINCT CASE WHEN "createdAt" >= bucket THEN id END) as new_users
FROM "User"
GROUP BY bucket;

CREATE MATERIALIZED VIEW IF NOT EXISTS message_volume_1h
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', "createdAt") AS bucket,
    COUNT(*) as message_count,
    COUNT(DISTINCT "userId") as unique_senders,
    COUNT(DISTINCT "channelId") as active_channels
FROM "Message"
GROUP BY bucket;

-- Add refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('user_activity_1h',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

SELECT add_continuous_aggregate_policy('message_volume_1h',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes');

-- ==============================================
-- SETUP COMPLETE
-- ==============================================

-- Grant permissions to application user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cryb_user;
GRANT SELECT ON ALL MATERIALIZED VIEWS IN SCHEMA public TO cryb_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryb_user;

-- Log completion
INSERT INTO "AuditLog" (id, "serverId", "userId", "actionType", reason, "createdAt")
VALUES (
    gen_random_uuid()::text,
    'system',
    'system',
    999,
    'TimescaleDB analytics views created successfully',
    NOW()
);