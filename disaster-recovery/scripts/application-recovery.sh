#!/bin/bash

# ==============================================
# CRYB Platform Application Recovery Script
# ==============================================
# Handles application server disaster recovery
# Supports container orchestration and service restoration
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/disaster-recovery"
CONFIG_FILE="${SCRIPT_DIR}/../config/recovery.conf"
PLATFORM_DIR="/home/ubuntu/cryb-platform"

# Application configuration
API_PORT="${API_PORT:-3002}"
WEB_PORT="${WEB_PORT:-3003}"
ADMIN_PORT="${ADMIN_PORT:-3007}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [APP-RECOVERY] [${level}] ${message}" | tee -a "${LOG_DIR}/application-recovery.log"
}

log_info() { log "INFO" "$@"; echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn() { log "WARN" "$@"; echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { log "ERROR" "$@"; echo -e "${RED}[ERROR]${NC} $*"; }
log_debug() { log "DEBUG" "$@"; echo -e "${BLUE}[DEBUG]${NC} $*"; }

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        source "$CONFIG_FILE"
        log_info "Application recovery configuration loaded"
    else
        log_warn "Configuration file not found, using defaults"
    fi
}

# Check service status
check_service_status() {
    local service="$1"
    local port="$2"
    
    if curl -s --max-time 5 "http://localhost:$port/api/health" >/dev/null 2>&1; then
        log_info "✓ $service is responding on port $port"
        return 0
    else
        log_warn "✗ $service is not responding on port $port"
        return 1
    fi
}

# Stop all services
stop_all_services() {
    log_info "Stopping all application services..."
    
    cd "$PLATFORM_DIR"
    
    # Stop Docker Compose services
    docker-compose down --remove-orphans || true
    docker-compose -f docker-compose.monitoring.yml down --remove-orphans || true
    docker-compose -f docker-compose.security-monitoring.yml down --remove-orphans || true
    
    # Stop individual containers if they exist
    local containers=("cryb-api" "cryb-web" "cryb-admin" "cryb-postgres" "cryb-redis")
    for container in "${containers[@]}"; do
        if docker ps -q -f name="$container" | grep -q .; then
            log_info "Stopping container: $container"
            docker stop "$container" || true
            docker rm "$container" || true
        fi
    done
    
    # Kill any remaining processes
    pkill -f "node.*cryb" || true
    pkill -f "pnpm.*start" || true
    
    log_info "All services stopped"
}

# Clean Docker environment
clean_docker_environment() {
    log_info "Cleaning Docker environment..."
    
    # Remove stopped containers
    docker container prune -f || true
    
    # Remove unused networks
    docker network prune -f || true
    
    # Remove unused volumes (be careful with data)
    docker volume prune -f || true
    
    # Remove unused images
    docker image prune -f || true
    
    log_info "Docker environment cleaned"
}

# Backup current configuration
backup_current_config() {
    log_info "Backing up current configuration..."
    
    local backup_name="app-config-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/config/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup configuration files
    if [[ -d "$PLATFORM_DIR/config" ]]; then
        cp -r "$PLATFORM_DIR/config" "$backup_path/" || true
    fi
    
    # Backup environment files
    find "$PLATFORM_DIR" -name ".env*" -type f -exec cp {} "$backup_path/" \; || true
    
    # Backup Docker Compose files
    cp "$PLATFORM_DIR"/docker-compose*.yml "$backup_path/" || true
    
    # Backup package files
    find "$PLATFORM_DIR" -name "package.json" -type f | while read -r package_file; do
        local rel_path
        rel_path=$(realpath --relative-to="$PLATFORM_DIR" "$package_file")
        local dir_path
        dir_path=$(dirname "$backup_path/$rel_path")
        mkdir -p "$dir_path"
        cp "$package_file" "$dir_path/"
    done
    
    log_info "Configuration backup created: $backup_path"
    echo "$backup_path"
}

# Restore configuration from backup
restore_configuration() {
    local backup_path="$1"
    
    log_info "Restoring configuration from $backup_path"
    
    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup path does not exist: $backup_path"
        return 1
    fi
    
    # Restore configuration directory
    if [[ -d "$backup_path/config" ]]; then
        rm -rf "$PLATFORM_DIR/config"
        cp -r "$backup_path/config" "$PLATFORM_DIR/"
        log_info "Configuration directory restored"
    fi
    
    # Restore environment files
    find "$backup_path" -name ".env*" -type f -exec cp {} "$PLATFORM_DIR/" \; || true
    
    # Restore Docker Compose files
    cp "$backup_path"/docker-compose*.yml "$PLATFORM_DIR/" || true
    
    log_info "Configuration restoration completed"
}

# Pull latest images
pull_latest_images() {
    log_info "Pulling latest Docker images..."
    
    cd "$PLATFORM_DIR"
    
    # Pull images defined in Docker Compose
    docker-compose pull || log_warn "Failed to pull some images"
    
    # Pull additional monitoring images
    docker-compose -f docker-compose.monitoring.yml pull || log_warn "Failed to pull monitoring images"
    
    log_info "Image pulling completed"
}

# Start core services
start_core_services() {
    log_info "Starting core infrastructure services..."
    
    cd "$PLATFORM_DIR"
    
    # Start database first
    log_info "Starting database service..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            log_info "Database is ready"
            break
        fi
        log_debug "Waiting for database... ($retries retries left)"
        sleep 2
        ((retries--))
    done
    
    if [[ $retries -eq 0 ]]; then
        log_error "Database failed to start"
        return 1
    fi
    
    # Start Redis
    log_info "Starting Redis service..."
    docker-compose up -d redis
    
    # Wait for Redis to be ready
    retries=15
    while [[ $retries -gt 0 ]]; do
        if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
            log_info "Redis is ready"
            break
        fi
        log_debug "Waiting for Redis... ($retries retries left)"
        sleep 2
        ((retries--))
    done
    
    log_info "Core services started"
}

# Start application services
start_application_services() {
    log_info "Starting application services..."
    
    cd "$PLATFORM_DIR"
    
    # Start API service
    log_info "Starting API service..."
    docker-compose up -d api
    
    # Wait for API to be ready
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if check_service_status "API" "$API_PORT"; then
            break
        fi
        log_debug "Waiting for API service... ($retries retries left)"
        sleep 3
        ((retries--))
    done
    
    if [[ $retries -eq 0 ]]; then
        log_error "API service failed to start"
        return 1
    fi
    
    # Start web application
    log_info "Starting web application..."
    docker-compose up -d web
    
    # Wait for web app to be ready
    retries=30
    while [[ $retries -gt 0 ]]; do
        if curl -s --max-time 5 "http://localhost:$WEB_PORT" >/dev/null 2>&1; then
            log_info "Web application is ready"
            break
        fi
        log_debug "Waiting for web application... ($retries retries left)"
        sleep 3
        ((retries--))
    done
    
    # Start admin panel
    log_info "Starting admin panel..."
    docker-compose up -d admin
    
    # Wait for admin panel to be ready
    retries=20
    while [[ $retries -gt 0 ]]; do
        if curl -s --max-time 5 "http://localhost:$ADMIN_PORT" >/dev/null 2>&1; then
            log_info "Admin panel is ready"
            break
        fi
        log_debug "Waiting for admin panel... ($retries retries left)"
        sleep 3
        ((retries--))
    done
    
    log_info "Application services started"
}

# Start supporting services
start_supporting_services() {
    log_info "Starting supporting services..."
    
    cd "$PLATFORM_DIR"
    
    # Start monitoring services
    log_info "Starting monitoring services..."
    docker-compose -f docker-compose.monitoring.yml up -d || log_warn "Failed to start monitoring services"
    
    # Start security monitoring if available
    if [[ -f "docker-compose.security-monitoring.yml" ]]; then
        log_info "Starting security monitoring services..."
        docker-compose -f docker-compose.security-monitoring.yml up -d || log_warn "Failed to start security monitoring"
    fi
    
    log_info "Supporting services started"
}

# Run database migrations
run_database_migrations() {
    log_info "Running database migrations..."
    
    cd "$PLATFORM_DIR"
    
    # Wait for API to be fully ready
    sleep 5
    
    # Run migrations through the API container
    if docker-compose exec -T api npm run migrate >/dev/null 2>&1; then
        log_info "Database migrations completed successfully"
    else
        log_warn "Database migrations failed or not available"
    fi
}

# Validate service health
validate_service_health() {
    log_info "Validating service health..."
    
    local errors=0
    
    # Check API health
    if check_service_status "API" "$API_PORT"; then
        # Additional API health checks
        if curl -s --max-time 10 "http://localhost:$API_PORT/api/health" | grep -q '"status":"healthy"'; then
            log_info "✓ API service is healthy"
        else
            log_error "✗ API service health check failed"
            ((errors++))
        fi
    else
        log_error "✗ API service is not responding"
        ((errors++))
    fi
    
    # Check web application
    if curl -s --max-time 10 "http://localhost:$WEB_PORT" >/dev/null 2>&1; then
        log_info "✓ Web application is accessible"
    else
        log_error "✗ Web application is not accessible"
        ((errors++))
    fi
    
    # Check admin panel
    if curl -s --max-time 10 "http://localhost:$ADMIN_PORT" >/dev/null 2>&1; then
        log_info "✓ Admin panel is accessible"
    else
        log_warn "⚠ Admin panel is not accessible (non-critical)"
    fi
    
    # Check database connectivity
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        log_info "✓ Database is accessible"
    else
        log_error "✗ Database is not accessible"
        ((errors++))
    fi
    
    # Check Redis connectivity
    if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
        log_info "✓ Redis is accessible"
    else
        log_error "✗ Redis is not accessible"
        ((errors++))
    fi
    
    # Check container status
    local failed_containers
    failed_containers=$(docker-compose ps --filter "status=exited" --format "table {{.Name}}" | tail -n +2 | wc -l)
    
    if [[ $failed_containers -eq 0 ]]; then
        log_info "✓ All containers are running"
    else
        log_error "✗ $failed_containers containers have failed"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_info "✓ Service health validation passed"
        return 0
    else
        log_error "✗ Service health validation failed with $errors errors"
        return 1
    fi
}

# Performance optimization
optimize_performance() {
    log_info "Optimizing application performance..."
    
    # Clear application caches
    log_info "Clearing application caches..."
    docker-compose exec -T redis redis-cli FLUSHDB || true
    
    # Restart services for clean state
    log_info "Restarting services for optimal performance..."
    docker-compose restart api web || true
    
    # Wait for services to stabilize
    sleep 10
    
    log_info "Performance optimization completed"
}

# Generate recovery report
generate_recovery_report() {
    local start_time="$1"
    local end_time="$2"
    local success="$3"
    
    local duration=$((end_time - start_time))
    local report_file="${LOG_DIR}/application-recovery-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# CRYB Platform Application Recovery Report

## Recovery Summary
- **Start Time**: $(date -d "@$start_time" '+%Y-%m-%d %H:%M:%S UTC')
- **End Time**: $(date -d "@$end_time" '+%Y-%m-%d %H:%M:%S UTC')
- **Duration**: $duration seconds ($(($duration / 60)) minutes)
- **Success**: $success

## Services Status
$(docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}")

## Container Logs Summary
$(docker-compose logs --tail=10 api web admin 2>/dev/null | head -50)

## Performance Metrics
- **Memory Usage**: $(free -h | grep Mem)
- **Disk Usage**: $(df -h / | tail -1)
- **Load Average**: $(uptime | awk -F'load average:' '{print $2}')

## Recommendations
- Monitor application performance for the next hour
- Check application logs for any errors
- Verify user-facing functionality
- Consider running integration tests

---
Report generated on $(date) by application recovery system.
EOF

    log_info "Application recovery report generated: $report_file"
    echo "$report_file"
}

# Main recovery function
main() {
    local recovery_mode="${1:-full}"
    local config_backup="${2:-}"
    
    local start_time=$(date +%s)
    
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}CRYB Application Recovery${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo
    
    log_info "Starting application recovery process..."
    log_info "Recovery mode: $recovery_mode"
    
    # Load configuration
    load_config
    
    # Backup current configuration
    local current_config_backup
    current_config_backup=$(backup_current_config)
    
    # Execute recovery based on mode
    case "$recovery_mode" in
        "full")
            log_info "Performing full application recovery..."
            
            # Stop all services
            stop_all_services
            
            # Clean Docker environment
            clean_docker_environment
            
            # Restore configuration if provided
            if [[ -n "$config_backup" ]]; then
                restore_configuration "$config_backup"
            fi
            
            # Pull latest images
            pull_latest_images
            
            # Start services in order
            start_core_services
            start_application_services
            
            # Run migrations
            run_database_migrations
            
            # Start supporting services
            start_supporting_services
            
            # Optimize performance
            optimize_performance
            ;;
            
        "restart")
            log_info "Performing application restart..."
            
            # Stop application services only
            docker-compose restart api web admin
            
            # Wait for services to be ready
            sleep 10
            ;;
            
        "rebuild")
            log_info "Performing application rebuild..."
            
            # Stop services
            stop_all_services
            
            # Rebuild images
            cd "$PLATFORM_DIR"
            docker-compose build --no-cache
            
            # Start services
            start_core_services
            start_application_services
            start_supporting_services
            ;;
            
        *)
            log_error "Unknown recovery mode: $recovery_mode"
            echo "Usage: $0 [full|restart|rebuild] [config_backup_path]"
            exit 1
            ;;
    esac
    
    # Validate service health
    local success="false"
    if validate_service_health; then
        success="true"
        log_info "Application recovery completed successfully"
    else
        log_error "Application recovery validation failed"
    fi
    
    # Generate recovery report
    local end_time=$(date +%s)
    local report_file
    report_file=$(generate_recovery_report "$start_time" "$end_time" "$success")
    
    echo
    if [[ "$success" == "true" ]]; then
        echo -e "${GREEN}✓ Application recovery completed successfully${NC}"
        echo -e "${GREEN}✓ All critical services are operational${NC}"
        echo -e "${GREEN}✓ Recovery report: $report_file${NC}"
        log_info "Application recovery process completed successfully"
        exit 0
    else
        echo -e "${RED}✗ Application recovery failed or validation failed${NC}"
        echo -e "${RED}✗ Check service logs for details${NC}"
        echo -e "${RED}✗ Recovery report: $report_file${NC}"
        log_error "Application recovery process failed"
        exit 1
    fi
}

# Handle signals
trap 'log_error "Application recovery interrupted"; exit 1' INT TERM

# Execute main function
main "$@"