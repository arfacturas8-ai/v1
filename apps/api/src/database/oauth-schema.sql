-- Enhanced OAuth2 and Social Login Schema
-- Enterprise-grade OAuth integration with multiple providers

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  picture TEXT,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  provider_data JSONB, -- Raw data from provider
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_oauth_account_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_id)
);

-- Indexes for OAuth accounts
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_id ON oauth_accounts(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_active ON oauth_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_last_used ON oauth_accounts(last_used);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_expires ON oauth_accounts(access_token_expires_at);

-- OAuth provider configurations
CREATE TABLE IF NOT EXISTS oauth_providers (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  auth_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  user_info_url TEXT,
  client_id VARCHAR(255) NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL, -- Hashed client secret
  default_scopes TEXT[] NOT NULL DEFAULT '{}',
  supported_scopes TEXT[] NOT NULL DEFAULT '{}',
  pkce_supported BOOLEAN NOT NULL DEFAULT false,
  openid_connect BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  icon_color VARCHAR(7), -- Hex color code
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default OAuth providers
INSERT INTO oauth_providers (
  name, display_name, auth_url, token_url, user_info_url, 
  client_id, client_secret_hash, default_scopes, pkce_supported, openid_connect,
  logo_url, icon_color, sort_order
) VALUES 
(
  'google', 'Google', 
  'https://accounts.google.com/o/oauth2/v2/auth',
  'https://oauth2.googleapis.com/token',
  'https://www.googleapis.com/oauth2/v2/userinfo',
  COALESCE(NULLIF(current_setting('app.google_client_id', true), ''), 'not_configured'),
  'placeholder_hash',
  '{"openid","email","profile"}',
  true, true,
  'https://developers.google.com/identity/images/g-logo.png',
  '#4285f4', 1
),
(
  'discord', 'Discord',
  'https://discord.com/api/oauth2/authorize',
  'https://discord.com/api/oauth2/token',
  'https://discord.com/api/v10/users/@me',
  COALESCE(NULLIF(current_setting('app.discord_client_id', true), ''), 'not_configured'),
  'placeholder_hash',
  '{"identify","email"}',
  false, false,
  'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
  '#5865f2', 2
),
(
  'github', 'GitHub',
  'https://github.com/login/oauth/authorize',
  'https://github.com/login/oauth/access_token',
  'https://api.github.com/user',
  COALESCE(NULLIF(current_setting('app.github_client_id', true), ''), 'not_configured'),
  'placeholder_hash',
  '{"user:email","read:user"}',
  true, false,
  'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
  '#24292e', 3
),
(
  'apple', 'Apple',
  'https://appleid.apple.com/auth/authorize',
  'https://appleid.apple.com/auth/token',
  '',
  COALESCE(NULLIF(current_setting('app.apple_client_id', true), ''), 'not_configured'),
  'placeholder_hash',
  '{"name","email"}',
  true, true,
  'https://developer.apple.com/assets/elements/icons/sign-in-with-apple/sign-in-with-apple.svg',
  '#000000', 4
),
(
  'microsoft', 'Microsoft',
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  'https://graph.microsoft.com/v1.0/me',
  COALESCE(NULLIF(current_setting('app.microsoft_client_id', true), ''), 'not_configured'),
  'placeholder_hash',
  '{"openid","profile","email"}',
  true, true,
  'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
  '#00a4ef', 5
)
ON CONFLICT (name) DO NOTHING;

-- OAuth audit logs
CREATE TABLE IF NOT EXISTS oauth_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  provider VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- login, account_linked, account_unlinked, token_refreshed, user_created
  client_ip INET,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_oauth_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for OAuth audit logs
CREATE INDEX IF NOT EXISTS idx_oauth_audit_logs_user_id ON oauth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_logs_provider ON oauth_audit_logs(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_logs_action ON oauth_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_logs_timestamp ON oauth_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_oauth_audit_logs_provider_action ON oauth_audit_logs(provider, action, timestamp);

-- OAuth state management (for tracking authorization flows)
CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  redirect_uri TEXT NOT NULL,
  code_verifier VARCHAR(255), -- For PKCE
  scopes TEXT[] NOT NULL DEFAULT '{}',
  linking BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT fk_oauth_state_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for OAuth states
CREATE INDEX IF NOT EXISTS idx_oauth_states_provider ON oauth_states(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- OAuth rate limiting
CREATE TABLE IF NOT EXISTS oauth_rate_limits (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  client_ip INET,
  user_id VARCHAR(255),
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_oauth_rate_limit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for OAuth rate limiting
CREATE INDEX IF NOT EXISTS idx_oauth_rate_limits_provider ON oauth_rate_limits(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_rate_limits_ip ON oauth_rate_limits(client_ip);
CREATE INDEX IF NOT EXISTS idx_oauth_rate_limits_user ON oauth_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_rate_limits_window ON oauth_rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_oauth_rate_limits_blocked ON oauth_rate_limits(is_blocked, blocked_until);

-- OAuth application registrations (for when users register their own OAuth apps)
CREATE TABLE IF NOT EXISTS oauth_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  client_id VARCHAR(255) NOT NULL UNIQUE,
  client_secret_hash VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL DEFAULT '{}',
  website_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  logo_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_oauth_app_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for OAuth applications
CREATE INDEX IF NOT EXISTS idx_oauth_applications_user_id ON oauth_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_applications_client_id ON oauth_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_applications_active ON oauth_applications(is_active);
CREATE INDEX IF NOT EXISTS idx_oauth_applications_verified ON oauth_applications(is_verified);

-- OAuth application usage statistics
CREATE TABLE IF NOT EXISTS oauth_app_usage_stats (
  id BIGSERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT fk_oauth_usage_app FOREIGN KEY (application_id) REFERENCES oauth_applications(id) ON DELETE CASCADE,
  UNIQUE(application_id, date)
);

-- Indexes for OAuth application usage stats
CREATE INDEX IF NOT EXISTS idx_oauth_app_usage_app_id ON oauth_app_usage_stats(application_id);
CREATE INDEX IF NOT EXISTS idx_oauth_app_usage_date ON oauth_app_usage_stats(date);

-- OAuth user preferences
CREATE TABLE IF NOT EXISTS oauth_user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  auto_link_accounts BOOLEAN NOT NULL DEFAULT false,
  preferred_providers TEXT[] NOT NULL DEFAULT '{}',
  privacy_settings JSONB NOT NULL DEFAULT '{"share_email": true, "share_profile": true}',
  notification_preferences JSONB NOT NULL DEFAULT '{"login_notifications": true, "link_notifications": true}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_oauth_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stored procedures for OAuth management

-- Function to clean up expired OAuth data
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_data()
RETURNS INTEGER AS $$
DECLARE
  total_deleted INTEGER := 0;
  deleted_count INTEGER;
BEGIN
  -- Clean up expired OAuth states
  DELETE FROM oauth_states WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up expired rate limit windows
  DELETE FROM oauth_rate_limits WHERE window_end < NOW() AND NOT is_blocked;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Unblock expired rate limits
  UPDATE oauth_rate_limits 
  SET is_blocked = false, blocked_until = NULL 
  WHERE is_blocked = true AND blocked_until < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  INSERT INTO system_logs (event_type, message, metadata, created_at)
  VALUES (
    'oauth_cleanup',
    'Cleaned up expired OAuth data',
    jsonb_build_object('total_deleted', total_deleted),
    NOW()
  );
  
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to check OAuth rate limits
CREATE OR REPLACE FUNCTION check_oauth_rate_limit(
  p_provider VARCHAR(50),
  p_client_ip INET,
  p_user_id VARCHAR(255) DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  rate_limit_id VARCHAR(255);
  current_window_start TIMESTAMP WITH TIME ZONE;
  current_window_end TIMESTAMP WITH TIME ZONE;
  existing_record oauth_rate_limits%ROWTYPE;
BEGIN
  -- Calculate current window (1 hour)
  current_window_start := DATE_TRUNC('hour', NOW());
  current_window_end := current_window_start + INTERVAL '1 hour';
  
  -- Generate rate limit ID
  rate_limit_id := p_provider || ':' || COALESCE(p_client_ip::text, 'unknown') || ':' || COALESCE(p_user_id, 'anonymous');
  
  -- Get or create rate limit record
  SELECT * INTO existing_record
  FROM oauth_rate_limits
  WHERE id = rate_limit_id AND window_end > NOW();
  
  IF existing_record.id IS NULL THEN
    -- Create new rate limit record
    INSERT INTO oauth_rate_limits (
      id, provider, client_ip, user_id, request_count, 
      window_start, window_end
    ) VALUES (
      rate_limit_id, p_provider, p_client_ip, p_user_id, 1,
      current_window_start, current_window_end
    );
    
    RETURN QUERY SELECT true, 1, current_window_end;
  ELSE
    -- Update existing record
    UPDATE oauth_rate_limits
    SET request_count = request_count + 1
    WHERE id = rate_limit_id;
    
    -- Check if over limit
    IF existing_record.request_count + 1 > p_limit THEN
      -- Block for remainder of window
      UPDATE oauth_rate_limits
      SET is_blocked = true, blocked_until = window_end
      WHERE id = rate_limit_id;
      
      RETURN QUERY SELECT false, existing_record.request_count + 1, existing_record.window_end;
    ELSE
      RETURN QUERY SELECT true, existing_record.request_count + 1, existing_record.window_end;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's OAuth summary
CREATE OR REPLACE FUNCTION get_user_oauth_summary(p_user_id VARCHAR(255))
RETURNS TABLE (
  total_accounts INTEGER,
  active_accounts INTEGER,
  providers TEXT[],
  last_login TIMESTAMP WITH TIME ZONE,
  account_creation_method VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(oa.id)::INTEGER as total_accounts,
    COUNT(oa.id) FILTER (WHERE oa.is_active = true)::INTEGER as active_accounts,
    ARRAY_AGG(oa.provider) FILTER (WHERE oa.is_active = true) as providers,
    MAX(oa.last_used) as last_login,
    (
      SELECT oal.provider
      FROM oauth_audit_logs oal
      WHERE oal.user_id = p_user_id AND oal.action = 'user_created'
      ORDER BY oal.timestamp ASC
      LIMIT 1
    ) as account_creation_method
  FROM oauth_accounts oa
  WHERE oa.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh OAuth access token
CREATE OR REPLACE FUNCTION refresh_oauth_token(
  p_account_id VARCHAR(255),
  p_new_access_token TEXT,
  p_new_refresh_token TEXT DEFAULT NULL,
  p_expires_in INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate new expiration time
  IF p_expires_in IS NOT NULL THEN
    new_expires_at := NOW() + (p_expires_in || ' seconds')::INTERVAL;
  END IF;
  
  -- Update the account
  UPDATE oauth_accounts
  SET 
    access_token = p_new_access_token,
    refresh_token = COALESCE(p_new_refresh_token, refresh_token),
    access_token_expires_at = new_expires_at,
    last_used = NOW(),
    updated_at = NOW()
  WHERE id = p_account_id AND is_active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS trigger_oauth_accounts_updated_at ON oauth_accounts;
CREATE TRIGGER trigger_oauth_accounts_updated_at
  BEFORE UPDATE ON oauth_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_oauth_providers_updated_at ON oauth_providers;
CREATE TRIGGER trigger_oauth_providers_updated_at
  BEFORE UPDATE ON oauth_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_oauth_applications_updated_at ON oauth_applications;
CREATE TRIGGER trigger_oauth_applications_updated_at
  BEFORE UPDATE ON oauth_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_oauth_user_preferences_updated_at ON oauth_user_preferences;
CREATE TRIGGER trigger_oauth_user_preferences_updated_at
  BEFORE UPDATE ON oauth_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for monitoring and analytics

-- OAuth provider usage statistics
CREATE OR REPLACE VIEW oauth_provider_stats AS
SELECT 
  oa.provider,
  op.display_name,
  COUNT(oa.id) as total_accounts,
  COUNT(oa.id) FILTER (WHERE oa.is_active = true) as active_accounts,
  COUNT(DISTINCT oa.user_id) as unique_users,
  COUNT(oa.id) FILTER (WHERE oa.created_at > NOW() - INTERVAL '30 days') as accounts_last_30_days,
  COUNT(oa.id) FILTER (WHERE oa.last_used > NOW() - INTERVAL '30 days') as active_last_30_days,
  AVG(EXTRACT(EPOCH FROM (NOW() - oa.last_used))/86400) FILTER (WHERE oa.last_used IS NOT NULL) as avg_days_since_last_use
FROM oauth_accounts oa
LEFT JOIN oauth_providers op ON op.name = oa.provider
GROUP BY oa.provider, op.display_name
ORDER BY total_accounts DESC;

-- OAuth authentication trends
CREATE OR REPLACE VIEW oauth_auth_trends AS
SELECT 
  DATE_TRUNC('day', oal.timestamp) as date,
  oal.provider,
  oal.action,
  COUNT(*) as event_count,
  COUNT(DISTINCT oal.user_id) as unique_users,
  COUNT(DISTINCT oal.client_ip) as unique_ips
FROM oauth_audit_logs oal
WHERE oal.timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', oal.timestamp), oal.provider, oal.action
ORDER BY date DESC, provider, action;

-- OAuth security metrics
CREATE OR REPLACE VIEW oauth_security_metrics AS
SELECT 
  provider,
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) FILTER (WHERE action IN ('login', 'user_created')) as auth_attempts,
  COUNT(*) FILTER (WHERE action = 'account_linked') as link_attempts,
  COUNT(*) FILTER (WHERE action = 'account_unlinked') as unlink_attempts,
  COUNT(DISTINCT client_ip) as unique_ips,
  COUNT(DISTINCT user_id) as unique_users
FROM oauth_audit_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY provider, DATE_TRUNC('day', timestamp)
ORDER BY date DESC, provider;

-- Comments on tables for documentation
COMMENT ON TABLE oauth_accounts IS 'OAuth/Social login accounts linked to users';
COMMENT ON TABLE oauth_providers IS 'Configuration for supported OAuth providers';
COMMENT ON TABLE oauth_audit_logs IS 'Audit trail for OAuth authentication events';
COMMENT ON TABLE oauth_states IS 'Temporary state storage for OAuth authorization flows';
COMMENT ON TABLE oauth_rate_limits IS 'Rate limiting for OAuth operations by IP/user';
COMMENT ON TABLE oauth_applications IS 'Third-party applications registered for OAuth';
COMMENT ON TABLE oauth_app_usage_stats IS 'Usage statistics for OAuth applications';
COMMENT ON TABLE oauth_user_preferences IS 'User preferences for OAuth behavior';

-- Grant permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryb_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryb_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryb_app_user;