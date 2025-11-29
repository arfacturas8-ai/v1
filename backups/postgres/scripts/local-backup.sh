#!/bin/bash
set -e

# Configuration for local Docker PostgreSQL
DB_CONTAINER="cryb-postgres-optimized"
DB_NAME="cryb"
DB_USER="cryb_user"
DB_PASSWORD="WTuCF1GNjmkuZQwWE/qnZJ9GqbDHhAnQ"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/local_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting local database backup..."
echo "📍 Container: $DB_CONTAINER"
echo "📍 Database: $DB_NAME"
echo "📍 Backup file: $BACKUP_FILE"

# Create full backup using docker exec
docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" pg_dump \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --create \
  --if-exists \
  --no-privileges \
  --no-owner > "$BACKUP_FILE"

# Create custom format backup for faster restore
docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" pg_dump \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-privileges \
  --no-owner > "$BACKUP_FILE.dump"

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

# Get backup statistics
echo "📊 Backup Statistics:"
echo "   - SQL backup size: $(du -h "$BACKUP_FILE.gz" | cut -f1)"
echo "   - Custom backup size: $(du -h "$BACKUP_FILE.dump.gz" | cut -f1)"
echo "   - Database size: $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "local_backup_*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "local_backup_*.dump.gz" -mtime +30 -delete

echo "✅ Local backup completed successfully"
echo "📅 Backup timestamp: $DATE"

# Create backup manifest
cat > "$BACKUP_DIR/latest_backup_info.json" << EOF
{
  "timestamp": "$DATE",
  "database": "$DB_NAME",
  "container": "$DB_CONTAINER",
  "backup_files": {
    "sql": "local_backup_${DATE}.sql.gz",
    "custom": "local_backup_${DATE}.dump.gz"
  },
  "sql_size": "$(du -h "$BACKUP_FILE.gz" | cut -f1)",
  "custom_size": "$(du -h "$BACKUP_FILE.dump.gz" | cut -f1)"
}
EOF

echo "📋 Backup manifest created: latest_backup_info.json"