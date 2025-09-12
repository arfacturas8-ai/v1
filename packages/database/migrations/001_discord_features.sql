-- Discord Features Migration
-- This migration adds all Discord-like features to the existing schema

BEGIN;

-- Update Users table with Discord-like features
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS discriminator TEXT DEFAULT '0001';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS banner TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS pronouns TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "premiumType" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicFlags" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS flags INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-US';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ;

-- Create unique constraint for username + discriminator
DROP INDEX IF EXISTS "User_username_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_discriminator_key" ON "User"(username, discriminator);

-- Add indexes for new User fields
CREATE INDEX IF NOT EXISTS "User_lastSeenAt_idx" ON "User"("lastSeenAt");

-- Update Server table with Discord-like features
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS splash TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "discoverySplash" TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "maxPresences" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "maxVideoChannelUsers" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "approximateMemberCount" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "approximatePresenceCount" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS permissions TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "verificationLevel" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "defaultMessageNotifications" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "explicitContentFilter" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "mfaLevel" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "systemChannelId" TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "systemChannelFlags" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "rulesChannelId" TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "maxPresences2" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "vanityUrlCode" TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "premiumTier" INTEGER DEFAULT 0;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "premiumSubscriptionCount" INTEGER;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "preferredLocale" TEXT DEFAULT 'en-US';
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "publicUpdatesChannelId" TEXT;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE "Server" ADD COLUMN IF NOT EXISTS "nsfwLevel" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Server_vanityUrlCode_idx" ON "Server"("vanityUrlCode");

-- Update Channel table with Discord-like features
ALTER TABLE "Channel" ALTER COLUMN "serverId" DROP NOT NULL;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS bitrate INTEGER;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "userLimit" INTEGER;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "rtcRegion" TEXT;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "videoQualityMode" INTEGER;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "defaultAutoArchiveDuration" INTEGER;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS flags INTEGER DEFAULT 0;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "lastMessageId" TEXT;
ALTER TABLE "Channel" ADD COLUMN IF NOT EXISTS "lastPinTimestamp" TIMESTAMPTZ;

-- Remove unique constraint on server+name since DM channels don't have servers
DROP INDEX IF EXISTS "Channel_serverId_name_key";

-- Add new indexes for Channel
CREATE INDEX IF NOT EXISTS "Channel_type_idx" ON "Channel"(type);
CREATE INDEX IF NOT EXISTS "Channel_parentId_idx" ON "Channel"("parentId");

-- Update Message table with Discord-like features
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS nonce TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS tts BOOLEAN DEFAULT FALSE;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "editedTimestamp" TIMESTAMPTZ;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS flags INTEGER DEFAULT 0;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "mentionEveryone" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS mentions JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "mentionRoles" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "mentionChannels" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "webhookId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS type INTEGER DEFAULT 0;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS activity JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS application JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "applicationId" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "messageReference" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS stickers JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "referencedMessage" JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS interaction JSONB;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS components JSONB;

-- Remove old attachments and embeds columns (now handled by separate tables)
ALTER TABLE "Message" DROP COLUMN IF EXISTS attachments;
ALTER TABLE "Message" DROP COLUMN IF EXISTS embeds;
ALTER TABLE "Message" DROP COLUMN IF EXISTS "editedAt";

CREATE INDEX IF NOT EXISTS "Message_type_idx" ON "Message"(type);

-- Update ServerMember table with Discord-like features
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS banner TEXT;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS "premiumSince" TIMESTAMPTZ;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS deaf BOOLEAN DEFAULT FALSE;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS mute BOOLEAN DEFAULT FALSE;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS flags INTEGER DEFAULT 0;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT FALSE;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS permissions TEXT;
ALTER TABLE "ServerMember" ADD COLUMN IF NOT EXISTS "communicationDisabledUntil" TIMESTAMPTZ;

-- Remove old columns
ALTER TABLE "ServerMember" DROP COLUMN IF EXISTS "isMuted";
ALTER TABLE "ServerMember" DROP COLUMN IF EXISTS "isDeafened";

CREATE INDEX IF NOT EXISTS "ServerMember_joinedAt_idx" ON "ServerMember"("joinedAt");

-- Create UserPresence table
CREATE TABLE IF NOT EXISTS "UserPresence" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'IDLE', 'DND', 'INVISIBLE', 'OFFLINE')),
    "clientStatus" JSONB,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "UserPresence_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserPresence_status_idx" ON "UserPresence"(status);

-- Create UserActivity table
CREATE TABLE IF NOT EXISTS "UserActivity" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "presenceId" TEXT,
    type TEXT NOT NULL CHECK (type IN ('PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'CUSTOM', 'COMPETING')),
    name TEXT NOT NULL,
    details TEXT,
    state TEXT,
    "applicationId" TEXT,
    url TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    timestamps JSONB,
    assets JSONB,
    party JSONB,
    secrets JSONB,
    instance BOOLEAN DEFAULT FALSE,
    flags INTEGER DEFAULT 0,
    
    CONSTRAINT "UserActivity_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "UserActivity_presenceId_fkey" 
        FOREIGN KEY ("presenceId") REFERENCES "UserPresence"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserActivity_userId_idx" ON "UserActivity"("userId");
CREATE INDEX IF NOT EXISTS "UserActivity_type_idx" ON "UserActivity"(type);

-- Create Friendship table
CREATE TABLE IF NOT EXISTS "Friendship" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'BLOCKED')),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Friendship_initiatorId_fkey" 
        FOREIGN KEY ("initiatorId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Friendship_receiverId_fkey" 
        FOREIGN KEY ("receiverId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE ("initiatorId", "receiverId")
);

CREATE INDEX IF NOT EXISTS "Friendship_initiatorId_idx" ON "Friendship"("initiatorId");
CREATE INDEX IF NOT EXISTS "Friendship_receiverId_idx" ON "Friendship"("receiverId");
CREATE INDEX IF NOT EXISTS "Friendship_status_idx" ON "Friendship"(status);

-- Create Block table
CREATE TABLE IF NOT EXISTS "Block" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Block_blockerId_fkey" 
        FOREIGN KEY ("blockerId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Block_blockedId_fkey" 
        FOREIGN KEY ("blockedId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE ("blockerId", "blockedId")
);

CREATE INDEX IF NOT EXISTS "Block_blockerId_idx" ON "Block"("blockerId");
CREATE INDEX IF NOT EXISTS "Block_blockedId_idx" ON "Block"("blockedId");

-- Create DirectMessageParticipant table
CREATE TABLE IF NOT EXISTS "DirectMessageParticipant" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMPTZ DEFAULT NOW(),
    "lastReadMessageId" TEXT,
    
    CONSTRAINT "DirectMessageParticipant_channelId_fkey" 
        FOREIGN KEY ("channelId") REFERENCES "Channel"(id) ON DELETE CASCADE,
    CONSTRAINT "DirectMessageParticipant_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE ("channelId", "userId")
);

CREATE INDEX IF NOT EXISTS "DirectMessageParticipant_channelId_idx" ON "DirectMessageParticipant"("channelId");
CREATE INDEX IF NOT EXISTS "DirectMessageParticipant_userId_idx" ON "DirectMessageParticipant"("userId");

-- Create VoiceState table
CREATE TABLE IF NOT EXISTS "VoiceState" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "serverId" TEXT,
    "channelId" TEXT,
    "sessionId" TEXT NOT NULL,
    deaf BOOLEAN DEFAULT FALSE,
    mute BOOLEAN DEFAULT FALSE,
    "selfDeaf" BOOLEAN DEFAULT FALSE,
    "selfMute" BOOLEAN DEFAULT FALSE,
    "selfStream" BOOLEAN DEFAULT FALSE,
    "selfVideo" BOOLEAN DEFAULT FALSE,
    suppress BOOLEAN DEFAULT FALSE,
    "requestToSpeakTimestamp" TIMESTAMPTZ,
    "connectedAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "VoiceState_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "VoiceState_serverId_fkey" 
        FOREIGN KEY ("serverId") REFERENCES "Server"(id) ON DELETE CASCADE,
    CONSTRAINT "VoiceState_channelId_fkey" 
        FOREIGN KEY ("channelId") REFERENCES "Channel"(id) ON DELETE SET NULL,
    UNIQUE ("userId", "serverId")
);

CREATE INDEX IF NOT EXISTS "VoiceState_channelId_idx" ON "VoiceState"("channelId");
CREATE INDEX IF NOT EXISTS "VoiceState_sessionId_idx" ON "VoiceState"("sessionId");

-- Create MessageAttachment table
CREATE TABLE IF NOT EXISTS "MessageAttachment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "messageId" TEXT NOT NULL,
    filename TEXT NOT NULL,
    description TEXT,
    "contentType" TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    "proxyUrl" TEXT NOT NULL,
    height INTEGER,
    width INTEGER,
    ephemeral BOOLEAN DEFAULT FALSE,
    duration REAL,
    waveform TEXT,
    flags INTEGER DEFAULT 0,
    
    CONSTRAINT "MessageAttachment_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "Message"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MessageAttachment_messageId_idx" ON "MessageAttachment"("messageId");

-- Create MessageEmbed table
CREATE TABLE IF NOT EXISTS "MessageEmbed" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "messageId" TEXT NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'rich',
    description TEXT,
    url TEXT,
    timestamp TIMESTAMPTZ,
    color INTEGER,
    footer JSONB,
    image JSONB,
    thumbnail JSONB,
    video JSONB,
    provider JSONB,
    author JSONB,
    fields JSONB,
    
    CONSTRAINT "MessageEmbed_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "Message"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "MessageEmbed_messageId_idx" ON "MessageEmbed"("messageId");

-- Create MessageReference table
CREATE TABLE IF NOT EXISTS "MessageReference" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT,
    "serverId" TEXT,
    "referencedMessageId" TEXT,
    type INTEGER DEFAULT 0,
    "failIfNotExists" BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT "MessageReference_messageId_fkey" 
        FOREIGN KEY ("messageId") REFERENCES "Message"(id) ON DELETE CASCADE,
    CONSTRAINT "MessageReference_referencedMessageId_fkey" 
        FOREIGN KEY ("referencedMessageId") REFERENCES "Message"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "MessageReference_messageId_idx" ON "MessageReference"("messageId");
CREATE INDEX IF NOT EXISTS "MessageReference_referencedMessageId_idx" ON "MessageReference"("referencedMessageId");

-- Create ServerEmoji table
CREATE TABLE IF NOT EXISTS "ServerEmoji" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    "requireColons" BOOLEAN DEFAULT TRUE,
    managed BOOLEAN DEFAULT FALSE,
    animated BOOLEAN DEFAULT FALSE,
    available BOOLEAN DEFAULT TRUE,
    roles JSONB,
    "user" JSONB,
    
    CONSTRAINT "ServerEmoji_serverId_fkey" 
        FOREIGN KEY ("serverId") REFERENCES "Server"(id) ON DELETE CASCADE,
    UNIQUE ("serverId", name)
);

CREATE INDEX IF NOT EXISTS "ServerEmoji_serverId_idx" ON "ServerEmoji"("serverId");

-- Create ServerSticker table
CREATE TABLE IF NOT EXISTS "ServerSticker" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT NOT NULL,
    type INTEGER DEFAULT 1,
    "formatType" INTEGER NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    "sortValue" INTEGER,
    
    CONSTRAINT "ServerSticker_serverId_fkey" 
        FOREIGN KEY ("serverId") REFERENCES "Server"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ServerSticker_serverId_idx" ON "ServerSticker"("serverId");
CREATE INDEX IF NOT EXISTS "ServerSticker_type_idx" ON "ServerSticker"(type);

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT NOT NULL,
    "userId" TEXT,
    "targetId" TEXT,
    "actionType" INTEGER NOT NULL,
    options JSONB,
    reason TEXT,
    changes JSONB,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "AuditLog_serverId_fkey" 
        FOREIGN KEY ("serverId") REFERENCES "Server"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_serverId_idx" ON "AuditLog"("serverId");
CREATE INDEX IF NOT EXISTS "AuditLog_actionType_idx" ON "AuditLog"("actionType");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Create Analytics tables with proper structure for TimescaleDB
CREATE TABLE IF NOT EXISTS "MessageAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageCount" INTEGER DEFAULT 1,
    "characterCount" INTEGER DEFAULT 0,
    "wordCount" INTEGER DEFAULT 0,
    "attachmentCount" INTEGER DEFAULT 0,
    "mentionCount" INTEGER DEFAULT 0,
    "reactionCount" INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "MessageAnalytics_timestamp_idx" ON "MessageAnalytics"(timestamp);
CREATE INDEX IF NOT EXISTS "MessageAnalytics_serverId_timestamp_idx" ON "MessageAnalytics"("serverId", timestamp);
CREATE INDEX IF NOT EXISTS "MessageAnalytics_channelId_timestamp_idx" ON "MessageAnalytics"("channelId", timestamp);
CREATE INDEX IF NOT EXISTS "MessageAnalytics_userId_timestamp_idx" ON "MessageAnalytics"("userId", timestamp);

CREATE TABLE IF NOT EXISTS "VoiceAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "VoiceAnalytics_timestamp_idx" ON "VoiceAnalytics"(timestamp);
CREATE INDEX IF NOT EXISTS "VoiceAnalytics_serverId_timestamp_idx" ON "VoiceAnalytics"("serverId", timestamp);
CREATE INDEX IF NOT EXISTS "VoiceAnalytics_channelId_timestamp_idx" ON "VoiceAnalytics"("channelId", timestamp);
CREATE INDEX IF NOT EXISTS "VoiceAnalytics_userId_timestamp_idx" ON "VoiceAnalytics"("userId", timestamp);

CREATE TABLE IF NOT EXISTS "ServerAnalytics" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "serverId" TEXT NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "onlineCount" INTEGER NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "voiceMinutes" INTEGER NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "ServerAnalytics_serverId_fkey" 
        FOREIGN KEY ("serverId") REFERENCES "Server"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ServerAnalytics_timestamp_idx" ON "ServerAnalytics"(timestamp);
CREATE INDEX IF NOT EXISTS "ServerAnalytics_serverId_timestamp_idx" ON "ServerAnalytics"("serverId", timestamp);

-- Add performance optimization indexes

-- Full-text search index for messages
CREATE INDEX IF NOT EXISTS idx_message_search 
ON "Message" USING GIN (to_tsvector('english', content));

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_activity_composite
ON "UserActivity" ("userId", type, "createdAt");

CREATE INDEX IF NOT EXISTS idx_voice_state_composite
ON "VoiceState" ("channelId", "connectedAt") WHERE "channelId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_analytics_hour
ON "MessageAnalytics" (date_trunc('hour', timestamp), "serverId");

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_with_attachments
ON "Message" ("channelId", "createdAt") WHERE attachments IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_active_voice_states
ON "VoiceState" ("serverId", "channelId", "connectedAt") WHERE "channelId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_friendship_active
ON "Friendship" ("initiatorId", "receiverId") WHERE status = 'ACCEPTED';

CREATE INDEX IF NOT EXISTS idx_server_member_active
ON "ServerMember" ("serverId", "joinedAt") WHERE pending = FALSE;

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables that need updated_at tracking
DROP TRIGGER IF EXISTS update_user_presence_updated_at ON "UserPresence";
CREATE TRIGGER update_user_presence_updated_at 
    BEFORE UPDATE ON "UserPresence" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friendship_updated_at ON "Friendship";
CREATE TRIGGER update_friendship_updated_at 
    BEFORE UPDATE ON "Friendship" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_state_updated_at ON "VoiceState";
CREATE TRIGGER update_voice_state_updated_at 
    BEFORE UPDATE ON "VoiceState" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;