#!/bin/bash

# ===================================================
# CRYB PLATFORM - PM2 MONITORING & ALERTING
# ===================================================
# Advanced monitoring script for PM2 services
# Provides health checks, alerting, and auto-recovery
# ===================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/ecosystem.config.js"
LOG_DIR="$PROJECT_ROOT/logs/monitoring"
ALERT_LOG="$LOG_DIR/alerts.log"
HEALTH_LOG="$LOG_DIR/health-checks.log"
METRICS_LOG="$LOG_DIR/metrics.log"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
RESTART_THRESHOLD=5
RESPONSE_TIME_THRESHOLD=5000

# Services to monitor
SERVICES=("cryb-api" "cryb-web" "cryb-workers")

# Health check URLs
declare -A HEALTH_URLS=(
    ["cryb-api"]="http://localhost:3001/health"
    ["cryb-web"]="http://localhost:3000"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create log directories
mkdir -p "$LOG_DIR"

# Logging functions
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" >> "$HEALTH_LOG"
    echo -e "${BLUE}[$timestamp]${NC} $message"
}

alert() {
    local message="$1"
    local level="${2:-WARNING}"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$ALERT_LOG"
    echo -e "${RED}[$timestamp] [$level]${NC} $message"
    
    # Send notification if configured
    send_notification "$level" "$message"
}

success() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [SUCCESS] $message" >> "$HEALTH_LOG"
    echo -e "${GREEN}[$timestamp] [SUCCESS]${NC} $message"
}

# Function to send notifications
send_notification() {
    local level="$1"
    local message="$2"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    
    # Slack webhook (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="warning"
        [[ "$level" == "CRITICAL" ]] && color="danger"
        [[ "$level" == "SUCCESS" ]] && color="good"
        
        local payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "CRYB Platform Alert",
            "text": "$message",
            "fields": [
                {
                    "title": "Level",
                    "value": "$level",
                    "short": true
                },
                {
                    "title": "Time",
                    "value": "$timestamp",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" > /dev/null || true
    fi
    
    # Discord webhook (if configured)
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
        local color=16776960  # Yellow
        [[ "$level" == "CRITICAL" ]] && color=16711680  # Red
        [[ "$level" == "SUCCESS" ]] && color=65280      # Green
        
        local payload=$(cat <<EOF
{
    "embeds": [
        {
            "title": "CRYB Platform Alert",
            "description": "$message",
            "color": $color,
            "fields": [
                {
                    "name": "Level",
                    "value": "$level",
                    "inline": true
                },
                {
                    "name": "Time",
                    "value": "$timestamp",
                    "inline": true
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$DISCORD_WEBHOOK_URL" > /dev/null || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${ALERT_EMAIL:-}" ]] && command -v mail >/dev/null 2>&1; then
        echo "CRYB Platform Alert: $message" | mail -s "[$level] CRYB Platform Alert" "$ALERT_EMAIL"
    fi
}

# Function to check if PM2 daemon is running
check_pm2_daemon() {
    if ! pgrep -f "PM2 v" > /dev/null; then
        alert "PM2 daemon is not running. Attempting to start..." "CRITICAL"
        pm2 resurrect
        sleep 5
        
        if pgrep -f "PM2 v" > /dev/null; then
            success "PM2 daemon started successfully"
        else
            alert "Failed to start PM2 daemon" "CRITICAL"
            return 1
        fi
    fi
    return 0
}

# Function to check service status
check_service_status() {
    local service="$1"
    
    if ! pm2 describe "$service" >/dev/null 2>&1; then
        alert "Service $service is not running. Starting..." "CRITICAL"
        pm2 start "$ECOSYSTEM_CONFIG" --only "$service" --env production
        pm2 save
        
        # Wait and verify
        sleep 10
        if pm2 describe "$service" >/dev/null 2>&1; then
            success "Service $service started successfully"
        else
            alert "Failed to start service $service" "CRITICAL"
            return 1
        fi
    fi
    
    # Check if service is in error state
    local status=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name == \"$service\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    
    if [[ "$status" == "errored" ]] || [[ "$status" == "stopped" ]]; then
        alert "Service $service is in $status state. Restarting..." "CRITICAL"
        pm2 restart "$service"
        pm2 save
        success "Service $service restarted"
    fi
    
    return 0
}

# Function to check service metrics
check_service_metrics() {
    local service="$1"
    
    # Get service metrics
    local metrics=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name == \"$service\")" 2>/dev/null || echo "{}")
    
    if [[ "$metrics" == "{}" ]]; then
        return 1
    fi
    
    local cpu=$(echo "$metrics" | jq -r '.monit.cpu // 0' 2>/dev/null || echo "0")
    local memory_bytes=$(echo "$metrics" | jq -r '.monit.memory // 0' 2>/dev/null || echo "0")
    local memory_mb=$((memory_bytes / 1024 / 1024))
    local restarts=$(echo "$metrics" | jq -r '.pm2_env.restart_time // 0' 2>/dev/null || echo "0")
    local uptime=$(echo "$metrics" | jq -r '.pm2_env.pm_uptime // 0' 2>/dev/null || echo "0")
    
    # Log metrics
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $service - CPU: ${cpu}%, Memory: ${memory_mb}MB, Restarts: $restarts" >> "$METRICS_LOG"
    
    # Check CPU threshold
    if (( $(echo "$cpu > $CPU_THRESHOLD" | bc -l) )); then
        alert "Service $service CPU usage is high: ${cpu}%" "WARNING"
    fi
    
    # Check memory threshold
    if (( memory_mb > MEMORY_THRESHOLD )); then
        alert "Service $service memory usage is high: ${memory_mb}MB" "WARNING"
    fi
    
    # Check restart count
    if (( restarts > RESTART_THRESHOLD )); then
        alert "Service $service has restarted $restarts times" "WARNING"
    fi
    
    # Check uptime (if less than 5 minutes, it recently restarted)
    local current_time=$(date +%s)
    local uptime_seconds=$((uptime / 1000))
    if (( current_time - uptime_seconds < 300 )); then
        alert "Service $service recently restarted (uptime: $((current_time - uptime_seconds)) seconds)" "WARNING"
    fi
}

# Function to check health endpoints
check_health_endpoints() {
    local service="$1"
    local url="${HEALTH_URLS[$service]:-}"
    
    if [[ -z "$url" ]]; then
        return 0  # No health endpoint defined
    fi
    
    local start_time=$(date +%s%3N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [[ "$http_code" -ge 200 ]] && [[ "$http_code" -lt 300 ]]; then
        log "Service $service health check passed (HTTP $http_code, ${response_time}ms)"
        
        # Check response time
        if (( response_time > RESPONSE_TIME_THRESHOLD )); then
            alert "Service $service response time is slow: ${response_time}ms" "WARNING"
        fi
    else
        alert "Service $service health check failed (HTTP $http_code, ${response_time}ms)" "CRITICAL"
        
        # Attempt restart on health check failure
        pm2 restart "$service"
        success "Service $service restarted due to health check failure"
    fi
}

# Function to check disk space
check_disk_space() {
    local disk_usage=$(df /home/ubuntu | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if (( disk_usage > 85 )); then
        alert "Disk usage is high: ${disk_usage}%" "WARNING"
        
        # Clean up old log files
        find "$PROJECT_ROOT/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find "$HOME/.pm2/logs" -name "*.log" -mtime +3 -delete 2>/dev/null || true
    fi
}

# Function to check system resources
check_system_resources() {
    # Check load average
    local load_avg=$(uptime | awk '{print $10}' | sed 's/,//')
    local cpu_count=$(nproc)
    
    if (( $(echo "$load_avg > $cpu_count * 2" | bc -l) )); then
        alert "System load is high: $load_avg (CPUs: $cpu_count)" "WARNING"
    fi
    
    # Check memory usage
    local memory_info=$(free -m)
    local memory_used=$(echo "$memory_info" | awk 'NR==2{printf "%.0f", $3/$2*100}')
    
    if (( memory_used > 90 )); then
        alert "System memory usage is high: ${memory_used}%" "CRITICAL"
    fi
}

# Function to generate health report
generate_health_report() {
    local report_file="$LOG_DIR/health_report_$(date +'%Y%m%d_%H%M%S').json"
    local timestamp=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    
    local report=$(cat <<EOF
{
    "timestamp": "$timestamp",
    "system": {
        "hostname": "$(hostname)",
        "uptime": "$(uptime -p)",
        "load_average": "$(uptime | awk '{print $10$11$12}' | sed 's/,//g')",
        "memory_usage": "$(free -m | awk 'NR==2{printf "%.1f", $3/$2*100}')%",
        "disk_usage": "$(df /home/ubuntu | awk 'NR==2 {print $5}')"
    },
    "services": [
EOF
    )
    
    local first=true
    for service in "${SERVICES[@]}"; do
        [[ $first == false ]] && report+=","
        first=false
        
        if pm2 describe "$service" >/dev/null 2>&1; then
            local metrics=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name == \"$service\")" 2>/dev/null || echo "{}")
            local status=$(echo "$metrics" | jq -r '.pm2_env.status // "unknown"')
            local cpu=$(echo "$metrics" | jq -r '.monit.cpu // 0')
            local memory_mb=$(($(echo "$metrics" | jq -r '.monit.memory // 0') / 1024 / 1024))
            local restarts=$(echo "$metrics" | jq -r '.pm2_env.restart_time // 0')
            
            report+=$(cat <<EOF

        {
            "name": "$service",
            "status": "$status",
            "cpu_percent": $cpu,
            "memory_mb": $memory_mb,
            "restart_count": $restarts,
            "health_url": "${HEALTH_URLS[$service]:-null}"
        }
EOF
            )
        else
            report+=$(cat <<EOF

        {
            "name": "$service",
            "status": "not_running",
            "cpu_percent": 0,
            "memory_mb": 0,
            "restart_count": 0,
            "health_url": "${HEALTH_URLS[$service]:-null}"
        }
EOF
            )
        fi
    done
    
    report+=$(cat <<EOF

    ]
}
EOF
    )
    
    echo "$report" > "$report_file"
    echo "$report_file"
}

# Function to run full monitoring cycle
run_monitoring_cycle() {
    log "Starting monitoring cycle..."
    
    # Check PM2 daemon
    if ! check_pm2_daemon; then
        return 1
    fi
    
    # Check each service
    for service in "${SERVICES[@]}"; do
        log "Checking service: $service"
        
        check_service_status "$service"
        
        if pm2 describe "$service" >/dev/null 2>&1; then
            check_service_metrics "$service"
            check_health_endpoints "$service"
        fi
    done
    
    # Check system resources
    check_disk_space
    check_system_resources
    
    log "Monitoring cycle completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  monitor         Run single monitoring cycle"
    echo "  daemon          Run continuous monitoring (every 60 seconds)"
    echo "  report          Generate health report"
    echo "  test-alerts     Test notification system"
    echo "  tail-logs       Tail monitoring logs"
    echo ""
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK_URL     Slack webhook for notifications"
    echo "  DISCORD_WEBHOOK_URL   Discord webhook for notifications"
    echo "  ALERT_EMAIL           Email address for alerts"
    echo ""
}

# Function to run as daemon
run_daemon() {
    log "Starting PM2 monitoring daemon..."
    
    while true; do
        run_monitoring_cycle
        
        # Sleep for 60 seconds
        sleep 60
    done
}

# Function to test alerts
test_alerts() {
    log "Testing notification system..."
    
    send_notification "INFO" "This is a test notification from CRYB Platform monitoring system"
    
    success "Test notification sent"
}

# Main execution logic
main() {
    case "${1:-monitor}" in
        "monitor")
            run_monitoring_cycle
            ;;
        "daemon")
            run_daemon
            ;;
        "report")
            local report_file=$(generate_health_report)
            success "Health report generated: $report_file"
            cat "$report_file"
            ;;
        "test-alerts")
            test_alerts
            ;;
        "tail-logs")
            tail -f "$HEALTH_LOG" "$ALERT_LOG" "$METRICS_LOG"
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Check dependencies
if ! command -v jq >/dev/null 2>&1; then
    echo "Warning: jq is not installed. Some features will be limited."
    echo "Install with: sudo apt-get install jq"
fi

if ! command -v bc >/dev/null 2>&1; then
    echo "Warning: bc is not installed. Numeric comparisons will be limited."
    echo "Install with: sudo apt-get install bc"
fi

# Run main function
main "$@"