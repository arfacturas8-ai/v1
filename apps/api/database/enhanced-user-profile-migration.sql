-- Enhanced User Profile System Migration
-- This migration extends the existing user table and creates additional profile-related tables

-- Extend the existing users table with additional profile fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "occupation" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "education" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "birthDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interests" JSONB DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialLinks" JSONB DEFAULT '[]';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacySettings" JSONB DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileViews" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "followersCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "followingCount" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "achievementPoints" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompleteness" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deactivationReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deactivationFeedback" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "reactivationDate" TIMESTAMP;

-- Create indexes for the new user fields
CREATE INDEX IF NOT EXISTS "User_location_idx" ON "User"("location");
CREATE INDEX IF NOT EXISTS "User_occupation_idx" ON "User"("occupation");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_profileViews_idx" ON "User"("profileViews");
CREATE INDEX IF NOT EXISTS "User_achievementPoints_idx" ON "User"("achievementPoints");
CREATE INDEX IF NOT EXISTS "User_profileCompleteness_idx" ON "User"("profileCompleteness");

-- Full-text search index for user search functionality
CREATE INDEX IF NOT EXISTS "User_search_idx" ON "User" USING gin(
  to_tsvector('english', 
    COALESCE("displayName", '') || ' ' || 
    COALESCE("username", '') || ' ' || 
    COALESCE("bio", '') || ' ' ||
    COALESCE("location", '') || ' ' ||
    COALESCE("occupation", '')
  )
);

-- User Profiles Extended Information Table
CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "theme" TEXT DEFAULT 'light',
  "timezone" TEXT DEFAULT 'UTC',
  "language" TEXT DEFAULT 'en',
  "profileBadges" JSONB DEFAULT '[]',
  "customFields" JSONB DEFAULT '{}',
  "profileTags" TEXT[] DEFAULT '{}',
  "profileStatus" TEXT DEFAULT 'active',
  "profileMessage" TEXT,
  "lastProfileUpdate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "profileColor" TEXT,
  "profileBackground" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS "UserAchievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "earnedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "progress" INTEGER DEFAULT 100,
  "metadata" JSONB DEFAULT '{}',

  CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Achievements Definition Table
CREATE TABLE IF NOT EXISTS "Achievement" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT,
  "category" TEXT NOT NULL DEFAULT 'general',
  "type" TEXT NOT NULL DEFAULT 'milestone',
  "requirements" JSONB NOT NULL DEFAULT '{}',
  "points" INTEGER NOT NULL DEFAULT 0,
  "rarity" TEXT NOT NULL DEFAULT 'common',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- User Activity Timeline Table
CREATE TABLE IF NOT EXISTS "UserActivityTimeline" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "activityData" JSONB NOT NULL DEFAULT '{}',
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "entityId" TEXT,
  "entityType" TEXT,
  "points" INTEGER DEFAULT 0,

  CONSTRAINT "UserActivityTimeline_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserActivityTimeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- User Follow Relationships Table
CREATE TABLE IF NOT EXISTS "UserFollow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "followingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserFollow_followerId_followingId_key" UNIQUE("followerId", "followingId")
);

-- User Blocked Relationships Table
CREATE TABLE IF NOT EXISTS "UserBlocked" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserBlocked_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserBlocked_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserBlocked_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserBlocked_blockerId_blockedId_key" UNIQUE("blockerId", "blockedId")
);

-- User Privacy Settings Table
CREATE TABLE IF NOT EXISTS "UserPrivacySettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "profileVisibility" TEXT NOT NULL DEFAULT 'public',
  "emailVisibility" TEXT NOT NULL DEFAULT 'private',
  "phoneVisibility" TEXT NOT NULL DEFAULT 'private',
  "birthdateVisibility" TEXT NOT NULL DEFAULT 'private',
  "locationVisibility" TEXT NOT NULL DEFAULT 'public',
  "websiteVisibility" TEXT NOT NULL DEFAULT 'public',
  "socialLinksVisibility" TEXT NOT NULL DEFAULT 'public',
  "followersVisibility" TEXT NOT NULL DEFAULT 'public',
  "followingVisibility" TEXT NOT NULL DEFAULT 'public',
  "activityVisibility" TEXT NOT NULL DEFAULT 'public',
  "achievementsVisibility" TEXT NOT NULL DEFAULT 'public',
  "allowFollows" BOOLEAN NOT NULL DEFAULT true,
  "allowMessages" TEXT NOT NULL DEFAULT 'followers',
  "allowMentions" TEXT NOT NULL DEFAULT 'everyone',
  "indexProfile" BOOLEAN NOT NULL DEFAULT true,
  "allowDiscovery" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- User Statistics Table for caching aggregated stats
CREATE TABLE IF NOT EXISTS "UserStatistics" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "totalPosts" INTEGER DEFAULT 0,
  "totalComments" INTEGER DEFAULT 0,
  "totalUpvotes" INTEGER DEFAULT 0,
  "totalDownvotes" INTEGER DEFAULT 0,
  "totalAwards" INTEGER DEFAULT 0,
  "totalFollowers" INTEGER DEFAULT 0,
  "totalFollowing" INTEGER DEFAULT 0,
  "totalViews" INTEGER DEFAULT 0,
  "totalMessages" INTEGER DEFAULT 0,
  "accountAgeInDays" INTEGER DEFAULT 0,
  "lastCalculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserStatistics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserStatistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "UserProfile_userId_idx" ON "UserProfile"("userId");
CREATE INDEX IF NOT EXISTS "UserProfile_theme_idx" ON "UserProfile"("theme");

CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX IF NOT EXISTS "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");
CREATE INDEX IF NOT EXISTS "UserAchievement_earnedAt_idx" ON "UserAchievement"("earnedAt");
CREATE INDEX IF NOT EXISTS "UserAchievement_isVisible_idx" ON "UserAchievement"("isVisible");

CREATE INDEX IF NOT EXISTS "Achievement_category_idx" ON "Achievement"("category");
CREATE INDEX IF NOT EXISTS "Achievement_type_idx" ON "Achievement"("type");
CREATE INDEX IF NOT EXISTS "Achievement_rarity_idx" ON "Achievement"("rarity");
CREATE INDEX IF NOT EXISTS "Achievement_isActive_idx" ON "Achievement"("isActive");

CREATE INDEX IF NOT EXISTS "UserActivityTimeline_userId_idx" ON "UserActivityTimeline"("userId");
CREATE INDEX IF NOT EXISTS "UserActivityTimeline_timestamp_idx" ON "UserActivityTimeline"("timestamp");
CREATE INDEX IF NOT EXISTS "UserActivityTimeline_activityType_idx" ON "UserActivityTimeline"("activityType");
CREATE INDEX IF NOT EXISTS "UserActivityTimeline_isPublic_idx" ON "UserActivityTimeline"("isPublic");
CREATE INDEX IF NOT EXISTS "UserActivityTimeline_entityType_idx" ON "UserActivityTimeline"("entityType");

CREATE INDEX IF NOT EXISTS "UserFollow_followerId_idx" ON "UserFollow"("followerId");
CREATE INDEX IF NOT EXISTS "UserFollow_followingId_idx" ON "UserFollow"("followingId");
CREATE INDEX IF NOT EXISTS "UserFollow_createdAt_idx" ON "UserFollow"("createdAt");

CREATE INDEX IF NOT EXISTS "UserBlocked_blockerId_idx" ON "UserBlocked"("blockerId");
CREATE INDEX IF NOT EXISTS "UserBlocked_blockedId_idx" ON "UserBlocked"("blockedId");
CREATE INDEX IF NOT EXISTS "UserBlocked_createdAt_idx" ON "UserBlocked"("createdAt");

CREATE INDEX IF NOT EXISTS "UserPrivacySettings_userId_idx" ON "UserPrivacySettings"("userId");
CREATE INDEX IF NOT EXISTS "UserPrivacySettings_profileVisibility_idx" ON "UserPrivacySettings"("profileVisibility");

CREATE INDEX IF NOT EXISTS "UserStatistics_userId_idx" ON "UserStatistics"("userId");
CREATE INDEX IF NOT EXISTS "UserStatistics_lastCalculatedAt_idx" ON "UserStatistics"("lastCalculatedAt");

-- Insert default achievements
INSERT INTO "Achievement" ("id", "name", "description", "icon", "category", "type", "requirements", "points", "rarity") VALUES
('ach_welcome', 'Welcome!', 'Successfully created an account', '🎉', 'onboarding', 'milestone', '{"action": "account_created"}', 10, 'common'),
('ach_first_post', 'First Post', 'Created your first post', '📝', 'content', 'milestone', '{"action": "post_created", "count": 1}', 25, 'common'),
('ach_first_comment', 'First Comment', 'Made your first comment', '💬', 'social', 'milestone', '{"action": "comment_created", "count": 1}', 15, 'common'),
('ach_profile_complete', 'Profile Complete', 'Completed your user profile', '✅', 'profile', 'milestone', '{"profile_completeness": 80}', 50, 'common'),
('ach_first_follower', 'First Follower', 'Gained your first follower', '👥', 'social', 'milestone', '{"followers": 1}', 30, 'common'),
('ach_active_user', 'Active User', 'Logged in for 7 days in a row', '🔥', 'engagement', 'streak', '{"login_streak": 7}', 100, 'uncommon'),
('ach_content_creator', 'Content Creator', 'Created 10 posts', '🏆', 'content', 'count', '{"posts": 10}', 150, 'uncommon'),
('ach_socialite', 'Socialite', 'Gained 50 followers', '🌟', 'social', 'count', '{"followers": 50}', 200, 'rare'),
('ach_influencer', 'Influencer', 'Gained 500 followers', '💎', 'social', 'count', '{"followers": 500}', 1000, 'legendary'),
('ach_verified', 'Verified User', 'Account verified by administrators', '✅', 'status', 'special', '{"verified": true}', 500, 'epic')
ON CONFLICT ("id") DO NOTHING;

-- Create triggers to update user statistics automatically

-- Function to update user follower counts
CREATE OR REPLACE FUNCTION update_user_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE "User" SET "followingCount" = "followingCount" + 1 WHERE "id" = NEW."followerId";
    -- Increment followers count for followed user
    UPDATE "User" SET "followersCount" = "followersCount" + 1 WHERE "id" = NEW."followingId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE "User" SET "followingCount" = GREATEST("followingCount" - 1, 0) WHERE "id" = OLD."followerId";
    -- Decrement followers count for followed user
    UPDATE "User" SET "followersCount" = GREATEST("followersCount" - 1, 0) WHERE "id" = OLD."followingId";
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower count updates
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON "UserFollow";
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON "UserFollow"
  FOR EACH ROW EXECUTE FUNCTION update_user_follower_counts();

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  completeness INTEGER := 0;
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM "User" WHERE "id" = user_id;
  
  -- Base profile info (40 points)
  IF user_record."displayName" IS NOT NULL AND user_record."displayName" != '' THEN
    completeness := completeness + 10;
  END IF;
  
  IF user_record."bio" IS NOT NULL AND user_record."bio" != '' THEN
    completeness := completeness + 10;
  END IF;
  
  IF user_record."avatar" IS NOT NULL AND user_record."avatar" != '' THEN
    completeness := completeness + 10;
  END IF;
  
  IF user_record."location" IS NOT NULL AND user_record."location" != '' THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."website" IS NOT NULL AND user_record."website" != '' THEN
    completeness := completeness + 5;
  END IF;
  
  -- Extended profile info (30 points)
  IF user_record."occupation" IS NOT NULL AND user_record."occupation" != '' THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."education" IS NOT NULL AND user_record."education" != '' THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."birthDate" IS NOT NULL THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."interests" IS NOT NULL AND jsonb_array_length(user_record."interests") > 0 THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."socialLinks" IS NOT NULL AND jsonb_array_length(user_record."socialLinks") > 0 THEN
    completeness := completeness + 5;
  END IF;
  
  IF user_record."pronouns" IS NOT NULL AND user_record."pronouns" != '' THEN
    completeness := completeness + 5;
  END IF;
  
  -- Verification and activity (30 points)
  IF user_record."emailVerified" = true THEN
    completeness := completeness + 15;
  END IF;
  
  IF user_record."phoneVerified" = true THEN
    completeness := completeness + 10;
  END IF;
  
  IF user_record."isVerified" = true THEN
    completeness := completeness + 5;
  END IF;
  
  RETURN LEAST(completeness, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completeness automatically
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW."profileCompleteness" := calculate_profile_completeness(NEW."id");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile completeness updates
DROP TRIGGER IF EXISTS trigger_update_profile_completeness ON "User";
CREATE TRIGGER trigger_update_profile_completeness
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
  user_id TEXT,
  activity_type TEXT,
  activity_data JSONB DEFAULT '{}',
  entity_id TEXT DEFAULT NULL,
  entity_type TEXT DEFAULT NULL,
  points INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true
)
RETURNS TEXT AS $$
DECLARE
  activity_id TEXT;
BEGIN
  activity_id := gen_random_uuid()::TEXT;
  
  INSERT INTO "UserActivityTimeline" (
    "id", "userId", "activityType", "activityData", 
    "entityId", "entityType", "points", "isPublic"
  ) VALUES (
    activity_id, user_id, activity_type, activity_data,
    entity_id, entity_type, points, is_public
  );
  
  -- Update user achievement points
  UPDATE "User" SET "achievementPoints" = "achievementPoints" + points WHERE "id" = user_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing users to have default privacy settings and profiles
INSERT INTO "UserPrivacySettings" ("id", "userId")
SELECT gen_random_uuid()::TEXT, "id" FROM "User" 
WHERE "id" NOT IN (SELECT "userId" FROM "UserPrivacySettings")
ON CONFLICT DO NOTHING;

INSERT INTO "UserProfile" ("id", "userId")
SELECT gen_random_uuid()::TEXT, "id" FROM "User" 
WHERE "id" NOT IN (SELECT "userId" FROM "UserProfile")
ON CONFLICT DO NOTHING;

-- Update profile completeness for existing users
UPDATE "User" SET "profileCompleteness" = calculate_profile_completeness("id");

-- Create view for public user profiles with privacy filtering
CREATE OR REPLACE VIEW "PublicUserProfile" AS
SELECT 
  u."id",
  u."username",
  u."displayName",
  CASE 
    WHEN ups."profileVisibility" = 'public' THEN u."avatar"
    ELSE NULL 
  END as "avatar",
  CASE 
    WHEN ups."profileVisibility" = 'public' THEN u."banner"
    ELSE NULL 
  END as "banner",
  CASE 
    WHEN ups."profileVisibility" = 'public' THEN u."bio"
    ELSE NULL 
  END as "bio",
  CASE 
    WHEN ups."locationVisibility" = 'public' THEN u."location"
    ELSE NULL 
  END as "location",
  CASE 
    WHEN ups."websiteVisibility" = 'public' THEN u."website"
    ELSE NULL 
  END as "website",
  u."isVerified",
  u."premiumType",
  u."createdAt",
  u."lastSeenAt",
  CASE 
    WHEN ups."followersVisibility" = 'public' THEN u."followersCount"
    ELSE NULL 
  END as "followersCount",
  CASE 
    WHEN ups."followingVisibility" = 'public' THEN u."followingCount"
    ELSE NULL 
  END as "followingCount",
  u."profileViews",
  u."achievementPoints",
  ups."profileVisibility",
  ups."allowFollows",
  ups."allowDiscovery"
FROM "User" u
LEFT JOIN "UserPrivacySettings" ups ON u."id" = ups."userId"
WHERE u."isActive" = true;

COMMIT;