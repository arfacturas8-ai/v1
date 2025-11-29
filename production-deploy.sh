#!/bin/bash

# CRYB Platform Production Deployment Script
# DevOps Infrastructure Lead - Production Ready Deployment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/home/ubuntu/cryb-platform/logs"
BACKUP_DIR="/home/ubuntu/cryb-platform/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p "$LOG_DIR" "$BACKUP_DIR/postgres" "$BACKUP_DIR/redis" "$BACKUP_DIR/configs"
    chmod 755 "$LOG_DIR" "$BACKUP_DIR"
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    local required_commands=("docker" "pm2" "nginx" "node" "npm")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is not installed"
            exit 1
        fi
    done
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
        exit 1
    fi
    
    log "System requirements check passed"
}

# Stop existing services
stop_services() {
    log "Stopping existing services..."
    pm2 stop all || true
    sleep 5
}

# Update Docker containers
update_docker() {
    log "Updating Docker containers..."
    cd "$SCRIPT_DIR"
    
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml pull
        docker-compose -f docker-compose.production.yml up -d --remove-orphans
    else
        docker-compose pull
        docker-compose up -d --remove-orphans
    fi
}

# Start services
start_services() {
    log "Starting services with PM2..."
    cd "$SCRIPT_DIR"
    
    pm2 delete all || true
    pm2 start ecosystem.config.js --env production
    pm2 save
}

# Health check
health_check() {
    log "Running health checks..."
    
    sleep 10  # Wait for services to start
    
    local services=("http://localhost:3000" "http://localhost:3001" "http://localhost:3002/health")
    local healthy=0
    
    for service in "${services[@]}"; do
        if curl -f -s "$service" > /dev/null; then
            log "✓ Service $service is healthy"
            healthy=$((healthy + 1))
        else
            warning "✗ Service $service failed health check"
        fi
    done
    
    log "Health check: $healthy/${#services[@]} services healthy"
}

# Main function
main() {
    log "Starting CRYB Platform production deployment..."
    
    create_directories
    check_requirements
    stop_services
    update_docker
    start_services
    health_check
    
    log "✅ Deployment completed!"
    info "Platform: https://platform.cryb.ai"
    info "API: https://api.cryb.ai"
}

# Run main
main "$@"