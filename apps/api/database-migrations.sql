-- CRYB Platform Database Schema Extensions
-- This script adds all the necessary tables and modifications for the new features
-- Run this after your existing database setup

-- Direct Messages and Conversations
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL DEFAULT 'DM', -- 'DM' or 'GROUP_DM'
  "name" TEXT,
  "ownerId" TEXT,
  "lastMessageId" TEXT,
  "lastMessageAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "lastReadAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "role" TEXT DEFAULT 'MEMBER', -- 'MEMBER', 'ADMIN'
  
  CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DirectMessage" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "editedTimestamp" TIMESTAMP(3),
  "replyToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DirectMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DirectMessage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DirectMessageAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "messageId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DirectMessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DirectMessageReaction" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "DirectMessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DirectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DirectMessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Enhanced Notifications
CREATE TABLE IF NOT EXISTS "UserNotificationPreferences" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "mentionsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "repliesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "friendRequestsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "systemEnabled" BOOLEAN NOT NULL DEFAULT true,
  "voiceCallsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "groupInvitesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
  "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserPushSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dhKey" TEXT NOT NULL,
  "authKey" TEXT NOT NULL,
  "userAgent" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Enhanced Notification table updates
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'normal';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "channels" TEXT[] DEFAULT ARRAY['in_app'];

-- Admin and Moderation
CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reporterId" TEXT NOT NULL,
  "reportedId" TEXT,
  "type" TEXT NOT NULL, -- 'USER', 'POST', 'COMMENT', 'MESSAGE', 'SERVER'
  "contentId" TEXT, -- ID of the reported content
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  "moderatorId" TEXT,
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Report_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ModerationLog" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "action" TEXT NOT NULL, -- 'USER_BANNED', 'USER_UNBANNED', 'CONTENT_REMOVED', etc.
  "moderatorId" TEXT NOT NULL,
  "targetUserId" TEXT,
  "reportId" TEXT,
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ModerationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ModerationLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- User enhancements for moderation
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedBy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspensionEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspensionReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isStaff" BOOLEAN DEFAULT false;

-- User presence for real-time features
CREATE TABLE IF NOT EXISTS "UserPresence" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'offline', -- 'online', 'away', 'busy', 'invisible', 'offline'
  "activity" TEXT, -- Custom status message
  "lastSeenAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Voice/Video call logs
CREATE TABLE IF NOT EXISTS "VoiceSession" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "duration" INTEGER, -- in seconds
  "quality" TEXT, -- 'good', 'fair', 'poor'
  "endReason" TEXT, -- 'user_left', 'disconnected', 'kicked'
  
  CONSTRAINT "VoiceSession_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VoiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Search analytics
CREATE TABLE IF NOT EXISTS "SearchQuery" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "query" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'all', -- 'all', 'users', 'posts', 'messages', etc.
  "resultsCount" INTEGER DEFAULT 0,
  "searchTime" INTEGER, -- in milliseconds
  "engine" TEXT DEFAULT 'postgresql', -- 'postgresql', 'elasticsearch'
  "filters" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Enhanced content flags
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isReported" BOOLEAN DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isReported" BOOLEAN DEFAULT false;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isReported" BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_conversation_participants" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "idx_direct_message_conversation" ON "DirectMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_direct_message_reactions" ON "DirectMessageReaction"("messageId", "userId", "emoji");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_dm_reaction" ON "DirectMessageReaction"("messageId", "userId", "emoji");

CREATE INDEX IF NOT EXISTS "idx_user_push_subscriptions" ON "UserPushSubscription"("userId", "endpoint");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_push_subscription" ON "UserPushSubscription"("userId", "endpoint");

CREATE INDEX IF NOT EXISTS "idx_notification_user_read" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_notification_type_priority" ON "Notification"("type", "priority", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_report_status_priority" ON "Report"("status", "priority", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_report_type_content" ON "Report"("type", "contentId");

CREATE INDEX IF NOT EXISTS "idx_moderation_log_moderator" ON "ModerationLog"("moderatorId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_moderation_log_target" ON "ModerationLog"("targetUserId", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_user_presence_status" ON "UserPresence"("status", "lastSeenAt");
CREATE INDEX IF NOT EXISTS "idx_voice_session_channel" ON "VoiceSession"("channelId", "joinedAt");

CREATE INDEX IF NOT EXISTS "idx_search_query_user_time" ON "SearchQuery"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_search_query_popular" ON "SearchQuery"("query", "createdAt");

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS "idx_user_fts" ON "User" USING gin(to_tsvector('english', username || ' ' || COALESCE("displayName", '') || ' ' || COALESCE(bio, '')));
CREATE INDEX IF NOT EXISTS "idx_post_fts" ON "Post" USING gin(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS "idx_comment_fts" ON "Comment" USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS "idx_message_fts" ON "Message" USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS "idx_direct_message_fts" ON "DirectMessage" USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS "idx_server_fts" ON "Server" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS "idx_community_fts" ON "Community" USING gin(to_tsvector('english', name || ' ' || COALESCE("displayName", '') || ' ' || COALESCE(description, '')));

-- Update foreign key constraints for new relationships
DO $$
BEGIN
  -- Add foreign key for Conversation lastMessage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Conversation_lastMessageId_fkey'
  ) THEN
    ALTER TABLE "Conversation" 
    ADD CONSTRAINT "Conversation_lastMessageId_fkey" 
    FOREIGN KEY ("lastMessageId") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  -- Add foreign key for User bannedBy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'User_bannedBy_fkey'
  ) THEN
    ALTER TABLE "User" 
    ADD CONSTRAINT "User_bannedBy_fkey" 
    FOREIGN KEY ("bannedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need them
DO $$
DECLARE
    table_name text;
    table_names text[] := ARRAY[
        'Conversation',
        'DirectMessage', 
        'UserNotificationPreferences',
        'Report',
        'UserPresence'
    ];
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON "%I";
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON "%I" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- Default data and configurations
INSERT INTO "UserNotificationPreferences" ("userId", "inAppEnabled", "pushEnabled", "emailEnabled")
SELECT "id", true, true, true
FROM "User" 
WHERE "id" NOT IN (SELECT "userId" FROM "UserNotificationPreferences")
ON CONFLICT ("userId") DO NOTHING;

-- Create default presence records for existing users
INSERT INTO "UserPresence" ("userId", "status", "lastSeenAt")
SELECT "id", 'offline', COALESCE("lastSeenAt", "createdAt")
FROM "User" 
WHERE "id" NOT IN (SELECT "userId" FROM "UserPresence")
ON CONFLICT ("userId") DO NOTHING;

-- Analytics views for admin dashboard
CREATE OR REPLACE VIEW "AdminDashboardStats" AS
SELECT 
  (SELECT COUNT(*) FROM "User" WHERE "bannedAt" IS NULL) as active_users,
  (SELECT COUNT(*) FROM "User" WHERE "bannedAt" IS NOT NULL) as banned_users,
  (SELECT COUNT(*) FROM "User" WHERE "createdAt" > CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM "Post" WHERE "isRemoved" = false) as active_posts,
  (SELECT COUNT(*) FROM "Server" WHERE "isPublic" = true) as public_servers,
  (SELECT COUNT(*) FROM "Community" WHERE "isPublic" = true) as public_communities,
  (SELECT COUNT(*) FROM "Report" WHERE "status" = 'PENDING') as pending_reports,
  (SELECT COUNT(*) FROM "Message" WHERE "createdAt" > CURRENT_DATE - INTERVAL '24 hours') as messages_24h;

-- Performance optimization settings
-- These should be adjusted based on your specific database configuration
-- VACUUM ANALYZE;
-- REINDEX DATABASE your_database_name;

COMMENT ON TABLE "Conversation" IS 'Direct message conversations between users';
COMMENT ON TABLE "DirectMessage" IS 'Individual messages in DM conversations';
COMMENT ON TABLE "UserNotificationPreferences" IS 'User preferences for notification delivery';
COMMENT ON TABLE "UserPushSubscription" IS 'Web push notification subscriptions';
COMMENT ON TABLE "Report" IS 'Content and user reports for moderation';
COMMENT ON TABLE "ModerationLog" IS 'Log of all moderation actions';
COMMENT ON TABLE "UserPresence" IS 'Real-time user presence and status';
COMMENT ON TABLE "VoiceSession" IS 'Voice/video call session logs';
COMMENT ON TABLE "SearchQuery" IS 'Search analytics and query logs';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO your_api_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_api_user;

SELECT 'Database schema update completed successfully!' as status;