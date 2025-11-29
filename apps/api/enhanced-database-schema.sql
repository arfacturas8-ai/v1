-- Enhanced CRYB Platform Database Schema
-- This extends the existing schema with all the new features

-- Users table (enhanced)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW();

-- Communities table (enhanced)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '[]';
ALTER TABLE communities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Community members table
CREATE TABLE IF NOT EXISTS community_members (
  id SERIAL PRIMARY KEY,
  community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community moderators table
CREATE TABLE IF NOT EXISTS community_moderators (
  id SERIAL PRIMARY KEY,
  community_id TEXT REFERENCES communities(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Posts table (enhanced)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE;

-- Comments table (enhanced)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE;

-- Post votes table
CREATE TABLE IF NOT EXISTS post_votes (
  id SERIAL PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id SERIAL PRIMARY KEY,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Voice sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- User wallets for Web3
CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, wallet_address)
);

-- Crypto tips table
CREATE TABLE IF NOT EXISTS crypto_tips (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 8) NOT NULL,
  currency TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- NFT collections table
CREATE TABLE IF NOT EXISTS nft_collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User NFTs table
CREATE TABLE IF NOT EXISTS user_nfts (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  collection_id TEXT REFERENCES nft_collections(id),
  token_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_profile_picture BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  upload_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI moderation results table
CREATE TABLE IF NOT EXISTS ai_moderation_results (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_text TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  categories JSONB DEFAULT '{}',
  category_scores JSONB DEFAULT '{}',
  confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  results_count INTEGER,
  clicked_result TEXT,
  search_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email verification logs
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  email_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_score ON posts(score DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_room_joined ON voice_sessions(room_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_communities_search ON communities USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_comments_search ON comments USING gin(to_tsvector('english', content));

-- Update triggers for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers where needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_tokens_updated_at') THEN
        CREATE TRIGGER update_device_tokens_updated_at 
        BEFORE UPDATE ON device_tokens 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create views for common queries
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.created_at,
  u.last_active,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count,
  COALESCE(SUM(p.upvotes - p.downvotes), 0) as karma
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
LEFT JOIN comments c ON u.id = c.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.last_active;

CREATE OR REPLACE VIEW community_stats AS
SELECT 
  comm.id,
  comm.name,
  comm.description,
  comm.created_at,
  COUNT(DISTINCT cm.user_id) as member_count,
  COUNT(DISTINCT p.id) as post_count,
  COUNT(DISTINCT c.id) as comment_count
FROM communities comm
LEFT JOIN community_members cm ON comm.id = cm.community_id
LEFT JOIN posts p ON comm.id = p.community_id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY comm.id, comm.name, comm.description, comm.created_at;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cryb_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cryb_user;

COMMIT;