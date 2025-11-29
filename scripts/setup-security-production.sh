#!/bin/bash
# CRYB Platform Production Security Hardening Script
# Implements comprehensive security measures for production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PLATFORM_DIR="/home/ubuntu/cryb-platform"
SECURITY_DIR="$PLATFORM_DIR/security"

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

# Check if running as ubuntu user
if [[ $USER != "ubuntu" ]]; then
    error "This script must be run as ubuntu user (uses sudo where needed)"
    exit 1
fi

log "🔒 Starting CRYB Platform Security Hardening..."

# Create security directory
mkdir -p "$SECURITY_DIR"/{firewall,fail2ban,monitoring}

# Phase 1: Firewall Configuration (UFW)
log "Phase 1: Configuring firewall (UFW)..."

# Install UFW if not present
if ! command -v ufw &> /dev/null; then
    log "Installing UFW..."
    sudo apt update
    sudo apt install -y ufw
fi

# Reset UFW to defaults
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH access (port 22)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Application ports (local access only)
sudo ufw allow from 127.0.0.1 to any port 3001  # API
sudo ufw allow from 127.0.0.1 to any port 3003  # Web
sudo ufw allow from 127.0.0.1 to any port 5432  # PostgreSQL
sudo ufw allow from 127.0.0.1 to any port 5433  # TimescaleDB
sudo ufw allow from 127.0.0.1 to any port 6379  # Redis
sudo ufw allow from 127.0.0.1 to any port 6380  # Redis
sudo ufw allow from 127.0.0.1 to any port 9200  # Elasticsearch
sudo ufw allow from 127.0.0.1 to any port 9201  # Elasticsearch

# Monitoring ports (local access only)
sudo ufw allow from 127.0.0.1 to any port 3004  # Uptime Kuma
sudo ufw allow from 127.0.0.1 to any port 3005  # Grafana
sudo ufw allow from 127.0.0.1 to any port 9090  # Prometheus
sudo ufw allow from 127.0.0.1 to any port 9093  # AlertManager

# LiveKit ports (if needed externally for WebRTC)
sudo ufw allow 7880/tcp  # LiveKit HTTP
sudo ufw allow 7881/tcp  # LiveKit HTTPS
sudo ufw allow 7882/udp  # LiveKit UDP

# WebRTC port range for LiveKit (if needed)
sudo ufw allow 50000:60000/udp

# Enable UFW
sudo ufw --force enable

# Create firewall status script
cat > "$SECURITY_DIR/firewall/ufw-status.sh" << 'EOF'
#!/bin/bash
echo "=== UFW Status ==="
sudo ufw status verbose
echo
echo "=== UFW Rules ==="
sudo ufw show added
EOF

chmod +x "$SECURITY_DIR/firewall/ufw-status.sh"

success "Firewall configured successfully"

# Phase 2: Fail2Ban Configuration
log "Phase 2: Setting up Fail2Ban..."

# Install Fail2Ban
if ! command -v fail2ban-server &> /dev/null; then
    log "Installing Fail2Ban..."
    sudo apt install -y fail2ban
fi

# Create custom Fail2Ban configuration for Nginx
sudo tee /etc/fail2ban/jail.d/cryb-platform.conf << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = auto

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 1800
EOF

# Create API-specific Fail2Ban filter
sudo tee /etc/fail2ban/filter.d/cryb-api.conf << 'EOF'
[Definition]
failregex = ^<HOST> - - \[.*\] "(GET|POST|PUT|DELETE) /api/.* HTTP/.*" (4\d{2}|5\d{2})
ignoreregex = ^<HOST> - - \[.*\] "(GET|POST) /api/health.* HTTP/.*" 200
EOF

# Add API jail to configuration
sudo tee -a /etc/fail2ban/jail.d/cryb-platform.conf << 'EOF'

[cryb-api]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
filter = cryb-api
maxretry = 20
bantime = 1800
findtime = 300
EOF

# Restart Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

success "Fail2Ban configured successfully"

# Phase 3: System Hardening
log "Phase 3: Implementing system hardening..."

# Disable unused network protocols
sudo tee /etc/modprobe.d/blacklist-rare-protocols.conf << 'EOF'
# Disable rare network protocols
install dccp /bin/true
install sctp /bin/true
install rds /bin/true
install tipc /bin/true
EOF

# Kernel security parameters
sudo tee /etc/sysctl.d/99-cryb-security.conf << 'EOF'
# CRYB Platform Security Configuration

# Network Security
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# IPv6 Security
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Kernel Security
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1
kernel.core_uses_pid = 1

# File System Security
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
EOF

# Apply kernel parameters
sudo sysctl -p /etc/sysctl.d/99-cryb-security.conf

# Phase 4: SSH Hardening
log "Phase 4: Hardening SSH configuration..."

# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Create secure SSH configuration
sudo tee /etc/ssh/sshd_config.d/cryb-security.conf << 'EOF'
# CRYB Platform SSH Security Configuration

# Authentication
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
PubkeyAuthentication yes
AuthenticationMethods publickey

# Protocol and Encryption
Protocol 2
KexAlgorithms curve25519-sha256@libssh.org,ecdh-sha2-nistp521,ecdh-sha2-nistp384,ecdh-sha2-nistp256,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512

# Connection Limits
MaxAuthTries 3
MaxSessions 10
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60

# Access Control
AllowUsers ubuntu
PermitRootLogin no
PermitEmptyPasswords no
X11Forwarding no
AllowTcpForwarding no
AllowStreamLocalForwarding no
GatewayPorts no

# Logging
SyslogFacility AUTHPRIV
LogLevel INFO
EOF

# Test SSH configuration
if sudo sshd -t; then
    sudo systemctl restart ssh
    success "SSH hardening completed successfully"
else
    error "SSH configuration test failed - reverting"
    sudo mv /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
fi

# Phase 5: Application Security
log "Phase 5: Configuring application security..."

# Create security monitoring script
cat > "$SECURITY_DIR/monitoring/security-monitor.sh" << 'EOF'
#!/bin/bash
# Security monitoring script for CRYB Platform

LOG_FILE="/home/ubuntu/cryb-platform/logs/security-monitor.log"
PLATFORM_DIR="/home/ubuntu/cryb-platform"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check for failed login attempts
check_failed_logins() {
    local failed_count=$(grep "Failed password" /var/log/auth.log | grep "$(date +%Y-%m-%d)" | wc -l)
    if [ "$failed_count" -gt 10 ]; then
        log "WARNING: $failed_count failed login attempts today"
    fi
}

# Check for unusual network connections
check_network_connections() {
    local external_connections=$(netstat -tn 2>/dev/null | grep :22 | grep -v 127.0.0.1 | wc -l)
    if [ "$external_connections" -gt 5 ]; then
        log "WARNING: $external_connections external SSH connections"
    fi
}

# Check file permissions on sensitive files
check_file_permissions() {
    local sensitive_files=(
        "/home/ubuntu/cryb-platform/.env.production"
        "/home/ubuntu/cryb-platform/ecosystem.config.js"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ]; then
            local perms=$(stat -c %a "$file")
            if [ "$perms" != "600" ] && [ "$perms" != "644" ]; then
                log "WARNING: $file has permissions $perms"
            fi
        fi
    done
}

# Check for suspicious processes
check_processes() {
    local suspicious_processes=$(ps aux | grep -E "(cryptominer|bitcoin|mining)" | grep -v grep | wc -l)
    if [ "$suspicious_processes" -gt 0 ]; then
        log "CRITICAL: Suspicious processes detected"
        ps aux | grep -E "(cryptominer|bitcoin|mining)" >> "$LOG_FILE"
    fi
}

# Check disk usage for potential attacks
check_disk_usage() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log "WARNING: Disk usage at $disk_usage%"
    fi
}

# Main monitoring function
main() {
    log "=== Security Monitor Check ==="
    check_failed_logins
    check_network_connections  
    check_file_permissions
    check_processes
    check_disk_usage
    log "=== Monitor Check Complete ==="
}

main "$@"
EOF

chmod +x "$SECURITY_DIR/monitoring/security-monitor.sh"

# Phase 6: Docker Security
log "Phase 6: Implementing Docker security..."

# Create Docker daemon configuration for security
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "userns-remap": "default"
}
EOF

# Restart Docker with new configuration
sudo systemctl restart docker

# Phase 7: Log Monitoring
log "Phase 7: Setting up log monitoring..."

# Create log monitoring configuration
sudo tee /etc/rsyslog.d/50-cryb-platform.conf << 'EOF'
# CRYB Platform Log Configuration

# Application logs
$template CrybLogFormat,"%timegenerated% %HOSTNAME% %syslogtag% %msg%\n"
if $programname startswith 'cryb-' then /home/ubuntu/cryb-platform/logs/security.log;CrybLogFormat
& stop

# Security events
auth,authpriv.*  /home/ubuntu/cryb-platform/logs/auth-security.log
EOF

sudo systemctl restart rsyslog

# Phase 8: Create security monitoring cron jobs
log "Phase 8: Setting up security monitoring..."

# Security monitoring every 10 minutes
(crontab -l 2>/dev/null | grep -v "security-monitor.sh"; echo "*/10 * * * * $SECURITY_DIR/monitoring/security-monitor.sh") | crontab -

# Fail2Ban status check daily
(crontab -l 2>/dev/null | grep -v "fail2ban-client status"; echo "0 9 * * * /usr/bin/fail2ban-client status | logger -t cryb-security") | crontab -

# UFW status check daily
(crontab -l 2>/dev/null | grep -v "ufw status"; echo "0 9 * * * sudo ufw status | logger -t cryb-firewall") | crontab -

# Phase 9: Create security dashboard
cat > "$SECURITY_DIR/security-status.sh" << 'EOF'
#!/bin/bash
# CRYB Platform Security Status Dashboard

echo "======================================="
echo "CRYB Platform Security Status"
echo "======================================="
echo "Generated: $(date)"
echo

echo "=== Firewall Status ==="
sudo ufw status numbered
echo

echo "=== Fail2Ban Status ==="
sudo fail2ban-client status
echo

echo "=== SSH Security ==="
echo "SSH connections: $(who | wc -l)"
echo "Failed logins today: $(grep "Failed password" /var/log/auth.log | grep "$(date +%Y-%m-%d)" | wc -l)"
echo

echo "=== System Security ==="
echo "Load average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk usage: $(df / | tail -1 | awk '{print $5}')"
echo

echo "=== Docker Security ==="
echo "Running containers: $(docker ps -q | wc -l)"
echo "Docker root access: $(docker info 2>/dev/null | grep -q 'rootless' && echo 'No' || echo 'Yes')"
echo

echo "=== Certificate Status ==="
if [ -f "/etc/letsencrypt/live/cryb.ai/fullchain.pem" ]; then
    echo "SSL Certificate: Valid"
    echo "Expires: $(openssl x509 -in /etc/letsencrypt/live/cryb.ai/fullchain.pem -noout -dates | grep notAfter | cut -d= -f2)"
else
    echo "SSL Certificate: Not found"
fi
echo

echo "=== Application Status ==="
echo "PM2 processes: $(pm2 list 2>/dev/null | grep online | wc -l)"
echo "Nginx status: $(systemctl is-active nginx)"
echo

echo "=== Recent Security Events ==="
if [ -f "/home/ubuntu/cryb-platform/logs/security-monitor.log" ]; then
    tail -10 "/home/ubuntu/cryb-platform/logs/security-monitor.log"
else
    echo "No security events logged yet"
fi
echo

echo "======================================="
EOF

chmod +x "$SECURITY_DIR/security-status.sh"

# Phase 10: Create incident response guide
cat > "$SECURITY_DIR/incident-response.md" << 'EOF'
# CRYB Platform Security Incident Response

## Immediate Response Procedures

### 1. Security Breach Detected
```bash
# Immediately stop all services
pm2 stop all
sudo systemctl stop nginx

# Check active connections
sudo netstat -tulnp
sudo ss -tulnp

# Review recent logs
tail -100 /var/log/auth.log
tail -100 /home/ubuntu/cryb-platform/logs/security-monitor.log
```

### 2. DDoS Attack
```bash
# Check connection counts
sudo netstat -an | grep :80 | wc -l
sudo netstat -an | grep :443 | wc -l

# Block suspicious IPs
sudo ufw insert 1 deny from SUSPICIOUS_IP

# Enable rate limiting
sudo fail2ban-client set nginx-limit-req banip SUSPICIOUS_IP
```

### 3. Unauthorized Access
```bash
# Check current users
who
w

# Review SSH access
sudo grep "Accepted" /var/log/auth.log | tail -20

# Force disconnect suspicious sessions
sudo pkill -u SUSPICIOUS_USER
```

### 4. Data Breach Response
```bash
# Immediate backup
/home/ubuntu/cryb-platform/backups/scripts/backup-all.sh

# Isolate affected systems
sudo ufw default deny incoming
sudo ufw default deny outgoing

# Preserve evidence
cp /var/log/auth.log /home/ubuntu/evidence/
cp -r /home/ubuntu/cryb-platform/logs/ /home/ubuntu/evidence/
```

## Emergency Contacts
- System Administrator: admin@cryb.ai
- Security Team: security@cryb.ai
- Legal Team: legal@cryb.ai

## Recovery Procedures
1. Assess damage scope
2. Restore from clean backup
3. Update all passwords/secrets
4. Apply security patches
5. Monitor for continued threats

## Post-Incident Actions
1. Document incident timeline
2. Update security measures
3. Review and improve procedures
4. Conduct security audit
5. Train team on lessons learned
EOF

success "🔒 Security hardening completed successfully!"

# Generate security summary
cat > "$SECURITY_DIR/security-summary.txt" << EOF
CRYB Platform Security Hardening Complete
==========================================
Date: $(date)

Security Measures Implemented:
✓ UFW Firewall - Restrictive rules
✓ Fail2Ban - Intrusion prevention
✓ SSH Hardening - Key-only access
✓ System Hardening - Kernel parameters
✓ Docker Security - Daemon configuration
✓ Log Monitoring - Centralized logging
✓ Security Monitoring - Automated checks
✓ Incident Response - Procedures documented

Firewall Rules:
- SSH: Port 22 (public)
- HTTP/HTTPS: Ports 80/443 (public)
- Application ports: Local access only
- LiveKit: Ports 7880-7882 (public for WebRTC)
- WebRTC: Ports 50000-60000/udp (public)

Monitoring:
- Security checks: Every 10 minutes
- Fail2Ban status: Daily at 9 AM
- Firewall status: Daily at 9 AM

Commands:
- Security status: $SECURITY_DIR/security-status.sh
- Firewall status: $SECURITY_DIR/firewall/ufw-status.sh
- Security monitor: $SECURITY_DIR/monitoring/security-monitor.sh

Logs:
- Security events: /home/ubuntu/cryb-platform/logs/security-monitor.log
- Auth events: /home/ubuntu/cryb-platform/logs/auth-security.log
- Fail2Ban: /var/log/fail2ban.log

Next Steps:
1. Test all security measures
2. Configure external security monitoring
3. Set up security alerts/notifications
4. Conduct penetration testing
5. Review security policies regularly
EOF

echo
echo "=================================================="
success "🔒 Security Hardening Complete!"
echo
cat "$SECURITY_DIR/security-summary.txt"
echo
echo "Security Status Dashboard: $SECURITY_DIR/security-status.sh"
echo "Incident Response Guide: $SECURITY_DIR/incident-response.md"
echo "=================================================="

log "Security hardening script completed successfully!"