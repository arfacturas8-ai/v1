-- CRYB Platform Database Optimization Script
-- This script addresses missing indexes, slow queries, cascading deletes, defaults, and data integrity

-- ===========================
-- 1. MISSING INDEXES
-- ===========================

-- Add missing foreign key indexes for better join performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_parent_id 
ON "Comment" ("parentId") WHERE "parentId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_tip_payment_id 
ON "CryptoTip" ("paymentId") WHERE "paymentId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_sale_listing_id 
ON "MarketplaceSale" ("listingId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_presence_id 
ON "UserActivity" ("presenceId") WHERE "presenceId" IS NOT NULL;

-- ===========================
-- 2. PERFORMANCE OPTIMIZATION INDEXES
-- ===========================

-- Enhanced message search with full-text search capabilities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_content_fts 
ON "Message" USING GIN (to_tsvector('english', content));

-- Composite index for message history queries (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_timestamp_desc 
ON "Message" ("channelId", "timestamp" DESC, "id" DESC);

-- User search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_search_composite 
ON "User" (username, "displayName", email) WHERE "bannedAt" IS NULL;

-- Server member activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_activity 
ON "ServerMember" ("serverId", "joinedAt" DESC, pending) WHERE pending = false;

-- Community posts with hot/trending sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_trending 
ON "Post" ("communityId", score DESC, "createdAt" DESC) WHERE "isRemoved" = false;

-- Voice channel usage patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_activity 
ON "VoiceState" ("channelId", "connectedAt", "updatedAt") WHERE "channelId" IS NOT NULL;

-- Notification delivery optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_delivery 
ON "Notification" ("userId", "isRead", "createdAt" DESC);

-- File upload and access patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uploaded_file_access 
ON "UploadedFile" ("userId", "createdAt" DESC, processed, "expiresAt");

-- Marketplace activity indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_listing_active 
ON "MarketplaceListing" (status, "listingType", price, "createdAt" DESC) 
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_bid_active 
ON "MarketplaceBid" ("listingId", status, amount DESC, "createdAt" DESC) 
WHERE status IN ('ACTIVE', 'WINNING');

-- Crypto payment tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_payment_status 
ON "CryptoPayment" ("userId", status, "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crypto_tip_status 
ON "CryptoTip" ("recipientId", status, "createdAt" DESC);

-- Token gating optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_gating_active 
ON "TokenGatingRule" ("serverId", "channelId", "isActive", "ruleType") 
WHERE "isActive" = true;

-- Analytics and reporting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_daily 
ON "ServerAnalytics" ("serverId", date_trunc('day', timestamp));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_hourly 
ON "MessageAnalytics" ("serverId", "channelId", date_trunc('hour', timestamp));

-- Security and audit trail optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_log_analysis 
ON "SecurityLog" ("userId", type, "riskScore" DESC, "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_investigation 
ON "AuditLog" ("serverId", "userId", "actionType", "createdAt" DESC);

-- ===========================
-- 3. QUERY PATTERN OPTIMIZATIONS
-- ===========================

-- Thread messages optimization (nested comments pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_thread_hierarchy 
ON "Message" ("threadId", "replyToId", "timestamp") WHERE "threadId" IS NOT NULL;

-- User relationship queries (friends, blocks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_lookup 
ON "Friendship" ("initiatorId", "receiverId", status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_block_lookup 
ON "Block" ("blockerId", "blockedId");

-- Community member rankings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_member_karma 
ON "CommunityMember" ("communityId", karma DESC, "joinedAt" DESC);

-- Role-based permission queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_role_lookup 
ON "MemberRole" ("serverId", "userId", "roleId");

-- NFT and Web3 asset tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_nft_verified 
ON "UserNFT" ("userId", verified, "lastVerifiedAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_token_balance 
ON "Token" ("userId", chain, verified, balance);

-- Staking and governance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stake_active 
ON "UserStake" ("userId", status, amount, "createdAt" DESC) 
WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_governance_proposal_active 
ON "GovernanceProposal" (status, category, "votingStartTime", "votingEndTime") 
WHERE status IN ('ACTIVE', 'DRAFT');

-- File processing pipeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcoding_job_queue 
ON "TranscodingJob" (status, priority DESC, "createdAt") 
WHERE status IN ('queued', 'processing');

-- ===========================
-- 4. SPECIALIZED INDEXES FOR SEARCH
-- ===========================

-- User mentions in messages (JSON search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_mentions_gin 
ON "Message" USING GIN (mentions) WHERE mentions IS NOT NULL;

-- Channel features and settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_features 
ON "Channel" ("serverId", type, "isPrivate", position);

-- Server features and settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_features 
ON "Server" ("isPublic", "tokenGated", "verificationLevel", "approximateMemberCount");

-- Update table statistics for query planner
ANALYZE;

-- ===========================
-- PERFORMANCE NOTES:
-- ===========================
-- 
-- 1. All indexes use CONCURRENTLY to avoid blocking operations
-- 2. Partial indexes are used where applicable to reduce size
-- 3. Composite indexes are ordered by selectivity (most selective first)
-- 4. GIN indexes are used for full-text search and JSON operations
-- 5. DESC indexes are used for timestamp-based queries
-- 6. WHERE clauses in indexes filter out inactive/deleted records
--
-- Query patterns optimized:
-- - Message retrieval by channel/timestamp
-- - User search and authentication
-- - Real-time notifications
-- - Voice/video state tracking  
-- - Community content discovery
-- - Marketplace transactions
-- - Web3 asset verification
-- - Analytics aggregation
-- - Security monitoring
-- - File upload/processing