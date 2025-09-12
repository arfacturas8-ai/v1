#!/bin/bash
set -e

# Configuration
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting full database backup..."
echo "📍 Backup file: $BACKUP_FILE"

# Create full backup using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --create \
  --if-exists \
  --format=custom \
  --no-privileges \
  --no-owner \
  --file="$BACKUP_FILE.dump"

# Create SQL version for readability
PGPASSWORD="$DB_PASSWORD" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --clean \
  --create \
  --if-exists \
  --no-privileges \
  --no-owner \
  --file="$BACKUP_FILE"

# Compress backups
gzip "$BACKUP_FILE"
gzip "$BACKUP_FILE.dump"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE.gz" && gunzip -t "$BACKUP_FILE.dump.gz"; then
  echo "✅ Backup integrity verified"
else
  echo "❌ Backup integrity check failed"
  exit 1
fi

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "full_backup_*.dump.gz" -mtime +30 -delete

echo "✅ Full backup completed successfully"
echo "📊 Backup size: $(du -h "$BACKUP_FILE.gz" | cut -f1)"

# Optional: Upload to S3
if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
  echo "☁️  Uploading to S3..."
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  aws s3 cp "$BACKUP_FILE.dump.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  echo "✅ S3 upload completed"
fi
