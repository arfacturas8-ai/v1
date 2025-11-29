#!/bin/bash

# CRYB Platform Enhanced Health Check & Monitoring Script
# Checks all critical services, monitors performance, and sends alerts if issues detected
# Enhanced with Socket.io monitoring, LiveKit checks, and detailed metrics

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health status and configuration
OVERALL_STATUS="HEALTHY"
ISSUES=()
WARNINGS=()
SUCCESSES=()
LOG_FILE="/home/ubuntu/cryb-platform/logs/monitoring/health-checks.log"
METRICS_FILE="/home/ubuntu/cryb-platform/logs/monitoring/metrics.json"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$METRICS_FILE")"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to save metrics
save_metrics() {
    local service=$1
    local status=$2
    local response_time=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Append to metrics file (JSON format)
    echo "{\"timestamp\": \"$timestamp\", \"service\": \"$service\", \"status\": \"$status\", \"response_time\": $response_time}" >> "$METRICS_FILE"
}

echo "=========================================="
echo "CRYB Platform Enhanced Health Check"
echo "Time: $(date)"
echo "=========================================="

# Check PostgreSQL with response time and connection count
echo -n "PostgreSQL Database: "
START_TIME=$(date +%s%N)
if PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -c "SELECT 1" > /dev/null 2>&1; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${GREEN}✓ RUNNING${NC} (${RESPONSE_TIME}ms)"
    SUCCESSES+=("PostgreSQL: ${RESPONSE_TIME}ms")
    save_metrics "postgresql" "up" "$RESPONSE_TIME"
    
    # Check database connections
    DB_CONNECTIONS=$(PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
    if [ ! -z "$DB_CONNECTIONS" ] && [ "$DB_CONNECTIONS" -gt 80 ]; then
        echo -e "    ${YELLOW}⚠ High DB connections: $DB_CONNECTIONS${NC}"
        WARNINGS+=("High database connections: $DB_CONNECTIONS")
    elif [ ! -z "$DB_CONNECTIONS" ]; then
        echo -e "    Active connections: $DB_CONNECTIONS"
    fi
    
    # Check database size
    DB_SIZE=$(PGPASSWORD=cryb_password psql -h localhost -p 5432 -U cryb_user -d cryb -t -c "SELECT pg_size_pretty(pg_database_size('cryb'));" 2>/dev/null | tr -d ' ')
    if [ ! -z "$DB_SIZE" ]; then
        echo -e "    Database size: $DB_SIZE"
    fi
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("PostgreSQL is down")
    save_metrics "postgresql" "down" "0"
fi

# Check Redis with metrics
echo -n "Redis Cache: "
START_TIME=$(date +%s%N)
if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${GREEN}✓ RUNNING${NC} (${RESPONSE_TIME}ms)"
    SUCCESSES+=("Redis: ${RESPONSE_TIME}ms")
    save_metrics "redis" "up" "$RESPONSE_TIME"
    
    # Check Redis memory usage
    REDIS_MEMORY=$(redis-cli -p 6380 -a cryb_redis_password info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    REDIS_CLIENTS=$(redis-cli -p 6380 -a cryb_redis_password info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r')
    if [ ! -z "$REDIS_MEMORY" ]; then
        echo -e "    Memory usage: $REDIS_MEMORY, Clients: $REDIS_CLIENTS"
    fi
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Redis is down")
    save_metrics "redis" "down" "0"
fi

# Check Elasticsearch (optional)
echo -n "Elasticsearch: "
if curl -s -u elastic:cryb_elastic_password http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    ELASTIC_STATUS=$(curl -s -u elastic:cryb_elastic_password http://localhost:9200/_cluster/health | jq -r '.status' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ RUNNING${NC} (Status: $ELASTIC_STATUS)"
    SUCCESSES+=("Elasticsearch: $ELASTIC_STATUS")
else
    echo -e "${YELLOW}⚠ DEGRADED${NC} (Non-critical, search features limited)"
    WARNINGS+=("Elasticsearch is down")
fi

# Check MinIO Storage
echo -n "MinIO Storage: "
START_TIME=$(date +%s%N)
if curl -s -I http://localhost:9001 > /dev/null 2>&1; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${GREEN}✓ RUNNING${NC} (${RESPONSE_TIME}ms)"
    SUCCESSES+=("MinIO: ${RESPONSE_TIME}ms")
    save_metrics "minio" "up" "$RESPONSE_TIME"
else
    echo -e "${YELLOW}⚠ DOWN${NC} (File uploads disabled)"
    WARNINGS+=("MinIO is down - file uploads disabled")
    save_metrics "minio" "down" "0"
fi

# Check API Server with detailed health
echo -n "API Server: "
START_TIME=$(date +%s%N)
API_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code};TIME:%{time_total}" http://localhost:3002/health 2>/dev/null)
API_HTTP_CODE=$(echo "$API_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
if [ "$API_HTTP_CODE" = "200" ]; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${GREEN}✓ RUNNING${NC} (${RESPONSE_TIME}ms)"
    SUCCESSES+=("API: ${RESPONSE_TIME}ms")
    save_metrics "api" "up" "$RESPONSE_TIME"
    
    # Check API metrics endpoint
    if curl -s http://localhost:3002/metrics > /dev/null 2>&1; then
        echo -e "    Metrics endpoint: Available"
    fi
elif [ "$API_HTTP_CODE" = "503" ]; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${YELLOW}⚠ DEGRADED${NC} (${RESPONSE_TIME}ms, HTTP 503)"
    WARNINGS+=("API server is degraded (503 status)")
    save_metrics "api" "degraded" "$RESPONSE_TIME"
else
    echo -e "${RED}✗ DOWN${NC} (HTTP $API_HTTP_CODE)"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("API server is down (HTTP $API_HTTP_CODE)")
    save_metrics "api" "down" "0"
fi

# Check Socket.io connectivity
echo -n "Socket.io Service: "
if curl -s http://localhost:3002/socket.io/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    SUCCESSES+=("Socket.io: OK")
elif curl -s http://localhost:3002/socket.io/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC} (Basic endpoint available)"
    SUCCESSES+=("Socket.io: OK")
else
    echo -e "${YELLOW}⚠ LIMITED${NC} (Socket.io endpoints not responding)"
    WARNINGS+=("Socket.io service may have issues")
fi

# Check Web Frontend
echo -n "Web Frontend: "
START_TIME=$(date +%s%N)
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(((END_TIME - START_TIME) / 1000000))
    echo -e "${GREEN}✓ RUNNING${NC} (${RESPONSE_TIME}ms)"
    SUCCESSES+=("Web: ${RESPONSE_TIME}ms")
    save_metrics "web" "up" "$RESPONSE_TIME"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Web frontend is down")
    save_metrics "web" "down" "0"
fi

# Check LiveKit Voice/Video
echo -n "LiveKit Voice/Video: "
if curl -s http://localhost:7880 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    SUCCESSES+=("LiveKit: OK")
    
    # Check LiveKit metrics if available
    if curl -s http://localhost:7880/metrics > /dev/null 2>&1; then
        echo -e "    Metrics endpoint: Available"
    fi
else
    echo -e "${YELLOW}⚠ DOWN${NC} (Voice/Video features disabled)"
    WARNINGS+=("LiveKit is down - voice/video features unavailable")
fi

# Check Nginx
echo -n "Nginx Proxy: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ RUNNING${NC}"
    SUCCESSES+=("Nginx: Active")
    
    # Check nginx status page if configured
    if curl -s http://localhost/nginx_status > /dev/null 2>&1; then
        NGINX_STATS=$(curl -s http://localhost/nginx_status)
        echo -e "    Status page: Available"
    fi
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Nginx is down")
fi

# Check PM2 processes with detailed status
echo -n "PM2 Processes: "
if command -v pm2 >/dev/null 2>&1; then
    PM2_STATUS=$(pm2 jlist 2>/dev/null)
    if [ $? -eq 0 ]; then
        ONLINE_COUNT=$(echo "$PM2_STATUS" | jq -r '[.[] | select(.pm2_env.status == "online")] | length' 2>/dev/null || echo "0")
        STOPPED_COUNT=$(echo "$PM2_STATUS" | jq -r '[.[] | select(.pm2_env.status == "stopped")] | length' 2>/dev/null || echo "0")
        ERROR_COUNT=$(echo "$PM2_STATUS" | jq -r '[.[] | select(.pm2_env.status == "errored")] | length' 2>/dev/null || echo "0")
        
        if [ "$ONLINE_COUNT" -gt 0 ] && [ "$ERROR_COUNT" -eq 0 ]; then
            echo -e "${GREEN}✓ RUNNING${NC} ($ONLINE_COUNT online)"
            SUCCESSES+=("PM2: $ONLINE_COUNT processes online")
        elif [ "$ERROR_COUNT" -gt 0 ]; then
            echo -e "${RED}✗ ERRORS${NC} ($ERROR_COUNT errored, $ONLINE_COUNT online)"
            OVERALL_STATUS="WARNING"
            ISSUES+=("PM2 has $ERROR_COUNT errored processes")
        else
            echo -e "${YELLOW}⚠ ISSUES${NC} ($STOPPED_COUNT stopped)"
            OVERALL_STATUS="WARNING"
            WARNINGS+=("PM2 has $STOPPED_COUNT stopped processes")
        fi
    else
        echo -e "${YELLOW}⚠ NO PROCESSES${NC}"
        WARNINGS+=("No PM2 processes running")
    fi
else
    echo -e "${YELLOW}⚠ NOT INSTALLED${NC}"
    WARNINGS+=("PM2 not installed")
fi

# Check disk space
echo -n "Disk Space: "
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ OK${NC} (${DISK_USAGE}% used, $DISK_AVAILABLE available)"
    SUCCESSES+=("Disk: ${DISK_USAGE}% used")
elif [ $DISK_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} (${DISK_USAGE}% used, $DISK_AVAILABLE available)"
    OVERALL_STATUS="WARNING"
    WARNINGS+=("Disk space running low: ${DISK_USAGE}%")
else
    echo -e "${RED}✗ CRITICAL${NC} (${DISK_USAGE}% used, $DISK_AVAILABLE available)"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Disk space critical: ${DISK_USAGE}%")
fi

# Check memory with more details
echo -n "Memory Usage: "
MEM_INFO=$(free -h)
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
MEM_AVAILABLE=$(echo "$MEM_INFO" | grep Mem | awk '{print $7}')
MEM_TOTAL=$(echo "$MEM_INFO" | grep Mem | awk '{print $2}')

if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ OK${NC} (${MEM_USAGE}% used, $MEM_AVAILABLE/$MEM_TOTAL available)"
    SUCCESSES+=("Memory: ${MEM_USAGE}% used")
elif [ $MEM_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} (${MEM_USAGE}% used, $MEM_AVAILABLE/$MEM_TOTAL available)"
    OVERALL_STATUS="WARNING"
    WARNINGS+=("Memory usage high: ${MEM_USAGE}%")
else
    echo -e "${RED}✗ CRITICAL${NC} (${MEM_USAGE}% used, $MEM_AVAILABLE/$MEM_TOTAL available)"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Memory usage critical: ${MEM_USAGE}%")
fi

# Check CPU load
echo -n "CPU Load: "
LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
CPU_COUNT=$(nproc)
LOAD_PERCENT=$(echo "$LOAD_1MIN * 100 / $CPU_COUNT" | bc -l 2>/dev/null | cut -d. -f1 2>/dev/null || echo "0")

if [ "$LOAD_PERCENT" -lt 80 ]; then
    echo -e "${GREEN}✓ OK${NC} (${LOAD_1MIN} on ${CPU_COUNT} cores)"
    SUCCESSES+=("CPU Load: ${LOAD_1MIN}")
elif [ "$LOAD_PERCENT" -lt 100 ]; then
    echo -e "${YELLOW}⚠ HIGH${NC} (${LOAD_1MIN} on ${CPU_COUNT} cores)"
    WARNINGS+=("High CPU load: ${LOAD_1MIN}")
else
    echo -e "${RED}✗ OVERLOADED${NC} (${LOAD_1MIN} on ${CPU_COUNT} cores)"
    ISSUES+=("CPU overloaded: ${LOAD_1MIN}")
fi

# Network connectivity test
echo -n "External Connectivity: "
if ping -c 1 -W 2 8.8.8.8 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
    SUCCESSES+=("Network: OK")
else
    echo -e "${YELLOW}⚠ LIMITED${NC}"
    WARNINGS+=("External connectivity issues")
fi

# Check SSL certificate if in production
echo -n "SSL Certificate: "
if [ -f "/etc/letsencrypt/live/cryb.to/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/cryb.to/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ ! -z "$CERT_EXPIRY" ]; then
        EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_DATE - CURRENT_DATE) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            echo -e "${GREEN}✓ VALID${NC} ($DAYS_LEFT days left)"
            SUCCESSES+=("SSL: Valid for $DAYS_LEFT days")
        elif [ $DAYS_LEFT -gt 7 ]; then
            echo -e "${YELLOW}⚠ EXPIRING SOON${NC} ($DAYS_LEFT days left)"
            WARNINGS+=("SSL certificate expires in $DAYS_LEFT days")
        else
            echo -e "${RED}✗ EXPIRES SOON${NC} ($DAYS_LEFT days left)"
            ISSUES+=("SSL certificate expires in $DAYS_LEFT days")
        fi
    else
        echo -e "${YELLOW}⚠ UNABLE TO CHECK${NC}"
        WARNINGS+=("Unable to check SSL certificate")
    fi
else
    echo -e "${YELLOW}⚠ NOT CONFIGURED${NC} (Development mode)"
fi

# Check port accessibility
echo -n "Port Accessibility: "
PORTS_TO_CHECK="80 443 3000 3002 5432 6380 7880 9001"
OPEN_PORTS=0
TOTAL_PORTS=0

for port in $PORTS_TO_CHECK; do
    TOTAL_PORTS=$((TOTAL_PORTS + 1))
    if ss -tuln | grep -q ":$port " 2>/dev/null || lsof -i :$port >/dev/null 2>&1; then
        OPEN_PORTS=$((OPEN_PORTS + 1))
    fi
done

if [ $OPEN_PORTS -eq $TOTAL_PORTS ]; then
    echo -e "${GREEN}✓ ALL PORTS OPEN${NC} ($OPEN_PORTS/$TOTAL_PORTS)"
    SUCCESSES+=("Ports: All $OPEN_PORTS ports accessible")
elif [ $OPEN_PORTS -gt $((TOTAL_PORTS / 2)) ]; then
    echo -e "${YELLOW}⚠ SOME PORTS CLOSED${NC} ($OPEN_PORTS/$TOTAL_PORTS open)"
    WARNINGS+=("Some ports not accessible: $OPEN_PORTS/$TOTAL_PORTS open")
else
    echo -e "${RED}✗ MANY PORTS CLOSED${NC} ($OPEN_PORTS/$TOTAL_PORTS open)"
    ISSUES+=("Many ports not accessible: $OPEN_PORTS/$TOTAL_PORTS open")
fi

echo "=========================================="
echo -n "Overall Status: "

if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
    echo -e "${GREEN}✓ ALL SYSTEMS OPERATIONAL${NC}"
    log_message "Health Check: ALL SYSTEMS OPERATIONAL"
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    echo -e "${YELLOW}⚠ WARNINGS DETECTED${NC}"
    log_message "Health Check: WARNINGS DETECTED - ${WARNINGS[*]}"
else
    echo -e "${RED}✗ CRITICAL ISSUES DETECTED${NC}"
    log_message "Health Check: CRITICAL ISSUES - ${ISSUES[*]}"
fi

# Report detailed status
if [ ${#SUCCESSES[@]} -gt 0 ]; then
    echo ""
    echo -e "${GREEN}Services running normally:${NC}"
    for success in "${SUCCESSES[@]}"; do
        echo -e "  ${GREEN}✓${NC} $success"
    done
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Warnings detected:${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $warning"
    done
fi

if [ ${#ISSUES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Critical issues detected:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo -e "  ${RED}✗${NC} $issue"
    done
    
    # Log to system
    logger "CRYB Health Check: $OVERALL_STATUS - Issues: ${ISSUES[*]}"
    
    # Send webhook alert if configured
    if [ ! -z "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\": \"$OVERALL_STATUS\", \"issues\": [\"${ISSUES[*]}\"], \"timestamp\": \"$(date)\"}" || true
    fi
    
    # Return non-zero for monitoring systems
    exit 1
fi

echo "=========================================="
echo "Health check completed successfully at $(date)"
exit 0