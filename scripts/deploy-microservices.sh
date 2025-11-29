#!/bin/bash

# =============================================================================
# CRYB Platform Microservices Deployment Script
# =============================================================================
#
# This script deploys the complete CRYB microservices architecture including:
# - Infrastructure services (PostgreSQL, Redis, Elasticsearch, etc.)
# - API Gateway with service discovery and load balancing
# - All microservices (User, Community, Content, Notification, Media, Search, Analytics)
# - Monitoring stack (Prometheus, Grafana)
# - Reverse proxy with Nginx
#
# Usage: ./scripts/deploy-microservices.sh [environment]
# Environment: development (default), staging, production
#
# =============================================================================

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.microservices.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker and Docker Compose are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Check if .env file exists
check_env_file() {
    log_info "Checking environment configuration..."
    
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log_warning ".env file not found. Creating template..."
        cat > "$PROJECT_ROOT/.env" << EOF
# Database
POSTGRES_PASSWORD=cryb_secure_postgres_password_$(openssl rand -hex 16)

# Redis
REDIS_PASSWORD=cryb_secure_redis_password_$(openssl rand -hex 16)

# JWT
JWT_SECRET=$(openssl rand -hex 32)

# OAuth (fill these with your actual values)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Email (configure for your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@cryb.ai

# MinIO
MINIO_ROOT_USER=cryb_minio_admin
MINIO_ROOT_PASSWORD=cryb_secure_minio_password_$(openssl rand -hex 16)

# RabbitMQ
RABBITMQ_USER=cryb_rabbit_admin
RABBITMQ_PASSWORD=cryb_secure_rabbitmq_password_$(openssl rand -hex 16)

# Push Notifications (generate these at https://web-push-codelab.glitch.me/)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@cryb.ai

# Monitoring
GRAFANA_USER=admin
GRAFANA_PASSWORD=cryb_secure_grafana_password_$(openssl rand -hex 16)
SENTRY_DSN=your_sentry_dsn_optional

# Analytics (optional)
GOOGLE_ANALYTICS_ID=your_ga_id
MIXPANEL_TOKEN=your_mixpanel_token

# CDN (optional)
CDN_BASE_URL=https://cdn.cryb.ai

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:3100,https://cryb.ai

# Environment
NODE_ENV=$ENVIRONMENT
EOF
        log_warning "Please edit .env file with your actual configuration values"
        log_info "Generated .env file at: $PROJECT_ROOT/.env"
    else
        log_success "Environment file found"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    
    directories=(
        "logs"
        "data/postgres"
        "data/redis"
        "data/elasticsearch"
        "data/minio"
        "data/rabbitmq"
        "data/prometheus"
        "data/grafana"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
    done
    
    log_success "Directories created"
}

# Build service images
build_services() {
    log_info "Building service images..."
    
    cd "$PROJECT_ROOT"
    
    # Build in dependency order
    services=(
        "api-gateway"
        "user-service"
        "community-service"
        "content-service" 
        "notification-service"
        "media-service"
        "search-service"
        "analytics-service"
    )
    
    for service in "${services[@]}"; do
        if [[ -d "apps/services/$service" ]]; then
            log_info "Building $service..."
            docker-compose -f "$COMPOSE_FILE" build "$service" || {
                log_error "Failed to build $service"
                exit 1
            }
        else
            log_warning "Service directory not found: apps/services/$service"
        fi
    done
    
    log_success "All services built successfully"
}

# Start infrastructure services first
start_infrastructure() {
    log_info "Starting infrastructure services..."
    
    cd "$PROJECT_ROOT"
    
    # Start core infrastructure
    infrastructure_services=(
        "postgres"
        "redis"
        "elasticsearch"
        "minio"
        "rabbitmq"
    )
    
    for service in "${infrastructure_services[@]}"; do
        log_info "Starting $service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$service"
    done
    
    # Wait for services to be healthy
    log_info "Waiting for infrastructure services to be ready..."
    sleep 30
    
    # Check health
    for service in "${infrastructure_services[@]}"; do
        log_info "Checking health of $service..."
        for i in {1..30}; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service is ready"
                break
            fi
            if [[ $i -eq 30 ]]; then
                log_error "$service failed to start properly"
                docker-compose -f "$COMPOSE_FILE" logs "$service"
                exit 1
            fi
            sleep 5
        done
    done
    
    log_success "Infrastructure services started successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for PostgreSQL to be fully ready
    log_info "Waiting for PostgreSQL to be ready for migrations..."
    
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U cryb_user -d cryb_platform; then
            log_success "PostgreSQL is ready"
            break
        fi
        if [[ $i -eq 30 ]]; then
            log_error "PostgreSQL not ready for migrations"
            exit 1
        fi
        sleep 2
    done
    
    # Run Prisma migrations
    log_info "Running Prisma migrations..."
    cd packages/database
    
    # Generate Prisma client
    npx prisma generate || {
        log_error "Failed to generate Prisma client"
        exit 1
    }
    
    # Apply migrations
    npx prisma db push || {
        log_error "Failed to apply database schema"
        exit 1
    }
    
    cd "$PROJECT_ROOT"
    log_success "Database migrations completed"
}

# Start application services
start_services() {
    log_info "Starting application services..."
    
    cd "$PROJECT_ROOT"
    
    # Start services in dependency order
    app_services=(
        "user-service"
        "community-service"
        "content-service"
        "notification-service"
        "media-service"
        "search-service"
        "analytics-service"
        "api-gateway"
    )
    
    for service in "${app_services[@]}"; do
        log_info "Starting $service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$service"
        sleep 10 # Give each service time to start
    done
    
    # Wait for services to be healthy
    log_info "Waiting for application services to be ready..."
    sleep 30
    
    # Check health
    for service in "${app_services[@]}"; do
        log_info "Checking health of $service..."
        for i in {1..20}; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service is ready"
                break
            fi
            if [[ $i -eq 20 ]]; then
                log_warning "$service may not be fully ready, continuing..."
                break
            fi
            sleep 5
        done
    done
    
    log_success "Application services started"
}

# Start monitoring and proxy
start_monitoring() {
    log_info "Starting monitoring and proxy services..."
    
    cd "$PROJECT_ROOT"
    
    # Start monitoring services
    monitoring_services=(
        "prometheus"
        "grafana"
        "nginx"
    )
    
    for service in "${monitoring_services[@]}"; do
        log_info "Starting $service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$service"
    done
    
    log_success "Monitoring and proxy services started"
}

# Health check all services
health_check() {
    log_info "Performing comprehensive health check..."
    
    cd "$PROJECT_ROOT"
    
    # Check API Gateway
    log_info "Checking API Gateway health..."
    for i in {1..10}; do
        if curl -f -s http://localhost:3000/health > /dev/null; then
            log_success "API Gateway is healthy"
            break
        fi
        if [[ $i -eq 10 ]]; then
            log_error "API Gateway health check failed"
            docker-compose -f "$COMPOSE_FILE" logs api-gateway
        fi
        sleep 5
    done
    
    # Check through Nginx
    log_info "Checking Nginx proxy health..."
    for i in {1..10}; do
        if curl -f -s http://localhost:80/health > /dev/null; then
            log_success "Nginx proxy is healthy"
            break
        fi
        if [[ $i -eq 10 ]]; then
            log_error "Nginx proxy health check failed"
            docker-compose -f "$COMPOSE_FILE" logs nginx
        fi
        sleep 5
    done
}

# Show service status
show_status() {
    log_info "Service Status:"
    echo ""
    
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Available endpoints:"
    echo "  🌐 API Gateway:          http://localhost:3000"
    echo "  🔗 Main Application:     http://localhost:80"
    echo "  📊 API Documentation:   http://localhost:80/docs"
    echo "  🏥 Health Check:        http://localhost:80/health"
    echo ""
    log_info "Monitoring & Admin:"
    echo "  📈 Grafana:             http://localhost:3300"
    echo "  🔍 Prometheus:          http://localhost:9090"
    echo "  🗄️  MinIO Console:       http://localhost:9001"
    echo "  🐰 RabbitMQ:            http://localhost:15672"
    echo ""
    log_info "Service Ports:"
    echo "  👤 User Service:        http://localhost:3001"
    echo "  🏘️  Community Service:   http://localhost:3002"
    echo "  📝 Content Service:     http://localhost:3003"
    echo "  🔔 Notification Service: http://localhost:3004"
    echo "  📁 Media Service:       http://localhost:3005"
    echo "  🔍 Search Service:      http://localhost:3006"
    echo "  📊 Analytics Service:   http://localhost:3007"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "CRYB Platform Microservices Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Project Root: $PROJECT_ROOT"
    echo ""
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    check_dependencies
    check_env_file
    create_directories
    build_services
    start_infrastructure
    run_migrations
    start_services
    start_monitoring
    health_check
    show_status
    
    log_success "CRYB Platform microservices deployed successfully!"
    log_info "Check the logs with: docker-compose -f $COMPOSE_FILE logs -f [service-name]"
    
    # Don't cleanup on successful deployment
    trap - EXIT
}

# Handle script arguments
case "${1:-}" in
    "down")
        log_info "Stopping all services..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" down
        log_success "All services stopped"
        exit 0
        ;;
    "logs")
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        exit 0
        ;;
    "restart")
        log_info "Restarting services..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" restart "${2:-}"
        log_success "Services restarted"
        exit 0
        ;;
    "status")
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" ps
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "CRYB Platform Microservices Deployment Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  deploy [env]     Deploy the platform (default: development)"
        echo "  down             Stop all services"
        echo "  logs [service]   Show logs for all or specific service"
        echo "  restart [service] Restart all or specific service"
        echo "  status           Show service status"
        echo "  help             Show this help message"
        echo ""
        echo "Environments: development, staging, production"
        exit 0
        ;;
    *)
        main
        ;;
esac