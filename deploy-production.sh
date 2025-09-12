#!/bin/bash

# ==============================================
# CRYB PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# ==============================================
# Single-command deployment for immediate production launch
# Usage: ./deploy-production.sh [options]
# ==============================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/deployment-$(date +%Y%m%d-%H%M%S).log"
COMPOSE_FILE="docker-compose.production-complete.yml"
ENV_FILE=".env.production"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# ==============================================
# LOGGING FUNCTIONS
# ==============================================

log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

log_info() {
    log "${BLUE}[INFO]${NC} ${1}"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC} ${1}"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC} ${1}"
}

log_error() {
    log "${RED}[ERROR]${NC} ${1}"
}

log_step() {
    log "${PURPLE}[STEP]${NC} ${1}"
}

# ==============================================
# UTILITY FUNCTIONS
# ==============================================

show_banner() {
    log "${CYAN}"
    log "=============================================="
    log "   CRYB PLATFORM - PRODUCTION DEPLOYMENT    "
    log "=============================================="
    log "${NC}"
    log_info "Starting deployment at $(date)"
    log_info "Deployment log: $LOG_FILE"
    log ""
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning "Environment file not found: $ENV_FILE"
        log_info "Creating default environment file..."
        cp .env.example "$ENV_FILE" 2>/dev/null || true
    fi
    
    log_success "Prerequisites check completed"
}

check_system_resources() {
    log_step "Checking system resources..."
    
    # Check available memory (at least 4GB recommended)
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -lt 4 ]]; then
        log_warning "System has only ${mem_gb}GB RAM. At least 4GB is recommended for production."
    else
        log_info "Available memory: ${mem_gb}GB"
    fi
    
    # Check available disk space (at least 10GB recommended)
    local disk_gb=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $disk_gb -lt 10 ]]; then
        log_warning "Available disk space: ${disk_gb}GB. At least 10GB is recommended."
    else
        log_info "Available disk space: ${disk_gb}GB"
    fi
    
    log_success "System resources check completed"
}

setup_environment() {
    log_step "Setting up environment..."
    
    # Load environment variables
    if [[ -f "$ENV_FILE" ]]; then
        set -a  # automatically export all variables
        source "$ENV_FILE"
        set +a  # disable automatic export
        log_info "Environment variables loaded from $ENV_FILE"
    fi
    
    # Check for default passwords and warn user
    local has_defaults=false
    
    if [[ "${POSTGRES_PASSWORD:-}" == *"change_this"* ]] || [[ "${POSTGRES_PASSWORD:-}" == *"default"* ]]; then
        log_warning "PostgreSQL is using a default password. Please change it in $ENV_FILE"
        has_defaults=true
    fi
    
    if [[ "${REDIS_PASSWORD:-}" == *"change_this"* ]] || [[ "${REDIS_PASSWORD:-}" == *"default"* ]]; then
        log_warning "Redis is using a default password. Please change it in $ENV_FILE"
        has_defaults=true
    fi
    
    if [[ "${JWT_SECRET:-}" == *"change"* ]] || [[ "${JWT_SECRET:-}" == *"default"* ]]; then
        log_warning "JWT secret is using a default value. Please change it in $ENV_FILE"
        has_defaults=true
    fi
    
    if [[ "$has_defaults" == true ]]; then
        log_warning "Default credentials detected. For security, please update them in $ENV_FILE"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled. Please update your credentials and try again."
            exit 0
        fi
    fi
    
    log_success "Environment setup completed"
}

cleanup_old_deployment() {
    log_step "Cleaning up any existing deployment..."
    
    # Stop and remove old containers
    docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true
    
    # Remove unused images and volumes (optional)
    if [[ "${CLEANUP_IMAGES:-false}" == "true" ]]; then
        log_info "Cleaning up unused Docker images..."
        docker image prune -f
    fi
    
    log_success "Cleanup completed"
}

build_and_deploy() {
    log_step "Building and deploying services..."
    
    # Build and start services
    log_info "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    
    log_info "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services deployment initiated"
}

wait_for_services() {
    log_step "Waiting for services to become healthy..."
    
    local max_attempts=60
    local attempt=0
    local services=("postgres" "redis" "elasticsearch" "minio" "api" "web")
    
    for service in "${services[@]}"; do
        log_info "Waiting for $service to be healthy..."
        attempt=0
        
        while [[ $attempt -lt $max_attempts ]]; do
            if docker compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|running"; then
                log_success "$service is ready"
                break
            fi
            
            ((attempt++))
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "$service failed to become healthy within $(($max_attempts * 5)) seconds"
                log_error "Check logs: docker compose -f $COMPOSE_FILE logs $service"
                return 1
            fi
            
            sleep 5
        done
    done
    
    log_success "All services are healthy"
}

run_health_checks() {
    log_step "Running comprehensive health checks..."
    
    # Test API endpoint
    log_info "Testing API health endpoint..."
    local api_port=$(docker compose -f "$COMPOSE_FILE" port api 3001 | cut -d: -f2)
    if curl -f "http://localhost:$api_port/health" >/dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_warning "API health check failed - service may still be starting"
    fi
    
    # Test Web frontend
    log_info "Testing Web frontend..."
    local web_port=$(docker compose -f "$COMPOSE_FILE" port web 3000 | cut -d: -f2)
    if curl -f "http://localhost:$web_port" >/dev/null 2>&1; then
        log_success "Web frontend check passed"
    else
        log_warning "Web frontend check failed - service may still be starting"
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-cryb_user}" >/dev/null 2>&1; then
        log_success "Database connection check passed"
    else
        log_warning "Database connection check failed"
    fi
    
    # Test Redis connection
    log_info "Testing Redis connection..."
    if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis connection check passed"
    else
        log_warning "Redis connection check failed"
    fi
    
    log_success "Health checks completed"
}

show_deployment_info() {
    log_step "Deployment Information"
    log ""
    log_success "🎉 CRYB Platform has been successfully deployed!"
    log ""
    log_info "📊 Service Access URLs:"
    
    # Get actual ports from running containers
    local web_port=$(docker compose -f "$COMPOSE_FILE" port web 3000 2>/dev/null | cut -d: -f2 || echo "3000")
    local api_port=$(docker compose -f "$COMPOSE_FILE" port api 3001 2>/dev/null | cut -d: -f2 || echo "3001")
    local minio_port=$(docker compose -f "$COMPOSE_FILE" port minio 9001 2>/dev/null | cut -d: -f2 || echo "9001")
    
    log_info "  • Frontend (Web):     http://localhost:$web_port"
    log_info "  • Backend API:        http://localhost:$api_port"
    log_info "  • API Health:         http://localhost:$api_port/health"
    log_info "  • MinIO Console:      http://localhost:$minio_port"
    
    # Show monitoring URLs if monitoring is enabled
    if docker compose -f "$COMPOSE_FILE" ps prometheus >/dev/null 2>&1; then
        local grafana_port=$(docker compose -f "$COMPOSE_FILE" port grafana 3000 2>/dev/null | cut -d: -f2 || echo "3002")
        local prometheus_port=$(docker compose -f "$COMPOSE_FILE" port prometheus 9090 2>/dev/null | cut -d: -f2 || echo "9090")
        log_info "  • Grafana Dashboard:  http://localhost:$grafana_port"
        log_info "  • Prometheus:         http://localhost:$prometheus_port"
    fi
    
    log ""
    log_info "📋 Management Commands:"
    log_info "  • View logs:          docker compose -f $COMPOSE_FILE logs -f"
    log_info "  • Stop services:      docker compose -f $COMPOSE_FILE down"
    log_info "  • Restart services:   docker compose -f $COMPOSE_FILE restart"
    log_info "  • Update services:    docker compose -f $COMPOSE_FILE pull && docker compose -f $COMPOSE_FILE up -d"
    log ""
    
    log_info "🔧 Useful Commands:"
    log_info "  • Enter API container:   docker compose -f $COMPOSE_FILE exec api sh"
    log_info "  • Enter Web container:   docker compose -f $COMPOSE_FILE exec web sh"
    log_info "  • Database CLI:          docker compose -f $COMPOSE_FILE exec postgres psql -U ${POSTGRES_USER:-cryb_user} -d ${POSTGRES_DB:-cryb}"
    log_info "  • Redis CLI:             docker compose -f $COMPOSE_FILE exec redis redis-cli"
    log ""
    
    if [[ "${SHOW_SECURITY_NOTES:-true}" == "true" ]]; then
        log_warning "🔒 Security Notes:"
        log_warning "  • Change default passwords in $ENV_FILE"
        log_warning "  • Configure SSL certificates for production"
        log_warning "  • Set up proper firewall rules"
        log_warning "  • Regular security updates are recommended"
        log ""
    fi
    
    log_success "Deployment completed successfully at $(date)"
}

show_help() {
    cat << EOF
CRYB Platform Production Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -c, --cleanup       Clean up Docker images after deployment
    -m, --monitoring    Enable monitoring stack (Prometheus/Grafana)
    -q, --quiet         Suppress non-essential output
    --skip-health       Skip health checks (faster deployment)
    --env-file FILE     Use custom environment file (default: .env.production)

EXAMPLES:
    $0                          # Standard deployment
    $0 --cleanup --monitoring   # Full deployment with cleanup and monitoring
    $0 --env-file .env.custom   # Use custom environment file

ENVIRONMENT FILES:
    The script uses .env.production by default. Create this file with your
    production configuration. See .env.production for a template.

REQUIREMENTS:
    - Docker and Docker Compose installed
    - At least 4GB RAM (8GB+ recommended)
    - At least 10GB free disk space

For more information, visit: https://github.com/your-repo/cryb-platform
EOF
}

cleanup_on_exit() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check the logs at: $LOG_FILE"
        log_info "For troubleshooting, run: docker compose -f $COMPOSE_FILE logs"
    fi
}

# ==============================================
# MAIN EXECUTION
# ==============================================

main() {
    # Set up error handling
    trap cleanup_on_exit EXIT
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--cleanup)
                export CLEANUP_IMAGES=true
                shift
                ;;
            -m|--monitoring)
                export MONITORING_ENABLED=true
                shift
                ;;
            -q|--quiet)
                export QUIET_MODE=true
                shift
                ;;
            --skip-health)
                export SKIP_HEALTH_CHECKS=true
                shift
                ;;
            --env-file)
                ENV_FILE="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Start deployment
    show_banner
    check_prerequisites
    check_system_resources
    setup_environment
    cleanup_old_deployment
    build_and_deploy
    wait_for_services
    
    if [[ "${SKIP_HEALTH_CHECKS:-false}" != "true" ]]; then
        run_health_checks
    fi
    
    show_deployment_info
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi