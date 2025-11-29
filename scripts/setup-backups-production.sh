#!/bin/bash
# CRYB Platform Production Backup Setup Script
# Sets up automated backups for database, files, and configurations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PLATFORM_DIR="/home/ubuntu/cryb-platform"
BACKUP_DIR="$PLATFORM_DIR/backups"
CONFIG_DIR="$PLATFORM_DIR/config"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "💾 Setting up CRYB Platform Production Backup System..."

# Create backup directories
mkdir -p "$BACKUP_DIR"/{database,files,configs,logs}
mkdir -p "$BACKUP_DIR/scripts"

# Create database backup script
cat > "$BACKUP_DIR/scripts/backup-database.sh" << 'EOF'
#!/bin/bash
# Database backup script for CRYB Platform

set -euo pipefail

BACKUP_DIR="/home/ubuntu/cryb-platform/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Database connection details
DB_CONTAINER="cryb-postgres-optimized"
DB_NAME="cryb"
DB_USER="postgres"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting database backup..."

# Full database backup
BACKUP_FILE="$BACKUP_DIR/cryb_full_backup_$TIMESTAMP.sql"
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"; then
    gzip "$BACKUP_FILE"
    log "Full backup completed: ${BACKUP_FILE}.gz"
else
    log "ERROR: Full backup failed"
    exit 1
fi

# Schema-only backup
SCHEMA_FILE="$BACKUP_DIR/cryb_schema_backup_$TIMESTAMP.sql"
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --schema-only > "$SCHEMA_FILE"; then
    gzip "$SCHEMA_FILE"
    log "Schema backup completed: ${SCHEMA_FILE}.gz"
else
    log "ERROR: Schema backup failed"
fi

# Data-only backup for critical tables
DATA_FILE="$BACKUP_DIR/cryb_data_backup_$TIMESTAMP.sql"
if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --data-only --table=users --table=communities --table=posts > "$DATA_FILE"; then
    gzip "$DATA_FILE"
    log "Data backup completed: ${DATA_FILE}.gz"
else
    log "ERROR: Data backup failed"
fi

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$TIMESTAMP.json"
cat > "$MANIFEST_FILE" << JSON
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +'%Y-%m-%d %H:%M:%S') UTC",
  "database": "$DB_NAME",
  "files": [
    "cryb_full_backup_$TIMESTAMP.sql.gz",
    "cryb_schema_backup_$TIMESTAMP.sql.gz",
    "cryb_data_backup_$TIMESTAMP.sql.gz"
  ],
  "size_mb": $(du -sm $BACKUP_DIR/*$TIMESTAMP* | awk '{sum += $1} END {print sum}'),
  "type": "automated"
}
JSON

# Clean up old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.json" -type f -mtime +$RETENTION_DAYS -delete

# Get backup directory size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Backup completed. Total backup directory size: $BACKUP_SIZE"

# Log to system journal
logger -t cryb-backup "Database backup completed successfully - $TIMESTAMP"
EOF

chmod +x "$BACKUP_DIR/scripts/backup-database.sh"

# Create files backup script
cat > "$BACKUP_DIR/scripts/backup-files.sh" << 'EOF'
#!/bin/bash
# Files and configuration backup script for CRYB Platform

set -euo pipefail

PLATFORM_DIR="/home/ubuntu/cryb-platform"
BACKUP_DIR="$PLATFORM_DIR/backups/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting files backup..."

# Backup configurations
CONFIG_BACKUP="$BACKUP_DIR/configs_backup_$TIMESTAMP.tar.gz"
tar -czf "$CONFIG_BACKUP" -C "$PLATFORM_DIR" \
    config/ \
    .env* \
    ecosystem.config.js \
    docker-compose*.yml \
    systemd/ \
    2>/dev/null

if [ -f "$CONFIG_BACKUP" ]; then
    log "Configuration backup completed: $CONFIG_BACKUP"
else
    log "ERROR: Configuration backup failed"
fi

# Backup application source (excluding node_modules)
SOURCE_BACKUP="$BACKUP_DIR/source_backup_$TIMESTAMP.tar.gz"
tar -czf "$SOURCE_BACKUP" -C "$PLATFORM_DIR" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="build" \
    --exclude=".next" \
    --exclude="logs" \
    --exclude="backups" \
    apps/ \
    packages/ \
    services/ \
    2>/dev/null

if [ -f "$SOURCE_BACKUP" ]; then
    log "Source backup completed: $SOURCE_BACKUP"
else
    log "ERROR: Source backup failed"
fi

# Backup logs (last 7 days)
if [ -d "$PLATFORM_DIR/logs" ]; then
    LOGS_BACKUP="$BACKUP_DIR/logs_backup_$TIMESTAMP.tar.gz"
    find "$PLATFORM_DIR/logs" -name "*.log" -mtime -7 -type f | \
    tar -czf "$LOGS_BACKUP" -T -
    
    if [ -f "$LOGS_BACKUP" ]; then
        log "Logs backup completed: $LOGS_BACKUP"
    fi
fi

# Backup MinIO data if accessible
if docker ps | grep -q cryb-minio; then
    MINIO_BACKUP="$BACKUP_DIR/minio_backup_$TIMESTAMP.tar.gz"
    docker exec cryb-minio tar -czf - /data 2>/dev/null | cat > "$MINIO_BACKUP" || true
    if [ -s "$MINIO_BACKUP" ]; then
        log "MinIO backup completed: $MINIO_BACKUP"
    else
        rm -f "$MINIO_BACKUP"
        log "MinIO backup skipped (not accessible)"
    fi
fi

# Clean up old backups
log "Cleaning up file backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Files backup completed. Directory size: $BACKUP_SIZE"

logger -t cryb-backup "Files backup completed successfully - $TIMESTAMP"
EOF

chmod +x "$BACKUP_DIR/scripts/backup-files.sh"

# Create restore script
cat > "$BACKUP_DIR/scripts/restore-database.sh" << 'EOF'
#!/bin/bash
# Database restore script for CRYB Platform

set -euo pipefail

BACKUP_DIR="/home/ubuntu/cryb-platform/backups/database"
DB_CONTAINER="cryb-postgres-optimized"
DB_NAME="cryb"
DB_USER="postgres"

usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 cryb_full_backup_20240918_120000.sql.gz"
    exit 1
}

if [ $# -eq 0 ]; then
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/*.gz 2>/dev/null || echo "No backups found"
    usage
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting database restore from: $BACKUP_FILE"

# Confirm restore
read -p "This will overwrite the current database. Are you sure? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Stop application services
log "Stopping application services..."
pm2 stop all || true

# Create backup of current database before restore
CURRENT_BACKUP="$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
log "Creating backup of current database..."
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$CURRENT_BACKUP"
gzip "$CURRENT_BACKUP"
log "Current database backed up to: ${CURRENT_BACKUP}.gz"

# Restore database
log "Restoring database from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    zcat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
    cat "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
fi

if [ $? -eq 0 ]; then
    log "Database restore completed successfully"
    
    # Restart application services
    log "Restarting application services..."
    pm2 start ecosystem.config.js --env production
    
    log "Restore completed successfully!"
else
    log "ERROR: Database restore failed"
    log "Restoring from pre-restore backup..."
    zcat "${CURRENT_BACKUP}.gz" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    pm2 start ecosystem.config.js --env production
    exit 1
fi
EOF

chmod +x "$BACKUP_DIR/scripts/restore-database.sh"

# Create comprehensive backup script
cat > "$BACKUP_DIR/scripts/backup-all.sh" << 'EOF'
#!/bin/bash
# Complete backup script for CRYB Platform

set -euo pipefail

BACKUP_DIR="/home/ubuntu/cryb-platform/backups"
LOG_FILE="$BACKUP_DIR/logs/backup.log"

mkdir -p "$BACKUP_DIR/logs"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting complete CRYB Platform backup ==="

# Run database backup
log "Running database backup..."
"$BACKUP_DIR/scripts/backup-database.sh" 2>&1 | tee -a "$LOG_FILE"

# Run files backup
log "Running files backup..."
"$BACKUP_DIR/scripts/backup-files.sh" 2>&1 | tee -a "$LOG_FILE"

# Generate backup report
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$BACKUP_DIR/logs/backup_report_$TIMESTAMP.json"

cat > "$REPORT_FILE" << JSON
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -u +'%Y-%m-%d %H:%M:%S') UTC",
  "backup_sizes": {
    "database": "$(du -sh $BACKUP_DIR/database 2>/dev/null | cut -f1 || echo '0')",
    "files": "$(du -sh $BACKUP_DIR/files 2>/dev/null | cut -f1 || echo '0')",
    "total": "$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1 || echo '0')"
  },
  "status": "completed",
  "log_file": "$LOG_FILE"
}
JSON

log "Backup completed. Report: $REPORT_FILE"
log "=== Backup session completed ==="

# Send notification (implement webhook/email here)
logger -t cryb-backup "Complete backup finished - $TIMESTAMP"
EOF

chmod +x "$BACKUP_DIR/scripts/backup-all.sh"

# Set up backup cron jobs
log "Setting up backup cron jobs..."

# Database backup - every 6 hours
(crontab -l 2>/dev/null | grep -v "backup-database.sh"; echo "0 */6 * * * $BACKUP_DIR/scripts/backup-database.sh") | crontab -

# Files backup - daily at 3 AM
(crontab -l 2>/dev/null | grep -v "backup-files.sh"; echo "0 3 * * * $BACKUP_DIR/scripts/backup-files.sh") | crontab -

# Complete backup - weekly on Sunday at 2 AM
(crontab -l 2>/dev/null | grep -v "backup-all.sh"; echo "0 2 * * 0 $BACKUP_DIR/scripts/backup-all.sh") | crontab -

success "Backup cron jobs configured"

# Test backup scripts
log "Testing backup scripts..."

# Create a test backup
log "Running test database backup..."
if "$BACKUP_DIR/scripts/backup-database.sh"; then
    success "Database backup test passed"
else
    warning "Database backup test failed"
fi

# Create backup information file
cat > "$BACKUP_DIR/backup-info.md" << 'EOF'
# CRYB Platform Backup System

## Backup Schedule
- **Database**: Every 6 hours
- **Files**: Daily at 3 AM
- **Complete**: Weekly on Sunday at 2 AM

## Backup Types
1. **Database Backups** (`/backups/database/`)
   - Full backup (schema + data)
   - Schema-only backup
   - Data-only backup (critical tables)

2. **File Backups** (`/backups/files/`)
   - Application configurations
   - Source code (excluding node_modules)
   - Recent logs (last 7 days)
   - MinIO data (if accessible)

## Retention Policy
- Database backups: 30 days
- File backups: 7 days
- Logs: 30 days

## Manual Commands
```bash
# Full backup
/home/ubuntu/cryb-platform/backups/scripts/backup-all.sh

# Database only
/home/ubuntu/cryb-platform/backups/scripts/backup-database.sh

# Files only
/home/ubuntu/cryb-platform/backups/scripts/backup-files.sh

# Restore database
/home/ubuntu/cryb-platform/backups/scripts/restore-database.sh <backup_file>
```

## Monitoring
- Backup logs: `/home/ubuntu/cryb-platform/backups/logs/`
- System journal: `journalctl -t cryb-backup`
- Cron status: `crontab -l`

## Recovery Testing
Regularly test backup restoration to ensure data integrity:
1. Create test environment
2. Restore from backup
3. Verify application functionality
4. Document any issues

## Off-site Backup
For production, consider:
1. AWS S3 backup integration
2. External backup service
3. Geographic redundancy
4. Encrypted backup storage
EOF

# Create backup monitoring script
cat > "$BACKUP_DIR/scripts/backup-monitor.sh" << 'EOF'
#!/bin/bash
# Backup monitoring script

BACKUP_DIR="/home/ubuntu/cryb-platform/backups"
ALERT_AGE_HOURS=25  # Alert if no backup in 25 hours

check_recent_backups() {
    local backup_type=$1
    local dir="$BACKUP_DIR/$backup_type"
    
    if [ ! -d "$dir" ]; then
        echo "WARNING: $backup_type backup directory not found"
        return 1
    fi
    
    local latest=$(find "$dir" -name "*.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)
    
    if [ -z "$latest" ]; then
        echo "ERROR: No $backup_type backups found"
        return 1
    fi
    
    local age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest")) / 3600 ))
    
    if [ $age_hours -gt $ALERT_AGE_HOURS ]; then
        echo "WARNING: Latest $backup_type backup is $age_hours hours old"
        return 1
    else
        echo "OK: Latest $backup_type backup is $age_hours hours old"
        return 0
    fi
}

echo "=== Backup Status Check ==="
check_recent_backups "database"
check_recent_backups "files"

# Check backup disk usage
backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "Total backup size: $backup_size"

# Check available disk space
available=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
echo "Available space: $available"
EOF

chmod +x "$BACKUP_DIR/scripts/backup-monitor.sh"

# Add backup monitoring to cron
(crontab -l 2>/dev/null | grep -v "backup-monitor.sh"; echo "0 8 * * * $BACKUP_DIR/scripts/backup-monitor.sh") | crontab -

success "💾 Backup system setup completed!"
echo
echo "Backup System Summary:"
echo "======================"
echo "✓ Database backup: Every 6 hours"
echo "✓ Files backup: Daily at 3 AM"
echo "✓ Complete backup: Weekly on Sunday"
echo "✓ Monitoring: Daily at 8 AM"
echo
echo "Backup Locations:"
echo "- Database: $BACKUP_DIR/database/"
echo "- Files: $BACKUP_DIR/files/"
echo "- Logs: $BACKUP_DIR/logs/"
echo
echo "Manual Commands:"
echo "- Full backup: $BACKUP_DIR/scripts/backup-all.sh"
echo "- Database restore: $BACKUP_DIR/scripts/restore-database.sh <file>"
echo "- Monitor status: $BACKUP_DIR/scripts/backup-monitor.sh"
echo
echo "Next Steps:"
echo "1. Test restore process"
echo "2. Set up off-site backup sync"
echo "3. Configure backup alerts"

log "Backup system setup completed!"