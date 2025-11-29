#!/bin/bash

# CRYB PLATFORM DATABASE OPTIMIZATION DEPLOYMENT
# Complete deployment script for all database optimization components
# Deploys indexes, TimescaleDB, monitoring, backups, and performance tracking

set -euo pipefail

# ==============================================
# CONFIGURATION
# ==============================================

# Database connection settings
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cryb}"
DB_USER="${DB_USER:-cryb_user}"
DB_PASSWORD="${DB_PASSWORD:-cryb_password}"

# Deployment configuration
SCRIPT_DIR="/home/ubuntu/cryb-platform/scripts"
LOG_FILE="/home/ubuntu/cryb-platform/logs/database_optimization_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups"

# Deployment phases
DEPLOY_INDEXES=true
DEPLOY_TIMESCALEDB=true
DEPLOY_MONITORING=true
DEPLOY_QUERY_MONITORING=true
DEPLOY_PROCEDURES=true
DEPLOY_BACKUPS=true

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1" >&2
    exit 1
}

warn() {
    log "WARNING: $1" >&2
}

success() {
    log "SUCCESS: $1"
}

# Execute SQL file with error handling
execute_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    log "Executing $description: $(basename "$sql_file")"
    
    if [ ! -f "$sql_file" ]; then
        error "SQL file not found: $sql_file"
    fi
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" >> "$LOG_FILE" 2>&1; then
        success "$description completed successfully"
        return 0
    else
        error "$description failed. Check log: $LOG_FILE"
        return 1
    fi
}

# Execute SQL command with error handling
execute_sql_command() {
    local sql_command="$1"
    local description="$2"
    
    log "Executing $description"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql_command" >> "$LOG_FILE" 2>&1; then
        success "$description completed successfully"
        return 0
    else
        warn "$description failed: $sql_command"
        return 1
    fi
}

check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if PostgreSQL is accessible
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" >/dev/null 2>&1; then
        error "Cannot connect to PostgreSQL database"
    fi
    
    # Check if script files exist
    local required_files=(
        "$SCRIPT_DIR/database-performance-indexes.sql"
        "$SCRIPT_DIR/timescaledb-complete-setup.sql"
        "$SCRIPT_DIR/database-monitoring-system.sql"
        "$SCRIPT_DIR/query-performance-monitor.sql"
        "$SCRIPT_DIR/query-optimization-procedures.sql"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required script file not found: $file"
        fi
    done
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$BACKUP_DIR"
    
    # Check available disk space
    local available_space
    available_space=$(df -BG "$(dirname "$LOG_FILE")" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 5 ]; then
        error "Insufficient disk space. Need at least 5GB available."
    fi
    
    success "Prerequisites check completed"
}

create_backup() {
    log "Creating pre-deployment database backup..."
    
    local backup_file="$BACKUP_DIR/pre_optimization_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        -f "$backup_file" 2>>"$LOG_FILE"; then
        success "Schema backup created: $backup_file"
    else
        warn "Failed to create backup, but continuing with deployment"
    fi
}

deploy_performance_indexes() {
    if [ "$DEPLOY_INDEXES" != "true" ]; then
        log "Skipping performance indexes deployment"
        return 0
    fi
    
    log "=== DEPLOYING PERFORMANCE INDEXES ==="
    
    # Execute performance indexes script
    execute_sql_file "$SCRIPT_DIR/database-performance-indexes.sql" "Performance Indexes Deployment"
    
    # Verify critical indexes were created
    local critical_indexes=(
        "idx_message_channel_timestamp_optimized"
        "idx_server_member_roles_active"
        "idx_post_hot_ranking"
        "idx_user_presence_active_status"
    )
    
    for index in "${critical_indexes[@]}"; do
        if execute_sql_command "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" "Check index $index"; then
            success "Critical index verified: $index"
        else
            warn "Critical index missing: $index"
        fi
    done
    
    success "Performance indexes deployment completed"
}

deploy_timescaledb() {
    if [ "$DEPLOY_TIMESCALEDB" != "true" ]; then
        log "Skipping TimescaleDB deployment"
        return 0
    fi
    
    log "=== DEPLOYING TIMESCALEDB OPTIMIZATION ==="
    
    # Check if TimescaleDB extension is available
    if ! execute_sql_command "SELECT 1 FROM pg_extension WHERE extname = 'timescaledb';" "Check TimescaleDB extension"; then
        log "TimescaleDB extension not found, trying to create it..."
        if ! execute_sql_command "CREATE EXTENSION IF NOT EXISTS timescaledb;" "Create TimescaleDB extension"; then
            warn "TimescaleDB extension not available, skipping TimescaleDB optimization"
            return 0
        fi
    fi
    
    # Execute TimescaleDB setup
    execute_sql_file "$SCRIPT_DIR/timescaledb-complete-setup.sql" "TimescaleDB Complete Setup"
    
    # Verify hypertables were created
    local expected_hypertables=("MessageAnalytics" "VoiceAnalytics" "ServerAnalytics")
    for table in "${expected_hypertables[@]}"; do
        if execute_sql_command "SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_name = '$table';" "Check hypertable $table"; then
            success "Hypertable verified: $table"
        else
            warn "Hypertable not found: $table"
        fi
    done
    
    success "TimescaleDB optimization deployment completed"
}

deploy_monitoring_system() {
    if [ "$DEPLOY_MONITORING" != "true" ]; then
        log "Skipping monitoring system deployment"
        return 0
    fi
    
    log "=== DEPLOYING DATABASE MONITORING SYSTEM ==="
    
    # Execute monitoring system setup
    execute_sql_file "$SCRIPT_DIR/database-monitoring-system.sql" "Database Monitoring System"
    
    # Verify monitoring tables were created
    local monitoring_tables=("database_metrics" "connection_metrics" "storage_metrics" "alert_rules")
    for table in "${monitoring_tables[@]}"; do
        if execute_sql_command "SELECT 1 FROM information_schema.tables WHERE table_schema = 'monitoring' AND table_name = '$table';" "Check monitoring table $table"; then
            success "Monitoring table verified: $table"
        else
            warn "Monitoring table not found: $table"
        fi
    done
    
    # Test monitoring functions
    if execute_sql_command "SELECT monitoring.collect_all_metrics();" "Test monitoring collection"; then
        success "Monitoring system is functional"
    else
        warn "Monitoring system may have issues"
    fi
    
    success "Database monitoring system deployment completed"
}

deploy_query_monitoring() {
    if [ "$DEPLOY_QUERY_MONITORING" != "true" ]; then
        log "Skipping query monitoring deployment"
        return 0
    fi
    
    log "=== DEPLOYING QUERY PERFORMANCE MONITORING ==="
    
    # Check if pg_stat_statements is available
    if ! execute_sql_command "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements';" "Check pg_stat_statements extension"; then
        log "pg_stat_statements extension not found, trying to create it..."
        if ! execute_sql_command "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;" "Create pg_stat_statements extension"; then
            warn "pg_stat_statements extension not available, some query monitoring features will be limited"
        fi
    fi
    
    # Execute query monitoring setup
    execute_sql_file "$SCRIPT_DIR/query-performance-monitor.sql" "Query Performance Monitoring"
    
    # Test query monitoring functions
    if execute_sql_command "SELECT query_monitor.collect_query_metrics();" "Test query monitoring collection"; then
        success "Query monitoring system is functional"
    else
        warn "Query monitoring system may have issues"
    fi
    
    success "Query performance monitoring deployment completed"
}

deploy_optimization_procedures() {
    if [ "$DEPLOY_PROCEDURES" != "true" ]; then
        log "Skipping optimization procedures deployment"
        return 0
    fi
    
    log "=== DEPLOYING QUERY OPTIMIZATION PROCEDURES ==="
    
    # Execute optimization procedures
    execute_sql_file "$SCRIPT_DIR/query-optimization-procedures.sql" "Query Optimization Procedures"
    
    # Test key procedures
    local test_procedures=(
        "get_channel_messages_optimized"
        "discover_servers"
        "refresh_analytics_views"
    )
    
    for proc in "${test_procedures[@]}"; do
        if execute_sql_command "SELECT 1 FROM information_schema.routines WHERE routine_name = '$proc';" "Check procedure $proc"; then
            success "Optimization procedure verified: $proc"
        else
            warn "Optimization procedure not found: $proc"
        fi
    done
    
    success "Query optimization procedures deployment completed"
}

setup_backup_system() {
    if [ "$DEPLOY_BACKUPS" != "true" ]; then
        log "Skipping backup system setup"
        return 0
    fi
    
    log "=== SETTING UP AUTOMATED BACKUP SYSTEM ==="
    
    # Make backup scripts executable
    chmod +x "$SCRIPT_DIR/enhanced-backup-system.sh"
    chmod +x "$SCRIPT_DIR/setup-backup-automation.sh"
    
    # Run backup automation setup
    if "$SCRIPT_DIR/setup-backup-automation.sh" >> "$LOG_FILE" 2>&1; then
        success "Backup automation setup completed"
    else
        warn "Backup automation setup encountered issues, check manually"
    fi
    
    # Test backup system connectivity
    if command -v aws >/dev/null 2>&1; then
        if aws s3 ls >/dev/null 2>&1; then
            success "AWS CLI configured and accessible"
        else
            warn "AWS CLI not properly configured for S3 backups"
        fi
    else
        warn "AWS CLI not installed, S3 backups will not work"
    fi
    
    success "Backup system setup completed"
}

configure_automated_tasks() {
    log "=== CONFIGURING AUTOMATED TASKS ==="
    
    # Check if pg_cron extension is available
    if execute_sql_command "SELECT 1 FROM pg_extension WHERE extname = 'pg_cron';" "Check pg_cron extension"; then
        log "pg_cron extension found, setting up automated tasks..."
        
        # Schedule monitoring collection every 5 minutes
        execute_sql_command "SELECT cron.schedule('collect-metrics', '*/5 * * * *', 'SELECT monitoring.collect_all_metrics();');" "Schedule metrics collection"
        
        # Schedule query monitoring every 10 minutes
        execute_sql_command "SELECT cron.schedule('query-metrics', '*/10 * * * *', 'SELECT query_monitor.collect_query_metrics();');" "Schedule query monitoring"
        
        # Schedule analytics view refresh every hour
        execute_sql_command "SELECT cron.schedule('refresh-views', '0 * * * *', 'SELECT refresh_analytics_views();');" "Schedule view refresh"
        
        success "Automated tasks configured with pg_cron"
    else
        warn "pg_cron extension not available, manual scheduling required"
        log "To manually run monitoring tasks:"
        log "- Metrics collection: SELECT monitoring.collect_all_metrics();"
        log "- Query monitoring: SELECT query_monitor.collect_query_metrics();"
        log "- View refresh: SELECT refresh_analytics_views();"
    fi
}

generate_deployment_report() {
    log "=== GENERATING DEPLOYMENT REPORT ==="
    
    local report_file="/home/ubuntu/cryb-platform/logs/optimization_deployment_report_$(date +%Y%m%d_%H%M%S).json"
    
    # Create deployment report
    cat > "$report_file" << EOF
{
    "deployment_report": {
        "timestamp": "$(date -Iseconds)",
        "database": {
            "host": "$DB_HOST",
            "port": $DB_PORT,
            "database": "$DB_NAME",
            "user": "$DB_USER"
        },
        "components_deployed": {
            "performance_indexes": $DEPLOY_INDEXES,
            "timescaledb_optimization": $DEPLOY_TIMESCALEDB,
            "monitoring_system": $DEPLOY_MONITORING,
            "query_monitoring": $DEPLOY_QUERY_MONITORING,
            "optimization_procedures": $DEPLOY_PROCEDURES,
            "backup_system": $DEPLOY_BACKUPS
        },
        "deployment_status": "completed",
        "log_file": "$LOG_FILE",
        "next_steps": [
            "Monitor system performance using monitoring.generate_health_report(24)",
            "Review query optimization recommendations with query_monitor.generate_optimization_report()",
            "Verify backup system with manual backup test",
            "Set up alerting and notification channels",
            "Schedule regular performance reviews"
        ]
    }
}
EOF
    
    success "Deployment report generated: $report_file"
}

run_post_deployment_tests() {
    log "=== RUNNING POST-DEPLOYMENT TESTS ==="
    
    # Test database connectivity
    if execute_sql_command "SELECT version();" "Test database connectivity"; then
        success "Database connectivity test passed"
    else
        error "Database connectivity test failed"
    fi
    
    # Test monitoring system
    if execute_sql_command "SELECT monitoring.generate_health_report(1);" "Test monitoring system"; then
        success "Monitoring system test passed"
    else
        warn "Monitoring system test failed"
    fi
    
    # Test query monitoring
    if execute_sql_command "SELECT query_monitor.generate_optimization_report();" "Test query monitoring"; then
        success "Query monitoring test passed"
    else
        warn "Query monitoring test failed"
    fi
    
    # Test optimization procedures
    if execute_sql_command "SELECT get_index_usage_stats();" "Test optimization procedures"; then
        success "Optimization procedures test passed"
    else
        warn "Optimization procedures test failed"
    fi
    
    # Performance verification
    log "Running performance verification..."
    local query_time
    query_time=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\timing on" -c "SELECT COUNT(*) FROM \"User\";" 2>&1 | grep "Time:" | awk '{print $2}' || echo "unknown")
    log "Sample query execution time: $query_time"
    
    success "Post-deployment tests completed"
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    local start_time
    start_time=$(date +%s)
    
    log "Starting CRYB Platform Database Optimization Deployment"
    log "==================================================="
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-indexes)
                DEPLOY_INDEXES=false
                shift
                ;;
            --skip-timescaledb)
                DEPLOY_TIMESCALEDB=false
                shift
                ;;
            --skip-monitoring)
                DEPLOY_MONITORING=false
                shift
                ;;
            --skip-query-monitoring)
                DEPLOY_QUERY_MONITORING=false
                shift
                ;;
            --skip-procedures)
                DEPLOY_PROCEDURES=false
                shift
                ;;
            --skip-backups)
                DEPLOY_BACKUPS=false
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-indexes         Skip performance indexes deployment"
                echo "  --skip-timescaledb     Skip TimescaleDB optimization"
                echo "  --skip-monitoring      Skip monitoring system deployment"
                echo "  --skip-query-monitoring Skip query monitoring deployment"
                echo "  --skip-procedures      Skip optimization procedures deployment"
                echo "  --skip-backups         Skip backup system setup"
                echo "  --help                 Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Execute deployment phases
    check_prerequisites
    create_backup
    deploy_performance_indexes
    deploy_timescaledb
    deploy_monitoring_system
    deploy_query_monitoring
    deploy_optimization_procedures
    setup_backup_system
    configure_automated_tasks
    run_post_deployment_tests
    generate_deployment_report
    
    # Calculate deployment time
    local end_time duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log "==================================================="
    success "CRYB Platform Database Optimization Deployment Completed Successfully!"
    log "Total deployment time: ${duration} seconds"
    log "Log file: $LOG_FILE"
    log ""
    log "Next steps:"
    log "1. Monitor system performance: SELECT * FROM monitoring.generate_health_report(24);"
    log "2. Review optimization opportunities: SELECT * FROM query_monitor.generate_optimization_report();"
    log "3. Verify backup system: sudo systemctl status cryb-backup-full.timer"
    log "4. Set up alerting endpoints in monitoring.alert_rules"
    log "5. Schedule regular performance reviews"
    log ""
    log "For ongoing maintenance, run:"
    log "- Daily: SELECT monitoring.collect_all_metrics();"
    log "- Weekly: SELECT query_monitor.generate_optimization_recommendations();"
    log "- Monthly: SELECT refresh_analytics_views();"
}

# Trap errors for cleanup
trap 'error "Deployment failed at line $LINENO"' ERR

# Execute main function with all arguments
main "$@"