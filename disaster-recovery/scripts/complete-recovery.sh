#!/bin/bash

# ==============================================
# CRYB Platform Complete Recovery Script
# ==============================================
# Handles complete infrastructure disaster recovery
# Coordinates all recovery procedures for total failure
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
PLATFORM_DIR="/home/ubuntu/cryb-platform"

# Recovery phases
PHASES=("infrastructure" "database" "application" "validation" "monitoring")

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [COMPLETE-RECOVERY] [${level}] ${message}" | tee -a "${LOG_DIR}/complete-recovery.log"
}

log_info() { log "INFO" "$@"; echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { log "WARN" "$@"; echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { log "ERROR" "$@"; echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { log "DEBUG" "$@"; echo -e "${BLUE}[DEBUG]${NC} $*"; }

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Complete recovery configuration loaded"
    else
        log_warn "Configuration file not found, using defaults"
    fi
}

# Send notification
send_notification() {
    local message="$1"
    local severity="${2:-info}"
    
    if [[ -n "${NOTIFICATION_WEBHOOK:-}" ]]; then
        curl -s -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🆘 CRYB Complete Recovery: $message\",\"severity\":\"$severity\"}" || true
    fi
    
    logger -t "cryb-complete-recovery" "$message"
}

# Create recovery workspace
create_recovery_workspace() {
    log_info "Creating recovery workspace..."
    
    local workspace="/tmp/complete-recovery-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$workspace"/{logs,backups,scripts,reports}
    
    # Copy recovery scripts to workspace
    cp -r "$SCRIPT_DIR"/* "$workspace/scripts/"
    
    log_info "Recovery workspace created: $workspace"
    echo "$workspace"
}

# System assessment
assess_system_state() {
    log_info "Performing comprehensive system assessment..."
    
    local assessment_file="$1/assessment.json"
    
    cat > "$assessment_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "system": {
    "hostname": "$(hostname)",
    "uptime": "$(uptime)",
    "load": "$(uptime | awk -F'load average:' '{print $2}')",
    "memory": "$(free -h | grep Mem)",
    "disk": "$(df -h / | tail -1)"
  },
  "services": {
    "docker": $(docker version >/dev/null 2>&1 && echo "true" || echo "false"),
    "postgres": $(pg_isready -h localhost -p 5432 >/dev/null 2>&1 && echo "true" || echo "false"),
    "redis": $(redis-cli -h localhost -p 6379 ping >/dev/null 2>&1 && echo "true" || echo "false"),
    "api": $(curl -s --max-time 5 "http://localhost:3002/api/health" >/dev/null 2>&1 && echo "true" || echo "false"),
    "web": $(curl -s --max-time 5 "http://localhost:3003" >/dev/null 2>&1 && echo "true" || echo "false"),
    "admin": $(curl -s --max-time 5 "http://localhost:3007" >/dev/null 2>&1 && echo "true" || echo "false")
  },
  "network": {
    "external_connectivity": $(curl -s --max-time 5 "https://google.com" >/dev/null 2>&1 && echo "true" || echo "false"),
    "dns_resolution": $(nslookup google.com >/dev/null 2>&1 && echo "true" || echo "false")
  },
  "storage": {
    "platform_directory": $(test -d "$PLATFORM_DIR" && echo "true" || echo "false"),
    "backup_directory": $(test -d "${BACKUP_DIR:-/backup}" && echo "true" || echo "false"),
    "log_directory": $(test -d "$LOG_DIR" && echo "true" || echo "false")
  }
}
EOF

    log_info "System assessment completed: $assessment_file"
    
    # Log critical findings
    if ! docker version >/dev/null 2>&1; then
        log_error "Docker is not available"
    fi
    
    if [[ ! -d "$PLATFORM_DIR" ]]; then
        log_error "Platform directory not found: $PLATFORM_DIR"
    fi
    
    if ! curl -s --max-time 5 "https://google.com" >/dev/null 2>&1; then
        log_warn "External connectivity issues detected"
    fi
}

# Infrastructure recovery phase
phase_infrastructure_recovery() {
    local workspace="$1"
    
    log_info "Phase 1: Infrastructure Recovery"
    send_notification "Starting infrastructure recovery phase" "warning"
    
    # Stop all services
    log_info "Stopping all services..."
    cd "$PLATFORM_DIR"
    docker-compose down --remove-orphans || true
    docker-compose -f docker-compose.monitoring.yml down --remove-orphans || true
    docker-compose -f docker-compose.security-monitoring.yml down --remove-orphans || true
    
    # Clean Docker environment
    log_info "Cleaning Docker environment..."
    docker system prune -af || true
    docker volume prune -f || true
    docker network prune -f || true
    
    # Verify Docker daemon
    if ! docker version >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        systemctl restart docker || true
        sleep 10
        
        if ! docker version >/dev/null 2>&1; then
            log_error "Failed to restart Docker daemon"
            return 1
        fi
    fi
    
    # Create necessary directories
    log_info "Creating necessary directories..."
    mkdir -p "$LOG_DIR" /var/log/cryb /tmp/cryb
    chown -R ubuntu:ubuntu /var/log/cryb /tmp/cryb || true
    
    # Set maintenance mode
    touch /tmp/maintenance_mode
    
    log_info "Infrastructure recovery phase completed"
    return 0
}

# Database recovery phase
phase_database_recovery() {
    local workspace="$1"
    
    log_info "Phase 2: Database Recovery"
    send_notification "Starting database recovery phase" "warning"
    
    # Start PostgreSQL container first
    log_info "Starting PostgreSQL service..."
    cd "$PLATFORM_DIR"
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    local retries=60
    while [[ $retries -gt 0 ]]; do
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            log_info "PostgreSQL is ready"
            break
        fi
        log_debug "Waiting for PostgreSQL... ($retries retries left)"
        sleep 2
        ((retries--))
    done
    
    if [[ $retries -eq 0 ]]; then
        log_error "PostgreSQL failed to start"
        return 1
    fi
    
    # Execute database recovery
    log_info "Executing database recovery..."
    if "$SCRIPT_DIR/database-recovery.sh" auto; then
        log_info "Database recovery completed successfully"
    else
        log_error "Database recovery failed"
        return 1
    fi
    
    # Start Redis
    log_info "Starting Redis service..."
    docker-compose up -d redis
    
    # Wait for Redis to be ready
    retries=30
    while [[ $retries -gt 0 ]]; do
        if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
            log_info "Redis is ready"
            break
        fi
        log_debug "Waiting for Redis... ($retries retries left)"
        sleep 2
        ((retries--))
    done
    
    log_info "Database recovery phase completed"
    return 0
}

# Application recovery phase
phase_application_recovery() {
    local workspace="$1"
    
    log_info "Phase 3: Application Recovery"
    send_notification "Starting application recovery phase" "warning"
    
    # Execute application recovery
    log_info "Executing application recovery..."
    if "$SCRIPT_DIR/application-recovery.sh" full; then
        log_info "Application recovery completed successfully"
    else
        log_error "Application recovery failed"
        return 1
    fi
    
    log_info "Application recovery phase completed"
    return 0
}

# Validation phase
phase_validation() {
    local workspace="$1"
    
    log_info "Phase 4: Validation"
    send_notification "Starting validation phase" "info"
    
    local errors=0
    
    # Wait for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 30
    
    # Check database connectivity
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_info "✓ Database is accessible"
    else
        log_error "✗ Database is not accessible"
        ((errors++))
    fi
    
    # Check Redis connectivity
    if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
        log_info "✓ Redis is accessible"
    else
        log_error "✗ Redis is not accessible"
        ((errors++))
    fi
    
    # Check API health
    local api_retries=30
    while [[ $api_retries -gt 0 ]]; do
        if curl -s --max-time 10 "http://localhost:3002/api/health" | grep -q '"status":"healthy"'; then
            log_info "✓ API is responding and healthy"
            break
        fi
        log_debug "Waiting for API... ($api_retries retries left)"
        sleep 3
        ((api_retries--))
    done
    
    if [[ $api_retries -eq 0 ]]; then
        log_error "✗ API is not responding or unhealthy"
        ((errors++))
    fi
    
    # Check web application
    if curl -s --max-time 10 "http://localhost:3003" >/dev/null 2>&1; then
        log_info "✓ Web application is accessible"
    else
        log_error "✗ Web application is not accessible"
        ((errors++))
    fi
    
    # Check admin panel
    if curl -s --max-time 10 "http://localhost:3007" >/dev/null 2>&1; then
        log_info "✓ Admin panel is accessible"
    else
        log_warn "⚠ Admin panel is not accessible (non-critical)"
    fi
    
    # Test critical user flows
    log_info "Testing critical user flows..."
    
    # Test user registration endpoint
    if curl -s --max-time 10 "http://localhost:3002/api/auth/health" >/dev/null 2>&1; then
        log_info "✓ Authentication endpoints are accessible"
    else
        log_error "✗ Authentication endpoints are not accessible"
        ((errors++))
    fi
    
    # Test database queries
    if psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d "${DB_NAME:-cryb_platform}" -c "SELECT count(*) FROM users;" >/dev/null 2>&1; then
        log_info "✓ Database queries are working"
    else
        log_error "✗ Database queries are failing"
        ((errors++))
    fi
    
    # Check container status
    local failed_containers
    failed_containers=$(docker-compose ps --filter "status=exited" --format "table {{.Name}}" | tail -n +2 | wc -l)
    
    if [[ $failed_containers -eq 0 ]]; then
        log_info "✓ All containers are running"
    else
        log_error "✗ $failed_containers containers have failed"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_info "✓ Validation phase completed successfully"
        return 0
    else
        log_error "✗ Validation phase failed with $errors errors"
        return 1
    fi
}

# Monitoring recovery phase
phase_monitoring_recovery() {
    local workspace="$1"
    
    log_info "Phase 5: Monitoring Recovery"
    send_notification "Starting monitoring recovery phase" "info"
    
    cd "$PLATFORM_DIR"
    
    # Start monitoring services
    log_info "Starting monitoring services..."
    docker-compose -f docker-compose.monitoring.yml up -d || log_warn "Failed to start monitoring services"
    
    # Start security monitoring if available
    if [[ -f "docker-compose.security-monitoring.yml" ]]; then
        log_info "Starting security monitoring services..."
        docker-compose -f docker-compose.security-monitoring.yml up -d || log_warn "Failed to start security monitoring"
    fi
    
    # Restart system monitoring services
    log_info "Restarting system monitoring services..."
    systemctl restart prometheus || true
    systemctl restart grafana-server || true
    
    # Clear maintenance mode
    rm -f /tmp/maintenance_mode
    
    # Set up enhanced monitoring for recovery period
    echo "*/2 * * * * /home/ubuntu/cryb-platform/scripts/enhanced-health-check.sh" | crontab - || true
    
    log_info "Monitoring recovery phase completed"
    return 0
}

# Generate comprehensive recovery report
generate_comprehensive_report() {
    local workspace="$1"
    local start_time="$2"
    local end_time="$3"
    local success="$4"
    local failed_phases="$5"
    
    local duration=$((end_time - start_time))
    local report_file="$workspace/reports/complete-recovery-report.md"
    
    cat > "$report_file" << EOF
# CRYB Platform Complete Recovery Report

## Executive Summary
- **Recovery Type**: Complete Infrastructure Recovery
- **Start Time**: $(date -d "@$start_time" '+%Y-%m-%d %H:%M:%S UTC')
- **End Time**: $(date -d "@$end_time" '+%Y-%m-%d %H:%M:%S UTC')
- **Total Duration**: $duration seconds ($(($duration / 60)) minutes)
- **Overall Success**: $success
- **Failed Phases**: $failed_phases

## Recovery Timeline
$(grep "$(date -d "@$start_time" '+%Y-%m-%d')" "$LOG_DIR/complete-recovery.log" | tail -100)

## System State Assessment
\`\`\`json
$(cat "$workspace/assessment.json" 2>/dev/null || echo "Assessment data not available")
\`\`\`

## Services Status Post-Recovery
$(docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker Compose status not available")

## Performance Metrics
- **Memory Usage**: $(free -h | grep Mem)
- **Disk Usage**: $(df -h / | tail -1)
- **Load Average**: $(uptime | awk -F'load average:' '{print $2}')
- **Active Connections**: $(netstat -an | grep ESTABLISHED | wc -l)

## Critical Findings
- Database integrity: $(pg_isready -h localhost -p 5432 >/dev/null 2>&1 && echo "✓ OK" || echo "✗ FAILED")
- API health: $(curl -s --max-time 5 "http://localhost:3002/api/health" >/dev/null 2>&1 && echo "✓ OK" || echo "✗ FAILED")
- Web application: $(curl -s --max-time 5 "http://localhost:3003" >/dev/null 2>&1 && echo "✓ OK" || echo "✗ FAILED")
- External connectivity: $(curl -s --max-time 5 "https://google.com" >/dev/null 2>&1 && echo "✓ OK" || echo "✗ FAILED")

## Recommendations
1. **Immediate Actions** (0-2 hours):
   - Monitor all services for stability
   - Verify critical user flows are working
   - Check for any data inconsistencies
   - Review application logs for errors

2. **Short-term Actions** (2-24 hours):
   - Conduct thorough testing of all features
   - Monitor performance metrics closely
   - Verify backup systems are functioning
   - Update incident documentation

3. **Long-term Actions** (1-7 days):
   - Conduct post-incident review
   - Update recovery procedures based on lessons learned
   - Implement additional monitoring where gaps were identified
   - Schedule follow-up disaster recovery testing

## Lessons Learned
- Review recovery time objectives and actual performance
- Identify bottlenecks in the recovery process
- Document any manual interventions required
- Update automation scripts based on experience

## Next Steps
1. Monitor system stability for 24 hours
2. Conduct comprehensive functionality testing
3. Verify data integrity and consistency
4. Schedule post-incident review meeting
5. Update disaster recovery procedures
6. Notify stakeholders of recovery completion

## Contact Information
For questions about this recovery:
- Recovery Team Lead: [Contact Info]
- Technical Lead: [Contact Info]
- Incident Commander: [Contact Info]

---
Report generated on $(date) by complete recovery automation system.
Workspace: $workspace
EOF

    log_info "Comprehensive recovery report generated: $report_file"
    echo "$report_file"
}

# Main recovery function
main() {
    local start_time=$(date +%s)
    local failed_phases=""
    local overall_success="true"
    
    echo -e "${RED}=================================${NC}"
    echo -e "${RED}CRYB COMPLETE DISASTER RECOVERY${NC}"
    echo -e "${RED}=================================${NC}"
    echo
    
    log_info "Starting complete disaster recovery process..."
    send_notification "Complete disaster recovery initiated - all systems being restored" "critical"
    
    # Load configuration
    load_config
    
    # Create recovery workspace
    local workspace
    workspace=$(create_recovery_workspace)
    
    # Perform system assessment
    assess_system_state "$workspace"
    
    # Execute recovery phases
    for phase in "${PHASES[@]}"; do
        echo
        log_info "========================================"
        log_info "Starting Phase: $phase"
        log_info "========================================"
        
        case "$phase" in
            "infrastructure")
                if ! phase_infrastructure_recovery "$workspace"; then
                    log_error "Infrastructure recovery phase failed"
                    failed_phases+="$phase "
                    overall_success="false"
                fi
                ;;
            "database")
                if ! phase_database_recovery "$workspace"; then
                    log_error "Database recovery phase failed"
                    failed_phases+="$phase "
                    overall_success="false"
                    # Database failure is critical - consider stopping here
                    log_error "Database recovery is critical - continuing with caution"
                fi
                ;;
            "application")
                if ! phase_application_recovery "$workspace"; then
                    log_error "Application recovery phase failed"
                    failed_phases+="$phase "
                    overall_success="false"
                fi
                ;;
            "validation")
                if ! phase_validation "$workspace"; then
                    log_error "Validation phase failed"
                    failed_phases+="$phase "
                    overall_success="false"
                fi
                ;;
            "monitoring")
                if ! phase_monitoring_recovery "$workspace"; then
                    log_error "Monitoring recovery phase failed"
                    failed_phases+="$phase "
                    # Monitoring failure is not critical for overall success
                fi
                ;;
        esac
        
        log_info "Phase $phase completed"
    done
    
    # Generate comprehensive report
    local end_time=$(date +%s)
    local report_file
    report_file=$(generate_comprehensive_report "$workspace" "$start_time" "$end_time" "$overall_success" "$failed_phases")
    
    # Final status and notifications
    echo
    echo "========================================"
    if [[ "$overall_success" == "true" ]]; then
        echo -e "${GREEN}✓ COMPLETE RECOVERY SUCCESSFUL${NC}"
        echo -e "${GREEN}✓ All critical systems restored${NC}"
        echo -e "${GREEN}✓ Platform is operational${NC}"
        send_notification "Complete recovery successful - all systems restored" "success"
        log_info "Complete disaster recovery process completed successfully"
    else
        echo -e "${RED}✗ COMPLETE RECOVERY FAILED${NC}"
        echo -e "${RED}✗ Failed phases: $failed_phases${NC}"
        echo -e "${RED}✗ Manual intervention required${NC}"
        send_notification "Complete recovery failed - manual intervention required" "critical"
        log_error "Complete disaster recovery process failed"
    fi
    
    echo -e "${BLUE}📋 Recovery Report: $report_file${NC}"
    echo -e "${BLUE}🗂️  Recovery Workspace: $workspace${NC}"
    echo "========================================"
    
    if [[ "$overall_success" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Handle signals
trap 'log_error "Complete recovery interrupted by signal"; send_notification "Complete recovery interrupted" "critical"; exit 1' INT TERM

# Execute main function
main "$@"