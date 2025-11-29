#!/bin/bash

# CRYB Platform Full Database Backup Script
# Creates comprehensive backup of all database systems
# Author: Database Infrastructure Team
# Version: 1.0

set -euo pipefail

# ==========================================
# CONFIGURATION AND ENVIRONMENT
# ==========================================

# Load environment variables
source /scripts/backup/backup-config.env 2>/dev/null || {
    echo "Warning: backup-config.env not found, using defaults"
}

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backups/full_backup_${BACKUP_DATE}"
S3_BUCKET="${BACKUP_S3_BUCKET:-cryb-backups}"
S3_PREFIX="full-backups"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Database connection details
POSTGRES_HOST="${POSTGRES_HOST:-postgres-primary}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-cryb}"
REDIS_NODES="${REDIS_NODES:-redis-node-1,redis-node-2,redis-node-3,redis-node-4,redis-node-5,redis-node-6}"
ELASTICSEARCH_HOST="${ELASTICSEARCH_HOST:-elasticsearch}"

# Notification settings
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"

# ==========================================
# UTILITY FUNCTIONS
# ==========================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${BACKUP_DIR}/backup.log"
}

error_exit() {
    log "ERROR: $1"
    send_notification "❌ CRYB Full Backup Failed" "error" "$1"
    exit 1
}

send_notification() {
    local title="$1"
    local level="$2"
    local message="$3"
    local timestamp=$(date -Iseconds)
    
    # Determine color based on level
    local color="good"
    case "$level" in
        "error"|"critical") color="danger" ;;
        "warning") color="warning" ;;
        "info"|"success") color="good" ;;
    esac
    
    # Send to Slack
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$title\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Details\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$timestamp\",
                        \"short\": true
                    }, {
                        \"title\": \"Backup ID\",
                        \"value\": \"$BACKUP_DATE\",
                        \"short\": true
                    }]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || log "Failed to send Slack notification"
    fi
    
    # Send to Discord
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
        local discord_color=65280  # Green
        case "$level" in
            "error"|"critical") discord_color=16711680 ;;  # Red
            "warning") discord_color=16776960 ;;           # Yellow
        esac
        
        curl -s -X POST -H 'Content-Type: application/json' \
            --data "{
                \"embeds\": [{
                    \"title\": \"$title\",
                    \"description\": \"$message\",
                    \"color\": $discord_color,
                    \"timestamp\": \"$timestamp\",
                    \"fields\": [{
                        \"name\": \"Backup ID\",
                        \"value\": \"$BACKUP_DATE\",
                        \"inline\": true
                    }]
                }]
            }" \
            "$DISCORD_WEBHOOK_URL" || log "Failed to send Discord notification"
    fi
}

cleanup_on_exit() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "Backup script exited with error code $exit_code"
        send_notification "❌ CRYB Full Backup Failed" "error" "Backup script exited unexpectedly with code $exit_code"
    fi
    
    # Cleanup temporary files
    if [[ -d "$BACKUP_DIR" ]]; then
        log "Cleaning up temporary backup directory"
        rm -rf "$BACKUP_DIR"
    fi
}

# ==========================================
# BACKUP FUNCTIONS
# ==========================================

create_backup_directory() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Create subdirectories
    mkdir -p "$BACKUP_DIR"/{postgres,redis,elasticsearch,metadata}
    
    # Create backup metadata
    cat > "$BACKUP_DIR/metadata/backup_info.json" << EOF
{
    "backup_id": "$BACKUP_DATE",
    "backup_type": "full",
    "timestamp": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "databases": {
        "postgres": {
            "host": "$POSTGRES_HOST",
            "port": $POSTGRES_PORT,
            "database": "$POSTGRES_DB"
        },
        "redis": {
            "nodes": "$REDIS_NODES"
        },
        "elasticsearch": {
            "host": "$ELASTICSEARCH_HOST"
        }
    }
}
EOF
}

backup_postgresql() {
    log "Starting PostgreSQL backup..."
    
    local pg_backup_file="$BACKUP_DIR/postgres/postgres_${BACKUP_DATE}.sql"
    local pg_globals_file="$BACKUP_DIR/postgres/postgres_globals_${BACKUP_DATE}.sql"
    
    # Backup global objects (roles, tablespaces, etc.)
    log "Backing up PostgreSQL global objects..."
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dumpall \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        --globals-only \
        --no-password \
        > "$pg_globals_file" || error_exit "Failed to backup PostgreSQL globals"
    
    # Backup main database
    log "Backing up PostgreSQL database: $POSTGRES_DB"
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$pg_backup_file.custom" || error_exit "Failed to backup PostgreSQL database"
    
    # Also create SQL format for easier inspection
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-password \
        --format=plain \
        > "$pg_backup_file" || error_exit "Failed to create SQL backup"
    
    # Backup database statistics for query planning
    log "Backing up PostgreSQL statistics..."
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "SELECT pg_export_snapshot();" \
        > "$BACKUP_DIR/postgres/snapshot_${BACKUP_DATE}.txt" || log "Warning: Failed to export snapshot"
    
    # Get database size information
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;" \
        --csv > "$BACKUP_DIR/postgres/table_sizes_${BACKUP_DATE}.csv" || log "Warning: Failed to get table sizes"
    
    log "PostgreSQL backup completed"
}

backup_redis_cluster() {
    log "Starting Redis cluster backup..."
    
    local redis_backup_dir="$BACKUP_DIR/redis"
    IFS=',' read -ra NODES <<< "$REDIS_NODES"
    
    for i in "${!NODES[@]}"; do
        local node="${NODES[$i]}"
        local node_num=$((i + 1))
        
        log "Backing up Redis node: $node"
        
        # Create RDB backup
        redis-cli -h "$node" -a "$REDIS_PASSWORD" --rdb "$redis_backup_dir/redis_node_${node_num}_${BACKUP_DATE}.rdb" || {
            log "Warning: Failed to backup Redis node $node"
            continue
        }
        
        # Get node configuration
        redis-cli -h "$node" -a "$REDIS_PASSWORD" config get "*" > "$redis_backup_dir/config_node_${node_num}_${BACKUP_DATE}.txt" || {
            log "Warning: Failed to get config for Redis node $node"
        }
        
        # Get memory information
        redis-cli -h "$node" -a "$REDIS_PASSWORD" info memory > "$redis_backup_dir/memory_node_${node_num}_${BACKUP_DATE}.txt" || {
            log "Warning: Failed to get memory info for Redis node $node"
        }
        
        # Get cluster information if applicable
        redis-cli -h "$node" -a "$REDIS_PASSWORD" cluster nodes > "$redis_backup_dir/cluster_nodes_${node_num}_${BACKUP_DATE}.txt" 2>/dev/null || {
            log "Note: Cluster commands not available for node $node (may not be clustered)"
        }
    done
    
    # Get cluster slots information
    redis-cli -h "${NODES[0]}" -a "$REDIS_PASSWORD" cluster slots > "$redis_backup_dir/cluster_slots_${BACKUP_DATE}.txt" 2>/dev/null || {
        log "Note: Cluster slots information not available"
    }
    
    log "Redis cluster backup completed"
}

backup_elasticsearch() {
    log "Starting Elasticsearch backup..."
    
    local es_backup_dir="$BACKUP_DIR/elasticsearch"
    local snapshot_name="cryb_full_backup_${BACKUP_DATE}"
    
    # Create snapshot repository
    log "Setting up Elasticsearch snapshot repository..."
    curl -s -X PUT "${ELASTICSEARCH_HOST}:9200/_snapshot/backup_repository" \
        -H 'Content-Type: application/json' \
        -d "{
            \"type\": \"fs\",
            \"settings\": {
                \"location\": \"/backup/elasticsearch\",
                \"compress\": true
            }
        }" || log "Warning: Failed to create snapshot repository"
    
    # Create snapshot
    log "Creating Elasticsearch snapshot: $snapshot_name"
    curl -s -X PUT "${ELASTICSEARCH_HOST}:9200/_snapshot/backup_repository/${snapshot_name}" \
        -H 'Content-Type: application/json' \
        -d "{
            \"indices\": \"*\",
            \"ignore_unavailable\": true,
            \"include_global_state\": true,
            \"metadata\": {
                \"taken_by\": \"cryb_backup_system\",
                \"taken_because\": \"full_backup_${BACKUP_DATE}\"
            }
        }" || log "Warning: Failed to create Elasticsearch snapshot"
    
    # Wait for snapshot completion
    log "Waiting for Elasticsearch snapshot completion..."
    local max_wait=1800  # 30 minutes
    local wait_time=0
    
    while [[ $wait_time -lt $max_wait ]]; do
        local status=$(curl -s "${ELASTICSEARCH_HOST}:9200/_snapshot/backup_repository/${snapshot_name}" | \
                      jq -r '.snapshots[0].state' 2>/dev/null || echo "UNKNOWN")
        
        case "$status" in
            "SUCCESS")
                log "Elasticsearch snapshot completed successfully"
                break
                ;;
            "FAILED")
                log "Warning: Elasticsearch snapshot failed"
                break
                ;;
            "IN_PROGRESS")
                log "Elasticsearch snapshot in progress... (${wait_time}s elapsed)"
                ;;
            *)
                log "Unknown snapshot status: $status"
                ;;
        esac
        
        sleep 30
        wait_time=$((wait_time + 30))
    done
    
    if [[ $wait_time -ge $max_wait ]]; then
        log "Warning: Elasticsearch snapshot timed out after ${max_wait} seconds"
    fi
    
    # Export cluster settings and mappings
    log "Exporting Elasticsearch cluster settings..."
    curl -s "${ELASTICSEARCH_HOST}:9200/_cluster/settings" > "$es_backup_dir/cluster_settings_${BACKUP_DATE}.json" || {
        log "Warning: Failed to export cluster settings"
    }
    
    # Export index mappings
    log "Exporting Elasticsearch index mappings..."
    curl -s "${ELASTICSEARCH_HOST}:9200/_mapping" > "$es_backup_dir/index_mappings_${BACKUP_DATE}.json" || {
        log "Warning: Failed to export index mappings"
    }
    
    # Export index templates
    log "Exporting Elasticsearch index templates..."
    curl -s "${ELASTICSEARCH_HOST}:9200/_template" > "$es_backup_dir/index_templates_${BACKUP_DATE}.json" || {
        log "Warning: Failed to export index templates"
    }
    
    log "Elasticsearch backup completed"
}

compress_and_encrypt_backup() {
    log "Compressing and encrypting backup..."
    
    local archive_name="cryb_full_backup_${BACKUP_DATE}.tar.gz"
    local encrypted_name="cryb_full_backup_${BACKUP_DATE}.tar.gz.enc"
    
    # Create compressed archive
    log "Creating compressed archive..."
    tar -czf "/tmp/${archive_name}" -C "$(dirname "$BACKUP_DIR")" "$(basename "$BACKUP_DIR")" || \
        error_exit "Failed to create compressed archive"
    
    # Encrypt if encryption key is provided
    if [[ -n "${ENCRYPTION_KEY:-}" ]]; then
        log "Encrypting backup archive..."
        openssl enc -aes-256-cbc -salt -in "/tmp/${archive_name}" -out "/tmp/${encrypted_name}" -k "$ENCRYPTION_KEY" || \
            error_exit "Failed to encrypt backup archive"
        
        # Remove unencrypted archive
        rm "/tmp/${archive_name}"
        archive_name="$encrypted_name"
    fi
    
    # Calculate checksums
    log "Calculating checksums..."
    md5sum "/tmp/${archive_name}" > "/tmp/${archive_name}.md5"
    sha256sum "/tmp/${archive_name}" > "/tmp/${archive_name}.sha256"
    
    echo "/tmp/${archive_name}"
}

upload_to_s3() {
    local archive_path="$1"
    local archive_name=$(basename "$archive_path")
    
    log "Uploading backup to S3: s3://${S3_BUCKET}/${S3_PREFIX}/${archive_name}"
    
    # Upload main archive
    aws s3 cp "$archive_path" "s3://${S3_BUCKET}/${S3_PREFIX}/${archive_name}" \
        --storage-class STANDARD_IA || error_exit "Failed to upload backup to S3"
    
    # Upload checksums
    aws s3 cp "${archive_path}.md5" "s3://${S3_BUCKET}/${S3_PREFIX}/${archive_name}.md5" || {
        log "Warning: Failed to upload MD5 checksum"
    }
    
    aws s3 cp "${archive_path}.sha256" "s3://${S3_BUCKET}/${S3_PREFIX}/${archive_name}.sha256" || {
        log "Warning: Failed to upload SHA256 checksum"
    }
    
    # Upload metadata
    aws s3 cp "$BACKUP_DIR/metadata/backup_info.json" "s3://${S3_BUCKET}/${S3_PREFIX}/metadata/backup_info_${BACKUP_DATE}.json" || {
        log "Warning: Failed to upload backup metadata"
    }
    
    log "Backup uploaded successfully to S3"
}

cleanup_old_backups() {
    log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
    
    # List and delete old backups
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        local file_date=$(echo "$line" | awk '{print $4}' | grep -o '[0-9]\{8\}' | head -1)
        
        if [[ -n "$file_date" && "$file_date" -lt "$cutoff_date" ]]; then
            local file_path=$(echo "$line" | awk '{print $4}')
            log "Deleting old backup: $file_path"
            aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${file_path}" || {
                log "Warning: Failed to delete old backup: $file_path"
            }
        fi
    done
    
    log "Old backup cleanup completed"
}

# ==========================================
# MAIN BACKUP EXECUTION
# ==========================================

main() {
    local start_time=$(date +%s)
    
    log "Starting CRYB Platform full backup: $BACKUP_DATE"
    
    # Set up cleanup on exit
    trap cleanup_on_exit EXIT
    
    # Send start notification
    send_notification "🔄 CRYB Full Backup Started" "info" "Backup ID: $BACKUP_DATE"
    
    # Create backup directory structure
    create_backup_directory
    
    # Perform backups
    backup_postgresql
    backup_redis_cluster
    backup_elasticsearch
    
    # Compress and encrypt
    local archive_path
    archive_path=$(compress_and_encrypt_backup)
    
    # Upload to S3
    upload_to_s3 "$archive_path"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    # Get backup size
    local backup_size=$(stat -c%s "$archive_path" 2>/dev/null || echo "0")
    local backup_size_human=$(numfmt --to=iec-i --suffix=B "$backup_size" 2>/dev/null || echo "${backup_size} bytes")
    
    log "Full backup completed successfully in $duration_formatted"
    log "Backup size: $backup_size_human"
    
    # Send success notification
    send_notification "✅ CRYB Full Backup Completed" "success" \
        "Backup ID: $BACKUP_DATE\\nDuration: $duration_formatted\\nSize: $backup_size_human"
    
    # Cleanup temporary files
    rm -f "$archive_path" "${archive_path}.md5" "${archive_path}.sha256"
    
    log "Full backup process completed successfully"
}

# Execute main function
main "$@"