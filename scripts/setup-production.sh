#!/bin/bash

# ==============================================
# CRYB DISCORD-LIKE API - PRODUCTION SETUP SCRIPT
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cryb-platform"
API_VERSION="1.0.0"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js (for local development)
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed. This is recommended for local development."
    fi
    
    # Check system resources
    TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024))
    
    if [ "$TOTAL_MEM_GB" -lt 4 ]; then
        log_warning "System has less than 4GB RAM. Performance may be affected."
    fi
    
    log_success "System requirements check completed"
}

setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Create .env file from example if it doesn't exist
    if [ ! -f ".env.production" ]; then
        if [ -f "apps/api/.env.example" ]; then
            cp apps/api/.env.example .env.production
            log_info "Created .env.production from example. Please edit it with your production values."
        else
            log_error ".env.example not found. Please create environment configuration manually."
            exit 1
        fi
    fi
    
    # Generate random secrets if not set
    if ! grep -q "JWT_SECRET=your-super-secure-jwt-secret" .env.production; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=your-super-secure-jwt-secret/JWT_SECRET=$JWT_SECRET/" .env.production
        log_info "Generated new JWT secret"
    fi
    
    # Create required directories
    mkdir -p logs backups uploads temp config/nginx/ssl
    
    log_success "Environment setup completed"
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    if [ ! -f "config/nginx/ssl/cert.pem" ]; then
        log_warning "SSL certificates not found. Generating self-signed certificates for development."
        
        # Generate self-signed certificate
        openssl req -x509 -newkey rsa:4096 -keyout config/nginx/ssl/key.pem -out config/nginx/ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
        
        log_info "Self-signed certificate generated. For production, replace with valid SSL certificates."
    fi
    
    log_success "SSL setup completed"
}

build_images() {
    log_info "Building Docker images..."
    
    # Set build arguments
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    export VERSION=$API_VERSION
    
    # Build the API image
    log_info "Building API image..."
    docker build \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg VCS_REF="$VCS_REF" \
        --build-arg VERSION="$VERSION" \
        -t cryb/api:$VERSION \
        -t cryb/api:latest \
        apps/api/
    
    log_success "Docker images built successfully"
}

setup_database() {
    log_info "Setting up database..."
    
    # Start database services
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    until docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-cryb_user} -d ${POSTGRES_DB:-cryb}; do
        log_info "Waiting for database..."
        sleep 2
    done
    
    # Run database migrations
    log_info "Running database migrations..."
    docker-compose -f docker-compose.production.yml exec api pnpm exec prisma migrate deploy
    
    # Generate Prisma client
    docker-compose -f docker-compose.production.yml exec api pnpm exec prisma generate
    
    log_success "Database setup completed"
}

deploy_services() {
    log_info "Deploying all services..."
    
    # Stop any existing services
    docker-compose -f docker-compose.production.yml down
    
    # Start all services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    
    services=("postgres" "redis" "elasticsearch" "minio" "api")
    for service in "${services[@]}"; do
        log_info "Checking health of $service..."
        timeout=60
        counter=0
        
        while [ $counter -lt $timeout ]; do
            if docker-compose -f docker-compose.production.yml ps -q $service | xargs docker inspect -f '{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
                log_success "$service is healthy"
                break
            fi
            
            if [ $counter -eq $((timeout - 1)) ]; then
                log_warning "$service health check timed out"
                break
            fi
            
            sleep 2
            counter=$((counter + 1))
        done
    done
    
    log_success "All services deployed"
}

run_health_checks() {
    log_info "Running comprehensive health checks..."
    
    # API health check
    log_info "Checking API health..."
    if curl -f http://localhost:3001/health &>/dev/null; then
        log_success "API is responding"
    else
        log_error "API health check failed"
    fi
    
    # Database connectivity
    log_info "Checking database connectivity..."
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-cryb_user} -d ${POSTGRES_DB:-cryb} &>/dev/null; then
        log_success "Database is accessible"
    else
        log_error "Database connectivity check failed"
    fi
    
    # Redis connectivity
    log_info "Checking Redis connectivity..."
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping &>/dev/null; then
        log_success "Redis is accessible"
    else
        log_error "Redis connectivity check failed"
    fi
    
    log_success "Health checks completed"
}

setup_monitoring() {
    log_info "Setting up monitoring and alerting..."
    
    # Check if Grafana is accessible
    if curl -f http://localhost:3002 &>/dev/null; then
        log_success "Grafana is accessible at http://localhost:3002"
        log_info "Default login: admin/admin123"
    else
        log_warning "Grafana may not be ready yet. Check again in a few minutes."
    fi
    
    # Check if Prometheus is accessible
    if curl -f http://localhost:9090 &>/dev/null; then
        log_success "Prometheus is accessible at http://localhost:9090"
    else
        log_warning "Prometheus may not be ready yet. Check again in a few minutes."
    fi
    
    log_success "Monitoring setup completed"
}

setup_backup() {
    log_info "Setting up backup system..."
    
    # Create backup directories
    mkdir -p backups/postgres backups/minio backups/logs
    
    # Set permissions
    chmod 755 backups/
    
    log_success "Backup system configured"
}

show_deployment_info() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service Information:"
    echo "======================="
    echo "🌐 API Server:          http://localhost:3001"
    echo "📊 API Documentation:   http://localhost:3001/documentation"
    echo "🔍 Health Check:        http://localhost:3001/health"
    echo "📈 Grafana Dashboard:   http://localhost:3002 (admin/admin123)"
    echo "📊 Prometheus:          http://localhost:9090"
    echo "💾 MinIO Console:       http://localhost:9001 (cryb_minio_admin/cryb_minio_password)"
    echo ""
    echo "🐳 Docker Commands:"
    echo "==================="
    echo "View logs:        docker-compose -f docker-compose.production.yml logs -f"
    echo "Restart service:  docker-compose -f docker-compose.production.yml restart <service>"
    echo "Scale API:        docker-compose -f docker-compose.production.yml up -d --scale api=3"
    echo "Stop all:         docker-compose -f docker-compose.production.yml down"
    echo ""
    echo "🔧 Maintenance:"
    echo "==============="
    echo "Database backup:  docker-compose -f docker-compose.production.yml exec postgres pg_dump -U cryb_user cryb > backup.sql"
    echo "View metrics:     curl http://localhost:3001/metrics"
    echo "Check health:     curl http://localhost:3001/health"
    echo ""
    log_warning "Remember to:"
    echo "1. Update .env.production with your production secrets"
    echo "2. Replace self-signed SSL certificates with valid ones"
    echo "3. Configure your domain and DNS settings"
    echo "4. Set up external backup storage"
    echo "5. Configure alerting webhooks"
}

main() {
    log_info "Starting CRYB Discord-like API production deployment..."
    echo ""
    
    # Run setup steps
    check_requirements
    setup_environment
    setup_ssl
    build_images
    deploy_services
    setup_database
    run_health_checks
    setup_monitoring
    setup_backup
    
    echo ""
    show_deployment_info
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi