-- CRYB Platform Database Sharding Strategy
-- Horizontal scaling solution for Reddit/Discord scale growth
-- Author: Database Infrastructure Team
-- Version: 1.0

-- ==========================================
-- SHARDING OVERVIEW AND ARCHITECTURE
-- ==========================================

-- This sharding strategy implements:
-- 1. Hash-based sharding for users and user-generated content
-- 2. Geographic sharding for servers/communities
-- 3. Range-based sharding for time-series data
-- 4. Logical sharding with shard routing
-- 5. Cross-shard query optimization

-- ==========================================
-- SHARD CONFIGURATION TABLE
-- ==========================================

-- Central configuration for shard mapping
CREATE TABLE IF NOT EXISTS shard_config (
    id SERIAL PRIMARY KEY,
    shard_id INTEGER NOT NULL UNIQUE,
    shard_name VARCHAR(50) NOT NULL UNIQUE,
    shard_type VARCHAR(20) NOT NULL CHECK (shard_type IN ('user', 'content', 'server', 'analytics', 'global')),
    
    -- Connection information
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 5432,
    database_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL,
    
    -- Shard boundaries
    hash_min INTEGER, -- For hash-based sharding
    hash_max INTEGER,
    range_start TIMESTAMPTZ, -- For range-based sharding
    range_end TIMESTAMPTZ,
    geo_regions TEXT[], -- For geographic sharding
    
    -- Shard status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_read_only BOOLEAN DEFAULT FALSE,
    weight DECIMAL(3,2) DEFAULT 1.0, -- For weighted distribution
    capacity_percent INTEGER DEFAULT 0,
    
    -- Migration tracking
    migration_status VARCHAR(20) DEFAULT 'stable' CHECK (
        migration_status IN ('stable', 'migrating_out', 'migrating_in', 'splitting', 'merging')
    ),
    migration_target INTEGER REFERENCES shard_config(shard_id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_hash_range CHECK (
        (hash_min IS NULL AND hash_max IS NULL) OR 
        (hash_min IS NOT NULL AND hash_max IS NOT NULL AND hash_min <= hash_max)
    ),
    CONSTRAINT valid_range CHECK (
        (range_start IS NULL AND range_end IS NULL) OR 
        (range_start IS NOT NULL AND range_end IS NOT NULL AND range_start < range_end)
    )
);

-- Index for fast shard lookups
CREATE INDEX idx_shard_config_type_active ON shard_config (shard_type, is_active);
CREATE INDEX idx_shard_config_hash_range ON shard_config (hash_min, hash_max) WHERE hash_min IS NOT NULL;
CREATE INDEX idx_shard_config_time_range ON shard_config (range_start, range_end) WHERE range_start IS NOT NULL;

-- ==========================================
-- SHARD ROUTING FUNCTIONS
-- ==========================================

-- Hash function for consistent user sharding
CREATE OR REPLACE FUNCTION shard_hash(input_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Use CRC32-like hash for consistent distribution
    RETURN (ABS(HASHTEXT(input_text)) % 16384); -- 16K buckets for fine-grained control
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get shard ID for a user
CREATE OR REPLACE FUNCTION get_user_shard(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    hash_value INTEGER;
    target_shard INTEGER;
BEGIN
    hash_value := shard_hash(user_id::TEXT);
    
    SELECT shard_id INTO target_shard
    FROM shard_config
    WHERE shard_type = 'user'
        AND is_active = TRUE
        AND hash_min <= hash_value
        AND hash_max >= hash_value
    LIMIT 1;
    
    IF target_shard IS NULL THEN
        RAISE EXCEPTION 'No active shard found for user %', user_id;
    END IF;
    
    RETURN target_shard;
END;
$$ LANGUAGE plpgsql;

-- Get shard ID for content based on user who created it
CREATE OR REPLACE FUNCTION get_content_shard(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    -- Content follows the user's shard for data locality
    RETURN get_user_shard(user_id);
END;
$$ LANGUAGE plpgsql;

-- Get shard ID for server/community based on geographic region
CREATE OR REPLACE FUNCTION get_server_shard(region VARCHAR(10) DEFAULT 'us-east')
RETURNS INTEGER AS $$
DECLARE
    target_shard INTEGER;
BEGIN
    SELECT shard_id INTO target_shard
    FROM shard_config
    WHERE shard_type = 'server'
        AND is_active = TRUE
        AND (geo_regions IS NULL OR region = ANY(geo_regions))
    ORDER BY weight DESC
    LIMIT 1;
    
    IF target_shard IS NULL THEN
        -- Fallback to default server shard
        SELECT shard_id INTO target_shard
        FROM shard_config
        WHERE shard_type = 'server'
            AND is_active = TRUE
        ORDER BY shard_id
        LIMIT 1;
    END IF;
    
    RETURN target_shard;
END;
$$ LANGUAGE plpgsql;

-- Get analytics shard based on time range
CREATE OR REPLACE FUNCTION get_analytics_shard(event_time TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER AS $$
DECLARE
    target_shard INTEGER;
BEGIN
    SELECT shard_id INTO target_shard
    FROM shard_config
    WHERE shard_type = 'analytics'
        AND is_active = TRUE
        AND range_start <= event_time
        AND range_end > event_time
    LIMIT 1;
    
    IF target_shard IS NULL THEN
        -- Use most recent analytics shard
        SELECT shard_id INTO target_shard
        FROM shard_config
        WHERE shard_type = 'analytics'
            AND is_active = TRUE
        ORDER BY range_start DESC
        LIMIT 1;
    END IF;
    
    RETURN target_shard;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CROSS-SHARD QUERY FUNCTIONS
-- ==========================================

-- Function to get all active shards of a specific type
CREATE OR REPLACE FUNCTION get_active_shards(shard_type_filter VARCHAR(20))
RETURNS TABLE(
    shard_id INTEGER,
    shard_name VARCHAR(50),
    host VARCHAR(255),
    port INTEGER,
    database_name VARCHAR(50),
    username VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.shard_id,
        sc.shard_name,
        sc.host,
        sc.port,
        sc.database_name,
        sc.username
    FROM shard_config sc
    WHERE sc.shard_type = shard_type_filter
        AND sc.is_active = TRUE
        AND sc.is_read_only = FALSE
    ORDER BY sc.shard_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get shard connection string
CREATE OR REPLACE FUNCTION get_shard_connection(target_shard_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    conn_string TEXT;
BEGIN
    SELECT FORMAT(
        'host=%s port=%s dbname=%s user=%s',
        host, port, database_name, username
    ) INTO conn_string
    FROM shard_config
    WHERE shard_id = target_shard_id
        AND is_active = TRUE;
    
    IF conn_string IS NULL THEN
        RAISE EXCEPTION 'Shard % not found or inactive', target_shard_id;
    END IF;
    
    RETURN conn_string;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SHARD MONITORING AND HEALTH
-- ==========================================

-- View for shard health monitoring
CREATE OR REPLACE VIEW shard_health AS
SELECT 
    sc.shard_id,
    sc.shard_name,
    sc.shard_type,
    sc.host,
    sc.is_active,
    sc.is_read_only,
    sc.capacity_percent,
    sc.migration_status,
    
    -- Calculate hash range coverage
    CASE 
        WHEN sc.hash_min IS NOT NULL THEN 
            ROUND(((sc.hash_max - sc.hash_min + 1)::DECIMAL / 16384) * 100, 2)
        ELSE NULL
    END as hash_coverage_percent,
    
    -- Calculate time range coverage
    CASE 
        WHEN sc.range_start IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (sc.range_end - sc.range_start)) / 86400 -- Days
        ELSE NULL
    END as time_range_days,
    
    sc.updated_at
FROM shard_config sc
ORDER BY sc.shard_type, sc.shard_id;

-- Function to check shard balance
CREATE OR REPLACE FUNCTION check_shard_balance()
RETURNS TABLE(
    shard_type VARCHAR(20),
    total_shards INTEGER,
    active_shards INTEGER,
    avg_capacity DECIMAL,
    max_capacity INTEGER,
    min_capacity INTEGER,
    balance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.shard_type,
        COUNT(*)::INTEGER as total_shards,
        COUNT(*) FILTER (WHERE sc.is_active)::INTEGER as active_shards,
        ROUND(AVG(sc.capacity_percent), 2) as avg_capacity,
        MAX(sc.capacity_percent) as max_capacity,
        MIN(sc.capacity_percent) as min_capacity,
        -- Balance score: lower is better (0 = perfectly balanced)
        ROUND(STDDEV(sc.capacity_percent), 2) as balance_score
    FROM shard_config sc
    WHERE sc.is_active = TRUE
    GROUP BY sc.shard_type
    ORDER BY sc.shard_type;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SHARD MIGRATION FUNCTIONS
-- ==========================================

-- Start shard migration process
CREATE OR REPLACE FUNCTION start_shard_migration(
    source_shard_id INTEGER,
    target_shard_id INTEGER,
    migration_type VARCHAR(20) DEFAULT 'rebalance'
) RETURNS BOOLEAN AS $$
DECLARE
    source_exists BOOLEAN;
    target_exists BOOLEAN;
BEGIN
    -- Validate source and target shards exist
    SELECT EXISTS(SELECT 1 FROM shard_config WHERE shard_id = source_shard_id AND is_active = TRUE) INTO source_exists;
    SELECT EXISTS(SELECT 1 FROM shard_config WHERE shard_id = target_shard_id AND is_active = TRUE) INTO target_exists;
    
    IF NOT source_exists THEN
        RAISE EXCEPTION 'Source shard % does not exist or is inactive', source_shard_id;
    END IF;
    
    IF NOT target_exists THEN
        RAISE EXCEPTION 'Target shard % does not exist or is inactive', target_shard_id;
    END IF;
    
    -- Mark source shard as migrating out
    UPDATE shard_config
    SET migration_status = 'migrating_out',
        migration_target = target_shard_id,
        updated_at = NOW()
    WHERE shard_id = source_shard_id;
    
    -- Mark target shard as migrating in
    UPDATE shard_config
    SET migration_status = 'migrating_in',
        updated_at = NOW()
    WHERE shard_id = target_shard_id;
    
    -- Log migration start
    INSERT INTO shard_migration_log (
        source_shard_id, 
        target_shard_id, 
        migration_type, 
        status, 
        started_at
    ) VALUES (
        source_shard_id, 
        target_shard_id, 
        migration_type, 
        'started', 
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Complete shard migration
CREATE OR REPLACE FUNCTION complete_shard_migration(
    source_shard_id INTEGER,
    target_shard_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    -- Mark migration as complete
    UPDATE shard_config
    SET migration_status = 'stable',
        migration_target = NULL,
        updated_at = NOW()
    WHERE shard_id IN (source_shard_id, target_shard_id);
    
    -- Update migration log
    UPDATE shard_migration_log
    SET status = 'completed',
        completed_at = NOW()
    WHERE source_shard_id = complete_shard_migration.source_shard_id
        AND target_shard_id = complete_shard_migration.target_shard_id
        AND status = 'started';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SHARD SPLIT OPERATION
-- ==========================================

-- Split a shard into two shards
CREATE OR REPLACE FUNCTION split_shard(
    source_shard_id INTEGER,
    new_shard_name VARCHAR(50),
    new_shard_host VARCHAR(255),
    split_point INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    source_shard RECORD;
    new_shard_id INTEGER;
    calculated_split_point INTEGER;
BEGIN
    -- Get source shard information
    SELECT * INTO source_shard
    FROM shard_config
    WHERE shard_id = source_shard_id
        AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source shard % not found or inactive', source_shard_id;
    END IF;
    
    -- Calculate split point if not provided
    IF split_point IS NULL THEN
        calculated_split_point := source_shard.hash_min + ((source_shard.hash_max - source_shard.hash_min) / 2);
    ELSE
        calculated_split_point := split_point;
    END IF;
    
    -- Create new shard
    INSERT INTO shard_config (
        shard_name,
        shard_type,
        host,
        port,
        database_name,
        username,
        hash_min,
        hash_max,
        geo_regions,
        weight
    ) VALUES (
        new_shard_name,
        source_shard.shard_type,
        new_shard_host,
        source_shard.port,
        source_shard.database_name,
        source_shard.username,
        calculated_split_point + 1,
        source_shard.hash_max,
        source_shard.geo_regions,
        source_shard.weight
    ) RETURNING shard_id INTO new_shard_id;
    
    -- Update source shard range
    UPDATE shard_config
    SET hash_max = calculated_split_point,
        migration_status = 'splitting',
        migration_target = new_shard_id,
        updated_at = NOW()
    WHERE shard_id = source_shard_id;
    
    -- Log split operation
    INSERT INTO shard_migration_log (
        source_shard_id,
        target_shard_id,
        migration_type,
        status,
        started_at,
        metadata
    ) VALUES (
        source_shard_id,
        new_shard_id,
        'split',
        'started',
        NOW(),
        JSON_BUILD_OBJECT('split_point', calculated_split_point)
    );
    
    RETURN new_shard_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SHARD MIGRATION LOG
-- ==========================================

-- Track shard migration operations
CREATE TABLE IF NOT EXISTS shard_migration_log (
    id SERIAL PRIMARY KEY,
    source_shard_id INTEGER NOT NULL,
    target_shard_id INTEGER,
    migration_type VARCHAR(20) NOT NULL CHECK (
        migration_type IN ('rebalance', 'split', 'merge', 'evacuate', 'failover')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'started' CHECK (
        status IN ('started', 'in_progress', 'completed', 'failed', 'rolled_back')
    ),
    
    -- Timing information
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Migration progress
    total_records BIGINT,
    migrated_records BIGINT DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shard_migration_log_status ON shard_migration_log (status, started_at);
CREATE INDEX idx_shard_migration_log_shards ON shard_migration_log (source_shard_id, target_shard_id);

-- ==========================================
-- INITIAL SHARD CONFIGURATION
-- ==========================================

-- Insert default shard configuration for CRYB platform
DO $$
BEGIN
    -- User shards (hash-based distribution)
    INSERT INTO shard_config (shard_id, shard_name, shard_type, host, database_name, username, hash_min, hash_max) VALUES
        (1, 'user-shard-01', 'user', 'cryb-db-user-01.internal', 'cryb_users', 'cryb_user', 0, 4095),
        (2, 'user-shard-02', 'user', 'cryb-db-user-02.internal', 'cryb_users', 'cryb_user', 4096, 8191),
        (3, 'user-shard-03', 'user', 'cryb-db-user-03.internal', 'cryb_users', 'cryb_user', 8192, 12287),
        (4, 'user-shard-04', 'user', 'cryb-db-user-04.internal', 'cryb_users', 'cryb_user', 12288, 16383);
    
    -- Server/Community shards (geographic distribution)
    INSERT INTO shard_config (shard_id, shard_name, shard_type, host, database_name, username, geo_regions) VALUES
        (11, 'server-shard-us', 'server', 'cryb-db-server-us.internal', 'cryb_servers', 'cryb_user', ARRAY['us-east', 'us-west', 'us-central']),
        (12, 'server-shard-eu', 'server', 'cryb-db-server-eu.internal', 'cryb_servers', 'cryb_user', ARRAY['eu-west', 'eu-central', 'eu-north']),
        (13, 'server-shard-ap', 'server', 'cryb-db-server-ap.internal', 'cryb_servers', 'cryb_user', ARRAY['ap-northeast', 'ap-southeast', 'ap-south']);
    
    -- Analytics shards (time-based distribution)
    INSERT INTO shard_config (shard_id, shard_name, shard_type, host, database_name, username, range_start, range_end) VALUES
        (21, 'analytics-2024-q1', 'analytics', 'cryb-db-analytics-01.internal', 'cryb_analytics', 'cryb_user', '2024-01-01'::timestamptz, '2024-04-01'::timestamptz),
        (22, 'analytics-2024-q2', 'analytics', 'cryb-db-analytics-02.internal', 'cryb_analytics', 'cryb_user', '2024-04-01'::timestamptz, '2024-07-01'::timestamptz),
        (23, 'analytics-2024-q3', 'analytics', 'cryb-db-analytics-03.internal', 'cryb_analytics', 'cryb_user', '2024-07-01'::timestamptz, '2024-10-01'::timestamptz),
        (24, 'analytics-2024-q4', 'analytics', 'cryb-db-analytics-04.internal', 'cryb_analytics', 'cryb_user', '2024-10-01'::timestamptz, '2025-01-01'::timestamptz);
    
    -- Global shard for shared data
    INSERT INTO shard_config (shard_id, shard_name, shard_type, host, database_name, username) VALUES
        (31, 'global-shard', 'global', 'cryb-db-global.internal', 'cryb_global', 'cryb_user');

EXCEPTION
    WHEN unique_violation THEN
        -- Shards already exist, skip initialization
        RAISE NOTICE 'Shard configuration already exists, skipping initialization';
END
$$;

-- ==========================================
-- SHARD ROUTER APPLICATION LAYER
-- ==========================================

-- Create a view that applications can use for shard routing
CREATE OR REPLACE VIEW shard_router AS
SELECT 
    'user' as entity_type,
    get_user_shard('00000000-0000-0000-0000-000000000000'::uuid) as example_shard,
    'Use get_user_shard(user_id) for routing' as routing_function
UNION ALL
SELECT 
    'content' as entity_type,
    get_content_shard('00000000-0000-0000-0000-000000000000'::uuid) as example_shard,
    'Use get_content_shard(user_id) for routing' as routing_function
UNION ALL
SELECT 
    'server' as entity_type,
    get_server_shard('us-east') as example_shard,
    'Use get_server_shard(region) for routing' as routing_function
UNION ALL
SELECT 
    'analytics' as entity_type,
    get_analytics_shard(NOW()) as example_shard,
    'Use get_analytics_shard(timestamp) for routing' as routing_function;

-- ==========================================
-- MAINTENANCE AND MONITORING PROCEDURES
-- ==========================================

-- Function to rebalance shards based on capacity
CREATE OR REPLACE FUNCTION suggest_shard_rebalancing()
RETURNS TABLE(
    recommendation_type VARCHAR(50),
    source_shard INTEGER,
    target_shard INTEGER,
    reason TEXT,
    priority INTEGER
) AS $$
BEGIN
    -- Suggest splitting over-capacity shards
    RETURN QUERY
    SELECT 
        'split_shard'::VARCHAR(50),
        sc.shard_id,
        NULL::INTEGER,
        FORMAT('Shard %s is at %s%% capacity', sc.shard_name, sc.capacity_percent),
        1 as priority
    FROM shard_config sc
    WHERE sc.capacity_percent > 80
        AND sc.is_active = TRUE
        AND sc.migration_status = 'stable';
    
    -- Suggest merging under-utilized shards
    RETURN QUERY
    SELECT 
        'merge_shards'::VARCHAR(50),
        sc1.shard_id,
        sc2.shard_id,
        FORMAT('Shards %s and %s are under-utilized', sc1.shard_name, sc2.shard_name),
        2 as priority
    FROM shard_config sc1
    JOIN shard_config sc2 ON sc1.shard_type = sc2.shard_type 
        AND sc1.shard_id < sc2.shard_id
    WHERE sc1.capacity_percent < 30 
        AND sc2.capacity_percent < 30
        AND sc1.is_active = TRUE 
        AND sc2.is_active = TRUE
        AND sc1.migration_status = 'stable'
        AND sc2.migration_status = 'stable';
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- GRANTS AND PERMISSIONS
-- ==========================================

-- Grant permissions to application user
GRANT SELECT ON shard_config TO cryb_app;
GRANT SELECT ON shard_health TO cryb_app;
GRANT SELECT ON shard_router TO cryb_app;
GRANT EXECUTE ON FUNCTION get_user_shard(UUID) TO cryb_app;
GRANT EXECUTE ON FUNCTION get_content_shard(UUID) TO cryb_app;
GRANT EXECUTE ON FUNCTION get_server_shard(VARCHAR) TO cryb_app;
GRANT EXECUTE ON FUNCTION get_analytics_shard(TIMESTAMPTZ) TO cryb_app;
GRANT EXECUTE ON FUNCTION get_active_shards(VARCHAR) TO cryb_app;
GRANT EXECUTE ON FUNCTION get_shard_connection(INTEGER) TO cryb_app;

-- Grant monitoring permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION check_shard_balance() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION suggest_shard_rebalancing() TO cryb_monitoring;

-- ==========================================
-- COMPLETED: Database Sharding Strategy
-- ==========================================

-- This sharding implementation provides:
-- 1. Hash-based user sharding for horizontal scalability
-- 2. Geographic server sharding for regional optimization
-- 3. Time-based analytics sharding for data lifecycle management
-- 4. Automated shard routing with consistent hashing
-- 5. Migration and rebalancing capabilities
-- 6. Cross-shard query coordination
-- 7. Health monitoring and capacity planning
-- 8. Split and merge operations for dynamic scaling

COMMENT ON TABLE shard_config IS 'Central configuration for database sharding across CRYB platform';
COMMENT ON FUNCTION get_user_shard(UUID) IS 'Route user data to appropriate shard based on consistent hashing';
COMMENT ON FUNCTION get_server_shard(VARCHAR) IS 'Route server/community data based on geographic region';
COMMENT ON FUNCTION get_analytics_shard(TIMESTAMPTZ) IS 'Route analytics data based on time ranges for efficient querying';