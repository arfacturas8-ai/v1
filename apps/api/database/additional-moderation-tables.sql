-- Additional tables needed for the comprehensive moderation system

-- Create the audit log table
CREATE TABLE IF NOT EXISTS moderation_audit_log (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    actor_id VARCHAR(255),
    target_id VARCHAR(255),
    target_type VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    risk_score INTEGER DEFAULT 0,
    event_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
    id VARCHAR(255) PRIMARY KEY,
    incident_type VARCHAR(100) NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, incident_type)
);

-- Create appeal logs table
CREATE TABLE IF NOT EXISTS appeal_logs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    appeal_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation notifications table
CREATE TABLE IF NOT EXISTS moderation_notifications (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    recipient_id VARCHAR(255),
    community_id VARCHAR(255),
    server_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_event_type ON moderation_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_actor ON moderation_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_target ON moderation_audit_log(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_created ON moderation_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_risk ON moderation_audit_log(risk_score);

CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at);

CREATE INDEX IF NOT EXISTS idx_appeal_logs_appeal ON appeal_logs(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_logs_event_type ON appeal_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_appeal_logs_created ON appeal_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_notifications_recipient ON moderation_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_type ON moderation_notifications(type);
CREATE INDEX IF NOT EXISTS idx_moderation_notifications_created ON moderation_notifications(created_at);

-- Ensure we have necessary AI and image analysis fields in uploaded_files if they don't exist
DO $$
BEGIN
    -- Add AI analysis columns to uploaded_files if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploaded_files' AND column_name = 'ai_analysis_id') THEN
        ALTER TABLE uploaded_files ADD COLUMN ai_analysis_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploaded_files' AND column_name = 'moderation_status') THEN
        ALTER TABLE uploaded_files ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'uploaded_files' AND column_name = 'flagged_content') THEN
        ALTER TABLE uploaded_files ADD COLUMN flagged_content BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Add moderation fields to existing content tables if they don't exist
DO $$
BEGIN
    -- Add moderation fields to posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_status') THEN
        ALTER TABLE posts ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'approved';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'ai_analysis_id') THEN
        ALTER TABLE posts ADD COLUMN ai_analysis_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'quarantined_at') THEN
        ALTER TABLE posts ADD COLUMN quarantined_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add moderation fields to comments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'moderation_status') THEN
        ALTER TABLE comments ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'approved';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'ai_analysis_id') THEN
        ALTER TABLE comments ADD COLUMN ai_analysis_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'quarantined_at') THEN
        ALTER TABLE comments ADD COLUMN quarantined_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add moderation fields to messages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'moderation_status') THEN
        ALTER TABLE messages ADD COLUMN moderation_status VARCHAR(50) DEFAULT 'approved';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'ai_analysis_id') THEN
        ALTER TABLE messages ADD COLUMN ai_analysis_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'quarantined_at') THEN
        ALTER TABLE messages ADD COLUMN quarantined_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Add indexes for the new moderation fields
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_quarantined ON posts(quarantined_at);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_quarantined ON comments(quarantined_at);
CREATE INDEX IF NOT EXISTS idx_messages_moderation_status ON messages(moderation_status);
CREATE INDEX IF NOT EXISTS idx_messages_quarantined ON messages(quarantined_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_moderation ON uploaded_files(moderation_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_flagged ON uploaded_files(flagged_content);

-- Insert some sample moderation rules if none exist
INSERT INTO moderation_rules (id, name, description, rule_type, severity, action, auto_action, config) 
SELECT 
    'rule_' || generate_random_uuid(),
    'Sample Rule: ' || rule_name,
    'Sample moderation rule for ' || rule_name,
    rule_type,
    severity,
    action,
    auto_action,
    config::jsonb
FROM (VALUES
    ('Profanity Filter', 'keyword', 'low', 'flag', false, '{"keywords": ["badword1", "badword2"], "strict_mode": false}'),
    ('Spam Detection', 'ai_threshold', 'medium', 'hide', true, '{"ai_model": "openai", "threshold": 0.8, "categories": ["spam"]}'),
    ('Hate Speech Prevention', 'ai_threshold', 'high', 'remove', true, '{"ai_model": "openai", "threshold": 0.7, "categories": ["hate_speech"]}'),
    ('Violence Content', 'ai_threshold', 'critical', 'quarantine', true, '{"ai_model": "openai", "threshold": 0.6, "categories": ["violence", "threat"]}')
) AS sample_rules(rule_name, rule_type, severity, action, auto_action, config)
WHERE NOT EXISTS (SELECT 1 FROM moderation_rules WHERE name LIKE 'Sample Rule:%');

-- Function to generate UUIDs if not exists
CREATE OR REPLACE FUNCTION generate_random_uuid() RETURNS text AS $$
BEGIN
    RETURN substr(md5(random()::text), 1, 8) || '-' || 
           substr(md5(random()::text), 1, 4) || '-' || 
           substr(md5(random()::text), 1, 4) || '-' || 
           substr(md5(random()::text), 1, 4) || '-' || 
           substr(md5(random()::text), 1, 12);
END;
$$ LANGUAGE plpgsql;