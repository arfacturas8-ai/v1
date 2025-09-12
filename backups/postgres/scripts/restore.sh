#!/bin/bash
set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 full_backup_20241201_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database and may overwrite existing data!"
echo "📂 Backup file: $BACKUP_FILE"
echo "🎯 Target database: $DB_NAME on $DB_HOST"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Starting database restore..."

# Determine file type and restore accordingly
if [[ "$BACKUP_FILE" == *.sql.gz ]]; then
    # SQL format
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres"
elif [[ "$BACKUP_FILE" == *.dump.gz ]]; then
    # Custom format
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --clean \
        --create \
        --if-exists \
        --verbose
else
    echo "❌ Unsupported backup file format"
    exit 1
fi

echo "✅ Database restore completed successfully"
echo "🔍 Verifying restore..."

# Basic verification
PGPASSWORD="$DB_PASSWORD" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --command="SELECT COUNT(*) as user_count FROM \"User\"; SELECT COUNT(*) as server_count FROM \"Server\"; SELECT COUNT(*) as message_count FROM \"Message\";"

echo "✅ Restore verification completed"
