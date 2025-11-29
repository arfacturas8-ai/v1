-- WebAuthn/FIDO2 Authenticator Device Schema
-- Enterprise-grade support for hardware security keys and biometric authentication

CREATE TABLE IF NOT EXISTS authenticator_devices (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name VARCHAR(100) NOT NULL DEFAULT 'WebAuthn Device',
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('platform', 'cross-platform')),
  attestation_type VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (attestation_type IN ('none', 'basic', 'self', 'attestation-ca')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_verified BOOLEAN NOT NULL DEFAULT false,
  backup_eligible BOOLEAN NOT NULL DEFAULT false,
  backup_state BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_authenticator_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_authenticator_devices_user_id ON authenticator_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_authenticator_devices_credential_id ON authenticator_devices(credential_id);
CREATE INDEX IF NOT EXISTS idx_authenticator_devices_active ON authenticator_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_authenticator_devices_last_used ON authenticator_devices(last_used);

-- Passwordless authentication credentials
CREATE TABLE IF NOT EXISTS passwordless_credentials (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  display_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('platform', 'cross-platform')),
  transport_methods TEXT[] NOT NULL DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_passwordless_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for passwordless credentials
CREATE INDEX IF NOT EXISTS idx_passwordless_credentials_user_id ON passwordless_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passwordless_credentials_active ON passwordless_credentials(user_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_passwordless_credentials_primary ON passwordless_credentials(user_id) WHERE is_primary = true;

-- WebAuthn authentication challenges (stored temporarily)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id VARCHAR(255) PRIMARY KEY,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
  challenge_data TEXT NOT NULL,
  user_id VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_webauthn_challenge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for challenge cleanup
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_type ON webauthn_challenges(user_id, challenge_type);

-- User authentication preferences
CREATE TABLE IF NOT EXISTS user_auth_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  allow_passwordless BOOLEAN NOT NULL DEFAULT false,
  require_webauthn BOOLEAN NOT NULL DEFAULT false,
  preferred_webauthn_method VARCHAR(20) CHECK (preferred_webauthn_method IN ('platform', 'cross-platform', 'any')),
  require_user_verification BOOLEAN NOT NULL DEFAULT false,
  max_session_duration INTERVAL NOT NULL DEFAULT '24 hours',
  require_fresh_auth_for_sensitive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_auth_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn usage analytics for security monitoring
CREATE TABLE IF NOT EXISTS webauthn_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  authenticator_id VARCHAR(255),
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('registration', 'authentication', 'removal', 'update')),
  credential_id TEXT,
  device_name VARCHAR(100),
  client_ip INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  user_verification_performed BOOLEAN,
  attestation_type VARCHAR(20),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_webauthn_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_webauthn_usage_auth FOREIGN KEY (authenticator_id) REFERENCES authenticator_devices(id) ON DELETE SET NULL
);

-- Indexes for analytics and monitoring
CREATE INDEX IF NOT EXISTS idx_webauthn_usage_logs_user_id ON webauthn_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_usage_logs_timestamp ON webauthn_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_webauthn_usage_logs_action ON webauthn_usage_logs(action_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_webauthn_usage_logs_success ON webauthn_usage_logs(success, timestamp);

-- Device registration rate limiting
CREATE TABLE IF NOT EXISTS webauthn_rate_limits (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  client_ip INET,
  action_type VARCHAR(30) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_attempt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_webauthn_rate_limit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_webauthn_rate_limits_user_action ON webauthn_rate_limits(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_webauthn_rate_limits_ip_action ON webauthn_rate_limits(client_ip, action_type);
CREATE INDEX IF NOT EXISTS idx_webauthn_rate_limits_blocked_until ON webauthn_rate_limits(blocked_until);

-- Security policies for WebAuthn
CREATE TABLE IF NOT EXISTS webauthn_security_policies (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Registration policies
  max_authenticators_per_user INTEGER NOT NULL DEFAULT 10,
  require_attestation BOOLEAN NOT NULL DEFAULT false,
  allowed_attestation_types TEXT[] NOT NULL DEFAULT '{"none","basic","self","attestation-ca"}',
  require_resident_key BOOLEAN NOT NULL DEFAULT false,
  
  -- Authentication policies
  require_user_verification BOOLEAN NOT NULL DEFAULT false,
  allow_cross_platform_auth BOOLEAN NOT NULL DEFAULT true,
  max_authentication_age INTERVAL NOT NULL DEFAULT '24 hours',
  
  -- Rate limiting
  max_registration_attempts_per_hour INTEGER NOT NULL DEFAULT 5,
  max_authentication_attempts_per_minute INTEGER NOT NULL DEFAULT 10,
  lockout_duration INTERVAL NOT NULL DEFAULT '15 minutes',
  
  -- Cleanup policies
  inactive_authenticator_cleanup_days INTEGER NOT NULL DEFAULT 365,
  failed_challenge_cleanup_hours INTEGER NOT NULL DEFAULT 24,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default security policy
INSERT INTO webauthn_security_policies (
  policy_name, 
  description,
  max_authenticators_per_user,
  require_attestation,
  require_user_verification,
  allow_cross_platform_auth
) VALUES (
  'default',
  'Default WebAuthn security policy for CRYB platform',
  10,
  false,
  false,
  true
) ON CONFLICT (policy_name) DO NOTHING;

-- Stored procedures for WebAuthn management

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webauthn_challenges 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  INSERT INTO system_logs (event_type, message, metadata, created_at)
  VALUES (
    'webauthn_cleanup',
    'Cleaned up expired WebAuthn challenges',
    jsonb_build_object('deleted_count', deleted_count),
    NOW()
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to disable inactive authenticators
CREATE OR REPLACE FUNCTION disable_inactive_authenticators(inactive_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  disabled_count INTEGER;
BEGIN
  UPDATE authenticator_devices 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND (last_used IS NULL OR last_used < NOW() - INTERVAL '1 day' * inactive_days);
  
  GET DIAGNOSTICS disabled_count = ROW_COUNT;
  
  INSERT INTO system_logs (event_type, message, metadata, created_at)
  VALUES (
    'webauthn_cleanup',
    'Disabled inactive authenticators',
    jsonb_build_object('disabled_count', disabled_count, 'inactive_days', inactive_days),
    NOW()
  );
  
  RETURN disabled_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's authenticator summary
CREATE OR REPLACE FUNCTION get_user_webauthn_summary(p_user_id VARCHAR(255))
RETURNS TABLE (
  total_authenticators INTEGER,
  active_authenticators INTEGER,
  platform_authenticators INTEGER,
  cross_platform_authenticators INTEGER,
  recently_used_count INTEGER,
  passwordless_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_authenticators,
    COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_authenticators,
    COUNT(*) FILTER (WHERE device_type = 'platform' AND is_active = true)::INTEGER as platform_authenticators,
    COUNT(*) FILTER (WHERE device_type = 'cross-platform' AND is_active = true)::INTEGER as cross_platform_authenticators,
    COUNT(*) FILTER (WHERE last_used > NOW() - INTERVAL '30 days' AND is_active = true)::INTEGER as recently_used_count,
    COALESCE(uap.allow_passwordless, false) as passwordless_enabled
  FROM authenticator_devices ad
  LEFT JOIN user_auth_preferences uap ON uap.user_id = ad.user_id
  WHERE ad.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_authenticator_devices_updated_at ON authenticator_devices;
CREATE TRIGGER trigger_authenticator_devices_updated_at
  BEFORE UPDATE ON authenticator_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_auth_preferences_updated_at ON user_auth_preferences;
CREATE TRIGGER trigger_user_auth_preferences_updated_at
  BEFORE UPDATE ON user_auth_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_webauthn_security_policies_updated_at ON webauthn_security_policies;
CREATE TRIGGER trigger_webauthn_security_policies_updated_at
  BEFORE UPDATE ON webauthn_security_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for monitoring and analytics

-- Active authenticators overview
CREATE OR REPLACE VIEW webauthn_active_devices AS
SELECT 
  ad.id,
  ad.user_id,
  u.username,
  u.email,
  ad.device_name,
  ad.device_type,
  ad.created_at,
  ad.last_used,
  ad.counter,
  ad.user_verified,
  CASE 
    WHEN ad.last_used > NOW() - INTERVAL '7 days' THEN 'active'
    WHEN ad.last_used > NOW() - INTERVAL '30 days' THEN 'occasional'
    WHEN ad.last_used IS NULL THEN 'unused'
    ELSE 'inactive'
  END as usage_status
FROM authenticator_devices ad
JOIN users u ON u.id = ad.user_id
WHERE ad.is_active = true;

-- WebAuthn security metrics
CREATE OR REPLACE VIEW webauthn_security_metrics AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  action_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE success = true) as successful_attempts,
  COUNT(*) FILTER (WHERE success = false) as failed_attempts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT client_ip) as unique_ips
FROM webauthn_usage_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), action_type
ORDER BY date DESC, action_type;

-- Comment on tables for documentation
COMMENT ON TABLE authenticator_devices IS 'WebAuthn/FIDO2 authenticator devices registered by users';
COMMENT ON TABLE passwordless_credentials IS 'Dedicated passwordless authentication credentials';
COMMENT ON TABLE webauthn_challenges IS 'Temporary storage for WebAuthn registration and authentication challenges';
COMMENT ON TABLE user_auth_preferences IS 'User preferences for authentication methods and security settings';
COMMENT ON TABLE webauthn_usage_logs IS 'Audit log for WebAuthn device usage and security events';
COMMENT ON TABLE webauthn_rate_limits IS 'Rate limiting data for WebAuthn operations';
COMMENT ON TABLE webauthn_security_policies IS 'Configurable security policies for WebAuthn operations';

-- Grants for application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryb_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryb_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cryb_app_user;