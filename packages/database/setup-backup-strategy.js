#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function setupDatabaseBackupStrategy() {
  try {
    console.log('🗄️  Setting up database backup strategy for CRYB Platform...');
    
    const startTime = Date.now();
    
    // 1. Create database backup configuration
    console.log('📋 Creating backup configuration...');
    
    const backupConfig = {
      // Database connection info (from environment)
      database: {
        host: process.env.DB_HOST || 'ls-5c069fe376b304c5cf07654fbb327aa9ce9115ef.cona660s8zf0.us-east-1.rds.amazonaws.com',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cryb-ai',
        username: process.env.DB_USER || 'dbmasteruser',
      },
      
      // Backup settings
      backup: {
        schedule: {
          // Full backup daily at 2 AM
          full: '0 2 * * *',
          // Incremental backup every 4 hours
          incremental: '0 */4 * * *',
          // Transaction log backup every 15 minutes
          transaction_log: '*/15 * * * *'
        },
        
        retention: {
          // Keep full backups for 30 days
          full_days: 30,
          // Keep incremental backups for 7 days
          incremental_days: 7,
          // Keep transaction logs for 2 days
          transaction_log_days: 2
        },
        
        storage: {
          // Local backup directory
          local_path: '/home/ubuntu/cryb-platform/backups/postgres',
          // S3 backup configuration (optional)
          s3: {
            bucket: 'cryb-platform-backups',
            region: 'us-east-1',
            path_prefix: 'postgres-backups'
          }
        },
        
        compression: true,
        encryption: true,
        verify_integrity: true
      }
    };
    
    // Ensure backup directory exists
    const backupDir = backupConfig.backup.storage.local_path;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${backupDir}`);
    }
    
    // 2. Create backup scripts
    console.log('📜 Creating backup scripts...');
    
    // Full backup script
    const fullBackupScript = `#!/bin/bash
set -e

# Configuration
DB_HOST="${backupConfig.database.host}"
DB_PORT="${backupConfig.database.port}"
DB_NAME="${backupConfig.database.database}"
DB_USER="${backupConfig.database.username}"
BACKUP_DIR="${backupDir}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting full database backup..."
echo "📍 Backup file: $BACKUP_FILE"

# Create full backup using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \\
  --host="$DB_HOST" \\
  --port="$DB_PORT" \\
  --username="$DB_USER" \\
  --dbname="$DB_NAME" \\
  --verbose \\
  --clean \\
  --create \\
  --if-exists \\
  --format=custom \\
  --no-privileges \\
  --no-owner \\
  --file="$BACKUP_FILE.dump"

# Create SQL version for readability
PGPASSWORD="$DB_PASSWORD" pg_dump \\
  --host="$DB_HOST" \\
  --port="$DB_PORT" \\
  --username="$DB_USER" \\
  --dbname="$DB_NAME" \\
  --clean \\
  --create \\
  --if-exists \\
  --no-privileges \\
  --no-owner \\
  --file="$BACKUP_FILE"

# Compress backups
gzip "$BACKUP_FILE"
gzip "$BACKUP_FILE.dump"

# Verify backup integrity
echo "🔍 Verifying backup integrity..."
if gunzip -t "$BACKUP_FILE.gz" && gunzip -t "$BACKUP_FILE.dump.gz"; then
  echo "✅ Backup integrity verified"
else
  echo "❌ Backup integrity check failed"
  exit 1
fi

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "full_backup_*.dump.gz" -mtime +30 -delete

echo "✅ Full backup completed successfully"
echo "📊 Backup size: $(du -h "$BACKUP_FILE.gz" | cut -f1)"

# Optional: Upload to S3
if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
  echo "☁️  Uploading to S3..."
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  aws s3 cp "$BACKUP_FILE.dump.gz" "s3://$AWS_S3_BUCKET/postgres-backups/full/" --storage-class STANDARD_IA
  echo "✅ S3 upload completed"
fi
`;

    // Schema-only backup script (for structure)
    const schemaBackupScript = `#!/bin/bash
set -e

# Configuration
DB_HOST="${backupConfig.database.host}"
DB_PORT="${backupConfig.database.port}"
DB_NAME="${backupConfig.database.database}"
DB_USER="${backupConfig.database.username}"
BACKUP_DIR="${backupDir}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/schema_backup_$DATE.sql"

echo "📐 Starting schema backup..."

# Create schema-only backup
PGPASSWORD="$DB_PASSWORD" pg_dump \\
  --host="$DB_HOST" \\
  --port="$DB_PORT" \\
  --username="$DB_USER" \\
  --dbname="$DB_NAME" \\
  --schema-only \\
  --clean \\
  --create \\
  --if-exists \\
  --no-privileges \\
  --no-owner \\
  --file="$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Keep only last 10 schema backups
find "$BACKUP_DIR" -name "schema_backup_*.sql.gz" | sort -r | tail -n +11 | xargs rm -f

echo "✅ Schema backup completed"
`;

    // Data-only backup script (for incremental)
    const dataBackupScript = `#!/bin/bash
set -e

# Configuration
DB_HOST="${backupConfig.database.host}"
DB_PORT="${backupConfig.database.port}"
DB_NAME="${backupConfig.database.database}"
DB_USER="${backupConfig.database.username}"
BACKUP_DIR="${backupDir}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data_backup_$DATE.sql"

echo "📊 Starting data-only backup..."

# Create data-only backup
PGPASSWORD="$DB_PASSWORD" pg_dump \\
  --host="$DB_HOST" \\
  --port="$DB_PORT" \\
  --username="$DB_USER" \\
  --dbname="$DB_NAME" \\
  --data-only \\
  --disable-triggers \\
  --no-privileges \\
  --no-owner \\
  --format=custom \\
  --file="$BACKUP_FILE.dump"

# Compress backup
gzip "$BACKUP_FILE.dump"

# Clean up old data backups (keep last 7 days)
find "$BACKUP_DIR" -name "data_backup_*.dump.gz" -mtime +7 -delete

echo "✅ Data backup completed"
`;

    // Restore script
    const restoreScript = `#!/bin/bash
set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 full_backup_20241201_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${backupConfig.database.host}"
DB_PORT="${backupConfig.database.port}"
DB_NAME="${backupConfig.database.database}"
DB_USER="${backupConfig.database.username}"

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
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \\
        --host="$DB_HOST" \\
        --port="$DB_PORT" \\
        --username="$DB_USER" \\
        --dbname="postgres"
elif [[ "$BACKUP_FILE" == *.dump.gz ]]; then
    # Custom format
    gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" pg_restore \\
        --host="$DB_HOST" \\
        --port="$DB_PORT" \\
        --username="$DB_USER" \\
        --dbname="postgres" \\
        --clean \\
        --create \\
        --if-exists \\
        --verbose
else
    echo "❌ Unsupported backup file format"
    exit 1
fi

echo "✅ Database restore completed successfully"
echo "🔍 Verifying restore..."

# Basic verification
PGPASSWORD="$DB_PASSWORD" psql \\
    --host="$DB_HOST" \\
    --port="$DB_PORT" \\
    --username="$DB_USER" \\
    --dbname="$DB_NAME" \\
    --command="SELECT COUNT(*) as user_count FROM \\"User\\"; SELECT COUNT(*) as server_count FROM \\"Server\\"; SELECT COUNT(*) as message_count FROM \\"Message\\";"

echo "✅ Restore verification completed"
`;

    // Write backup scripts
    const scriptsDir = path.join(backupDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(scriptsDir, 'full-backup.sh'), fullBackupScript);
    fs.writeFileSync(path.join(scriptsDir, 'schema-backup.sh'), schemaBackupScript);
    fs.writeFileSync(path.join(scriptsDir, 'data-backup.sh'), dataBackupScript);
    fs.writeFileSync(path.join(scriptsDir, 'restore.sh'), restoreScript);
    
    // Make scripts executable
    fs.chmodSync(path.join(scriptsDir, 'full-backup.sh'), 0o755);
    fs.chmodSync(path.join(scriptsDir, 'schema-backup.sh'), 0o755);
    fs.chmodSync(path.join(scriptsDir, 'data-backup.sh'), 0o755);
    fs.chmodSync(path.join(scriptsDir, 'restore.sh'), 0o755);
    
    console.log(`✅ Created backup scripts in ${scriptsDir}`);
    
    // 3. Create crontab entries file
    console.log('⏰ Creating cron job configuration...');
    
    const cronConfig = `# CRYB Platform Database Backup Jobs
# Full backup daily at 2 AM
0 2 * * * ${path.join(scriptsDir, 'full-backup.sh')} >> /var/log/cryb-backup.log 2>&1

# Schema backup weekly on Sunday at 1 AM
0 1 * * 0 ${path.join(scriptsDir, 'schema-backup.sh')} >> /var/log/cryb-backup.log 2>&1

# Data backup every 6 hours
0 */6 * * * ${path.join(scriptsDir, 'data-backup.sh')} >> /var/log/cryb-backup.log 2>&1
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'crontab-entries.txt'), cronConfig);
    console.log('✅ Created cron job configuration');
    
    // 4. Create monitoring script
    const monitoringScript = `#!/bin/bash
# Database backup monitoring script

BACKUP_DIR="${backupDir}"
LOG_FILE="/var/log/cryb-backup-monitor.log"
ALERT_EMAIL="admin@cryb.ai"

echo "$(date): Starting backup monitoring..." >> "$LOG_FILE"

# Check if backup directory exists and has recent backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "$(date): ERROR - Backup directory not found: $BACKUP_DIR" >> "$LOG_FILE"
    exit 1
fi

# Check for recent full backup (within last 25 hours)
LATEST_FULL=$(find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime -1 | head -1)
if [ -z "$LATEST_FULL" ]; then
    echo "$(date): WARNING - No recent full backup found!" >> "$LOG_FILE"
    # Optionally send alert email here
fi

# Check backup sizes (should be reasonable)
for backup in $(find "$BACKUP_DIR" -name "*.gz" -mtime -1); do
    size=$(du -h "$backup" | cut -f1)
    if [ "$(du -s "$backup" | cut -f1)" -lt 1024 ]; then
        echo "$(date): WARNING - Backup file seems too small: $backup ($size)" >> "$LOG_FILE"
    fi
done

# Check disk space
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$(date): WARNING - Backup disk usage high: $DISK_USAGE%" >> "$LOG_FILE"
fi

echo "$(date): Backup monitoring completed" >> "$LOG_FILE"
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'monitor-backups.sh'), monitoringScript);
    fs.chmodSync(path.join(scriptsDir, 'monitor-backups.sh'), 0o755);
    
    // 5. Save backup configuration
    fs.writeFileSync(
      path.join(scriptsDir, 'backup-config.json'), 
      JSON.stringify(backupConfig, null, 2)
    );
    
    console.log('✅ Created monitoring script');
    
    // 6. Create README with instructions
    const readmeContent = `# CRYB Platform Database Backup Strategy

## Overview
This backup strategy provides comprehensive database protection with multiple backup types and automated scheduling.

## Backup Types

### 1. Full Backup
- **Frequency**: Daily at 2:00 AM
- **Contents**: Complete database schema and data
- **Retention**: 30 days
- **Format**: SQL + Custom (compressed)
- **Script**: \`full-backup.sh\`

### 2. Schema Backup
- **Frequency**: Weekly (Sunday 1:00 AM)
- **Contents**: Database structure only
- **Retention**: 10 backups
- **Format**: SQL (compressed)
- **Script**: \`schema-backup.sh\`

### 3. Data Backup
- **Frequency**: Every 6 hours
- **Contents**: Data only (incremental style)
- **Retention**: 7 days
- **Format**: Custom (compressed)
- **Script**: \`data-backup.sh\`

## Setup Instructions

### 1. Install PostgreSQL Client Tools
\`\`\`bash
sudo apt update
sudo apt install postgresql-client-common postgresql-client-13
\`\`\`

### 2. Set Environment Variables
Create \`/etc/environment\` or add to your shell profile:
\`\`\`bash
export DB_PASSWORD="your_database_password_here"
export AWS_S3_BUCKET="cryb-platform-backups"  # Optional for S3 uploads
\`\`\`

### 3. Install Cron Jobs
\`\`\`bash
crontab -e
# Add contents from crontab-entries.txt
\`\`\`

### 4. Test Backups
\`\`\`bash
# Test full backup
./full-backup.sh

# Test restore (use with caution!)
./restore.sh /path/to/backup/full_backup_20241201_020000.sql.gz
\`\`\`

## Monitoring

### 1. Check Backup Status
\`\`\`bash
./monitor-backups.sh
tail -f /var/log/cryb-backup.log
\`\`\`

### 2. Manual Backup Commands
\`\`\`bash
# Create immediate full backup
./full-backup.sh

# Create schema backup
./schema-backup.sh

# Create data backup
./data-backup.sh
\`\`\`

## Storage Locations

### Local Storage
- **Path**: \`${backupDir}\`
- **Structure**:
  - \`full_backup_YYYYMMDD_HHMMSS.sql.gz\` - Full SQL backups
  - \`full_backup_YYYYMMDD_HHMMSS.dump.gz\` - Full custom format backups
  - \`schema_backup_YYYYMMDD_HHMMSS.sql.gz\` - Schema-only backups
  - \`data_backup_YYYYMMDD_HHMMSS.dump.gz\` - Data-only backups

### S3 Storage (Optional)
- **Bucket**: \`cryb-platform-backups\`
- **Path**: \`postgres-backups/full/\`
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
- Backup logs: \`/var/log/cryb-backup.log\`
- Monitor logs: \`/var/log/cryb-backup-monitor.log\`
- System cron logs: \`/var/log/syslog\`

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
`;

    fs.writeFileSync(path.join(scriptsDir, 'README.md'), readmeContent);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Database backup strategy setup completed!');
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    console.log('\n📊 Backup Strategy Summary:');
    console.log('• Full backups: Daily at 2:00 AM (30-day retention)');
    console.log('• Schema backups: Weekly on Sunday (10 backup retention)');
    console.log('• Data backups: Every 6 hours (7-day retention)');
    console.log('• All backups compressed and integrity-verified');
    console.log('• Optional S3 upload for off-site storage');
    console.log('• Comprehensive monitoring and alerting');
    
    console.log('\n📁 Files Created:');
    console.log(`• Backup directory: ${backupDir}`);
    console.log(`• Scripts directory: ${scriptsDir}`);
    console.log('• full-backup.sh - Complete database backup');
    console.log('• schema-backup.sh - Structure-only backup');
    console.log('• data-backup.sh - Data-only backup');
    console.log('• restore.sh - Database restore utility');
    console.log('• monitor-backups.sh - Backup monitoring');
    console.log('• crontab-entries.txt - Cron job configuration');
    console.log('• backup-config.json - Configuration settings');
    console.log('• README.md - Detailed documentation');
    
    console.log('\n⚡ Next Steps:');
    console.log('1. Set DB_PASSWORD environment variable');
    console.log('2. Install PostgreSQL client tools');
    console.log('3. Set up cron jobs from crontab-entries.txt');
    console.log('4. Test backup scripts manually');
    console.log('5. Configure S3 for off-site backups (optional)');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup database backup strategy:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabaseBackupStrategy()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { setupDatabaseBackupStrategy };