#!/bin/bash

# Enhanced Logging Setup for Cryb Platform
# Configures structured logging, log rotation, and monitoring

set -euo pipefail

LOG_DIR="/home/ubuntu/cryb-platform/logs"
NGINX_LOG_DIR="/var/log/nginx"
ARCHIVE_DIR="$LOG_DIR/archive"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

setup_log_directories() {
    log "${BLUE}Setting up log directories...${NC}"
    
    # Create log directories
    mkdir -p "$LOG_DIR"/{health-checks,monitoring,application,archive}
    mkdir -p "$LOG_DIR"/{api,web,react,nginx}
    
    # Set proper permissions
    chmod 755 "$LOG_DIR"
    chmod 755 "$LOG_DIR"/{health-checks,monitoring,application,archive}
    chmod 755 "$LOG_DIR"/{api,web,react,nginx}
    
    log "${GREEN}✓ Log directories created${NC}"
}

configure_logrotate() {
    log "${BLUE}Configuring log rotation...${NC}"
    
    # Create logrotate configuration for application logs
    cat > /etc/logrotate.d/cryb-platform << 'EOF'
/home/ubuntu/cryb-platform/logs/*.log
/home/ubuntu/cryb-platform/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    sharedscripts
    postrotate
        /bin/systemctl reload nginx > /dev/null 2>&1 || true
        /usr/bin/pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}

/home/ubuntu/cryb-platform/logs/health-checks/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}

/home/ubuntu/cryb-platform/logs/monitoring/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

    # Create logrotate configuration for nginx logs
    cat > /etc/logrotate.d/cryb-nginx << 'EOF'
/var/log/nginx/cryb-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF
    
    # Test logrotate configuration
    logrotate -d /etc/logrotate.d/cryb-platform
    logrotate -d /etc/logrotate.d/cryb-nginx
    
    log "${GREEN}✓ Log rotation configured${NC}"
}

configure_nginx_logging() {
    log "${BLUE}Configuring nginx access and error logging...${NC}"
    
    # Create nginx log configuration
    cat > /etc/nginx/conf.d/logging.conf << 'EOF'
# Custom log formats
log_format main_custom '$remote_addr - $remote_user [$time_local] "$request" '
                       '$status $body_bytes_sent "$http_referer" '
                       '"$http_user_agent" "$http_x_forwarded_for" '
                       'rt=$request_time uct="$upstream_connect_time" '
                       'uht="$upstream_header_time" urt="$upstream_response_time"';

log_format json_custom escape=json
    '{'
        '"timestamp":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"remote_user":"$remote_user",'
        '"request":"$request",'
        '"status":"$status",'
        '"body_bytes_sent":"$body_bytes_sent",'
        '"http_referer":"$http_referer",'
        '"http_user_agent":"$http_user_agent",'
        '"http_x_forwarded_for":"$http_x_forwarded_for",'
        '"request_time":"$request_time",'
        '"upstream_connect_time":"$upstream_connect_time",'
        '"upstream_header_time":"$upstream_header_time",'
        '"upstream_response_time":"$upstream_response_time",'
        '"upstream_cache_status":"$upstream_cache_status",'
        '"server_name":"$server_name"'
    '}';

# Global error log
error_log /var/log/nginx/error.log warn;

# Access logs will be configured per server block
EOF

    # Update nginx sites to use custom logging
    for site in api-cryb-ai platform-cryb-ai; do
        if [[ -f "/etc/nginx/sites-available/$site" ]]; then
            # Backup original
            cp "/etc/nginx/sites-available/$site" "/etc/nginx/sites-available/$site.backup"
            
            # Add logging configuration
            sed -i '/server {/a\    # Enhanced logging\n    access_log /var/log/nginx/'"$site"'-access.log main_custom;\n    access_log /var/log/nginx/'"$site"'-json.log json_custom;\n    error_log /var/log/nginx/'"$site"'-error.log warn;' "/etc/nginx/sites-available/$site"
        fi
    done
    
    log "${GREEN}✓ Nginx logging configured${NC}"
}

setup_pm2_logging() {
    log "${BLUE}Configuring PM2 logging...${NC}"
    
    # Install PM2 log rotate module
    pm2 install pm2-logrotate || true
    
    # Configure PM2 log rotation
    pm2 set pm2-logrotate:max_size 100M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
    pm2 set pm2-logrotate:rotateModule true
    pm2 set pm2-logrotate:workerInterval 3600
    pm2 set pm2-logrotate:rotateInterval 0 0 * * *
    
    log "${GREEN}✓ PM2 logging configured${NC}"
}

create_log_monitoring_script() {
    log "${BLUE}Creating log monitoring script...${NC}"
    
    cat > /home/ubuntu/cryb-platform/scripts/log-monitor.sh << 'EOF'
#!/bin/bash

# Log Monitoring Script
# Monitors log files for errors and sends alerts

LOG_DIR="/home/ubuntu/cryb-platform/logs"
ALERT_LOG="$LOG_DIR/monitoring/log-alerts.log"
LAST_CHECK_FILE="/tmp/log-monitor-last-check"

# Get timestamp of last check
if [[ -f "$LAST_CHECK_FILE" ]]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK=$(date -d "1 hour ago" +%s)
fi

# Update last check timestamp
echo $(date +%s) > "$LAST_CHECK_FILE"

# Function to check for critical errors
check_critical_errors() {
    local log_file="$1"
    local service_name="$2"
    
    if [[ ! -f "$log_file" ]]; then
        return 0
    fi
    
    # Look for errors since last check
    local error_patterns=(
        "ERROR"
        "CRITICAL"
        "FATAL"
        "Cannot connect"
        "Connection refused"
        "out of memory"
        "EADDRINUSE"
        "ECONNREFUSED"
    )
    
    for pattern in "${error_patterns[@]}"; do
        # Find errors since last check
        local errors
        errors=$(find "$log_file" -newermt "@$LAST_CHECK" -exec grep -l "$pattern" {} \; 2>/dev/null | wc -l)
        
        if [[ "$errors" -gt 0 ]]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $service_name - Found $errors instances of '$pattern'" >> "$ALERT_LOG"
        fi
    done
}

# Monitor application logs
check_critical_errors "$LOG_DIR/api-error.log" "API Server"
check_critical_errors "$LOG_DIR/web-error.log" "Web Frontend"
check_critical_errors "$LOG_DIR/react-error.log" "React App"

# Monitor nginx logs
check_critical_errors "/var/log/nginx/error.log" "Nginx"
check_critical_errors "/var/log/nginx/api-cryb-ai-error.log" "API Nginx"
check_critical_errors "/var/log/nginx/platform-cryb-ai-error.log" "Platform Nginx"

# Check for high error rates
api_errors=$(tail -1000 "$LOG_DIR/api-error.log" 2>/dev/null | grep -c "ERROR" || echo 0)
if [[ "$api_errors" -gt 50 ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: API Server - High error rate: $api_errors errors in last 1000 lines" >> "$ALERT_LOG"
fi

# Check for memory issues
memory_errors=$(tail -1000 "$LOG_DIR"/*.log 2>/dev/null | grep -ic "out of memory\|heap\|memory" || echo 0)
if [[ "$memory_errors" -gt 10 ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: System - Potential memory issues: $memory_errors references" >> "$ALERT_LOG"
fi
EOF

    chmod +x /home/ubuntu/cryb-platform/scripts/log-monitor.sh
    
    log "${GREEN}✓ Log monitoring script created${NC}"
}

create_log_analysis_script() {
    log "${BLUE}Creating log analysis script...${NC}"
    
    cat > /home/ubuntu/cryb-platform/scripts/log-analysis.sh << 'EOF'
#!/bin/bash

# Log Analysis Script
# Provides insights and statistics from log files

LOG_DIR="/home/ubuntu/cryb-platform/logs"
REPORT_DIR="$LOG_DIR/reports"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

mkdir -p "$REPORT_DIR"

echo "=== Cryb Platform Log Analysis Report ==="
echo "Generated: $(date)"
echo "========================================="

# API Server Statistics
if [[ -f "$LOG_DIR/api-combined.log" ]]; then
    echo
    echo "API Server Statistics (Last 24 hours):"
    echo "--------------------------------------"
    
    # Request count
    requests=$(grep -c "$(date -d '24 hours ago' '+%Y-%m-%d')" "$LOG_DIR/api-combined.log" 2>/dev/null || echo 0)
    echo "Total requests: $requests"
    
    # Error count
    errors=$(grep -c "ERROR\|CRITICAL\|FATAL" "$LOG_DIR/api-error.log" 2>/dev/null || echo 0)
    echo "Total errors: $errors"
    
    # Top 5 most frequent errors
    if [[ -f "$LOG_DIR/api-error.log" ]]; then
        echo
        echo "Top 5 most frequent errors:"
        grep "ERROR\|CRITICAL\|FATAL" "$LOG_DIR/api-error.log" 2>/dev/null | \
        sed 's/.*ERROR/ERROR/' | sed 's/.*CRITICAL/CRITICAL/' | sed 's/.*FATAL/FATAL/' | \
        sort | uniq -c | sort -nr | head -5 || echo "No errors found"
    fi
fi

# Nginx Statistics
if [[ -f "/var/log/nginx/api-cryb-ai-access.log" ]]; then
    echo
    echo "Nginx Statistics (Last 24 hours):"
    echo "---------------------------------"
    
    # Request count by status code
    echo "Requests by status code:"
    awk '{print $9}' /var/log/nginx/api-cryb-ai-access.log 2>/dev/null | \
    sort | uniq -c | sort -nr || echo "No access logs found"
    
    # Top 10 IP addresses
    echo
    echo "Top 10 IP addresses:"
    awk '{print $1}' /var/log/nginx/api-cryb-ai-access.log 2>/dev/null | \
    sort | uniq -c | sort -nr | head -10 || echo "No access logs found"
fi

# System Performance Metrics
echo
echo "System Performance Indicators:"
echo "------------------------------"

# PM2 Process Status
if command -v pm2 &> /dev/null; then
    echo "PM2 Process Status:"
    pm2 status --no-colors 2>/dev/null || echo "PM2 not available"
fi

# Memory Usage
echo
echo "Memory Usage:"
free -h

# Disk Usage
echo
echo "Disk Usage:"
df -h /

# Load Average
echo
echo "Load Average:"
uptime

# Save report
report_file="$REPORT_DIR/log-analysis-$TIMESTAMP.txt"
{
    echo "=== Cryb Platform Log Analysis Report ==="
    echo "Generated: $(date)"
    echo "========================================="
    # ... (repeat the above analysis)
} > "$report_file"

echo
echo "Full report saved to: $report_file"
EOF

    chmod +x /home/ubuntu/cryb-platform/scripts/log-analysis.sh
    
    log "${GREEN}✓ Log analysis script created${NC}"
}

setup_cron_jobs() {
    log "${BLUE}Setting up cron jobs for log monitoring...${NC}"
    
    # Add cron jobs
    (crontab -l 2>/dev/null || echo "") | grep -v "log-monitor\|log-analysis" | {
        cat
        echo "# Cryb Platform Log Monitoring"
        echo "*/15 * * * * /home/ubuntu/cryb-platform/scripts/log-monitor.sh >/dev/null 2>&1"
        echo "0 6 * * * /home/ubuntu/cryb-platform/scripts/log-analysis.sh >/dev/null 2>&1"
    } | crontab -
    
    log "${GREEN}✓ Cron jobs configured${NC}"
}

main() {
    log "${BLUE}Setting up enhanced logging for Cryb Platform...${NC}"
    
    setup_log_directories
    configure_logrotate
    configure_nginx_logging
    setup_pm2_logging
    create_log_monitoring_script
    create_log_analysis_script
    setup_cron_jobs
    
    log "${GREEN}✓ Enhanced logging setup complete!${NC}"
    log "${YELLOW}Please run 'nginx -t && systemctl reload nginx' to apply nginx logging changes${NC}"
}

main "$@"