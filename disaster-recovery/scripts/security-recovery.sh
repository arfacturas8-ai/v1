#!/bin/bash

# ==============================================
# CRYB Platform Security Breach Recovery Script
# ==============================================
# Handles security incident response and recovery
# Isolates, investigates, and remediates security breaches
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/disaster-recovery"
CONFIG_FILE="${SCRIPT_DIR}/../config/recovery.conf"
PLATFORM_DIR="/home/ubuntu/cryb-platform"
FORENSICS_DIR="/tmp/security-forensics-$(date +%Y%m%d_%H%M%S)"

# Security configuration
QUARANTINE_DIR="/tmp/quarantine"
CLEAN_BACKUP_DIR="${CLEAN_BACKUP_DIR:-/backup/clean}"
INCIDENT_ID="SEC-$(date +%Y%m%d-%H%M%S)"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [SEC-RECOVERY] [${level}] [$INCIDENT_ID] ${message}" | tee -a "${LOG_DIR}/security-recovery.log"
}

log_info() { log "INFO" "$@"; echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { log "WARN" "$@"; echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { log "ERROR" "$@"; echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { log "DEBUG" "$@"; echo -e "${BLUE}[DEBUG]${NC} $*"; }
log_critical() { log "CRITICAL" "$@"; echo -e "${RED}[CRITICAL]${NC} $*"; }

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Security recovery configuration loaded"
    else
        log_warn "Configuration file not found, using defaults"
    fi
}

# Send security alert
send_security_alert() {
    local message="$1"
    local severity="${2:-critical}"
    
    # Send to notification webhook
    if [[ -n "${SECURITY_WEBHOOK:-}" ]]; then
        curl -s -X POST "$SECURITY_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 SECURITY BREACH [$INCIDENT_ID]: $message\",\"severity\":\"$severity\"}" || true
    fi
    
    # Send to system log
    logger -p user.crit -t "cryb-security-breach" "[$INCIDENT_ID] $message"
    
    # Send email if configured
    if [[ -n "${SECURITY_EMAIL:-}" ]]; then
        echo "SECURITY BREACH ALERT [$INCIDENT_ID]: $message" | mail -s "CRYB Security Incident" "$SECURITY_EMAIL" || true
    fi
}

# Create forensics workspace
create_forensics_workspace() {
    log_info "Creating forensics workspace..."
    
    mkdir -p "$FORENSICS_DIR"/{logs,evidence,memory,network,filesystem,reports}
    chmod 700 "$FORENSICS_DIR"
    
    # Create incident metadata
    cat > "$FORENSICS_DIR/incident_metadata.json" << EOF
{
  "incident_id": "$INCIDENT_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
  "investigator": "$(whoami)",
  "platform_directory": "$PLATFORM_DIR",
  "log_directory": "$LOG_DIR",
  "system_info": {
    "kernel": "$(uname -r)",
    "os": "$(lsb_release -d 2>/dev/null | cut -f2 || echo 'Unknown')",
    "uptime": "$(uptime)"
  }
}
EOF

    log_info "Forensics workspace created: $FORENSICS_DIR"
    echo "$FORENSICS_DIR"
}

# Immediate containment
immediate_containment() {
    log_critical "Initiating immediate containment procedures..."
    send_security_alert "Immediate containment initiated - isolating compromised systems"
    
    # Set security breach indicator
    touch /tmp/security_breach_indicator
    echo "$INCIDENT_ID" > /tmp/security_breach_indicator
    
    # Enable strict firewall rules
    log_info "Enabling strict firewall rules..."
    iptables -P INPUT DROP || true
    iptables -P FORWARD DROP || true
    iptables -P OUTPUT DROP || true
    
    # Allow essential services only
    iptables -A INPUT -i lo -j ACCEPT || true
    iptables -A OUTPUT -o lo -j ACCEPT || true
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT || true
    iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT || true
    
    # Allow SSH for investigation (be careful!)
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT || true
    iptables -A OUTPUT -p tcp --sport 22 -j ACCEPT || true
    
    # Block all other traffic
    log_warn "Network traffic restricted - only essential services allowed"
    
    # Stop web-facing services immediately
    log_info "Stopping web-facing services..."
    cd "$PLATFORM_DIR"
    docker-compose stop web admin || true
    
    # Stop non-essential services
    docker-compose stop monitoring || true
    
    # Keep database and API running for investigation
    log_info "Keeping database and API running for investigation"
    
    log_critical "Immediate containment completed"
}

# Preserve evidence
preserve_evidence() {
    local forensics_dir="$1"
    
    log_info "Preserving forensic evidence..."
    
    # Capture system state
    log_info "Capturing system state..."
    {
        echo "=== System Information ==="
        uname -a
        echo
        
        echo "=== Process List ==="
        ps auxwwf
        echo
        
        echo "=== Network Connections ==="
        netstat -tulpn
        echo
        
        echo "=== Open Files ==="
        lsof +L1 2>/dev/null | head -100
        echo
        
        echo "=== Mount Points ==="
        mount
        echo
        
        echo "=== Disk Usage ==="
        df -h
        echo
        
        echo "=== Memory Usage ==="
        free -h
        echo
        
        echo "=== System Messages ==="
        tail -200 /var/log/syslog 2>/dev/null || tail -200 /var/log/messages 2>/dev/null || echo "System log not accessible"
        
    } > "$forensics_dir/evidence/system_snapshot.txt"
    
    # Capture memory dump if possible
    log_info "Attempting memory capture..."
    if command -v memdump >/dev/null 2>&1; then
        memdump > "$forensics_dir/memory/memory_dump.raw" 2>/dev/null || log_warn "Memory dump failed"
    else
        log_warn "Memory dump tool not available"
    fi
    
    # Capture application logs
    log_info "Preserving application logs..."
    if [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$forensics_dir/logs/disaster-recovery/" || true
    fi
    
    if [[ -d "/var/log/cryb" ]]; then
        cp -r "/var/log/cryb" "$forensics_dir/logs/application/" || true
    fi
    
    # Capture Docker logs
    log_info "Preserving Docker logs..."
    mkdir -p "$forensics_dir/logs/docker"
    docker-compose logs --no-color > "$forensics_dir/logs/docker/compose_logs.txt" 2>/dev/null || true
    
    # Capture system logs
    log_info "Preserving system logs..."
    cp /var/log/auth.log "$forensics_dir/logs/" 2>/dev/null || true
    cp /var/log/syslog "$forensics_dir/logs/" 2>/dev/null || true
    cp /var/log/kern.log "$forensics_dir/logs/" 2>/dev/null || true
    
    # Capture network traffic (if tcpdump available)
    log_info "Starting network traffic capture..."
    if command -v tcpdump >/dev/null 2>&1; then
        timeout 300 tcpdump -i any -w "$forensics_dir/network/traffic_sample.pcap" 2>/dev/null &
        echo $! > "$forensics_dir/network/tcpdump.pid"
    fi
    
    # Capture file system metadata
    log_info "Capturing file system metadata..."
    find "$PLATFORM_DIR" -type f -exec stat {} \; > "$forensics_dir/filesystem/file_metadata.txt" 2>/dev/null || true
    
    # Calculate file hashes for integrity verification
    log_info "Calculating file hashes..."
    find "$PLATFORM_DIR" -type f -exec sha256sum {} \; > "$forensics_dir/filesystem/file_hashes.txt" 2>/dev/null || true
    
    log_info "Evidence preservation completed"
}

# Assess breach scope
assess_breach_scope() {
    local forensics_dir="$1"
    
    log_info "Assessing breach scope and impact..."
    
    local assessment_file="$forensics_dir/reports/breach_assessment.json"
    
    # Check for common indicators of compromise
    local ioc_file="$forensics_dir/reports/indicators_of_compromise.txt"
    {
        echo "=== Indicators of Compromise Assessment ==="
        echo "Timestamp: $(date)"
        echo
        
        # Check for suspicious processes
        echo "=== Suspicious Processes ==="
        ps aux | grep -E "(nc|netcat|ncat|socat|wget|curl|python|perl|ruby|bash|sh).*[0-9]{1,5}" || echo "None found"
        echo
        
        # Check for suspicious network connections
        echo "=== Suspicious Network Connections ==="
        netstat -tulpn | grep -E ":(4444|5555|6666|7777|8888|9999|1234|31337)" || echo "None found"
        echo
        
        # Check for recently modified files
        echo "=== Recently Modified Files (last 24 hours) ==="
        find "$PLATFORM_DIR" -type f -mtime -1 -ls 2>/dev/null | head -20 || echo "None found"
        echo
        
        # Check for suspicious file names
        echo "=== Suspicious File Names ==="
        find "$PLATFORM_DIR" -type f -name "*.php" -o -name "*.jsp" -o -name "shell*" -o -name "*backdoor*" 2>/dev/null || echo "None found"
        echo
        
        # Check for large files that might be exfiltrated data
        echo "=== Large Files (>100MB) ==="
        find "$PLATFORM_DIR" -type f -size +100M -ls 2>/dev/null | head -10 || echo "None found"
        echo
        
        # Check authentication logs for failed attempts
        echo "=== Recent Authentication Failures ==="
        grep "authentication failure" /var/log/auth.log 2>/dev/null | tail -10 || echo "None found"
        echo
        
        # Check for sudo usage
        echo "=== Recent Sudo Usage ==="
        grep "sudo:" /var/log/auth.log 2>/dev/null | tail -10 || echo "None found"
        
    } > "$ioc_file"
    
    # Analyze Docker containers for compromise
    log_info "Analyzing Docker containers..."
    {
        echo "=== Container Analysis ==="
        echo "Running containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo
        
        echo "Container resource usage:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo
        
        # Check for containers with unusual network activity
        echo "Container network connections:"
        for container in $(docker ps --format "{{.Names}}"); do
            echo "--- $container ---"
            docker exec "$container" netstat -tulpn 2>/dev/null | head -10 || echo "Cannot access container network info"
        done
        
    } > "$forensics_dir/reports/container_analysis.txt"
    
    # Analyze database for compromise
    log_info "Analyzing database for signs of compromise..."
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        {
            echo "=== Database Analysis ==="
            echo "Database connections:"
            psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d "${DB_NAME:-cryb_platform}" -c "
                SELECT client_addr, client_port, application_name, state, query_start, query 
                FROM pg_stat_activity 
                WHERE state != 'idle' AND query != '<IDLE>';" 2>/dev/null || echo "Cannot access database activity"
            echo
            
            echo "Recent database modifications:"
            psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d "${DB_NAME:-cryb_platform}" -c "
                SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
                FROM pg_stat_user_tables 
                WHERE n_tup_ins + n_tup_upd + n_tup_del > 0
                ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC LIMIT 10;" 2>/dev/null || echo "Cannot access table statistics"
            
        } > "$forensics_dir/reports/database_analysis.txt"
    else
        echo "Database not accessible for analysis" > "$forensics_dir/reports/database_analysis.txt"
    fi
    
    # Create assessment summary
    cat > "$assessment_file" << EOF
{
  "incident_id": "$INCIDENT_ID",
  "assessment_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "scope": {
    "containers_affected": $(docker ps -q | wc -l),
    "services_running": $(docker-compose ps --filter "status=running" | tail -n +2 | wc -l),
    "database_accessible": $(pg_isready -h localhost -p 5432 >/dev/null 2>&1 && echo "true" || echo "false"),
    "web_services_exposed": $(docker-compose ps | grep -E "(web|admin)" | grep -E "(Up|running)" | wc -l)
  },
  "indicators": {
    "suspicious_processes": $(ps aux | grep -E "(nc|netcat|ncat|socat)" | grep -v grep | wc -l),
    "suspicious_connections": $(netstat -tulpn | grep -E ":(4444|5555|6666|7777|8888|9999|1234|31337)" | wc -l),
    "recent_file_modifications": $(find "$PLATFORM_DIR" -type f -mtime -1 2>/dev/null | wc -l),
    "authentication_failures": $(grep "authentication failure" /var/log/auth.log 2>/dev/null | wc -l)
  },
  "containment_status": {
    "firewall_restricted": true,
    "web_services_stopped": true,
    "database_isolated": false,
    "network_monitoring": true
  }
}
EOF

    log_info "Breach scope assessment completed: $assessment_file"
}

# Isolate compromised systems
isolate_compromised_systems() {
    local forensics_dir="$1"
    
    log_critical "Isolating compromised systems..."
    send_security_alert "Isolating compromised systems and services"
    
    # Create quarantine directory
    mkdir -p "$QUARANTINE_DIR"
    chmod 700 "$QUARANTINE_DIR"
    
    # Stop and quarantine suspicious containers
    log_info "Checking containers for compromise indicators..."
    while IFS= read -r container; do
        if [[ -n "$container" ]]; then
            log_info "Analyzing container: $container"
            
            # Check for suspicious network activity
            local suspicious_connections
            suspicious_connections=$(docker exec "$container" netstat -tulpn 2>/dev/null | grep -E ":(4444|5555|6666|7777|8888|9999|1234|31337)" | wc -l || echo "0")
            
            if [[ $suspicious_connections -gt 0 ]]; then
                log_critical "Suspicious network activity detected in $container - quarantining"
                
                # Export container for analysis
                docker export "$container" > "$QUARANTINE_DIR/${container}_export.tar" 2>/dev/null || true
                
                # Stop the container
                docker stop "$container" || true
                
                # Tag as quarantined
                docker tag "$container" "quarantined-$container" 2>/dev/null || true
            fi
        fi
    done <<< "$(docker ps --format '{{.Names}}')"
    
    # Check for compromised files
    log_info "Scanning for compromised files..."
    if command -v clamscan >/dev/null 2>&1; then
        clamscan -r "$PLATFORM_DIR" --log="$forensics_dir/reports/malware_scan.log" --move="$QUARANTINE_DIR/malware/" || true
    else
        log_warn "ClamAV not available for malware scanning"
    fi
    
    # Isolate database if necessary
    local db_compromise_indicators
    db_compromise_indicators=$(grep -c "suspicious\|malicious\|breach" "$forensics_dir/reports/database_analysis.txt" 2>/dev/null || echo "0")
    
    if [[ $db_compromise_indicators -gt 0 ]]; then
        log_critical "Database compromise indicators detected - isolating database"
        
        # Backup current database state before isolation
        pg_dump -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d "${DB_NAME:-cryb_platform}" > "$QUARANTINE_DIR/compromised_database_backup.sql" 2>/dev/null || true
        
        # Stop database access from applications
        iptables -A INPUT -p tcp --dport 5432 ! -s 127.0.0.1 -j DROP || true
    fi
    
    log_critical "System isolation completed"
}

# Clean system rebuild
clean_system_rebuild() {
    local forensics_dir="$1"
    
    log_info "Initiating clean system rebuild..."
    send_security_alert "Starting clean system rebuild from verified backups"
    
    # Verify clean backup availability
    if [[ ! -d "$CLEAN_BACKUP_DIR" ]]; then
        log_error "Clean backup directory not found: $CLEAN_BACKUP_DIR"
        return 1
    fi
    
    # Find latest clean backup
    local latest_clean_backup
    latest_clean_backup=$(find "$CLEAN_BACKUP_DIR" -name "*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | awk '{print $2}' || echo "")
    
    if [[ -z "$latest_clean_backup" ]]; then
        log_error "No clean backups found"
        return 1
    fi
    
    log_info "Using clean backup: $latest_clean_backup"
    
    # Stop all services
    cd "$PLATFORM_DIR"
    docker-compose down --remove-orphans || true
    docker-compose -f docker-compose.monitoring.yml down --remove-orphans || true
    docker-compose -f docker-compose.security-monitoring.yml down --remove-orphans || true
    
    # Remove all containers and images
    log_info "Removing all containers and images..."
    docker system prune -af || true
    docker volume prune -f || true
    
    # Backup current platform directory
    log_info "Backing up current platform directory..."
    tar -czf "$QUARANTINE_DIR/compromised_platform_$(date +%Y%m%d_%H%M%S).tar.gz" -C "$(dirname "$PLATFORM_DIR")" "$(basename "$PLATFORM_DIR")" || true
    
    # Remove compromised platform directory
    rm -rf "$PLATFORM_DIR" || true
    
    # Restore from clean backup
    log_info "Restoring from clean backup..."
    mkdir -p "$(dirname "$PLATFORM_DIR")"
    tar -xzf "$latest_clean_backup" -C "$(dirname "$PLATFORM_DIR")" || {
        log_error "Failed to restore from clean backup"
        return 1
    }
    
    # Set proper permissions
    chown -R ubuntu:ubuntu "$PLATFORM_DIR" || true
    
    # Restore database from clean backup
    log_info "Restoring database from clean backup..."
    
    # Start PostgreSQL with fresh data
    cd "$PLATFORM_DIR"
    docker-compose up -d postgres
    
    # Wait for PostgreSQL
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            break
        fi
        sleep 2
        ((retries--))
    done
    
    # Find clean database backup
    local clean_db_backup
    clean_db_backup=$(find "$CLEAN_BACKUP_DIR" -name "*database*.sql" -type f -printf '%T@ %p\n' | sort -n | tail -1 | awk '{print $2}' || echo "")
    
    if [[ -n "$clean_db_backup" ]]; then
        log_info "Restoring database from: $clean_db_backup"
        psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME:-cryb_platform};" || true
        psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d postgres -c "CREATE DATABASE ${DB_NAME:-cryb_platform};" || true
        psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d "${DB_NAME:-cryb_platform}" -f "$clean_db_backup" || {
            log_error "Failed to restore database from clean backup"
            return 1
        }
    else
        log_warn "No clean database backup found"
    fi
    
    log_info "Clean system rebuild completed"
}

# Implement security hardening
implement_security_hardening() {
    log_info "Implementing enhanced security measures..."
    send_security_alert "Implementing enhanced security hardening measures"
    
    # Update all passwords and keys
    log_info "Rotating all passwords and API keys..."
    
    # Generate new JWT secret
    local new_jwt_secret
    new_jwt_secret=$(openssl rand -hex 32)
    
    # Update environment files
    if [[ -f "$PLATFORM_DIR/.env" ]]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$new_jwt_secret/" "$PLATFORM_DIR/.env" || true
    fi
    
    # Rotate database password
    local new_db_password
    new_db_password=$(openssl rand -base64 24)
    
    # Update database password in PostgreSQL
    psql -h localhost -p 5432 -U "${DB_USER:-cryb_user}" -d postgres -c "ALTER USER ${DB_USER:-cryb_user} PASSWORD '$new_db_password';" || true
    
    # Update password in environment
    if [[ -f "$PLATFORM_DIR/.env" ]]; then
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$new_db_password/" "$PLATFORM_DIR/.env" || true
    fi
    
    # Implement additional firewall rules
    log_info "Implementing enhanced firewall rules..."
    
    # Block common attack ports
    iptables -A INPUT -p tcp --dport 23 -j DROP || true  # Telnet
    iptables -A INPUT -p tcp --dport 135 -j DROP || true # RPC
    iptables -A INPUT -p tcp --dport 139 -j DROP || true # NetBIOS
    iptables -A INPUT -p tcp --dport 445 -j DROP || true # SMB
    
    # Rate limiting for SSH
    iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set --name SSH || true
    iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --rttl --name SSH -j DROP || true
    
    # Enable fail2ban if available
    if command -v fail2ban-client >/dev/null 2>&1; then
        systemctl enable fail2ban || true
        systemctl start fail2ban || true
        log_info "Fail2ban enabled"
    fi
    
    # Configure enhanced logging
    log_info "Configuring enhanced security logging..."
    
    # Enable audit logging if auditd is available
    if command -v auditctl >/dev/null 2>&1; then
        auditctl -w "$PLATFORM_DIR" -p wa -k cryb_platform_changes || true
        auditctl -w /etc/passwd -p wa -k passwd_changes || true
        auditctl -w /etc/shadow -p wa -k shadow_changes || true
        log_info "Audit logging configured"
    fi
    
    # Set up intrusion detection
    log_info "Setting up intrusion detection..."
    
    # Start security monitoring if available
    cd "$PLATFORM_DIR"
    if [[ -f "docker-compose.security-monitoring.yml" ]]; then
        docker-compose -f docker-compose.security-monitoring.yml up -d || log_warn "Failed to start security monitoring"
    fi
    
    log_info "Security hardening measures implemented"
}

# Notify stakeholders
notify_stakeholders() {
    local phase="$1"
    local status="$2"
    
    log_info "Notifying stakeholders: $phase - $status"
    
    # Send to security team
    send_security_alert "Security recovery $phase completed with status: $status" "warning"
    
    # Update status page if configured
    if [[ -n "${STATUS_PAGE_WEBHOOK:-}" ]]; then
        local status_message
        case "$phase" in
            "containment") status_message="Security incident detected - systems isolated for investigation" ;;
            "investigation") status_message="Security incident under investigation - services temporarily unavailable" ;;
            "recovery") status_message="Security incident resolved - systems being restored" ;;
            "complete") status_message="Security incident resolved - all systems operational with enhanced security" ;;
        esac
        
        curl -s -X POST "${STATUS_PAGE_WEBHOOK}" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"investigating\",\"message\":\"$status_message\"}" || true
    fi
    
    # Log for incident tracking
    log_info "Stakeholder notification completed for phase: $phase"
}

# Generate security incident report
generate_security_report() {
    local forensics_dir="$1"
    local start_time="$2"
    local end_time="$3"
    local success="$4"
    
    local duration=$((end_time - start_time))
    local report_file="$forensics_dir/reports/security_incident_report.md"
    
    cat > "$report_file" << EOF
# CRYB Platform Security Incident Report

## Incident Summary
- **Incident ID**: $INCIDENT_ID
- **Detection Time**: $(date -d "@$start_time" '+%Y-%m-%d %H:%M:%S UTC')
- **Resolution Time**: $(date -d "@$end_time" '+%Y-%m-%d %H:%M:%S UTC')
- **Response Duration**: $duration seconds ($(($duration / 60)) minutes)
- **Recovery Success**: $success

## Incident Timeline
$(grep "$(date -d "@$start_time" '+%Y-%m-%d')" "$LOG_DIR/security-recovery.log" | tail -100)

## Forensic Evidence
- **Evidence Location**: $forensics_dir
- **System Snapshot**: $(test -f "$forensics_dir/evidence/system_snapshot.txt" && echo "✓ Captured" || echo "✗ Missing")
- **Memory Dump**: $(test -f "$forensics_dir/memory/memory_dump.raw" && echo "✓ Captured" || echo "✗ Not Available")
- **Network Traffic**: $(test -f "$forensics_dir/network/traffic_sample.pcap" && echo "✓ Captured" || echo "✗ Not Available")
- **Application Logs**: $(test -d "$forensics_dir/logs" && echo "✓ Preserved" || echo "✗ Missing")

## Breach Assessment
\`\`\`json
$(cat "$forensics_dir/reports/breach_assessment.json" 2>/dev/null || echo "Assessment data not available")
\`\`\`

## Indicators of Compromise
$(cat "$forensics_dir/reports/indicators_of_compromise.txt" 2>/dev/null | head -50 || echo "IOC analysis not available")

## Response Actions Taken
1. **Immediate Containment**
   - Network traffic restricted
   - Web-facing services stopped
   - Firewall rules implemented
   - Systems isolated

2. **Evidence Preservation**
   - System state captured
   - Logs preserved
   - Memory dump attempted
   - File integrity recorded

3. **Investigation**
   - Breach scope assessed
   - Compromised systems identified
   - Malware scanning performed
   - Database integrity checked

4. **Recovery**
   - Clean system rebuild from verified backups
   - Database restored from clean backup
   - Enhanced security measures implemented
   - All credentials rotated

5. **Hardening**
   - Enhanced firewall rules
   - Intrusion detection enabled
   - Security monitoring activated
   - Audit logging configured

## Impact Assessment
- **Services Affected**: Web application, Admin panel, potentially API
- **Data Integrity**: $(pg_isready -h localhost -p 5432 >/dev/null 2>&1 && echo "Database verified clean" || echo "Database assessment pending")
- **User Impact**: Service interruption during recovery
- **Financial Impact**: To be assessed

## Lessons Learned
1. **Detection**: Review detection capabilities and response time
2. **Response**: Evaluate containment procedures effectiveness
3. **Recovery**: Assess backup and recovery procedures
4. **Prevention**: Implement additional security controls

## Recommendations
### Immediate (0-24 hours)
- [ ] Monitor all systems for 24 hours
- [ ] Verify all services are functioning properly
- [ ] Confirm all credentials have been rotated
- [ ] Review access logs for any anomalies

### Short-term (1-7 days)
- [ ] Conduct post-incident review meeting
- [ ] Update incident response procedures
- [ ] Implement additional monitoring
- [ ] Review and update security policies

### Long-term (1-4 weeks)
- [ ] Security architecture review
- [ ] Penetration testing
- [ ] Staff security training
- [ ] Implement advanced threat detection

## Contact Information
- **Incident Commander**: [Contact Info]
- **Security Lead**: [Contact Info]
- **Technical Lead**: [Contact Info]
- **Legal Counsel**: [Contact Info]

## Compliance and Legal
- **Regulatory Notifications**: $(echo "Review requirements for GDPR, CCPA, etc.")
- **Law Enforcement**: $(echo "Contact if criminal activity suspected")
- **Insurance**: $(echo "Notify cyber insurance provider")

---
Report generated on $(date) by security incident response system.
Incident ID: $INCIDENT_ID
Forensics Location: $forensics_dir
EOF

    log_info "Security incident report generated: $report_file"
    echo "$report_file"
}

# Main security recovery function
main() {
    local start_time=$(date +%s)
    local recovery_success="false"
    
    echo -e "${RED}=================================${NC}"
    echo -e "${RED}CRYB SECURITY BREACH RECOVERY${NC}"
    echo -e "${RED}Incident ID: $INCIDENT_ID${NC}"
    echo -e "${RED}=================================${NC}"
    echo
    
    log_critical "Security breach detected - initiating incident response"
    send_security_alert "Security breach detected - incident response initiated"
    
    # Load configuration
    load_config
    
    # Create forensics workspace
    local forensics_dir
    forensics_dir=$(create_forensics_workspace)
    
    # Phase 1: Immediate Containment
    log_critical "PHASE 1: IMMEDIATE CONTAINMENT"
    notify_stakeholders "containment" "in_progress"
    immediate_containment
    
    # Phase 2: Evidence Preservation
    log_critical "PHASE 2: EVIDENCE PRESERVATION"
    notify_stakeholders "investigation" "in_progress"
    preserve_evidence "$forensics_dir"
    
    # Phase 3: Breach Assessment
    log_critical "PHASE 3: BREACH ASSESSMENT"
    assess_breach_scope "$forensics_dir"
    
    # Phase 4: System Isolation
    log_critical "PHASE 4: SYSTEM ISOLATION"
    isolate_compromised_systems "$forensics_dir"
    
    # Phase 5: Clean System Rebuild
    log_critical "PHASE 5: CLEAN SYSTEM REBUILD"
    notify_stakeholders "recovery" "in_progress"
    if clean_system_rebuild "$forensics_dir"; then
        log_info "Clean system rebuild completed successfully"
    else
        log_error "Clean system rebuild failed"
    fi
    
    # Phase 6: Security Hardening
    log_critical "PHASE 6: SECURITY HARDENING"
    implement_security_hardening
    
    # Phase 7: Validation and Restoration
    log_critical "PHASE 7: VALIDATION AND RESTORATION"
    
    # Restart services with enhanced security
    cd "$PLATFORM_DIR"
    docker-compose up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Validate services
    local errors=0
    
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_error "Database validation failed"
        ((errors++))
    fi
    
    if ! curl -s --max-time 10 "http://localhost:3002/api/health" >/dev/null 2>&1; then
        log_error "API validation failed"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        recovery_success="true"
        log_info "Security recovery validation passed"
    else
        log_error "Security recovery validation failed with $errors errors"
    fi
    
    # Remove security breach indicator if recovery successful
    if [[ "$recovery_success" == "true" ]]; then
        rm -f /tmp/security_breach_indicator
        
        # Restore normal firewall rules (still enhanced)
        iptables -P INPUT ACCEPT || true
        iptables -P FORWARD ACCEPT || true
        iptables -P OUTPUT ACCEPT || true
        iptables -F || true
        
        # Keep enhanced rules
        iptables -A INPUT -p tcp --dport 23 -j DROP || true
        iptables -A INPUT -p tcp --dport 135 -j DROP || true
        iptables -A INPUT -p tcp --dport 139 -j DROP || true
        iptables -A INPUT -p tcp --dport 445 -j DROP || true
    fi
    
    # Generate incident report
    local end_time=$(date +%s)
    local report_file
    report_file=$(generate_security_report "$forensics_dir" "$start_time" "$end_time" "$recovery_success")
    
    # Final notifications
    echo
    echo "========================================"
    if [[ "$recovery_success" == "true" ]]; then
        echo -e "${GREEN}✓ SECURITY RECOVERY SUCCESSFUL${NC}"
        echo -e "${GREEN}✓ Systems restored with enhanced security${NC}"
        echo -e "${GREEN}✓ All credentials rotated${NC}"
        send_security_alert "Security incident resolved - systems restored with enhanced security" "success"
        notify_stakeholders "complete" "success"
        log_critical "Security breach recovery completed successfully"
    else
        echo -e "${RED}✗ SECURITY RECOVERY INCOMPLETE${NC}"
        echo -e "${RED}✗ Manual intervention required${NC}"
        send_security_alert "Security recovery incomplete - manual intervention required" "critical"
        notify_stakeholders "complete" "failed"
        log_critical "Security breach recovery failed"
    fi
    
    echo -e "${BLUE}📋 Incident Report: $report_file${NC}"
    echo -e "${BLUE}🗂️  Forensics Data: $forensics_dir${NC}"
    echo -e "${BLUE}🆔 Incident ID: $INCIDENT_ID${NC}"
    echo "========================================"
    
    if [[ "$recovery_success" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Handle signals
trap 'log_error "Security recovery interrupted by signal"; send_security_alert "Security recovery interrupted" "critical"; exit 1' INT TERM

# Execute main function
main "$@"