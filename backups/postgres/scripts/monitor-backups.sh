#!/bin/bash
# Database backup monitoring script

BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
LOG_FILE="/var/log/cryb-backup-monitor.log"
ALERT_EMAIL="admin@cryb.ai"

echo "$(date): Starting backup monitoring..." >> "$LOG_FILE"

# Check if backup directory exists and has recent backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "$(date): ERROR - Backup directory not found: $BACKUP_DIR" >> "$LOG_FILE"
    exit 1
fi

# Check for recent full backup (within last 25 hours)
LATEST_FULL=$(find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime -1 | head -1)
if [ -z "$LATEST_FULL" ]; then
    echo "$(date): WARNING - No recent full backup found!" >> "$LOG_FILE"
    # Optionally send alert email here
fi

# Check backup sizes (should be reasonable)
for backup in $(find "$BACKUP_DIR" -name "*.gz" -mtime -1); do
    size=$(du -h "$backup" | cut -f1)
    if [ "$(du -s "$backup" | cut -f1)" -lt 1024 ]; then
        echo "$(date): WARNING - Backup file seems too small: $backup ($size)" >> "$LOG_FILE"
    fi
done

# Check disk space
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$(date): WARNING - Backup disk usage high: $DISK_USAGE%" >> "$LOG_FILE"
fi

echo "$(date): Backup monitoring completed" >> "$LOG_FILE"
