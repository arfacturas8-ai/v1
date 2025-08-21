-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create custom types
CREATE TYPE user_status AS ENUM ('online', 'idle', 'dnd', 'invisible', 'offline');
CREATE TYPE channel_type AS ENUM (
  'GUILD_TEXT', 'DM', 'GUILD_VOICE', 'GROUP_DM', 'GUILD_CATEGORY',
  'GUILD_ANNOUNCEMENT', 'ANNOUNCEMENT_THREAD', 'PUBLIC_THREAD',
  'PRIVATE_THREAD', 'GUILD_STAGE_VOICE', 'GUILD_DIRECTORY',
  'GUILD_FORUM', 'GUILD_MEDIA'
);
CREATE TYPE community_type AS ENUM (
  'public', 'restricted', 'private', 'archived',
  'employees_only', 'gold_only', 'gold_restricted'
);
CREATE TYPE post_type AS ENUM ('text', 'link', 'image', 'video', 'poll', 'crosspost');
CREATE TYPE award_type AS ENUM ('silver', 'gold', 'platinum', 'custom');
CREATE TYPE award_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Grant privileges to the cryb_user
GRANT ALL PRIVILEGES ON DATABASE cryb TO cryb_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cryb_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cryb_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO cryb_user;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gin_messages_content ON messages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(last_active_at);

-- Set up TimescaleDB continuous aggregates for analytics
-- This will be created after the tables are created by Prisma migrations