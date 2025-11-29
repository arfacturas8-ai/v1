#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRE-DEPLOYMENT BACKUP
# ==============================================
# Creates comprehensive backup before deployment
# ==============================================

set -euo pipefail

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_BASE_DIR="/home/ubuntu/cryb-platform/backups/pre-deployment"
LOG_FILE="/var/log/pre-deployment-backup.log"

mkdir -p "$BACKUP_BASE_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting pre-deployment backup: $BACKUP_DATE"

# Database backup
log "Creating database backup..."
if docker exec cryb-postgres-production pg_dump -U cryb_user -d cryb | gzip > "$BACKUP_BASE_DIR/database_$BACKUP_DATE.sql.gz"; then
    log "Database backup completed"
else
    log "Database backup failed"
    exit 1
fi

# Configuration backup
log "Creating configuration backup..."
tar -czf "$BACKUP_BASE_DIR/config_$BACKUP_DATE.tar.gz" \
    -C /home/ubuntu/cryb-platform \
    config/ \
    docker-compose*.yml \
    .env* \
    scripts/ \
    2>/dev/null || true

# Docker images backup
log "Creating Docker images backup..."
docker save $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(cryb|postgres|redis|nginx|prometheus|grafana)") | gzip > "$BACKUP_BASE_DIR/images_$BACKUP_DATE.tar.gz" 2>/dev/null || true

log "Pre-deployment backup completed successfully"
echo "$BACKUP_BASE_DIR"