-- Performance indexes for CRYB Platform
-- These indexes are created separately for better performance and flexibility

-- Full-text search index for messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_search 
ON "Message" USING GIN (to_tsvector('english', content));

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_composite
ON "UserActivity" ("userId", "type", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_composite
ON "VoiceState" ("channelId", "connectedAt") WHERE "channelId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_hour
ON "MessageAnalytics" (date_trunc('hour', timestamp), "serverId");

-- Partial indexes for better performance  
-- Note: Skip attachments index as it's handled via separate table

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_voice_states
ON "VoiceState" ("serverId", "channelId", "connectedAt") WHERE "channelId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_active
ON "Friendship" ("initiatorId", "receiverId") WHERE status = 'ACCEPTED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_active
ON "ServerMember" ("serverId", "joinedAt") WHERE pending = false;

-- Additional performance indexes for common queries

-- Messages by channel and time (most common chat query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_channel_time_desc
ON "Message" ("channelId", "createdAt" DESC);

-- User mentions in messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_mentions
ON "Message" USING GIN (mentions) WHERE mentions IS NOT NULL;

-- Server members by join date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_members_joined
ON "ServerMember" ("serverId", "joinedAt" DESC);

-- Active user sessions (skip NOW() function as it's not immutable)
-- Will be handled at application level

-- Unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unread_notifications
ON "Notification" ("userId", "createdAt" DESC) WHERE "isRead" = false;

-- Posts by community and score (Reddit-like sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_community_score
ON "Post" ("communityId", "score" DESC, "createdAt" DESC);

-- Comments by post and score
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_score
ON "Comment" ("postId", "score" DESC, "createdAt" DESC);

-- Voice analytics by time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_time
ON "VoiceAnalytics" ("timestamp" DESC, "serverId");

-- Server analytics by time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_time
ON "ServerAnalytics" ("serverId", "timestamp" DESC);

-- Audit logs by server and action type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_server_action
ON "AuditLog" ("serverId", "actionType", "createdAt" DESC);

-- Tokens by user and chain for Web3 features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tokens_user_chain
ON "Token" ("userId", "chain", "verified");

-- Message reactions by message
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_message_emoji
ON "Reaction" ("messageId", "emoji");

-- Thread messages by thread and time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_messages
ON "Message" ("threadId", "createdAt" DESC) WHERE "threadId" IS NOT NULL;

-- Ban records by server
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bans_server_time
ON "Ban" ("serverId", "createdAt" DESC);

-- Invites by server (skip NOW() function as it's not immutable)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invites_server_time
ON "Invite" ("serverId", "expiresAt") WHERE "expiresAt" IS NOT NULL;

-- Community member karma tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_members_karma
ON "CommunityMember" ("communityId", "karma" DESC);

-- Message attachments by content type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_content_type
ON "MessageAttachment" ("contentType", "messageId");

ANALYZE;