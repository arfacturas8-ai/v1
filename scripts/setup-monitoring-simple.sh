#!/bin/bash

# CRYB Platform Simple Monitoring Setup Script
# Sets up basic monitoring without external package dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
CONFIG_DIR="$PROJECT_ROOT/config"
DATA_DIR="$PROJECT_ROOT/data"
LOGS_DIR="$PROJECT_ROOT/logs"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CRYB Platform Simple Monitoring Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
create_directories() {
    print_status "Creating monitoring directories..."
    
    mkdir -p "$MONITORING_DIR"/{logs,metrics,alerts}
    mkdir -p "$DATA_DIR"/monitoring
    mkdir -p "$LOGS_DIR"/monitoring
    mkdir -p "$CONFIG_DIR"/monitoring
    
    # Set proper permissions
    chmod 755 "$MONITORING_DIR"
    chmod 755 "$DATA_DIR"
    chmod 755 "$LOGS_DIR"
}

# Setup basic monitoring configuration
setup_basic_monitoring() {
    print_status "Setting up basic monitoring configuration..."
    
    # Create monitoring configuration
    cat > "$CONFIG_DIR/monitoring/config.json" << EOF
{
  "monitoring": {
    "enabled": true,
    "interval": 30,
    "retention_days": 7,
    "alerts": {
      "enabled": true,
      "webhook_url": "",
      "email": ""
    },
    "services": {
      "api": {
        "url": "http://localhost:3002/health",
        "timeout": 5,
        "expected_status": [200, 503]
      },
      "web": {
        "url": "http://localhost:3000",
        "timeout": 5,
        "expected_status": [200]
      },
      "database": {
        "host": "localhost",
        "port": 5432,
        "database": "cryb",
        "user": "cryb_user"
      },
      "redis": {
        "host": "localhost",
        "port": 6380
      }
    },
    "thresholds": {
      "cpu_warning": 80,
      "cpu_critical": 95,
      "memory_warning": 85,
      "memory_critical": 95,
      "disk_warning": 80,
      "disk_critical": 90,
      "response_time_warning": 1000,
      "response_time_critical": 5000
    }
  }
}
EOF
}

# Create metrics collection script
create_metrics_collector() {
    print_status "Creating metrics collection script..."
    
    cat > "$SCRIPT_DIR/collect-metrics.sh" << 'EOF'
#!/bin/bash

# CRYB Platform Metrics Collector
# Collects and stores system and application metrics

# Configuration
METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
LOG_FILE="/home/ubuntu/cryb-platform/logs/monitoring/metrics-collector.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_STAMP=$(date '+%Y%m%d')

# Create directories
mkdir -p "$METRICS_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Function to collect system metrics
collect_system_metrics() {
    local metrics_file="$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl"
    
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | sed 's/us,//')
    local load_1min=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    
    # Memory Usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100}')
    local mem_total=$(free -h | grep Mem | awk '{print $2}')
    local mem_used=$(free -h | grep Mem | awk '{print $3}')
    local mem_available=$(free -h | grep Mem | awk '{print $7}')
    
    # Disk Usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_available=$(df -h / | awk 'NR==2 {print $4}')
    
    # Network Stats
    local interface=$(ip route | grep default | awk '{print $5}' | head -n1)
    local rx_bytes=$(cat /sys/class/net/$interface/statistics/rx_bytes 2>/dev/null || echo "0")
    local tx_bytes=$(cat /sys/class/net/$interface/statistics/tx_bytes 2>/dev/null || echo "0")
    
    # Create JSON metric
    local metric=$(cat << EOM
{
  "timestamp": "$TIMESTAMP",
  "type": "system",
  "metrics": {
    "cpu": {
      "usage_percent": $cpu_usage,
      "load_1min": $load_1min
    },
    "memory": {
      "usage_percent": $mem_usage,
      "total": "$mem_total",
      "used": "$mem_used",
      "available": "$mem_available"
    },
    "disk": {
      "usage_percent": $disk_usage,
      "available": "$disk_available"
    },
    "network": {
      "interface": "$interface",
      "rx_bytes": $rx_bytes,
      "tx_bytes": $tx_bytes
    }
  }
}
EOM
    )
    
    echo "$metric" >> "$metrics_file"
    log_message "System metrics collected"
}

# Function to collect service metrics
collect_service_metrics() {
    local metrics_file="$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl"
    
    # API Health Check
    local api_start=$(date +%s%N)
    local api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3002/health" 2>/dev/null || echo "000")
    local api_end=$(date +%s%N)
    local api_response_time=$(((api_end - api_start) / 1000000))
    
    # Web Frontend Check
    local web_start=$(date +%s%N)
    local web_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:3000" 2>/dev/null || echo "000")
    local web_end=$(date +%s%N)
    local web_response_time=$(((web_end - web_start) / 1000000))
    
    # Database Check
    local db_status="down"
    local db_connections=0
    if PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -c "SELECT 1" >/dev/null 2>&1; then
        db_status="up"
        db_connections=$(PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ' || echo "0")
    fi
    
    # Redis Check
    local redis_status="down"
    local redis_memory=""
    local redis_clients=0
    if redis-cli -p 6380 -a cryb_redis_password ping >/dev/null 2>&1; then
        redis_status="up"
        redis_memory=$(redis-cli -p 6380 -a cryb_redis_password info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "unknown")
        redis_clients=$(redis-cli -p 6380 -a cryb_redis_password info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r' || echo "0")
    fi
    
    # Create JSON metric
    local metric=$(cat << EOM
{
  "timestamp": "$TIMESTAMP",
  "type": "services",
  "metrics": {
    "api": {
      "status": "$api_status",
      "response_time_ms": $api_response_time,
      "healthy": $([ "$api_status" = "200" ] || [ "$api_status" = "503" ] && echo "true" || echo "false")
    },
    "web": {
      "status": "$web_status",
      "response_time_ms": $web_response_time,
      "healthy": $([ "$web_status" = "200" ] && echo "true" || echo "false")
    },
    "database": {
      "status": "$db_status",
      "connections": $db_connections,
      "healthy": $([ "$db_status" = "up" ] && echo "true" || echo "false")
    },
    "redis": {
      "status": "$redis_status",
      "memory_usage": "$redis_memory",
      "clients": $redis_clients,
      "healthy": $([ "$redis_status" = "up" ] && echo "true" || echo "false")
    }
  }
}
EOM
    )
    
    echo "$metric" >> "$metrics_file"
    log_message "Service metrics collected"
}

# Function to collect PM2 metrics
collect_pm2_metrics() {
    if command -v pm2 >/dev/null 2>&1; then
        local metrics_file="$METRICS_DIR/pm2-metrics-$DATE_STAMP.jsonl"
        local pm2_status=$(pm2 jlist 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            local online=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || echo "0")
            local stopped=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "stopped")] | length' 2>/dev/null || echo "0")
            local errored=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "errored")] | length' 2>/dev/null || echo "0")
            local total_memory=$(echo "$pm2_status" | jq -r '[.[] | .pm2_env.monit.memory] | add' 2>/dev/null || echo "0")
            
            local metric=$(cat << EOM
{
  "timestamp": "$TIMESTAMP",
  "type": "pm2",
  "metrics": {
    "processes": {
      "online": $online,
      "stopped": $stopped,
      "errored": $errored,
      "total": $((online + stopped + errored))
    },
    "memory": {
      "total_bytes": $total_memory
    }
  }
}
EOM
            )
            
            echo "$metric" >> "$metrics_file"
            log_message "PM2 metrics collected"
        fi
    fi
}

# Function to check for alerts
check_alerts() {
    local alerts_file="$METRICS_DIR/alerts-$DATE_STAMP.jsonl"
    local alerts=()
    
    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | sed 's/us,//')
    if (( $(echo "$cpu_usage > 95" | bc -l 2>/dev/null || echo "0") )); then
        alerts+=("{\"level\": \"critical\", \"service\": \"system\", \"metric\": \"cpu\", \"value\": $cpu_usage, \"threshold\": 95}")
    elif (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        alerts+=("{\"level\": \"warning\", \"service\": \"system\", \"metric\": \"cpu\", \"value\": $cpu_usage, \"threshold\": 80}")
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$mem_usage" -gt 95 ]; then
        alerts+=("{\"level\": \"critical\", \"service\": \"system\", \"metric\": \"memory\", \"value\": $mem_usage, \"threshold\": 95}")
    elif [ "$mem_usage" -gt 85 ]; then
        alerts+=("{\"level\": \"warning\", \"service\": \"system\", \"metric\": \"memory\", \"value\": $mem_usage, \"threshold\": 85}")
    fi
    
    # Check disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        alerts+=("{\"level\": \"critical\", \"service\": \"system\", \"metric\": \"disk\", \"value\": $disk_usage, \"threshold\": 90}")
    elif [ "$disk_usage" -gt 80 ]; then
        alerts+=("{\"level\": \"warning\", \"service\": \"system\", \"metric\": \"disk\", \"value\": $disk_usage, \"threshold\": 80}")
    fi
    
    # Save alerts if any
    if [ ${#alerts[@]} -gt 0 ]; then
        for alert in "${alerts[@]}"; do
            local alert_with_timestamp=$(echo "$alert" | jq ". + {\"timestamp\": \"$TIMESTAMP\"}")
            echo "$alert_with_timestamp" >> "$alerts_file"
        done
        log_message "Alerts generated: ${#alerts[@]} alerts"
    fi
}

# Main execution
main() {
    log_message "Starting metrics collection"
    
    collect_system_metrics
    collect_service_metrics
    collect_pm2_metrics
    check_alerts
    
    log_message "Metrics collection completed"
}

# Run main function
main "$@"
EOF

    chmod +x "$SCRIPT_DIR/collect-metrics.sh"
}

# Create metrics viewer script
create_metrics_viewer() {
    print_status "Creating metrics viewer script..."
    
    cat > "$SCRIPT_DIR/view-metrics.sh" << 'EOF'
#!/bin/bash

# CRYB Platform Metrics Viewer
# View and analyze collected metrics

METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
DATE_STAMP=$(date '+%Y%m%d')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo "CRYB Platform Metrics Viewer"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  system     Show system metrics"
    echo "  services   Show service metrics"
    echo "  pm2        Show PM2 metrics"
    echo "  alerts     Show alerts"
    echo "  summary    Show metrics summary"
    echo "  help       Show this help"
    echo ""
}

show_system_metrics() {
    echo -e "${BLUE}System Metrics (Last 10 entries):${NC}"
    echo "=================================================="
    
    if [ -f "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl" ]; then
        tail -n 10 "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl" | while read -r line; do
            local timestamp=$(echo "$line" | jq -r '.timestamp')
            local cpu=$(echo "$line" | jq -r '.metrics.cpu.usage_percent')
            local memory=$(echo "$line" | jq -r '.metrics.memory.usage_percent')
            local disk=$(echo "$line" | jq -r '.metrics.disk.usage_percent')
            
            printf "%-20s CPU: %5s%% | Memory: %5s%% | Disk: %5s%%\n" "$timestamp" "$cpu" "$memory" "$disk"
        done
    else
        echo "No system metrics found for today"
    fi
}

show_service_metrics() {
    echo -e "${BLUE}Service Metrics (Last 10 entries):${NC}"
    echo "=================================================="
    
    if [ -f "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl" ]; then
        tail -n 10 "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl" | while read -r line; do
            local timestamp=$(echo "$line" | jq -r '.timestamp')
            local api_status=$(echo "$line" | jq -r '.metrics.api.status')
            local api_time=$(echo "$line" | jq -r '.metrics.api.response_time_ms')
            local web_status=$(echo "$line" | jq -r '.metrics.web.status')
            local db_status=$(echo "$line" | jq -r '.metrics.database.status')
            local redis_status=$(echo "$line" | jq -r '.metrics.redis.status')
            
            printf "%-20s API: %3s (%4sms) | Web: %3s | DB: %4s | Redis: %4s\n" \
                "$timestamp" "$api_status" "$api_time" "$web_status" "$db_status" "$redis_status"
        done
    else
        echo "No service metrics found for today"
    fi
}

show_alerts() {
    echo -e "${BLUE}Recent Alerts:${NC}"
    echo "=================================================="
    
    if [ -f "$METRICS_DIR/alerts-$DATE_STAMP.jsonl" ]; then
        tail -n 20 "$METRICS_DIR/alerts-$DATE_STAMP.jsonl" | while read -r line; do
            local timestamp=$(echo "$line" | jq -r '.timestamp')
            local level=$(echo "$line" | jq -r '.level')
            local service=$(echo "$line" | jq -r '.service')
            local metric=$(echo "$line" | jq -r '.metric')
            local value=$(echo "$line" | jq -r '.value')
            
            case $level in
                critical)
                    printf "${RED}%-20s [CRITICAL] %s.%s = %s${NC}\n" "$timestamp" "$service" "$metric" "$value"
                    ;;
                warning)
                    printf "${YELLOW}%-20s [WARNING]  %s.%s = %s${NC}\n" "$timestamp" "$service" "$metric" "$value"
                    ;;
                *)
                    printf "%-20s [%s] %s.%s = %s\n" "$timestamp" "$level" "$service" "$metric" "$value"
                    ;;
            esac
        done
    else
        echo "No alerts found for today"
    fi
}

show_summary() {
    echo -e "${BLUE}Metrics Summary for $(date):${NC}"
    echo "=================================================="
    
    # System summary
    if [ -f "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl" ]; then
        local last_system=$(tail -n 1 "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl")
        local cpu=$(echo "$last_system" | jq -r '.metrics.cpu.usage_percent')
        local memory=$(echo "$last_system" | jq -r '.metrics.memory.usage_percent')
        local disk=$(echo "$last_system" | jq -r '.metrics.disk.usage_percent')
        
        echo -e "Current System Status:"
        echo -e "  CPU Usage:    $cpu%"
        echo -e "  Memory Usage: $memory%"
        echo -e "  Disk Usage:   $disk%"
        echo ""
    fi
    
    # Service summary
    if [ -f "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl" ]; then
        local last_service=$(tail -n 1 "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl")
        local api_healthy=$(echo "$last_service" | jq -r '.metrics.api.healthy')
        local web_healthy=$(echo "$last_service" | jq -r '.metrics.web.healthy')
        local db_healthy=$(echo "$last_service" | jq -r '.metrics.database.healthy')
        local redis_healthy=$(echo "$last_service" | jq -r '.metrics.redis.healthy')
        
        echo -e "Current Service Status:"
        echo -e "  API:      $([ "$api_healthy" = "true" ] && echo -e "${GREEN}Healthy${NC}" || echo -e "${RED}Unhealthy${NC}")"
        echo -e "  Web:      $([ "$web_healthy" = "true" ] && echo -e "${GREEN}Healthy${NC}" || echo -e "${RED}Unhealthy${NC}")"
        echo -e "  Database: $([ "$db_healthy" = "true" ] && echo -e "${GREEN}Healthy${NC}" || echo -e "${RED}Unhealthy${NC}")"
        echo -e "  Redis:    $([ "$redis_healthy" = "true" ] && echo -e "${GREEN}Healthy${NC}" || echo -e "${RED}Unhealthy${NC}")"
        echo ""
    fi
    
    # Alert summary
    if [ -f "$METRICS_DIR/alerts-$DATE_STAMP.jsonl" ]; then
        local alert_count=$(wc -l < "$METRICS_DIR/alerts-$DATE_STAMP.jsonl")
        local critical_count=$(grep '"level": "critical"' "$METRICS_DIR/alerts-$DATE_STAMP.jsonl" | wc -l)
        local warning_count=$(grep '"level": "warning"' "$METRICS_DIR/alerts-$DATE_STAMP.jsonl" | wc -l)
        
        echo -e "Alert Summary (Today):"
        echo -e "  Total Alerts: $alert_count"
        echo -e "  Critical:     $critical_count"
        echo -e "  Warnings:     $warning_count"
    fi
}

# Main execution
case "${1:-summary}" in
    system)
        show_system_metrics
        ;;
    services)
        show_service_metrics
        ;;
    pm2)
        echo -e "${BLUE}PM2 Metrics:${NC}"
        if [ -f "$METRICS_DIR/pm2-metrics-$DATE_STAMP.jsonl" ]; then
            tail -n 10 "$METRICS_DIR/pm2-metrics-$DATE_STAMP.jsonl" | jq -r '.metrics.processes'
        else
            echo "No PM2 metrics found"
        fi
        ;;
    alerts)
        show_alerts
        ;;
    summary)
        show_summary
        ;;
    help)
        show_help
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
EOF

    chmod +x "$SCRIPT_DIR/view-metrics.sh"
}

# Setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    # Create logrotate configuration
    sudo tee /etc/logrotate.d/cryb-monitoring << EOF
$LOGS_DIR/monitoring/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}

$DATA_DIR/monitoring/*.jsonl {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF
}

# Setup cron jobs
setup_cron_jobs() {
    print_status "Setting up monitoring cron jobs..."
    
    # Add cron jobs for monitoring
    (crontab -l 2>/dev/null || true; cat << 'EOF'
# CRYB Platform Simple Monitoring
*/5 * * * * /home/ubuntu/cryb-platform/scripts/health-check-enhanced.sh >> /home/ubuntu/cryb-platform/logs/monitoring/health-checks.log 2>&1
*/2 * * * * /home/ubuntu/cryb-platform/scripts/collect-metrics.sh
0 */6 * * * /usr/sbin/logrotate /etc/logrotate.d/cryb-monitoring --state /tmp/logrotate.state
EOF
    ) | crontab -
}

# Create monitoring status script
create_status_script() {
    print_status "Creating monitoring status script..."
    
    cat > "$SCRIPT_DIR/monitoring-status.sh" << 'EOF'
#!/bin/bash

# CRYB Platform Monitoring Status
# Quick status check for monitoring system

METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
LOG_DIR="/home/ubuntu/cryb-platform/logs/monitoring"
DATE_STAMP=$(date '+%Y%m%d')

echo "CRYB Platform Monitoring Status"
echo "==============================="
echo "Date: $(date)"
echo ""

# Check if metrics collection is working
echo "Metrics Collection:"
if [ -f "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl" ]; then
    local lines=$(wc -l < "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl")
    echo "  System metrics: $lines entries today"
else
    echo "  System metrics: No data today"
fi

if [ -f "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl" ]; then
    local lines=$(wc -l < "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl")
    echo "  Service metrics: $lines entries today"
else
    echo "  Service metrics: No data today"
fi

# Check health checks
echo ""
echo "Health Checks:"
if [ -f "$LOG_DIR/health-checks.log" ]; then
    local last_health=$(tail -n 1 "$LOG_DIR/health-checks.log")
    echo "  Last check: $last_health"
else
    echo "  No health check logs found"
fi

# Check cron jobs
echo ""
echo "Cron Jobs:"
crontab -l 2>/dev/null | grep -E "(health-check|collect-metrics)" | while read -r job; do
    echo "  $job"
done

echo ""
echo "Disk Usage:"
echo "  Logs: $(du -sh $LOG_DIR 2>/dev/null | cut -f1 || echo "Unknown")"
echo "  Metrics: $(du -sh $METRICS_DIR 2>/dev/null | cut -f1 || echo "Unknown")"
EOF

    chmod +x "$SCRIPT_DIR/monitoring-status.sh"
}

# Main execution
main() {
    print_status "Starting CRYB Platform simple monitoring setup..."
    
    create_directories
    setup_basic_monitoring
    create_metrics_collector
    create_metrics_viewer
    setup_log_rotation
    setup_cron_jobs
    create_status_script
    
    print_status "Simple monitoring setup completed!"
    echo
    echo -e "${GREEN}Available Scripts:${NC}"
    echo -e "  Health Check:     $SCRIPT_DIR/health-check-enhanced.sh"
    echo -e "  Dashboard:        $SCRIPT_DIR/monitoring-dashboard.sh"
    echo -e "  Collect Metrics:  $SCRIPT_DIR/collect-metrics.sh"
    echo -e "  View Metrics:     $SCRIPT_DIR/view-metrics.sh [system|services|alerts|summary]"
    echo -e "  Status:           $SCRIPT_DIR/monitoring-status.sh"
    echo
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Run: $SCRIPT_DIR/collect-metrics.sh (test metrics collection)"
    echo -e "  2. Run: $SCRIPT_DIR/monitoring-dashboard.sh (start dashboard)"
    echo -e "  3. Check: $SCRIPT_DIR/monitoring-status.sh (verify setup)"
    echo -e "  4. Cron jobs have been installed for automatic monitoring"
}

# Run main function
main "$@"