#!/bin/bash

# ==============================================
# CRYB PLATFORM - COMPREHENSIVE BACKUP SYSTEM
# ==============================================
# Production-ready backup solution
# Features:
# - PostgreSQL automated backups
# - Redis data snapshots
# - MinIO object storage backups
# - Encrypted storage
# - Retention policies
# - Recovery validation
# - Cross-region replication
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_ROOT="/opt/cryb-backups"
S3_BACKUP_BUCKET="cryb-backups-$(date +%Y)"
ENCRYPTION_KEY_FILE="/etc/cryb/backup-encryption.key"
RETENTION_DAYS=30
RETENTION_WEEKS=12
RETENTION_MONTHS=24

# Database Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cryb}"
DB_USER="${DB_USER:-cryb_user}"
DB_PASSWORD="${DB_PASSWORD:-cryb_password}"

# Redis Configuration
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-cryb_redis_password}"

# MinIO Configuration
MINIO_ENDPOINT="${MINIO_ENDPOINT:-minio:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin123}"

# Notification Configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-admin@cryb.ai}"

# Logging
LOG_FILE="/var/log/cryb-backup.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Send notification
send_notification() {
    local message="$1"
    local status="$2"  # success, warning, or error
    local icon=""
    
    case $status in
        "success") icon="✅" ;;
        "warning") icon="⚠️" ;;
        "error") icon="🔥" ;;
        *) icon="ℹ️" ;;
    esac
    
    local full_message="$icon CRYB Backup $status: $message"
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$full_message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK_URL" ]]; then
        curl -H "Content-Type: application/json" \
            -X POST \
            -d "{\"content\":\"$full_message\"}" \
            "$DISCORD_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Email notification for critical issues
    if [[ "$status" == "error" && -n "$NOTIFICATION_EMAIL" ]]; then
        echo "$full_message" | mail -s "CRYB Backup Alert" "$NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
    
    log "$full_message"
}

# Initialize backup system
initialize_backup_system() {
    log "Initializing backup system..."
    
    # Create backup directories
    sudo mkdir -p "$BACKUP_ROOT"/{postgresql,redis,minio,logs,temp}
    sudo mkdir -p "$BACKUP_ROOT"/postgresql/{daily,weekly,monthly}
    sudo mkdir -p "$BACKUP_ROOT"/redis/{daily,weekly,monthly}
    sudo mkdir -p "$BACKUP_ROOT"/minio/{daily,weekly,monthly}
    
    # Set proper permissions
    sudo chown -R $USER:$USER "$BACKUP_ROOT"
    sudo chmod -R 750 "$BACKUP_ROOT"
    
    # Generate encryption key if it doesn't exist
    if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
        sudo mkdir -p "$(dirname "$ENCRYPTION_KEY_FILE")"
        sudo openssl rand -hex 32 > "$ENCRYPTION_KEY_FILE"
        sudo chmod 600 "$ENCRYPTION_KEY_FILE"
        sudo chown root:root "$ENCRYPTION_KEY_FILE"
        success "Generated new encryption key"
    fi
    
    # Install required tools
    if ! command -v pg_dump &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y postgresql-client
    fi
    
    if ! command -v redis-cli &> /dev/null; then
        sudo apt-get install -y redis-tools
    fi
    
    if ! command -v aws &> /dev/null; then
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf aws awscliv2.zip
    fi
    
    # Configure MinIO client
    if ! command -v mc &> /dev/null; then
        wget https://dl.min.io/client/mc/release/linux-amd64/mc
        chmod +x mc
        sudo mv mc /usr/local/bin/
    fi
    
    mc alias set minio "http://$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
    
    success "Backup system initialized"
}

# Backup PostgreSQL database
backup_postgresql() {
    log "Starting PostgreSQL backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_type="${1:-daily}"
    local backup_dir="$BACKUP_ROOT/postgresql/$backup_type"
    local backup_file="$backup_dir/cryb_${backup_type}_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create database dump
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --format=custom > "$backup_file"; then
        
        # Compress backup
        gzip "$backup_file"
        
        # Encrypt backup
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -kfile "$ENCRYPTION_KEY_FILE"
        
        # Remove unencrypted files
        rm "$compressed_file"
        
        # Calculate checksums
        sha256sum "$encrypted_file" > "${encrypted_file}.sha256"
        
        local file_size=$(du -h "$encrypted_file" | cut -f1)
        success "PostgreSQL $backup_type backup completed: $encrypted_file ($file_size)"
        
        # Upload to S3
        if upload_to_s3 "$encrypted_file" "postgresql/$backup_type/"; then
            upload_to_s3 "${encrypted_file}.sha256" "postgresql/$backup_type/"
        fi
        
        # Test backup integrity
        if validate_postgresql_backup "$encrypted_file"; then
            success "PostgreSQL backup validation passed"
        else
            error "PostgreSQL backup validation failed"
            send_notification "PostgreSQL backup validation failed for $encrypted_file" "error"
            return 1
        fi
        
    else
        error "PostgreSQL backup failed"
        send_notification "PostgreSQL backup failed" "error"
        return 1
    fi
    
    unset PGPASSWORD
}

# Backup Redis data
backup_redis() {
    log "Starting Redis backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_type="${1:-daily}"
    local backup_dir="$BACKUP_ROOT/redis/$backup_type"
    local backup_file="$backup_dir/redis_${backup_type}_${timestamp}.rdb"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Create Redis backup using BGSAVE
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE; then
        
        # Wait for background save to complete
        while redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE | \
              xargs -I {} test {} -eq $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE); do
            sleep 1
        done
        
        # Copy RDB file
        docker cp cryb-redis-production:/data/dump.rdb "$backup_file"
        
        # Compress backup
        gzip "$backup_file"
        
        # Encrypt backup
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -kfile "$ENCRYPTION_KEY_FILE"
        
        # Remove unencrypted files
        rm "$compressed_file"
        
        # Calculate checksums
        sha256sum "$encrypted_file" > "${encrypted_file}.sha256"
        
        local file_size=$(du -h "$encrypted_file" | cut -f1)
        success "Redis $backup_type backup completed: $encrypted_file ($file_size)"
        
        # Upload to S3
        if upload_to_s3 "$encrypted_file" "redis/$backup_type/"; then
            upload_to_s3 "${encrypted_file}.sha256" "redis/$backup_type/"
        fi
        
    else
        error "Redis backup failed"
        send_notification "Redis backup failed" "error"
        return 1
    fi
}

# Backup MinIO data
backup_minio() {
    log "Starting MinIO backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_type="${1:-daily}"
    local backup_dir="$BACKUP_ROOT/minio/$backup_type"
    local backup_file="$backup_dir/minio_${backup_type}_${timestamp}.tar"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.enc"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # Create temporary directory for MinIO data
    local temp_dir="$BACKUP_ROOT/temp/minio_$timestamp"
    mkdir -p "$temp_dir"
    
    # Mirror MinIO data to local directory
    if mc mirror minio/cryb-media "$temp_dir/cryb-media" --exclude "*.tmp"; then
        mc mirror minio/cryb-uploads "$temp_dir/cryb-uploads" --exclude "*.tmp"
        mc mirror minio/cryb-backups "$temp_dir/cryb-backups" --exclude "*.tmp"
        
        # Create tar archive
        tar -cf "$backup_file" -C "$temp_dir" .
        
        # Compress backup
        gzip "$backup_file"
        
        # Encrypt backup
        openssl enc -aes-256-cbc -salt -in "$compressed_file" -out "$encrypted_file" -kfile "$ENCRYPTION_KEY_FILE"
        
        # Remove unencrypted files and temp data
        rm "$compressed_file"
        rm -rf "$temp_dir"
        
        # Calculate checksums
        sha256sum "$encrypted_file" > "${encrypted_file}.sha256"
        
        local file_size=$(du -h "$encrypted_file" | cut -f1)
        success "MinIO $backup_type backup completed: $encrypted_file ($file_size)"
        
        # Upload to S3
        if upload_to_s3 "$encrypted_file" "minio/$backup_type/"; then
            upload_to_s3 "${encrypted_file}.sha256" "minio/$backup_type/"
        fi
        
    else
        error "MinIO backup failed"
        send_notification "MinIO backup failed" "error"
        rm -rf "$temp_dir"
        return 1
    fi
}

# Upload to S3
upload_to_s3() {
    local file="$1"
    local s3_prefix="$2"
    local s3_key="${s3_prefix}$(basename "$file")"
    
    log "Uploading $file to S3..."
    
    if aws s3 cp "$file" "s3://$S3_BACKUP_BUCKET/$s3_key" \
        --storage-class GLACIER_IR \
        --server-side-encryption AES256; then
        success "Uploaded $file to S3: s3://$S3_BACKUP_BUCKET/$s3_key"
        return 0
    else
        error "Failed to upload $file to S3"
        return 1
    fi
}

# Validate PostgreSQL backup
validate_postgresql_backup() {
    local backup_file="$1"
    local temp_dir="$BACKUP_ROOT/temp/validation_$(date +%s)"
    local decrypted_file="$temp_dir/backup.sql.gz"
    local sql_file="$temp_dir/backup.sql"
    
    mkdir -p "$temp_dir"
    
    # Decrypt backup
    if openssl enc -aes-256-cbc -d -in "$backup_file" -out "$decrypted_file" -kfile "$ENCRYPTION_KEY_FILE"; then
        
        # Decompress backup
        gunzip "$decrypted_file"
        
        # Check if SQL file is valid
        if pg_restore --list "$sql_file" > /dev/null 2>&1; then
            rm -rf "$temp_dir"
            return 0
        else
            rm -rf "$temp_dir"
            return 1
        fi
    else
        rm -rf "$temp_dir"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Clean daily backups older than retention period
    find "$BACKUP_ROOT"/*/daily -name "*.enc" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_ROOT"/*/daily -name "*.sha256" -mtime +$RETENTION_DAYS -delete
    
    # Clean weekly backups
    find "$BACKUP_ROOT"/*/weekly -name "*.enc" -mtime +$((RETENTION_WEEKS * 7)) -delete
    find "$BACKUP_ROOT"/*/weekly -name "*.sha256" -mtime +$((RETENTION_WEEKS * 7)) -delete
    
    # Clean monthly backups
    find "$BACKUP_ROOT"/*/monthly -name "*.enc" -mtime +$((RETENTION_MONTHS * 30)) -delete
    find "$BACKUP_ROOT"/*/monthly -name "*.sha256" -mtime +$((RETENTION_MONTHS * 30)) -delete
    
    # Clean S3 backups
    aws s3api list-objects-v2 --bucket "$S3_BACKUP_BUCKET" --query 'Contents[?LastModified<=`'"$(date -d "$RETENTION_DAYS days ago" --iso-8601)"'`].[Key]' --output text | \
    while read -r key; do
        if [[ -n "$key" ]]; then
            aws s3 rm "s3://$S3_BACKUP_BUCKET/$key"
        fi
    done
    
    success "Cleanup completed"
}

# Health check
health_check() {
    log "Performing backup system health check..."
    
    local health_score=0
    local max_score=5
    
    # Check if backup directories exist
    if [[ -d "$BACKUP_ROOT" ]]; then
        ((health_score++))
        success "Backup directories exist"
    else
        error "Backup directories missing"
    fi
    
    # Check if encryption key exists
    if [[ -f "$ENCRYPTION_KEY_FILE" ]]; then
        ((health_score++))
        success "Encryption key exists"
    else
        error "Encryption key missing"
    fi
    
    # Check database connectivity
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        ((health_score++))
        success "Database connectivity OK"
    else
        error "Database connectivity failed"
    fi
    
    # Check Redis connectivity
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        ((health_score++))
        success "Redis connectivity OK"
    else
        error "Redis connectivity failed"
    fi
    
    # Check S3 connectivity
    if aws s3 ls "s3://$S3_BACKUP_BUCKET" > /dev/null 2>&1; then
        ((health_score++))
        success "S3 connectivity OK"
    else
        warning "S3 connectivity failed"
    fi
    
    local health_percentage=$((health_score * 100 / max_score))
    
    if [[ $health_percentage -ge 80 ]]; then
        success "Backup system health: $health_percentage% ($health_score/$max_score)"
    else
        warning "Backup system health: $health_percentage% ($health_score/$max_score)"
        send_notification "Backup system health check failed: $health_percentage%" "warning"
    fi
}

# Restore functions
restore_postgresql() {
    local backup_file="$1"
    local target_db="${2:-${DB_NAME}_restored}"
    
    log "Restoring PostgreSQL from $backup_file to $target_db..."
    
    local temp_dir="$BACKUP_ROOT/temp/restore_$(date +%s)"
    local decrypted_file="$temp_dir/backup.sql.gz"
    local sql_file="$temp_dir/backup.sql"
    
    mkdir -p "$temp_dir"
    
    # Decrypt and decompress
    openssl enc -aes-256-cbc -d -in "$backup_file" -out "$decrypted_file" -kfile "$ENCRYPTION_KEY_FILE"
    gunzip "$decrypted_file"
    
    # Create target database
    export PGPASSWORD="$DB_PASSWORD"
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$target_db" || true
    
    # Restore database
    if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" --verbose "$sql_file"; then
        success "PostgreSQL restore completed to $target_db"
    else
        error "PostgreSQL restore failed"
        return 1
    fi
    
    rm -rf "$temp_dir"
    unset PGPASSWORD
}

# Main function
main() {
    local action="${1:-backup}"
    local backup_type="${2:-daily}"
    
    log "Starting CRYB backup system - Action: $action, Type: $backup_type"
    
    case "$action" in
        "init")
            initialize_backup_system
            ;;
        "backup")
            health_check
            backup_postgresql "$backup_type"
            backup_redis "$backup_type"
            backup_minio "$backup_type"
            cleanup_old_backups
            send_notification "Backup $backup_type completed successfully" "success"
            ;;
        "postgresql")
            backup_postgresql "$backup_type"
            ;;
        "redis")
            backup_redis "$backup_type"
            ;;
        "minio")
            backup_minio "$backup_type"
            ;;
        "restore-postgresql")
            restore_postgresql "$3" "$4"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Usage: $0 {init|backup|postgresql|redis|minio|restore-postgresql|cleanup|health} [daily|weekly|monthly]"
            exit 1
            ;;
    esac
    
    success "Backup system operation completed successfully"
}

# Trap signals for graceful shutdown
trap 'error "Backup interrupted"; exit 1' INT TERM

# Run main function
main "$@"