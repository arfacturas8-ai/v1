#!/bin/bash

# Backup configuration
BACKUP_DIR="/home/ubuntu/cryb-platform/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR/postgres
mkdir -p $BACKUP_DIR/redis
mkdir -p $BACKUP_DIR/minio

echo "Starting CRYB Platform backup at $(date)"

# 1. PostgreSQL backup
echo "Backing up PostgreSQL..."
PGPASSWORD=cryb_password docker exec cryb-postgres-dev \
  pg_dump -U cryb_user -d cryb | gzip > $BACKUP_DIR/postgres/cryb_$DATE.sql.gz

if [ $? -eq 0 ]; then
  echo "✓ PostgreSQL backup successful"
else
  echo "✗ PostgreSQL backup failed"
fi

# 2. Redis backup
echo "Backing up Redis..."
docker exec cryb-redis-dev redis-cli -a cryb_redis_e29eb2ee96228079ca00e6af089fabbffd12630d_secure BGSAVE
sleep 2
docker cp cryb-redis-dev:/data/dump.rdb $BACKUP_DIR/redis/redis_$DATE.rdb

if [ $? -eq 0 ]; then
  echo "✓ Redis backup successful"
else
  echo "✗ Redis backup failed"
fi

# 3. MinIO data backup (if exists)
if [ -d "/home/ubuntu/cryb-platform/data/minio" ]; then
  echo "Backing up MinIO data..."
  tar -czf $BACKUP_DIR/minio/minio_$DATE.tar.gz -C /home/ubuntu/cryb-platform/data minio
  echo "✓ MinIO backup successful"
fi

# 4. Application files backup
echo "Backing up application configuration..."
tar -czf $BACKUP_DIR/app_config_$DATE.tar.gz \
  /home/ubuntu/cryb-platform/apps/api/.env \
  /home/ubuntu/cryb-platform/apps/web/.env.local \
  /home/ubuntu/cryb-platform/apps/api/prisma/schema.prisma 2>/dev/null

# Clean up old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Display backup summary
echo ""
echo "Backup Summary:"
echo "==============="
ls -lh $BACKUP_DIR/postgres/cryb_$DATE.sql.gz 2>/dev/null
ls -lh $BACKUP_DIR/redis/redis_$DATE.rdb 2>/dev/null
ls -lh $BACKUP_DIR/app_config_$DATE.tar.gz 2>/dev/null

echo ""
echo "Backup completed at $(date)"
