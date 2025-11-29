-- Biometric Authentication Schema
-- Enterprise-grade biometric authentication support

CREATE TABLE IF NOT EXISTS biometric_auth (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  biometric_type VARCHAR(20) NOT NULL CHECK (biometric_type IN ('fingerprint', 'face', 'voice', 'iris')),
  biometric_hash TEXT NOT NULL, -- Secure hash of biometric template
  quality_score DECIMAL(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  confidence_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.8 CHECK (confidence_threshold >= 0.5 AND confidence_threshold <= 1),
  require_liveness BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  enrollment_data JSONB, -- Additional enrollment metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_biometric_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for biometric authentication
CREATE INDEX IF NOT EXISTS idx_biometric_auth_user_id ON biometric_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_type ON biometric_auth(user_id, biometric_type);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_active ON biometric_auth(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_biometric_auth_last_used ON biometric_auth(last_used);

-- Biometric verification logs
CREATE TABLE IF NOT EXISTS biometric_verification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  biometric_id VARCHAR(255),
  biometric_type VARCHAR(20) NOT NULL,
  verification_result BOOLEAN NOT NULL,
  confidence_score DECIMAL(3,2),
  liveness_check_result BOOLEAN,
  error_message TEXT,
  client_ip INET,
  user_agent TEXT,
  device_info JSONB,
  verification_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_biometric_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_biometric_log_auth FOREIGN KEY (biometric_id) REFERENCES biometric_auth(id) ON DELETE SET NULL
);

-- Indexes for biometric verification logs
CREATE INDEX IF NOT EXISTS idx_biometric_logs_user_id ON biometric_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_time ON biometric_verification_logs(verification_time);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_result ON biometric_verification_logs(verification_result, verification_time);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_type ON biometric_verification_logs(biometric_type, verification_time);

-- Passwordless authentication challenges (enhanced)
CREATE TABLE IF NOT EXISTS passwordless_challenges (
  id VARCHAR(255) PRIMARY KEY,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('webauthn', 'magic-link', 'sms', 'qr-code', 'biometric')),
  user_id VARCHAR(255),
  challenge_data JSONB NOT NULL,
  metadata JSONB,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_passwordless_challenge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for passwordless challenges
CREATE INDEX IF NOT EXISTS idx_passwordless_challenges_type ON passwordless_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_passwordless_challenges_user ON passwordless_challenges(user_id, challenge_type);
CREATE INDEX IF NOT EXISTS idx_passwordless_challenges_expires ON passwordless_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_passwordless_challenges_consumed ON passwordless_challenges(is_consumed, expires_at);

-- Passwordless authentication sessions
CREATE TABLE IF NOT EXISTS passwordless_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  auth_method VARCHAR(20) NOT NULL,
  device_fingerprint TEXT,
  client_ip INET,
  user_agent TEXT,
  device_info JSONB,
  location_data JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT fk_passwordless_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for passwordless sessions
CREATE INDEX IF NOT EXISTS idx_passwordless_sessions_user_id ON passwordless_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_passwordless_sessions_token ON passwordless_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_passwordless_sessions_active ON passwordless_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_passwordless_sessions_expires ON passwordless_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_passwordless_sessions_activity ON passwordless_sessions(last_activity);

-- Magic link tokens
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  redirect_url TEXT,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  one_time_use BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  max_clicks INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  client_ip INET,
  user_agent TEXT,
  
  CONSTRAINT fk_magic_link_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for magic link tokens
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hash ON magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_user ON magic_link_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_consumed ON magic_link_tokens(is_consumed, expires_at);

-- SMS OTP codes
CREATE TABLE IF NOT EXISTS sms_otp_codes (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  client_ip INET,
  user_agent TEXT,
  
  CONSTRAINT fk_sms_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for SMS OTP codes
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_phone ON sms_otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_user ON sms_otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_expires ON sms_otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_otp_codes_verified ON sms_otp_codes(is_verified, expires_at);

-- QR code authentication
CREATE TABLE IF NOT EXISTS qr_code_auth (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  qr_data JSONB NOT NULL,
  device_id VARCHAR(255),
  is_scanned BOOLEAN NOT NULL DEFAULT false,
  is_authenticated BOOLEAN NOT NULL DEFAULT false,
  scan_count INTEGER NOT NULL DEFAULT 0,
  max_scans INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE,
  authenticated_at TIMESTAMP WITH TIME ZONE,
  scanner_ip INET,
  scanner_user_agent TEXT,
  
  CONSTRAINT fk_qr_code_auth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for QR code authentication
CREATE INDEX IF NOT EXISTS idx_qr_code_auth_token ON qr_code_auth(qr_token);
CREATE INDEX IF NOT EXISTS idx_qr_code_auth_user ON qr_code_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_auth_device ON qr_code_auth(device_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_auth_expires ON qr_code_auth(expires_at);
CREATE INDEX IF NOT EXISTS idx_qr_code_auth_scanned ON qr_code_auth(is_scanned, expires_at);

-- Progressive user registration tracking
CREATE TABLE IF NOT EXISTS progressive_registrations (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  registration_method VARCHAR(20) NOT NULL,
  step_completed VARCHAR(50) NOT NULL,
  step_data JSONB,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_progressive_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for progressive registrations
CREATE INDEX IF NOT EXISTS idx_progressive_reg_user_id ON progressive_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_progressive_reg_method ON progressive_registrations(registration_method);
CREATE INDEX IF NOT EXISTS idx_progressive_reg_completed ON progressive_registrations(is_completed, created_at);

-- Device trust scores for passwordless authentication
CREATE TABLE IF NOT EXISTS device_trust_scores (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  trust_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
  successful_auths INTEGER NOT NULL DEFAULT 0,
  failed_auths INTEGER NOT NULL DEFAULT 0,
  last_auth_success TIMESTAMP WITH TIME ZONE,
  last_auth_failure TIMESTAMP WITH TIME ZONE,
  device_info JSONB,
  location_consistency_score DECIMAL(3,2) DEFAULT 0.5,
  behavioral_consistency_score DECIMAL(3,2) DEFAULT 0.5,
  is_trusted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_device_trust_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_fingerprint)
);

-- Indexes for device trust scores
CREATE INDEX IF NOT EXISTS idx_device_trust_user_id ON device_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_device_trust_fingerprint ON device_trust_scores(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_trust_score ON device_trust_scores(trust_score);
CREATE INDEX IF NOT EXISTS idx_device_trust_trusted ON device_trust_scores(user_id, is_trusted);

-- Stored procedures for passwordless authentication

-- Function to clean up expired challenges and tokens
CREATE OR REPLACE FUNCTION cleanup_expired_passwordless_data()
RETURNS INTEGER AS $$
DECLARE
  total_deleted INTEGER := 0;
  deleted_count INTEGER;
BEGIN
  -- Clean up expired challenges
  DELETE FROM passwordless_challenges WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up expired magic link tokens
  DELETE FROM magic_link_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up expired SMS OTP codes
  DELETE FROM sms_otp_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up expired QR codes
  DELETE FROM qr_code_auth WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  -- Clean up expired sessions
  UPDATE passwordless_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  total_deleted := total_deleted + deleted_count;
  
  INSERT INTO system_logs (event_type, message, metadata, created_at)
  VALUES (
    'passwordless_cleanup',
    'Cleaned up expired passwordless authentication data',
    jsonb_build_object('total_deleted', total_deleted),
    NOW()
  );
  
  RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to update device trust score
CREATE OR REPLACE FUNCTION update_device_trust_score(
  p_user_id VARCHAR(255),
  p_device_fingerprint VARCHAR(255),
  p_auth_success BOOLEAN,
  p_device_info JSONB DEFAULT NULL
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  current_score DECIMAL(3,2);
  new_score DECIMAL(3,2);
BEGIN
  -- Get current trust score or create new record
  INSERT INTO device_trust_scores (
    id, user_id, device_fingerprint, device_info
  ) VALUES (
    gen_random_uuid()::varchar, p_user_id, p_device_fingerprint, p_device_info
  ) ON CONFLICT (user_id, device_fingerprint) DO NOTHING;
  
  -- Get current score
  SELECT trust_score INTO current_score
  FROM device_trust_scores
  WHERE user_id = p_user_id AND device_fingerprint = p_device_fingerprint;
  
  -- Calculate new score based on success/failure
  IF p_auth_success THEN
    new_score := LEAST(1.0, current_score + 0.1);
    
    UPDATE device_trust_scores
    SET 
      trust_score = new_score,
      successful_auths = successful_auths + 1,
      last_auth_success = NOW(),
      is_trusted = (new_score >= 0.8),
      updated_at = NOW()
    WHERE user_id = p_user_id AND device_fingerprint = p_device_fingerprint;
  ELSE
    new_score := GREATEST(0.0, current_score - 0.2);
    
    UPDATE device_trust_scores
    SET 
      trust_score = new_score,
      failed_auths = failed_auths + 1,
      last_auth_failure = NOW(),
      is_trusted = (new_score >= 0.8),
      updated_at = NOW()
    WHERE user_id = p_user_id AND device_fingerprint = p_device_fingerprint;
  END IF;
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's passwordless authentication summary
CREATE OR REPLACE FUNCTION get_user_passwordless_summary(p_user_id VARCHAR(255))
RETURNS TABLE (
  biometric_methods_count INTEGER,
  active_sessions_count INTEGER,
  trusted_devices_count INTEGER,
  recent_auth_attempts INTEGER,
  passwordless_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ba.id)::INTEGER as biometric_methods_count,
    COUNT(ps.id) FILTER (WHERE ps.is_active = true)::INTEGER as active_sessions_count,
    COUNT(dts.id) FILTER (WHERE dts.is_trusted = true)::INTEGER as trusted_devices_count,
    COUNT(bvl.id) FILTER (WHERE bvl.verification_time > NOW() - INTERVAL '7 days')::INTEGER as recent_auth_attempts,
    (COUNT(ba.id) > 0 OR COUNT(ad.id) > 0)::BOOLEAN as passwordless_enabled
  FROM users u
  LEFT JOIN biometric_auth ba ON ba.user_id = u.id AND ba.is_active = true
  LEFT JOIN passwordless_sessions ps ON ps.user_id = u.id
  LEFT JOIN device_trust_scores dts ON dts.user_id = u.id
  LEFT JOIN biometric_verification_logs bvl ON bvl.user_id = u.id
  LEFT JOIN authenticator_devices ad ON ad.user_id = u.id AND ad.is_active = true
  WHERE u.id = p_user_id
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS trigger_biometric_auth_updated_at ON biometric_auth;
CREATE TRIGGER trigger_biometric_auth_updated_at
  BEFORE UPDATE ON biometric_auth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_device_trust_scores_updated_at ON device_trust_scores;
CREATE TRIGGER trigger_device_trust_scores_updated_at
  BEFORE UPDATE ON device_trust_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for monitoring and analytics

-- Passwordless authentication metrics
CREATE OR REPLACE VIEW passwordless_auth_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  auth_method,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/3600) as avg_session_hours
FROM passwordless_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), auth_method
ORDER BY date DESC, auth_method;

-- Biometric authentication success rates
CREATE OR REPLACE VIEW biometric_success_rates AS
SELECT 
  biometric_type,
  DATE_TRUNC('day', verification_time) as date,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE verification_result = true) as successful_attempts,
  (COUNT(*) FILTER (WHERE verification_result = true)::DECIMAL / COUNT(*) * 100) as success_rate,
  AVG(confidence_score) FILTER (WHERE verification_result = true) as avg_confidence
FROM biometric_verification_logs
WHERE verification_time > NOW() - INTERVAL '30 days'
GROUP BY biometric_type, DATE_TRUNC('day', verification_time)
ORDER BY date DESC, biometric_type;

-- Device trust distribution
CREATE OR REPLACE VIEW device_trust_distribution AS
SELECT 
  CASE 
    WHEN trust_score >= 0.9 THEN 'Very High'
    WHEN trust_score >= 0.8 THEN 'High'
    WHEN trust_score >= 0.6 THEN 'Medium'
    WHEN trust_score >= 0.4 THEN 'Low'
    ELSE 'Very Low'
  END as trust_level,
  COUNT(*) as device_count,
  COUNT(DISTINCT user_id) as user_count,
  AVG(successful_auths) as avg_successful_auths,
  AVG(failed_auths) as avg_failed_auths
FROM device_trust_scores
WHERE updated_at > NOW() - INTERVAL '30 days'
GROUP BY 
  CASE 
    WHEN trust_score >= 0.9 THEN 'Very High'
    WHEN trust_score >= 0.8 THEN 'High'
    WHEN trust_score >= 0.6 THEN 'Medium'
    WHEN trust_score >= 0.4 THEN 'Low'
    ELSE 'Very Low'
  END
ORDER BY MIN(trust_score) DESC;

-- Comments for documentation
COMMENT ON TABLE biometric_auth IS 'Biometric authentication methods registered by users';
COMMENT ON TABLE biometric_verification_logs IS 'Audit log for biometric authentication attempts';
COMMENT ON TABLE passwordless_challenges IS 'Temporary challenges for passwordless authentication flows';
COMMENT ON TABLE passwordless_sessions IS 'Active passwordless authentication sessions';
COMMENT ON TABLE magic_link_tokens IS 'Magic link tokens for email-based passwordless authentication';
COMMENT ON TABLE sms_otp_codes IS 'SMS OTP codes for phone-based passwordless authentication';
COMMENT ON TABLE qr_code_auth IS 'QR code tokens for cross-device passwordless authentication';
COMMENT ON TABLE progressive_registrations IS 'Tracking progressive user registration steps';
COMMENT ON TABLE device_trust_scores IS 'Trust scores for devices used in passwordless authentication';