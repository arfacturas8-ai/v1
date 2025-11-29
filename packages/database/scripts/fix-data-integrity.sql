-- CRYB Platform Data Integrity and Cascade Delete Fixes
-- This script addresses cascading delete issues, missing constraints, and data integrity problems

-- ===========================
-- 1. CASCADE DELETE FIXES
-- ===========================

-- Fix Comment cascade delete issue - should cascade when user is deleted
-- Currently set to RESTRICT which can cause orphaned comments
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_userId_fkey";
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

-- Ensure Message replies cascade properly when parent is deleted
-- Add proper cascade for reply relationships
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_replyToId_fkey";
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES "Message"(id) ON DELETE SET NULL;

-- Fix MessageReference constraints for proper cleanup
ALTER TABLE "MessageReference" DROP CONSTRAINT IF EXISTS "MessageReference_referencedMessageId_fkey";
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_referencedMessageId_fkey" 
    FOREIGN KEY ("referencedMessageId") REFERENCES "Message"(id) ON DELETE SET NULL;

-- ===========================
-- 2. MISSING CONSTRAINTS
-- ===========================

-- Add check constraints for data validation
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS chk_user_discriminator 
    CHECK (discriminator ~ '^\d{4}$');

ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS chk_user_flags 
    CHECK (flags >= 0);

ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS chk_user_public_flags 
    CHECK ("publicFlags" >= 0);

-- Ensure premium dates are logical
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS chk_premium_dates 
    CHECK ("premiumUntil" IS NULL OR "premiumUntil" > "createdAt");

-- Channel constraints
ALTER TABLE "Channel" ADD CONSTRAINT IF NOT EXISTS chk_channel_position 
    CHECK (position >= 0);

ALTER TABLE "Channel" ADD CONSTRAINT IF NOT EXISTS chk_channel_slow_mode 
    CHECK ("slowMode" >= 0 AND "slowMode" <= 21600); -- Max 6 hours

ALTER TABLE "Channel" ADD CONSTRAINT IF NOT EXISTS chk_channel_user_limit 
    CHECK ("userLimit" IS NULL OR ("userLimit" > 0 AND "userLimit" <= 99));

-- Message constraints
ALTER TABLE "Message" ADD CONSTRAINT IF NOT EXISTS chk_message_type 
    CHECK (type >= 0 AND type <= 24); -- Valid Discord message types

ALTER TABLE "Message" ADD CONSTRAINT IF NOT EXISTS chk_message_flags 
    CHECK (flags >= 0);

-- Server constraints
ALTER TABLE "Server" ADD CONSTRAINT IF NOT EXISTS chk_server_verification_level 
    CHECK ("verificationLevel" >= 0 AND "verificationLevel" <= 4);

ALTER TABLE "Server" ADD CONSTRAINT IF NOT EXISTS chk_server_mfa_level 
    CHECK ("mfaLevel" >= 0 AND "mfaLevel" <= 1);

ALTER TABLE "Server" ADD CONSTRAINT IF NOT EXISTS chk_server_explicit_content_filter 
    CHECK ("explicitContentFilter" >= 0 AND "explicitContentFilter" <= 2);

ALTER TABLE "Server" ADD CONSTRAINT IF NOT EXISTS chk_server_max_members 
    CHECK ("maxMembers" > 0 AND "maxMembers" <= 500000);

-- Post and Comment constraints
ALTER TABLE "Post" ADD CONSTRAINT IF NOT EXISTS chk_post_score 
    CHECK (score >= -2147483648 AND score <= 2147483647);

ALTER TABLE "Comment" ADD CONSTRAINT IF NOT EXISTS chk_comment_score 
    CHECK (score >= -2147483648 AND score <= 2147483647);

-- Vote constraints
ALTER TABLE "Vote" ADD CONSTRAINT IF NOT EXISTS chk_vote_value 
    CHECK (value IN (-1, 0, 1));

-- Community constraints  
ALTER TABLE "Community" ADD CONSTRAINT IF NOT EXISTS chk_community_member_count 
    CHECK ("memberCount" >= 0);

-- Role constraints
ALTER TABLE "Role" ADD CONSTRAINT IF NOT EXISTS chk_role_position 
    CHECK (position >= 0);

-- File constraints
ALTER TABLE "UploadedFile" ADD CONSTRAINT IF NOT EXISTS chk_file_size 
    CHECK (size > 0 AND size <= 268435456); -- 256MB max

ALTER TABLE "UploadedFile" ADD CONSTRAINT IF NOT EXISTS chk_file_dimensions 
    CHECK (width IS NULL OR width > 0);

ALTER TABLE "UploadedFile" ADD CONSTRAINT IF NOT EXISTS chk_file_duration 
    CHECK (duration IS NULL OR duration >= 0);

-- Security constraints
ALTER TABLE "SecurityLog" ADD CONSTRAINT IF NOT EXISTS chk_security_risk_score 
    CHECK ("riskScore" >= 0 AND "riskScore" <= 100);

-- Marketplace constraints
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT IF NOT EXISTS chk_listing_views 
    CHECK (views >= 0);

ALTER TABLE "MarketplaceBid" ADD CONSTRAINT IF NOT EXISTS chk_bid_expires_future 
    CHECK ("expiresAt" IS NULL OR "expiresAt" > "createdAt");

-- Staking constraints
ALTER TABLE "StakingPool" ADD CONSTRAINT IF NOT EXISTS chk_staking_apr 
    CHECK (apr >= 0 AND apr <= 1000); -- Max 1000% APR

ALTER TABLE "UserStake" ADD CONSTRAINT IF NOT EXISTS chk_stake_locked_until 
    CHECK ("lockedUntil" IS NULL OR "lockedUntil" > "createdAt");

-- ===========================
-- 3. SENSIBLE DEFAULTS
-- ===========================

-- Add sensible defaults for timestamp fields that are missing them
ALTER TABLE "MessageAttachment" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "MessageEmbed" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "MessageReference" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Set proper defaults for commonly used fields
ALTER TABLE "Message" ALTER COLUMN "mentionEveryone" SET DEFAULT false;
ALTER TABLE "Message" ALTER COLUMN "tts" SET DEFAULT false;
ALTER TABLE "Message" ALTER COLUMN "isPinned" SET DEFAULT false;

-- Server emoji defaults
ALTER TABLE "ServerEmoji" ALTER COLUMN "requireColons" SET DEFAULT true;
ALTER TABLE "ServerEmoji" ALTER COLUMN "managed" SET DEFAULT false;
ALTER TABLE "ServerEmoji" ALTER COLUMN "animated" SET DEFAULT false;
ALTER TABLE "ServerEmoji" ALTER COLUMN "available" SET DEFAULT true;

-- File upload defaults
ALTER TABLE "UploadedFile" ALTER COLUMN "uploadType" SET DEFAULT 'single';
ALTER TABLE "UploadedFile" ALTER COLUMN "processed" SET DEFAULT false;
ALTER TABLE "UploadedFile" ALTER COLUMN "scanPassed" SET DEFAULT false;
ALTER TABLE "UploadedFile" ALTER COLUMN "validated" SET DEFAULT false;
ALTER TABLE "UploadedFile" ALTER COLUMN "validationErrors" SET DEFAULT '{}';
ALTER TABLE "UploadedFile" ALTER COLUMN "securityFlags" SET DEFAULT 0;

-- Session defaults
ALTER TABLE "ChunkedUploadSession" ALTER COLUMN "status" SET DEFAULT 'active';
ALTER TABLE "ChunkedUploadSession" ALTER COLUMN "completed" SET DEFAULT false;
ALTER TABLE "ChunkedUploadSession" ALTER COLUMN "uploadedChunks" SET DEFAULT 0;

-- Voice state defaults
ALTER TABLE "VoiceState" ALTER COLUMN "deaf" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "mute" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "selfDeaf" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "selfMute" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "selfStream" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "selfVideo" SET DEFAULT false;
ALTER TABLE "VoiceState" ALTER COLUMN "suppress" SET DEFAULT false;

-- Marketplace defaults
ALTER TABLE "MarketplaceListing" ALTER COLUMN "currency" SET DEFAULT 'ETH';
ALTER TABLE "MarketplaceListing" ALTER COLUMN "listingType" SET DEFAULT 'FIXED_PRICE';
ALTER TABLE "MarketplaceListing" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "MarketplaceListing" ALTER COLUMN "views" SET DEFAULT 0;

ALTER TABLE "MarketplaceBid" ALTER COLUMN "currency" SET DEFAULT 'ETH';
ALTER TABLE "MarketplaceBid" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- NFT defaults
ALTER TABLE "NFTCollection" ALTER COLUMN "chain" SET DEFAULT 'ethereum';
ALTER TABLE "NFTCollection" ALTER COLUMN "verified" SET DEFAULT false;

ALTER TABLE "UserNFT" ALTER COLUMN "verified" SET DEFAULT false;

-- Token defaults
ALTER TABLE "Token" ALTER COLUMN "verified" SET DEFAULT false;
ALTER TABLE "TokenGatingRule" ALTER COLUMN "isActive" SET DEFAULT true;
ALTER TABLE "TokenRequirement" ALTER COLUMN "chain" SET DEFAULT 'ethereum';
ALTER TABLE "NFTRequirement" ALTER COLUMN "minTokens" SET DEFAULT 1;

-- Analytics defaults
ALTER TABLE "MessageAnalytics" ALTER COLUMN "messageCount" SET DEFAULT 1;
ALTER TABLE "MessageAnalytics" ALTER COLUMN "characterCount" SET DEFAULT 0;
ALTER TABLE "MessageAnalytics" ALTER COLUMN "wordCount" SET DEFAULT 0;
ALTER TABLE "MessageAnalytics" ALTER COLUMN "attachmentCount" SET DEFAULT 0;
ALTER TABLE "MessageAnalytics" ALTER COLUMN "mentionCount" SET DEFAULT 0;
ALTER TABLE "MessageAnalytics" ALTER COLUMN "reactionCount" SET DEFAULT 0;

-- File analytics defaults
ALTER TABLE "FileAnalytics" ALTER COLUMN "viewCount" SET DEFAULT 0;
ALTER TABLE "FileAnalytics" ALTER COLUMN "uniqueViews" SET DEFAULT 0;
ALTER TABLE "FileAnalytics" ALTER COLUMN "downloadCount" SET DEFAULT 0;
ALTER TABLE "FileAnalytics" ALTER COLUMN "streamCount" SET DEFAULT 0;
ALTER TABLE "FileAnalytics" ALTER COLUMN "shareCount" SET DEFAULT 0;
ALTER TABLE "FileAnalytics" ALTER COLUMN "bandwidthUsed" SET DEFAULT 0;

-- Governance defaults
ALTER TABLE "GovernanceProposal" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
ALTER TABLE "GovernanceProposal" ALTER COLUMN "forVotes" SET DEFAULT '0';
ALTER TABLE "GovernanceProposal" ALTER COLUMN "againstVotes" SET DEFAULT '0';
ALTER TABLE "GovernanceProposal" ALTER COLUMN "abstainVotes" SET DEFAULT '0';

-- Staking defaults
ALTER TABLE "StakingPool" ALTER COLUMN "chain" SET DEFAULT 'ethereum';
ALTER TABLE "StakingPool" ALTER COLUMN "totalStaked" SET DEFAULT '0';
ALTER TABLE "StakingPool" ALTER COLUMN "totalRewards" SET DEFAULT '0';
ALTER TABLE "StakingPool" ALTER COLUMN "isActive" SET DEFAULT true;

ALTER TABLE "UserStake" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- ===========================
-- 4. DATA INTEGRITY IMPROVEMENTS
-- ===========================

-- Ensure unique constraints are properly enforced
-- User email uniqueness (handle nulls properly)
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_email_unique" ON "User" (email) WHERE email IS NOT NULL;

-- Wallet address uniqueness
DROP INDEX IF EXISTS "User_walletAddress_key"; 
CREATE UNIQUE INDEX "User_walletAddress_unique" ON "User" ("walletAddress") WHERE "walletAddress" IS NOT NULL;

-- Discord ID uniqueness
DROP INDEX IF EXISTS "User_discord_id_key";
CREATE UNIQUE INDEX "User_discord_id_unique" ON "User" ("discord_id") WHERE "discord_id" IS NOT NULL;

-- GitHub ID uniqueness  
DROP INDEX IF EXISTS "User_github_id_key";
CREATE UNIQUE INDEX "User_github_id_unique" ON "User" ("github_id") WHERE "github_id" IS NOT NULL;

-- Google ID uniqueness
DROP INDEX IF EXISTS "User_google_id_key";
CREATE UNIQUE INDEX "User_google_id_unique" ON "User" ("google_id") WHERE "google_id" IS NOT NULL;

-- Server vanity URL uniqueness
DROP INDEX IF EXISTS "Server_vanityUrlCode_key";
CREATE UNIQUE INDEX "Server_vanityUrlCode_unique" ON "Server" ("vanityUrlCode") WHERE "vanityUrlCode" IS NOT NULL;

-- ===========================
-- 5. TRIGGER FUNCTIONS FOR DATA CONSISTENCY  
-- ===========================

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Community" SET "memberCount" = "memberCount" + 1 
        WHERE id = NEW."communityId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "Community" SET "memberCount" = GREATEST("memberCount" - 1, 0) 
        WHERE id = OLD."communityId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for community member count
DROP TRIGGER IF EXISTS trg_community_member_insert ON "CommunityMember";
CREATE TRIGGER trg_community_member_insert
    AFTER INSERT ON "CommunityMember"
    FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

DROP TRIGGER IF EXISTS trg_community_member_delete ON "CommunityMember";
CREATE TRIGGER trg_community_member_delete
    AFTER DELETE ON "CommunityMember"
    FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Post" SET "commentCount" = "commentCount" + 1 
        WHERE id = NEW."postId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "Post" SET "commentCount" = GREATEST("commentCount" - 1, 0) 
        WHERE id = OLD."postId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post comment count
DROP TRIGGER IF EXISTS trg_post_comment_insert ON "Comment";
CREATE TRIGGER trg_post_comment_insert
    AFTER INSERT ON "Comment"
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

DROP TRIGGER IF EXISTS trg_post_comment_delete ON "Comment";
CREATE TRIGGER trg_post_comment_delete
    AFTER DELETE ON "Comment"
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update statistics after changes
ANALYZE;

-- ===========================
-- INTEGRITY CHECK NOTES:
-- ===========================
--
-- Key improvements made:
-- 1. Fixed cascade delete issues to prevent orphaned records
-- 2. Added comprehensive check constraints for data validation  
-- 3. Set sensible defaults for commonly used fields
-- 4. Improved unique constraint handling for nullable fields
-- 5. Added triggers for maintaining aggregate counts
-- 6. Enhanced referential integrity for complex relationships
--
-- Areas that need application-level handling:
-- 1. User session cleanup (expires_at based)
-- 2. File cleanup based on expiration dates  
-- 3. Marketplace listing status updates
-- 4. Voice state cleanup for disconnected users
-- 5. Analytics data aggregation and archival
-- 6. Notification cleanup for read messages
-- 7. Audit log retention policies
-- 8. Security log monitoring and alerting