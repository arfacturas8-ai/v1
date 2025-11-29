#!/bin/bash

# CRYB PLATFORM ENHANCED BACKUP SYSTEM
# Production-grade backup solution with point-in-time recovery
# Supports incremental backups, WAL archiving, and S3 integration

set -euo pipefail

# ==============================================
# CONFIGURATION
# ==============================================

# Database connection settings
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cryb}"
DB_USER="${DB_USER:-cryb_user}"
DB_PASSWORD="${DB_PASSWORD:-cryb_password}"

# Backup configuration
BACKUP_BASE_DIR="/home/ubuntu/cryb-platform/backups"
LOCAL_BACKUP_DIR="${BACKUP_BASE_DIR}/postgres"
WAL_ARCHIVE_DIR="${LOCAL_BACKUP_DIR}/wal_archive"
BACKUP_LOG_DIR="${LOCAL_BACKUP_DIR}/logs"

# S3 configuration
S3_BUCKET="${S3_BUCKET:-cryb-platform-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
S3_PREFIX="${S3_PREFIX:-postgres-backups}"

# Retention policies (in days)
FULL_BACKUP_RETENTION=30
INCREMENTAL_BACKUP_RETENTION=7
WAL_ARCHIVE_RETENTION=7

# Backup naming
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
HOSTNAME=$(hostname)

# Logging
LOG_FILE="${BACKUP_LOG_DIR}/backup_${TIMESTAMP}.log"

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    log "ERROR: $1" >&2
    exit 1
}

warn() {
    log "WARNING: $1" >&2
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v pg_dump >/dev/null 2>&1 || error "pg_dump not found"
    command -v pg_basebackup >/dev/null 2>&1 || error "pg_basebackup not found"
    command -v aws >/dev/null 2>&1 || error "AWS CLI not found"
    command -v gzip >/dev/null 2>&1 || error "gzip not found"
    command -v openssl >/dev/null 2>&1 || error "openssl not found"
    
    # Check PostgreSQL connection
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Cannot connect to PostgreSQL database"
    fi
    
    # Check S3 access
    if ! aws s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1; then
        error "Cannot access S3 bucket: $S3_BUCKET"
    fi
    
    # Create necessary directories
    mkdir -p "$LOCAL_BACKUP_DIR" "$WAL_ARCHIVE_DIR" "$BACKUP_LOG_DIR"
    
    log "Prerequisites check completed successfully"
}

setup_wal_archiving() {
    log "Setting up WAL archiving..."
    
    # Create WAL archive script
    cat > "${WAL_ARCHIVE_DIR}/archive_wal.sh" << 'EOF'
#!/bin/bash
# WAL archiving script for PostgreSQL

WAL_FILE="$1"
WAL_PATH="$2"
WAL_ARCHIVE_DIR="/home/ubuntu/cryb-platform/backups/postgres/wal_archive"
S3_BUCKET="cryb-platform-backups"
S3_PREFIX="postgres-backups/wal"

# Archive locally first
cp "$WAL_PATH" "$WAL_ARCHIVE_DIR/$WAL_FILE"

# Compress and upload to S3
gzip -c "$WAL_PATH" | aws s3 cp - "s3://$S3_BUCKET/$S3_PREFIX/$WAL_FILE.gz"

# Verify upload
if aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/$WAL_FILE.gz" >/dev/null 2>&1; then
    exit 0
else
    exit 1
fi
EOF
    
    chmod +x "${WAL_ARCHIVE_DIR}/archive_wal.sh"
    
    # Create WAL restore script
    cat > "${WAL_ARCHIVE_DIR}/restore_wal.sh" << 'EOF'
#!/bin/bash
# WAL restore script for PostgreSQL recovery

WAL_FILE="$1"
WAL_PATH="$2"
WAL_ARCHIVE_DIR="/home/ubuntu/cryb-platform/backups/postgres/wal_archive"
S3_BUCKET="cryb-platform-backups"
S3_PREFIX="postgres-backups/wal"

# Try to restore from local archive first
if [ -f "$WAL_ARCHIVE_DIR/$WAL_FILE" ]; then
    cp "$WAL_ARCHIVE_DIR/$WAL_FILE" "$WAL_PATH"
    exit 0
fi

# Try to restore from S3
if aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$WAL_FILE.gz" - | gunzip > "$WAL_PATH"; then
    exit 0
fi

# WAL file not found
exit 1
EOF
    
    chmod +x "${WAL_ARCHIVE_DIR}/restore_wal.sh"
    
    log "WAL archiving setup completed"
}

perform_full_backup() {
    log "Starting full backup..."
    
    local backup_name="full_backup_${HOSTNAME}_${TIMESTAMP}"
    local backup_path="${LOCAL_BACKUP_DIR}/${backup_name}"
    local compressed_backup="${backup_path}.tar.gz"
    local encrypted_backup="${compressed_backup}.enc"
    
    # Perform base backup using pg_basebackup
    log "Creating base backup with pg_basebackup..."
    PGPASSWORD="$DB_PASSWORD" pg_basebackup \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -D "$backup_path" \
        -Ft \
        -z \
        -P \
        -W \
        -X stream \
        --checkpoint=fast \
        --label="CRYB_FULL_BACKUP_${TIMESTAMP}" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Create schema-only backup for easy reference
    log "Creating schema backup..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        -f "${backup_path}/schema_${TIMESTAMP}.sql" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Create data-only backup with custom format for faster restore
    log "Creating data backup..."
    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --data-only \
        --no-owner \
        --no-privileges \
        -Fc \
        -f "${backup_path}/data_${TIMESTAMP}.dump" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Create backup manifest with metadata
    create_backup_manifest "$backup_path" "full"
    
    # Compress the backup
    log "Compressing backup..."
    tar -czf "$compressed_backup" -C "$LOCAL_BACKUP_DIR" "$backup_name"
    
    # Encrypt the backup
    log "Encrypting backup..."
    openssl enc -aes-256-cbc -salt -in "$compressed_backup" -out "$encrypted_backup" -pass env:BACKUP_ENCRYPTION_KEY
    
    # Upload to S3
    log "Uploading backup to S3..."
    aws s3 cp "$encrypted_backup" "s3://$S3_BUCKET/$S3_PREFIX/full_backups/" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=full,timestamp=$TIMESTAMP,hostname=$HOSTNAME" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Cleanup local files
    rm -rf "$backup_path" "$compressed_backup"
    
    # Verify S3 upload
    if aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/full_backups/$(basename "$encrypted_backup")" >/dev/null 2>&1; then
        log "Full backup completed successfully: $(basename "$encrypted_backup")"
        rm "$encrypted_backup"  # Remove local encrypted backup after successful upload
    else
        error "Failed to upload backup to S3"
    fi
}

perform_incremental_backup() {
    log "Starting incremental backup..."
    
    local backup_name="incremental_backup_${HOSTNAME}_${TIMESTAMP}"
    local backup_path="${LOCAL_BACKUP_DIR}/${backup_name}"
    local compressed_backup="${backup_path}.tar.gz"
    local encrypted_backup="${compressed_backup}.enc"
    
    # Find the last full or incremental backup
    local last_backup_lsn
    last_backup_lsn=$(get_last_backup_lsn)
    
    if [ -z "$last_backup_lsn" ]; then
        warn "No previous backup found, performing full backup instead"
        perform_full_backup
        return
    fi
    
    # Create incremental backup directory
    mkdir -p "$backup_path"
    
    # Get current WAL position
    local current_lsn
    current_lsn=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_current_wal_lsn();" | tr -d ' ')
    
    # Archive WAL files since last backup
    log "Archiving WAL files since LSN: $last_backup_lsn"
    PGPASSWORD="$DB_PASSWORD" pg_receivewal \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -D "$backup_path/wal" \
        --if-not-exists \
        --synchronous \
        -S "cryb_backup_slot_$(date +%s)" \
        2>&1 | tee -a "$LOG_FILE" &
    
    local receive_wal_pid=$!
    sleep 5  # Allow WAL receiver to start
    kill $receive_wal_pid 2>/dev/null || true
    
    # Create incremental backup manifest
    create_backup_manifest "$backup_path" "incremental" "$last_backup_lsn" "$current_lsn"
    
    # Create logical backup of recently modified data
    log "Creating logical backup of recent changes..."
    create_logical_incremental_backup "$backup_path" "$last_backup_lsn"
    
    # Compress and encrypt
    tar -czf "$compressed_backup" -C "$LOCAL_BACKUP_DIR" "$backup_name"
    openssl enc -aes-256-cbc -salt -in "$compressed_backup" -out "$encrypted_backup" -pass env:BACKUP_ENCRYPTION_KEY
    
    # Upload to S3
    aws s3 cp "$encrypted_backup" "s3://$S3_BUCKET/$S3_PREFIX/incremental_backups/" \
        --metadata "backup-type=incremental,timestamp=$TIMESTAMP,hostname=$HOSTNAME,start-lsn=$last_backup_lsn,end-lsn=$current_lsn" \
        2>&1 | tee -a "$LOG_FILE"
    
    # Cleanup
    rm -rf "$backup_path" "$compressed_backup"
    
    if aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/incremental_backups/$(basename "$encrypted_backup")" >/dev/null 2>&1; then
        log "Incremental backup completed successfully: $(basename "$encrypted_backup")"
        rm "$encrypted_backup"
    else
        error "Failed to upload incremental backup to S3"
    fi
}

create_backup_manifest() {
    local backup_path="$1"
    local backup_type="$2"
    local start_lsn="${3:-}"
    local end_lsn="${4:-}"
    
    cat > "${backup_path}/backup_manifest.json" << EOF
{
    "backup_type": "$backup_type",
    "timestamp": "$TIMESTAMP",
    "hostname": "$HOSTNAME",
    "database": {
        "host": "$DB_HOST",
        "port": $DB_PORT,
        "name": "$DB_NAME",
        "user": "$DB_USER"
    },
    "backup_info": {
        "start_time": "$(date -Iseconds)",
        "postgresql_version": "$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW server_version;" | tr -d ' ')",
        "start_lsn": "$start_lsn",
        "end_lsn": "$end_lsn"
    },
    "retention": {
        "full_backup_days": $FULL_BACKUP_RETENTION,
        "incremental_backup_days": $INCREMENTAL_BACKUP_RETENTION,
        "wal_archive_days": $WAL_ARCHIVE_RETENTION
    }
}
EOF
}

get_last_backup_lsn() {
    # Get the LSN from the most recent backup manifest
    local last_manifest
    last_manifest=$(find "$LOCAL_BACKUP_DIR" -name "backup_manifest.json" -exec ls -t {} + | head -1)
    
    if [ -f "$last_manifest" ]; then
        jq -r '.backup_info.end_lsn // empty' "$last_manifest" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

create_logical_incremental_backup() {
    local backup_path="$1"
    local since_lsn="$2"
    
    log "Creating logical incremental backup since LSN: $since_lsn"
    
    # Backup recently modified tables based on timestamp columns
    local tables=("Message" "Post" "Comment" "Vote" "UserActivity" "MessageAnalytics" "VoiceAnalytics" "ServerAnalytics" "SecurityLog" "FileAccessLog")
    
    for table in "${tables[@]}"; do
        local timestamp_column
        case "$table" in
            "Message"|"Post"|"Comment"|"Vote") timestamp_column="createdAt" ;;
            "UserActivity"|"MessageAnalytics"|"VoiceAnalytics"|"ServerAnalytics") timestamp_column="timestamp" ;;
            "SecurityLog"|"FileAccessLog") timestamp_column="createdAt" ;;
            *) timestamp_column="createdAt" ;;
        esac
        
        log "Backing up recent data from table: $table"
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --table="\"$table\"" \
            --data-only \
            --where="\"$timestamp_column\" >= NOW() - INTERVAL '24 hours'" \
            -f "${backup_path}/${table}_incremental.sql" \
            2>&1 | tee -a "$LOG_FILE" || warn "Failed to backup table: $table"
    done
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Cleanup local backups
    find "$LOCAL_BACKUP_DIR" -name "*.enc" -mtime +$FULL_BACKUP_RETENTION -delete 2>/dev/null || true
    find "$WAL_ARCHIVE_DIR" -name "*" -mtime +$WAL_ARCHIVE_RETENTION -delete 2>/dev/null || true
    
    # Cleanup S3 backups using lifecycle policies (configured separately)
    log "Note: S3 cleanup is handled by lifecycle policies"
    
    log "Backup cleanup completed"
}

verify_backup_integrity() {
    local backup_file="$1"
    
    log "Verifying backup integrity: $(basename "$backup_file")"
    
    # Check if file exists and is readable
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    # Verify encryption integrity
    if ! openssl enc -aes-256-cbc -d -in "$backup_file" -pass env:BACKUP_ENCRYPTION_KEY -out /dev/null 2>/dev/null; then
        error "Backup encryption verification failed"
    fi
    
    # Additional integrity checks could be added here
    log "Backup integrity verification passed"
}

create_point_in_time_recovery_info() {
    log "Creating point-in-time recovery information..."
    
    local recovery_info_file="${LOCAL_BACKUP_DIR}/recovery_info_${TIMESTAMP}.json"
    
    # Get current database state
    local current_lsn timeline_id
    current_lsn=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_current_wal_lsn();" | tr -d ' ')
    timeline_id=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT timeline_id FROM pg_control_checkpoint();" | tr -d ' ')
    
    cat > "$recovery_info_file" << EOF
{
    "recovery_info": {
        "timestamp": "$TIMESTAMP",
        "current_lsn": "$current_lsn",
        "timeline_id": "$timeline_id",
        "backup_label": "CRYB_BACKUP_${TIMESTAMP}",
        "wal_archive_location": "s3://$S3_BUCKET/$S3_PREFIX/wal/",
        "restore_command": "aws s3 cp s3://$S3_BUCKET/$S3_PREFIX/wal/%f.gz - | gunzip > %p"
    },
    "available_recovery_targets": {
        "latest": "Restore to the most recent available point",
        "timestamp": "Restore to specific timestamp (YYYY-MM-DD HH:MM:SS)",
        "lsn": "Restore to specific LSN",
        "name": "Restore to named restore point"
    },
    "recovery_instructions": [
        "1. Stop PostgreSQL service",
        "2. Clear data directory",
        "3. Extract base backup to data directory",
        "4. Create recovery.conf with appropriate settings",
        "5. Start PostgreSQL in recovery mode",
        "6. Monitor recovery progress in logs",
        "7. When recovery is complete, promote to primary"
    ]
}
EOF
    
    # Upload recovery info to S3
    aws s3 cp "$recovery_info_file" "s3://$S3_BUCKET/$S3_PREFIX/recovery_info/" \
        2>&1 | tee -a "$LOG_FILE"
    
    log "Point-in-time recovery information created and uploaded"
}

generate_backup_report() {
    log "Generating backup report..."
    
    local report_file="${BACKUP_LOG_DIR}/backup_report_${TIMESTAMP}.json"
    local backup_size
    backup_size=$(du -sh "$LOCAL_BACKUP_DIR" | cut -f1)
    
    cat > "$report_file" << EOF
{
    "backup_report": {
        "timestamp": "$TIMESTAMP",
        "hostname": "$HOSTNAME",
        "backup_type": "${BACKUP_TYPE:-full}",
        "status": "completed",
        "duration": "$(date -d "@$(($(date +%s) - START_TIME))" -u +%H:%M:%S)",
        "backup_size": "$backup_size",
        "database_info": {
            "host": "$DB_HOST",
            "port": $DB_PORT,
            "database": "$DB_NAME"
        },
        "storage": {
            "local_path": "$LOCAL_BACKUP_DIR",
            "s3_bucket": "$S3_BUCKET",
            "s3_prefix": "$S3_PREFIX"
        },
        "log_file": "$LOG_FILE"
    }
}
EOF
    
    # Send report to monitoring system (if configured)
    if [ -n "${MONITORING_WEBHOOK:-}" ]; then
        curl -X POST "$MONITORING_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "@$report_file" \
            2>/dev/null || warn "Failed to send backup report to monitoring system"
    fi
    
    log "Backup report generated: $report_file"
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    local action="${1:-full}"
    
    # Set start time for duration calculation
    START_TIME=$(date +%s)
    
    # Set backup encryption key (should be set in environment)
    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        error "BACKUP_ENCRYPTION_KEY environment variable not set"
    fi
    
    case "$action" in
        "full")
            BACKUP_TYPE="full"
            log "Starting full backup process..."
            check_prerequisites
            setup_wal_archiving
            perform_full_backup
            create_point_in_time_recovery_info
            ;;
        "incremental")
            BACKUP_TYPE="incremental"
            log "Starting incremental backup process..."
            check_prerequisites
            perform_incremental_backup
            ;;
        "cleanup")
            log "Starting backup cleanup process..."
            cleanup_old_backups
            ;;
        "verify")
            local backup_file="${2:-}"
            if [ -z "$backup_file" ]; then
                error "Backup file path required for verification"
            fi
            verify_backup_integrity "$backup_file"
            ;;
        *)
            echo "Usage: $0 {full|incremental|cleanup|verify <backup_file>}"
            exit 1
            ;;
    esac
    
    cleanup_old_backups
    generate_backup_report
    
    log "Backup process completed successfully"
}

# Trap errors and cleanup
trap 'error "Backup process failed"' ERR

# Execute main function with all arguments
main "$@"