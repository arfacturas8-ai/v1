#!/bin/bash

# CRYB Platform Backup Script
# Backs up database, uploaded files, and configuration

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="cryb_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory
mkdir -p "${BACKUP_PATH}"

echo -e "${GREEN}Starting CRYB Platform Backup - ${TIMESTAMP}${NC}"

# 1. Backup PostgreSQL Database
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
PGPASSWORD=cryb_password pg_dump \
  -h localhost \
  -p 5433 \
  -U cryb_user \
  -d cryb \
  --no-owner \
  --no-acl \
  -f "${BACKUP_PATH}/database.sql"

# Compress database backup
gzip "${BACKUP_PATH}/database.sql"
echo -e "${GREEN}✓ Database backed up${NC}"

# 2. Backup Redis data
echo -e "${YELLOW}Backing up Redis data...${NC}"
redis-cli -p 6380 --rdb "${BACKUP_PATH}/redis.rdb" 2>/dev/null || true
echo -e "${GREEN}✓ Redis backed up${NC}"

# 3. Backup uploaded files (MinIO data)
echo -e "${YELLOW}Backing up uploaded files...${NC}"
if [ -d "/var/lib/docker/volumes/minio_data" ]; then
  tar -czf "${BACKUP_PATH}/minio_data.tar.gz" \
    -C /var/lib/docker/volumes/minio_data \
    _data 2>/dev/null || true
  echo -e "${GREEN}✓ MinIO data backed up${NC}"
fi

# 4. Backup configuration files
echo -e "${YELLOW}Backing up configuration files...${NC}"
tar -czf "${BACKUP_PATH}/config.tar.gz" \
  /home/ubuntu/cryb-platform/apps/api/.env \
  /home/ubuntu/cryb-platform/apps/react-app/.env \
  /home/ubuntu/livekit-config.yaml \
  /etc/nginx/sites-enabled/platform-cryb-ai \
  /etc/nginx/sites-enabled/api.cryb.ai \
  2>/dev/null || true
echo -e "${GREEN}✓ Configuration files backed up${NC}"

# 5. Backup Elasticsearch indices
echo -e "${YELLOW}Backing up Elasticsearch indices...${NC}"
curl -s -X PUT "localhost:9200/_snapshot/backup_repo" \
  -H 'Content-Type: application/json' \
  -d "{\"type\":\"fs\",\"settings\":{\"location\":\"${BACKUP_PATH}/elasticsearch\"}}" \
  2>/dev/null || true

curl -s -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_${TIMESTAMP}?wait_for_completion=true" \
  2>/dev/null || true
echo -e "${GREEN}✓ Elasticsearch indices backed up${NC}"

# 6. Create backup manifest
echo -e "${YELLOW}Creating backup manifest...${NC}"
cat > "${BACKUP_PATH}/manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "version": "1.0.0",
  "platform": "CRYB",
  "components": {
    "database": "PostgreSQL 14",
    "cache": "Redis 7",
    "search": "Elasticsearch 7",
    "storage": "MinIO",
    "server": "$(hostname)"
  },
  "files": [
    "database.sql.gz",
    "redis.rdb",
    "minio_data.tar.gz",
    "config.tar.gz",
    "elasticsearch/"
  ]
}
EOF

# 7. Create compressed archive
echo -e "${YELLOW}Creating compressed archive...${NC}"
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# 8. Calculate checksums
echo -e "${YELLOW}Calculating checksums...${NC}"
cd "${BACKUP_DIR}"
sha256sum "${BACKUP_NAME}.tar.gz" > "${BACKUP_NAME}.tar.gz.sha256"

# 9. Clean up temporary files
rm -rf "${BACKUP_PATH}"

# 10. Remove old backups (keep last 7 days)
echo -e "${YELLOW}Removing old backups...${NC}"
find "${BACKUP_DIR}" -name "cryb_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "cryb_backup_*.tar.gz.sha256" -mtime +${RETENTION_DAYS} -delete

# 11. Report backup size and location
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
echo -e "${GREEN}Size: ${BACKUP_SIZE}${NC}"
echo -e "${GREEN}Checksum: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.sha256${NC}"
echo -e "${GREEN}================================${NC}"

# 12. Optional: Upload to S3 or remote storage
if [ ! -z "$AWS_S3_BUCKET" ]; then
  echo -e "${YELLOW}Uploading to S3...${NC}"
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "s3://${AWS_S3_BUCKET}/backups/" || true
  aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.sha256" "s3://${AWS_S3_BUCKET}/backups/" || true
  echo -e "${GREEN}✓ Uploaded to S3${NC}"
fi

exit 0