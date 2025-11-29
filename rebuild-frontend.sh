#!/bin/bash

#############################################
# CRYB Frontend Safe Rebuild Script
# Safely rebuilds the React frontend with backups
# Usage: ./rebuild-frontend.sh [--skip-backup] [--force]
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/apps/react-app"
DIST_DIR="$FRONTEND_DIR/dist"
BACKUP_DIR="$SCRIPT_DIR/backups/frontend-builds"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SKIP_BACKUP=false
FORCE=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-backup) SKIP_BACKUP=true ;;
    --force) FORCE=true ;;
    --help)
      echo "Usage: $0 [--skip-backup] [--force]"
      echo "  --skip-backup  Skip creating backup of current build"
      echo "  --force        Force rebuild even if build exists"
      exit 0
      ;;
  esac
done

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      CRYB FRONTEND REBUILD SCRIPT               ║${NC}"
echo -e "${BLUE}║      Started: $(date +'%Y-%m-%d %H:%M:%S')        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Pre-flight checks
log_info "Step 1/7: Running pre-flight checks..."

if [ ! -d "$FRONTEND_DIR" ]; then
  log_error "Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

cd "$FRONTEND_DIR"

# Check if build already exists and is recent
if [ -f "$DIST_DIR/index.html" ] && [ "$FORCE" = false ]; then
  log_warning "Build already exists at: $DIST_DIR/index.html"
  read -p "Do you want to rebuild anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Rebuild cancelled by user"
    exit 0
  fi
fi

# Check Node.js and npm
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  log_error "npm is not installed"
  exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js: $NODE_VERSION, npm: $NPM_VERSION"

# 2. Backup existing build
if [ -d "$DIST_DIR" ] && [ "$SKIP_BACKUP" = false ]; then
  log_info "Step 2/7: Backing up existing build..."

  mkdir -p "$BACKUP_DIR"

  # Create backup with timestamp
  BACKUP_PATH="$BACKUP_DIR/dist_backup_$TIMESTAMP.tar.gz"

  tar -czf "$BACKUP_PATH" -C "$FRONTEND_DIR" dist 2>/dev/null || {
    log_warning "Could not create backup (dist may be empty)"
  }

  if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    log_success "Backup created: $BACKUP_PATH ($BACKUP_SIZE)"

    # Keep only last 5 backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dist_backup_*.tar.gz 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt 5 ]; then
      log_info "Removing old backups (keeping last 5)..."
      ls -t "$BACKUP_DIR"/dist_backup_*.tar.gz | tail -n +6 | xargs rm -f
    fi
  fi
else
  log_info "Step 2/7: Skipping backup (--skip-backup flag or no existing build)"
fi

# 3. Clean old build
if [ -d "$DIST_DIR" ]; then
  log_info "Step 3/7: Cleaning old build..."
  rm -rf "$DIST_DIR"
  log_success "Old build removed"
else
  log_info "Step 3/7: No existing build to clean"
fi

# 4. Check dependencies
log_info "Step 4/7: Checking dependencies..."

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log_warning "node_modules not found, installing dependencies..."
  npm install
else
  # Check if package.json is newer than node_modules
  if [ "$FRONTEND_DIR/package.json" -nt "$FRONTEND_DIR/node_modules" ]; then
    log_warning "package.json modified since last install, updating dependencies..."
    npm install
  else
    log_success "Dependencies are up to date"
  fi
fi

# 5. Set environment variables
log_info "Step 5/7: Setting environment variables..."

if [ -f "$FRONTEND_DIR/.env.production" ]; then
  export $(cat "$FRONTEND_DIR/.env.production" | grep -v '^#' | xargs)
  log_success "Loaded .env.production"
else
  log_warning ".env.production not found, using defaults"
fi

export NODE_ENV=production
log_success "NODE_ENV=production"

# 6. Build the frontend
log_info "Step 6/7: Building frontend..."

BUILD_START=$(date +%s)

# Run the build command
if npm run build; then
  BUILD_END=$(date +%s)
  BUILD_TIME=$((BUILD_END - BUILD_START))

  log_success "Build completed in ${BUILD_TIME}s"
else
  log_error "Build failed!"

  # Try to restore backup if available
  if [ -f "$BACKUP_PATH" ] && [ "$SKIP_BACKUP" = false ]; then
    log_warning "Attempting to restore from backup..."
    tar -xzf "$BACKUP_PATH" -C "$FRONTEND_DIR"
    log_success "Backup restored"
  fi

  exit 1
fi

# 7. Verify build
log_info "Step 7/7: Verifying build..."

CRITICAL_FILES=(
  "$DIST_DIR/index.html"
  "$DIST_DIR/manifest.json"
)

BUILD_VALID=true

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    log_success "✓ $(basename "$file") exists"
  else
    log_error "✗ $(basename "$file") missing"
    BUILD_VALID=false
  fi
done

# Check assets directory
if [ -d "$DIST_DIR/assets" ]; then
  ASSET_COUNT=$(ls -1 "$DIST_DIR/assets" | wc -l)
  log_success "✓ assets/ directory exists ($ASSET_COUNT files)"
else
  log_error "✗ assets/ directory missing"
  BUILD_VALID=false
fi

# Get build size
if [ -d "$DIST_DIR" ]; then
  BUILD_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
  log_info "Build size: $BUILD_SIZE"
fi

# Final verification
if [ "$BUILD_VALID" = true ]; then
  echo ""
  log_success "═════════════════════════════════════════════════"
  log_success "  Frontend rebuild completed successfully!"
  log_success "═════════════════════════════════════════════════"
  echo ""
  log_info "Next steps:"
  log_info "  1. Test the build: curl http://localhost:3008"
  log_info "  2. Restart frontend: pm2 restart cryb-frontend"
  log_info "  3. Monitor logs: pm2 logs cryb-frontend"
  echo ""

  # Ask if user wants to restart the service
  if [ -t 0 ]; then  # Check if running interactively
    read -p "Do you want to restart cryb-frontend now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      log_info "Restarting cryb-frontend..."
      pm2 restart cryb-frontend
      log_success "Service restarted"

      # Wait a moment and check status
      sleep 2
      pm2 info cryb-frontend --no-daemon | grep -E "status|restarts|uptime"
    fi
  fi

  exit 0
else
  log_error "═════════════════════════════════════════════════"
  log_error "  Build verification failed!"
  log_error "═════════════════════════════════════════════════"
  echo ""
  log_error "The build completed but critical files are missing."
  log_error "Please check the build logs above for errors."

  # Try to restore backup if available
  if [ -f "$BACKUP_PATH" ] && [ "$SKIP_BACKUP" = false ]; then
    log_warning "Attempting to restore from backup..."
    rm -rf "$DIST_DIR"
    tar -xzf "$BACKUP_PATH" -C "$FRONTEND_DIR"
    log_success "Backup restored"
  fi

  exit 1
fi
