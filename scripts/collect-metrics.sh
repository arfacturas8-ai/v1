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
