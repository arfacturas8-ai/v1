# CRYB Platform Database Backup Strategy

## Overview
This backup strategy provides comprehensive database protection with multiple backup types and automated scheduling.

## Backup Types

### 1. Full Backup
- **Frequency**: Daily at 2:00 AM
- **Contents**: Complete database schema and data
- **Retention**: 30 days
- **Format**: SQL + Custom (compressed)
- **Script**: `full-backup.sh`

### 2. Schema Backup
- **Frequency**: Weekly (Sunday 1:00 AM)
- **Contents**: Database structure only
- **Retention**: 10 backups
- **Format**: SQL (compressed)
- **Script**: `schema-backup.sh`

### 3. Data Backup
- **Frequency**: Every 6 hours
- **Contents**: Data only (incremental style)
- **Retention**: 7 days
- **Format**: Custom (compressed)
- **Script**: `data-backup.sh`

## Setup Instructions

### 1. Install PostgreSQL Client Tools
```bash
sudo apt update
sudo apt install postgresql-client-common postgresql-client-13
```

### 2. Set Environment Variables
Create `/etc/environment` or add to your shell profile:
```bash
export DB_PASSWORD="your_database_password_here"
export AWS_S3_BUCKET="cryb-platform-backups"  # Optional for S3 uploads
```

### 3. Install Cron Jobs
```bash
crontab -e
# Add contents from crontab-entries.txt
```

### 4. Test Backups
```bash
# Test full backup
./full-backup.sh

# Test restore (use with caution!)
./restore.sh /path/to/backup/full_backup_20241201_020000.sql.gz
```

## Monitoring

### 1. Check Backup Status
```bash
./monitor-backups.sh
tail -f /var/log/cryb-backup.log
```

### 2. Manual Backup Commands
```bash
# Create immediate full backup
./full-backup.sh

# Create schema backup
./schema-backup.sh

# Create data backup
./data-backup.sh
```

## Storage Locations

### Local Storage
- **Path**: `/home/ubuntu/cryb-platform/backups/postgres`
- **Structure**:
  - `full_backup_YYYYMMDD_HHMMSS.sql.gz` - Full SQL backups
  - `full_backup_YYYYMMDD_HHMMSS.dump.gz` - Full custom format backups
  - `schema_backup_YYYYMMDD_HHMMSS.sql.gz` - Schema-only backups
  - `data_backup_YYYYMMDD_HHMMSS.dump.gz` - Data-only backups

### S3 Storage (Optional)
- **Bucket**: `cryb-platform-backups`
- **Path**: `postgres-backups/full/`
- **Storage Class**: Standard-IA (for cost optimization)

## Recovery Procedures

### 1. Point-in-Time Recovery
1. Restore latest full backup
2. Apply incremental backups in chronological order
3. Verify data integrity

### 2. Schema Recovery
1. Use schema backup to recreate database structure
2. Import data from data backup
3. Update sequences and constraints

### 3. Disaster Recovery
1. Provision new database instance
2. Restore from S3 backup (if configured)
3. Update application connection strings
4. Perform full application testing

## Security Considerations

- All backups are compressed to save space
- Consider encrypting backups for sensitive data
- Rotate backup encryption keys regularly
- Limit access to backup files and scripts
- Monitor backup access logs

## Troubleshooting

### Common Issues
1. **Permission denied**: Check file permissions and ownership
2. **Connection failed**: Verify database credentials and network access
3. **Disk space**: Monitor backup directory disk usage
4. **Backup corruption**: Verify backup integrity after creation

### Log Files
- Backup logs: `/var/log/cryb-backup.log`
- Monitor logs: `/var/log/cryb-backup-monitor.log`
- System cron logs: `/var/log/syslog`

## Maintenance

### Weekly Tasks
- Review backup logs for errors
- Verify recent backups can be restored
- Check disk space usage
- Update backup retention policies if needed

### Monthly Tasks
- Test complete restore procedure
- Review and update backup strategy
- Clean up old log files
- Verify S3 backup integrity (if used)

## Contact
For backup-related issues, contact: admin@cryb.ai
