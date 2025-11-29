#!/bin/bash

# Health monitoring script for Cryb Platform
# Checks service health and can send alerts (configure webhook/email as needed)

LOG_FILE="/home/ubuntu/monitoring/health.log"
ALERT_FILE="/home/ubuntu/monitoring/alerts.log"
mkdir -p /home/ubuntu/monitoring

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Function to send alert (configure your alerting method here)
send_alert() {
    local SEVERITY=$1
    local MESSAGE=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$SEVERITY] $MESSAGE" >> "$ALERT_FILE"
    
    # TODO: Add your alerting mechanism here
    # Example: Send to Discord/Slack webhook
    # curl -X POST -H "Content-Type: application/json" \
    #   -d "{\"content\":\"[$SEVERITY] $MESSAGE\"}" \
    #   YOUR_WEBHOOK_URL
}

# Initialize
ISSUES_FOUND=0
STATUS_MESSAGE=""

# Check Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 10 https://platform.cryb.ai/)
if [ "$FRONTEND_STATUS" != "200" ]; then
    send_alert "CRITICAL" "Frontend is down! Status: $FRONTEND_STATUS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ Frontend: DOWN (Status $FRONTEND_STATUS)"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ Frontend: OK"
fi

# Check API
API_HEALTH=$(curl -s -m 10 https://api.cryb.ai/health 2>/dev/null)
API_STATUS=$(echo "$API_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ -z "$API_STATUS" ] || [ "$API_STATUS" = "unhealthy" ]; then
    send_alert "CRITICAL" "API is unhealthy or unreachable! Status: $API_STATUS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ API: UNHEALTHY"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ API: $API_STATUS"
fi

# Check Database connection through API
DB_STATUS=$(echo "$API_HEALTH" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_STATUS" != "healthy" ]; then
    send_alert "HIGH" "Database is unhealthy! Status: $DB_STATUS"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ Database: $DB_STATUS"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ Database: OK"
fi

# Check Redis
REDIS_CHECK=$(redis-cli -p 6380 ping 2>/dev/null)
if [ "$REDIS_CHECK" != "PONG" ]; then
    send_alert "HIGH" "Redis is not responding!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ Redis: DOWN"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ Redis: OK"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print int($5)}')
if [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "WARNING" "Disk usage is high: ${DISK_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n⚠️  Disk: ${DISK_USAGE}% used"
elif [ "$DISK_USAGE" -gt 90 ]; then
    send_alert "CRITICAL" "Disk usage critical: ${DISK_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ Disk: ${DISK_USAGE}% used"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ Disk: ${DISK_USAGE}% used"
fi

# Check memory
MEM_USAGE=$(free | awk '/^Mem:/ {print int($3/$2 * 100)}')
if [ "$MEM_USAGE" -gt 90 ]; then
    send_alert "WARNING" "Memory usage is high: ${MEM_USAGE}%"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n⚠️  Memory: ${MEM_USAGE}% used"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ Memory: ${MEM_USAGE}% used"
fi

# Check PM2 processes
PM2_STATUS=$(pm2 list --no-color | grep -E "cryb-api|cryb-frontend")
if ! echo "$PM2_STATUS" | grep -q "online"; then
    send_alert "CRITICAL" "PM2 services are not running properly!"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    STATUS_MESSAGE="$STATUS_MESSAGE\n❌ PM2 Services: Issues detected"
else
    STATUS_MESSAGE="$STATUS_MESSAGE\n✅ PM2 Services: OK"
fi

# Log status
if [ "$ISSUES_FOUND" -eq 0 ]; then
    log_message "Health check completed - All systems operational"
else
    log_message "Health check completed - $ISSUES_FOUND issue(s) found"
fi

# Output summary (useful when running manually)
echo -e "Health Check Summary:$STATUS_MESSAGE"
echo ""
echo "Issues found: $ISSUES_FOUND"

exit $ISSUES_FOUND