#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# ==============================================
# Comprehensive production deployment with safety checks
# Features:
# - Zero-downtime deployment
# - Health checks and rollback
# - Database migrations
# - Asset optimization
# - Monitoring integration
# ==============================================

set -euo pipefail

# Configuration
DEPLOYMENT_DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/deploy-production.log"
BACKUP_DIR="/backups/deployments"
MAX_ROLLBACK_VERSIONS=5

# Environment Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
IMAGE_TAG=${IMAGE_TAG:-latest}
BUILD_NUMBER=${BUILD_NUMBER:-manual}

# Health Check Configuration
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds
HEALTH_CHECK_RETRIES=30

# Notification Configuration
WEBHOOK_URL=${DEPLOYMENT_WEBHOOK_URL:-}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-}
DISCORD_WEBHOOK=${DISCORD_WEBHOOK:-}

# ==============================================
# LOGGING FUNCTIONS
# ==============================================
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# ==============================================
# NOTIFICATION FUNCTIONS
# ==============================================
send_notification() {
    local status="$1"
    local message="$2"
    local deployment_info="${3:-}"
    
    local emoji=""
    case "$status" in
        "STARTED") emoji="🚀" ;;
        "SUCCESS") emoji="✅" ;;
        "FAILED") emoji="❌" ;;
        "ROLLBACK") emoji="🔄" ;;
        "WARNING") emoji="⚠️" ;;
        *) emoji="ℹ️" ;;
    esac
    
    local full_message="${emoji} **Deployment ${status}**\n${message}"
    if [[ -n "$deployment_info" ]]; then
        full_message="${full_message}\n\n${deployment_info}"
    fi
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"$full_message\"}" \
            2>/dev/null || log_warning "Failed to send Slack notification"
    fi
    
    # Discord notification
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        curl -X POST "$DISCORD_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{\"content\":\"$full_message\"}" \
            2>/dev/null || log_warning "Failed to send Discord notification"
    fi
    
    # Generic webhook
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{
                \"status\":\"$status\",
                \"message\":\"$message\",
                \"deployment_info\":\"$deployment_info\",
                \"timestamp\":\"$(date -Iseconds)\",
                \"environment\":\"$ENVIRONMENT\",
                \"build_number\":\"$BUILD_NUMBER\"
            }" \
            2>/dev/null || log_warning "Failed to send webhook notification"
    fi
}

# ==============================================
# UTILITY FUNCTIONS
# ==============================================
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    local required_commands=("docker" "docker-compose" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            return 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        return 1
    fi
    
    # Check available disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=2000000  # 2GB in KB
    if [[ "$available_space" -lt "$required_space" ]]; then
        log_error "Insufficient disk space. Required: 2GB, Available: $((available_space / 1024))MB"
        return 1
    fi
    
    # Check memory
    local available_memory=$(free | awk '/^Mem:/ {print $7}')
    local required_memory=1048576  # 1GB in KB
    if [[ "$available_memory" -lt "$required_memory" ]]; then
        log_warning "Low memory detected. Available: $((available_memory / 1024))MB"
    fi
    
    log_info "Prerequisites check completed"
    return 0
}

# ==============================================
# BACKUP FUNCTIONS
# ==============================================
create_deployment_backup() {
    log_info "Creating deployment backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="${BACKUP_DIR}/deployment_${DEPLOYMENT_DATE}.tar.gz"
    
    # Backup current configuration and data
    tar -czf "$backup_file" \
        -C /home/ubuntu/cryb-platform \
        docker-compose*.yml \
        config/ \
        .env* \
        2>/dev/null || true
    
    if [[ -f "$backup_file" ]]; then
        log_info "Deployment backup created: $(basename "$backup_file")"
        echo "$backup_file"
    else
        log_error "Failed to create deployment backup"
        return 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old deployment backups..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Keep only the latest N backups
        ls -t "${BACKUP_DIR}/deployment_"*.tar.gz 2>/dev/null | tail -n +$((MAX_ROLLBACK_VERSIONS + 1)) | xargs -r rm -f
        log_info "Old deployment backups cleaned up"
    fi
}

# ==============================================
# DATABASE FUNCTIONS
# ==============================================
run_database_migrations() {
    log_info "Running database migrations..."
    
    # Check if database is accessible
    if ! docker exec cryb-postgres-production pg_isready -U cryb_user -d cryb; then
        log_error "Database is not accessible"
        return 1
    fi
    
    # Run migrations via API container
    if docker run --rm \
        --network cryb-platform_cryb-network \
        -e DATABASE_URL="postgresql://cryb_user:cryb_password@postgres:5432/cryb" \
        "${IMAGE_REGISTRY}/cryb-api:${IMAGE_TAG}" \
        pnpm exec prisma migrate deploy; then
        log_info "Database migrations completed successfully"
        return 0
    else
        log_error "Database migrations failed"
        return 1
    fi
}

# ==============================================
# HEALTH CHECK FUNCTIONS
# ==============================================
wait_for_service() {
    local service_name="$1"
    local health_url="$2"
    local timeout="${3:-$HEALTH_CHECK_TIMEOUT}"
    
    log_info "Waiting for $service_name to be healthy..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        log_info "Waiting for $service_name... ($(($(date +%s) - start_time))s elapsed)"
        sleep "$HEALTH_CHECK_INTERVAL"
    done
    
    log_error "$service_name failed to become healthy within ${timeout}s"
    return 1
}

check_all_services() {
    log_info "Performing comprehensive health checks..."
    
    local services=(
        "API:http://localhost:3001/health"
        "Web:http://localhost:3000/api/health"
        "Prometheus:http://localhost:9090/-/healthy"
        "Grafana:http://localhost:3002/api/health"
    )
    
    local failed_services=()
    
    for service_info in "${services[@]}"; do
        local service_name="${service_info%:*}"
        local health_url="${service_info#*:}"
        
        if ! wait_for_service "$service_name" "$health_url" 60; then
            failed_services+=("$service_name")
        fi
    done
    
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Health check failed for services: ${failed_services[*]}"
        return 1
    else
        log_success "All services are healthy"
        return 0
    fi
}

# ==============================================
# DEPLOYMENT FUNCTIONS
# ==============================================
pull_latest_images() {
    log_info "Pulling latest container images..."
    
    local images=(
        "timescale/timescaledb:latest-pg15"
        "redis:7-alpine"
        "docker.elastic.co/elasticsearch/elasticsearch:8.11.0"
        "minio/minio:latest"
        "nginx:alpine"
        "prom/prometheus:latest"
        "grafana/grafana:latest"
    )
    
    for image in "${images[@]}"; do
        if docker pull "$image"; then
            log_info "Pulled image: $image"
        else
            log_warning "Failed to pull image: $image"
        fi
    done
}

deploy_infrastructure() {
    log_info "Deploying infrastructure services..."
    
    # Deploy with the production complete configuration
    if docker-compose -f docker-compose.production-complete.yml up -d \
        postgres \
        pgbouncer \
        redis \
        elasticsearch \
        minio \
        rabbitmq; then
        
        log_info "Infrastructure services deployed"
        
        # Wait for critical services
        wait_for_service "PostgreSQL" "http://localhost:5432" 60 || return 1
        wait_for_service "Redis" "http://localhost:6379" 30 || return 1
        wait_for_service "Elasticsearch" "http://localhost:9200/_cluster/health" 120 || return 1
        
        return 0
    else
        log_error "Failed to deploy infrastructure services"
        return 1
    fi
}

deploy_applications() {
    log_info "Deploying application services..."
    
    # Deploy applications with health checks
    if docker-compose -f docker-compose.production-complete.yml up -d \
        api-1 \
        api-2 \
        web-1 \
        web-2 \
        workers; then
        
        log_info "Application services deployed"
        return 0
    else
        log_error "Failed to deploy application services"
        return 1
    fi
}

deploy_monitoring() {
    log_info "Deploying monitoring services..."
    
    # Deploy monitoring stack
    if docker-compose -f docker-compose.monitoring.yml up -d; then
        log_info "Monitoring services deployed"
        return 0
    else
        log_error "Failed to deploy monitoring services"
        return 1
    fi
}

deploy_proxy() {
    log_info "Deploying reverse proxy..."
    
    # Deploy nginx last to ensure all upstream services are ready
    if docker-compose -f docker-compose.production-complete.yml up -d nginx; then
        log_info "Reverse proxy deployed"
        return 0
    else
        log_error "Failed to deploy reverse proxy"
        return 1
    fi
}

# ==============================================
# ROLLBACK FUNCTIONS
# ==============================================
rollback_deployment() {
    local backup_file="$1"
    
    log_error "Initiating deployment rollback..."
    send_notification "ROLLBACK" "Starting deployment rollback due to failures"
    
    # Stop current deployment
    docker-compose -f docker-compose.production-complete.yml down || true
    
    # Restore configuration from backup
    if [[ -f "$backup_file" ]]; then
        tar -xzf "$backup_file" -C /home/ubuntu/cryb-platform/ || true
    fi
    
    # Start previous version
    docker-compose -f docker-compose.yml up -d || {
        log_error "Rollback failed - manual intervention required"
        send_notification "FAILED" "Deployment rollback failed - manual intervention required"
        exit 1
    }
    
    # Wait for services to be healthy
    sleep 30
    
    if check_all_services; then
        log_success "Deployment rollback completed successfully"
        send_notification "SUCCESS" "Deployment rollback completed successfully"
    else
        log_error "Rollback health checks failed - manual intervention required"
        send_notification "FAILED" "Rollback health checks failed"
        exit 1
    fi
}

# ==============================================
# PERFORMANCE OPTIMIZATION
# ==============================================
optimize_system() {
    log_info "Optimizing system performance..."
    
    # Docker system cleanup
    docker system prune -f --volumes || true
    
    # Clear system caches
    sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    
    # Optimize container resources
    docker-compose -f docker-compose.production-complete.yml \
        exec -T postgres \
        psql -U cryb_user -d cryb -c "VACUUM ANALYZE;" || true
    
    log_info "System optimization completed"
}

# ==============================================
# SMOKE TESTS
# ==============================================
run_smoke_tests() {
    log_info "Running deployment smoke tests..."
    
    local tests=(
        "API Health:curl -f http://localhost:3001/health"
        "Web Health:curl -f http://localhost:3000/api/health"
        "Database Connection:docker exec cryb-postgres-production pg_isready -U cryb_user"
        "Redis Connection:docker exec cryb-redis-production redis-cli ping"
        "Elasticsearch:curl -f http://localhost:9200/_cluster/health"
    )
    
    local failed_tests=()
    
    for test_info in "${tests[@]}"; do
        local test_name="${test_info%:*}"
        local test_command="${test_info#*:}"
        
        log_info "Running test: $test_name"
        
        if eval "$test_command" > /dev/null 2>&1; then
            log_success "Test passed: $test_name"
        else
            log_error "Test failed: $test_name"
            failed_tests+=("$test_name")
        fi
    done
    
    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        log_success "All smoke tests passed"
        return 0
    else
        log_error "Smoke tests failed: ${failed_tests[*]}"
        return 1
    fi
}

# ==============================================
# MAIN DEPLOYMENT PROCESS
# ==============================================
main() {
    local start_time=$(date +%s)
    
    log_info "=========================================="
    log_info "Starting CRYB Platform Production Deployment"
    log_info "Deployment ID: $DEPLOYMENT_DATE"
    log_info "Environment: $ENVIRONMENT"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Build Number: $BUILD_NUMBER"
    log_info "=========================================="
    
    # Send deployment started notification
    send_notification "STARTED" "Production deployment initiated" \
        "Environment: $ENVIRONMENT\nImage Tag: $IMAGE_TAG\nBuild: $BUILD_NUMBER"
    
    # Create backup for rollback
    local backup_file
    if ! backup_file=$(create_deployment_backup); then
        log_error "Failed to create deployment backup"
        send_notification "FAILED" "Deployment failed - could not create backup"
        exit 1
    fi
    
    # Trap for automatic rollback on failure
    trap "rollback_deployment '$backup_file'" ERR
    
    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed"
        send_notification "FAILED" "Deployment failed - prerequisites check failed"
        exit 1
    fi
    
    # Pull latest images
    pull_latest_images
    
    # Deploy in stages with health checks
    log_info "Starting staged deployment..."
    
    # Stage 1: Infrastructure
    if ! deploy_infrastructure; then
        log_error "Infrastructure deployment failed"
        exit 1
    fi
    
    # Stage 2: Database migrations
    if ! run_database_migrations; then
        log_error "Database migrations failed"
        exit 1
    fi
    
    # Stage 3: Applications
    if ! deploy_applications; then
        log_error "Application deployment failed"
        exit 1
    fi
    
    # Stage 4: Monitoring
    if ! deploy_monitoring; then
        log_error "Monitoring deployment failed"
        exit 1
    fi
    
    # Stage 5: Proxy
    if ! deploy_proxy; then
        log_error "Proxy deployment failed"
        exit 1
    fi
    
    # Wait for all services to be healthy
    if ! check_all_services; then
        log_error "Health checks failed after deployment"
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests; then
        log_error "Smoke tests failed"
        exit 1
    fi
    
    # Optimize system performance
    optimize_system
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local deployment_time=$((end_time - start_time))
    
    # Remove error trap (deployment successful)
    trap - ERR
    
    log_success "=========================================="
    log_success "Production deployment completed successfully!"
    log_success "Deployment time: ${deployment_time}s"
    log_success "All services are healthy and operational"
    log_success "=========================================="
    
    # Send success notification
    send_notification "SUCCESS" "Production deployment completed successfully" \
        "Deployment time: ${deployment_time}s\nAll services operational"
}

# ==============================================
# SCRIPT EXECUTION
# ==============================================
# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Check if running as appropriate user
if [[ $EUID -eq 0 ]]; then
    log_warning "Running as root - consider using a dedicated deployment user"
fi

# Validate environment
if [[ -z "${IMAGE_TAG:-}" ]]; then
    log_warning "IMAGE_TAG not set, using 'latest'"
    IMAGE_TAG="latest"
fi

# Execute main deployment
main "$@"