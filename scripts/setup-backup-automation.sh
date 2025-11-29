#!/bin/bash

# CRYB PLATFORM BACKUP AUTOMATION SETUP
# Sets up automated backup jobs, monitoring, and S3 lifecycle policies

set -euo pipefail

# Configuration
BACKUP_USER="ubuntu"
BACKUP_BASE_DIR="/home/ubuntu/cryb-platform/backups"
CRON_FILE="/tmp/cryb-backup-cron"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    log "ERROR: $1" >&2
    exit 1
}

# Check if running as correct user
if [ "$(whoami)" != "$BACKUP_USER" ]; then
    error "This script must be run as $BACKUP_USER user"
fi

log "Setting up CRYB Platform backup automation..."

# Create backup directories
mkdir -p "$BACKUP_BASE_DIR/postgres/logs"
mkdir -p "$BACKUP_BASE_DIR/postgres/wal_archive"

# Make backup script executable
chmod +x /home/ubuntu/cryb-platform/scripts/enhanced-backup-system.sh

# Set up environment variables for backups
cat > "$BACKUP_BASE_DIR/backup.env" << 'EOF'
# CRYB Platform Backup Environment Variables
export DB_HOST="postgres"
export DB_PORT="5432"
export DB_NAME="cryb"
export DB_USER="cryb_user"
export DB_PASSWORD="cryb_password"
export S3_BUCKET="cryb-platform-backups"
export S3_REGION="us-east-1"
export S3_PREFIX="postgres-backups"
export BACKUP_ENCRYPTION_KEY="your-secure-encryption-key-here"
export MONITORING_WEBHOOK=""
EOF

log "Created backup environment configuration"

# Create systemd service for backup system
sudo tee /etc/systemd/system/cryb-backup@.service > /dev/null << 'EOF'
[Unit]
Description=CRYB Platform Database Backup (%i)
After=network.target

[Service]
Type=oneshot
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/cryb-platform
EnvironmentFile=/home/ubuntu/cryb-platform/backups/backup.env
ExecStart=/home/ubuntu/cryb-platform/scripts/enhanced-backup-system.sh %i
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timers for automated backups
sudo tee /etc/systemd/system/cryb-backup-full.timer > /dev/null << 'EOF'
[Unit]
Description=CRYB Platform Full Backup Timer
Requires=cryb-backup@full.service

[Timer]
# Run full backup daily at 2 AM
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/cryb-backup-incremental.timer > /dev/null << 'EOF'
[Unit]
Description=CRYB Platform Incremental Backup Timer
Requires=cryb-backup@incremental.service

[Timer]
# Run incremental backup every 4 hours
OnCalendar=*-*-* 00,06,12,18:00:00
Persistent=true
RandomizedDelaySec=180

[Install]
WantedBy=timers.target
EOF

sudo tee /etc/systemd/system/cryb-backup-cleanup.timer > /dev/null << 'EOF'
[Unit]
Description=CRYB Platform Backup Cleanup Timer
Requires=cryb-backup@cleanup.service

[Timer]
# Run cleanup weekly on Sunday at 1 AM
OnCalendar=Sun *-*-* 01:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Reload systemd and enable timers
sudo systemctl daemon-reload
sudo systemctl enable cryb-backup-full.timer
sudo systemctl enable cryb-backup-incremental.timer
sudo systemctl enable cryb-backup-cleanup.timer

log "Created and enabled systemd timers for automated backups"

# Create S3 lifecycle policy configuration
cat > "$BACKUP_BASE_DIR/s3-lifecycle-policy.json" << 'EOF'
{
    "Rules": [
        {
            "ID": "CrybBackupLifecycle",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "postgres-backups/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        },
        {
            "ID": "CrybWALArchiveLifecycle",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "postgres-backups/wal/"
            },
            "Transitions": [
                {
                    "Days": 7,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 30,
                    "StorageClass": "GLACIER"
                }
            ],
            "Expiration": {
                "Days": 90
            }
        }
    ]
}
EOF

# Create backup monitoring script
cat > "$BACKUP_BASE_DIR/backup-monitor.sh" << 'EOF'
#!/bin/bash

# CRYB Backup Monitoring Script
# Checks backup status and sends alerts if needed

BACKUP_LOG_DIR="/home/ubuntu/cryb-platform/backups/postgres/logs"
ALERT_EMAIL="${BACKUP_ALERT_EMAIL:-admin@cryb.com}"
S3_BUCKET="${S3_BUCKET:-cryb-platform-backups}"

check_recent_backup() {
    local backup_type="$1"
    local max_age_hours="$2"
    
    # Check if recent backup exists
    local recent_backup
    recent_backup=$(find "$BACKUP_LOG_DIR" -name "backup_*.log" -mtime -1 | head -1)
    
    if [ -z "$recent_backup" ]; then
        echo "WARNING: No recent $backup_type backup found"
        return 1
    fi
    
    # Check backup success
    if grep -q "completed successfully" "$recent_backup"; then
        echo "SUCCESS: Recent $backup_type backup completed successfully"
        return 0
    else
        echo "ERROR: Recent $backup_type backup failed"
        return 1
    fi
}

check_s3_backup() {
    # Check if recent backups exist in S3
    local recent_s3_backup
    recent_s3_backup=$(aws s3 ls "s3://$S3_BUCKET/postgres-backups/full_backups/" --recursive | tail -1)
    
    if [ -z "$recent_s3_backup" ]; then
        echo "WARNING: No recent backups found in S3"
        return 1
    fi
    
    echo "SUCCESS: Recent backup found in S3"
    return 0
}

# Main monitoring logic
{
    echo "CRYB Backup Monitoring Report - $(date)"
    echo "=========================================="
    
    check_recent_backup "full" 25
    check_recent_backup "incremental" 5
    check_s3_backup
    
    echo ""
    echo "Backup Storage Usage:"
    du -sh /home/ubuntu/cryb-platform/backups/postgres/
    
    echo ""
    echo "S3 Storage Usage:"
    aws s3 ls "s3://$S3_BUCKET/postgres-backups/" --recursive --human-readable --summarize | tail -2
    
} > "$BACKUP_LOG_DIR/monitoring_report_$(date +%Y%m%d).txt"

# Send alert if needed (implement based on your notification system)
EOF

chmod +x "$BACKUP_BASE_DIR/backup-monitor.sh"

# Create backup restoration guide
cat > "$BACKUP_BASE_DIR/RESTORATION_GUIDE.md" << 'EOF'
# CRYB Platform Database Restoration Guide

## Point-in-Time Recovery

### Prerequisites
1. Ensure PostgreSQL is stopped
2. Have access to S3 backups and WAL archives
3. Know the target recovery point (timestamp or LSN)

### Basic Restoration Steps

1. **Prepare the environment:**
   ```bash
   sudo systemctl stop postgresql
   sudo rm -rf /var/lib/postgresql/14/main/*
   ```

2. **Download and extract base backup:**
   ```bash
   aws s3 cp s3://cryb-platform-backups/postgres-backups/full_backups/full_backup_YYYYMMDD_HHMMSS.tar.gz.enc ./
   openssl enc -aes-256-cbc -d -in full_backup_YYYYMMDD_HHMMSS.tar.gz.enc -out full_backup.tar.gz -pass env:BACKUP_ENCRYPTION_KEY
   tar -xzf full_backup.tar.gz -C /var/lib/postgresql/14/main/
   ```

3. **Create recovery configuration:**
   ```bash
   cat > /var/lib/postgresql/14/main/recovery.conf << 'RECOVERY_EOF'
   restore_command = 'aws s3 cp s3://cryb-platform-backups/postgres-backups/wal/%f.gz - | gunzip > %p'
   recovery_target_time = '2023-12-01 14:30:00'
   recovery_target_inclusive = true
   RECOVERY_EOF
   ```

4. **Start PostgreSQL in recovery mode:**
   ```bash
   sudo chown -R postgres:postgres /var/lib/postgresql/14/main/
   sudo systemctl start postgresql
   ```

5. **Monitor recovery progress:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

6. **Promote to primary after recovery:**
   ```bash
   sudo -u postgres psql -c "SELECT pg_promote();"
   ```

### Recovery Targets

- **Latest available:** Recovers to the most recent available point
- **Specific timestamp:** `recovery_target_time = '2023-12-01 14:30:00'`
- **Specific LSN:** `recovery_target_lsn = '0/15000000'`
- **Named restore point:** `recovery_target_name = 'backup_point_1'`

### Verification Steps

1. Check database connectivity
2. Verify data integrity
3. Test application functionality
4. Update backup configurations if needed

### Troubleshooting

- **Recovery fails:** Check WAL archive accessibility and permissions
- **Timeline issues:** Ensure correct timeline in recovery configuration
- **Performance issues:** Consider parallel recovery settings
- **Storage space:** Ensure sufficient space for WAL replay

### Emergency Contacts

- Database Administrator: [Your contact info]
- DevOps Team: [Your contact info]
- AWS Support: [Your support plan info]
EOF

# Create backup verification script
cat > "$BACKUP_BASE_DIR/verify-backups.sh" << 'EOF'
#!/bin/bash

# CRYB Backup Verification Script
# Periodically verifies backup integrity and restorability

BACKUP_DIR="/home/ubuntu/cryb-platform/backups/postgres"
S3_BUCKET="${S3_BUCKET:-cryb-platform-backups}"
VERIFICATION_LOG="$BACKUP_DIR/logs/verification_$(date +%Y%m%d).log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$VERIFICATION_LOG"
}

verify_local_backups() {
    log "Verifying local backup integrity..."
    
    local encrypted_backups
    encrypted_backups=$(find "$BACKUP_DIR" -name "*.enc" -mtime -7)
    
    for backup in $encrypted_backups; do
        if openssl enc -aes-256-cbc -d -in "$backup" -pass env:BACKUP_ENCRYPTION_KEY -out /dev/null 2>/dev/null; then
            log "✓ Backup encryption verified: $(basename "$backup")"
        else
            log "✗ Backup encryption failed: $(basename "$backup")"
        fi
    done
}

verify_s3_backups() {
    log "Verifying S3 backup accessibility..."
    
    # Check if recent backups exist in S3
    if aws s3 ls "s3://$S3_BUCKET/postgres-backups/full_backups/" | tail -1 | grep -q "$(date +%Y%m%d\|%Y%m%d)"; then
        log "✓ Recent full backup found in S3"
    else
        log "⚠ No recent full backup found in S3"
    fi
    
    if aws s3 ls "s3://$S3_BUCKET/postgres-backups/incremental_backups/" | tail -1 | grep -q "$(date +%Y%m%d)"; then
        log "✓ Recent incremental backup found in S3"
    else
        log "⚠ No recent incremental backup found in S3"
    fi
}

test_restore_procedure() {
    log "Testing backup restore procedure (dry run)..."
    
    # This would typically involve creating a test environment
    # and performing an actual restore test
    log "ℹ Restore testing should be performed in a separate test environment"
    log "ℹ Consider setting up automated restore testing with test databases"
}

# Main verification
{
    log "Starting backup verification process..."
    verify_local_backups
    verify_s3_backups
    test_restore_procedure
    log "Backup verification completed"
} 2>&1
EOF

chmod +x "$BACKUP_BASE_DIR/verify-backups.sh"

# Start the backup timers
sudo systemctl start cryb-backup-full.timer
sudo systemctl start cryb-backup-incremental.timer
sudo systemctl start cryb-backup-cleanup.timer

log "Backup automation setup completed successfully!"
log ""
log "Next steps:"
log "1. Update backup.env with your actual database credentials and encryption key"
log "2. Configure S3 bucket with the lifecycle policy:"
log "   aws s3api put-bucket-lifecycle-configuration --bucket cryb-platform-backups --lifecycle-configuration file://$BACKUP_BASE_DIR/s3-lifecycle-policy.json"
log "3. Test the backup system:"
log "   sudo systemctl start cryb-backup@full.service"
log "4. Monitor backup status:"
log "   sudo systemctl status cryb-backup-full.timer"
log "   sudo journalctl -u cryb-backup@full.service"
log ""
log "Backup schedule:"
log "- Full backups: Daily at 2:00 AM"
log "- Incremental backups: Every 6 hours (00:00, 06:00, 12:00, 18:00)"
log "- Cleanup: Weekly on Sunday at 1:00 AM"