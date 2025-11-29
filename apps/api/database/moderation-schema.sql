-- Comprehensive Content Moderation System Database Schema
-- This script extends the existing Prisma schema with advanced moderation capabilities

-- Moderation Configuration Tables
CREATE TABLE IF NOT EXISTS moderation_rules (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- 'keyword', 'pattern', 'ai_threshold', 'user_behavior'
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    action VARCHAR(50) NOT NULL DEFAULT 'flag', -- 'flag', 'hide', 'remove', 'quarantine', 'ban'
    auto_action BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id),
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id)
);

CREATE TABLE IF NOT EXISTS moderation_keywords (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    rule_id VARCHAR(255) REFERENCES moderation_rules(id) ON DELETE CASCADE,
    keyword VARCHAR(500) NOT NULL,
    is_regex BOOLEAN DEFAULT false,
    case_sensitive BOOLEAN DEFAULT false,
    whole_word BOOLEAN DEFAULT true,
    weight FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Content Analysis Tables
CREATE TABLE IF NOT EXISTS ai_content_analysis (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'message', 'image', 'video'
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    toxicity_score FLOAT,
    hate_speech_score FLOAT,
    harassment_score FLOAT,
    spam_score FLOAT,
    nsfw_score FLOAT,
    violence_score FLOAT,
    self_harm_score FLOAT,
    identity_attack_score FLOAT,
    profanity_score FLOAT,
    threat_score FLOAT,
    overall_confidence FLOAT,
    flagged_categories JSONB DEFAULT '[]',
    raw_response JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_by VARCHAR(255) DEFAULT 'ai_system'
);

CREATE TABLE IF NOT EXISTS ai_image_analysis (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    file_id VARCHAR(255) REFERENCES uploaded_files(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'nsfw', 'violence', 'objects', 'faces'
    nsfw_score FLOAT,
    violence_score FLOAT,
    explicit_content BOOLEAN DEFAULT false,
    suggestive_content BOOLEAN DEFAULT false,
    detected_objects JSONB DEFAULT '[]',
    detected_faces INTEGER DEFAULT 0,
    detected_text TEXT,
    moderation_labels JSONB DEFAULT '[]',
    confidence_score FLOAT,
    flagged BOOLEAN DEFAULT false,
    raw_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Reports System
CREATE TABLE IF NOT EXISTS content_reports (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    reporter_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'message', 'user_profile'
    report_category VARCHAR(100) NOT NULL,
    report_subcategory VARCHAR(100),
    description TEXT,
    evidence_urls JSONB DEFAULT '[]',
    reporter_ip VARCHAR(45),
    reporter_user_agent TEXT,
    priority INTEGER DEFAULT 2, -- 1=low, 2=medium, 3=high, 4=critical
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed', 'escalated'
    auto_generated BOOLEAN DEFAULT false,
    ai_analysis_id VARCHAR(255) REFERENCES ai_content_analysis(id),
    duplicate_of VARCHAR(255) REFERENCES content_reports(id),
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255) REFERENCES users(id)
);

-- Moderation Actions and History
CREATE TABLE IF NOT EXISTS moderation_actions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    action_type VARCHAR(50) NOT NULL, -- 'warn', 'mute', 'timeout', 'kick', 'ban', 'shadow_ban', 'content_remove', 'content_hide'
    target_user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    target_content_id VARCHAR(255),
    target_content_type VARCHAR(50), -- 'post', 'comment', 'message'
    moderator_id VARCHAR(255) REFERENCES users(id),
    reason TEXT NOT NULL,
    internal_notes TEXT,
    duration_minutes INTEGER, -- NULL for permanent actions
    severity_level INTEGER DEFAULT 1, -- 1-5 scale
    appeal_deadline TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT false,
    rule_triggered VARCHAR(255) REFERENCES moderation_rules(id),
    report_id VARCHAR(255) REFERENCES content_reports(id),
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'appealed', 'overturned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by VARCHAR(255) REFERENCES users(id)
);

-- User Moderation History and Risk Scoring
CREATE TABLE IF NOT EXISTS user_moderation_history (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    total_reports INTEGER DEFAULT 0,
    total_warnings INTEGER DEFAULT 0,
    total_timeouts INTEGER DEFAULT 0,
    total_bans INTEGER DEFAULT 0,
    total_content_removed INTEGER DEFAULT 0,
    risk_score FLOAT DEFAULT 0.0,
    trust_level INTEGER DEFAULT 1, -- 1-5 scale
    last_violation TIMESTAMP WITH TIME ZONE,
    strikes INTEGER DEFAULT 0,
    reputation_score FLOAT DEFAULT 100.0,
    behavior_flags JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appeals System
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    action_id VARCHAR(255) REFERENCES moderation_actions(id) ON DELETE CASCADE,
    appellant_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    evidence_provided TEXT,
    evidence_urls JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'approved', 'denied', 'escalated'
    reviewer_id VARCHAR(255) REFERENCES users(id),
    review_notes TEXT,
    decision_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE
);

-- Auto-Moderation Queue
CREATE TABLE IF NOT EXISTS moderation_queue (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_preview TEXT,
    user_id VARCHAR(255) REFERENCES users(id),
    ai_analysis_id VARCHAR(255) REFERENCES ai_content_analysis(id),
    triggered_rules JSONB DEFAULT '[]',
    confidence_score FLOAT,
    priority INTEGER DEFAULT 2,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'approved', 'rejected', 'escalated'
    assigned_moderator VARCHAR(255) REFERENCES users(id),
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Moderator Management
CREATE TABLE IF NOT EXISTS moderator_permissions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL, -- 'junior', 'standard', 'senior', 'admin', 'super_admin'
    permissions JSONB NOT NULL DEFAULT '{}',
    can_ban_users BOOLEAN DEFAULT false,
    can_remove_content BOOLEAN DEFAULT true,
    can_manage_reports BOOLEAN DEFAULT true,
    can_manage_appeals BOOLEAN DEFAULT false,
    can_manage_rules BOOLEAN DEFAULT false,
    can_view_analytics BOOLEAN DEFAULT false,
    max_ban_duration_hours INTEGER,
    assigned_communities JSONB DEFAULT '[]',
    assigned_servers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Content Quarantine System
CREATE TABLE IF NOT EXISTS content_quarantine (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    quarantined_by VARCHAR(255) REFERENCES users(id),
    quarantine_level INTEGER DEFAULT 1, -- 1=hidden, 2=review_required, 3=completely_blocked
    ai_triggered BOOLEAN DEFAULT false,
    rule_triggered VARCHAR(255) REFERENCES moderation_rules(id),
    auto_release_at TIMESTAMP WITH TIME ZONE,
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'released', 'confirmed_violation'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    released_at TIMESTAMP WITH TIME ZONE,
    released_by VARCHAR(255) REFERENCES users(id)
);

-- Moderation Analytics and Metrics
CREATE TABLE IF NOT EXISTS moderation_metrics (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    metric_type VARCHAR(100) NOT NULL, -- 'daily_reports', 'content_removed', 'user_actions', 'ai_accuracy'
    metric_value FLOAT NOT NULL,
    metric_data JSONB DEFAULT '{}',
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    moderator_id VARCHAR(255) REFERENCES users(id),
    date_recorded DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shadow Ban System
CREATE TABLE IF NOT EXISTS shadow_bans (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    banned_by VARCHAR(255) REFERENCES users(id),
    reason TEXT NOT NULL,
    visibility_level FLOAT DEFAULT 0.1, -- 0=invisible, 1=fully_visible
    affects_posts BOOLEAN DEFAULT true,
    affects_comments BOOLEAN DEFAULT true,
    affects_messages BOOLEAN DEFAULT false,
    community_id VARCHAR(255) REFERENCES communities(id),
    server_id VARCHAR(255) REFERENCES servers(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lifted_at TIMESTAMP WITH TIME ZONE,
    lifted_by VARCHAR(255) REFERENCES users(id)
);

-- User Trust and Reputation System
CREATE TABLE IF NOT EXISTS user_trust_metrics (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    trust_score FLOAT DEFAULT 50.0, -- 0-100 scale
    reputation_score FLOAT DEFAULT 100.0,
    verified_contributor BOOLEAN DEFAULT false,
    community_standing VARCHAR(50) DEFAULT 'neutral', -- 'excellent', 'good', 'neutral', 'poor', 'banned'
    false_report_rate FLOAT DEFAULT 0.0,
    helpful_report_rate FLOAT DEFAULT 0.0,
    content_quality_score FLOAT DEFAULT 50.0,
    engagement_score FLOAT DEFAULT 0.0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_rules_enabled ON moderation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_moderation_rules_community ON moderation_rules(community_id);
CREATE INDEX IF NOT EXISTS idx_moderation_rules_server ON moderation_rules(server_id);

CREATE INDEX IF NOT EXISTS idx_ai_content_analysis_content ON ai_content_analysis(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_analysis_scores ON ai_content_analysis(toxicity_score, overall_confidence);
CREATE INDEX IF NOT EXISTS idx_ai_content_analysis_created ON ai_content_analysis(created_at);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user ON content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_status ON moderation_actions(status);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON moderation_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_moderation_history_user ON user_moderation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_moderation_history_risk ON user_moderation_history(risk_score);
CREATE INDEX IF NOT EXISTS idx_user_moderation_history_trust ON user_moderation_history(trust_level);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON moderation_queue(assigned_moderator);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_content_quarantine_status ON content_quarantine(status);
CREATE INDEX IF NOT EXISTS idx_content_quarantine_content ON content_quarantine(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_quarantine_created ON content_quarantine(created_at);

CREATE INDEX IF NOT EXISTS idx_shadow_bans_user ON shadow_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_bans_expires ON shadow_bans(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_trust_metrics_user ON user_trust_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_metrics_trust_score ON user_trust_metrics(trust_score);
CREATE INDEX IF NOT EXISTS idx_user_trust_metrics_reputation ON user_trust_metrics(reputation_score);

-- Insert default moderation rules
INSERT INTO moderation_rules (name, description, rule_type, severity, action, auto_action, config) VALUES
('Hate Speech Detection', 'Detects hate speech and discriminatory language', 'ai_threshold', 'high', 'quarantine', true, '{"ai_model": "openai", "threshold": 0.7, "categories": ["hate_speech", "identity_attack"]}'),
('Spam Content Filter', 'Identifies spam and repetitive content', 'ai_threshold', 'medium', 'flag', true, '{"ai_model": "openai", "threshold": 0.8, "categories": ["spam"]}'),
('NSFW Content Detection', 'Detects adult and inappropriate content', 'ai_threshold', 'high', 'hide', true, '{"ai_model": "openai", "threshold": 0.6, "categories": ["nsfw", "explicit"]}'),
('Toxicity Filter', 'General toxicity and harmful behavior detection', 'ai_threshold', 'medium', 'flag', true, '{"ai_model": "openai", "threshold": 0.75, "categories": ["toxicity", "harassment"]}'),
('Profanity Filter', 'Basic profanity and inappropriate language', 'keyword', 'low', 'flag', false, '{"strict_mode": false, "bypass_for_trusted": true}'),
('Violence and Threats', 'Detects violent content and threats', 'ai_threshold', 'critical', 'remove', true, '{"ai_model": "openai", "threshold": 0.6, "categories": ["violence", "threat"]}'),
('Self-Harm Prevention', 'Identifies self-harm related content', 'ai_threshold', 'critical', 'quarantine', true, '{"ai_model": "openai", "threshold": 0.5, "categories": ["self_harm"], "notify_support": true}')
ON CONFLICT DO NOTHING;

-- Insert default moderator permission levels
INSERT INTO moderator_permissions (user_id, permission_level, permissions, can_ban_users, can_remove_content, can_manage_reports, can_manage_appeals, can_manage_rules, can_view_analytics, max_ban_duration_hours) 
SELECT id, 'super_admin', '{"all": true}', true, true, true, true, true, true, NULL 
FROM users WHERE username = 'admin' OR email LIKE '%admin%' 
ON CONFLICT DO NOTHING;