#!/bin/bash
set -e

# Configuration
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/schema_backup_$DATE.sql"

echo "📐 Starting schema backup..."

# Create schema-only backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --schema-only \
  --clean \
  --create \
  --if-exists \
  --no-privileges \
  --no-owner \
  --file="$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 10 schema backups
find "$BACKUP_DIR" -name "schema_backup_*.sql.gz" | sort -r | tail -n +11 | xargs rm -f

echo "✅ Schema backup completed"
