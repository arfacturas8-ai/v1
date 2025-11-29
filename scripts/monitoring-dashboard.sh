#!/bin/bash

# CRYB Platform Real-time Monitoring Dashboard
# Interactive dashboard showing live system status and metrics

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
REFRESH_INTERVAL=5
LOG_FILE="/home/ubuntu/cryb-platform/logs/monitoring/dashboard.log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log events
log_event() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to get service status with response time
get_service_status() {
    local service=$1
    local url=$2
    local timeout=${3:-2}
    
    local start_time=$(date +%s%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null)
    local end_time=$(date +%s%N)
    local response_time=$(((end_time - start_time) / 1000000))
    
    case $http_code in
        200)
            echo -e "${GREEN}✓ ONLINE${NC} (${response_time}ms)"
            ;;
        503)
            echo -e "${YELLOW}⚠ DEGRADED${NC} (${response_time}ms)"
            ;;
        000)
            echo -e "${RED}✗ OFFLINE${NC}"
            ;;
        *)
            echo -e "${YELLOW}⚠ HTTP $http_code${NC} (${response_time}ms)"
            ;;
    esac
}

# Function to check database connectivity
check_database() {
    if PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -c "SELECT 1" >/dev/null 2>&1; then
        local connections=$(PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
        echo -e "${GREEN}✓ CONNECTED${NC} ($connections active)"
    else
        echo -e "${RED}✗ DISCONNECTED${NC}"
    fi
}

# Function to check Redis
check_redis() {
    if redis-cli -p 6380 -a cryb_redis_password ping >/dev/null 2>&1; then
        local memory=$(redis-cli -p 6380 -a cryb_redis_password info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        local clients=$(redis-cli -p 6380 -a cryb_redis_password info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r')
        echo -e "${GREEN}✓ CONNECTED${NC} ($memory, ${clients} clients)"
    else
        echo -e "${RED}✗ DISCONNECTED${NC}"
    fi
}

# Function to get PM2 status
get_pm2_status() {
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 jlist 2>/dev/null)
        if [ $? -eq 0 ]; then
            local online=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || echo "0")
            local stopped=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "stopped")] | length' 2>/dev/null || echo "0")
            local errored=$(echo "$pm2_status" | jq -r '[.[] | select(.pm2_env.status == "errored")] | length' 2>/dev/null || echo "0")
            
            if [ "$errored" -gt 0 ]; then
                echo -e "${RED}$errored errored${NC}, ${GREEN}$online online${NC}, ${YELLOW}$stopped stopped${NC}"
            elif [ "$stopped" -gt 0 ]; then
                echo -e "${GREEN}$online online${NC}, ${YELLOW}$stopped stopped${NC}"
            else
                echo -e "${GREEN}$online online${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ No processes${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Not installed${NC}"
    fi
}

# Function to get system metrics
get_cpu_usage() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | sed 's/us,//')
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    
    if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${RED}$cpu_usage%${NC} (Load: $load)"
    elif (( $(echo "$cpu_usage > 60" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}$cpu_usage%${NC} (Load: $load)"
    else
        echo -e "${GREEN}$cpu_usage%${NC} (Load: $load)"
    fi
}

get_memory_usage() {
    local mem_info=$(free -h)
    local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    local mem_available=$(echo "$mem_info" | grep Mem | awk '{print $7}')
    local mem_total=$(echo "$mem_info" | grep Mem | awk '{print $2}')
    
    if [ "$mem_usage" -gt 85 ]; then
        echo -e "${RED}$mem_usage%${NC} ($mem_available/$mem_total available)"
    elif [ "$mem_usage" -gt 70 ]; then
        echo -e "${YELLOW}$mem_usage%${NC} ($mem_available/$mem_total available)"
    else
        echo -e "${GREEN}$mem_usage%${NC} ($mem_available/$mem_total available)"
    fi
}

get_disk_usage() {
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_available=$(df -h / | awk 'NR==2 {print $4}')
    
    if [ "$disk_usage" -gt 85 ]; then
        echo -e "${RED}$disk_usage%${NC} ($disk_available available)"
    elif [ "$disk_usage" -gt 70 ]; then
        echo -e "${YELLOW}$disk_usage%${NC} ($disk_available available)"
    else
        echo -e "${GREEN}$disk_usage%${NC} ($disk_available available)"
    fi
}

# Function to get network stats
get_network_stats() {
    local interface=$(ip route | grep default | awk '{print $5}' | head -n1)
    if [ ! -z "$interface" ]; then
        local rx_bytes=$(cat /sys/class/net/$interface/statistics/rx_bytes 2>/dev/null || echo "0")
        local tx_bytes=$(cat /sys/class/net/$interface/statistics/tx_bytes 2>/dev/null || echo "0")
        local rx_mb=$((rx_bytes / 1024 / 1024))
        local tx_mb=$((tx_bytes / 1024 / 1024))
        echo -e "${GREEN}↓ ${rx_mb}MB ↑ ${tx_mb}MB${NC} ($interface)"
    else
        echo -e "${YELLOW}⚠ No interface${NC}"
    fi
}

# Function to get recent errors from logs
get_recent_errors() {
    local error_count=0
    if [ -f "/home/ubuntu/cryb-platform/logs/api-error.log" ]; then
        error_count=$(tail -n 100 /home/ubuntu/cryb-platform/logs/api-error.log 2>/dev/null | grep -c "ERROR" || echo "0")
    fi
    
    if [ "$error_count" -gt 5 ]; then
        echo -e "${RED}$error_count recent errors${NC}"
    elif [ "$error_count" -gt 0 ]; then
        echo -e "${YELLOW}$error_count recent errors${NC}"
    else
        echo -e "${GREEN}No recent errors${NC}"
    fi
}

# Function to check container status
get_container_status() {
    if command -v docker >/dev/null 2>&1; then
        local running=$(docker ps --format "table {{.Names}}" | grep -c "cryb-" 2>/dev/null || echo "0")
        local total=$(docker ps -a --format "table {{.Names}}" | grep -c "cryb-" 2>/dev/null || echo "0")
        
        if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
            echo -e "${GREEN}$running/$total running${NC}"
        elif [ "$running" -gt 0 ]; then
            echo -e "${YELLOW}$running/$total running${NC}"
        else
            echo -e "${RED}$running/$total running${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Docker not available${NC}"
    fi
}

# Function to display header
display_header() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local uptime=$(uptime -p)
    
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}                        ${CYAN}CRYB Platform Monitoring Dashboard${NC}                        ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC} ${timestamp} │ ${uptime} ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════════╝${NC}"
}

# Function to display services section
display_services() {
    echo -e "\n${CYAN}┌─ Core Services ─────────────────────────────────────────────────────────────────┐${NC}"
    printf "│ %-20s │ %s\n" "API Server:" "$(get_service_status "api" "http://localhost:3002/health")"
    printf "│ %-20s │ %s\n" "Web Frontend:" "$(get_service_status "web" "http://localhost:3000")"
    printf "│ %-20s │ %s\n" "Database:" "$(check_database)"
    printf "│ %-20s │ %s\n" "Redis Cache:" "$(check_redis)"
    printf "│ %-20s │ %s\n" "MinIO Storage:" "$(get_service_status "minio" "http://localhost:9001")"
    printf "│ %-20s │ %s\n" "LiveKit Voice:" "$(get_service_status "livekit" "http://localhost:7880")"
    printf "│ %-20s │ %s\n" "Elasticsearch:" "$(get_service_status "elasticsearch" "http://localhost:9200")"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to display system metrics
display_system_metrics() {
    echo -e "\n${CYAN}┌─ System Metrics ────────────────────────────────────────────────────────────────┐${NC}"
    printf "│ %-20s │ %s\n" "CPU Usage:" "$(get_cpu_usage)"
    printf "│ %-20s │ %s\n" "Memory Usage:" "$(get_memory_usage)"
    printf "│ %-20s │ %s\n" "Disk Usage:" "$(get_disk_usage)"
    printf "│ %-20s │ %s\n" "Network Stats:" "$(get_network_stats)"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to display process status
display_processes() {
    echo -e "\n${CYAN}┌─ Process Management ────────────────────────────────────────────────────────────┐${NC}"
    printf "│ %-20s │ %s\n" "PM2 Processes:" "$(get_pm2_status)"
    printf "│ %-20s │ %s\n" "Docker Containers:" "$(get_container_status)"
    printf "│ %-20s │ %s\n" "Recent Errors:" "$(get_recent_errors)"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to display quick actions
display_actions() {
    echo -e "\n${CYAN}┌─ Quick Actions ─────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "│ ${YELLOW}[h]${NC} Full Health Check  ${YELLOW}[l]${NC} View Logs        ${YELLOW}[p]${NC} PM2 Status       ${YELLOW}[r]${NC} Restart Services │"
    echo -e "│ ${YELLOW}[m]${NC} Monitor Setup      ${YELLOW}[c]${NC} Clear Screen     ${YELLOW}[s]${NC} Service Status   ${YELLOW}[q]${NC} Quit             │"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────────┘${NC}"
}

# Function to handle user input
handle_input() {
    if read -t 1 -n 1 key; then
        case $key in
            h|H)
                echo -e "\n${YELLOW}Running full health check...${NC}"
                "$SCRIPT_DIR/health-check-enhanced.sh"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            l|L)
                echo -e "\n${YELLOW}Recent API logs:${NC}"
                tail -n 20 /home/ubuntu/cryb-platform/logs/api-error.log 2>/dev/null || echo "No API logs found"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            p|P)
                echo -e "\n${YELLOW}PM2 Status:${NC}"
                pm2 list || echo "PM2 not available"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            r|R)
                echo -e "\n${YELLOW}Restarting services...${NC}"
                pm2 restart all 2>/dev/null && echo "PM2 processes restarted" || echo "Failed to restart PM2 processes"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            m|M)
                echo -e "\n${YELLOW}Running monitoring setup...${NC}"
                "$SCRIPT_DIR/setup-monitoring.sh"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            c|C)
                clear
                ;;
            s|S)
                echo -e "\n${YELLOW}Service Status:${NC}"
                systemctl status nginx --no-pager -l || echo "Nginx status unavailable"
                echo -e "\n${YELLOW}Press any key to continue...${NC}"
                read -n 1
                ;;
            q|Q)
                echo -e "\n${YELLOW}Exiting dashboard...${NC}"
                log_event "Dashboard session ended"
                exit 0
                ;;
        esac
    fi
}

# Function to display footer
display_footer() {
    echo -e "\n${BLUE}Auto-refresh: ${REFRESH_INTERVAL}s │ Last update: $(date '+%H:%M:%S') │ Press 'h' for help, 'q' to quit${NC}"
}

# Main dashboard loop
main() {
    # Check if terminal supports colors
    if [ -t 1 ]; then
        # Terminal supports colors
        :
    else
        # Disable colors for non-terminal output
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        CYAN=''
        MAGENTA=''
        NC=''
    fi
    
    log_event "Dashboard session started"
    
    # Set terminal to not echo input and non-blocking
    stty -echo -icanon time 0 min 0
    
    # Cleanup on exit
    trap 'stty echo icanon; echo -e "\nDashboard terminated"; exit 0' EXIT INT TERM
    
    while true; do
        clear
        display_header
        display_services
        display_system_metrics
        display_processes
        display_actions
        display_footer
        
        # Handle user input (non-blocking)
        handle_input
        
        # Wait for refresh interval
        sleep $REFRESH_INTERVAL
    done
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi