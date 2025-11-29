#!/bin/bash

# CRYB Platform Health Check & Monitoring Script
# Checks all critical services and sends alerts if issues detected

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Health status
OVERALL_STATUS="HEALTHY"
ISSUES=()

echo "=========================================="
echo "CRYB Platform Health Check"
echo "Time: $(date)"
echo "=========================================="

# Check PostgreSQL
echo -n "PostgreSQL Database: "
if PGPASSWORD=cryb_password psql -h localhost -p 5433 -U cryb_user -d cryb -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("PostgreSQL is down")
fi

# Check Redis
echo -n "Redis Cache: "
if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Redis is down")
fi

# Check Elasticsearch
echo -n "Elasticsearch: "
if curl -s -u elastic:cryb_elastic_password http://localhost:9201/_cluster/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${YELLOW}⚠ DEGRADED${NC} (Non-critical)"
fi

# Check MinIO
echo -n "MinIO Storage: "
if curl -s -I http://localhost:9001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${YELLOW}⚠ DOWN${NC} (File uploads disabled)"
    ISSUES+=("MinIO is down")
fi

# Check API
echo -n "API Server: "
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("API server is down")
fi

# Check Web Frontend
echo -n "Web Frontend: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Web frontend is down")
fi

# Check Nginx
echo -n "Nginx Proxy: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ DOWN${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Nginx is down")
fi

# Check PM2 processes
echo -n "PM2 Processes: "
PM2_STATUS=$(pm2 list --no-color | grep -E "online|stopped|errored")
if echo "$PM2_STATUS" | grep -q "online"; then
    echo -e "${GREEN}✓ RUNNING${NC}"
else
    echo -e "${RED}✗ ISSUES DETECTED${NC}"
    OVERALL_STATUS="WARNING"
    ISSUES+=("PM2 processes have issues")
fi

# Check disk space
echo -n "Disk Space: "
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ OK (${DISK_USAGE}% used)${NC}"
elif [ $DISK_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARNING (${DISK_USAGE}% used)${NC}"
    OVERALL_STATUS="WARNING"
    ISSUES+=("Disk space running low")
else
    echo -e "${RED}✗ CRITICAL (${DISK_USAGE}% used)${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Disk space critical")
fi

# Check memory
echo -n "Memory Usage: "
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ $MEM_USAGE -lt 80 ]; then
    echo -e "${GREEN}✓ OK (${MEM_USAGE}% used)${NC}"
elif [ $MEM_USAGE -lt 90 ]; then
    echo -e "${YELLOW}⚠ WARNING (${MEM_USAGE}% used)${NC}"
    OVERALL_STATUS="WARNING"
    ISSUES+=("Memory usage high")
else
    echo -e "${RED}✗ CRITICAL (${MEM_USAGE}% used)${NC}"
    OVERALL_STATUS="CRITICAL"
    ISSUES+=("Memory usage critical")
fi

echo "=========================================="
echo -n "Overall Status: "

if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
    echo -e "${GREEN}✓ ALL SYSTEMS OPERATIONAL${NC}"
elif [ "$OVERALL_STATUS" = "WARNING" ]; then
    echo -e "${YELLOW}⚠ WARNINGS DETECTED${NC}"
else
    echo -e "${RED}✗ CRITICAL ISSUES DETECTED${NC}"
fi

# Report issues if any
if [ ${#ISSUES[@]} -gt 0 ]; then
    echo ""
    echo "Issues detected:"
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue"
    done
    
    # Log to system
    logger "CRYB Health Check: $OVERALL_STATUS - Issues: ${ISSUES[*]}"
    
    # Return non-zero for monitoring systems
    exit 1
fi

echo "=========================================="
exit 0