#!/bin/bash

#############################################
# CRYB Services Verification Script
# Verifies all services before restart/deployment
# Usage: ./verify-services.sh [--strict] [--fix]
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRICT_MODE=false
AUTO_FIX=false
ERRORS_FOUND=0
WARNINGS_FOUND=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
for arg in "$@"; do
  case $arg in
    --strict) STRICT_MODE=true ;;
    --fix) AUTO_FIX=true ;;
    --help)
      echo "Usage: $0 [--strict] [--fix]"
      echo "  --strict  Fail on warnings as well as errors"
      echo "  --fix     Automatically fix issues where possible"
      exit 0
      ;;
  esac
done

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; WARNINGS_FOUND=$((WARNINGS_FOUND + 1)); }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS_FOUND=$((ERRORS_FOUND + 1)); }

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      CRYB SERVICE VERIFICATION                  ║${NC}"
echo -e "${BLUE}║      Started: $(date +'%Y-%m-%d %H:%M:%S')        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Verify environment files
verify_env_files() {
  log_info "1. Verifying environment files..."

  local required_env_files=(
    "$SCRIPT_DIR/apps/api/.env.production"
    "$SCRIPT_DIR/apps/react-app/.env.production"
  )

  for env_file in "${required_env_files[@]}"; do
    if [ -f "$env_file" ]; then
      log_success "$(basename $(dirname "$env_file")): .env.production exists"

      # Check for required variables in API env
      if [[ "$env_file" == *"/api/"* ]]; then
        local required_vars=("DATABASE_URL" "JWT_SECRET" "REDIS_HOST" "REDIS_PORT")
        for var in "${required_vars[@]}"; do
          if grep -q "^${var}=" "$env_file"; then
            log_success "  ✓ $var is set"
          else
            log_error "  ✗ $var is missing from API .env.production"
          fi
        done
      fi
    else
      log_error "Missing: $env_file"

      if [ "$AUTO_FIX" = true ]; then
        log_warning "Auto-fix: Copying from .env.example..."
        local example_file="${env_file%.production}.example"
        if [ -f "$example_file" ]; then
          cp "$example_file" "$env_file"
          log_success "Created $env_file from example"
        fi
      fi
    fi
  done
}

# 2. Verify build files
verify_build_files() {
  log_info "2. Verifying build files..."

  # Frontend build
  if [ -f "$SCRIPT_DIR/apps/react-app/dist/index.html" ]; then
    local build_age=$(($(date +%s) - $(stat -c %Y "$SCRIPT_DIR/apps/react-app/dist/index.html" 2>/dev/null || echo 0)))
    local build_days=$((build_age / 86400))

    if [ "$build_days" -gt 7 ]; then
      log_warning "Frontend build is $build_days days old (consider rebuilding)"
    else
      log_success "Frontend build exists and is recent"
    fi

    # Verify critical frontend files
    local frontend_files=(
      "$SCRIPT_DIR/apps/react-app/dist/index.html"
      "$SCRIPT_DIR/apps/react-app/dist/manifest.json"
      "$SCRIPT_DIR/apps/react-app/dist/assets"
    )

    for file in "${frontend_files[@]}"; do
      if [ -e "$file" ]; then
        log_success "  ✓ $(basename "$file") exists"
      else
        log_error "  ✗ $(basename "$file") missing"

        if [ "$AUTO_FIX" = true ]; then
          log_warning "Auto-fix: Running rebuild-frontend.sh..."
          "$SCRIPT_DIR/rebuild-frontend.sh" --skip-backup --force
          break
        fi
      fi
    done
  else
    log_error "Frontend build missing: dist/index.html not found"

    if [ "$AUTO_FIX" = true ]; then
      log_warning "Auto-fix: Running rebuild-frontend.sh..."
      "$SCRIPT_DIR/rebuild-frontend.sh" --skip-backup --force
    else
      log_warning "Run: ./rebuild-frontend.sh to build the frontend"
    fi
  fi

  # API source files (TypeScript - no build directory needed)
  if [ -f "$SCRIPT_DIR/apps/api/src/index.ts" ]; then
    log_success "API source files exist (TypeScript runtime)"
  else
    log_error "API source missing: src/index.ts not found"
  fi
}

# 3. Verify dependencies
verify_dependencies() {
  log_info "3. Verifying dependencies..."

  # Check API dependencies
  if [ -d "$SCRIPT_DIR/apps/api/node_modules" ]; then
    log_success "API node_modules exists"

    # Check if package.json is newer
    if [ "$SCRIPT_DIR/apps/api/package.json" -nt "$SCRIPT_DIR/apps/api/node_modules" ]; then
      log_warning "API package.json is newer than node_modules"

      if [ "$AUTO_FIX" = true ]; then
        log_warning "Auto-fix: Running npm install..."
        cd "$SCRIPT_DIR/apps/api" && npm install
      else
        log_warning "Run: cd apps/api && npm install"
      fi
    fi
  else
    log_error "API node_modules missing"

    if [ "$AUTO_FIX" = true ]; then
      log_warning "Auto-fix: Running npm install..."
      cd "$SCRIPT_DIR/apps/api" && npm install
    fi
  fi

  # Check frontend dependencies
  if [ -d "$SCRIPT_DIR/apps/react-app/node_modules" ]; then
    log_success "Frontend node_modules exists"

    if [ "$SCRIPT_DIR/apps/react-app/package.json" -nt "$SCRIPT_DIR/apps/react-app/node_modules" ]; then
      log_warning "Frontend package.json is newer than node_modules"

      if [ "$AUTO_FIX" = true ]; then
        log_warning "Auto-fix: Running npm install..."
        cd "$SCRIPT_DIR/apps/react-app" && npm install
      else
        log_warning "Run: cd apps/react-app && npm install"
      fi
    fi
  else
    log_error "Frontend node_modules missing"

    if [ "$AUTO_FIX" = true ]; then
      log_warning "Auto-fix: Running npm install..."
      cd "$SCRIPT_DIR/apps/react-app" && npm install
    fi
  fi
}

# 4. Verify Docker containers
verify_docker() {
  log_info "4. Verifying Docker containers..."

  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    return
  fi

  local required_containers=(
    "cryb-postgres-dev:5432"
    "cryb-redis-dev:6380"
    "cryb-minio:9000"
    "elasticsearch:9200"
  )

  for container_info in "${required_containers[@]}"; do
    local container_name=$(echo "$container_info" | cut -d: -f1)
    local container_port=$(echo "$container_info" | cut -d: -f2)

    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
      local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null)
      log_success "$container_name: $status"

      # Verify port is accessible
      if nc -z localhost "$container_port" 2>/dev/null; then
        log_success "  ✓ Port $container_port is accessible"
      else
        log_warning "  ✗ Port $container_port is not accessible"
      fi
    else
      log_error "$container_name: not running"

      if [ "$AUTO_FIX" = true ]; then
        log_warning "Auto-fix: Starting container..."
        docker start "$container_name" 2>/dev/null || log_error "Could not start $container_name"
      fi
    fi
  done
}

# 5. Verify PM2 ecosystem config
verify_pm2_config() {
  log_info "5. Verifying PM2 configuration..."

  if [ ! -f "$SCRIPT_DIR/ecosystem.config.js" ]; then
    log_error "ecosystem.config.js not found"
    return
  fi

  log_success "ecosystem.config.js exists"

  # Verify it's valid JavaScript
  if node -c "$SCRIPT_DIR/ecosystem.config.js" 2>/dev/null; then
    log_success "  ✓ Configuration syntax is valid"
  else
    log_error "  ✗ Configuration has syntax errors"
  fi

  # Check for required apps
  local required_apps=("cryb-api" "cryb-frontend" "cryb-workers")

  for app in "${required_apps[@]}"; do
    if grep -q "name: '$app'" "$SCRIPT_DIR/ecosystem.config.js"; then
      log_success "  ✓ $app is configured"
    else
      log_warning "  ✗ $app not found in config"
    fi
  done
}

# 6. Verify ports are available
verify_ports() {
  log_info "6. Verifying service ports..."

  # These ports should be in use by our services
  local ports_in_use=("3002:API" "3008:Frontend" "5432:PostgreSQL" "6380:Redis")

  for port_info in "${ports_in_use[@]}"; do
    local port=$(echo "$port_info" | cut -d: -f1)
    local service=$(echo "$port_info" | cut -d: -f2)

    if nc -z localhost "$port" 2>/dev/null; then
      log_success "$service (port $port): in use ✓"
    else
      log_warning "$service (port $port): not in use"
    fi
  done
}

# 7. Verify file permissions
verify_permissions() {
  log_info "7. Verifying file permissions..."

  local script_files=(
    "$SCRIPT_DIR/health-check.sh"
    "$SCRIPT_DIR/rebuild-frontend.sh"
    "$SCRIPT_DIR/verify-services.sh"
    "$SCRIPT_DIR/startup-checks.sh"
  )

  for script in "${script_files[@]}"; do
    if [ -f "$script" ]; then
      if [ -x "$script" ]; then
        log_success "$(basename "$script"): executable ✓"
      else
        log_warning "$(basename "$script"): not executable"

        if [ "$AUTO_FIX" = true ]; then
          chmod +x "$script"
          log_success "  Fixed: Made executable"
        else
          log_warning "  Run: chmod +x $(basename "$script")"
        fi
      fi
    fi
  done
}

# 8. Verify disk space
verify_disk_space() {
  log_info "8. Verifying disk space..."

  local root_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  local root_avail=$(df -h / | awk 'NR==2 {print $4}')

  if [ "$root_usage" -gt 90 ]; then
    log_error "Disk space critical: ${root_usage}% used (${root_avail} available)"
  elif [ "$root_usage" -gt 80 ]; then
    log_warning "Disk space high: ${root_usage}% used (${root_avail} available)"
  else
    log_success "Disk space healthy: ${root_usage}% used (${root_avail} available)"
  fi

  # Check for large log files
  local log_size=$(du -sh /home/ubuntu/.pm2/logs 2>/dev/null | cut -f1 || echo "0")
  log_info "PM2 logs size: $log_size"

  if [[ "$log_size" =~ G ]] && [ "${log_size%G}" -gt 1 ]; then
    log_warning "PM2 logs are large (>1GB). Consider enabling log rotation."
  fi
}

# 9. Verify network connectivity
verify_network() {
  log_info "9. Verifying network connectivity..."

  # Check localhost
  if ping -c 1 localhost &>/dev/null; then
    log_success "Localhost: reachable"
  else
    log_error "Localhost: not reachable"
  fi

  # Check internet (optional, for external services)
  if ping -c 1 8.8.8.8 &>/dev/null; then
    log_success "Internet: connected"
  else
    log_warning "Internet: not connected (may affect external services)"
  fi
}

# 10. Run basic service tests
verify_service_health() {
  log_info "10. Verifying service health..."

  # Test API health endpoint
  local api_response=$(curl -s -w "\n%{http_code}" http://localhost:3002/health 2>/dev/null || echo "failed\n000")
  local api_code=$(echo "$api_response" | tail -n1)

  if [ "$api_code" = "200" ]; then
    log_success "API health endpoint: HTTP $api_code"
  else
    log_error "API health endpoint: HTTP $api_code (not responding)"
  fi

  # Test frontend
  local frontend_response=$(curl -s -w "\n%{http_code}" http://localhost:3008 2>/dev/null || echo "failed\n000")
  local frontend_code=$(echo "$frontend_response" | tail -n1)

  if [ "$frontend_code" = "200" ]; then
    log_success "Frontend: HTTP $frontend_code"
  else
    log_error "Frontend: HTTP $frontend_code (not responding)"
  fi

  # Test database connection
  if pg_isready -h localhost -p 5432 &>/dev/null; then
    log_success "PostgreSQL: accepting connections"
  else
    log_error "PostgreSQL: not accepting connections"
  fi

  # Test Redis connection
  if redis-cli -h localhost -p 6380 ping &>/dev/null | grep -q "PONG"; then
    log_success "Redis: PONG"
  else
    log_error "Redis: not responding"
  fi
}

# Main execution
main() {
  verify_env_files
  verify_build_files
  verify_dependencies
  verify_docker
  verify_pm2_config
  verify_ports
  verify_permissions
  verify_disk_space
  verify_network
  verify_service_health

  # Summary
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "Errors found:   ${RED}$ERRORS_FOUND${NC}"
  echo -e "Warnings found: ${YELLOW}$WARNINGS_FOUND${NC}"
  echo ""

  if [ "$ERRORS_FOUND" -eq 0 ] && [ "$WARNINGS_FOUND" -eq 0 ]; then
    log_success "✓ All verifications passed - services are ready"
    echo ""
    log_info "Safe to proceed with:"
    log_info "  - pm2 restart all"
    log_info "  - ./start-platform.sh"
    exit 0
  elif [ "$ERRORS_FOUND" -eq 0 ]; then
    log_warning "⚠ Verifications passed with warnings"

    if [ "$STRICT_MODE" = true ]; then
      log_error "Strict mode enabled - failing due to warnings"
      exit 1
    else
      log_info "Services may work but issues should be addressed"
      exit 0
    fi
  else
    log_error "✗ Verifications failed - DO NOT restart services"
    echo ""
    log_error "Fix the errors above before restarting services"

    if [ "$AUTO_FIX" = false ]; then
      log_info "Tip: Run with --fix to automatically fix some issues"
    fi

    exit 1
  fi
}

# Run main
main
