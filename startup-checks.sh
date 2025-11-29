#!/bin/bash

#############################################
# CRYB Platform Startup Checks
# Runs before platform starts to ensure readiness
# Usage: ./startup-checks.sh [--wait] [--timeout=120]
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAIT_FOR_SERVICES=false
TIMEOUT=120
START_TIME=$(date +%s)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
  case $arg in
    --wait) WAIT_FOR_SERVICES=true ;;
    --timeout=*) TIMEOUT="${arg#*=}" ;;
    --help)
      echo "Usage: $0 [--wait] [--timeout=120]"
      echo "  --wait            Wait for services to be ready"
      echo "  --timeout=SECS    Timeout in seconds (default: 120)"
      exit 0
      ;;
  esac
done

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_timeout() {
  local current_time=$(date +%s)
  local elapsed=$((current_time - START_TIME))

  if [ "$elapsed" -gt "$TIMEOUT" ]; then
    log_error "Timeout exceeded (${TIMEOUT}s)"
    return 1
  fi
  return 0
}

wait_for_service() {
  local service_name=$1
  local check_command=$2
  local max_attempts=30
  local attempt=0

  log_info "Waiting for $service_name..."

  while [ $attempt -lt $max_attempts ]; do
    if ! check_timeout; then
      return 1
    fi

    if eval "$check_command" &>/dev/null; then
      log_success "$service_name is ready"
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 2
  done

  log_error "$service_name is not ready after ${max_attempts} attempts"
  return 1
}

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      CRYB PLATFORM STARTUP CHECKS               ║${NC}"
echo -e "${BLUE}║      Started: $(date +'%Y-%m-%d %H:%M:%S')        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Check system resources
log_info "1. Checking system resources..."

# Memory check
TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
AVAILABLE_MEM=$(free -m | awk 'NR==2 {print $7}')
MEM_PERCENT=$((100 - (AVAILABLE_MEM * 100 / TOTAL_MEM)))

if [ "$MEM_PERCENT" -gt 90 ]; then
  log_warning "Memory usage high: ${MEM_PERCENT}% (${AVAILABLE_MEM}MB available)"
else
  log_success "Memory available: ${AVAILABLE_MEM}MB"
fi

# Disk space check
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

if [ "$DISK_USAGE" -gt 90 ]; then
  log_error "Disk space critical: ${DISK_USAGE}% used"
  exit 1
elif [ "$DISK_USAGE" -gt 80 ]; then
  log_warning "Disk space high: ${DISK_USAGE}% used"
else
  log_success "Disk space available: ${DISK_AVAIL}"
fi

# 2. Check Docker daemon
log_info "2. Checking Docker daemon..."

if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed"
  exit 1
fi

if ! docker ps &>/dev/null; then
  log_error "Docker daemon is not running"
  log_info "Try: sudo systemctl start docker"
  exit 1
fi

log_success "Docker daemon is running"

# 3. Check critical Docker containers
log_info "3. Checking Docker containers..."

CRITICAL_CONTAINERS=("cryb-postgres-dev" "cryb-redis-dev" "cryb-minio" "elasticsearch")
CONTAINERS_OK=true

for container in "${CRITICAL_CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    log_success "$container: running"
  else
    log_warning "$container: not running"

    # Try to start the container
    log_info "Attempting to start $container..."
    if docker start "$container" &>/dev/null; then
      log_success "$container: started"
      sleep 2  # Give it time to initialize
    else
      log_error "$container: could not start"
      CONTAINERS_OK=false
    fi
  fi
done

if [ "$CONTAINERS_OK" = false ]; then
  log_error "Critical containers failed to start"
  exit 1
fi

# 4. Wait for database to be ready
log_info "4. Checking database connectivity..."

if [ "$WAIT_FOR_SERVICES" = true ]; then
  wait_for_service "PostgreSQL" "pg_isready -h localhost -p 5432" || exit 1
else
  if pg_isready -h localhost -p 5432 &>/dev/null; then
    log_success "PostgreSQL: ready"
  else
    log_error "PostgreSQL: not ready"
    log_info "Run with --wait to wait for services to be ready"
    exit 1
  fi
fi

# 5. Wait for Redis to be ready
log_info "5. Checking Redis connectivity..."

if [ "$WAIT_FOR_SERVICES" = true ]; then
  wait_for_service "Redis" "redis-cli -h localhost -p 6380 ping" || exit 1
else
  if redis-cli -h localhost -p 6380 ping &>/dev/null | grep -q "PONG"; then
    log_success "Redis: ready"
  else
    log_error "Redis: not ready"
    log_info "Run with --wait to wait for services to be ready"
    exit 1
  fi
fi

# 6. Check Elasticsearch
log_info "6. Checking Elasticsearch..."

if [ "$WAIT_FOR_SERVICES" = true ]; then
  wait_for_service "Elasticsearch" "curl -s http://localhost:9200/_cluster/health" || {
    log_warning "Elasticsearch: not ready (continuing anyway)"
  }
else
  if curl -s http://localhost:9200/_cluster/health &>/dev/null; then
    ES_STATUS=$(curl -s http://localhost:9200/_cluster/health | jq -r '.status' 2>/dev/null)
    log_success "Elasticsearch: $ES_STATUS"
  else
    log_warning "Elasticsearch: not ready (non-critical)"
  fi
fi

# 7. Check MinIO
log_info "7. Checking MinIO storage..."

if curl -s http://localhost:9000/minio/health/live &>/dev/null; then
  log_success "MinIO: ready"
else
  log_warning "MinIO: not ready (non-critical)"
fi

# 8. Verify build files exist
log_info "8. Verifying build files..."

if [ -f "$SCRIPT_DIR/apps/react-app/dist/index.html" ]; then
  log_success "Frontend build exists"
else
  log_error "Frontend build missing: dist/index.html not found"
  log_info "Run: ./rebuild-frontend.sh"
  exit 1
fi

# Check critical frontend files
CRITICAL_FILES=(
  "$SCRIPT_DIR/apps/react-app/dist/index.html"
  "$SCRIPT_DIR/apps/react-app/dist/manifest.json"
  "$SCRIPT_DIR/apps/react-app/dist/assets"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ -e "$file" ]; then
    log_success "  ✓ $(basename "$file")"
  else
    log_error "  ✗ $(basename "$file") missing"
    exit 1
  fi
done

# 9. Check API source files
log_info "9. Verifying API source files..."

if [ -f "$SCRIPT_DIR/apps/api/src/index.ts" ]; then
  log_success "API source files exist"
else
  log_error "API source files missing"
  exit 1
fi

# 10. Verify environment files
log_info "10. Verifying environment files..."

ENV_FILES=(
  "$SCRIPT_DIR/apps/api/.env.production"
  "$SCRIPT_DIR/apps/react-app/.env.production"
)

for env_file in "${ENV_FILES[@]}"; do
  if [ -f "$env_file" ]; then
    log_success "  ✓ $(basename $(dirname "$env_file"))/.env.production"
  else
    log_warning "  ✗ $(basename $(dirname "$env_file"))/.env.production missing"
  fi
done

# 11. Check PM2
log_info "11. Checking PM2..."

if ! command -v pm2 &> /dev/null; then
  log_error "PM2 is not installed"
  log_info "Install with: npm install -g pm2"
  exit 1
fi

log_success "PM2 is installed"

# Check if ecosystem.config.js exists
if [ -f "$SCRIPT_DIR/ecosystem.config.js" ]; then
  log_success "ecosystem.config.js exists"

  # Validate syntax
  if node -c "$SCRIPT_DIR/ecosystem.config.js" &>/dev/null; then
    log_success "  ✓ Configuration syntax is valid"
  else
    log_error "  ✗ Configuration has syntax errors"
    exit 1
  fi
else
  log_error "ecosystem.config.js not found"
  exit 1
fi

# 12. Check ports availability
log_info "12. Checking port availability..."

REQUIRED_PORTS=("3002:API" "3008:Frontend")

for port_info in "${REQUIRED_PORTS[@]}"; do
  PORT=$(echo "$port_info" | cut -d: -f1)
  SERVICE=$(echo "$port_info" | cut -d: -f2)

  if nc -z localhost "$PORT" 2>/dev/null; then
    log_warning "$SERVICE port $PORT is already in use (service may already be running)"
  else
    log_success "$SERVICE port $PORT is available"
  fi
done

# 13. Check dependencies
log_info "13. Checking Node.js dependencies..."

# API dependencies
if [ -d "$SCRIPT_DIR/apps/api/node_modules" ]; then
  log_success "API node_modules exists"
else
  log_error "API node_modules missing"
  log_info "Run: cd apps/api && npm install"
  exit 1
fi

# Frontend dependencies
if [ -d "$SCRIPT_DIR/apps/react-app/node_modules" ]; then
  log_success "Frontend node_modules exists"
else
  log_error "Frontend node_modules missing"
  log_info "Run: cd apps/react-app && npm install"
  exit 1
fi

# 14. Final pre-flight check
log_info "14. Running final pre-flight checks..."

# Check if any PM2 processes are errored
PM2_ERRORS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.pm2_env.status == "errored") | .name' 2>/dev/null || echo "")

if [ -n "$PM2_ERRORS" ]; then
  log_warning "Some PM2 processes are in error state:"
  echo "$PM2_ERRORS" | while read -r proc; do
    log_warning "  - $proc"
  done
  log_info "Consider restarting these processes"
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ STARTUP CHECKS COMPLETED SUCCESSFULLY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

ELAPSED=$(($(date +%s) - START_TIME))
log_success "All checks passed in ${ELAPSED}s"
echo ""
log_info "Platform is ready to start!"
log_info ""
log_info "Start the platform with:"
log_info "  pm2 start ecosystem.config.js"
log_info ""
log_info "Or start all services:"
log_info "  pm2 restart all"
echo ""

exit 0
