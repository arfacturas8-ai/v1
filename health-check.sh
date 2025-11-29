#!/bin/bash

#############################################
# CRYB Platform Health Check Script
# Performs comprehensive system validation
# Usage: ./health-check.sh [--json] [--verbose]
#############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_JSON=false
VERBOSE=false
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
HEALTH_REPORT_FILE="$SCRIPT_DIR/health-check-report.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
for arg in "$@"; do
  case $arg in
    --json) OUTPUT_JSON=true ;;
    --verbose) VERBOSE=true ;;
    --help)
      echo "Usage: $0 [--json] [--verbose]"
      echo "  --json     Output results in JSON format"
      echo "  --verbose  Show detailed output"
      exit 0
      ;;
  esac
done

# Initialize results
declare -A RESULTS
OVERALL_STATUS="HEALTHY"
ISSUES_FOUND=()
WARNINGS_FOUND=()

# Logging functions
log_info() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}[INFO]${NC} $1"
  fi
}

log_success() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${GREEN}[OK]${NC} $1"
  fi
}

log_warning() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${YELLOW}[WARNING]${NC} $1"
  fi
  WARNINGS_FOUND+=("$1")
}

log_error() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${RED}[ERROR]${NC} $1"
  fi
  ISSUES_FOUND+=("$1")
  OVERALL_STATUS="UNHEALTHY"
}

log_header() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo ""
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
  fi
}

# Check PM2 processes
check_pm2_processes() {
  log_header "1. PM2 Process Health Check"

  if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed"
    RESULTS["pm2"]="NOT_INSTALLED"
    return 1
  fi

  local pm2_status=$(pm2 jlist 2>/dev/null)
  if [ $? -ne 0 ]; then
    log_error "Cannot retrieve PM2 process list"
    RESULTS["pm2"]="ERROR"
    return 1
  fi

  # Critical services to check
  local critical_services=("cryb-api" "cryb-frontend" "cryb-workers")
  local all_healthy=true

  for service in "${critical_services[@]}"; do
    local status=$(echo "$pm2_status" | jq -r ".[] | select(.name == \"$service\") | .pm2_env.status" 2>/dev/null)
    local restarts=$(echo "$pm2_status" | jq -r ".[] | select(.name == \"$service\") | .pm2_env.restart_time" 2>/dev/null)
    local memory=$(echo "$pm2_status" | jq -r ".[] | select(.name == \"$service\") | .monit.memory" 2>/dev/null)

    if [ "$status" = "online" ]; then
      log_success "$service: online (restarts: $restarts, memory: $(numfmt --to=iec-i --suffix=B $memory 2>/dev/null || echo ${memory}B))"
      RESULTS["pm2_$service"]="online"
    else
      log_error "$service: $status"
      RESULTS["pm2_$service"]="$status"
      all_healthy=false
    fi

    # Check for excessive restarts
    if [ -n "$restarts" ] && [ "$restarts" -gt 100 ]; then
      log_warning "$service has restarted $restarts times (may indicate instability)"
    fi
  done

  if [ "$all_healthy" = true ]; then
    RESULTS["pm2"]="HEALTHY"
  else
    RESULTS["pm2"]="UNHEALTHY"
  fi
}

# Check database connectivity
check_database() {
  log_header "2. Database Health Check"

  if ! command -v pg_isready &> /dev/null; then
    log_warning "pg_isready not installed, skipping direct PostgreSQL check"
    RESULTS["database_direct"]="SKIPPED"
  else
    if pg_isready -h localhost -p 5432 &> /dev/null; then
      log_success "PostgreSQL (localhost:5432): accepting connections"
      RESULTS["database_direct"]="HEALTHY"
    else
      log_error "PostgreSQL (localhost:5432): not accepting connections"
      RESULTS["database_direct"]="UNHEALTHY"
    fi
  fi

  # Check via API health endpoint
  local api_health=$(curl -s http://localhost:3002/health 2>/dev/null)
  local db_status=$(echo "$api_health" | jq -r '.checks.database' 2>/dev/null)

  if [ "$db_status" = "healthy" ]; then
    log_success "Database (via API): healthy"
    RESULTS["database"]="HEALTHY"
  else
    log_error "Database (via API): $db_status"
    RESULTS["database"]="UNHEALTHY"
  fi
}

# Check Redis connectivity
check_redis() {
  log_header "3. Redis Health Check"

  if ! command -v redis-cli &> /dev/null; then
    log_warning "redis-cli not installed, checking via API only"
    RESULTS["redis_direct"]="SKIPPED"
  else
    # Check correct port (6380 for dev environment)
    if redis-cli -h localhost -p 6380 ping &> /dev/null | grep -q "PONG"; then
      log_success "Redis (localhost:6380): PONG"
      RESULTS["redis_direct"]="HEALTHY"
    else
      log_warning "Redis (localhost:6380): not responding"
      RESULTS["redis_direct"]="UNHEALTHY"
    fi
  fi

  # Check via API health endpoint
  local api_health=$(curl -s http://localhost:3002/health 2>/dev/null)
  local redis_status=$(echo "$api_health" | jq -r '.checks.redis' 2>/dev/null)

  if [ "$redis_status" = "healthy" ]; then
    log_success "Redis (via API): healthy"
    RESULTS["redis"]="HEALTHY"
  else
    log_error "Redis (via API): $redis_status"
    RESULTS["redis"]="UNHEALTHY"
  fi
}

# Check disk space
check_disk_space() {
  log_header "4. Disk Space Check"

  local root_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  local root_avail=$(df -h / | awk 'NR==2 {print $4}')

  log_info "Root partition: ${root_usage}% used, ${root_avail} available"

  if [ "$root_usage" -gt 90 ]; then
    log_error "Disk space critical: ${root_usage}% used"
    RESULTS["disk_space"]="CRITICAL"
  elif [ "$root_usage" -gt 80 ]; then
    log_warning "Disk space high: ${root_usage}% used"
    RESULTS["disk_space"]="WARNING"
  else
    log_success "Disk space healthy: ${root_usage}% used"
    RESULTS["disk_space"]="HEALTHY"
  fi
}

# Check critical directories
check_directories() {
  log_header "5. Critical Directory Check"

  local critical_dirs=(
    "/home/ubuntu/cryb-platform/apps/react-app/dist"
    "/home/ubuntu/cryb-platform/apps/api/src"
    "/home/ubuntu/cryb-platform/apps/api/node_modules"
    "/home/ubuntu/cryb-platform/apps/react-app/node_modules"
  )

  local all_exist=true

  for dir in "${critical_dirs[@]}"; do
    if [ -d "$dir" ]; then
      local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
      log_success "$dir exists (${size})"
    else
      log_error "$dir does not exist"
      all_exist=false
    fi
  done

  # Check specific critical files
  if [ -f "/home/ubuntu/cryb-platform/apps/react-app/dist/index.html" ]; then
    log_success "Frontend build: index.html exists"
    RESULTS["frontend_build"]="EXISTS"
  else
    log_error "Frontend build: index.html missing (run rebuild-frontend.sh)"
    RESULTS["frontend_build"]="MISSING"
    all_exist=false
  fi

  if [ "$all_exist" = true ]; then
    RESULTS["directories"]="HEALTHY"
  else
    RESULTS["directories"]="UNHEALTHY"
  fi
}

# Check Docker containers
check_docker() {
  log_header "6. Docker Container Health Check"

  if ! command -v docker &> /dev/null; then
    log_warning "Docker not installed"
    RESULTS["docker"]="NOT_INSTALLED"
    return
  fi

  if ! docker ps &> /dev/null; then
    log_error "Cannot connect to Docker daemon"
    RESULTS["docker"]="ERROR"
    return
  fi

  # Critical containers
  local critical_containers=("cryb-postgres-dev" "cryb-redis-dev" "cryb-minio" "elasticsearch")
  local all_running=true

  for container in "${critical_containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
      local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
      log_success "$container: $status"
      RESULTS["docker_$container"]="$status"
    else
      log_error "$container: not running"
      RESULTS["docker_$container"]="stopped"
      all_running=false
    fi
  done

  if [ "$all_running" = true ]; then
    RESULTS["docker"]="HEALTHY"
  else
    RESULTS["docker"]="UNHEALTHY"
  fi
}

# Check API endpoints
check_api_endpoints() {
  log_header "7. API Endpoint Health Check"

  # Health endpoint
  local health_response=$(curl -s -w "\n%{http_code}" http://localhost:3002/health 2>/dev/null)
  local health_code=$(echo "$health_response" | tail -n1)

  if [ "$health_code" = "200" ]; then
    log_success "API health endpoint: HTTP $health_code"
    RESULTS["api_health"]="HEALTHY"
  else
    log_error "API health endpoint: HTTP $health_code"
    RESULTS["api_health"]="UNHEALTHY"
  fi

  # Check if API is responsive
  if curl -s http://localhost:3002/api/v1/channels &> /dev/null; then
    log_success "API channels endpoint: responding (auth required)"
    RESULTS["api_responsive"]="HEALTHY"
  else
    log_error "API channels endpoint: not responding"
    RESULTS["api_responsive"]="UNHEALTHY"
  fi
}

# Check frontend
check_frontend() {
  log_header "8. Frontend Health Check"

  local frontend_response=$(curl -s -w "\n%{http_code}" http://localhost:3008 2>/dev/null)
  local frontend_code=$(echo "$frontend_response" | tail -n1)

  if [ "$frontend_code" = "200" ]; then
    log_success "Frontend (localhost:3008): HTTP $frontend_code"
    RESULTS["frontend"]="HEALTHY"
  else
    log_error "Frontend (localhost:3008): HTTP $frontend_code"
    RESULTS["frontend"]="UNHEALTHY"
  fi
}

# Check system resources
check_system_resources() {
  log_header "9. System Resource Check"

  # Memory
  local mem_total=$(free -m | awk 'NR==2 {print $2}')
  local mem_used=$(free -m | awk 'NR==2 {print $3}')
  local mem_percent=$((mem_used * 100 / mem_total))

  log_info "Memory: ${mem_used}MB / ${mem_total}MB (${mem_percent}%)"

  if [ "$mem_percent" -gt 90 ]; then
    log_warning "Memory usage high: ${mem_percent}%"
    RESULTS["memory"]="HIGH"
  else
    log_success "Memory usage normal: ${mem_percent}%"
    RESULTS["memory"]="HEALTHY"
  fi

  # Swap
  local swap_total=$(free -m | awk 'NR==3 {print $2}')
  local swap_used=$(free -m | awk 'NR==3 {print $3}')

  if [ "$swap_total" -gt 0 ]; then
    local swap_percent=$((swap_used * 100 / swap_total))
    log_info "Swap: ${swap_used}MB / ${swap_total}MB (${swap_percent}%)"

    if [ "$swap_percent" -gt 50 ]; then
      log_warning "Swap usage high: ${swap_percent}% (may indicate memory pressure)"
      RESULTS["swap"]="HIGH"
    else
      RESULTS["swap"]="NORMAL"
    fi
  fi

  # CPU load
  local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
  log_info "Load average (1min): $load_avg"
  RESULTS["load_average"]="$load_avg"
}

# Check logs rotation
check_logs() {
  log_header "10. Log Rotation Check"

  if pm2 list | grep -q "pm2-logrotate"; then
    log_success "PM2 log rotation: enabled"
    RESULTS["log_rotation"]="ENABLED"
  else
    log_warning "PM2 log rotation: not installed (install with: pm2 install pm2-logrotate)"
    RESULTS["log_rotation"]="DISABLED"
  fi

  # Check log directory size
  local log_size=$(du -sh /home/ubuntu/.pm2/logs 2>/dev/null | cut -f1 || echo "unknown")
  log_info "PM2 logs directory size: $log_size"
  RESULTS["log_size"]="$log_size"
}

# Check Elasticsearch
check_elasticsearch() {
  log_header "11. Elasticsearch Health Check"

  local es_health=$(curl -s http://localhost:9200/_cluster/health 2>/dev/null)
  local es_status=$(echo "$es_health" | jq -r '.status' 2>/dev/null)

  if [ "$es_status" = "green" ] || [ "$es_status" = "yellow" ]; then
    log_success "Elasticsearch: $es_status"
    RESULTS["elasticsearch"]="HEALTHY"
  elif [ -z "$es_status" ]; then
    log_error "Elasticsearch: not responding"
    RESULTS["elasticsearch"]="UNHEALTHY"
  else
    log_warning "Elasticsearch: $es_status"
    RESULTS["elasticsearch"]="WARNING"
  fi
}

# Check MinIO
check_minio() {
  log_header "12. MinIO Storage Health Check"

  local minio_health=$(curl -s http://localhost:9000/minio/health/live 2>/dev/null)

  if [ $? -eq 0 ]; then
    log_success "MinIO: responding"
    RESULTS["minio"]="HEALTHY"
  else
    log_error "MinIO: not responding"
    RESULTS["minio"]="UNHEALTHY"
  fi
}

# Generate JSON report
generate_json_report() {
  local json_results=""

  for key in "${!RESULTS[@]}"; do
    json_results="${json_results}\"$key\": \"${RESULTS[$key]}\","
  done

  # Remove trailing comma
  json_results=${json_results%,}

  # Build issues array
  local issues_json=""
  for issue in "${ISSUES_FOUND[@]}"; do
    issues_json="${issues_json}\"$issue\","
  done
  issues_json=${issues_json%,}

  # Build warnings array
  local warnings_json=""
  for warning in "${WARNINGS_FOUND[@]}"; do
    warnings_json="${warnings_json}\"$warning\","
  done
  warnings_json=${warnings_json%,}

  cat > "$HEALTH_REPORT_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "overall_status": "$OVERALL_STATUS",
  "checks": {
    $json_results
  },
  "issues": [$issues_json],
  "warnings": [$warnings_json],
  "system_info": {
    "uptime": "$(uptime -p)",
    "hostname": "$(hostname)",
    "platform": "CRYB Platform"
  }
}
EOF

  if [ "$OUTPUT_JSON" = true ]; then
    cat "$HEALTH_REPORT_FILE"
  else
    log_success "Health report saved to: $HEALTH_REPORT_FILE"
  fi
}

# Main execution
main() {
  if [ "$OUTPUT_JSON" = false ]; then
    echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║      CRYB PLATFORM HEALTH CHECK                 ║${NC}"
    echo -e "${BLUE}║      Started: $TIMESTAMP            ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  fi

  # Run all checks
  check_pm2_processes
  check_database
  check_redis
  check_disk_space
  check_directories
  check_docker
  check_api_endpoints
  check_frontend
  check_system_resources
  check_logs
  check_elasticsearch
  check_minio

  # Generate report
  generate_json_report

  # Summary
  if [ "$OUTPUT_JSON" = false ]; then
    echo ""
    log_header "SUMMARY"
    echo -e "Overall Status: ${OVERALL_STATUS}"
    echo -e "Issues Found: ${#ISSUES_FOUND[@]}"
    echo -e "Warnings: ${#WARNINGS_FOUND[@]}"
    echo ""

    if [ "${#ISSUES_FOUND[@]}" -gt 0 ]; then
      echo -e "${RED}Critical Issues:${NC}"
      for issue in "${ISSUES_FOUND[@]}"; do
        echo -e "  - $issue"
      done
      echo ""
    fi

    if [ "${#WARNINGS_FOUND[@]}" -gt 0 ]; then
      echo -e "${YELLOW}Warnings:${NC}"
      for warning in "${WARNINGS_FOUND[@]}"; do
        echo -e "  - $warning"
      done
      echo ""
    fi

    if [ "$OVERALL_STATUS" = "HEALTHY" ] && [ "${#WARNINGS_FOUND[@]}" -eq 0 ]; then
      echo -e "${GREEN}✓ All systems operational${NC}"
    fi

    echo ""
    echo "Full report: $HEALTH_REPORT_FILE"
  fi

  # Exit code
  if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
    exit 0
  else
    exit 1
  fi
}

# Run main
main
