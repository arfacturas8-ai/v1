-- CRYB Platform Enhanced Production Database Schema
-- Optimized for Reddit/Discord scale with advanced indexing, partitioning, and performance features
-- Author: Database Infrastructure Team
-- Version: 1.0
-- Target: PostgreSQL 15+ with TimescaleDB

-- ==========================================
-- EXTENSIONS AND INITIAL SETUP
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_partman";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create custom domains for better type safety
CREATE DOMAIN email_address AS citext CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
CREATE DOMAIN username_type AS citext CHECK (LENGTH(VALUE) >= 3 AND LENGTH(VALUE) <= 32 AND VALUE ~ '^[a-zA-Z0-9_-]+$');
CREATE DOMAIN url_type AS text CHECK (VALUE ~ '^https?://');
CREATE DOMAIN hex_color AS char(7) CHECK (VALUE ~ '^#[0-9a-fA-F]{6}$');

-- ==========================================
-- ENHANCED USER MANAGEMENT
-- ==========================================

-- Users table with enhanced indexing and constraints
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username username_type UNIQUE NOT NULL,
    email email_address UNIQUE,
    display_name TEXT NOT NULL CHECK (LENGTH(display_name) >= 1 AND LENGTH(display_name) <= 64),
    avatar_url url_type,
    banner_url url_type,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    
    -- Authentication and security
    password_hash TEXT CHECK (password_hash IS NULL OR LENGTH(password_hash) >= 60), -- bcrypt
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    
    -- Account status and flags
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Platform verification
    is_bot BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    banned_until TIMESTAMPTZ,
    ban_reason TEXT,
    
    -- Platform features
    premium_type TEXT DEFAULT 'free' CHECK (premium_type IN ('free', 'premium', 'premium_plus')),
    premium_until TIMESTAMPTZ,
    subscription_id TEXT,
    
    -- Web3 integration
    wallet_address TEXT UNIQUE,
    ens_name TEXT,
    nft_avatar_contract TEXT,
    nft_avatar_token_id TEXT,
    
    -- Privacy and preferences
    privacy_settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    theme_settings JSONB DEFAULT '{}',
    language_code TEXT DEFAULT 'en' CHECK (LENGTH(language_code) = 2),
    timezone TEXT DEFAULT 'UTC',
    
    -- Tracking and analytics
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    last_ip_address INET,
    signup_ip_address INET,
    referral_code TEXT UNIQUE,
    referred_by_code TEXT,
    
    -- Social stats (denormalized for performance)
    follower_count INTEGER DEFAULT 0 CHECK (follower_count >= 0),
    following_count INTEGER DEFAULT 0 CHECK (following_count >= 0),
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    karma_score INTEGER DEFAULT 0,
    
    CONSTRAINT valid_premium_until CHECK (premium_until IS NULL OR premium_type != 'free'),
    CONSTRAINT valid_ban CHECK (banned_until IS NULL OR ban_reason IS NOT NULL)
);

-- Enhanced indexes for users table
CREATE INDEX CONCURRENTLY idx_users_email_verified ON users (email) WHERE email_verified = TRUE;
CREATE INDEX CONCURRENTLY idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_users_display_name_trgm ON users USING GIN (display_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_users_active_users ON users (last_active_at DESC) WHERE is_active = TRUE AND banned_until IS NULL;
CREATE INDEX CONCURRENTLY idx_users_premium ON users (premium_until DESC) WHERE premium_type != 'free';
CREATE INDEX CONCURRENTLY idx_users_wallet ON users (wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_referral ON users (referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_signup_date ON users (created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_karma ON users (karma_score DESC) WHERE karma_score > 0;

-- ==========================================
-- ENHANCED COMMUNITY SYSTEM
-- ==========================================

-- Communities (subreddit-like) with advanced features
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name username_type UNIQUE NOT NULL,
    display_name TEXT NOT NULL CHECK (LENGTH(display_name) >= 1 AND LENGTH(display_name) <= 64),
    description TEXT CHECK (LENGTH(description) <= 2000),
    
    -- Visual branding
    icon_url url_type,
    banner_url url_type,
    theme_color hex_color DEFAULT '#0079d3',
    
    -- Community settings
    is_public BOOLEAN DEFAULT TRUE,
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_restricted BOOLEAN DEFAULT FALSE, -- Restricted posting
    require_post_approval BOOLEAN DEFAULT FALSE,
    allow_images BOOLEAN DEFAULT TRUE,
    allow_videos BOOLEAN DEFAULT TRUE,
    allow_polls BOOLEAN DEFAULT TRUE,
    allow_live_chat BOOLEAN DEFAULT TRUE,
    
    -- Moderation settings
    spam_filter_strength TEXT DEFAULT 'high' CHECK (spam_filter_strength IN ('low', 'high', 'all')),
    crowd_control_level INTEGER DEFAULT 0 CHECK (crowd_control_level BETWEEN 0 AND 3),
    
    -- Community rules and guidelines
    rules JSONB DEFAULT '[]',
    guidelines TEXT,
    welcome_message TEXT,
    
    -- Subscription and token gating
    subscription_required BOOLEAN DEFAULT FALSE,
    subscription_price DECIMAL(10,2),
    subscription_currency TEXT DEFAULT 'USD',
    token_gating_enabled BOOLEAN DEFAULT FALSE,
    required_tokens JSONB DEFAULT '[]',
    
    -- NFT integration
    nft_collection_address TEXT,
    nft_required_count INTEGER DEFAULT 1,
    
    -- Social features
    member_count INTEGER DEFAULT 0 CHECK (member_count >= 0),
    active_member_count INTEGER DEFAULT 0 CHECK (active_member_count >= 0),
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- SEO and discovery
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    language_code TEXT DEFAULT 'en',
    
    CONSTRAINT valid_subscription CHECK (
        (subscription_required = FALSE) OR 
        (subscription_required = TRUE AND subscription_price > 0 AND subscription_currency IS NOT NULL)
    )
);

-- Enhanced indexes for communities
CREATE INDEX CONCURRENTLY idx_communities_name_trgm ON communities USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_communities_display_name_trgm ON communities USING GIN (display_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_communities_public ON communities (member_count DESC) WHERE is_public = TRUE;
CREATE INDEX CONCURRENTLY idx_communities_category ON communities (category, member_count DESC) WHERE category IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_communities_tags ON communities USING GIN (tags);
CREATE INDEX CONCURRENTLY idx_communities_creator ON communities (creator_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_communities_active ON communities (active_member_count DESC) WHERE is_public = TRUE;

-- ==========================================
-- ENHANCED POSTS SYSTEM
-- ==========================================

-- Posts table with partitioning by creation date for massive scale
CREATE TABLE posts (
    id UUID DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 300),
    content TEXT CHECK (LENGTH(content) <= 50000),
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'link', 'image', 'video', 'poll', 'live')),
    
    -- URL and media content
    url url_type,
    thumbnail_url url_type,
    media_urls TEXT[],
    embed_data JSONB,
    
    -- Post metadata
    flair_id UUID,
    flair_text TEXT CHECK (LENGTH(flair_text) <= 64),
    
    -- Community and user
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Post status and moderation
    is_published BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    removal_reason TEXT,
    removed_by_id UUID REFERENCES users(id),
    
    -- Content flags
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_spoiler BOOLEAN DEFAULT FALSE,
    is_oc BOOLEAN DEFAULT FALSE, -- Original Content
    
    -- Engagement metrics (denormalized for performance)
    upvote_count INTEGER DEFAULT 0 CHECK (upvote_count >= 0),
    downvote_count INTEGER DEFAULT 0 CHECK (downvote_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count BIGINT DEFAULT 0 CHECK (view_count >= 0),
    share_count INTEGER DEFAULT 0 CHECK (share_count >= 0),
    award_count INTEGER DEFAULT 0 CHECK (award_count >= 0),
    
    -- Calculated fields for ranking
    score INTEGER GENERATED ALWAYS AS (upvote_count - downvote_count) STORED,
    hot_score DOUBLE PRECISION DEFAULT 0,
    controversy_score DOUBLE PRECISION DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- SEO and search
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || COALESCE(content, ''))
    ) STORED,
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for posts (example for current year)
CREATE TABLE posts_2024_01 PARTITION OF posts FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE posts_2024_02 PARTITION OF posts FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE posts_2024_03 PARTITION OF posts FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE posts_2024_04 PARTITION OF posts FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE posts_2024_05 PARTITION OF posts FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE posts_2024_06 PARTITION OF posts FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE posts_2024_07 PARTITION OF posts FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE posts_2024_08 PARTITION OF posts FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE posts_2024_09 PARTITION OF posts FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE posts_2024_10 PARTITION OF posts FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE posts_2024_11 PARTITION OF posts FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE posts_2024_12 PARTITION OF posts FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Enhanced indexes for posts
CREATE INDEX CONCURRENTLY idx_posts_community_hot ON posts (community_id, hot_score DESC, created_at DESC) WHERE is_published = TRUE AND is_removed = FALSE;
CREATE INDEX CONCURRENTLY idx_posts_community_new ON posts (community_id, created_at DESC) WHERE is_published = TRUE AND is_removed = FALSE;
CREATE INDEX CONCURRENTLY idx_posts_community_top ON posts (community_id, score DESC, created_at DESC) WHERE is_published = TRUE AND is_removed = FALSE;
CREATE INDEX CONCURRENTLY idx_posts_user ON posts (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_posts_search ON posts USING GIN (search_vector);
CREATE INDEX CONCURRENTLY idx_posts_trending ON posts (last_activity_at DESC, score DESC) WHERE is_published = TRUE AND is_removed = FALSE;
CREATE INDEX CONCURRENTLY idx_posts_content_type ON posts (content_type, created_at DESC) WHERE is_published = TRUE;

-- ==========================================
-- ENHANCED COMMENTS SYSTEM
-- ==========================================

-- Comments with nested structure using ltree for efficient hierarchical queries
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
    
    -- Hierarchy using ltree for efficient nested comments
    path ltree NOT NULL,
    depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 10),
    
    -- References
    post_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Comment status
    is_removed BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    removal_reason TEXT,
    removed_by_id UUID REFERENCES users(id),
    
    -- Engagement metrics
    upvote_count INTEGER DEFAULT 0 CHECK (upvote_count >= 0),
    downvote_count INTEGER DEFAULT 0 CHECK (downvote_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    award_count INTEGER DEFAULT 0 CHECK (award_count >= 0),
    
    -- Calculated fields
    score INTEGER GENERATED ALWAYS AS (upvote_count - downvote_count) STORED,
    controversy_score DOUBLE PRECISION DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    
    -- Ensure path consistency
    CONSTRAINT valid_depth CHECK (nlevel(path) = depth + 1),
    CONSTRAINT valid_parent CHECK (
        (parent_id IS NULL AND depth = 0) OR 
        (parent_id IS NOT NULL AND depth > 0)
    )
);

-- Enhanced indexes for comments
CREATE INDEX CONCURRENTLY idx_comments_post_path ON comments (post_id, path);
CREATE INDEX CONCURRENTLY idx_comments_post_score ON comments (post_id, score DESC, created_at DESC) WHERE is_removed = FALSE;
CREATE INDEX CONCURRENTLY idx_comments_user ON comments (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_comments_parent ON comments (parent_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_comments_path_gist ON comments USING GIST (path);
CREATE INDEX CONCURRENTLY idx_comments_search ON comments USING GIN (search_vector);

-- ==========================================
-- VOTING SYSTEM
-- ==========================================

-- Votes table with composite partitioning for massive scale
CREATE TABLE votes (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- post_id or comment_id
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)), -- -1 downvote, 1 upvote
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (id, created_at),
    UNIQUE (user_id, target_id, target_type)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for votes
CREATE TABLE votes_2024_01 PARTITION OF votes FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE votes_2024_02 PARTITION OF votes FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE votes_2024_03 PARTITION OF votes FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
CREATE TABLE votes_2024_04 PARTITION OF votes FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
CREATE TABLE votes_2024_05 PARTITION OF votes FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');
CREATE TABLE votes_2024_06 PARTITION OF votes FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');
CREATE TABLE votes_2024_07 PARTITION OF votes FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
CREATE TABLE votes_2024_08 PARTITION OF votes FOR VALUES FROM ('2024-08-01') TO ('2024-09-01');
CREATE TABLE votes_2024_09 PARTITION OF votes FOR VALUES FROM ('2024-09-01') TO ('2024-10-01');
CREATE TABLE votes_2024_10 PARTITION OF votes FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
CREATE TABLE votes_2024_11 PARTITION OF votes FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
CREATE TABLE votes_2024_12 PARTITION OF votes FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Indexes for votes
CREATE INDEX CONCURRENTLY idx_votes_target ON votes (target_id, target_type, vote_value);
CREATE INDEX CONCURRENTLY idx_votes_user ON votes (user_id, created_at DESC);

-- ==========================================
-- REAL-TIME MESSAGING SYSTEM
-- ==========================================

-- Servers (Discord-like)
CREATE TABLE servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    description TEXT CHECK (LENGTH(description) <= 1000),
    
    -- Visual branding
    icon_url url_type,
    banner_url url_type,
    invite_splash_url url_type,
    
    -- Server settings
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    is_discoverable BOOLEAN DEFAULT TRUE,
    verification_level INTEGER DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 4),
    content_filter INTEGER DEFAULT 0 CHECK (content_filter BETWEEN 0 AND 2),
    
    -- Server features
    features TEXT[] DEFAULT '{}',
    max_members INTEGER DEFAULT 100000,
    max_presences INTEGER DEFAULT 5000,
    max_video_channel_users INTEGER DEFAULT 25,
    
    -- Monetization
    premium_tier INTEGER DEFAULT 0 CHECK (premium_tier BETWEEN 0 AND 3),
    premium_subscriber_count INTEGER DEFAULT 0,
    boost_count INTEGER DEFAULT 0,
    
    -- Token gating
    token_gating_enabled BOOLEAN DEFAULT FALSE,
    required_tokens JSONB DEFAULT '[]',
    nft_requirements JSONB DEFAULT '[]',
    
    -- Metrics
    member_count INTEGER DEFAULT 0 CHECK (member_count >= 0),
    online_member_count INTEGER DEFAULT 0 CHECK (online_member_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Regional settings
    preferred_locale TEXT DEFAULT 'en-US',
    region TEXT DEFAULT 'auto'
);

-- Enhanced indexes for servers
CREATE INDEX CONCURRENTLY idx_servers_owner ON servers (owner_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_servers_public ON servers (member_count DESC) WHERE is_public = TRUE AND is_discoverable = TRUE;
CREATE INDEX CONCURRENTLY idx_servers_name_trgm ON servers USING GIN (name gin_trgm_ops);

-- Channels within servers
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    topic TEXT CHECK (LENGTH(topic) <= 1024),
    
    -- Channel type and settings
    channel_type TEXT NOT NULL DEFAULT 'text' CHECK (
        channel_type IN ('text', 'voice', 'category', 'announcement', 'stage', 'forum', 'thread')
    ),
    position INTEGER DEFAULT 0,
    parent_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    
    -- Permissions and access control
    is_private BOOLEAN DEFAULT FALSE,
    is_nsfw BOOLEAN DEFAULT FALSE,
    
    -- Voice/video specific settings
    bitrate INTEGER DEFAULT 64000 CHECK (bitrate BETWEEN 8000 AND 384000),
    user_limit INTEGER CHECK (user_limit BETWEEN 0 AND 99),
    rtc_region TEXT,
    video_quality_mode INTEGER DEFAULT 1 CHECK (video_quality_mode IN (1, 2)),
    
    -- Text channel specific settings
    rate_limit_per_user INTEGER DEFAULT 0 CHECK (rate_limit_per_user BETWEEN 0 AND 21600),
    auto_archive_duration INTEGER DEFAULT 4320 CHECK (auto_archive_duration IN (60, 1440, 4320, 10080)),
    
    -- Thread settings
    thread_rate_limit_per_user INTEGER DEFAULT 0,
    default_thread_rate_limit_per_user INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    
    CONSTRAINT valid_parent CHECK (
        (parent_id IS NULL) OR 
        (parent_id IS NOT NULL AND channel_type != 'category')
    )
);

-- Enhanced indexes for channels
CREATE INDEX CONCURRENTLY idx_channels_server ON channels (server_id, position, created_at);
CREATE INDEX CONCURRENTLY idx_channels_parent ON channels (parent_id, position) WHERE parent_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_channels_type ON channels (channel_type, server_id);

-- ==========================================
-- MESSAGES SYSTEM WITH PARTITIONING
-- ==========================================

-- Messages table partitioned by creation date for Discord-scale messaging
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL CHECK (LENGTH(content) <= 4000),
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'file', 'embed', 'reply', 'system')),
    
    -- Message features
    is_tts BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    mention_everyone BOOLEAN DEFAULT FALSE,
    mentions UUID[] DEFAULT '{}',
    mention_roles UUID[] DEFAULT '{}',
    
    -- Embeds and attachments
    embeds JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    
    -- Message threading and replies
    reply_to_id UUID,
    thread_id UUID,
    
    -- Message status
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    
    -- Search
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create daily partitions for messages (high volume)
-- This is an example - in production, you'd automate partition creation
CREATE TABLE messages_2024_10_01 PARTITION OF messages FOR VALUES FROM ('2024-10-01') TO ('2024-10-02');
CREATE TABLE messages_2024_10_02 PARTITION OF messages FOR VALUES FROM ('2024-10-02') TO ('2024-10-03');
CREATE TABLE messages_2024_10_03 PARTITION OF messages FOR VALUES FROM ('2024-10-03') TO ('2024-10-04');

-- Enhanced indexes for messages
CREATE INDEX CONCURRENTLY idx_messages_channel_time ON messages (channel_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX CONCURRENTLY idx_messages_user ON messages (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_messages_reply ON messages (reply_to_id, created_at DESC) WHERE reply_to_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_messages_search ON messages USING GIN (search_vector);
CREATE INDEX CONCURRENTLY idx_messages_mentions ON messages USING GIN (mentions) WHERE array_length(mentions, 1) > 0;

-- ==========================================
-- ADVANCED CACHING STRATEGIES
-- ==========================================

-- Materialized views for performance-critical queries
CREATE MATERIALIZED VIEW trending_communities AS
SELECT 
    c.id,
    c.name,
    c.display_name,
    c.icon_url,
    c.member_count,
    c.active_member_count,
    COUNT(p.id) as recent_post_count,
    COALESCE(AVG(p.score), 0) as avg_post_score
FROM communities c
LEFT JOIN posts p ON c.id = p.community_id 
    AND p.created_at > NOW() - INTERVAL '7 days'
    AND p.is_published = TRUE 
    AND p.is_removed = FALSE
WHERE c.is_public = TRUE
GROUP BY c.id, c.name, c.display_name, c.icon_url, c.member_count, c.active_member_count
ORDER BY (c.active_member_count * 0.4 + recent_post_count * 0.3 + avg_post_score * 0.3) DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_trending_communities_id ON trending_communities (id);

-- Hot posts materialized view
CREATE MATERIALIZED VIEW hot_posts AS
SELECT 
    p.id,
    p.title,
    p.community_id,
    p.user_id,
    p.score,
    p.comment_count,
    p.hot_score,
    p.created_at,
    u.username,
    u.display_name,
    c.name as community_name
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN communities c ON p.community_id = c.id
WHERE p.is_published = TRUE 
    AND p.is_removed = FALSE
    AND p.created_at > NOW() - INTERVAL '24 hours'
ORDER BY p.hot_score DESC
LIMIT 1000;

CREATE UNIQUE INDEX idx_hot_posts_id ON hot_posts (id);
CREATE INDEX idx_hot_posts_community ON hot_posts (community_id, hot_score DESC);

-- ==========================================
-- STORED PROCEDURES FOR PERFORMANCE
-- ==========================================

-- Function to update hot scores for posts (called by background job)
CREATE OR REPLACE FUNCTION update_post_hot_scores()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE posts 
    SET hot_score = calculate_hot_score(upvote_count, downvote_count, created_at)
    WHERE created_at > NOW() - INTERVAL '48 hours'
        AND is_published = TRUE 
        AND is_removed = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Hot score calculation function (Reddit-style algorithm)
CREATE OR REPLACE FUNCTION calculate_hot_score(
    upvotes INTEGER,
    downvotes INTEGER,
    post_time TIMESTAMPTZ
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    score INTEGER;
    order_val DOUBLE PRECISION;
    sign_val INTEGER;
    seconds DOUBLE PRECISION;
BEGIN
    score := upvotes - downvotes;
    
    -- Determine sign
    IF score > 0 THEN
        sign_val := 1;
    ELSIF score < 0 THEN
        sign_val := -1;
    ELSE
        sign_val := 0;
    END IF;
    
    -- Calculate order of magnitude
    order_val := log(greatest(abs(score), 1));
    
    -- Calculate seconds since epoch
    seconds := EXTRACT(EPOCH FROM post_time) - 1134028003; -- Reddit epoch
    
    -- Return hot score
    RETURN round((sign_val * order_val + seconds / 45000), 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- TRIGGERS FOR MAINTAINING DENORMALIZED DATA
-- ==========================================

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update community post count
        UPDATE communities 
        SET post_count = post_count + 1 
        WHERE id = NEW.community_id;
        
        -- Update user post count
        UPDATE users 
        SET post_count = post_count + 1 
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update community post count
        UPDATE communities 
        SET post_count = post_count - 1 
        WHERE id = OLD.community_id;
        
        -- Update user post count
        UPDATE users 
        SET post_count = post_count - 1 
        WHERE id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post count updates
CREATE TRIGGER trigger_update_post_counts
    AFTER INSERT OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'post' THEN
            IF NEW.vote_value = 1 THEN
                UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
            ELSE
                UPDATE posts SET downvote_count = downvote_count + 1 WHERE id = NEW.target_id;
            END IF;
        ELSIF NEW.target_type = 'comment' THEN
            IF NEW.vote_value = 1 THEN
                UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
            ELSE
                UPDATE comments SET downvote_count = downvote_count + 1 WHERE id = NEW.target_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote changes
        IF OLD.vote_value != NEW.vote_value THEN
            IF NEW.target_type = 'post' THEN
                -- Remove old vote
                IF OLD.vote_value = 1 THEN
                    UPDATE posts SET upvote_count = upvote_count - 1 WHERE id = NEW.target_id;
                ELSE
                    UPDATE posts SET downvote_count = downvote_count - 1 WHERE id = NEW.target_id;
                END IF;
                -- Add new vote
                IF NEW.vote_value = 1 THEN
                    UPDATE posts SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
                ELSE
                    UPDATE posts SET downvote_count = downvote_count + 1 WHERE id = NEW.target_id;
                END IF;
            ELSIF NEW.target_type = 'comment' THEN
                -- Remove old vote
                IF OLD.vote_value = 1 THEN
                    UPDATE comments SET upvote_count = upvote_count - 1 WHERE id = NEW.target_id;
                ELSE
                    UPDATE comments SET downvote_count = downvote_count - 1 WHERE id = NEW.target_id;
                END IF;
                -- Add new vote
                IF NEW.vote_value = 1 THEN
                    UPDATE comments SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
                ELSE
                    UPDATE comments SET downvote_count = downvote_count + 1 WHERE id = NEW.target_id;
                END IF;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'post' THEN
            IF OLD.vote_value = 1 THEN
                UPDATE posts SET upvote_count = upvote_count - 1 WHERE id = OLD.target_id;
            ELSE
                UPDATE posts SET downvote_count = downvote_count - 1 WHERE id = OLD.target_id;
            END IF;
        ELSIF OLD.target_type = 'comment' THEN
            IF OLD.vote_value = 1 THEN
                UPDATE comments SET upvote_count = upvote_count - 1 WHERE id = OLD.target_id;
            ELSE
                UPDATE comments SET downvote_count = downvote_count - 1 WHERE id = OLD.target_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote count updates
CREATE TRIGGER trigger_update_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- ==========================================
-- CLEANUP AND MAINTENANCE PROCEDURES
-- ==========================================

-- Function to clean up old partitions (call monthly)
CREATE OR REPLACE FUNCTION cleanup_old_partitions()
RETURNS INTEGER AS $$
DECLARE
    partition_name TEXT;
    dropped_count INTEGER := 0;
BEGIN
    -- Drop message partitions older than 90 days
    FOR partition_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'messages_%' 
        AND tablename < 'messages_' || to_char(NOW() - INTERVAL '90 days', 'YYYY_MM_DD')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
        dropped_count := dropped_count + 1;
    END LOOP;
    
    RETURN dropped_count;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY trending_communities;
    REFRESH MATERIALIZED VIEW CONCURRENTLY hot_posts;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE MONITORING VIEWS
-- ==========================================

-- View for monitoring slow queries
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries slower than 100ms
ORDER BY mean_time DESC;

-- View for monitoring table sizes
CREATE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View for monitoring index usage
CREATE VIEW index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ==========================================
-- INITIAL DATA AND CONFIGURATION
-- ==========================================

-- Insert default system user
INSERT INTO users (id, username, display_name, is_system, is_verified) VALUES 
    ('00000000-0000-0000-0000-000000000000', 'system', 'System', true, true);

-- Insert default communities
INSERT INTO communities (name, display_name, description, creator_id) VALUES 
    ('general', 'General', 'General discussion for all topics', '00000000-0000-0000-0000-000000000000'),
    ('announcements', 'Announcements', 'Official platform announcements', '00000000-0000-0000-0000-000000000000'),
    ('help', 'Help & Support', 'Get help with using the platform', '00000000-0000-0000-0000-000000000000');

-- Create indexes for foreign key constraints to improve performance
CREATE INDEX CONCURRENTLY idx_posts_community_id ON posts (community_id);
CREATE INDEX CONCURRENTLY idx_posts_user_id ON posts (user_id);
CREATE INDEX CONCURRENTLY idx_comments_post_id ON comments (post_id);
CREATE INDEX CONCURRENTLY idx_comments_user_id ON comments (user_id);
CREATE INDEX CONCURRENTLY idx_votes_user_id ON votes (user_id);
CREATE INDEX CONCURRENTLY idx_channels_server_id ON channels (server_id);
CREATE INDEX CONCURRENTLY idx_messages_channel_id ON messages (channel_id);
CREATE INDEX CONCURRENTLY idx_messages_user_id ON messages (user_id);

-- Enable row level security for multi-tenant scenarios
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Grant permissions to application user
GRANT USAGE ON SCHEMA public TO cryb_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryb_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryb_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryb_app;

-- ==========================================
-- COMPLETED: Enhanced Production Schema
-- ==========================================

-- This schema provides:
-- 1. Optimized indexing strategies for Reddit/Discord scale
-- 2. Table partitioning for high-volume data (posts, votes, messages)
-- 3. Denormalized counters with trigger-based maintenance
-- 4. Full-text search capabilities
-- 5. Hierarchical comment structure with ltree
-- 6. Materialized views for performance-critical queries
-- 7. Hot score calculations for trending content
-- 8. Row-level security for multi-tenancy
-- 9. Comprehensive monitoring views
-- 10. Automated maintenance procedures

COMMENT ON DATABASE cryb IS 'CRYB Platform - Production Database with Reddit/Discord scale optimizations';