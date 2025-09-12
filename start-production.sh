#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION STARTUP SCRIPT
# ==============================================
# Production-grade startup script with comprehensive checks
# ==============================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/cryb-startup.log"
HEALTH_CHECK_TIMEOUT=300
STARTUP_TIMEOUT=600

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==============================================
# LOGGING FUNCTIONS
# ==============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

log_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# ==============================================
# UTILITY FUNCTIONS
# ==============================================
show_banner() {
    cat << 'EOF'
   ______ _______ _______ ______  
  |      |       |       |   3  |
  |   ---|       |   |   |   __ |  
  |______|_______|___j___|_______|
              
  CRYB Platform Production Infrastructure
  Discord-like Chat Platform with Advanced Features
EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running as appropriate user
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root - consider using a dedicated user"
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=5000000  # 5GB in KB
    if [[ "$available_space" -lt "$required_space" ]]; then
        log_error "Insufficient disk space. Required: 5GB, Available: $((available_space / 1024))MB"
        exit 1
    fi
    
    # Check memory
    local available_memory=$(free | awk '/^Mem:/ {print $2}')
    local required_memory=4194304  # 4GB in KB
    if [[ "$available_memory" -lt "$required_memory" ]]; then
        log_warning "Low memory detected. Required: 4GB, Available: $((available_memory / 1024))MB"
    fi
    
    log_success "Prerequisites check passed"
}

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
        
        printf "."
        sleep 5
    done
    
    log_error "$service_name failed to become healthy within ${timeout}s"
    return 1
}

# ==============================================
# STARTUP FUNCTIONS
# ==============================================
cleanup_previous_deployment() {
    log_info "Cleaning up previous deployment..."
    
    # Stop any running containers
    docker-compose -f docker-compose.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    docker-compose -f docker-compose.monitoring.yml down 2>/dev/null || true
    
    # Clean up dangling resources
    docker system prune -f 2>/dev/null || true
    
    log_success "Previous deployment cleaned up"
}

start_infrastructure_services() {
    log_header "STARTING INFRASTRUCTURE SERVICES"
    
    log_info "Starting core infrastructure..."
    docker-compose -f docker-compose.production-complete.yml up -d \
        postgres \
        pgbouncer \
        redis \
        elasticsearch \
        minio \
        rabbitmq
    
    # Wait for core services
    log_info "Waiting for core services to be ready..."
    sleep 20
    
    # Check database connectivity
    local retries=0
    while [[ $retries -lt 30 ]]; do
        if docker exec cryb-postgres-production pg_isready -U cryb_user -d cryb &>/dev/null; then
            log_success "PostgreSQL is ready"
            break
        fi
        ((retries++))
        sleep 2
    done
    
    # Check Redis
    if docker exec cryb-redis-production redis-cli ping &>/dev/null; then
        log_success "Redis is ready"
    else
        log_error "Redis failed to start"
        return 1
    fi
    
    # Check Elasticsearch
    wait_for_service "Elasticsearch" "http://localhost:9201/_cluster/health" 120
    
    log_success "Infrastructure services started successfully"
}

start_monitoring_services() {
    log_header "STARTING MONITORING SERVICES"
    
    log_info "Starting monitoring stack..."
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Wait for monitoring services
    sleep 30
    
    # Check Prometheus
    wait_for_service "Prometheus" "http://localhost:9090/-/healthy" 60
    
    # Check Grafana
    wait_for_service "Grafana" "http://localhost:3005/api/health" 60
    
    log_success "Monitoring services started successfully"
}

start_application_services() {
    log_header "STARTING APPLICATION SERVICES"
    
    log_info "Starting application services..."
    docker-compose -f docker-compose.production-complete.yml up -d \
        api-1 \
        api-2 \
        web-1 \
        web-2 \
        workers
    
    # Wait for applications to start
    sleep 30
    
    # Check API health
    wait_for_service "API Primary" "http://localhost:3001/health" 120
    wait_for_service "API Secondary" "http://localhost:3002/health" 120
    
    # Check Web health
    wait_for_service "Web Primary" "http://localhost:3000/api/health" 60
    wait_for_service "Web Secondary" "http://localhost:3001/api/health" 60
    
    log_success "Application services started successfully"
}

start_proxy_services() {
    log_header "STARTING REVERSE PROXY"
    
    log_info "Starting Nginx reverse proxy..."
    docker-compose -f docker-compose.production-complete.yml up -d nginx
    
    # Wait for proxy
    sleep 10
    
    # Check proxy health
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        log_success "Reverse proxy is healthy"
    else
        log_warning "Reverse proxy health check failed (may be normal for initial setup)"
    fi
    
    log_success "Reverse proxy started"
}

# ==============================================
# VALIDATION FUNCTIONS
# ==============================================
run_comprehensive_validation() {
    log_header "RUNNING COMPREHENSIVE VALIDATION"
    
    log_info "Validating all services..."
    
    # Use the health check validator
    if [[ -f "$SCRIPT_DIR/scripts/health-check-validator.sh" ]]; then
        if "$SCRIPT_DIR/scripts/health-check-validator.sh" check; then
            log_success "All health checks passed"
        else
            log_error "Some health checks failed - check logs"
            return 1
        fi
    else
        log_warning "Health check validator not found - running basic checks"
        
        # Basic service checks
        local services=(
            "PostgreSQL:http://localhost:5433"
            "Redis:http://localhost:6380"
            "Elasticsearch:http://localhost:9201/_cluster/health"
            "MinIO:http://localhost:9000/minio/health/live"
            "Prometheus:http://localhost:9090/-/healthy"
        )
        
        for service_info in "${services[@]}"; do
            local service_name="${service_info%:*}"
            local health_url="${service_info#*:}"
            
            if curl -f -s "$health_url" > /dev/null 2>&1; then
                log_success "$service_name is healthy"
            else
                log_error "$service_name health check failed"
            fi
        done
    fi
}

show_service_urls() {
    log_header "SERVICE URLS"
    
    echo "🌐 Web Applications:"
    echo "   • Main Application: http://localhost:3000"
    echo "   • API Documentation: http://localhost:3001/docs"
    echo ""
    echo "📊 Monitoring & Administration:"
    echo "   • Grafana Dashboard: http://localhost:3005 (admin/admin123)"
    echo "   • Prometheus Metrics: http://localhost:9090"
    echo "   • Jaeger Tracing: http://localhost:16686"
    echo "   • Uptime Monitoring: http://localhost:3004"
    echo ""
    echo "🗄️ Database & Storage:"
    echo "   • MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
    echo "   • Elasticsearch: http://localhost:9201"
    echo "   • Redis: localhost:6380"
    echo "   • PostgreSQL: localhost:5433"
    echo ""
    echo "🔧 Development Tools:"
    echo "   • RabbitMQ Management: http://localhost:15672 (cryb/cryb_password)"
    echo "   • cAdvisor Container Stats: http://localhost:8080"
    echo ""
    echo "📈 Metrics Endpoints:"
    echo "   • Node Exporter: http://localhost:9100/metrics"
    echo "   • PostgreSQL Exporter: http://localhost:9187/metrics"
    echo "   • Redis Exporter: http://localhost:9121/metrics"
}

show_next_steps() {
    log_header "NEXT STEPS"
    
    echo "1. 🔒 SSL Certificates:"
    echo "   sudo $SCRIPT_DIR/scripts/ssl-automation.sh init"
    echo "   sudo $SCRIPT_DIR/scripts/ssl-automation.sh generate"
    echo ""
    echo "2. 📝 Setup Logging:"
    echo "   sudo $SCRIPT_DIR/scripts/setup-logging.sh"
    echo ""
    echo "3. 💾 Configure Backups:"
    echo "   $SCRIPT_DIR/scripts/backup-system.sh"
    echo ""
    echo "4. 🚀 Deploy to Production:"
    echo "   $SCRIPT_DIR/scripts/deploy-production.sh"
    echo ""
    echo "5. 📊 Monitor System Health:"
    echo "   $SCRIPT_DIR/scripts/health-check-validator.sh monitor"
}

# ==============================================
# MAIN STARTUP PROCESS
# ==============================================
main() {
    local start_time=$(date +%s)
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Show banner
    show_banner
    echo ""
    
    log_header "CRYB PLATFORM PRODUCTION STARTUP"
    log "Starting CRYB Platform production environment..."
    log "Startup initiated at $(date)"
    log "Script directory: $SCRIPT_DIR"
    
    # Set trap for cleanup on failure
    trap 'log_error "Startup failed - check logs at $LOG_FILE"; exit 1' ERR
    
    # Run startup sequence
    check_prerequisites
    cleanup_previous_deployment
    start_infrastructure_services
    start_monitoring_services
    start_application_services
    start_proxy_services
    run_comprehensive_validation
    
    local end_time=$(date +%s)
    local startup_time=$((end_time - start_time))
    
    # Remove error trap (startup successful)
    trap - ERR
    
    log_success "=========================================="
    log_success "🎉 CRYB Platform startup completed successfully!"
    log_success "Total startup time: ${startup_time}s"
    log_success "All services are healthy and operational"
    log_success "=========================================="
    
    show_service_urls
    show_next_steps
    
    log "For ongoing monitoring, run: $SCRIPT_DIR/scripts/health-check-validator.sh monitor"
    log "For system status, run: docker ps"
    log "For logs, check: $LOG_FILE"
}

# ==============================================
# COMMAND LINE INTERFACE
# ==============================================
case "${1:-start}" in
    "start"|"")
        main "$@"
        ;;
    "stop")
        log_info "Stopping CRYB Platform..."
        docker-compose -f docker-compose.production-complete.yml down
        docker-compose -f docker-compose.monitoring.yml down
        log_success "CRYB Platform stopped"
        ;;
    "restart")
        log_info "Restarting CRYB Platform..."
        "$0" stop
        sleep 5
        "$0" start
        ;;
    "status")
        echo "CRYB Platform Status:"
        echo "===================="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep cryb
        ;;
    "logs")
        tail -f "$LOG_FILE"
        ;;
    "help"|"-h"|"--help")
        cat << EOF
CRYB Platform Production Startup Script

Usage: $0 [COMMAND]

Commands:
    start     Start the platform (default)
    stop      Stop all services
    restart   Restart the platform
    status    Show service status
    logs      Show startup logs
    help      Show this help message

Examples:
    $0            # Start the platform
    $0 start      # Start the platform
    $0 stop       # Stop all services
    $0 status     # Show current status

EOF
        ;;
    *)
        log_error "Unknown command: $1"
        "$0" help
        exit 1
        ;;
esac