#!/bin/bash

# Auto-Recovery System for Cryb Platform
# Monitors services and automatically recovers from failures

set -euo pipefail

# Configuration
RECOVERY_LOG="/home/ubuntu/cryb-platform/logs/recovery.log"
METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
PID_FILE="/var/run/cryb-recovery.pid"

# Recovery thresholds
MAX_RESTART_ATTEMPTS=3
RESTART_BACKOFF_BASE=5
HEALTH_CHECK_INTERVAL=30
RECOVERY_WINDOW=300  # 5 minutes

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure single instance
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Recovery system is already running (PID: $(cat "$PID_FILE"))"
    exit 1
fi
echo $$ > "$PID_FILE"

# Cleanup on exit
cleanup() {
    rm -f "$PID_FILE"
    exit 0
}
trap cleanup EXIT INT TERM

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$RECOVERY_LOG"
}

log_metric() {
    local metric_file="$METRICS_DIR/recovery-metrics-$(date +%Y-%m-%d).jsonl"
    echo "{\"timestamp\":\"$(date -Iseconds)\",\"metric\":\"$1\",\"value\":$2}" >> "$metric_file"
}

# Service recovery functions
recover_pm2_process() {
    local process_name="$1"
    local attempt="$2"
    
    log "${YELLOW}Attempting to recover PM2 process: $process_name (attempt $attempt)${NC}"
    
    # Stop the problematic process
    pm2 stop "$process_name" 2>/dev/null || true
    sleep 2
    
    # Start the process
    if pm2 start ecosystem.production.config.js --only "$process_name" --env production; then
        log "${GREEN}✓ Successfully restarted $process_name${NC}"
        log_metric "pm2_restart_success" 1
        return 0
    else
        log "${RED}✗ Failed to restart $process_name${NC}"
        log_metric "pm2_restart_failure" 1
        return 1
    fi
}

recover_nginx() {
    local attempt="$1"
    
    log "${YELLOW}Attempting to recover Nginx (attempt $attempt)${NC}"
    
    # Test configuration first
    if ! nginx -t; then
        log "${RED}✗ Nginx configuration is invalid, cannot restart${NC}"
        return 1
    fi
    
    # Reload nginx
    if systemctl reload nginx; then
        log "${GREEN}✓ Successfully reloaded Nginx${NC}"
        log_metric "nginx_reload_success" 1
        return 0
    elif systemctl restart nginx; then
        log "${GREEN}✓ Successfully restarted Nginx${NC}"
        log_metric "nginx_restart_success" 1
        return 0
    else
        log "${RED}✗ Failed to recover Nginx${NC}"
        log_metric "nginx_restart_failure" 1
        return 1
    fi
}

recover_database() {
    local attempt="$1"
    
    log "${YELLOW}Attempting to recover PostgreSQL (attempt $attempt)${NC}"
    
    if systemctl restart postgresql; then
        # Wait for service to be ready
        sleep 10
        if pg_isready -h localhost -p 5433 -U cryb_user; then
            log "${GREEN}✓ Successfully recovered PostgreSQL${NC}"
            log_metric "postgres_restart_success" 1
            return 0
        fi
    fi
    
    log "${RED}✗ Failed to recover PostgreSQL${NC}"
    log_metric "postgres_restart_failure" 1
    return 1
}

recover_redis() {
    local attempt="$1"
    
    log "${YELLOW}Attempting to recover Redis (attempt $attempt)${NC}"
    
    if systemctl restart redis-server; then
        sleep 5
        if redis-cli -p 6380 ping &>/dev/null; then
            log "${GREEN}✓ Successfully recovered Redis${NC}"
            log_metric "redis_restart_success" 1
            return 0
        fi
    fi
    
    log "${RED}✗ Failed to recover Redis${NC}"
    log_metric "redis_restart_failure" 1
    return 1
}

recover_elasticsearch() {
    local attempt="$1"
    
    log "${YELLOW}Attempting to recover Elasticsearch (attempt $attempt)${NC}"
    
    if systemctl restart elasticsearch; then
        # Wait longer for elasticsearch to start
        sleep 30
        local retries=0
        while [[ $retries -lt 6 ]]; do
            if curl -f -s http://localhost:9200/_health &>/dev/null; then
                log "${GREEN}✓ Successfully recovered Elasticsearch${NC}"
                log_metric "elasticsearch_restart_success" 1
                return 0
            fi
            sleep 10
            ((retries++))
        done
    fi
    
    log "${RED}✗ Failed to recover Elasticsearch${NC}"
    log_metric "elasticsearch_restart_failure" 1
    return 1
}

recover_minio() {
    local attempt="$1"
    
    log "${YELLOW}Attempting to recover MinIO (attempt $attempt)${NC}"
    
    if systemctl restart minio; then
        sleep 10
        if curl -f -s http://localhost:9000/minio/health/live &>/dev/null; then
            log "${GREEN}✓ Successfully recovered MinIO${NC}"
            log_metric "minio_restart_success" 1
            return 0
        fi
    fi
    
    log "${RED}✗ Failed to recover MinIO${NC}"
    log_metric "minio_restart_failure" 1
    return 1
}

# Intelligent recovery with exponential backoff
intelligent_recovery() {
    local service="$1"
    local recovery_function="$2"
    
    local recovery_key="${service}_recovery_$(date +%Y%m%d_%H)"
    local recovery_file="/tmp/${recovery_key}"
    
    # Get current attempt count
    local attempts=0
    if [[ -f "$recovery_file" ]]; then
        attempts=$(cat "$recovery_file")
    fi
    
    if [[ $attempts -ge $MAX_RESTART_ATTEMPTS ]]; then
        log "${RED}✗ Maximum restart attempts reached for $service. Manual intervention required.${NC}"
        log_metric "${service}_max_attempts_reached" 1
        return 1
    fi
    
    ((attempts++))
    echo "$attempts" > "$recovery_file"
    
    # Calculate backoff delay
    local backoff_delay=$((RESTART_BACKOFF_BASE * (2 ** (attempts - 1))))
    log "${BLUE}Waiting ${backoff_delay}s before recovery attempt $attempts for $service${NC}"
    sleep "$backoff_delay"
    
    if $recovery_function "$attempts"; then
        # Clear recovery attempts on success
        rm -f "$recovery_file"
        log_metric "${service}_recovery_success" 1
        return 0
    else
        log_metric "${service}_recovery_failure" 1
        return 1
    fi
}

check_pm2_health() {
    local pm2_status
    pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
    
    if [[ "$pm2_status" == "[]" ]]; then
        log "${RED}No PM2 processes found${NC}"
        return 1
    fi
    
    local failed_processes=()
    
    # Parse PM2 status and identify failed processes
    while IFS= read -r line; do
        if [[ "$line" =~ \"name\":\"([^\"]+)\" ]]; then
            local process_name="${BASH_REMATCH[1]}"
            
            if [[ "$line" =~ \"status\":\"stopped\|errored\|failed\" ]] || [[ ! "$line" =~ \"status\":\"online\" ]]; then
                failed_processes+=("$process_name")
            fi
        fi
    done <<< "$pm2_status"
    
    # Attempt recovery for failed processes
    for process in "${failed_processes[@]}"; do
        log "${RED}Detected failed PM2 process: $process${NC}"
        intelligent_recovery "$process" "recover_pm2_process"
    done
    
    return 0
}

check_service_health() {
    local service="$1"
    local check_command="$2"
    local recovery_function="$3"
    
    if ! timeout 10 bash -c "$check_command" &>/dev/null; then
        log "${RED}Service $service is unhealthy${NC}"
        intelligent_recovery "$service" "$recovery_function"
    fi
}

cleanup_old_recovery_files() {
    # Clean up recovery files older than recovery window
    find /tmp -name "*_recovery_*" -mmin +$((RECOVERY_WINDOW / 60)) -delete 2>/dev/null || true
}

# Main monitoring loop
main_loop() {
    log "${GREEN}Starting auto-recovery system...${NC}"
    
    while true; do
        log "${BLUE}Running health checks...${NC}"
        
        # Check PM2 processes
        check_pm2_health
        
        # Check system services
        check_service_health "nginx" "systemctl is-active --quiet nginx && nginx -t" "recover_nginx"
        check_service_health "postgresql" "pg_isready -h localhost -p 5433 -U cryb_user" "recover_database"
        check_service_health "redis" "redis-cli -p 6380 ping" "recover_redis"
        check_service_health "elasticsearch" "curl -f -s http://localhost:9200/_health" "recover_elasticsearch"
        check_service_health "minio" "curl -f -s http://localhost:9000/minio/health/live" "recover_minio"
        
        # Check application endpoints
        check_service_health "api" "curl -f -s http://localhost:3002/health" "recover_pm2_process cryb-api"
        check_service_health "web" "curl -f -s http://localhost:3000" "recover_pm2_process cryb-web"
        
        # Cleanup old recovery files
        cleanup_old_recovery_files
        
        # Wait before next check
        sleep "$HEALTH_CHECK_INTERVAL"
    done
}

# Handle daemon mode
if [[ "${1:-}" == "--daemon" ]]; then
    # Run as daemon
    nohup "$0" > "$RECOVERY_LOG" 2>&1 &
    echo "Auto-recovery system started as daemon (PID: $!)"
    exit 0
elif [[ "${1:-}" == "--status" ]]; then
    # Show status
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Auto-recovery system is running (PID: $(cat "$PID_FILE"))"
        echo "Log file: $RECOVERY_LOG"
        echo "Last 10 log entries:"
        tail -10 "$RECOVERY_LOG" 2>/dev/null || echo "No log entries found"
    else
        echo "Auto-recovery system is not running"
    fi
    exit 0
elif [[ "${1:-}" == "--stop" ]]; then
    # Stop daemon
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        kill "$(cat "$PID_FILE")"
        echo "Auto-recovery system stopped"
    else
        echo "Auto-recovery system is not running"
    fi
    exit 0
else
    # Run in foreground
    main_loop
fi