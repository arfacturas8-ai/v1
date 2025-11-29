#!/bin/bash

# CRYB Platform Automated Backup Script
# Runs daily to backup database and critical files

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_NAME="cryb_db_backup_${DATE}.sql"
FILES_BACKUP_NAME="cryb_files_backup_${DATE}.tar.gz"

# Create backup directory if doesn't exist
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Starting database backup..."
PGPASSWORD=cryb_password pg_dump -h localhost -p 5433 -U cryb_user -d cryb > "$BACKUP_DIR/$DB_BACKUP_NAME"

# Compress database backup
gzip "$BACKUP_DIR/$DB_BACKUP_NAME"

# Backup critical files
echo "Starting files backup..."
tar -czf "$BACKUP_DIR/$FILES_BACKUP_NAME" \
  /home/ubuntu/cryb-platform/.env \
  /home/ubuntu/cryb-platform/packages/database/prisma/schema.prisma \
  /etc/nginx/sites-available/cryb-platform \
  --exclude='node_modules' \
  --exclude='.next' 2>/dev/null

# Remove backups older than 7 days
echo "Cleaning old backups..."
find $BACKUP_DIR -name "cryb_*.gz" -mtime +7 -delete

# Check backup sizes
DB_SIZE=$(du -h "$BACKUP_DIR/${DB_BACKUP_NAME}.gz" | cut -f1)
FILES_SIZE=$(du -h "$BACKUP_DIR/$FILES_BACKUP_NAME" | cut -f1)

echo "Backup completed!"
echo "Database backup: $DB_SIZE"
echo "Files backup: $FILES_SIZE"

# Log to system
logger "CRYB Backup completed - DB: $DB_SIZE, Files: $FILES_SIZE"