#!/bin/bash
set -e

# Configuration for Docker PostgreSQL
DB_CONTAINER="cryb-postgres-optimized"
DB_NAME="cryb"
DB_USER="cryb_user"
DB_PASSWORD="cryb_secure_db_2024_prod"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting full database backup..."
echo "📍 Backup file: $BACKUP_FILE"

# Create full backup using Docker exec
docker exec "$DB_CONTAINER" pg_dump \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --create \
  --if-exists \
  --format=custom \
  --no-privileges \
  --no-owner > "$BACKUP_FILE.dump"

# Create SQL version for readability
docker exec "$DB_CONTAINER" pg_dump \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --clean \
  --create \
  --if-exists \
  --no-privileges \
  --no-owner > "$BACKUP_FILE"

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

# Update backup info
cat > "$BACKUP_DIR/latest_backup_info.json" << EOF
{
  "backup_date": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
  "backup_file": "$(basename "$BACKUP_FILE.gz")",
  "backup_dump_file": "$(basename "$BACKUP_FILE.dump.gz")",
  "backup_size_sql": "$(du -h "$BACKUP_FILE.gz" | cut -f1)",
  "backup_size_dump": "$(du -h "$BACKUP_FILE.dump.gz" | cut -f1)",
  "database_name": "$DB_NAME",
  "container_name": "$DB_CONTAINER"
}
EOF

# Optional: Upload to S3
if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
  echo "☁️  Uploading to S3..."
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  aws s3 cp "$BACKUP_FILE.dump.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  echo "✅ S3 upload completed"
fi
