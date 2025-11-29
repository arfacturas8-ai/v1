-- CRYB PLATFORM PERFORMANCE OPTIMIZATION INDEXES
-- High-Impact Indexes for Critical Query Patterns
-- Run this script after Prisma migrations to add performance-critical indexes

\echo 'Starting database performance index creation...';

-- ==============================================
-- CRITICAL MESSAGING INDEXES
-- ==============================================

-- Optimized message retrieval by channel with timestamp ordering
-- This index covers the most common query pattern for chat loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_timestamp_optimized
ON "Message" ("channelId", "timestamp" DESC, "id") 
WHERE "channelId" IS NOT NULL;

-- Message search with user context for moderation tools
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_user_channel_recent
ON "Message" ("userId", "channelId", "timestamp" DESC)
WHERE "timestamp" > NOW() - INTERVAL '90 days';

-- Thread message optimization for reply chains
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_thread_hierarchy
ON "Message" ("threadId", "replyToId", "timestamp" ASC)
WHERE "threadId" IS NOT NULL;

-- Message mentions optimization for notification system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_mentions_recent
ON "Message" ("timestamp" DESC, "mentionEveryone", "mentions")
WHERE "timestamp" > NOW() - INTERVAL '7 days' 
AND ("mentionEveryone" = true OR "mentions" IS NOT NULL);

-- ==============================================
-- SERVER AND MEMBER OPTIMIZATION
-- ==============================================

-- Active server members with role hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_roles_active
ON "ServerMember" ("serverId", "joinedAt" DESC, "userId")
WHERE pending = false AND "communicationDisabledUntil" IS NULL;

-- Server discovery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_discovery_public
ON "Server" ("isPublic", "approximateMemberCount" DESC, "createdAt" DESC)
WHERE "isPublic" = true AND "approximateMemberCount" > 0;

-- Member role lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_role_lookup
ON "MemberRole" ("serverId", "userId", "roleId");

-- Channel permissions with role inheritance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_permission_role
ON "ChannelPermission" ("channelId", "roleId", "userId")
WHERE "roleId" IS NOT NULL OR "userId" IS NOT NULL;

-- ==============================================
-- VOICE AND PRESENCE OPTIMIZATION
-- ==============================================

-- Active voice states by server and channel
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_server_channel_active
ON "VoiceState" ("serverId", "channelId", "connectedAt" DESC, "userId")
WHERE "channelId" IS NOT NULL AND "serverId" IS NOT NULL;

-- User presence with recent activity filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_presence_active_status
ON "UserPresence" ("status", "updatedAt" DESC, "userId")
WHERE "status" IN ('ONLINE', 'IDLE', 'DND') AND "updatedAt" > NOW() - INTERVAL '1 hour';

-- User activity tracking for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_recent_type
ON "UserActivity" ("userId", "type", "createdAt" DESC)
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- ==============================================
-- REDDIT FUNCTIONALITY INDEXES
-- ==============================================

-- Hot posts algorithm optimization (Reddit-style ranking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_hot_ranking
ON "Post" ("communityId", ((score / GREATEST(EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 3600, 1)) DESC), "createdAt" DESC)
WHERE "isRemoved" = false AND "isLocked" = false AND "createdAt" > NOW() - INTERVAL '7 days';

-- Top posts by community with time filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_community_top_timeframe
ON "Post" ("communityId", score DESC, "createdAt" DESC)
WHERE "isRemoved" = false AND score > 0;

-- New posts feed optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_community_new
ON "Post" ("communityId", "createdAt" DESC, "id")
WHERE "isRemoved" = false;

-- Comment thread optimization with scoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_post_thread_score
ON "Comment" ("postId", "parentId", score DESC, "createdAt" ASC)
WHERE "parentId" IS NULL OR score > -5;

-- User karma calculation optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_user_karma_recent
ON "Vote" ("userId", value, "createdAt" DESC)
WHERE "createdAt" > NOW() - INTERVAL '90 days';

-- Community member karma tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_member_karma
ON "CommunityMember" ("communityId", karma DESC, "joinedAt" DESC);

-- ==============================================
-- WEB3 AND NFT OPTIMIZATION
-- ==============================================

-- Token gating rule evaluation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_gating_active_server
ON "TokenGatingRule" ("serverId", "isActive", "ruleType")
WHERE "isActive" = true AND "serverId" IS NOT NULL;

-- NFT ownership verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nft_verified_recent
ON "UserNFT" ("userId", verified, "lastVerifiedAt" DESC)
WHERE verified = true AND "lastVerifiedAt" > NOW() - INTERVAL '7 days';

-- Active marketplace listings with price sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listing_active_price
ON "MarketplaceListing" (status, "collectionId", price ASC, "createdAt" DESC)
WHERE status = 'ACTIVE';

-- NFT collection floor price tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_collection_floor
ON "MarketplaceListing" ("collectionId", price ASC, "createdAt" DESC)
WHERE status = 'ACTIVE' AND "listingType" = 'FIXED_PRICE';

-- Crypto payment processing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_payment_processing
ON "CryptoPayment" (status, "provider", "createdAt" DESC)
WHERE status IN ('PENDING', 'PROCESSING');

-- ==============================================
-- FILE UPLOAD OPTIMIZATION
-- ==============================================

-- File access tracking for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_access_user_recent
ON "FileAccessLog" ("userId", "accessType", "accessedAt" DESC)
WHERE "accessedAt" > NOW() - INTERVAL '30 days';

-- File upload session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_upload_session_active
ON "ChunkedUploadSession" ("userId", status, "lastActivity" DESC)
WHERE status = 'active' AND "expiresAt" > NOW();

-- Transcoding job queue optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcoding_job_queue
ON "TranscodingJob" (status, priority DESC, "createdAt" ASC)
WHERE status IN ('queued', 'processing');

-- File hash deduplication
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uploaded_file_hash_dedup
ON "UploadedFile" (hash, "mimeType", "size")
WHERE processed = true AND "scanPassed" = true;

-- ==============================================
-- SECURITY AND AUDIT OPTIMIZATION
-- ==============================================

-- Security log analysis for threat detection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_log_threat_analysis
ON "SecurityLog" ("ipAddress", type, "riskScore" DESC, "createdAt" DESC)
WHERE "riskScore" >= 5 AND "createdAt" > NOW() - INTERVAL '7 days';

-- Failed login attempt tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_log_failed_login
ON "SecurityLog" ("userId", "ipAddress", "createdAt" DESC)
WHERE type = 'failed_login' AND "createdAt" > NOW() - INTERVAL '24 hours';

-- Session token lookup optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_token_active
ON "Session" (token, "expiresAt", "userId")
WHERE "expiresAt" > NOW();

-- Two-factor authentication tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_2fa_enabled
ON "User" ("twoFactorEnabled", "twoFactorEnabledAt" DESC)
WHERE "twoFactorEnabled" = true;

-- ==============================================
-- NOTIFICATION SYSTEM OPTIMIZATION
-- ==============================================

-- Unread notifications with priority sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_unread_priority
ON "Notification" ("userId", "isRead", type, "createdAt" DESC)
WHERE "isRead" = false;

-- Direct message optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_participant_channel
ON "DirectMessageParticipant" ("userId", "channelId", "lastReadMessageId");

-- Friend system optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_active_users
ON "Friendship" ("initiatorId", "receiverId", status)
WHERE status = 'ACCEPTED';

-- ==============================================
-- ANALYTICS OPTIMIZATION (Pre-TimescaleDB)
-- ==============================================

-- Message analytics time-series optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_time_server
ON "MessageAnalytics" (timestamp DESC, "serverId", "channelId")
WHERE timestamp > NOW() - INTERVAL '90 days';

-- Voice analytics session tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_duration
ON "VoiceAnalytics" ("userId", "sessionDuration" DESC, timestamp DESC)
WHERE timestamp > NOW() - INTERVAL '30 days' AND "sessionDuration" > 60;

-- Server analytics trends
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_trends
ON "ServerAnalytics" ("serverId", timestamp DESC, "memberCount", "messageCount");

-- ==============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ==============================================

-- Active servers only (excludes empty/inactive servers)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_active_members
ON "Server" ("isPublic", "approximateMemberCount" DESC, "createdAt" DESC)
WHERE "approximateMemberCount" > 5 AND "isPublic" = true;

-- Recent messages with attachments (for media galleries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_with_attachments_recent
ON "Message" ("channelId", "timestamp" DESC)
WHERE "timestamp" > NOW() - INTERVAL '30 days'
AND EXISTS (
    SELECT 1 FROM "MessageAttachment" ma WHERE ma."messageId" = "Message"."id"
);

-- Pinned messages optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_pinned_channel
ON "Message" ("channelId", "timestamp" DESC)
WHERE "isPinned" = true;

-- NSFW content filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_community_sfw
ON "Post" ("communityId", "createdAt" DESC, score DESC)
WHERE nsfw = false AND "isRemoved" = false;

-- Premium user optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_premium_active
ON "User" ("premiumType", "premiumUntil", "createdAt" DESC)
WHERE "premiumType" != 'NONE' AND ("premiumUntil" IS NULL OR "premiumUntil" > NOW());

-- ==============================================
-- FULL-TEXT SEARCH OPTIMIZATION
-- ==============================================

-- Enhanced message content search with channel context
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_content_fts_channel
ON "Message" USING GIN (
    to_tsvector('english', content),
    "channelId"
) WHERE length(content) > 3;

-- Post content search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_content_fts
ON "Post" USING GIN (
    to_tsvector('english', title || ' ' || content)
) WHERE "isRemoved" = false;

-- User search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search_fts
ON "User" USING GIN (
    to_tsvector('english', username || ' ' || "displayName" || ' ' || COALESCE(bio, ''))
) WHERE "bannedAt" IS NULL;

-- ==============================================
-- EXPRESSION INDEXES FOR COMPLEX QUERIES
-- ==============================================

-- Post age for trending calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_age_hours
ON "Post" (EXTRACT(EPOCH FROM (NOW() - "createdAt")) / 3600 ASC)
WHERE "createdAt" > NOW() - INTERVAL '7 days' AND "isRemoved" = false;

-- User activity score calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_score
ON "User" ((
    COALESCE(EXTRACT(EPOCH FROM (NOW() - "lastSeenAt")) / 3600, 9999)
) ASC)
WHERE "bannedAt" IS NULL AND "lastSeenAt" > NOW() - INTERVAL '30 days';

-- ==============================================
-- INDEX MAINTENANCE AND STATISTICS
-- ==============================================

-- Update table statistics for better query planning
ANALYZE "Message";
ANALYZE "User";
ANALYZE "Server";
ANALYZE "ServerMember";
ANALYZE "Channel";
ANALYZE "Post";
ANALYZE "Comment";
ANALYZE "Vote";
ANALYZE "VoiceState";
ANALYZE "UserPresence";
ANALYZE "TokenGatingRule";
ANALYZE "UserNFT";
ANALYZE "MarketplaceListing";
ANALYZE "UploadedFile";
ANALYZE "SecurityLog";
ANALYZE "Notification";

-- ==============================================
-- PERFORMANCE MONITORING QUERIES
-- ==============================================

-- Function to check index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scans BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT,
    size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_user_indexes.schemaname::TEXT,
        pg_stat_user_indexes.relname::TEXT as tablename,
        pg_stat_user_indexes.indexrelname::TEXT as indexname,
        pg_stat_user_indexes.idx_scan as idx_scans,
        pg_stat_user_indexes.idx_tup_read,
        pg_stat_user_indexes.idx_tup_fetch,
        ROUND(pg_relation_size(pg_stat_user_indexes.indexrelid) / 1024.0 / 1024.0, 2) as size_mb
    FROM pg_stat_user_indexes
    JOIN pg_index ON pg_stat_user_indexes.indexrelid = pg_index.indexrelid
    WHERE pg_stat_user_indexes.schemaname = 'public'
    ORDER BY pg_stat_user_indexes.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries and suggest indexes
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
    query_pattern TEXT,
    total_exec_time NUMERIC,
    mean_exec_time NUMERIC,
    calls BIGINT,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        LEFT(query, 100) as query_pattern,
        ROUND(total_exec_time::NUMERIC, 2) as total_exec_time,
        ROUND(mean_exec_time::NUMERIC, 2) as mean_exec_time,
        calls,
        rows
    FROM pg_stat_statements
    WHERE query LIKE '%SELECT%'
    ORDER BY mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_stat_statements extension not available. Enable it for query performance monitoring.';
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO cryb_user;
GRANT EXECUTE ON FUNCTION analyze_query_performance() TO cryb_user;

\echo 'Database performance indexes created successfully!';
\echo 'Use SELECT * FROM get_index_usage_stats(); to monitor index usage.';
\echo 'Use SELECT * FROM analyze_query_performance(); to identify slow queries.';
\echo 'Run ANALYZE on tables after significant data changes for optimal performance.';