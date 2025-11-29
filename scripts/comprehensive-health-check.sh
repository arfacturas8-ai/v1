#!/bin/bash

# Comprehensive Health Check System for Cryb Platform
# This script monitors all critical services and generates detailed health reports

set -euo pipefail

# Configuration
LOG_DIR="/home/ubuntu/cryb-platform/logs/health-checks"
METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
HEALTH_LOG="$LOG_DIR/health-check.log"
ALERT_LOG="$LOG_DIR/alerts.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create directories
mkdir -p "$LOG_DIR" "$METRICS_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check results
HEALTH_STATUS="healthy"
CRITICAL_ISSUES=()
WARNING_ISSUES=()
SERVICES_STATUS=()

log() {
    echo -e "[$TIMESTAMP] $1" | tee -a "$HEALTH_LOG"
}

log_metric() {
    echo "$(date '+%Y-%m-%dT%H:%M:%S'),$1" >> "$METRICS_DIR/health-metrics-$(date +%Y-%m-%d).csv"
}

check_service_status() {
    local service_name="$1"
    local check_command="$2"
    local timeout="${3:-10}"
    
    log "${BLUE}Checking $service_name...${NC}"
    
    if timeout "$timeout" bash -c "$check_command" &>/dev/null; then
        log "${GREEN}✓ $service_name is healthy${NC}"
        SERVICES_STATUS+=("$service_name:healthy")
        log_metric "$service_name,healthy,1"
        return 0
    else
        log "${RED}✗ $service_name is unhealthy${NC}"
        SERVICES_STATUS+=("$service_name:unhealthy")
        CRITICAL_ISSUES+=("$service_name is down or unresponsive")
        log_metric "$service_name,unhealthy,0"
        HEALTH_STATUS="critical"
        return 1
    fi
}

check_pm2_processes() {
    log "${BLUE}Checking PM2 processes...${NC}"
    
    local pm2_status
    pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
    
    if [[ "$pm2_status" == "[]" ]]; then
        CRITICAL_ISSUES+=("No PM2 processes running")
        HEALTH_STATUS="critical"
        return 1
    fi
    
    local total_processes=0
    local running_processes=0
    local restart_count=0
    
    # Parse PM2 status
    while IFS= read -r line; do
        if [[ "$line" =~ \"name\":\"([^\"]+)\" ]]; then
            local process_name="${BASH_REMATCH[1]}"
            total_processes=$((total_processes + 1))
            
            if [[ "$line" =~ \"status\":\"online\" ]]; then
                running_processes=$((running_processes + 1))
                log "${GREEN}✓ $process_name is online${NC}"
            else
                log "${RED}✗ $process_name is offline${NC}"
                CRITICAL_ISSUES+=("$process_name process is offline")
                HEALTH_STATUS="critical"
            fi
            
            # Check restart count
            if [[ "$line" =~ \"restart_time\":([0-9]+) ]]; then
                local restarts="${BASH_REMATCH[1]}"
                restart_count=$((restart_count + restarts))
                if [[ "$restarts" -gt 10 ]]; then
                    WARNING_ISSUES+=("$process_name has restarted $restarts times")
                fi
            fi
        fi
    done <<< "$pm2_status"
    
    log_metric "pm2_total_processes,$total_processes"
    log_metric "pm2_running_processes,$running_processes"
    log_metric "pm2_total_restarts,$restart_count"
    
    if [[ "$running_processes" -eq "$total_processes" ]]; then
        log "${GREEN}✓ All PM2 processes are running ($running_processes/$total_processes)${NC}"
        return 0
    else
        log "${RED}✗ Some PM2 processes are down ($running_processes/$total_processes)${NC}"
        return 1
    fi
}

check_memory_usage() {
    log "${BLUE}Checking memory usage...${NC}"
    
    local memory_info
    memory_info=$(free -m | grep '^Mem:')
    
    local total_mem=$(echo "$memory_info" | awk '{print $2}')
    local used_mem=$(echo "$memory_info" | awk '{print $3}')
    local available_mem=$(echo "$memory_info" | awk '{print $7}')
    
    local memory_usage_percent=$((used_mem * 100 / total_mem))
    local available_percent=$((available_mem * 100 / total_mem))
    
    log_metric "memory_total,$total_mem"
    log_metric "memory_used,$used_mem"
    log_metric "memory_available,$available_mem"
    log_metric "memory_usage_percent,$memory_usage_percent"
    
    if [[ "$memory_usage_percent" -gt 90 ]]; then
        CRITICAL_ISSUES+=("Memory usage is critically high: ${memory_usage_percent}%")
        HEALTH_STATUS="critical"
        log "${RED}✗ Memory usage is critically high: ${memory_usage_percent}%${NC}"
        return 1
    elif [[ "$memory_usage_percent" -gt 80 ]]; then
        WARNING_ISSUES+=("Memory usage is high: ${memory_usage_percent}%")
        log "${YELLOW}⚠ Memory usage is high: ${memory_usage_percent}%${NC}"
        return 0
    else
        log "${GREEN}✓ Memory usage is normal: ${memory_usage_percent}%${NC}"
        return 0
    fi
}

check_disk_usage() {
    log "${BLUE}Checking disk usage...${NC}"
    
    local disk_usage
    disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    log_metric "disk_usage_percent,$disk_usage"
    
    if [[ "$disk_usage" -gt 90 ]]; then
        CRITICAL_ISSUES+=("Disk usage is critically high: ${disk_usage}%")
        HEALTH_STATUS="critical"
        log "${RED}✗ Disk usage is critically high: ${disk_usage}%${NC}"
        return 1
    elif [[ "$disk_usage" -gt 80 ]]; then
        WARNING_ISSUES+=("Disk usage is high: ${disk_usage}%")
        log "${YELLOW}⚠ Disk usage is high: ${disk_usage}%${NC}"
        return 0
    else
        log "${GREEN}✓ Disk usage is normal: ${disk_usage}%${NC}"
        return 0
    fi
}

check_cpu_load() {
    log "${BLUE}Checking CPU load...${NC}"
    
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores
    cpu_cores=$(nproc)
    
    # Convert to percentage (load_avg / cpu_cores * 100)
    local cpu_load_percent
    cpu_load_percent=$(echo "$load_avg $cpu_cores" | awk '{printf "%.0f", ($1/$2)*100}')
    
    log_metric "cpu_load_1min,$load_avg"
    log_metric "cpu_cores,$cpu_cores"
    log_metric "cpu_load_percent,$cpu_load_percent"
    
    if [[ "$cpu_load_percent" -gt 90 ]]; then
        CRITICAL_ISSUES+=("CPU load is critically high: ${cpu_load_percent}%")
        HEALTH_STATUS="critical"
        log "${RED}✗ CPU load is critically high: ${cpu_load_percent}%${NC}"
        return 1
    elif [[ "$cpu_load_percent" -gt 70 ]]; then
        WARNING_ISSUES+=("CPU load is high: ${cpu_load_percent}%")
        log "${YELLOW}⚠ CPU load is high: ${cpu_load_percent}%${NC}"
        return 0
    else
        log "${GREEN}✓ CPU load is normal: ${cpu_load_percent}%${NC}"
        return 0
    fi
}

check_nginx_status() {
    log "${BLUE}Checking nginx status...${NC}"
    
    if systemctl is-active --quiet nginx; then
        log "${GREEN}✓ Nginx service is active${NC}"
        
        # Check nginx configuration
        if nginx -t &>/dev/null; then
            log "${GREEN}✓ Nginx configuration is valid${NC}"
            return 0
        else
            WARNING_ISSUES+=("Nginx configuration has errors")
            log "${YELLOW}⚠ Nginx configuration has errors${NC}"
            return 0
        fi
    else
        CRITICAL_ISSUES+=("Nginx service is not running")
        HEALTH_STATUS="critical"
        log "${RED}✗ Nginx service is not running${NC}"
        return 1
    fi
}

check_ssl_certificates() {
    log "${BLUE}Checking SSL certificates...${NC}"
    
    local domains=("api.cryb.ai" "platform.cryb.ai")
    local cert_issues=()
    
    for domain in "${domains[@]}"; do
        local cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
        
        if [[ -f "$cert_file" ]]; then
            # Check certificate expiration
            local expiry_date
            expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
            local expiry_timestamp
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            local current_timestamp
            current_timestamp=$(date +%s)
            local days_until_expiry
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            log_metric "ssl_cert_days_until_expiry_$domain,$days_until_expiry"
            
            if [[ "$days_until_expiry" -lt 7 ]]; then
                CRITICAL_ISSUES+=("SSL certificate for $domain expires in $days_until_expiry days")
                HEALTH_STATUS="critical"
                log "${RED}✗ SSL certificate for $domain expires in $days_until_expiry days${NC}"
            elif [[ "$days_until_expiry" -lt 30 ]]; then
                WARNING_ISSUES+=("SSL certificate for $domain expires in $days_until_expiry days")
                log "${YELLOW}⚠ SSL certificate for $domain expires in $days_until_expiry days${NC}"
            else
                log "${GREEN}✓ SSL certificate for $domain is valid ($days_until_expiry days until expiry)${NC}"
            fi
        else
            cert_issues+=("SSL certificate file not found for $domain")
            log "${RED}✗ SSL certificate file not found for $domain${NC}"
        fi
    done
    
    if [[ ${#cert_issues[@]} -gt 0 ]]; then
        CRITICAL_ISSUES+=("${cert_issues[@]}")
        HEALTH_STATUS="critical"
        return 1
    else
        return 0
    fi
}

generate_health_report() {
    local report_file="$METRICS_DIR/health-report-$(date +%Y-%m-%d_%H-%M-%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "overall_status": "$HEALTH_STATUS",
    "services": [
$(IFS=$'\n'; echo "${SERVICES_STATUS[*]}" | sed 's/\(.*\):\(.*\)/        {"name": "\1", "status": "\2"},/' | sed '$s/,$//')
    ],
    "critical_issues": [
$(IFS=$'\n'; printf '        "%s",\n' "${CRITICAL_ISSUES[@]}" | sed '$s/,$//')
    ],
    "warning_issues": [
$(IFS=$'\n'; printf '        "%s",\n' "${WARNING_ISSUES[@]}" | sed '$s/,$//')
    ]
}
EOF
    
    log "${BLUE}Health report generated: $report_file${NC}"
}

send_alerts() {
    if [[ ${#CRITICAL_ISSUES[@]} -gt 0 ]]; then
        local alert_message="CRITICAL: Cryb Platform Health Issues Detected\n\n"
        alert_message+="Timestamp: $TIMESTAMP\n"
        alert_message+="Critical Issues:\n"
        
        for issue in "${CRITICAL_ISSUES[@]}"; do
            alert_message+="- $issue\n"
        done
        
        if [[ ${#WARNING_ISSUES[@]} -gt 0 ]]; then
            alert_message+="\\nWarning Issues:\n"
            for issue in "${WARNING_ISSUES[@]}"; do
                alert_message+="- $issue\n"
            done
        fi
        
        echo -e "$alert_message" | tee -a "$ALERT_LOG"
        
        # TODO: Integrate with alerting system (email, Slack, etc.)
        log "${RED}CRITICAL ALERTS GENERATED${NC}"
    fi
}

main() {
    log "${BLUE}Starting comprehensive health check...${NC}"
    
    # Initialize CSV headers if file doesn't exist
    local metrics_file="$METRICS_DIR/health-metrics-$(date +%Y-%m-%d).csv"
    if [[ ! -f "$metrics_file" ]]; then
        echo "timestamp,metric,value" > "$metrics_file"
    fi
    
    # Run all health checks
    check_pm2_processes
    check_service_status "API Server" "curl -f -s http://localhost:3002/health" 10
    check_service_status "Web Frontend" "curl -f -s http://localhost:3000" 10
    check_service_status "PostgreSQL" "pg_isready -h localhost -p 5433 -U cryb_user" 5
    check_service_status "Redis" "redis-cli -p 6380 ping" 5
    check_service_status "Elasticsearch" "curl -f -s http://localhost:9200/_health" 10
    check_service_status "MinIO" "curl -f -s http://localhost:9000/minio/health/live" 10
    check_nginx_status
    check_ssl_certificates
    check_memory_usage
    check_disk_usage
    check_cpu_load
    
    # Generate reports and alerts
    generate_health_report
    send_alerts
    
    # Final status
    case "$HEALTH_STATUS" in
        "healthy")
            log "${GREEN}✓ Overall system health: HEALTHY${NC}"
            exit 0
            ;;
        "degraded")
            log "${YELLOW}⚠ Overall system health: DEGRADED${NC}"
            exit 0
            ;;
        "critical")
            log "${RED}✗ Overall system health: CRITICAL${NC}"
            exit 1
            ;;
    esac
}

main "$@"