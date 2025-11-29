#!/bin/bash

# ==============================================
# CRYB PLATFORM - BACKUP RESTORATION
# ==============================================
# Restores backups from local or S3 storage
# ==============================================

set -euo pipefail

BACKUP_BASE_DIR="/home/ubuntu/cryb-platform/backups"
ENCRYPTION_KEY_FILE="/etc/cryb-backup-key"
LOG_FILE="/var/log/cryb-backups.log"

# Configuration
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [RESTORE] $*" | tee -a "$LOG_FILE"
}

usage() {
    echo "Usage: $0 <backup_type> <backup_file> [options]"
    echo ""
    echo "Backup types:"
    echo "  database    - Restore PostgreSQL database"
    echo "  application - Restore application files"
    echo "  docker      - Restore Docker volumes"
    echo "  system      - Restore system configuration"
    echo ""
    echo "Options:"
    echo "  --from-s3   - Download backup from S3 first"
    echo "  --dry-run   - Show what would be restored without actually doing it"
    echo ""
    echo "Examples:"
    echo "  $0 database /path/to/backup.sql.gpg"
    echo "  $0 application app_backup_20240101_120000.tar.gz.gpg --from-s3"
    exit 1
}

restore_database() {
    local backup_file="$1"
    local dry_run="$2"
    
    log "Restoring database from: $backup_file"
    
    if [[ "$dry_run" == "true" ]]; then
        log "DRY RUN: Would restore database from $backup_file"
        return 0
    fi
    
    # Decrypt and decompress
    local temp_file="/tmp/restore_db_$(date +%s).sql"
    gpg --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --decrypt "$backup_file" | gunzip > "$temp_file"
    
    # Restore database
    log "Restoring database..."
    PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$temp_file"
    
    # Cleanup
    rm "$temp_file"
    log "Database restoration completed"
}

restore_application() {
    local backup_file="$1"
    local dry_run="$2"
    local restore_path="/home/ubuntu/cryb-platform-restore"
    
    log "Restoring application from: $backup_file"
    
    if [[ "$dry_run" == "true" ]]; then
        log "DRY RUN: Would restore application from $backup_file to $restore_path"
        return 0
    fi
    
    mkdir -p "$restore_path"
    
    # Decrypt and extract
    gpg --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --decrypt "$backup_file" | tar -xzf - -C "$restore_path"
    
    log "Application restoration completed to: $restore_path"
    log "Please review and manually move files to production location"
}

# Parse arguments
if [[ $# -lt 2 ]]; then
    usage
fi

BACKUP_TYPE="$1"
BACKUP_FILE="$2"
FROM_S3="false"
DRY_RUN="false"

shift 2
while [[ $# -gt 0 ]]; do
    case $1 in
        --from-s3)
            FROM_S3="true"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# Download from S3 if requested
if [[ "$FROM_S3" == "true" ]]; then
    log "Downloading backup from S3..."
    local_file="$BACKUP_BASE_DIR/temp/$(basename "$BACKUP_FILE")"
    mkdir -p "$(dirname "$local_file")"
    aws s3 cp "s3://cryb-platform-backups/production-backups/$BACKUP_FILE" "$local_file"
    BACKUP_FILE="$local_file"
fi

# Verify backup file exists
if [[ ! -f "$BACKUP_FILE" ]]; then
    log "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Perform restoration
case "$BACKUP_TYPE" in
    "database")
        restore_database "$BACKUP_FILE" "$DRY_RUN"
        ;;
    "application")
        restore_application "$BACKUP_FILE" "$DRY_RUN"
        ;;
    *)
        log "ERROR: Unsupported backup type: $BACKUP_TYPE"
        exit 1
        ;;
esac

log "Restoration process completed"
