-- CRYB Database Optimization - Enhanced Indexes
-- Performance-optimized indexes for high-traffic queries

-- =======================
-- FULL-TEXT SEARCH INDEXES
-- =======================

-- Message content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_search 
ON "Message" USING GIN (to_tsvector('english', content));

-- User search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search 
ON "User" USING GIN (
  to_tsvector('english', 
    COALESCE(username, '') || ' ' || 
    COALESCE("displayName", '') || ' ' || 
    COALESCE(bio, '')
  )
);

-- Server search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_search 
ON "Server" USING GIN (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '')
  )
);

-- Community search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_search 
ON "Community" USING GIN (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE("displayName", '') || ' ' || 
    COALESCE(description, '')
  )
);

-- Post search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_search 
ON "Post" USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(content, '')
  )
);

-- =======================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =======================

-- Message queries by channel and time (most common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_time_composite
ON "Message" ("channelId", "createdAt" DESC, id);

-- Message queries with attachments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_with_attachments
ON "Message" ("channelId", "createdAt" DESC) 
WHERE EXISTS (SELECT 1 FROM "MessageAttachment" WHERE "MessageAttachment"."messageId" = "Message".id);

-- User activity composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_composite
ON "UserActivity" ("userId", "type", "createdAt" DESC);

-- Server member activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_activity
ON "ServerMember" ("serverId", "joinedAt" DESC, "userId") 
WHERE pending = false;

-- Active voice states
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_voice_states
ON "VoiceState" ("serverId", "channelId", "connectedAt" DESC) 
WHERE "channelId" IS NOT NULL;

-- =======================
-- TIME-SERIES OPTIMIZATIONS (TimescaleDB)
-- =======================

-- Message analytics by hour
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_hour
ON "MessageAnalytics" (date_trunc('hour', timestamp), "serverId");

-- Message analytics by day
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_day
ON "MessageAnalytics" (date_trunc('day', timestamp), "serverId");

-- Voice analytics by session
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_session
ON "VoiceAnalytics" ("userId", timestamp DESC, "sessionDuration");

-- Server analytics trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_trends
ON "ServerAnalytics" ("serverId", timestamp DESC, "memberCount", "messageCount");

-- =======================
-- FRIENDSHIP AND SOCIAL INDEXES
-- =======================

-- Active friendships (most queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_active
ON "Friendship" ("initiatorId", "receiverId", status) 
WHERE status = 'ACCEPTED';

-- Friendship lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_lookup
ON "Friendship" ("receiverId", "initiatorId", status);

-- Block relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_block_relationships
ON "Block" ("blockerId", "blockedId", "createdAt");

-- =======================
-- WEB3 AND CRYPTO INDEXES
-- =======================

-- NFT ownership verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nft_verified
ON "UserNFT" ("userId", verified, "lastVerifiedAt" DESC);

-- Token gating rules lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_gating_active
ON "TokenGatingRule" ("serverId", "channelId", "isActive", "ruleType");

-- Crypto payment tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_payment_status
ON "CryptoPayment" ("userId", status, "createdAt" DESC);

-- Marketplace listings active
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_active
ON "MarketplaceListing" (status, "listingType", price, "createdAt" DESC)
WHERE status = 'ACTIVE';

-- Staking pool performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staking_pool_performance
ON "StakingPool" ("isActive", apr DESC, "totalStaked" DESC);

-- =======================
-- NOTIFICATION SYSTEM INDEXES
-- =======================

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread
ON "Notification" ("userId", "createdAt" DESC)
WHERE "isRead" = false;

-- Notification type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type
ON "Notification" ("userId", type, "createdAt" DESC);

-- =======================
-- MODERATION AND SECURITY INDEXES
-- =======================

-- Recent bans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bans_recent
ON "Ban" ("serverId", "createdAt" DESC);

-- Audit log performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_performance
ON "AuditLog" ("serverId", "actionType", "createdAt" DESC);

-- =======================
-- SESSION AND AUTH INDEXES
-- =======================

-- Active sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active
ON "Session" ("userId", "expiresAt" DESC)
WHERE "expiresAt" > NOW();

-- Token lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_tokens
ON "Session" (token, "expiresAt")
WHERE "expiresAt" > NOW();

-- =======================
-- PERFORMANCE MONITORING INDEXES
-- =======================

-- User presence status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_presence_status
ON "UserPresence" (status, "updatedAt" DESC);

-- Recent user activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_recent_activity
ON "User" ("lastSeenAt" DESC NULLS LAST);

-- Channel activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_activity
ON "Channel" ("serverId", "lastMessageId", "updatedAt" DESC);

-- =======================
-- CLEANUP AND MAINTENANCE QUERIES
-- =======================

-- Find old sessions for cleanup
-- SELECT id FROM "Session" WHERE "expiresAt" < NOW() - INTERVAL '7 days';

-- Find inactive users
-- SELECT id FROM "User" WHERE "lastSeenAt" < NOW() - INTERVAL '90 days';

-- =======================
-- INDEX USAGE MONITORING
-- =======================

-- Create view for index usage monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Create view for index size monitoring
CREATE OR REPLACE VIEW index_size_stats AS
SELECT
    t.schemaname,
    t.tablename,
    indexname,
    c.reltuples AS num_rows,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    ROUND(100.0 * pg_relation_size(i.indexrelid) / pg_relation_size(c.oid), 2) AS index_ratio
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname = t.tablename
LEFT OUTER JOIN pg_index i ON c.oid = i.indrelid
LEFT OUTER JOIN pg_class ic ON ic.oid = i.indexrelid
LEFT OUTER JOIN pg_indexes idx ON idx.tablename = t.tablename AND idx.indexname = ic.relname
WHERE t.schemaname = 'public'
AND c.reltuples > 0
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- =======================
-- TIMESCALEDB OPTIMIZATIONS
-- =======================

-- Convert analytics tables to hypertables for better time-series performance
-- Note: These need to be run after data is loaded

-- SELECT create_hypertable('"MessageAnalytics"', 'timestamp', if_not_exists => TRUE);
-- SELECT create_hypertable('"VoiceAnalytics"', 'timestamp', if_not_exists => TRUE);
-- SELECT create_hypertable('"ServerAnalytics"', 'timestamp', if_not_exists => TRUE);

-- Add compression policies for older data
-- SELECT add_compression_policy('"MessageAnalytics"', INTERVAL '7 days');
-- SELECT add_compression_policy('"VoiceAnalytics"', INTERVAL '7 days');
-- SELECT add_compression_policy('"ServerAnalytics"', INTERVAL '30 days');