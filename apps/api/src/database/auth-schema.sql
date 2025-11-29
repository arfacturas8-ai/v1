-- ============================================
-- COMPREHENSIVE AUTHENTICATION DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (enhanced with security features)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_history JSONB DEFAULT '[]',
    require_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_username_format CHECK (username ~* '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_version INTEGER DEFAULT 1,
    device_fingerprint VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    location JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_user_sessions_user_id ON user_sessions(user_id),
    INDEX idx_user_sessions_session_token ON user_sessions(session_token),
    INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token),
    INDEX idx_user_sessions_expires_at ON user_sessions(expires_at),
    INDEX idx_user_sessions_is_active ON user_sessions(is_active)
);

-- Two-factor authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    backup_codes JSONB DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id),
    INDEX idx_two_factor_auth_is_enabled ON two_factor_auth(is_enabled)
);

-- OAuth providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'discord', 'github', 'twitter', 'apple')),
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_username VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(provider, provider_id),
    INDEX idx_oauth_providers_user_id ON oauth_providers(user_id),
    INDEX idx_oauth_providers_provider ON oauth_providers(provider),
    INDEX idx_oauth_providers_provider_id ON oauth_providers(provider_id)
);

-- WebAuthn credentials table
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    device_type VARCHAR(100) NOT NULL,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id),
    INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id),
    INDEX idx_webauthn_credentials_is_active ON webauthn_credentials(is_active)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(resource, action),
    INDEX idx_permissions_name ON permissions(name),
    INDEX idx_permissions_resource ON permissions(resource),
    INDEX idx_permissions_action ON permissions(action)
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_roles_name ON roles(name),
    INDEX idx_roles_is_system ON roles(is_system)
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE(user_id, role_id),
    INDEX idx_user_roles_user_id ON user_roles(user_id),
    INDEX idx_user_roles_role_id ON user_roles(role_id),
    INDEX idx_user_roles_expires_at ON user_roles(expires_at)
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    rate_limit INTEGER DEFAULT 1000,
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_api_keys_user_id ON api_keys(user_id),
    INDEX idx_api_keys_key_hash ON api_keys(key_hash),
    INDEX idx_api_keys_key_prefix ON api_keys(key_prefix),
    INDEX idx_api_keys_is_active ON api_keys(is_active),
    INDEX idx_api_keys_expires_at ON api_keys(expires_at)
);

-- Security events table (audit log)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'login', 'logout', 'failed_login', 'password_change', 'email_change',
        'mfa_enabled', 'mfa_disabled', 'account_locked', 'suspicious_activity',
        'api_key_created', 'api_key_revoked', 'oauth_connected', 'oauth_disconnected',
        'webauthn_registered', 'webauthn_used', 'role_assigned', 'role_revoked'
    )),
    ip_address INET NOT NULL,
    user_agent TEXT,
    location JSONB,
    metadata JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_security_events_user_id ON security_events(user_id),
    INDEX idx_security_events_event_type ON security_events(event_type),
    INDEX idx_security_events_created_at ON security_events(created_at),
    INDEX idx_security_events_risk_score ON security_events(risk_score),
    INDEX idx_security_events_ip_address ON security_events(ip_address)
);

-- Account lockouts table
CREATE TABLE IF NOT EXISTS account_lockouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('failed_attempts', 'suspicious_activity', 'admin_action', 'security_policy')),
    locked_by UUID REFERENCES users(id),
    locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_account_lockouts_user_id ON account_lockouts(user_id),
    INDEX idx_account_lockouts_locked_until ON account_lockouts(locked_until),
    INDEX idx_account_lockouts_reason ON account_lockouts(reason)
);

-- Password policies table
CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    min_length INTEGER DEFAULT 8,
    max_length INTEGER DEFAULT 128,
    require_uppercase BOOLEAN DEFAULT TRUE,
    require_lowercase BOOLEAN DEFAULT TRUE,
    require_numbers BOOLEAN DEFAULT TRUE,
    require_symbols BOOLEAN DEFAULT FALSE,
    forbidden_patterns JSONB DEFAULT '[]',
    max_age_days INTEGER,
    history_count INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_password_policies_name ON password_policies(name),
    INDEX idx_password_policies_is_active ON password_policies(is_active)
);

-- OAuth states table (for CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(50) NOT NULL,
    redirect_uri TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_oauth_states_state ON oauth_states(state),
    INDEX idx_oauth_states_expires_at ON oauth_states(expires_at)
);

-- Rate limiting table (stored in database for persistence)
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, API key, etc.
    endpoint VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(identifier, endpoint),
    INDEX idx_rate_limits_identifier ON rate_limits(identifier),
    INDEX idx_rate_limits_endpoint ON rate_limits(endpoint),
    INDEX idx_rate_limits_reset_at ON rate_limits(reset_at)
);

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('user:read:own', 'Read own user profile', 'user', 'read:own'),
    ('user:update:own', 'Update own user profile', 'user', 'update:own'),
    ('user:delete:own', 'Delete own user account', 'user', 'delete:own'),
    ('user:read:all', 'Read all user profiles', 'user', 'read:all'),
    ('user:update:all', 'Update any user profile', 'user', 'update:all'),
    ('user:delete:all', 'Delete any user account', 'user', 'delete:all'),
    
    ('posts:create', 'Create posts', 'posts', 'create'),
    ('posts:read', 'Read posts', 'posts', 'read'),
    ('posts:update:own', 'Update own posts', 'posts', 'update:own'),
    ('posts:update:all', 'Update any posts', 'posts', 'update:all'),
    ('posts:delete:own', 'Delete own posts', 'posts', 'delete:own'),
    ('posts:delete:all', 'Delete any posts', 'posts', 'delete:all'),
    
    ('comments:create', 'Create comments', 'comments', 'create'),
    ('comments:read', 'Read comments', 'comments', 'read'),
    ('comments:update:own', 'Update own comments', 'comments', 'update:own'),
    ('comments:update:all', 'Update any comments', 'comments', 'update:all'),
    ('comments:delete:own', 'Delete own comments', 'comments', 'delete:own'),
    ('comments:delete:all', 'Delete any comments', 'comments', 'delete:all'),
    
    ('channels:create', 'Create channels', 'channels', 'create'),
    ('channels:read', 'Read channels', 'channels', 'read'),
    ('channels:update', 'Update channels', 'channels', 'update'),
    ('channels:delete', 'Delete channels', 'channels', 'delete'),
    ('channels:manage', 'Manage channel permissions', 'channels', 'manage'),
    
    ('messages:create', 'Create messages', 'messages', 'create'),
    ('messages:read', 'Read messages', 'messages', 'read'),
    ('messages:update:own', 'Update own messages', 'messages', 'update:own'),
    ('messages:delete:own', 'Delete own messages', 'messages', 'delete:own'),
    ('messages:delete:all', 'Delete any messages', 'messages', 'delete:all'),
    
    ('moderation:read', 'Read moderation logs', 'moderation', 'read'),
    ('moderation:create', 'Create moderation actions', 'moderation', 'create'),
    ('moderation:ban', 'Ban users', 'moderation', 'ban'),
    ('moderation:kick', 'Kick users', 'moderation', 'kick'),
    ('moderation:mute', 'Mute users', 'moderation', 'mute'),
    
    ('admin:users', 'Administer users', 'admin', 'users'),
    ('admin:roles', 'Administer roles', 'admin', 'roles'),
    ('admin:permissions', 'Administer permissions', 'admin', 'permissions'),
    ('admin:system', 'System administration', 'admin', 'system'),
    ('admin:analytics', 'View analytics', 'admin', 'analytics')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, permissions, is_system) VALUES
    ('super_admin', 'Super Administrator with all permissions', '["admin:users", "admin:roles", "admin:permissions", "admin:system", "admin:analytics", "moderation:read", "moderation:create", "moderation:ban", "moderation:kick", "moderation:mute", "user:read:all", "user:update:all", "user:delete:all", "posts:read", "posts:update:all", "posts:delete:all", "comments:read", "comments:update:all", "comments:delete:all", "channels:create", "channels:read", "channels:update", "channels:delete", "channels:manage", "messages:read", "messages:delete:all"]', true),
    
    ('admin', 'Administrator with user and content management permissions', '["admin:users", "admin:analytics", "moderation:read", "moderation:create", "moderation:ban", "moderation:kick", "moderation:mute", "user:read:all", "user:update:all", "posts:read", "posts:update:all", "posts:delete:all", "comments:read", "comments:update:all", "comments:delete:all", "channels:create", "channels:read", "channels:update", "channels:delete", "messages:read", "messages:delete:all"]', true),
    
    ('moderator', 'Moderator with content moderation permissions', '["moderation:read", "moderation:create", "moderation:kick", "moderation:mute", "user:read:all", "posts:read", "posts:update:all", "posts:delete:all", "comments:read", "comments:update:all", "comments:delete:all", "channels:read", "channels:update", "messages:read", "messages:delete:all"]', true),
    
    ('user', 'Regular user with basic permissions', '["user:read:own", "user:update:own", "user:delete:own", "posts:create", "posts:read", "posts:update:own", "posts:delete:own", "comments:create", "comments:read", "comments:update:own", "comments:delete:own", "channels:read", "messages:create", "messages:read", "messages:update:own", "messages:delete:own"]', true),
    
    ('guest', 'Guest user with read-only permissions', '["posts:read", "comments:read", "channels:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default password policy
INSERT INTO password_policies (name, min_length, max_length, require_uppercase, require_lowercase, require_numbers, require_symbols, forbidden_patterns, max_age_days, history_count, is_active) VALUES
    ('default', 8, 128, true, true, true, false, '["password", "123456", "qwerty", "admin", "letmein", "welcome"]', 90, 5, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_providers_updated_at BEFORE UPDATE ON oauth_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webauthn_credentials_updated_at BEFORE UPDATE ON webauthn_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_password_policies_updated_at BEFORE UPDATE ON password_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired oauth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits WHERE reset_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_security_events_user_time ON security_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_provider ON oauth_providers(user_id, provider);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(key_hash) WHERE is_active = true;

COMMIT;