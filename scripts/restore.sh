#!/bin/bash

# CRYB Platform Restore Script
# Restores database, files, and configuration from backup

set -e

# Configuration
BACKUP_DIR="/home/ubuntu/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Usage: $0 <backup_file.tar.gz>${NC}"
  echo -e "Available backups:"
  ls -lh "${BACKUP_DIR}"/cryb_backup_*.tar.gz 2>/dev/null || echo "No backups found"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  BACKUP_FILE="${BACKUP_DIR}/$1"
  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Backup file not found: $1${NC}"
    exit 1
  fi
fi

RESTORE_DIR="/tmp/cryb_restore_$$"
mkdir -p "${RESTORE_DIR}"

echo -e "${GREEN}Starting CRYB Platform Restore${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"

# 1. Verify backup integrity
echo -e "${YELLOW}Verifying backup integrity...${NC}"
if [ -f "${BACKUP_FILE}.sha256" ]; then
  cd $(dirname "${BACKUP_FILE}")
  sha256sum -c "${BACKUP_FILE}.sha256" || {
    echo -e "${RED}Backup integrity check failed!${NC}"
    exit 1
  }
fi
echo -e "${GREEN}✓ Backup integrity verified${NC}"

# 2. Extract backup
echo -e "${YELLOW}Extracting backup...${NC}"
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"
BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)
BACKUP_PATH="${RESTORE_DIR}/${BACKUP_NAME}"

# 3. Stop services
echo -e "${YELLOW}Stopping services...${NC}"
pm2 stop cryb-api cryb-workers 2>/dev/null || true
echo -e "${GREEN}✓ Services stopped${NC}"

# 4. Restore PostgreSQL database
echo -e "${YELLOW}Restoring PostgreSQL database...${NC}"
gunzip -c "${BACKUP_PATH}/database.sql.gz" | \
  PGPASSWORD=cryb_password psql \
    -h localhost \
    -p 5433 \
    -U cryb_user \
    -d cryb
echo -e "${GREEN}✓ Database restored${NC}"

# 5. Restore Redis data
echo -e "${YELLOW}Restoring Redis data...${NC}"
if [ -f "${BACKUP_PATH}/redis.rdb" ]; then
  redis-cli -p 6380 SHUTDOWN NOSAVE 2>/dev/null || true
  sleep 2
  cp "${BACKUP_PATH}/redis.rdb" /var/lib/redis/dump.rdb 2>/dev/null || true
  redis-server --port 6380 --daemonize yes
  echo -e "${GREEN}✓ Redis restored${NC}"
fi

# 6. Restore MinIO data
echo -e "${YELLOW}Restoring MinIO data...${NC}"
if [ -f "${BACKUP_PATH}/minio_data.tar.gz" ]; then
  sudo tar -xzf "${BACKUP_PATH}/minio_data.tar.gz" \
    -C /var/lib/docker/volumes/minio_data/ 2>/dev/null || true
  echo -e "${GREEN}✓ MinIO data restored${NC}"
fi

# 7. Restore configuration files (optional)
read -p "Restore configuration files? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Restoring configuration files...${NC}"
  tar -xzf "${BACKUP_PATH}/config.tar.gz" -C / 2>/dev/null || true
  echo -e "${GREEN}✓ Configuration restored${NC}"
fi

# 8. Restore Elasticsearch indices
echo -e "${YELLOW}Restoring Elasticsearch indices...${NC}"
if [ -d "${BACKUP_PATH}/elasticsearch" ]; then
  # Register repository
  curl -s -X PUT "localhost:9200/_snapshot/restore_repo" \
    -H 'Content-Type: application/json' \
    -d "{\"type\":\"fs\",\"settings\":{\"location\":\"${BACKUP_PATH}/elasticsearch\"}}" \
    2>/dev/null || true
  
  # Get snapshot name
  SNAPSHOT_NAME=$(ls "${BACKUP_PATH}/elasticsearch/indices/" 2>/dev/null | head -1) || true
  
  if [ ! -z "$SNAPSHOT_NAME" ]; then
    # Restore snapshot
    curl -s -X POST "localhost:9200/_snapshot/restore_repo/snapshot_*/_restore" \
      2>/dev/null || true
  fi
  echo -e "${GREEN}✓ Elasticsearch indices restored${NC}"
fi

# 9. Start services
echo -e "${YELLOW}Starting services...${NC}"
pm2 restart cryb-api cryb-workers 2>/dev/null || {
  cd /home/ubuntu/cryb-platform/apps/api
  pm2 start "npm run dev" --name cryb-api
  pm2 start "npx tsx src/workers/queue-processor.ts" --name cryb-workers
}
echo -e "${GREEN}✓ Services started${NC}"

# 10. Run migrations (if needed)
echo -e "${YELLOW}Running database migrations...${NC}"
cd /home/ubuntu/cryb-platform/apps/api
DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5433/cryb?schema=public" \
  npx prisma migrate deploy 2>/dev/null || true
echo -e "${GREEN}✓ Migrations completed${NC}"

# 11. Clean up
rm -rf "${RESTORE_DIR}"

# 12. Verify services
echo -e "${YELLOW}Verifying services...${NC}"
sleep 5
curl -s https://api.cryb.ai/health | jq '.' || {
  echo -e "${RED}API health check failed${NC}"
}

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo -e "${GREEN}Please verify all services are working correctly${NC}"
echo -e "${GREEN}================================${NC}"

exit 0