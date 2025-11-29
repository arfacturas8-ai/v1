#!/bin/bash

# Database backup script for Cryb Platform
# This script creates daily backups and keeps 7 days of history

BACKUP_DIR="/home/ubuntu/backups/database"
DB_NAME="cryb_platform"
DB_USER="cryb_user"
DB_PASS="cryb_password"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cryb_db_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."

# Create backup
PGPASSWORD="$DB_PASS" pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup created successfully: $BACKUP_FILE"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup size: $SIZE"
    
    # Remove backups older than 7 days
    find "$BACKUP_DIR" -name "cryb_db_*.sql.gz" -type f -mtime +7 -delete
    echo "[$(date)] Cleaned up old backups (kept last 7 days)"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

echo "[$(date)] Backup process completed"