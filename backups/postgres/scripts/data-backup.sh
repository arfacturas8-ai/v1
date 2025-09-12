#!/bin/bash
set -e

# Configuration
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data_backup_$DATE.sql"

echo "📊 Starting data-only backup..."

# Create data-only backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --data-only \
  --disable-triggers \
  --no-privileges \
  --no-owner \
  --format=custom \
  --file="$BACKUP_FILE.dump"

# Compress backup
gzip "$BACKUP_FILE.dump"

# Clean up old data backups (keep last 7 days)
find "$BACKUP_DIR" -name "data_backup_*.dump.gz" -mtime +7 -delete

echo "✅ Data backup completed"
