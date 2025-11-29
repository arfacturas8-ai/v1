#!/bin/bash
# CRYB Platform Production Monitoring Setup Script
# Sets up comprehensive monitoring and alerting for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PLATFORM_DIR="/home/ubuntu/cryb-platform"
MONITORING_DIR="$PLATFORM_DIR/monitoring"
GRAFANA_DATA_DIR="$MONITORING_DIR/grafana/data"
PROMETHEUS_DATA_DIR="$MONITORING_DIR/prometheus/data"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "🔍 Setting up CRYB Platform Production Monitoring..."

# Create monitoring directories
mkdir -p "$MONITORING_DIR"/{grafana/{data,dashboards},prometheus/data,alerts,scripts}

# Set proper permissions
sudo chown -R 472:472 "$GRAFANA_DATA_DIR" 2>/dev/null || true
sudo chown -R 65534:65534 "$PROMETHEUS_DATA_DIR" 2>/dev/null || true

# Create health check script
cat > "$MONITORING_DIR/scripts/health-check.sh" << 'EOF'
#!/bin/bash
# CRYB Platform Health Check Script

# Configuration
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3003"
ALERT_EMAIL="admin@cryb.ai"
LOG_FILE="/home/ubuntu/cryb-platform/logs/health-check.log"

# Create log entry
log_entry() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check service health
check_service() {
    local name=$1
    local url=$2
    local timeout=${3:-10}
    
    if curl -s --max-time "$timeout" "$url" > /dev/null; then
        log_entry "✓ $name is healthy"
        return 0
    else
        log_entry "✗ $name is down - $url"
        return 1
    fi
}

# Check database
check_database() {
    if docker exec cryb-postgres-optimized pg_isready -U postgres > /dev/null 2>&1; then
        log_entry "✓ Database is healthy"
        return 0
    else
        log_entry "✗ Database is down"
        return 1
    fi
}

# Check Redis
check_redis() {
    if docker exec cryb-redis-dev redis-cli ping | grep -q PONG 2>/dev/null; then
        log_entry "✓ Redis is healthy"
        return 0
    else
        log_entry "✗ Redis is down"
        return 1
    fi
}

# Main health check
main() {
    log_entry "=== Health Check Started ==="
    
    failed_services=""
    
    if ! check_service "API" "$API_URL/health"; then
        failed_services="$failed_services API"
    fi
    
    if ! check_service "Web" "$WEB_URL"; then
        failed_services="$failed_services Web"
    fi
    
    if ! check_database; then
        failed_services="$failed_services Database"
    fi
    
    if ! check_redis; then
        failed_services="$failed_services Redis"
    fi
    
    # Check PM2 processes
    if ! pm2 list 2>/dev/null | grep -q online; then
        failed_services="$failed_services PM2"
        log_entry "✗ PM2 processes are not online"
    else
        log_entry "✓ PM2 processes are healthy"
    fi
    
    if [ -n "$failed_services" ]; then
        log_entry "❌ CRITICAL: Services down:$failed_services"
        # Send alert (implement email/webhook notification here)
        echo "CRYB Platform Alert: Services down:$failed_services" | logger -t cryb-health
        exit 1
    else
        log_entry "✅ All services are healthy"
        exit 0
    fi
}

main "$@"
EOF

chmod +x "$MONITORING_DIR/scripts/health-check.sh"

# Create system monitoring script
cat > "$MONITORING_DIR/scripts/system-monitor.sh" << 'EOF'
#!/bin/bash
# CRYB Platform System Monitoring Script

LOG_FILE="/home/ubuntu/cryb-platform/logs/system-monitor.log"
METRICS_FILE="/home/ubuntu/cryb-platform/logs/metrics.json"

# Get system metrics
get_metrics() {
    local timestamp=$(date -u +%s)
    local memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # PM2 process count
    local pm2_processes=$(pm2 list 2>/dev/null | grep -c online || echo "0")
    
    # Docker container count
    local docker_containers=$(docker ps -q | wc -l)
    
    cat > "$METRICS_FILE" << JSON
{
  "timestamp": $timestamp,
  "memory_usage_percent": $memory_usage,
  "disk_usage_percent": $disk_usage,
  "cpu_usage_percent": $cpu_usage,
  "load_average": $load_avg,
  "pm2_processes_online": $pm2_processes,
  "docker_containers_running": $docker_containers,
  "uptime": "$(uptime -p)"
}
JSON
    
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Memory: ${memory_usage}%, Disk: ${disk_usage}%, CPU: ${cpu_usage}%, Load: ${load_avg}, PM2: ${pm2_processes}, Docker: ${docker_containers}" >> "$LOG_FILE"
}

get_metrics
EOF

chmod +x "$MONITORING_DIR/scripts/system-monitor.sh"

# Create alerting configuration
cat > "$MONITORING_DIR/alerts/rules.yml" << 'EOF'
groups:
- name: cryb-platform-alerts
  rules:
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      description: "Service {{ $labels.instance }} has been down for more than 1 minute."

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage on {{ $labels.instance }}"
      description: "Memory usage is above 85% for more than 5 minutes."

  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage on {{ $labels.instance }}"
      description: "CPU usage is above 80% for more than 5 minutes."

  - alert: DiskSpaceLow
    expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Low disk space on {{ $labels.instance }}"
      description: "Disk space is below 15% on root filesystem."

  - alert: DatabaseDown
    expr: pg_up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "PostgreSQL is down"
      description: "PostgreSQL database is not responding."

  - alert: RedisDown
    expr: redis_up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis is down"
      description: "Redis cache is not responding."
EOF

# Set up cron jobs for monitoring
log "Setting up monitoring cron jobs..."

# Health check every minute
(crontab -l 2>/dev/null; echo "* * * * * $MONITORING_DIR/scripts/health-check.sh") | crontab -

# System metrics every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * $MONITORING_DIR/scripts/system-monitor.sh") | crontab -

# Log rotation for health checks (daily)
(crontab -l 2>/dev/null; echo "0 2 * * * find /home/ubuntu/cryb-platform/logs -name '*.log' -type f -mtime +7 -delete") | crontab -

# Start monitoring stack
log "Starting monitoring services..."
cd "$PLATFORM_DIR"

if [ -f "docker-compose.monitoring.yml" ]; then
    docker-compose -f docker-compose.monitoring.yml up -d
    success "Monitoring stack started"
else
    warning "Monitoring docker-compose file not found"
fi

# Wait for services to start
sleep 30

# Test monitoring endpoints
log "Testing monitoring endpoints..."

test_endpoint() {
    local name=$1
    local url=$2
    
    if curl -s "$url" > /dev/null; then
        success "✓ $name is accessible"
    else
        warning "✗ $name is not accessible at $url"
    fi
}

test_endpoint "Prometheus" "http://localhost:9090"
test_endpoint "Grafana" "http://localhost:3005"
test_endpoint "Node Exporter" "http://localhost:9100"
test_endpoint "Alert Manager" "http://localhost:9093"

# Create monitoring dashboard info
cat > "$MONITORING_DIR/dashboard-info.md" << 'EOF'
# CRYB Platform Monitoring Dashboards

## Access URLs
- **Grafana**: http://localhost:3005 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alert Manager**: http://localhost:9093
- **Uptime Kuma**: http://localhost:3004

## Key Metrics to Monitor
1. **Application Health**
   - API response times
   - Error rates
   - Request counts

2. **System Resources**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

3. **Database Performance**
   - Connection count
   - Query performance
   - Lock waits

4. **Cache Performance**
   - Redis hit rates
   - Memory usage
   - Connection count

## Alert Thresholds
- **Critical**: Service down, disk space <15%, memory >90%
- **Warning**: High CPU >80%, memory >85%, slow response times >5s

## Log Locations
- Health checks: `/home/ubuntu/cryb-platform/logs/health-check.log`
- System metrics: `/home/ubuntu/cryb-platform/logs/system-monitor.log`
- Application logs: `/home/ubuntu/cryb-platform/logs/`
EOF

# Setup log aggregation
log "Setting up log aggregation..."

# Create log rotation configuration
sudo tee /etc/logrotate.d/cryb-platform << 'EOF'
/home/ubuntu/cryb-platform/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF

# Test log rotation
sudo logrotate -d /etc/logrotate.d/cryb-platform

# Create monitoring summary
cat > "$MONITORING_DIR/monitoring-summary.txt" << EOF
CRYB Platform Monitoring Setup Complete
======================================
Date: $(date)

Monitoring Components:
✓ Prometheus - Metrics collection
✓ Grafana - Visualization dashboards  
✓ Alert Manager - Alert routing
✓ Node Exporter - System metrics
✓ Health Check Scripts - Application monitoring
✓ Log Rotation - Log management

Cron Jobs Installed:
- Health checks: Every minute
- System metrics: Every 5 minutes  
- Log cleanup: Daily at 2 AM

Access Points:
- Grafana: http://localhost:3005 (admin/admin)
- Prometheus: http://localhost:9090
- Uptime Kuma: http://localhost:3004

Next Steps:
1. Configure Grafana dashboards
2. Set up email/webhook alerts
3. Customize alert thresholds
4. Set up external monitoring
5. Configure log shipping (optional)

Health Check Command: $MONITORING_DIR/scripts/health-check.sh
System Monitor: $MONITORING_DIR/scripts/system-monitor.sh
EOF

success "🔍 Monitoring setup completed successfully!"
echo
echo "Monitoring Summary:"
cat "$MONITORING_DIR/monitoring-summary.txt"
echo
echo "Next steps:"
echo "1. Access Grafana at http://localhost:3005 (admin/admin)"
echo "2. Import dashboards for Node.js and PostgreSQL"
echo "3. Configure email alerts in Alert Manager"
echo "4. Set up external uptime monitoring"

log "Monitoring setup script completed!"