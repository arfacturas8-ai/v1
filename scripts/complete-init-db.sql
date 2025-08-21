-- =============================================
-- CRYB Platform Complete Database Schema
-- PostgreSQL 15 with TimescaleDB
-- =============================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgaudit";
CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================
-- ENUM TYPES
-- =============================================

-- User status enumeration
CREATE TYPE user_status AS ENUM (
  'online',
  'idle', 
  'dnd',
  'invisible',
  'offline'
);

-- Channel types (Discord-style)
CREATE TYPE channel_type AS ENUM (
  'GUILD_TEXT',
  'DM',
  'GUILD_VOICE',
  'GROUP_DM',
  'GUILD_CATEGORY',
  'GUILD_ANNOUNCEMENT',
  'ANNOUNCEMENT_THREAD',
  'PUBLIC_THREAD',
  'PRIVATE_THREAD',
  'GUILD_STAGE_VOICE',
  'GUILD_DIRECTORY',
  'GUILD_FORUM',
  'GUILD_MEDIA'
);

-- Community types (Reddit-style)
CREATE TYPE community_type AS ENUM (
  'public',
  'restricted',
  'private',
  'archived',
  'employees_only',
  'gold_only',
  'gold_restricted'
);

-- Message types
CREATE TYPE message_type AS ENUM (
  'DEFAULT',
  'RECIPIENT_ADD',
  'RECIPIENT_REMOVE',
  'CALL',
  'CHANNEL_NAME_CHANGE',
  'CHANNEL_ICON_CHANGE',
  'CHANNEL_PINNED_MESSAGE',
  'USER_JOIN',
  'GUILD_BOOST',
  'GUILD_BOOST_TIER_1',
  'GUILD_BOOST_TIER_2',
  'GUILD_BOOST_TIER_3',
  'CHANNEL_FOLLOW_ADD',
  'THREAD_CREATED',
  'REPLY',
  'CHAT_INPUT_COMMAND',
  'THREAD_STARTER_MESSAGE',
  'GUILD_INVITE_REMINDER',
  'CONTEXT_MENU_COMMAND',
  'AUTO_MODERATION_ACTION',
  'ROLE_SUBSCRIPTION_PURCHASE',
  'INTERACTION_PREMIUM_UPSELL',
  'STAGE_START',
  'STAGE_END',
  'STAGE_SPEAKER',
  'STAGE_TOPIC'
);

-- Post types (Reddit-style)
CREATE TYPE post_type AS ENUM (
  'text',
  'link',
  'image',
  'video',
  'poll',
  'crosspost'
);

-- Award types
CREATE TYPE award_type AS ENUM (
  'silver',
  'gold',
  'platinum',
  'custom'
);

-- Award rarity
CREATE TYPE award_rarity AS ENUM (
  'common',
  'rare',
  'epic',
  'legendary'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'mention',
  'reply',
  'reaction',
  'follow',
  'friend_request',
  'community_invite',
  'role_assigned',
  'achievement',
  'system'
);

-- Moderation action types
CREATE TYPE moderation_action AS ENUM (
  'warn',
  'mute',
  'kick',
  'ban',
  'unban',
  'timeout',
  'delete_message',
  'clear_messages'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Users table with Web3 integration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  discriminator CHAR(4) NOT NULL,
  email CITEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  wallet_address VARCHAR(42) UNIQUE,
  ens_domain VARCHAR(255),
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  status user_status DEFAULT 'offline',
  flags INTEGER DEFAULT 0,
  premium_type INTEGER DEFAULT 0,
  premium_until TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(32),
  locale VARCHAR(10) DEFAULT 'en-US',
  theme VARCHAR(20) DEFAULT 'dark',
  timezone VARCHAR(50) DEFAULT 'UTC',
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  country_code VARCHAR(2),
  
  -- Additional fields
  total_messages_sent INTEGER DEFAULT 0,
  total_reactions_given INTEGER DEFAULT 0,
  total_voice_minutes INTEGER DEFAULT 0,
  account_standing VARCHAR(20) DEFAULT 'good',
  
  -- Indexes
  UNIQUE(username, discriminator)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(last_active_at);
CREATE INDEX idx_users_status ON users(status);

-- Communities (Discord servers + Reddit subreddits hybrid)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  icon_url TEXT,
  banner_url TEXT,
  splash_url TEXT,
  discovery_splash_url TEXT,
  features TEXT[] DEFAULT '{}',
  verification_level INTEGER DEFAULT 0,
  default_message_notifications INTEGER DEFAULT 0,
  explicit_content_filter INTEGER DEFAULT 0,
  mfa_level INTEGER DEFAULT 0,
  application_id UUID,
  system_channel_id UUID,
  system_channel_flags INTEGER DEFAULT 0,
  rules_channel_id UUID,
  max_presences INTEGER,
  max_members INTEGER DEFAULT 500000,
  vanity_url_code VARCHAR(32) UNIQUE,
  premium_tier INTEGER DEFAULT 0,
  premium_subscription_count INTEGER DEFAULT 0,
  preferred_locale VARCHAR(10) DEFAULT 'en-US',
  public_updates_channel_id UUID,
  max_video_channel_users INTEGER DEFAULT 25,
  approximate_member_count INTEGER DEFAULT 0,
  approximate_presence_count INTEGER DEFAULT 0,
  nsfw BOOLEAN DEFAULT FALSE,
  premium_progress_bar_enabled BOOLEAN DEFAULT FALSE,
  
  -- Reddit-style features
  subreddit_type community_type DEFAULT 'public',
  submission_type VARCHAR(10) DEFAULT 'any',
  allow_images BOOLEAN DEFAULT TRUE,
  allow_videos BOOLEAN DEFAULT TRUE,
  allow_polls BOOLEAN DEFAULT TRUE,
  spoilers_enabled BOOLEAN DEFAULT TRUE,
  suggested_comment_sort VARCHAR(20) DEFAULT 'confidence',
  wiki_enabled BOOLEAN DEFAULT FALSE,
  allow_predictions BOOLEAN DEFAULT FALSE,
  allow_talks BOOLEAN DEFAULT FALSE,
  
  -- Web3 features
  token_gate_enabled BOOLEAN DEFAULT FALSE,
  required_tokens JSONB DEFAULT '[]',
  dao_governance BOOLEAN DEFAULT FALSE,
  governance_token_address VARCHAR(42),
  treasury_address VARCHAR(42),
  
  -- Statistics
  total_messages INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  daily_message_count INTEGER DEFAULT 0,
  weekly_active_users INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communities_name ON communities(name);
CREATE INDEX idx_communities_owner ON communities(owner_id);
CREATE INDEX idx_communities_features ON communities USING GIN(features);
CREATE INDEX idx_communities_token_gate ON communities(token_gate_enabled);
CREATE INDEX idx_communities_type ON communities(subreddit_type);

-- Channels (Discord-style)
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type channel_type NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  position INTEGER,
  permission_overwrites JSONB DEFAULT '[]',
  name VARCHAR(100),
  topic TEXT,
  nsfw BOOLEAN DEFAULT FALSE,
  last_message_id UUID,
  bitrate INTEGER,
  user_limit INTEGER,
  rate_limit_per_user INTEGER DEFAULT 0,
  recipients UUID[],
  icon_url TEXT,
  owner_id UUID REFERENCES users(id),
  application_id UUID,
  parent_id UUID REFERENCES channels(id),
  last_pin_timestamp TIMESTAMPTZ,
  rtc_region VARCHAR(20),
  video_quality_mode INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  thread_metadata JSONB,
  member JSONB,
  default_auto_archive_duration INTEGER,
  permissions BIGINT,
  flags INTEGER DEFAULT 0,
  
  -- Forum channels
  available_tags JSONB DEFAULT '[]',
  applied_tags UUID[],
  default_reaction_emoji JSONB,
  default_thread_rate_limit_per_user INTEGER,
  default_sort_order INTEGER,
  default_forum_layout INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channels_community ON channels(community_id);
CREATE INDEX idx_channels_type ON channels(type);
CREATE INDEX idx_channels_parent ON channels(parent_id);
CREATE INDEX idx_channels_last_message ON channels(last_message_id);

-- Messages with rich content support
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  edited_timestamp TIMESTAMPTZ,
  tts BOOLEAN DEFAULT FALSE,
  mention_everyone BOOLEAN DEFAULT FALSE,
  mentions UUID[] DEFAULT '{}',
  mention_roles UUID[] DEFAULT '{}',
  mention_channels JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  embeds JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  nonce VARCHAR(255),
  pinned BOOLEAN DEFAULT FALSE,
  webhook_id UUID,
  type message_type DEFAULT 'DEFAULT',
  activity JSONB,
  application JSONB,
  application_id UUID,
  message_reference JSONB,
  flags INTEGER DEFAULT 0,
  referenced_message UUID REFERENCES messages(id),
  interaction JSONB,
  thread_id UUID REFERENCES channels(id),
  components JSONB DEFAULT '[]',
  sticker_items JSONB DEFAULT '[]',
  
  -- Reddit-style features
  score INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  controversy_score REAL DEFAULT 0,
  gilded INTEGER DEFAULT 0,
  awards JSONB DEFAULT '[]',
  
  -- Moderation
  deleted BOOLEAN DEFAULT FALSE,
  removed BOOLEAN DEFAULT FALSE,
  spam BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  removed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  ban_reason TEXT
);

CREATE INDEX idx_messages_channel_timestamp ON messages(channel_id, timestamp DESC);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_reference ON messages(referenced_message);
CREATE INDEX idx_messages_score ON messages(score DESC);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- Convert messages table to TimescaleDB hypertable
SELECT create_hypertable('messages', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Community members with roles
CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nick VARCHAR(32),
  avatar_url TEXT,
  roles UUID[] DEFAULT '{}',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  premium_since TIMESTAMPTZ,
  deaf BOOLEAN DEFAULT FALSE,
  mute BOOLEAN DEFAULT FALSE,
  flags INTEGER DEFAULT 0,
  pending BOOLEAN DEFAULT FALSE,
  permissions BIGINT,
  communication_disabled_until TIMESTAMPTZ,
  
  -- Reddit-style karma
  post_karma INTEGER DEFAULT 0,
  comment_karma INTEGER DEFAULT 0,
  awarder_karma INTEGER DEFAULT 0,
  awardee_karma INTEGER DEFAULT 0,
  
  -- Additional fields
  messages_sent INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  voice_minutes INTEGER DEFAULT 0,
  stream_minutes INTEGER DEFAULT 0,
  
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX idx_members_user ON community_members(user_id);
CREATE INDEX idx_members_joined ON community_members(joined_at);
CREATE INDEX idx_members_karma ON community_members((post_karma + comment_karma) DESC);
CREATE INDEX idx_members_roles ON community_members USING GIN(roles);

-- Roles and permissions
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color INTEGER DEFAULT 0,
  hoist BOOLEAN DEFAULT FALSE,
  icon_url TEXT,
  unicode_emoji VARCHAR(100),
  position INTEGER DEFAULT 0,
  permissions BIGINT DEFAULT 0,
  managed BOOLEAN DEFAULT FALSE,
  mentionable BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '{}',
  flags INTEGER DEFAULT 0,
  
  -- Web3 role gating
  token_gate JSONB,
  nft_requirements JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roles_community ON roles(community_id);
CREATE INDEX idx_roles_position ON roles(community_id, position);
CREATE INDEX idx_roles_managed ON roles(managed);

-- User sessions and devices
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  access_token_hash VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_ip ON user_sessions(ip_address);

-- Posts (Reddit-style)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  content TEXT,
  url TEXT,
  type post_type NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  
  -- Voting and engagement
  score INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  upvote_ratio REAL DEFAULT 0.5,
  num_comments INTEGER DEFAULT 0,
  num_crossposts INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Flags and status
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  nsfw BOOLEAN DEFAULT FALSE,
  spoiler BOOLEAN DEFAULT FALSE,
  removed BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  spam BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  removed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  removal_reason TEXT,
  
  -- Awards and recognition
  gilded INTEGER DEFAULT 0,
  awards JSONB DEFAULT '[]',
  
  -- Media and content
  media JSONB,
  thumbnail_url TEXT,
  flair JSONB,
  
  -- Cross-posting
  crosspost_parent_id UUID REFERENCES posts(id),
  
  -- SEO and discovery
  slug VARCHAR(255),
  tags TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_score ON posts(score DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Comments (Reddit-style threaded)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  
  -- Hierarchy
  path LTREE,
  depth INTEGER DEFAULT 0,
  
  -- Voting
  score INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  controversy_score REAL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Status
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  collapsed BOOLEAN DEFAULT FALSE,
  removed BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  spam BOOLEAN DEFAULT FALSE,
  
  -- Awards
  gilded INTEGER DEFAULT 0,
  awards JSONB DEFAULT '[]',
  
  -- User flair
  flair JSONB
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_path ON comments USING GIST(path);
CREATE INDEX idx_comments_score ON comments(score DESC);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- Votes tracking
CREATE TABLE votes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL, -- 'post', 'comment', 'message'
  vote_type INTEGER NOT NULL, -- 1 = upvote, -1 = downvote, 0 = no vote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, target_id, target_type)
);

CREATE INDEX idx_votes_target ON votes(target_id, target_type);
CREATE INDEX idx_votes_user ON votes(user_id);

-- Direct messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  encrypted BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_recipient ON direct_messages(recipient_id);
CREATE INDEX idx_dm_created ON direct_messages(created_at DESC);
CREATE INDEX idx_dm_unread ON direct_messages(recipient_id, read) WHERE read = FALSE;

-- Friend relationships
CREATE TABLE friendships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255),
  content TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Moderation logs
CREATE TABLE moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action moderation_action NOT NULL,
  reason TEXT,
  details JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modlogs_community ON moderation_logs(community_id);
CREATE INDEX idx_modlogs_moderator ON moderation_logs(moderator_id);
CREATE INDEX idx_modlogs_target ON moderation_logs(target_user_id);
CREATE INDEX idx_modlogs_action ON moderation_logs(action);
CREATE INDEX idx_modlogs_created ON moderation_logs(created_at DESC);

-- User bans
CREATE TABLE user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, community_id)
);

CREATE INDEX idx_bans_user ON user_bans(user_id);
CREATE INDEX idx_bans_community ON user_bans(community_id);
CREATE INDEX idx_bans_expires ON user_bans(expires_at);

-- Voice state tracking
CREATE TABLE voice_states (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  deaf BOOLEAN DEFAULT FALSE,
  mute BOOLEAN DEFAULT FALSE,
  self_deaf BOOLEAN DEFAULT FALSE,
  self_mute BOOLEAN DEFAULT FALSE,
  self_stream BOOLEAN DEFAULT FALSE,
  self_video BOOLEAN DEFAULT FALSE,
  suppress BOOLEAN DEFAULT FALSE,
  request_to_speak_timestamp TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX idx_voice_states_channel ON voice_states(channel_id);
CREATE INDEX idx_voice_states_community ON voice_states(community_id);

-- Presence tracking
CREATE TABLE user_presence (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status user_status NOT NULL DEFAULT 'offline',
  client_status JSONB DEFAULT '{}',
  activities JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (user_id)
);

CREATE INDEX idx_presence_status ON user_presence(status);
CREATE INDEX idx_presence_updated ON user_presence(last_updated);

-- File attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  content_type VARCHAR(100),
  url TEXT NOT NULL,
  proxy_url TEXT,
  width INTEGER,
  height INTEGER,
  ephemeral BOOLEAN DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON attachments(message_id);
CREATE INDEX idx_attachments_post ON attachments(post_id);
CREATE INDEX idx_attachments_user ON attachments(uploaded_by);

-- Emojis and reactions
CREATE TABLE emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id),
  animated BOOLEAN DEFAULT FALSE,
  managed BOOLEAN DEFAULT FALSE,
  require_colons BOOLEAN DEFAULT TRUE,
  roles UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name, community_id)
);

CREATE INDEX idx_emojis_community ON emojis(community_id);
CREATE INDEX idx_emojis_name ON emojis(name);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type INTEGER NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  token VARCHAR(255) UNIQUE NOT NULL,
  application_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(id, token)
);

CREATE INDEX idx_webhooks_community ON webhooks(community_id);
CREATE INDEX idx_webhooks_channel ON webhooks(channel_id);
CREATE INDEX idx_webhooks_token ON webhooks(token);

-- Invites
CREATE TABLE invites (
  code VARCHAR(20) PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  target_type VARCHAR(20),
  uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  max_age INTEGER,
  temporary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_invites_community ON invites(community_id);
CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_invites_expires ON invites(expires_at);

-- =============================================
-- WEB3 INTEGRATION TABLES
-- =============================================

-- Token gates configuration
CREATE TABLE token_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  contract_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  token_type VARCHAR(20) NOT NULL, -- 'ERC20', 'ERC721', 'ERC1155'
  token_id VARCHAR(100), -- For ERC1155
  minimum_balance NUMERIC(78, 0) DEFAULT 1,
  name VARCHAR(100),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_gates_community ON token_gates(community_id);
CREATE INDEX idx_token_gates_channel ON token_gates(channel_id);
CREATE INDEX idx_token_gates_role ON token_gates(role_id);
CREATE INDEX idx_token_gates_contract ON token_gates(contract_address);

-- User token verifications
CREATE TABLE token_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_gate_id UUID NOT NULL REFERENCES token_gates(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT FALSE,
  balance NUMERIC(78, 0),
  metadata JSONB DEFAULT '{}',
  signature TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_verifications_user ON token_verifications(user_id);
CREATE INDEX idx_token_verifications_gate ON token_verifications(token_gate_id);
CREATE INDEX idx_token_verifications_expires ON token_verifications(expires_at);

-- DAO proposals
CREATE TABLE dao_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  voting_type VARCHAR(20) DEFAULT 'single_choice',
  quorum_threshold NUMERIC(5, 4) DEFAULT 0.1,
  approval_threshold NUMERIC(5, 4) DEFAULT 0.5,
  voting_period_days INTEGER DEFAULT 7,
  execution_delay_days INTEGER DEFAULT 2,
  snapshot_block BIGINT,
  status VARCHAR(20) DEFAULT 'draft',
  
  -- Results
  total_votes INTEGER DEFAULT 0,
  total_voting_power NUMERIC(78, 0) DEFAULT 0,
  results JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  voting_starts_at TIMESTAMPTZ,
  voting_ends_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_proposals_community ON dao_proposals(community_id);
CREATE INDEX idx_proposals_proposer ON dao_proposals(proposer_id);
CREATE INDEX idx_proposals_status ON dao_proposals(status);
CREATE INDEX idx_proposals_voting_ends ON dao_proposals(voting_ends_at);

-- DAO votes
CREATE TABLE dao_votes (
  proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  voting_power NUMERIC(78, 0) NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (proposal_id, user_id)
);

CREATE INDEX idx_dao_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_user ON dao_votes(user_id);

-- =============================================
-- ANALYTICS TABLES (TimescaleDB)
-- =============================================

-- User activity metrics
CREATE TABLE user_activity_metrics (
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL,
  community_id UUID,
  channel_id UUID,
  activity_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('user_activity_metrics', 'timestamp');
CREATE INDEX idx_user_activity_user ON user_activity_metrics(user_id, timestamp DESC);
CREATE INDEX idx_user_activity_community ON user_activity_metrics(community_id, timestamp DESC);

-- Community analytics
CREATE TABLE community_analytics (
  timestamp TIMESTAMPTZ NOT NULL,
  community_id UUID NOT NULL,
  member_count INTEGER,
  online_count INTEGER,
  message_count INTEGER,
  voice_minutes INTEGER,
  new_members INTEGER,
  left_members INTEGER
);

SELECT create_hypertable('community_analytics', 'timestamp');
CREATE INDEX idx_community_analytics ON community_analytics(community_id, timestamp DESC);

-- Message analytics
CREATE TABLE message_analytics (
  timestamp TIMESTAMPTZ NOT NULL,
  channel_id UUID NOT NULL,
  community_id UUID NOT NULL,
  message_count INTEGER,
  unique_authors INTEGER,
  avg_message_length INTEGER,
  reaction_count INTEGER,
  mention_count INTEGER
);

SELECT create_hypertable('message_analytics', 'timestamp');
CREATE INDEX idx_message_analytics_channel ON message_analytics(channel_id, timestamp DESC);
CREATE INDEX idx_message_analytics_community ON message_analytics(community_id, timestamp DESC);

-- Voice analytics
CREATE TABLE voice_analytics (
  timestamp TIMESTAMPTZ NOT NULL,
  channel_id UUID NOT NULL,
  community_id UUID NOT NULL,
  participant_count INTEGER,
  total_minutes INTEGER,
  unique_speakers INTEGER,
  screen_share_minutes INTEGER,
  video_minutes INTEGER
);

SELECT create_hypertable('voice_analytics', 'timestamp');
CREATE INDEX idx_voice_analytics_channel ON voice_analytics(channel_id, timestamp DESC);
CREATE INDEX idx_voice_analytics_community ON voice_analytics(community_id, timestamp DESC);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate karma
CREATE OR REPLACE FUNCTION calculate_user_karma(p_user_id UUID)
RETURNS TABLE(
  post_karma INTEGER,
  comment_karma INTEGER,
  total_karma INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN p.author_id = p_user_id THEN p.score ELSE 0 END), 0)::INTEGER as post_karma,
    COALESCE(SUM(CASE WHEN c.author_id = p_user_id THEN c.score ELSE 0 END), 0)::INTEGER as comment_karma,
    COALESCE(SUM(CASE WHEN p.author_id = p_user_id THEN p.score ELSE 0 END), 0)::INTEGER +
    COALESCE(SUM(CASE WHEN c.author_id = p_user_id THEN c.score ELSE 0 END), 0)::INTEGER as total_karma
  FROM posts p
  FULL OUTER JOIN comments c ON TRUE
  WHERE p.author_id = p_user_id OR c.author_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update message score
CREATE OR REPLACE FUNCTION update_message_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE messages 
  SET score = upvotes - downvotes,
      controversy_score = CASE 
        WHEN upvotes + downvotes = 0 THEN 0
        ELSE (upvotes + downvotes)::REAL / ABS(upvotes - downvotes)::REAL
      END
  WHERE id = NEW.target_id AND NEW.target_type = 'message';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_score_on_vote
AFTER INSERT OR UPDATE ON votes
FOR EACH ROW
WHEN (NEW.target_type = 'message')
EXECUTE FUNCTION update_message_score();

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default system user
INSERT INTO users (id, username, discriminator, email, email_verified)
VALUES ('00000000-0000-0000-0000-000000000000', 'System', '0000', 'system@cryb.gg', true);

-- Insert default community
INSERT INTO communities (id, name, display_name, description, owner_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'cryb', 'CRYB Official', 'Official CRYB Platform Community', '00000000-0000-0000-0000-000000000000');

-- Create default roles
INSERT INTO roles (community_id, name, position, permissions, color)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '@everyone', 0, 0, 0),
  ('00000000-0000-0000-0000-000000000001', 'Admin', 100, -1, 15158332),
  ('00000000-0000-0000-0000-000000000001', 'Moderator', 90, 1071698529343, 3447003),
  ('00000000-0000-0000-0000-000000000001', 'Member', 10, 104324673, 10181046);

-- =============================================
-- PERMISSIONS AND SECURITY
-- =============================================

-- Create read-only role
CREATE ROLE cryb_readonly;
GRANT CONNECT ON DATABASE cryb TO cryb_readonly;
GRANT USAGE ON SCHEMA public TO cryb_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cryb_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO cryb_readonly;

-- Create application role
CREATE ROLE cryb_app;
GRANT CONNECT ON DATABASE cryb TO cryb_app;
GRANT USAGE ON SCHEMA public TO cryb_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryb_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryb_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cryb_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO cryb_app;

-- Row-level security policies (example)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Create retention policy for old messages (TimescaleDB)
SELECT add_retention_policy('messages', INTERVAL '2 years');
SELECT add_retention_policy('user_activity_metrics', INTERVAL '90 days');
SELECT add_retention_policy('community_analytics', INTERVAL '1 year');
SELECT add_retention_policy('message_analytics', INTERVAL '6 months');
SELECT add_retention_policy('voice_analytics', INTERVAL '6 months');

-- Create compression policy for older data
ALTER TABLE messages SET (timescaledb.compress, timescaledb.compress_segmentby = 'channel_id');
SELECT add_compression_policy('messages', INTERVAL '30 days');

ALTER TABLE user_activity_metrics SET (timescaledb.compress, timescaledb.compress_segmentby = 'user_id');
SELECT add_compression_policy('user_activity_metrics', INTERVAL '7 days');

-- =============================================
-- PERFORMANCE OPTIMIZATION
-- =============================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE communities;
ANALYZE channels;
ANALYZE messages;
ANALYZE community_members;
ANALYZE posts;
ANALYZE comments;

-- Set up pg_stat_statements for query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =============================================
-- AUDIT AND COMPLIANCE
-- =============================================

-- Audit table for compliance
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(10) NOT NULL,
  user_id UUID,
  changed_data JSONB,
  query TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);

-- Enable pgAudit for comprehensive auditing
-- Configured via postgresql.conf: pgaudit.log = 'all'

GRANT EXECUTE ON FUNCTION gen_random_uuid() TO cryb_app;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO cryb_app;
GRANT EXECUTE ON FUNCTION calculate_user_karma(UUID) TO cryb_app;
GRANT EXECUTE ON FUNCTION update_message_score() TO cryb_app;