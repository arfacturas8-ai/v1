-- =============================================================================
-- CRYB Platform Comprehensive Database Schema
-- =============================================================================
-- 
-- This schema supports the complete microservices architecture including:
-- - User Service: Authentication, profiles, relationships
-- - Community Service: Communities, channels, permissions
-- - Content Service: Posts, comments, reactions
-- - Notification Service: Real-time notifications
-- - Media Service: File management and processing
-- - Search Service: Search indexing metadata
-- - Analytics Service: User behavior and metrics
--
-- Following Discord/Facebook patterns with proper scaling considerations
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- USERS AND AUTHENTICATION (User Service)
-- =============================================================================

-- Users table - Core user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Status fields
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT users_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT users_display_name_length CHECK (char_length(display_name) >= 1)
);

-- User profiles - Extended user information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile information
    bio TEXT DEFAULT '',
    location VARCHAR(100) DEFAULT '',
    website VARCHAR(255),
    avatar VARCHAR(500),
    banner VARCHAR(500),
    birth_date DATE,
    
    -- Social links
    social_links JSONB DEFAULT '{}',
    
    -- Preferences
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Privacy settings
    is_profile_public BOOLEAN DEFAULT TRUE,
    show_email BOOLEAN DEFAULT FALSE,
    show_online_status BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Roles for RBAC
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions for fine-grained access control
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, permission_id)
);

-- User-Role mapping
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, role_id)
);

-- OAuth accounts for external authentication
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider, provider_id)
);

-- Refresh tokens for JWT management
CREATE TABLE refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Login attempts for security monitoring
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Two-factor authentication
CREATE TABLE two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL, -- 'totp', 'sms', 'email'
    secret VARCHAR(255),
    backup_codes TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, method)
);

-- =============================================================================
-- RELATIONSHIPS (User Service)
-- =============================================================================

-- User relationships (friends, followers, etc.)
CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL DEFAULT 'follow', -- 'follow', 'friend', 'block'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'rejected'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_relationship CHECK (follower_id != following_id)
);

-- =============================================================================
-- COMMUNITIES AND CHANNELS (Community Service)
-- =============================================================================

-- Communities (servers/groups)
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(500),
    banner VARCHAR(500),
    
    -- Settings
    is_public BOOLEAN DEFAULT TRUE,
    is_discoverable BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    
    -- Ownership
    owner_id UUID NOT NULL REFERENCES users(id),
    
    -- Metadata
    member_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community members
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'banned', 'left'
    
    -- Permissions
    is_admin BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(community_id, user_id)
);

-- Channels within communities
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Channel type
    type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'announcement', 'thread'
    
    -- Settings
    is_private BOOLEAN DEFAULT FALSE,
    is_nsfw BOOLEAN DEFAULT FALSE,
    slowmode_seconds INTEGER DEFAULT 0,
    
    -- Position for ordering
    position INTEGER DEFAULT 0,
    
    -- Parent channel for categories/threads
    parent_id UUID REFERENCES channels(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(community_id, name)
);

-- Channel permissions
CREATE TABLE channel_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Permission type
    permission_type VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT channel_permissions_target CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR 
        (user_id IS NULL AND role_id IS NOT NULL)
    )
);

-- =============================================================================
-- CONTENT (Content Service)
-- =============================================================================

-- Posts/messages
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    community_id UUID REFERENCES communities(id),
    channel_id UUID REFERENCES channels(id),
    parent_id UUID REFERENCES posts(id), -- For replies/threads
    
    -- Content
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'rich', 'markdown'
    
    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metrics
    reaction_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Search
    search_vector TSVECTOR
);

-- Post reactions
CREATE TABLE post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Reaction type (emoji or custom)
    emoji VARCHAR(100) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, user_id, emoji)
);

-- Post mentions
CREATE TABLE post_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mention_type VARCHAR(20) DEFAULT 'user', -- 'user', 'role', 'everyone'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, user_id, mention_type)
);

-- Post attachments/media
CREATE TABLE post_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_id UUID NOT NULL, -- References media service
    
    -- Attachment metadata
    filename VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- NOTIFICATIONS (Notification Service)
-- =============================================================================

-- Notification types
CREATE TABLE notification_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id),
    
    -- Delivery preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, notification_type_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    related_user_id UUID REFERENCES users(id),
    related_post_id UUID REFERENCES posts(id),
    related_community_id UUID REFERENCES communities(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery tracking
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    push_sent BOOLEAN DEFAULT FALSE,
    push_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Push notification subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Push subscription data
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Device info
    user_agent TEXT,
    device_type VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, endpoint)
);

-- =============================================================================
-- MEDIA (Media Service)
-- =============================================================================

-- Media files
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES users(id),
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
    
    -- Storage information
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local',
    cdn_url TEXT,
    
    -- Media metadata
    width INTEGER,
    height INTEGER,
    duration FLOAT, -- For videos/audio
    
    -- Processing status
    processing_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    processing_error TEXT,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    access_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(file_hash)
);

-- Media variants (thumbnails, different sizes, etc.)
CREATE TABLE media_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_media_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    
    -- Variant information
    variant_type VARCHAR(50) NOT NULL, -- 'thumbnail', 'small', 'medium', 'large'
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    
    -- Storage
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parent_media_id, variant_type)
);

-- =============================================================================
-- SEARCH (Search Service)
-- =============================================================================

-- Search index metadata
CREATE TABLE search_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'post', 'community', etc.
    entity_id UUID NOT NULL,
    
    -- Index data
    title TEXT,
    content TEXT,
    tags TEXT[],
    
    -- Search metadata
    search_vector TSVECTOR,
    popularity_score FLOAT DEFAULT 0.0,
    
    -- Status
    indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    needs_reindex BOOLEAN DEFAULT FALSE,
    
    UNIQUE(entity_type, entity_id)
);

-- =============================================================================
-- ANALYTICS (Analytics Service)
-- =============================================================================

-- User sessions for analytics
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Session information
    session_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Geographic data
    country VARCHAR(3),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Device information
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Session timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(session_id)
);

-- User events for analytics
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Event information
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_action VARCHAR(50),
    event_label VARCHAR(100),
    
    -- Event data
    properties JSONB DEFAULT '{}',
    
    -- Context
    page_url TEXT,
    referrer TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Business metrics
CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'counter', 'gauge', 'histogram'
    
    -- Dimensions
    dimensions JSONB DEFAULT '{}',
    
    -- Time
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- AUDIT AND LOGGING
-- =============================================================================

-- Audit log for important actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action information
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users and authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Relationships indexes
CREATE INDEX idx_user_relationships_follower ON user_relationships(follower_id);
CREATE INDEX idx_user_relationships_following ON user_relationships(following_id);
CREATE INDEX idx_user_relationships_type ON user_relationships(relationship_type);

-- Community indexes
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_created_at ON communities(created_at);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);

-- Channel indexes
CREATE INDEX idx_channels_community ON channels(community_id);
CREATE INDEX idx_channels_parent ON channels(parent_id);

-- Content indexes
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_channel ON posts(channel_id);
CREATE INDEX idx_posts_parent ON posts(parent_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_search_vector ON posts USING gin(search_vector);

-- Reactions indexes
CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Media indexes
CREATE INDEX idx_media_files_uploader ON media_files(uploader_id);
CREATE INDEX idx_media_files_hash ON media_files(file_hash);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);

-- Search indexes
CREATE INDEX idx_search_indices_entity ON search_indices(entity_type, entity_id);
CREATE INDEX idx_search_indices_vector ON search_indices USING gin(search_vector);

-- Analytics indexes
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_session ON user_events(session_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);
CREATE INDEX idx_user_events_created_at ON user_events(created_at);

-- Audit indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_communities_updated_at BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update search vectors
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_posts_search_vector 
    BEFORE INSERT OR UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Update reaction counts
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET reaction_count = reaction_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_reactions_count
    AFTER INSERT OR DELETE ON post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES 
    ('admin', 'Full system administrator', true),
    ('moderator', 'Community moderator', true),
    ('user', 'Regular user', true),
    ('guest', 'Guest user with limited access', true);

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES 
    ('users.read', 'Read user information', 'users', 'read'),
    ('users.write', 'Update user information', 'users', 'write'),
    ('users.delete', 'Delete users', 'users', 'delete'),
    ('communities.read', 'Read community information', 'communities', 'read'),
    ('communities.write', 'Create and update communities', 'communities', 'write'),
    ('communities.delete', 'Delete communities', 'communities', 'delete'),
    ('communities.moderate', 'Moderate community content', 'communities', 'moderate'),
    ('posts.read', 'Read posts', 'posts', 'read'),
    ('posts.write', 'Create and update posts', 'posts', 'write'),
    ('posts.delete', 'Delete posts', 'posts', 'delete'),
    ('posts.moderate', 'Moderate posts', 'posts', 'moderate');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin'; -- Admin gets all permissions

INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'moderator' AND p.name IN (
    'users.read', 'communities.read', 'communities.moderate', 
    'posts.read', 'posts.moderate'
);

INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'user' AND p.name IN (
    'users.read', 'users.write', 'communities.read', 'communities.write',
    'posts.read', 'posts.write'
);

INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'guest' AND p.name IN (
    'users.read', 'communities.read', 'posts.read'
);

-- Insert default notification types
INSERT INTO notification_types (name, description, default_enabled) VALUES 
    ('new_message', 'New direct message received', true),
    ('new_reaction', 'Someone reacted to your post', true),
    ('new_reply', 'Someone replied to your post', true),
    ('new_mention', 'You were mentioned in a post', true),
    ('new_follower', 'Someone followed you', true),
    ('community_invite', 'You were invited to a community', true),
    ('system_announcement', 'System announcements', true);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Set appropriate statistics targets for better query planning
ALTER TABLE posts ALTER COLUMN created_at SET STATISTICS 1000;
ALTER TABLE users ALTER COLUMN created_at SET STATISTICS 1000;
ALTER TABLE notifications ALTER COLUMN created_at SET STATISTICS 1000;

-- Enable parallel queries for large tables
ALTER TABLE posts SET (parallel_workers = 4);
ALTER TABLE user_events SET (parallel_workers = 4);
ALTER TABLE notifications SET (parallel_workers = 4);

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON SCHEMA public IS 'CRYB Platform comprehensive schema supporting all microservices';

COMMENT ON TABLE users IS 'Core user accounts and authentication data';
COMMENT ON TABLE user_profiles IS 'Extended user profile information and preferences';
COMMENT ON TABLE communities IS 'Discord-style servers/communities';
COMMENT ON TABLE channels IS 'Channels within communities for organized discussions';
COMMENT ON TABLE posts IS 'All user-generated content including messages and posts';
COMMENT ON TABLE notifications IS 'Real-time notification system';
COMMENT ON TABLE media_files IS 'File storage and media management';
COMMENT ON TABLE user_events IS 'Analytics and user behavior tracking';

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================