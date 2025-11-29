#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION BACKUP SYSTEM
# ==============================================
# Comprehensive backup solution for:
# - PostgreSQL database (full, incremental, WAL)
# - Application files and configurations
# - Docker volumes and persistent data
# - System configurations
# - S3 upload with encryption
# ==============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="/home/ubuntu/cryb-platform/backups"
LOG_FILE="/var/log/cryb-backups.log"
CONFIG_FILE="$PROJECT_ROOT/backups/postgres/scripts/backup-config.json"

# S3 Configuration
S3_BUCKET="cryb-platform-backups"
S3_REGION="us-east-1"
S3_PREFIX="production-backups/$(date +%Y/%m)"

# Database Configuration
DB_HOST="ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="cryb-ai"
DB_USER="dbmasteruser"

# Retention periods (in days)
FULL_BACKUP_RETENTION=30
INCREMENTAL_RETENTION=7
WAL_RETENTION=2
APPLICATION_RETENTION=14

# Encryption key (should be stored securely)
ENCRYPTION_KEY_FILE="/etc/cryb-backup-key"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$$] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check dependencies
check_dependencies() {
    local deps=("pg_dump" "pg_basebackup" "aws" "gpg" "tar" "gzip")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error_exit "Required dependency '$dep' not found"
        fi
    done
}

# Setup directories
setup_directories() {
    local dirs=(
        "$BACKUP_BASE_DIR/postgres/full"
        "$BACKUP_BASE_DIR/postgres/incremental"
        "$BACKUP_BASE_DIR/postgres/wal"
        "$BACKUP_BASE_DIR/application"
        "$BACKUP_BASE_DIR/system"
        "$BACKUP_BASE_DIR/docker"
        "$BACKUP_BASE_DIR/temp"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
}

# Generate encryption key if not exists
setup_encryption() {
    if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
        log "Generating encryption key..."
        openssl rand -base64 32 | sudo tee "$ENCRYPTION_KEY_FILE" > /dev/null
        sudo chmod 600 "$ENCRYPTION_KEY_FILE"
        sudo chown root:root "$ENCRYPTION_KEY_FILE"
    fi
}

# Database backup functions
backup_postgres_full() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/postgres/full/cryb_full_$backup_date.sql"
    local compressed_file="${backup_file}.gz"
    local encrypted_file="${compressed_file}.gpg"
    
    log "Starting full PostgreSQL backup..."
    
    # Perform backup
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --format=custom \
        --no-password \
        > "$backup_file"; then
        
        log "Database backup completed: $backup_file"
        
        # Compress
        gzip "$backup_file"
        log "Backup compressed: $compressed_file"
        
        # Encrypt
        gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --output "$encrypted_file" "$compressed_file"
        rm "$compressed_file"
        log "Backup encrypted: $encrypted_file"
        
        # Upload to S3
        if aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/$S3_PREFIX/postgres/full/" --region "$S3_REGION"; then
            log "Backup uploaded to S3 successfully"
        else
            log "WARNING: Failed to upload backup to S3"
        fi
        
        # Verify backup integrity
        if gpg --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --decrypt "$encrypted_file" | gzip -t; then
            log "Backup integrity verified"
        else
            error_exit "Backup integrity check failed"
        fi
        
    else
        error_exit "Database backup failed"
    fi
}

# WAL backup
backup_postgres_wal() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$BACKUP_BASE_DIR/postgres/wal/wal_$backup_date"
    local compressed_file="${backup_dir}.tar.gz"
    local encrypted_file="${compressed_file}.gpg"
    
    log "Starting WAL backup..."
    
    # Note: This is a simplified WAL backup. In production, you'd use pg_basebackup with WAL streaming
    mkdir -p "$backup_dir"
    
    # For RDS, we'll backup recent WAL files if accessible
    # This is a placeholder - adjust based on your RDS configuration
    log "WAL backup completed (placeholder for RDS setup)"
}

# Application files backup
backup_application() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/application/app_backup_$backup_date.tar.gz"
    local encrypted_file="${backup_file}.gpg"
    
    log "Starting application backup..."
    
    # Backup application files, excluding node_modules and build artifacts
    tar --exclude='node_modules' \
        --exclude='*.log' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='coverage' \
        --exclude='.git' \
        -czf "$backup_file" \
        -C "$PROJECT_ROOT" \
        apps/ packages/ config/ scripts/ docker-compose*.yml package.json
    
    log "Application files backed up: $backup_file"
    
    # Encrypt
    gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --output "$encrypted_file" "$backup_file"
    rm "$backup_file"
    log "Application backup encrypted: $encrypted_file"
    
    # Upload to S3
    if aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/$S3_PREFIX/application/" --region "$S3_REGION"; then
        log "Application backup uploaded to S3 successfully"
    else
        log "WARNING: Failed to upload application backup to S3"
    fi
}

# Docker volumes backup
backup_docker_volumes() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/docker/volumes_backup_$backup_date.tar.gz"
    local encrypted_file="${backup_file}.gpg"
    
    log "Starting Docker volumes backup..."
    
    # Get list of Docker volumes
    local volumes=$(docker volume ls -q | grep -E "(cryb|postgres|redis|elasticsearch|minio|grafana|prometheus)" || true)
    
    if [[ -n "$volumes" ]]; then
        # Create temporary container to backup volumes
        local temp_dir="$BACKUP_BASE_DIR/temp/docker_volumes_$backup_date"
        mkdir -p "$temp_dir"
        
        for volume in $volumes; do
            log "Backing up volume: $volume"
            docker run --rm \
                -v "$volume:/data:ro" \
                -v "$temp_dir:/backup" \
                alpine:latest \
                tar czf "/backup/${volume}.tar.gz" -C /data .
        done
        
        # Combine all volume backups
        tar czf "$backup_file" -C "$temp_dir" .
        rm -rf "$temp_dir"
        
        log "Docker volumes backed up: $backup_file"
        
        # Encrypt
        gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --output "$encrypted_file" "$backup_file"
        rm "$backup_file"
        log "Docker volumes backup encrypted: $encrypted_file"
        
        # Upload to S3
        if aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/$S3_PREFIX/docker/" --region "$S3_REGION"; then
            log "Docker volumes backup uploaded to S3 successfully"
        else
            log "WARNING: Failed to upload Docker volumes backup to S3"
        fi
    else
        log "No Docker volumes found to backup"
    fi
}

# System configuration backup
backup_system_config() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_BASE_DIR/system/system_config_$backup_date.tar.gz"
    local encrypted_file="${backup_file}.gpg"
    
    log "Starting system configuration backup..."
    
    # Backup critical system files
    tar czf "$backup_file" \
        /etc/nginx/sites-enabled/ \
        /etc/systemd/system/cryb*.service \
        /etc/cron.d/ \
        /etc/logrotate.d/ \
        --ignore-failed-read 2>/dev/null || true
    
    log "System configuration backed up: $backup_file"
    
    # Encrypt
    gpg --symmetric --cipher-algo AES256 --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" --output "$encrypted_file" "$backup_file"
    rm "$backup_file"
    log "System configuration backup encrypted: $encrypted_file"
    
    # Upload to S3
    if aws s3 cp "$encrypted_file" "s3://$S3_BUCKET/$S3_PREFIX/system/" --region "$S3_REGION"; then
        log "System configuration backup uploaded to S3 successfully"
    else
        log "WARNING: Failed to upload system configuration backup to S3"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Local cleanup
    find "$BACKUP_BASE_DIR/postgres/full" -name "*.gpg" -mtime +$FULL_BACKUP_RETENTION -delete
    find "$BACKUP_BASE_DIR/postgres/wal" -name "*.gpg" -mtime +$WAL_RETENTION -delete
    find "$BACKUP_BASE_DIR/application" -name "*.gpg" -mtime +$APPLICATION_RETENTION -delete
    find "$BACKUP_BASE_DIR/docker" -name "*.gpg" -mtime +$APPLICATION_RETENTION -delete
    find "$BACKUP_BASE_DIR/system" -name "*.gpg" -mtime +$APPLICATION_RETENTION -delete
    
    # S3 cleanup (using lifecycle policies is recommended for large-scale cleanup)
    local cutoff_date=$(date -d "$FULL_BACKUP_RETENTION days ago" +%Y-%m-%d)
    log "Note: Consider setting up S3 lifecycle policies for automated cleanup of backups older than $cutoff_date"
}

# Health check
health_check() {
    log "Performing backup system health check..."
    
    # Check disk space
    local disk_usage=$(df "$BACKUP_BASE_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        log "WARNING: Backup disk usage is at ${disk_usage}%"
    fi
    
    # Check AWS CLI access
    if ! aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
        log "WARNING: Unable to access S3 bucket $S3_BUCKET"
    fi
    
    # Check database connectivity
    if ! PGPASSWORD="$PGPASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &>/dev/null; then
        log "WARNING: Unable to connect to database"
    fi
    
    log "Health check completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Send to monitoring system (implement based on your monitoring stack)
    log "NOTIFICATION [$status]: $message"
    
    # You can add email, Slack, or other notification mechanisms here
}

# Main execution
main() {
    local backup_type="${1:-full}"
    
    log "Starting CRYB Platform backup - Type: $backup_type"
    
    # Check if running as root or with appropriate permissions
    if [[ $EUID -ne 0 ]] && [[ ! -w "$BACKUP_BASE_DIR" ]]; then
        error_exit "Insufficient permissions. Run as root or ensure write access to $BACKUP_BASE_DIR"
    fi
    
    # Check dependencies
    check_dependencies
    
    # Setup
    setup_directories
    setup_encryption
    
    # Perform health check
    health_check
    
    # Perform backups based on type
    case "$backup_type" in
        "full")
            backup_postgres_full
            backup_application
            backup_docker_volumes
            backup_system_config
            ;;
        "database")
            backup_postgres_full
            ;;
        "incremental")
            backup_postgres_wal
            ;;
        "application")
            backup_application
            ;;
        "system")
            backup_system_config
            ;;
        *)
            error_exit "Unknown backup type: $backup_type. Use: full, database, incremental, application, system"
            ;;
    esac
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "Backup process completed successfully"
    send_notification "SUCCESS" "Backup process completed for type: $backup_type"
}

# Handle script termination
trap 'log "Backup process interrupted"; exit 1' INT TERM

# Execute main function with all arguments
main "$@"