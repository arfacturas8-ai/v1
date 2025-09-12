#!/bin/bash

# ==============================================
# CRYB PLATFORM - CENTRALIZED LOGGING SETUP
# ==============================================
# Production-ready logging infrastructure
# Features:
# - Log aggregation with Loki
# - Log shipping with Promtail
# - Log rotation and retention
# - Security and compliance
# - Real-time log monitoring
# ==============================================

set -euo pipefail

# Configuration
LOG_DIR="/var/log/cryb"
LOKI_CONFIG="/etc/loki/loki-config.yaml"
PROMTAIL_CONFIG="/etc/promtail/promtail-config.yaml"
LOGROTATE_CONFIG="/etc/logrotate.d/cryb-platform"

# Log retention settings
LOG_RETENTION_DAYS=30
LOG_MAX_SIZE="100M"
LOG_ROTATE_COUNT=7

# ==============================================
# LOGGING FUNCTIONS
# ==============================================
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1"
}

# ==============================================
# SETUP FUNCTIONS
# ==============================================
setup_log_directories() {
    log_info "Setting up logging directories..."
    
    # Create main log directories
    mkdir -p "$LOG_DIR"/{api,web,nginx,postgres,redis,elasticsearch,monitoring}
    mkdir -p /var/log/{loki,promtail}
    mkdir -p /etc/{loki,promtail}
    
    # Set proper permissions
    chmod 755 "$LOG_DIR"
    chown -R syslog:adm "$LOG_DIR" 2>/dev/null || true
    
    log_success "Log directories created"
}

configure_loki() {
    log_info "Configuring Loki for log aggregation..."
    
    cat > "$LOKI_CONFIG" << 'EOF'
# ==============================================
# LOKI CONFIGURATION - PRODUCTION
# ==============================================

auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096
  log_level: info

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

# Retention and compaction
limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h  # 1 week
  retention_period: 720h  # 30 days
  max_query_length: 12000h  # 500 days
  max_query_parallelism: 16
  max_streams_per_user: 10000
  max_line_size: 256000

# Table manager for retention
table_manager:
  retention_deletes_enabled: true
  retention_period: 720h  # 30 days

# Compactor
compactor:
  working_directory: /loki/compactor
  shared_store: filesystem
  compaction_interval: 10m
  retention_enabled: true
  retention_delete_delay: 2h
  retention_delete_worker_count: 150

# Frontend
frontend:
  log_queries_longer_than: 5s
  compress_responses: true
  tail_proxy_url: http://localhost:3100

# Query frontend
query_scheduler:
  max_outstanding_requests_per_tenant: 256

# Limits
chunk_store_config:
  max_look_back_period: 0s

ingester:
  chunk_idle_period: 3m
  chunk_block_size: 262144
  chunk_retain_period: 1m
  max_transfer_retries: 0
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  wal:
    enabled: true
    dir: /loki/wal
EOF

    chmod 644 "$LOKI_CONFIG"
    log_success "Loki configuration created"
}

configure_promtail() {
    log_info "Configuring Promtail for log shipping..."
    
    cat > "$PROMTAIL_CONFIG" << 'EOF'
# ==============================================
# PROMTAIL CONFIGURATION - PRODUCTION
# ==============================================

server:
  http_listen_port: 9080
  grpc_listen_port: 0
  log_level: info

positions:
  filename: /var/log/promtail/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push
    tenant_id: cryb-platform

scrape_configs:
  # ==============================================
  # APPLICATION LOGS
  # ==============================================
  
  # API Service Logs
  - job_name: cryb-api
    static_configs:
      - targets:
          - localhost
        labels:
          job: cryb-api
          environment: production
          service: api
          __path__: /var/log/cryb/api/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            timestamp: time
            message: msg
            service: service
      - labels:
          level:
          service:
      - timestamp:
          source: timestamp
          format: RFC3339
      - output:
          source: message

  # Web Application Logs
  - job_name: cryb-web
    static_configs:
      - targets:
          - localhost
        labels:
          job: cryb-web
          environment: production
          service: web
          __path__: /var/log/cryb/web/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            timestamp: timestamp
            message: message
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: RFC3339

  # Nginx Access Logs
  - job_name: nginx-access
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-access
          environment: production
          service: nginx
          log_type: access
          __path__: /var/log/nginx/access.log
    pipeline_stages:
      - regex:
          expression: '^(?P<remote_addr>[\d\.]+) - (?P<remote_user>[^ ]*) \[(?P<time_local>[^\]]*)\] "(?P<method>[A-Z]+) (?P<request_uri>[^ ]*) (?P<http_version>[^"]*)" (?P<status>\d+) (?P<body_bytes_sent>\d+) "(?P<http_referer>[^"]*)" "(?P<http_user_agent>[^"]*)"'
      - labels:
          method:
          status:
          remote_addr:
      - timestamp:
          source: time_local
          format: "02/Jan/2006:15:04:05 -0700"

  # Nginx Error Logs
  - job_name: nginx-error
    static_configs:
      - targets:
          - localhost
        labels:
          job: nginx-error
          environment: production
          service: nginx
          log_type: error
          __path__: /var/log/nginx/error.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[(?P<level>[^\]]*)\] (?P<pid>\d+)#(?P<tid>\d+): (?P<message>.*)'
      - labels:
          level:
      - timestamp:
          source: timestamp
          format: "2006/01/02 15:04:05"

  # ==============================================
  # DATABASE LOGS
  # ==============================================
  
  # PostgreSQL Logs
  - job_name: postgresql
    static_configs:
      - targets:
          - localhost
        labels:
          job: postgresql
          environment: production
          service: postgres
          __path__: /var/log/postgresql/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} [A-Z]{3}) \[(?P<pid>\d+)\] (?P<user>[^@]*)@(?P<database>[^ ]*) (?P<level>[A-Z]+):  (?P<message>.*)'
      - labels:
          level:
          database:
          user:
      - timestamp:
          source: timestamp
          format: "2006-01-02 15:04:05.000 MST"

  # Redis Logs
  - job_name: redis
    static_configs:
      - targets:
          - localhost
        labels:
          job: redis
          environment: production
          service: redis
          __path__: /var/log/redis/*.log
    pipeline_stages:
      - regex:
          expression: '^(?P<pid>\d+):(?P<role>[^ ]*) (?P<timestamp>\d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2}.\d{3}) (?P<level>[*#-]) (?P<message>.*)'
      - labels:
          level:
          role:
      - timestamp:
          source: timestamp
          format: "02 Jan 2006 15:04:05.000"

  # ==============================================
  # MONITORING LOGS
  # ==============================================
  
  # Prometheus Logs
  - job_name: prometheus
    static_configs:
      - targets:
          - localhost
        labels:
          job: prometheus
          environment: production
          service: prometheus
          __path__: /var/log/prometheus/*.log

  # Grafana Logs
  - job_name: grafana
    static_configs:
      - targets:
          - localhost
        labels:
          job: grafana
          environment: production
          service: grafana
          __path__: /var/log/grafana/*.log

  # ==============================================
  # SYSTEM LOGS
  # ==============================================
  
  # System Messages
  - job_name: syslog
    static_configs:
      - targets:
          - localhost
        labels:
          job: syslog
          environment: production
          service: system
          __path__: /var/log/syslog
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>[A-Z][a-z]{2} [ \d]\d \d{2}:\d{2}:\d{2}) (?P<hostname>[^ ]*) (?P<service>[^:[\]]*):? ?(?P<message>.*)'
      - labels:
          service:
          hostname:
      - timestamp:
          source: timestamp
          format: "Jan _2 15:04:05"

  # Docker Container Logs
  - job_name: docker-containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker-containers
          environment: production
          __path__: /var/lib/docker/containers/*/*-json.log
    pipeline_stages:
      - json:
          expressions:
            message: log
            stream: stream
            timestamp: time
      - timestamp:
          source: timestamp
          format: RFC3339Nano
      - labels:
          stream:
      - output:
          source: message

  # ==============================================
  # SECURITY LOGS
  # ==============================================
  
  # Authentication Logs
  - job_name: auth-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: auth-logs
          environment: production
          service: auth
          log_type: security
          __path__: /var/log/auth.log
    pipeline_stages:
      - regex:
          expression: '^(?P<timestamp>[A-Z][a-z]{2} [ \d]\d \d{2}:\d{2}:\d{2}) (?P<hostname>[^ ]*) (?P<service>[^:[\]]*):? ?(?P<message>.*)'
      - labels:
          service:
      - timestamp:
          source: timestamp
          format: "Jan _2 15:04:05"

# ==============================================
# LIMITS AND PERFORMANCE
# ==============================================
limits_config:
  readline_rate: 10000
  readline_burst: 20000

target_config:
  sync_period: 10s
EOF

    chmod 644 "$PROMTAIL_CONFIG"
    log_success "Promtail configuration created"
}

configure_logrotate() {
    log_info "Configuring log rotation..."
    
    cat > "$LOGROTATE_CONFIG" << EOF
# ==============================================
# CRYB PLATFORM LOG ROTATION
# ==============================================

# Application logs
$LOG_DIR/api/*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    size $LOG_MAX_SIZE
    postrotate
        docker kill -s USR1 \$(docker ps -q --filter "name=cryb-api") 2>/dev/null || true
    endscript
}

$LOG_DIR/web/*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    size $LOG_MAX_SIZE
}

# Nginx logs
/var/log/nginx/*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    size $LOG_MAX_SIZE
    postrotate
        docker kill -s USR1 \$(docker ps -q --filter "name=cryb-nginx") 2>/dev/null || true
    endscript
}

# Database logs
/var/log/postgresql/*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 postgres postgres
    size $LOG_MAX_SIZE
}

# Monitoring logs
/var/log/{prometheus,grafana,loki,promtail}/*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 nobody nogroup
    size $LOG_MAX_SIZE
}

# System logs specific to CRYB
/var/log/cryb-*.log {
    daily
    missingok
    rotate $LOG_ROTATE_COUNT
    compress
    delaycompress
    notifempty
    create 644 syslog adm
    size $LOG_MAX_SIZE
}
EOF

    chmod 644 "$LOGROTATE_CONFIG"
    log_success "Log rotation configured"
}

setup_log_forwarding() {
    log_info "Setting up log forwarding..."
    
    # Configure rsyslog for centralized logging
    cat > "/etc/rsyslog.d/49-cryb-platform.conf" << 'EOF'
# CRYB Platform Logging Configuration

# Application logs
:programname, isequal, "cryb-api" /var/log/cryb/api/api.log
:programname, isequal, "cryb-web" /var/log/cryb/web/web.log
:programname, isequal, "cryb-worker" /var/log/cryb/api/worker.log

# Stop processing after handling CRYB logs
& stop
EOF

    # Restart rsyslog
    systemctl restart rsyslog 2>/dev/null || service rsyslog restart 2>/dev/null || true
    
    log_success "Log forwarding configured"
}

create_log_monitoring_alerts() {
    log_info "Creating log monitoring alerts..."
    
    cat > "/etc/prometheus/rules/log-alerts.yml" << 'EOF'
# ==============================================
# LOG-BASED ALERTING RULES
# ==============================================

groups:
  - name: log-alerts
    rules:
      # High error rate in API logs
      - alert: HighAPIErrorRate
        expr: rate(loki_log_entries_total{job="cryb-api",level="error"}[5m]) > 10
        for: 2m
        labels:
          severity: warning
          service: api
        annotations:
          summary: "High error rate in API logs"
          description: "API is generating errors at {{ $value }} errors per second for more than 2 minutes"

      # Database connection errors
      - alert: DatabaseConnectionErrors
        expr: increase(loki_log_entries_total{job="cryb-api",level="error"}[5m]) and on() loki_log_entries_total{job="cryb-api"} =~ ".*database.*connection.*"
        for: 1m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "Database connection errors detected"
          description: "API is experiencing database connection issues"

      # Authentication failures
      - alert: AuthenticationFailures
        expr: increase(loki_log_entries_total{job="auth-logs"}[5m]) and on() loki_log_entries_total{job="auth-logs"} =~ ".*authentication.*failed.*"
        for: 5m
        labels:
          severity: warning
          service: auth
        annotations:
          summary: "High number of authentication failures"
          description: "Unusual number of authentication failures detected"

      # Nginx 5xx errors
      - alert: NginxServerErrors
        expr: rate(loki_log_entries_total{job="nginx-access",status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
          service: nginx
        annotations:
          summary: "High rate of Nginx server errors"
          description: "Nginx is returning {{ $value }} server errors per second"

      # Log ingestion issues
      - alert: LogIngestionDown
        expr: absent(up{job="promtail"}) or up{job="promtail"} == 0
        for: 5m
        labels:
          severity: warning
          service: logging
        annotations:
          summary: "Log ingestion is down"
          description: "Promtail is not running or not reachable"

      # Disk space for logs
      - alert: LogDiskSpaceHigh
        expr: (node_filesystem_size_bytes{mountpoint="/var/log"} - node_filesystem_free_bytes{mountpoint="/var/log"}) / node_filesystem_size_bytes{mountpoint="/var/log"} > 0.85
        for: 5m
        labels:
          severity: warning
          service: system
        annotations:
          summary: "Log disk space usage high"
          description: "Log partition is {{ $value | humanizePercentage }} full"
EOF

    chmod 644 "/etc/prometheus/rules/log-alerts.yml"
    log_success "Log monitoring alerts created"
}

setup_log_analysis_tools() {
    log_info "Setting up log analysis tools..."
    
    # Create log analysis scripts
    cat > "/usr/local/bin/cryb-log-analyzer" << 'EOF'
#!/bin/bash

# CRYB Platform Log Analyzer
# Quick analysis of application logs

LOG_DIR="/var/log/cryb"

case "$1" in
    "errors")
        echo "Recent errors across all services:"
        find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -l "ERROR\|error\|Error" {} \; | \
        xargs tail -n 100 | grep -E "(ERROR|error|Error)" | tail -20
        ;;
    "performance")
        echo "Performance-related log entries:"
        find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -l "slow\|timeout\|performance" {} \; | \
        xargs tail -n 100 | grep -E "(slow|timeout|performance)" | tail -20
        ;;
    "security")
        echo "Security-related log entries:"
        grep -r "authentication\|authorization\|security\|unauthorized" /var/log/auth.log /var/log/cryb/ 2>/dev/null | tail -20
        ;;
    "stats")
        echo "Log statistics (last 24 hours):"
        echo "Total log entries: $(find "$LOG_DIR" -name "*.log" -mtime -1 -exec wc -l {} \; | awk '{sum+=$1} END {print sum}')"
        echo "Error entries: $(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -c "ERROR\|error\|Error" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}')"
        echo "Warning entries: $(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -c "WARN\|warn\|Warning" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}')"
        ;;
    *)
        echo "Usage: $0 {errors|performance|security|stats}"
        echo ""
        echo "Commands:"
        echo "  errors      - Show recent error messages"
        echo "  performance - Show performance-related messages"
        echo "  security    - Show security-related messages"
        echo "  stats       - Show log statistics"
        ;;
esac
EOF

    chmod +x "/usr/local/bin/cryb-log-analyzer"
    
    log_success "Log analysis tools installed"
}

# ==============================================
# MAIN SETUP PROCESS
# ==============================================
main() {
    log_info "=========================================="
    log_info "Setting up CRYB Platform Centralized Logging"
    log_info "=========================================="
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Setup logging infrastructure
    setup_log_directories
    configure_loki
    configure_promtail
    configure_logrotate
    setup_log_forwarding
    create_log_monitoring_alerts
    setup_log_analysis_tools
    
    # Test log rotation
    logrotate -d "$LOGROTATE_CONFIG" >/dev/null 2>&1 && log_success "Log rotation test passed" || log_error "Log rotation test failed"
    
    log_success "=========================================="
    log_success "Centralized logging setup completed!"
    log_success "=========================================="
    log_info "Next steps:"
    log_info "1. Start Loki and Promtail containers: docker-compose -f docker-compose.monitoring.yml up -d loki promtail"
    log_info "2. Configure applications to log to $LOG_DIR"
    log_info "3. Access logs via Grafana: http://localhost:3002"
    log_info "4. Use log analyzer: cryb-log-analyzer stats"
    log_info "=========================================="
}

# Execute main function
main "$@"