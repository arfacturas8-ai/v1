-- PostgreSQL Full-Text Search Indexes
-- This script adds GIN indexes for full-text search on critical tables

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

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
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_banned_at
ON "User" ("bannedAt") WHERE "bannedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_verified
ON "User" ("isVerified") WHERE "isVerified" = true;

-- Server filtering indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_public
ON "Server" ("isPublic") WHERE "isPublic" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_count
ON "Server" ("approximateMemberCount") WHERE "approximateMemberCount" IS NOT NULL;

-- Community filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_public
ON "Community" ("isPublic") WHERE "isPublic" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_member_count
ON "Community" ("memberCount");

-- Post filtering and sorting indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_not_removed_public
ON "Post" ("communityId", "createdAt") 
WHERE "isRemoved" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_score
ON "Post" ("score") WHERE score > 0;

-- Message filtering indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_public_channels
ON "Message" ("channelId", "createdAt");

-- Channel filtering index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_not_private
ON "Channel" ("serverId", "isPrivate") WHERE "isPrivate" = false;

-- Trigram indexes for partial string matching (fallback for FTS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_trgm
ON "User" USING GIN (username gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_displayname_trgm  
ON "User" USING GIN ("displayName" gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_name_trgm
ON "Community" USING GIN (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_name_trgm
ON "Server" USING GIN (name gin_trgm_ops);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_community_created
ON "Post" ("communityId", "createdAt" DESC) WHERE "isRemoved" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_created
ON "Message" ("channelId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_post_created
ON "Comment" ("postId", "createdAt" DESC);

-- Text search configuration optimization
-- Create a custom text search configuration for better performance
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS cryb_english (COPY = english);

-- Performance monitoring query
-- Run this to check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE indexname LIKE '%fts%' OR indexname LIKE '%trgm%'
-- ORDER BY idx_scan DESC;