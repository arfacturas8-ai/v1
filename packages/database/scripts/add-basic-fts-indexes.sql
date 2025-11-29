-- Basic PostgreSQL Full-Text Search Indexes (without extensions)
-- This script adds essential GIN indexes for full-text search

-- Add GIN index for User search (username, displayName, bio)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_fts_search
ON "User" USING GIN (
  to_tsvector('english', 
    COALESCE(username, '') || ' ' || 
    COALESCE("displayName", '') || ' ' || 
    COALESCE(bio, '')
  )
);

-- Add GIN index for Server search (name, description)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_fts_search
ON "Server" USING GIN (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '')
  )
);

-- Add GIN index for Community search (name, displayName, description)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_fts_search  
ON "Community" USING GIN (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE("displayName", '') || ' ' || 
    COALESCE(description, '')
  )
);

-- Add GIN index for Post search (title, content)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_fts_search
ON "Post" USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(content, '')
  )
);

-- Add GIN index for Comment search (content)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_fts_search
ON "Comment" USING GIN (
  to_tsvector('english', content)
);

-- Add GIN index for Message search (content)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_fts_search
ON "Message" USING GIN (
  to_tsvector('english', content)
);

-- Additional performance indexes for filtering and sorting

-- User filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_banned_at_null
ON "User" ("bannedAt") WHERE "bannedAt" IS NULL;

-- Server filtering indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_public_true
ON "Server" ("isPublic") WHERE "isPublic" = true;

-- Community filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_public_true
ON "Community" ("isPublic") WHERE "isPublic" = true;

-- Post filtering and sorting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_not_removed_public
ON "Post" ("communityId", "createdAt") 
WHERE "isRemoved" = false;

-- Message filtering indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_created
ON "Message" ("channelId", "createdAt" DESC);

-- Channel filtering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_not_private
ON "Channel" ("serverId", "isPrivate") WHERE "isPrivate" = false;