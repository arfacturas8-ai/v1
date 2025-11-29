-- Enhanced Reaction System Database Schema
-- This migration adds support for multiple reaction types, analytics, and comprehensive social features

-- Create enum for reaction types
CREATE TYPE reaction_type AS ENUM (
  'like', 'love', 'laugh', 'wow', 'sad', 'angry',
  'upvote', 'downvote',
  'fire', 'rocket', 'heart_eyes', 'thinking', 'clap', 'thumbs_up', 'thumbs_down',
  'custom_emoji'
);

-- Enhanced Reactions table to replace the simple message reactions
CREATE TABLE IF NOT EXISTS enhanced_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Target content (can be post, comment, or message)
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Reaction details
  reaction_type reaction_type NOT NULL,
  custom_emoji_id TEXT, -- For custom emoji reactions
  custom_emoji_name TEXT, -- Unicode emoji or custom name
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only have one reaction per content item
  UNIQUE(user_id, post_id, reaction_type),
  UNIQUE(user_id, comment_id, reaction_type),
  UNIQUE(user_id, message_id, reaction_type),
  
  -- Ensure content is specified
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL AND message_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL AND message_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NULL AND message_id IS NOT NULL)
  )
);

-- Reaction Analytics table for tracking trends and statistics
CREATE TABLE IF NOT EXISTS reaction_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
  content_id TEXT NOT NULL,
  reaction_type reaction_type NOT NULL,
  
  -- Daily statistics
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  
  -- Hourly breakdown (JSON array of 24 hourly counts)
  hourly_breakdown JSONB DEFAULT '[]',
  
  -- Trending metrics
  velocity_score FLOAT DEFAULT 0, -- Rate of change
  engagement_score FLOAT DEFAULT 0, -- Overall engagement metric
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(content_type, content_id, reaction_type, date)
);

-- Reaction Summary table for quick aggregations
CREATE TABLE IF NOT EXISTS reaction_summaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
  content_id TEXT NOT NULL,
  
  -- Total counts per reaction type
  like_count INTEGER DEFAULT 0,
  love_count INTEGER DEFAULT 0,
  laugh_count INTEGER DEFAULT 0,
  wow_count INTEGER DEFAULT 0,
  sad_count INTEGER DEFAULT 0,
  angry_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  rocket_count INTEGER DEFAULT 0,
  heart_eyes_count INTEGER DEFAULT 0,
  thinking_count INTEGER DEFAULT 0,
  clap_count INTEGER DEFAULT 0,
  thumbs_up_count INTEGER DEFAULT 0,
  thumbs_down_count INTEGER DEFAULT 0,
  custom_emoji_count INTEGER DEFAULT 0,
  
  -- Aggregate metrics
  total_reactions INTEGER DEFAULT 0,
  total_unique_users INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  
  -- Performance metrics
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(content_type, content_id)
);

-- User Reaction History for personalization and analytics
CREATE TABLE IF NOT EXISTS user_reaction_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Most used reactions
  favorite_reaction_types JSONB DEFAULT '[]',
  total_reactions_given INTEGER DEFAULT 0,
  total_reactions_received INTEGER DEFAULT 0,
  
  -- Daily activity
  reactions_today INTEGER DEFAULT 0,
  last_reaction_date DATE DEFAULT CURRENT_DATE,
  
  -- Streaks and achievements
  reaction_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  achievement_badges JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Reaction Notifications for real-time engagement
CREATE TABLE IF NOT EXISTS reaction_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reactor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content reference
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
  content_id TEXT NOT NULL,
  
  -- Reaction details
  reaction_type reaction_type NOT NULL,
  custom_emoji_name TEXT,
  
  -- Notification status
  is_read BOOLEAN DEFAULT FALSE,
  is_grouped BOOLEAN DEFAULT FALSE, -- For grouping multiple reactions
  group_id TEXT, -- For grouping notifications
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate notifications
  UNIQUE(recipient_user_id, reactor_user_id, content_type, content_id, reaction_type)
);

-- Trending Reactions for discovery features
CREATE TABLE IF NOT EXISTS trending_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
  content_id TEXT NOT NULL,
  
  -- Trending metrics
  trend_score FLOAT NOT NULL DEFAULT 0,
  reaction_velocity FLOAT DEFAULT 0, -- Reactions per hour
  engagement_rate FLOAT DEFAULT 0, -- Reactions vs views
  
  -- Time windows
  trend_period TEXT DEFAULT '24h' CHECK (trend_period IN ('1h', '6h', '24h', '7d')),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Content preview for trending feeds
  content_preview JSONB,
  
  UNIQUE(content_type, content_id, trend_period)
);

-- Custom Emoji Reactions for server/community specific emojis
CREATE TABLE IF NOT EXISTS custom_emoji_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  emoji_name TEXT NOT NULL,
  emoji_url TEXT NOT NULL,
  emoji_data TEXT, -- Base64 or external URL
  
  -- Scope (server, community, or global)
  server_id TEXT REFERENCES servers(id) ON DELETE CASCADE,
  community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT FALSE,
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Ensure unique emoji names per scope
  UNIQUE(emoji_name, server_id),
  UNIQUE(emoji_name, community_id),
  
  CHECK (
    (server_id IS NOT NULL AND community_id IS NULL) OR
    (server_id IS NULL AND community_id IS NOT NULL) OR
    (server_id IS NULL AND community_id IS NULL AND is_global = TRUE)
  )
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_user_id ON enhanced_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_post_id ON enhanced_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_comment_id ON enhanced_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_message_id ON enhanced_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_type ON enhanced_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_reactions_created_at ON enhanced_reactions(created_at);

CREATE INDEX IF NOT EXISTS idx_reaction_analytics_content ON reaction_analytics(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reaction_analytics_date ON reaction_analytics(date);
CREATE INDEX IF NOT EXISTS idx_reaction_analytics_velocity ON reaction_analytics(velocity_score DESC);

CREATE INDEX IF NOT EXISTS idx_reaction_summaries_content ON reaction_summaries(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reaction_summaries_engagement ON reaction_summaries(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_reaction_summaries_total ON reaction_summaries(total_reactions DESC);

CREATE INDEX IF NOT EXISTS idx_user_reaction_history_user ON user_reaction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reaction_history_updated ON user_reaction_history(updated_at);

CREATE INDEX IF NOT EXISTS idx_reaction_notifications_recipient ON reaction_notifications(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reaction_notifications_created ON reaction_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_reaction_notifications_group ON reaction_notifications(group_id);

CREATE INDEX IF NOT EXISTS idx_trending_reactions_score ON trending_reactions(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_reactions_period ON trending_reactions(trend_period, calculated_at);
CREATE INDEX IF NOT EXISTS idx_trending_reactions_expires ON trending_reactions(expires_at);

CREATE INDEX IF NOT EXISTS idx_custom_emoji_server ON custom_emoji_reactions(server_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_emoji_community ON custom_emoji_reactions(community_id, is_active);
CREATE INDEX IF NOT EXISTS idx_custom_emoji_usage ON custom_emoji_reactions(usage_count DESC);

-- Functions for updating reaction counts and analytics

-- Function to update reaction summary when reactions change
CREATE OR REPLACE FUNCTION update_reaction_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update reaction summary
  INSERT INTO reaction_summaries (content_type, content_id, like_count, love_count, laugh_count, wow_count, sad_count, angry_count, upvote_count, downvote_count, fire_count, rocket_count, heart_eyes_count, thinking_count, clap_count, thumbs_up_count, thumbs_down_count, custom_emoji_count, total_reactions, total_unique_users)
  VALUES (
    CASE 
      WHEN NEW.post_id IS NOT NULL THEN 'post'
      WHEN NEW.comment_id IS NOT NULL THEN 'comment'
      WHEN NEW.message_id IS NOT NULL THEN 'message'
    END,
    COALESCE(NEW.post_id, NEW.comment_id, NEW.message_id),
    CASE WHEN NEW.reaction_type = 'like' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'love' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'laugh' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'wow' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'sad' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'angry' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'upvote' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'downvote' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'rocket' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'heart_eyes' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'thinking' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'thumbs_up' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'thumbs_down' THEN 1 ELSE 0 END,
    CASE WHEN NEW.reaction_type = 'custom_emoji' THEN 1 ELSE 0 END,
    1, -- total_reactions
    1 -- total_unique_users (will be corrected below)
  )
  ON CONFLICT (content_type, content_id) DO UPDATE SET
    like_count = reaction_summaries.like_count + CASE WHEN NEW.reaction_type = 'like' THEN 1 ELSE 0 END,
    love_count = reaction_summaries.love_count + CASE WHEN NEW.reaction_type = 'love' THEN 1 ELSE 0 END,
    laugh_count = reaction_summaries.laugh_count + CASE WHEN NEW.reaction_type = 'laugh' THEN 1 ELSE 0 END,
    wow_count = reaction_summaries.wow_count + CASE WHEN NEW.reaction_type = 'wow' THEN 1 ELSE 0 END,
    sad_count = reaction_summaries.sad_count + CASE WHEN NEW.reaction_type = 'sad' THEN 1 ELSE 0 END,
    angry_count = reaction_summaries.angry_count + CASE WHEN NEW.reaction_type = 'angry' THEN 1 ELSE 0 END,
    upvote_count = reaction_summaries.upvote_count + CASE WHEN NEW.reaction_type = 'upvote' THEN 1 ELSE 0 END,
    downvote_count = reaction_summaries.downvote_count + CASE WHEN NEW.reaction_type = 'downvote' THEN 1 ELSE 0 END,
    fire_count = reaction_summaries.fire_count + CASE WHEN NEW.reaction_type = 'fire' THEN 1 ELSE 0 END,
    rocket_count = reaction_summaries.rocket_count + CASE WHEN NEW.reaction_type = 'rocket' THEN 1 ELSE 0 END,
    heart_eyes_count = reaction_summaries.heart_eyes_count + CASE WHEN NEW.reaction_type = 'heart_eyes' THEN 1 ELSE 0 END,
    thinking_count = reaction_summaries.thinking_count + CASE WHEN NEW.reaction_type = 'thinking' THEN 1 ELSE 0 END,
    clap_count = reaction_summaries.clap_count + CASE WHEN NEW.reaction_type = 'clap' THEN 1 ELSE 0 END,
    thumbs_up_count = reaction_summaries.thumbs_up_count + CASE WHEN NEW.reaction_type = 'thumbs_up' THEN 1 ELSE 0 END,
    thumbs_down_count = reaction_summaries.thumbs_down_count + CASE WHEN NEW.reaction_type = 'thumbs_down' THEN 1 ELSE 0 END,
    custom_emoji_count = reaction_summaries.custom_emoji_count + CASE WHEN NEW.reaction_type = 'custom_emoji' THEN 1 ELSE 0 END,
    total_reactions = reaction_summaries.total_reactions + 1,
    last_updated = NOW();

  -- Update unique user count
  UPDATE reaction_summaries 
  SET total_unique_users = (
    SELECT COUNT(DISTINCT user_id) 
    FROM enhanced_reactions 
    WHERE 
      (post_id = NEW.post_id AND NEW.post_id IS NOT NULL) OR
      (comment_id = NEW.comment_id AND NEW.comment_id IS NOT NULL) OR
      (message_id = NEW.message_id AND NEW.message_id IS NOT NULL)
  )
  WHERE content_type = CASE 
    WHEN NEW.post_id IS NOT NULL THEN 'post'
    WHEN NEW.comment_id IS NOT NULL THEN 'comment'
    WHEN NEW.message_id IS NOT NULL THEN 'message'
  END
  AND content_id = COALESCE(NEW.post_id, NEW.comment_id, NEW.message_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating reaction summaries
CREATE TRIGGER trigger_update_reaction_summary
  AFTER INSERT ON enhanced_reactions
  FOR EACH ROW EXECUTE FUNCTION update_reaction_summary();

-- Function to update user reaction history
CREATE OR REPLACE FUNCTION update_user_reaction_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_reaction_history (user_id, total_reactions_given, reactions_today, last_reaction_date)
  VALUES (NEW.user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_reactions_given = user_reaction_history.total_reactions_given + 1,
    reactions_today = CASE 
      WHEN user_reaction_history.last_reaction_date = CURRENT_DATE 
      THEN user_reaction_history.reactions_today + 1
      ELSE 1
    END,
    last_reaction_date = CURRENT_DATE,
    reaction_streak = CASE
      WHEN user_reaction_history.last_reaction_date = CURRENT_DATE - INTERVAL '1 day'
      THEN user_reaction_history.reaction_streak + 1
      WHEN user_reaction_history.last_reaction_date = CURRENT_DATE
      THEN user_reaction_history.reaction_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_reaction_history.longest_streak,
      CASE
        WHEN user_reaction_history.last_reaction_date = CURRENT_DATE - INTERVAL '1 day'
        THEN user_reaction_history.reaction_streak + 1
        ELSE user_reaction_history.reaction_streak
      END
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating user reaction history
CREATE TRIGGER trigger_update_user_reaction_history
  AFTER INSERT ON enhanced_reactions
  FOR EACH ROW EXECUTE FUNCTION update_user_reaction_history();

-- Initial data seeding for common emoji reactions
INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '❤️', '', '❤️', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '❤️' AND is_global = true);

INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '😂', '', '😂', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '😂' AND is_global = true);

INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '🔥', '', '🔥', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '🔥' AND is_global = true);

INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '🚀', '', '🚀', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '🚀' AND is_global = true);

INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '👍', '', '👍', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '👍' AND is_global = true);

INSERT INTO custom_emoji_reactions (emoji_name, emoji_url, emoji_data, is_global, created_by, usage_count, is_active)
SELECT '👎', '', '👎', true, 'system', 0, true
WHERE NOT EXISTS (SELECT 1 FROM custom_emoji_reactions WHERE emoji_name = '👎' AND is_global = true);

-- Views for easy querying
CREATE OR REPLACE VIEW reaction_leaderboard AS
SELECT 
  u.id as user_id,
  u.username,
  u.display_name,
  u.avatar,
  urh.total_reactions_given,
  urh.total_reactions_received,
  urh.reaction_streak,
  urh.longest_streak,
  urh.achievement_badges
FROM users u
JOIN user_reaction_history urh ON u.id = urh.user_id
ORDER BY urh.total_reactions_given DESC;

CREATE OR REPLACE VIEW trending_content AS
SELECT 
  tr.content_type,
  tr.content_id,
  tr.trend_score,
  tr.reaction_velocity,
  tr.engagement_rate,
  tr.content_preview,
  rs.total_reactions,
  rs.total_unique_users
FROM trending_reactions tr
JOIN reaction_summaries rs ON tr.content_type = rs.content_type AND tr.content_id = rs.content_id
WHERE tr.expires_at > NOW()
ORDER BY tr.trend_score DESC;

COMMENT ON TABLE enhanced_reactions IS 'Enhanced reaction system supporting multiple reaction types for posts, comments, and messages';
COMMENT ON TABLE reaction_analytics IS 'Analytics and trending data for reactions';
COMMENT ON TABLE reaction_summaries IS 'Aggregated reaction counts and metrics for quick querying';
COMMENT ON TABLE user_reaction_history IS 'User activity history and engagement metrics';
COMMENT ON TABLE reaction_notifications IS 'Real-time notifications for reaction events';
COMMENT ON TABLE trending_reactions IS 'Trending content based on reaction velocity and engagement';
COMMENT ON TABLE custom_emoji_reactions IS 'Custom emoji definitions for servers and communities';