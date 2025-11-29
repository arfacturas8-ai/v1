#!/bin/bash

# ==============================================
# CRYB PLATFORM - BACKUP MONITORING
# ==============================================
# Monitors backup processes and sends alerts
# ==============================================

LOG_FILE="/var/log/cryb-backups.log"
ALERT_EMAIL="${ALERT_EMAIL:-admin@cryb.ai}"
LAST_CHECK_FILE="/tmp/backup-monitor-last-check"

# Get timestamp of last check (default to 24 hours ago)
if [[ -f "$LAST_CHECK_FILE" ]]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK=$(date -d "24 hours ago" +%s)
fi

# Update last check timestamp
date +%s > "$LAST_CHECK_FILE"

# Check for backup failures since last check
FAILURES=$(grep -E "(ERROR|FAILED)" "$LOG_FILE" | while read line; do
    LOG_DATE=$(echo "$line" | grep -oE "[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}")
    if [[ -n "$LOG_DATE" ]]; then
        LOG_TIMESTAMP=$(date -d "$LOG_DATE" +%s)
        if [[ $LOG_TIMESTAMP -gt $LAST_CHECK ]]; then
            echo "$line"
        fi
    fi
done)

if [[ -n "$FAILURES" ]]; then
    echo "BACKUP FAILURES DETECTED:"
    echo "$FAILURES"
    
    # Send alert (implement your preferred notification method)
    logger -p local0.err "CRYB Platform backup failures detected"
    
    # Example email notification (uncomment and configure if needed)
    # echo "Backup failures detected on $(hostname)" | mail -s "CRYB Backup Alert" "$ALERT_EMAIL"
fi

# Check disk space
BACKUP_DIR="/home/ubuntu/cryb-platform/backups"
DISK_USAGE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 85 ]]; then
    echo "WARNING: Backup disk usage at ${DISK_USAGE}%"
    logger -p local0.warning "CRYB Platform backup disk usage high: ${DISK_USAGE}%"
fi

# Check for old backups
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.gpg" -mtime +35 | wc -l)
if [[ $OLD_BACKUPS -gt 10 ]]; then
    echo "INFO: $OLD_BACKUPS old backup files found (older than 35 days)"
fi

echo "Backup monitoring check completed at $(date)"
