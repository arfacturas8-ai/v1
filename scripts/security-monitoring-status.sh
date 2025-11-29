#!/bin/bash

# ==============================================
# CRYB Platform Security Monitoring Status
# ==============================================
# Comprehensive status check for all security components
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CRYB_ROOT="/home/ubuntu/cryb-platform"

# Functions
check_service() {
    local service_name="$1"
    local container_name="$2"
    local port="$3"
    
    echo -n "Checking $service_name... "
    
    # Check if container is running
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        # Check if port is responding (if provided)
        if [[ -n "$port" ]]; then
            if nc -z localhost "$port" 2>/dev/null; then
                echo -e "${GREEN}✓ Running and responsive${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠ Running but port $port not responding${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✓ Running${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ Not running${NC}"
        return 1
    fi
}

check_api_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Checking $name API... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null); then
        if [[ "$response" == "$expected_status" ]]; then
            echo -e "${GREEN}✓ Responding (HTTP $response)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Responding but unexpected status (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Not responding${NC}"
        return 1
    fi
}

check_security_logs() {
    echo -e "\n${BLUE}Security Logs Status:${NC}"
    
    local log_dirs=(
        "/var/log/wazuh"
        "/var/log/suricata" 
        "/var/log/clamav"
        "/var/log/osquery"
        "/var/log/fail2ban"
        "$CRYB_ROOT/logs/security"
    )
    
    for log_dir in "${log_dirs[@]}"; do
        if [[ -d "$log_dir" ]]; then
            local log_count=$(find "$log_dir" -name "*.log" -type f 2>/dev/null | wc -l)
            local recent_logs=$(find "$log_dir" -name "*.log" -type f -mtime -1 2>/dev/null | wc -l)
            echo -e "  $(basename "$log_dir"): ${GREEN}$log_count total logs${NC}, ${GREEN}$recent_logs recent${NC}"
        else
            echo -e "  $(basename "$log_dir"): ${RED}Directory not found${NC}"
        fi
    done
}

check_security_metrics() {
    echo -e "\n${BLUE}Security Metrics:${NC}"
    
    # Check security exporter metrics
    if metrics=$(curl -s "http://localhost:9200/metrics" 2>/dev/null); then
        local wazuh_alerts=$(echo "$metrics" | grep "wazuh_alerts_total" | tail -1 | awk '{print $2}' || echo "0")
        local fail2ban_bans=$(echo "$metrics" | grep "fail2ban_bans_total" | tail -1 | awk '{print $2}' || echo "0")
        local suricata_alerts=$(echo "$metrics" | grep "suricata_alerts_total" | tail -1 | awk '{print $2}' || echo "0")
        local clamav_scans=$(echo "$metrics" | grep "clamav_scans_total" | tail -1 | awk '{print $2}' || echo "0")
        
        echo -e "  Wazuh Alerts: ${GREEN}$wazuh_alerts${NC}"
        echo -e "  Fail2Ban Bans: ${GREEN}$fail2ban_bans${NC}"
        echo -e "  Suricata Alerts: ${GREEN}$suricata_alerts${NC}"
        echo -e "  ClamAV Scans: ${GREEN}$clamav_scans${NC}"
    else
        echo -e "  ${RED}✗ Unable to fetch security metrics${NC}"
    fi
}

check_incident_status() {
    echo -e "\n${BLUE}Security Incident Status:${NC}"
    
    if incident_data=$(curl -s "http://localhost:3200/status" 2>/dev/null); then
        local open_incidents=$(echo "$incident_data" | jq -r '.incidents.open // 0' 2>/dev/null || echo "0")
        local total_incidents=$(echo "$incident_data" | jq -r '.incidents.total // 0' 2>/dev/null || echo "0")
        local recent_actions=$(echo "$incident_data" | jq -r '.actions.recent // 0' 2>/dev/null || echo "0")
        
        echo -e "  Open Incidents: ${GREEN}$open_incidents${NC}"
        echo -e "  Total Incidents: ${GREEN}$total_incidents${NC}"
        echo -e "  Recent Actions: ${GREEN}$recent_actions${NC}"
        
        # Show severity breakdown if available
        if severity_data=$(echo "$incident_data" | jq -r '.incidents.by_severity' 2>/dev/null); then
            echo -e "  Severity Breakdown:"
            for severity in CRITICAL HIGH MEDIUM LOW; do
                local count=$(echo "$severity_data" | jq -r ".${severity} // 0" 2>/dev/null || echo "0")
                if [[ "$count" != "0" ]]; then
                    case $severity in
                        CRITICAL) echo -e "    ${RED}$severity: $count${NC}" ;;
                        HIGH) echo -e "    ${YELLOW}$severity: $count${NC}" ;;
                        *) echo -e "    ${GREEN}$severity: $count${NC}" ;;
                    esac
                fi
            done
        fi
    else
        echo -e "  ${RED}✗ Unable to fetch incident status${NC}"
    fi
}

check_disk_usage() {
    echo -e "\n${BLUE}Disk Usage:${NC}"
    
    local security_dirs=(
        "/opt/cryb"
        "/var/log"
        "/backup/security-monitoring"
    )
    
    for dir in "${security_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            local usage=$(df -h "$dir" | awk 'NR==2 {print $5}' | sed 's/%//')
            local used_space=$(df -h "$dir" | awk 'NR==2 {print $3}')
            local available_space=$(df -h "$dir" | awk 'NR==2 {print $4}')
            
            if [[ "$usage" -gt 85 ]]; then
                echo -e "  $dir: ${RED}${usage}% used${NC} ($used_space used, $available_space available)"
            elif [[ "$usage" -gt 70 ]]; then
                echo -e "  $dir: ${YELLOW}${usage}% used${NC} ($used_space used, $available_space available)"
            else
                echo -e "  $dir: ${GREEN}${usage}% used${NC} ($used_space used, $available_space available)"
            fi
        else
            echo -e "  $dir: ${RED}Directory not found${NC}"
        fi
    done
}

check_network_connectivity() {
    echo -e "\n${BLUE}Network Connectivity:${NC}"
    
    local endpoints=(
        "Security Exporter:localhost:9200"
        "Security Automation:localhost:3200"
        "Wazuh Dashboard:localhost:5601"
        "Wazuh Manager:localhost:55000"
        "ClamAV:localhost:3310"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local name=$(echo "$endpoint" | cut -d: -f1)
        local host=$(echo "$endpoint" | cut -d: -f2)
        local port=$(echo "$endpoint" | cut -d: -f3)
        
        echo -n "  $name ($host:$port)... "
        if nc -z "$host" "$port" 2>/dev/null; then
            echo -e "${GREEN}✓ Reachable${NC}"
        else
            echo -e "${RED}✗ Not reachable${NC}"
        fi
    done
}

check_ssl_certificates() {
    echo -e "\n${BLUE}SSL Certificates:${NC}"
    
    local cert_dir="$CRYB_ROOT/config/wazuh/wazuh_indexer_ssl_certs"
    
    if [[ -d "$cert_dir" ]]; then
        local certs=("root-ca.pem" "wazuh.manager.pem" "wazuh.indexer.pem" "wazuh.dashboard.pem" "admin.pem")
        
        for cert in "${certs[@]}"; do
            echo -n "  $cert... "
            if [[ -f "$cert_dir/$cert" ]]; then
                # Check certificate expiry
                local expiry_date=$(openssl x509 -in "$cert_dir/$cert" -noout -enddate 2>/dev/null | cut -d= -f2)
                if [[ -n "$expiry_date" ]]; then
                    local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                    local current_epoch=$(date +%s)
                    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
                    
                    if [[ "$days_until_expiry" -lt 30 ]]; then
                        echo -e "${RED}✗ Expires in $days_until_expiry days${NC}"
                    elif [[ "$days_until_expiry" -lt 90 ]]; then
                        echo -e "${YELLOW}⚠ Expires in $days_until_expiry days${NC}"
                    else
                        echo -e "${GREEN}✓ Valid ($days_until_expiry days remaining)${NC}"
                    fi
                else
                    echo -e "${YELLOW}⚠ Present but unable to read expiry${NC}"
                fi
            else
                echo -e "${RED}✗ Missing${NC}"
            fi
        done
    else
        echo -e "  ${RED}✗ Certificate directory not found${NC}"
    fi
}

show_recent_security_events() {
    echo -e "\n${BLUE}Recent Security Events (last 24 hours):${NC}"
    
    # Check for recent Wazuh alerts
    if [[ -f "/var/log/wazuh/alerts.log" ]]; then
        local wazuh_alerts=$(grep "$(date +'%Y %b %d')" /var/log/wazuh/alerts.log 2>/dev/null | wc -l || echo "0")
        echo -e "  Wazuh Alerts: ${GREEN}$wazuh_alerts${NC}"
    fi
    
    # Check for recent Fail2Ban actions
    if [[ -f "/var/log/fail2ban/fail2ban.log" ]]; then
        local fail2ban_bans=$(grep "$(date +'%Y-%m-%d')" /var/log/fail2ban/fail2ban.log 2>/dev/null | grep -c "Ban " || echo "0")
        echo -e "  Fail2Ban Bans: ${GREEN}$fail2ban_bans${NC}"
    fi
    
    # Check for recent Suricata alerts
    if [[ -f "/var/log/suricata/eve.json" ]]; then
        local suricata_alerts=$(grep "$(date +'%Y-%m-%d')" /var/log/suricata/eve.json 2>/dev/null | grep -c '"event_type":"alert"' || echo "0")
        echo -e "  Suricata Alerts: ${GREEN}$suricata_alerts${NC}"
    fi
    
    # Check for recent ClamAV detections
    if [[ -f "/var/log/clamav/clamav.log" ]]; then
        local clamav_threats=$(grep "$(date +'%a %b %d')" /var/log/clamav/clamav.log 2>/dev/null | grep -c "FOUND" || echo "0")
        echo -e "  ClamAV Threats: ${GREEN}$clamav_threats${NC}"
    fi
}

# Main status check
main() {
    clear
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}CRYB Platform Security Monitoring Status${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo "Status check performed at: $(date)"
    echo ""
    
    echo -e "${BLUE}Security Services Status:${NC}"
    local services_ok=0
    local total_services=9
    
    check_service "Wazuh Manager" "cryb-wazuh-manager" "55000" && ((services_ok++))
    check_service "Wazuh Indexer" "cryb-wazuh-indexer" "9200" && ((services_ok++))
    check_service "Wazuh Dashboard" "cryb-wazuh-dashboard" "5601" && ((services_ok++))
    check_service "Fail2Ban" "cryb-fail2ban" "" && ((services_ok++))
    check_service "Suricata" "cryb-suricata" "" && ((services_ok++))
    check_service "ClamAV" "cryb-clamav" "3310" && ((services_ok++))
    check_service "OSQuery" "cryb-osquery" "" && ((services_ok++))
    check_service "Security Exporter" "cryb-security-exporter" "9200" && ((services_ok++))
    check_service "Security Automation" "cryb-security-automation" "3200" && ((services_ok++))
    
    echo ""
    echo -e "${BLUE}API Endpoints Status:${NC}"
    check_api_endpoint "Security Exporter Health" "http://localhost:9200/health" "200"
    check_api_endpoint "Security Automation Health" "http://localhost:3200/health" "200"
    check_api_endpoint "Wazuh Dashboard" "http://localhost:5601" "200"
    
    check_security_logs
    check_security_metrics
    check_incident_status
    check_disk_usage
    check_network_connectivity
    check_ssl_certificates
    show_recent_security_events
    
    echo ""
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}Summary${NC}"
    echo -e "${BLUE}===============================================${NC}"
    
    if [[ "$services_ok" -eq "$total_services" ]]; then
        echo -e "Overall Status: ${GREEN}✓ All security services operational${NC}"
        echo -e "Services Running: ${GREEN}$services_ok/$total_services${NC}"
    elif [[ "$services_ok" -gt $((total_services / 2)) ]]; then
        echo -e "Overall Status: ${YELLOW}⚠ Some security services need attention${NC}"
        echo -e "Services Running: ${YELLOW}$services_ok/$total_services${NC}"
    else
        echo -e "Overall Status: ${RED}✗ Critical security service issues detected${NC}"
        echo -e "Services Running: ${RED}$services_ok/$total_services${NC}"
    fi
    
    echo ""
    echo "Service URLs:"
    echo "• Wazuh Dashboard: https://localhost:5601"
    echo "• Security Metrics: http://localhost:9200/metrics"
    echo "• Security Automation: http://localhost:3200/status"
    echo "• Main Monitoring: http://localhost:3005 (Grafana)"
    echo ""
    echo "For detailed logs, check:"
    echo "• Security setup: /var/log/cryb-security-setup.log"
    echo "• Health checks: /var/log/security-health-check.log"
    echo "• Service logs: docker-compose -f docker-compose.security-monitoring.yml logs [service]"
    echo ""
}

# Execute main function
main "$@"