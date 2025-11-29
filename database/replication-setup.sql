-- CRYB Platform PostgreSQL Replication Setup
-- Configure primary-replica streaming replication for high availability
-- Author: Database Infrastructure Team
-- Version: 1.0

-- ==========================================
-- REPLICATION USER SETUP
-- ==========================================

-- Create replication user with appropriate privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'replicator') THEN
        CREATE ROLE replicator WITH 
            REPLICATION 
            LOGIN 
            PASSWORD 'cryb_replication_secure_2024_prod';
    END IF;
END
$$;

-- Grant necessary permissions for replication
GRANT CONNECT ON DATABASE cryb TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;

-- Create monitoring user for postgres_exporter
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cryb_monitoring') THEN
        CREATE ROLE cryb_monitoring WITH 
            LOGIN 
            PASSWORD 'cryb_monitoring_secure_2024_prod';
    END IF;
END
$$;

-- Grant monitoring permissions
GRANT CONNECT ON DATABASE cryb TO cryb_monitoring;
GRANT pg_monitor TO cryb_monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA information_schema TO cryb_monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA pg_catalog TO cryb_monitoring;

-- ==========================================
-- REPLICATION MONITORING FUNCTIONS
-- ==========================================

-- Function to check replication lag
CREATE OR REPLACE FUNCTION get_replication_lag()
RETURNS TABLE(
    client_addr INET,
    client_hostname TEXT,
    state TEXT,
    sent_lsn PG_LSN,
    write_lsn PG_LSN,
    flush_lsn PG_LSN,
    replay_lsn PG_LSN,
    write_lag INTERVAL,
    flush_lag INTERVAL,
    replay_lag INTERVAL,
    sync_state TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.client_addr,
        sr.client_hostname,
        sr.state,
        sr.sent_lsn,
        sr.write_lsn,
        sr.flush_lsn,
        sr.replay_lsn,
        sr.write_lag,
        sr.flush_lag,
        sr.replay_lag,
        sr.sync_state
    FROM pg_stat_replication sr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to monitor replication slots
CREATE OR REPLACE FUNCTION get_replication_slots()
RETURNS TABLE(
    slot_name NAME,
    plugin NAME,
    slot_type TEXT,
    datoid OID,
    database NAME,
    temporary BOOLEAN,
    active BOOLEAN,
    active_pid INTEGER,
    xmin XID,
    catalog_xmin XID,
    restart_lsn PG_LSN,
    confirmed_flush_lsn PG_LSN,
    wal_status TEXT,
    safe_wal_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.slot_name,
        rs.plugin,
        rs.slot_type,
        rs.datoid,
        rs.database,
        rs.temporary,
        rs.active,
        rs.active_pid,
        rs.xmin,
        rs.catalog_xmin,
        rs.restart_lsn,
        rs.confirmed_flush_lsn,
        rs.wal_status,
        rs.safe_wal_size
    FROM pg_replication_slots rs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check WAL archiving status
CREATE OR REPLACE FUNCTION get_wal_archiving_status()
RETURNS TABLE(
    archived_count BIGINT,
    last_archived_wal TEXT,
    last_archived_time TIMESTAMPTZ,
    failed_count BIGINT,
    last_failed_wal TEXT,
    last_failed_time TIMESTAMPTZ,
    stats_reset TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.archived_count,
        sa.last_archived_wal,
        sa.last_archived_time,
        sa.failed_count,
        sa.last_failed_wal,
        sa.last_failed_time,
        sa.stats_reset
    FROM pg_stat_archiver sa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to monitor database size across cluster
CREATE OR REPLACE FUNCTION get_database_sizes()
RETURNS TABLE(
    database_name NAME,
    size_bytes BIGINT,
    size_pretty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.datname,
        pg_database_size(d.datname),
        pg_size_pretty(pg_database_size(d.datname))
    FROM pg_database d
    WHERE d.datistemplate = FALSE
    ORDER BY pg_database_size(d.datname) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- REPLICATION HEALTH MONITORING VIEWS
-- ==========================================

-- View for monitoring replication health
CREATE OR REPLACE VIEW replication_health AS
SELECT 
    CASE 
        WHEN count(*) = 0 THEN 'NO_REPLICAS'
        WHEN count(*) FILTER (WHERE state = 'streaming') = count(*) THEN 'HEALTHY'
        WHEN count(*) FILTER (WHERE state = 'streaming') > 0 THEN 'PARTIAL'
        ELSE 'UNHEALTHY'
    END as overall_status,
    count(*) as total_replicas,
    count(*) FILTER (WHERE state = 'streaming') as streaming_replicas,
    count(*) FILTER (WHERE state != 'streaming') as problematic_replicas,
    COALESCE(max(write_lag), INTERVAL '0') as max_write_lag,
    COALESCE(max(flush_lag), INTERVAL '0') as max_flush_lag,
    COALESCE(max(replay_lag), INTERVAL '0') as max_replay_lag,
    COALESCE(avg(EXTRACT(EPOCH FROM write_lag)), 0) as avg_write_lag_seconds,
    COALESCE(avg(EXTRACT(EPOCH FROM flush_lag)), 0) as avg_flush_lag_seconds,
    COALESCE(avg(EXTRACT(EPOCH FROM replay_lag)), 0) as avg_replay_lag_seconds
FROM pg_stat_replication;

-- View for WAL generation statistics
CREATE OR REPLACE VIEW wal_generation_stats AS
SELECT 
    'wal_generation' as metric_type,
    pg_current_wal_lsn() as current_wal_lsn,
    pg_walfile_name(pg_current_wal_lsn()) as current_wal_file,
    COALESCE(
        pg_size_pretty(
            pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)
        ), 
        '0 bytes'
    ) as wal_size_since_last_checkpoint
FROM pg_control_checkpoint();

-- View for connection statistics
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    datname as database_name,
    usename as username,
    client_addr,
    state,
    COUNT(*) as connection_count,
    MAX(backend_start) as oldest_connection,
    MIN(backend_start) as newest_connection,
    COUNT(*) FILTER (WHERE state = 'active') as active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE pid != pg_backend_pid()  -- Exclude current connection
GROUP BY datname, usename, client_addr, state
ORDER BY connection_count DESC;

-- ==========================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- ==========================================

-- Function to cleanup old replication slots
CREATE OR REPLACE FUNCTION cleanup_inactive_replication_slots(
    inactive_threshold INTERVAL DEFAULT INTERVAL '1 hour'
) RETURNS INTEGER AS $$
DECLARE
    slot_record RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- Only run on primary
    IF pg_is_in_recovery() THEN
        RAISE NOTICE 'Skipping replication slot cleanup on replica';
        RETURN 0;
    END IF;
    
    FOR slot_record IN 
        SELECT slot_name, active, active_pid
        FROM pg_replication_slots 
        WHERE NOT active 
        AND slot_type = 'physical'
        AND (
            SELECT backend_start 
            FROM pg_stat_activity 
            WHERE pid = active_pid
        ) < NOW() - inactive_threshold
    LOOP
        BEGIN
            PERFORM pg_drop_replication_slot(slot_record.slot_name);
            dropped_count := dropped_count + 1;
            RAISE NOTICE 'Dropped inactive replication slot: %', slot_record.slot_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to drop replication slot %: %', slot_record.slot_name, SQLERRM;
        END;
    END LOOP;
    
    RETURN dropped_count;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor and alert on replication lag
CREATE OR REPLACE FUNCTION check_replication_lag_alert(
    warning_threshold INTERVAL DEFAULT INTERVAL '30 seconds',
    critical_threshold INTERVAL DEFAULT INTERVAL '5 minutes'
) RETURNS TABLE(
    replica_client_addr INET,
    lag_status TEXT,
    write_lag_seconds DOUBLE PRECISION,
    flush_lag_seconds DOUBLE PRECISION,
    replay_lag_seconds DOUBLE PRECISION,
    alert_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.client_addr,
        sr.state as lag_status,
        COALESCE(EXTRACT(EPOCH FROM sr.write_lag), 0) as write_lag_seconds,
        COALESCE(EXTRACT(EPOCH FROM sr.flush_lag), 0) as flush_lag_seconds,
        COALESCE(EXTRACT(EPOCH FROM sr.replay_lag), 0) as replay_lag_seconds,
        CASE 
            WHEN sr.replay_lag > critical_threshold THEN 'CRITICAL'
            WHEN sr.replay_lag > warning_threshold THEN 'WARNING'
            WHEN sr.state != 'streaming' THEN 'ERROR'
            ELSE 'OK'
        END as alert_level
    FROM pg_stat_replication sr
    WHERE sr.replay_lag > warning_threshold OR sr.state != 'streaming'
    ORDER BY sr.replay_lag DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- REPLICATION SLOT MANAGEMENT
-- ==========================================

-- Create replication slots for each replica
DO $$
BEGIN
    -- Create slot for replica-1
    IF NOT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_1_slot') THEN
        PERFORM pg_create_physical_replication_slot('replica_1_slot');
        RAISE NOTICE 'Created replication slot: replica_1_slot';
    END IF;
    
    -- Create slot for replica-2
    IF NOT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = 'replica_2_slot') THEN
        PERFORM pg_create_physical_replication_slot('replica_2_slot');
        RAISE NOTICE 'Created replication slot: replica_2_slot';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create replication slots: %', SQLERRM;
END
$$;

-- ==========================================
-- BACKUP AND RECOVERY PREPARATION
-- ==========================================

-- Function to create point-in-time recovery info
CREATE OR REPLACE FUNCTION create_recovery_info()
RETURNS TABLE(
    current_wal_lsn TEXT,
    current_timestamp TIMESTAMPTZ,
    recovery_command TEXT
) AS $$
DECLARE
    current_lsn PG_LSN;
    current_time TIMESTAMPTZ;
BEGIN
    current_lsn := pg_current_wal_lsn();
    current_time := NOW();
    
    RETURN QUERY
    SELECT 
        current_lsn::TEXT,
        current_time,
        FORMAT('restore_command = ''wal-g wal-fetch %%f %%p''
recovery_target_lsn = ''%s''
recovery_target_action = ''promote''', current_lsn) as recovery_command;
END;
$$ LANGUAGE plpgsql;

-- Function to estimate recovery time
CREATE OR REPLACE FUNCTION estimate_recovery_time(
    target_lsn PG_LSN DEFAULT NULL
) RETURNS TABLE(
    wal_segments_to_replay BIGINT,
    estimated_replay_time INTERVAL,
    wal_size_to_replay TEXT
) AS $$
DECLARE
    current_lsn PG_LSN;
    segments_count BIGINT;
    avg_replay_rate DOUBLE PRECISION;
BEGIN
    current_lsn := COALESCE(target_lsn, pg_current_wal_lsn());
    
    -- Calculate WAL segments (assuming 16MB segments)
    segments_count := pg_wal_lsn_diff(current_lsn, '0/0') / (16 * 1024 * 1024);
    
    -- Estimate replay rate (conservative 50MB/s)
    avg_replay_rate := 50 * 1024 * 1024; -- 50MB/s in bytes
    
    RETURN QUERY
    SELECT 
        segments_count,
        (pg_wal_lsn_diff(current_lsn, '0/0') / avg_replay_rate || ' seconds')::INTERVAL,
        pg_size_pretty(pg_wal_lsn_diff(current_lsn, '0/0'));
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MONITORING GRANTS
-- ==========================================

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION get_replication_lag() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION get_replication_slots() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION get_wal_archiving_status() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION get_database_sizes() TO cryb_monitoring;
GRANT EXECUTE ON FUNCTION check_replication_lag_alert(INTERVAL, INTERVAL) TO cryb_monitoring;

-- Grant access to monitoring views
GRANT SELECT ON replication_health TO cryb_monitoring;
GRANT SELECT ON wal_generation_stats TO cryb_monitoring;
GRANT SELECT ON connection_stats TO cryb_monitoring;

-- ==========================================
-- AUTOMATED MAINTENANCE SCHEDULE
-- ==========================================

-- Schedule cleanup of inactive replication slots (runs hourly)
-- This would typically be configured in pg_cron or external scheduler
/*
SELECT cron.schedule('cleanup-replication-slots', '0 * * * *', 
    'SELECT cleanup_inactive_replication_slots();');

-- Schedule replication lag monitoring (runs every 5 minutes)
SELECT cron.schedule('replication-lag-check', '*/5 * * * *', 
    'SELECT * FROM check_replication_lag_alert();');
*/

-- ==========================================
-- INITIAL VERIFICATION
-- ==========================================

-- Verify replication setup
DO $$
DECLARE
    replica_count INTEGER;
    slot_count INTEGER;
BEGIN
    -- Check if we're on primary
    IF pg_is_in_recovery() THEN
        RAISE NOTICE 'This is a replica server - replication setup complete';
    ELSE
        -- Count active replicas
        SELECT COUNT(*) INTO replica_count
        FROM pg_stat_replication
        WHERE state = 'streaming';
        
        -- Count replication slots
        SELECT COUNT(*) INTO slot_count
        FROM pg_replication_slots
        WHERE slot_type = 'physical';
        
        RAISE NOTICE 'Primary server setup complete. Active replicas: %, Replication slots: %', 
            replica_count, slot_count;
    END IF;
END
$$;

-- ==========================================
-- COMPLETED: Replication Setup
-- ==========================================

-- This setup provides:
-- 1. Replication user with proper privileges
-- 2. Monitoring functions for replication health
-- 3. Automated maintenance procedures
-- 4. Replication slot management
-- 5. Point-in-time recovery preparation
-- 6. Comprehensive monitoring views
-- 7. Alert functions for lag detection
-- 8. Database size and performance monitoring

COMMENT ON SCHEMA public IS 'CRYB Platform - PostgreSQL Replication Setup for High Availability';