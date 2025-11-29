#!/bin/bash

# ==============================================
# CRYB Platform Master Recovery Script
# ==============================================
# Main orchestration script for disaster recovery
# Determines scenario and executes appropriate recovery procedures
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/disaster-recovery"
CONFIG_FILE="${SCRIPT_DIR}/../config/recovery.conf"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_DIR}/recovery.log"
}

log_info() { log "INFO" "$@"; echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { log "WARN" "$@"; echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { log "ERROR" "$@"; echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { log "DEBUG" "$@"; echo -e "${BLUE}[DEBUG]${NC} $*"; }

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Configuration loaded from $CONFIG_FILE"
    else
        log_warn "Configuration file not found, using defaults"
    fi
}

# Send notifications
send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        curl -s -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 CRYB Recovery: $message\",\"severity\":\"$severity\"}" || true
    fi
    
    # Also send to system log
    logger -t "cryb-recovery" "$message"
}

# Detect disaster scenario
detect_scenario() {
    log_info "Detecting disaster scenario..."
    
    local scenario="unknown"
    
    # Check database connectivity
    if ! pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-cryb_user}" >/dev/null 2>&1; then
        log_warn "Database is not accessible"
        scenario="database_failure"
    fi
    
    # Check API availability
    if ! curl -s --max-time 5 "http://localhost:3002/api/health" >/dev/null 2>&1; then
        log_warn "API is not responding"
        if [[ "$scenario" == "unknown" ]]; then
            scenario="application_failure"
        else
            scenario="complete_failure"
        fi
    fi
    
    # Check storage availability
    if ! mount | grep -q "${STORAGE_MOUNT:-/opt/cryb}"; then
        log_warn "Primary storage is not accessible"
        if [[ "$scenario" == "unknown" ]]; then
            scenario="storage_failure"
        else
            scenario="complete_failure"
        fi
    fi
    
    # Check for security indicators
    if [[ -f "/tmp/security_breach_indicator" ]]; then
        log_error "Security breach indicator detected"
        scenario="security_breach"
    fi
    
    log_info "Detected scenario: $scenario"
    echo "$scenario"
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating recovery prerequisites..."
    
    local errors=0
    
    # Check required tools
    for tool in docker docker-compose pg_restore psql curl; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            ((errors++))
        fi
    done
    
    # Check backup availability
    if [[ ! -d "${BACKUP_DIR:-/backup}" ]]; then
        log_error "Backup directory not accessible: ${BACKUP_DIR:-/backup}"
        ((errors++))
    fi
    
    # Check permissions
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        ((errors++))
    fi
    
    # Check disk space
    local available_space=$(df /opt | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then  # 10GB in KB
        log_error "Insufficient disk space for recovery (need 10GB, have $(($available_space/1024/1024))GB)"
        ((errors++))
    fi
    
    if [[ $errors -gt 0 ]]; then
        log_error "Prerequisites validation failed with $errors errors"
        return 1
    fi
    
    log_info "Prerequisites validation passed"
    return 0
}

# Create recovery snapshot
create_recovery_snapshot() {
    log_info "Creating recovery snapshot..."
    
    local snapshot_dir="/tmp/recovery-snapshot-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$snapshot_dir"
    
    # Snapshot current system state
    {
        echo "=== System Information ==="
        uname -a
        echo
        
        echo "=== Docker Services ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
        echo
        
        echo "=== Disk Usage ==="
        df -h
        echo
        
        echo "=== Memory Usage ==="
        free -h
        echo
        
        echo "=== Network Status ==="
        netstat -tlnp || ss -tlnp
        echo
        
        echo "=== Process List ==="
        ps aux --sort=-%cpu | head -20
        
    } > "$snapshot_dir/system_state.txt"
    
    # Backup current configuration
    if [[ -d "/home/ubuntu/cryb-platform" ]]; then
        tar -czf "$snapshot_dir/current_config.tar.gz" -C /home/ubuntu cryb-platform/config/ 2>/dev/null || true
    fi
    
    log_info "Recovery snapshot created at $snapshot_dir"
    echo "$snapshot_dir"
}

# Execute recovery based on scenario
execute_recovery() {
    local scenario="$1"
    local snapshot_dir="$2"
    
    log_info "Executing recovery for scenario: $scenario"
    send_notification "Starting recovery for $scenario scenario" "warning"
    
    case "$scenario" in
        "database_failure")
            log_info "Executing database recovery..."
            if "$SCRIPT_DIR/database-recovery.sh"; then
                log_info "Database recovery completed successfully"
                return 0
            else
                log_error "Database recovery failed"
                return 1
            fi
            ;;
            
        "application_failure")
            log_info "Executing application recovery..."
            if "$SCRIPT_DIR/application-recovery.sh"; then
                log_info "Application recovery completed successfully"
                return 0
            else
                log_error "Application recovery failed"
                return 1
            fi
            ;;
            
        "storage_failure")
            log_info "Executing storage recovery..."
            if "$SCRIPT_DIR/storage-recovery.sh"; then
                log_info "Storage recovery completed successfully"
                return 0
            else
                log_error "Storage recovery failed"
                return 1
            fi
            ;;
            
        "security_breach")
            log_info "Executing security breach recovery..."
            if "$SCRIPT_DIR/security-recovery.sh"; then
                log_info "Security breach recovery completed successfully"
                return 0
            else
                log_error "Security breach recovery failed"
                return 1
            fi
            ;;
            
        "complete_failure")
            log_info "Executing complete infrastructure recovery..."
            if "$SCRIPT_DIR/complete-recovery.sh"; then
                log_info "Complete recovery completed successfully"
                return 0
            else
                log_error "Complete recovery failed"
                return 1
            fi
            ;;
            
        *)
            log_error "Unknown recovery scenario: $scenario"
            return 1
            ;;
    esac
}

# Validate recovery
validate_recovery() {
    log_info "Validating recovery..."
    
    local errors=0
    
    # Check database connectivity
    if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-cryb_user}" >/dev/null 2>&1; then
        log_info "✓ Database is accessible"
    else
        log_error "✗ Database is not accessible"
        ((errors++))
    fi
    
    # Check API health
    if curl -s --max-time 10 "http://localhost:3002/api/health" | grep -q '"status":"healthy"'; then
        log_info "✓ API is responding and healthy"
    else
        log_error "✗ API is not responding or unhealthy"
        ((errors++))
    fi
    
    # Check web application
    if curl -s --max-time 10 "http://localhost:3003/" >/dev/null 2>&1; then
        log_info "✓ Web application is accessible"
    else
        log_error "✗ Web application is not accessible"
        ((errors++))
    fi
    
    # Check admin panel
    if curl -s --max-time 10 "http://localhost:3007/" >/dev/null 2>&1; then
        log_info "✓ Admin panel is accessible"
    else
        log_warn "⚠ Admin panel is not accessible (non-critical)"
    fi
    
    # Check monitoring services
    if curl -s --max-time 5 "http://localhost:3005/api/health" >/dev/null 2>&1; then
        log_info "✓ Monitoring services are accessible"
    else
        log_warn "⚠ Monitoring services are not accessible (non-critical)"
    fi
    
    # Check security monitoring
    if curl -s --max-time 5 "http://localhost:9200/health" >/dev/null 2>&1; then
        log_info "✓ Security monitoring is accessible"
    else
        log_warn "⚠ Security monitoring is not accessible (non-critical)"
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_info "✓ Recovery validation passed"
        return 0
    else
        log_error "✗ Recovery validation failed with $errors critical errors"
        return 1
    fi
}

# Generate recovery report
generate_recovery_report() {
    local scenario="$1"
    local start_time="$2"
    local end_time="$3"
    local success="$4"
    local snapshot_dir="$5"
    
    local duration=$((end_time - start_time))
    local report_file="${LOG_DIR}/recovery-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# CRYB Platform Recovery Report

## Recovery Summary
- **Scenario**: $scenario
- **Start Time**: $(date -d "@$start_time" '+%Y-%m-%d %H:%M:%S UTC')
- **End Time**: $(date -d "@$end_time" '+%Y-%m-%d %H:%M:%S UTC')
- **Duration**: $duration seconds ($(($duration / 60)) minutes)
- **Success**: $success
- **Snapshot**: $snapshot_dir

## Timeline
$(grep "$(date -d "@$start_time" '+%Y-%m-%d')" "$LOG_DIR/recovery.log" | tail -100)

## System State Before Recovery
$(cat "$snapshot_dir/system_state.txt" 2>/dev/null || echo "System state snapshot not available")

## Post-Recovery Validation
$(tail -50 "$LOG_DIR/recovery.log" | grep -E "(✓|✗|⚠)")

## Recommendations
- Review the recovery timeline for optimization opportunities
- Update recovery procedures based on lessons learned
- Schedule follow-up monitoring to ensure system stability
- Consider additional preventive measures based on the scenario

## Next Steps
1. Monitor system performance for the next 24 hours
2. Verify data integrity and consistency
3. Update incident documentation
4. Schedule post-incident review meeting
5. Update recovery procedures if needed

---
Report generated on $(date) by recovery automation system.
EOF

    log_info "Recovery report generated: $report_file"
    echo "$report_file"
}

# Post-recovery actions
post_recovery_actions() {
    local scenario="$1"
    local success="$2"
    
    log_info "Executing post-recovery actions..."
    
    # Restart monitoring services
    log_info "Restarting monitoring services..."
    systemctl restart prometheus || docker-compose -f /home/ubuntu/cryb-platform/docker-compose.monitoring.yml restart prometheus || true
    
    # Clear any maintenance mode
    if [[ -f "/tmp/maintenance_mode" ]]; then
        rm -f "/tmp/maintenance_mode"
        log_info "Maintenance mode cleared"
    fi
    
    # Update status page
    if [[ "$success" == "true" ]]; then
        curl -s -X POST "${STATUS_PAGE_WEBHOOK:-}" \
            -H "Content-Type: application/json" \
            -d '{"status":"operational","message":"Services restored after recovery"}' || true
    fi
    
    # Schedule increased monitoring
    echo "*/5 * * * * /home/ubuntu/cryb-platform/scripts/enhanced-health-check.sh" | crontab - || true
    
    log_info "Post-recovery actions completed"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}CRYB Platform Disaster Recovery${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo
    
    log_info "Starting disaster recovery process..."
    send_notification "Disaster recovery process initiated" "critical"
    
    # Load configuration
    load_config
    
    # Validate prerequisites
    if ! validate_prerequisites; then
        log_error "Prerequisites validation failed, aborting recovery"
        send_notification "Recovery aborted: prerequisites validation failed" "critical"
        exit 1
    fi
    
    # Create recovery snapshot
    local snapshot_dir
    snapshot_dir=$(create_recovery_snapshot)
    
    # Detect scenario
    local scenario
    scenario=$(detect_scenario)
    
    # Execute recovery
    local success="false"
    if execute_recovery "$scenario" "$snapshot_dir"; then
        success="true"
        log_info "Recovery execution completed successfully"
    else
        log_error "Recovery execution failed"
    fi
    
    # Validate recovery
    if [[ "$success" == "true" ]]; then
        if validate_recovery; then
            log_info "Recovery validation passed"
            send_notification "Recovery completed successfully for $scenario" "success"
        else
            log_error "Recovery validation failed"
            success="false"
            send_notification "Recovery completed but validation failed for $scenario" "warning"
        fi
    fi
    
    # Post-recovery actions
    post_recovery_actions "$scenario" "$success"
    
    # Generate report
    local end_time=$(date +%s)
    local report_file
    report_file=$(generate_recovery_report "$scenario" "$start_time" "$end_time" "$success" "$snapshot_dir")
    
    # Final status
    echo
    if [[ "$success" == "true" ]]; then
        echo -e "${GREEN}✓ Recovery completed successfully${NC}"
        echo -e "${GREEN}✓ All critical services are operational${NC}"
        echo -e "${GREEN}✓ Recovery report: $report_file${NC}"
        exit 0
    else
        echo -e "${RED}✗ Recovery failed or validation failed${NC}"
        echo -e "${RED}✗ Manual intervention may be required${NC}"
        echo -e "${RED}✗ Recovery report: $report_file${NC}"
        exit 1
    fi
}

# Handle signals
trap 'log_error "Recovery interrupted by signal"; send_notification "Recovery process interrupted" "critical"; exit 1' INT TERM

# Execute main function
main "$@"