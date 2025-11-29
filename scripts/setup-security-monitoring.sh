#!/bin/bash

# ==============================================
# CRYB Platform Security Monitoring Setup
# ==============================================
# Comprehensive security monitoring deployment script
# Sets up Wazuh, Fail2Ban, Suricata, ClamAV, and OSQuery
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
LOGFILE="/var/log/cryb-security-setup.log"
exec 1> >(tee -a "$LOGFILE")
exec 2> >(tee -a "$LOGFILE" >&2)

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}CRYB Platform Security Monitoring Setup${NC}"
echo -e "${BLUE}===============================================${NC}"
echo "Started at: $(date)"
echo "Log file: $LOGFILE"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# Configuration
CRYB_ROOT="/home/ubuntu/cryb-platform"
SECURITY_DATA_ROOT="/opt/cryb"
BACKUP_DIR="/backup/security-monitoring"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check available disk space (need at least 10GB)
    available_space=$(df /opt | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 10485760 ]]; then
        log_warn "Less than 10GB available disk space. Security monitoring may face storage issues."
    fi
    
    log_info "Prerequisites check completed"
}

create_directories() {
    log_info "Creating security monitoring directories..."
    
    # Main security directories
    mkdir -p "$SECURITY_DATA_ROOT"/{wazuh,fail2ban,suricata,clamav,osquery,security-automation}
    mkdir -p "$SECURITY_DATA_ROOT"/wazuh/{manager,indexer,dashboard}/{config,data,logs}
    mkdir -p "$SECURITY_DATA_ROOT"/wazuh/manager/{queue,var/multigroups,integrations,active-response,agentless,wodles}
    mkdir -p "$SECURITY_DATA_ROOT"/wazuh/filebeat/{etc,var}
    mkdir -p "$SECURITY_DATA_ROOT"/suricata/{logs,lib,rules}
    mkdir -p "$SECURITY_DATA_ROOT"/osquery/logs
    
    # SSL certificates directory
    mkdir -p "$CRYB_ROOT"/config/wazuh/wazuh_indexer_ssl_certs
    
    # Logs directories
    mkdir -p /var/log/{wazuh,suricata,clamav,osquery,fail2ban}
    mkdir -p "$CRYB_ROOT"/logs/security
    
    # Backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Set permissions
    chown -R 1000:1000 "$SECURITY_DATA_ROOT"
    chmod -R 755 "$SECURITY_DATA_ROOT"
    
    log_info "Directories created successfully"
}

generate_ssl_certificates() {
    log_info "Generating SSL certificates for Wazuh..."
    
    CERT_DIR="$CRYB_ROOT/config/wazuh/wazuh_indexer_ssl_certs"
    
    if [[ ! -f "$CERT_DIR/root-ca.pem" ]]; then
        # Generate root CA
        openssl genrsa -out "$CERT_DIR/root-ca-key.pem" 2048
        openssl req -new -x509 -sha256 -key "$CERT_DIR/root-ca-key.pem" -out "$CERT_DIR/root-ca.pem" -days 365 \
            -subj "/C=US/ST=California/L=San Francisco/O=CRYB/OU=Security/CN=CRYB-CA"
        
        # Generate node certificates
        for node in wazuh.manager wazuh.indexer wazuh.dashboard admin; do
            openssl genrsa -out "$CERT_DIR/${node}-key.pem" 2048
            openssl req -new -key "$CERT_DIR/${node}-key.pem" -out "$CERT_DIR/${node}.csr" \
                -subj "/C=US/ST=California/L=San Francisco/O=CRYB/OU=Security/CN=${node}"
            openssl x509 -req -in "$CERT_DIR/${node}.csr" -CA "$CERT_DIR/root-ca.pem" \
                -CAkey "$CERT_DIR/root-ca-key.pem" -CAcreateserial -out "$CERT_DIR/${node}.pem" -days 365
            rm "$CERT_DIR/${node}.csr"
        done
        
        # Copy and rename for compatibility
        cp "$CERT_DIR/root-ca.pem" "$CERT_DIR/root-ca-manager.pem"
        
        chmod 644 "$CERT_DIR"/*.pem
        chown 1000:1000 "$CERT_DIR"/*.pem
        
        log_info "SSL certificates generated successfully"
    else
        log_info "SSL certificates already exist, skipping generation"
    fi
}

setup_suricata_rules() {
    log_info "Setting up Suricata rules..."
    
    RULES_DIR="$SECURITY_DATA_ROOT/suricata/rules"
    
    # Download Emerging Threats rules
    if [[ ! -f "$RULES_DIR/emerging.rules" ]]; then
        curl -L "https://rules.emergingthreats.net/open/suricata-6.0/emerging.rules.tar.gz" \
            -o /tmp/emerging-rules.tar.gz
        tar -xzf /tmp/emerging-rules.tar.gz -C /tmp
        cp /tmp/rules/*.rules "$RULES_DIR/"
        rm -rf /tmp/rules /tmp/emerging-rules.tar.gz
    fi
    
    # Create custom CRYB rules
    cat > "$RULES_DIR/cryb-custom.rules" << 'EOF'
# CRYB Platform Custom Security Rules

# API Security
alert http any any -> any any (msg:"CRYB API Authentication Bypass Attempt"; flow:established,to_server; content:"POST"; http_method; content:"/api/auth"; http_uri; content:"admin"; http_client_body; sid:1000001; rev:1;)
alert http any any -> any any (msg:"CRYB API SQL Injection Attempt"; flow:established,to_server; content:"api"; http_uri; pcre:"/(\x27|\x22|%27|%22).*(union|select|insert|delete|update|drop|exec|script)/i"; sid:1000002; rev:1;)
alert http any any -> any any (msg:"CRYB API XSS Attempt"; flow:established,to_server; content:"api"; http_uri; pcre:"/(<script|%3Cscript|javascript:|%6A%61%76%61%73%63%72%69%70%74%3A)/i"; sid:1000003; rev:1;)

# Web Application Security
alert http any any -> any any (msg:"CRYB Web Shell Upload Attempt"; flow:established,to_server; content:"POST"; http_method; content:"upload"; http_uri; content:".php"; http_client_body; sid:1000004; rev:1;)
alert http any any -> any any (msg:"CRYB Directory Traversal Attempt"; flow:established,to_server; content:"../"; http_uri; sid:1000005; rev:1;)
alert http any any -> any any (msg:"CRYB Command Injection Attempt"; flow:established,to_server; pcre:"/(cmd=|exec=|command=|shell=|system=)/i"; sid:1000006; rev:1;)

# Network Security
alert tcp any any -> any 22 (msg:"CRYB SSH Brute Force Attempt"; flow:established,to_server; content:"SSH-"; offset:0; depth:4; detection_filter:track by_src, count 5, seconds 60; sid:1000007; rev:1;)
alert tcp any any -> any 3002 (msg:"CRYB API Brute Force Attempt"; flow:established,to_server; content:"POST"; http_method; content:"login"; http_uri; detection_filter:track by_src, count 10, seconds 300; sid:1000008; rev:1;)

# Malware and Suspicious Activity
alert tcp any any -> any any (msg:"CRYB Suspicious Outbound Connection"; flow:established,from_server; content:"nc -e"; sid:1000009; rev:1;)
alert http any any -> any any (msg:"CRYB Cryptocurrency Mining Script"; flow:established,to_server; content:"coinhive"; http_uri; sid:1000010; rev:1;)
alert dns any any -> any any (msg:"CRYB DNS Tunneling Attempt"; dns_query; content:".cryb."; pcre:"/[a-f0-9]{32,}/"; sid:1000011; rev:1;)

# Docker and Container Security
alert tcp any any -> any 2375 (msg:"CRYB Unauthorized Docker API Access"; flow:established,to_server; content:"GET"; http_method; content:"/containers"; http_uri; sid:1000012; rev:1;)
alert tcp any any -> any 2376 (msg:"CRYB Docker TLS Attack"; flow:established,to_server; content:"docker"; sid:1000013; rev:1;)
EOF

    chown -R 1000:1000 "$RULES_DIR"
    log_info "Suricata rules configured successfully"
}

setup_fail2ban_jails() {
    log_info "Setting up Fail2Ban jails..."
    
    # Create Fail2Ban jail configuration for CRYB
    cat > /tmp/cryb-jail.local << 'EOF'
[DEFAULT]
# Global settings
bantime = 3600
findtime = 600
maxretry = 5
backend = auto
usedns = warn
logencoding = auto
enabled = false
mode = normal
filter = %(__name__)s[mode=%(mode)s]

# Email settings
destemail = security@cryb.ai
sender = fail2ban@cryb.ai
mta = sendmail
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5

[cryb-api]
enabled = true
port = 3002
filter = cryb-api
logpath = /home/ubuntu/cryb-platform/logs/api-error.log
maxretry = 5
bantime = 1800

[cryb-web]
enabled = true
port = http,https
filter = cryb-web
logpath = /var/log/nginx/access.log
maxretry = 10
bantime = 3600

[cryb-auth]
enabled = true
port = 3002,3003
filter = cryb-api
logpath = /home/ubuntu/cryb-platform/logs/api-security.log
maxretry = 5
bantime = 7200
findtime = 300
EOF

    # Store the jail configuration for later use
    mv /tmp/cryb-jail.local "$CRYB_ROOT/config/fail2ban/jail.local"
    
    log_info "Fail2Ban jails configured successfully"
}

create_security_scripts() {
    log_info "Creating security automation scripts..."
    
    # ClamAV quarantine script
    cat > /usr/local/bin/clamav-quarantine.sh << 'EOF'
#!/bin/bash
# ClamAV Quarantine Script for CRYB Platform

INFECTED_FILE="$1"
QUARANTINE_DIR="/var/quarantine"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create quarantine directory if it doesn't exist
mkdir -p "$QUARANTINE_DIR"

# Move infected file to quarantine
if [[ -f "$INFECTED_FILE" ]]; then
    FILENAME=$(basename "$INFECTED_FILE")
    mv "$INFECTED_FILE" "$QUARANTINE_DIR/${TIMESTAMP}_${FILENAME}"
    
    # Log the quarantine action
    echo "$(date): Quarantined $INFECTED_FILE to $QUARANTINE_DIR/${TIMESTAMP}_${FILENAME}" >> /var/log/clamav/quarantine.log
    
    # Send alert to security team
    echo "Malware detected and quarantined: $INFECTED_FILE" | \
        mail -s "CRYB Security Alert: Malware Detected" security@cryb.ai
fi
EOF

    chmod +x /usr/local/bin/clamav-quarantine.sh
    
    # Security monitoring health check script
    cat > /usr/local/bin/security-health-check.sh << 'EOF'
#!/bin/bash
# Security Monitoring Health Check Script

LOGFILE="/var/log/security-health-check.log"

check_service() {
    local service_name="$1"
    local container_name="$2"
    
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        echo "$(date): $service_name is running" >> "$LOGFILE"
        return 0
    else
        echo "$(date): $service_name is NOT running" >> "$LOGFILE"
        # Attempt to restart
        docker-compose -f /home/ubuntu/cryb-platform/docker-compose.security-monitoring.yml up -d "$container_name"
        return 1
    fi
}

# Check all security services
check_service "Wazuh Manager" "cryb-wazuh-manager"
check_service "Wazuh Indexer" "cryb-wazuh-indexer"
check_service "Wazuh Dashboard" "cryb-wazuh-dashboard"
check_service "Fail2Ban" "cryb-fail2ban"
check_service "Suricata" "cryb-suricata"
check_service "ClamAV" "cryb-clamav"
check_service "OSQuery" "cryb-osquery"
check_service "Security Exporter" "cryb-security-exporter"
check_service "Security Automation" "cryb-security-automation"

# Check disk space
DISK_USAGE=$(df /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 85 ]]; then
    echo "$(date): WARNING - Disk usage is at ${DISK_USAGE}%" >> "$LOGFILE"
    # Send alert
    echo "Security monitoring disk usage is at ${DISK_USAGE}%" | \
        mail -s "CRYB Security Alert: High Disk Usage" security@cryb.ai
fi
EOF

    chmod +x /usr/local/bin/security-health-check.sh
    
    # Add to crontab for automated health checks
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/security-health-check.sh") | crontab -
    
    log_info "Security scripts created successfully"
}

setup_log_rotation() {
    log_info "Setting up log rotation for security logs..."
    
    cat > /etc/logrotate.d/cryb-security << 'EOF'
/var/log/wazuh/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 wazuh wazuh
    postrotate
        /bin/kill -HUP `cat /var/run/wazuh/wazuh.pid 2> /dev/null` 2> /dev/null || true
    endscript
}

/var/log/suricata/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 suricata suricata
    postrotate
        /bin/kill -USR2 `cat /var/run/suricata.pid 2> /dev/null` 2> /dev/null || true
    endscript
}

/var/log/clamav/*.log {
    weekly
    missingok
    rotate 8
    compress
    delaycompress
    notifempty
    create 644 clamav clamav
}

/var/log/osquery/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 osquery osquery
}

/var/log/fail2ban/*.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /bin/systemctl reload fail2ban.service > /dev/null 2>&1 || true
    endscript
}

/home/ubuntu/cryb-platform/logs/security/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

    log_info "Log rotation configured successfully"
}

start_security_monitoring() {
    log_info "Starting security monitoring stack..."
    
    cd "$CRYB_ROOT"
    
    # Start the security monitoring stack
    docker-compose -f docker-compose.security-monitoring.yml up -d
    
    # Wait for services to start
    log_info "Waiting for services to initialize..."
    sleep 30
    
    # Check service status
    log_info "Checking service status..."
    docker-compose -f docker-compose.security-monitoring.yml ps
    
    log_info "Security monitoring stack started successfully"
}

create_backup_script() {
    log_info "Creating backup script for security data..."
    
    cat > /usr/local/bin/backup-security-data.sh << 'EOF'
#!/bin/bash
# Security Data Backup Script

BACKUP_ROOT="/backup/security-monitoring"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

# Backup Wazuh data
docker exec cryb-wazuh-manager tar czf - /var/ossec/etc /var/ossec/logs | \
    gzip > "$BACKUP_DIR/wazuh_config_$TIMESTAMP.tar.gz"

# Backup security configurations
tar czf "$BACKUP_DIR/security_configs_$TIMESTAMP.tar.gz" \
    /home/ubuntu/cryb-platform/config/wazuh \
    /home/ubuntu/cryb-platform/config/fail2ban \
    /home/ubuntu/cryb-platform/config/suricata \
    /home/ubuntu/cryb-platform/config/osquery \
    /home/ubuntu/cryb-platform/config/clamav

# Backup recent logs (last 7 days)
find /var/log/wazuh /var/log/suricata /var/log/clamav /var/log/osquery \
    -name "*.log" -mtime -7 -exec tar czf "$BACKUP_DIR/security_logs_$TIMESTAMP.tar.gz" {} +

# Cleanup old backups (keep last 7 days)
find "$BACKUP_ROOT" -type d -name "backup_*" -mtime +7 -exec rm -rf {} +

echo "$(date): Security backup completed: $BACKUP_DIR" >> /var/log/security-backup.log
EOF

    chmod +x /usr/local/bin/backup-security-data.sh
    
    # Schedule daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-security-data.sh") | crontab -
    
    log_info "Backup script created and scheduled"
}

setup_alerting_integration() {
    log_info "Setting up alerting integration with main monitoring stack..."
    
    # Add security monitoring targets to Prometheus
    cat >> "$CRYB_ROOT/config/prometheus/prometheus.yml" << 'EOF'

  # Security Monitoring Targets
  - job_name: 'security-exporter'
    static_configs:
      - targets: ['localhost:9200']
    scrape_interval: 30s
    metrics_path: /metrics

  - job_name: 'wazuh-manager'
    static_configs:
      - targets: ['wazuh-manager:55000']
    scrape_interval: 60s
    metrics_path: /api/experimental/metrics
    scheme: https
    tls_config:
      insecure_skip_verify: true
    basic_auth:
      username: wazuh-wui
      password: 'MyS3cr37P450r.*-'
EOF

    # Add security alerts to Prometheus alerting rules
    cat >> "$CRYB_ROOT/config/prometheus/alerts.yml" << 'EOF'

  # ==============================================
  # ENHANCED SECURITY ALERTS
  # ==============================================
  - name: cryb.enhanced_security
    rules:
      # Wazuh agent connectivity
      - alert: WazuhAgentDisconnected
        expr: wazuh_agents_connected < 1
        for: 5m
        labels:
          severity: warning
          alert_type: security_infrastructure
        annotations:
          summary: "Wazuh security agent disconnected"
          description: "Security monitoring agent has been disconnected for more than 5 minutes"
          runbook_url: "https://wiki.cryb.ai/runbooks/wazuh-agent-down"
      
      # High security alert rate
      - alert: HighSecurityAlertRate
        expr: rate(wazuh_alerts_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
          alert_type: security_incident
        annotations:
          summary: "High rate of security alerts detected"
          description: "Security alert rate is {{ $value }} alerts per second"
          runbook_url: "https://wiki.cryb.ai/runbooks/high-security-alerts"
      
      # Malware detection
      - alert: MalwareDetected
        expr: increase(clamav_threats_total[5m]) > 0
        for: 0m
        labels:
          severity: critical
          alert_type: security_threat
        annotations:
          summary: "Malware detected by ClamAV"
          description: "{{ $value }} malware threats detected in the last 5 minutes"
          runbook_url: "https://wiki.cryb.ai/runbooks/malware-response"
      
      # Network intrusion alerts
      - alert: NetworkIntrusionDetected
        expr: increase(suricata_alerts_total[5m]) > 5
        for: 1m
        labels:
          severity: warning
          alert_type: network_security
        annotations:
          summary: "Network intrusion detected"
          description: "{{ $value }} network intrusion alerts in the last 5 minutes"
          runbook_url: "https://wiki.cryb.ai/runbooks/network-intrusion"
      
      # Brute force attacks
      - alert: BruteForceAttackInProgress
        expr: increase(fail2ban_bans_total[5m]) > 3
        for: 1m
        labels:
          severity: warning
          alert_type: brute_force
        annotations:
          summary: "Brute force attack detected"
          description: "{{ $value }} IP addresses have been banned for brute force attempts"
          runbook_url: "https://wiki.cryb.ai/runbooks/brute-force-response"
      
      # Security service health
      - alert: SecurityServiceDown
        expr: up{job=~"security-.*"} == 0
        for: 2m
        labels:
          severity: critical
          alert_type: security_infrastructure
        annotations:
          summary: "Security monitoring service is down"
          description: "Security service {{ $labels.job }} on {{ $labels.instance }} is down"
          runbook_url: "https://wiki.cryb.ai/runbooks/security-service-down"
EOF

    log_info "Alerting integration configured successfully"
}

# Main execution
main() {
    log_info "Starting CRYB Platform Security Monitoring Setup"
    
    check_prerequisites
    create_directories
    generate_ssl_certificates
    setup_suricata_rules
    setup_fail2ban_jails
    create_security_scripts
    setup_log_rotation
    create_backup_script
    setup_alerting_integration
    start_security_monitoring
    
    log_info "Security monitoring setup completed successfully!"
    echo ""
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${GREEN}Security Monitoring Setup Complete!${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo ""
    echo "Services accessible at:"
    echo "• Wazuh Dashboard: https://localhost:5601"
    echo "• Security Metrics: http://localhost:9200/metrics"
    echo "• Security Automation API: http://localhost:3200/status"
    echo ""
    echo "Credentials:"
    echo "• Wazuh Dashboard: admin / SecurePass123!"
    echo "• Wazuh API: wazuh-wui / MyS3cr37P450r.*-"
    echo ""
    echo "Log files:"
    echo "• Setup log: $LOGFILE"
    echo "• Security logs: /var/log/{wazuh,suricata,clamav,osquery,fail2ban}/"
    echo ""
    echo "Next steps:"
    echo "1. Configure notification channels (Slack, email) in security automation"
    echo "2. Review and customize security rules and thresholds"
    echo "3. Set up Grafana dashboards for security visualization"
    echo "4. Test incident response procedures"
    echo ""
}

# Execute main function
main "$@"