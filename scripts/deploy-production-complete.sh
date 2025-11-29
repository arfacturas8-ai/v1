#!/bin/bash
# CRYB Platform Complete Production Deployment Script
# This script deploys the entire CRYB platform to production with full automation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_DIR="/home/ubuntu/cryb-platform"
LOG_DIR="$PLATFORM_DIR/logs"
BACKUP_DIR="$PLATFORM_DIR/backups"
CONFIG_DIR="$PLATFORM_DIR/config"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as ubuntu user
if [[ $USER != "ubuntu" ]]; then
    error "This script must be run as ubuntu user"
    exit 1
fi

log "🚀 Starting CRYB Platform Production Deployment..."

# Create necessary directories
log "Creating deployment directories..."
mkdir -p "$LOG_DIR" "$BACKUP_DIR" "$PLATFORM_DIR/tmp"

# Phase 1: Environment and Dependencies
log "Phase 1: Checking environment and dependencies..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    error "Node.js not found. Please install Node.js first."
    exit 1
fi

NODE_VERSION=$(node --version)
log "Node.js version: $NODE_VERSION"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    error "PM2 not found. Installing PM2..."
    npm install -g pm2@latest
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    error "Docker not found. Please install Docker first."
    exit 1
fi

# Phase 2: Build Applications
log "Phase 2: Building applications..."

# Build API
if [ -d "$PLATFORM_DIR/apps/api" ]; then
    log "Building API..."
    cd "$PLATFORM_DIR/apps/api"
    npm install --production=false
    npm run build || {
        error "Failed to build API"
        exit 1
    }
    success "API built successfully"
fi

# Build Web Frontend
if [ -d "$PLATFORM_DIR/apps/web" ]; then
    log "Building Web Frontend..."
    cd "$PLATFORM_DIR/apps/web"
    npm install --production=false
    npm run build || {
        error "Failed to build Web Frontend"
        exit 1
    }
    success "Web Frontend built successfully"
fi

# Build Workers
if [ -d "$PLATFORM_DIR/services/workers" ]; then
    log "Building Workers..."
    cd "$PLATFORM_DIR/services/workers"
    npm install --production=false
    npm run build || {
        warning "Workers build failed - continuing without workers"
    }
fi

# Phase 3: Database Setup
log "Phase 3: Setting up database..."

# Start database containers if not running
cd "$PLATFORM_DIR"

# Check if database is accessible
if ! docker exec cryb-postgres-optimized pg_isready -U postgres >/dev/null 2>&1; then
    log "Starting database containers..."
    docker-compose -f docker-compose.production.yml up -d postgres redis elasticsearch minio
    sleep 30
fi

# Run database migrations if needed
if [ -f "$PLATFORM_DIR/apps/api/prisma/schema.prisma" ]; then
    log "Running database migrations..."
    cd "$PLATFORM_DIR/apps/api"
    npx prisma migrate deploy || warning "Database migration failed - continuing"
fi

# Phase 4: Stop current services
log "Phase 4: Stopping current services for deployment..."

# Stop PM2 processes gracefully
pm2 stop all || true
pm2 delete all || true

# Phase 5: Deploy systemd services
log "Phase 5: Deploying systemd services..."

# Install systemd service
if [ -f "$PLATFORM_DIR/systemd/cryb-platform.service" ]; then
    sudo cp "$PLATFORM_DIR/systemd/cryb-platform.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable cryb-platform
    success "Systemd service installed and enabled"
fi

# Phase 6: Configure Nginx
log "Phase 6: Configuring Nginx..."

# Test current nginx configuration
if sudo nginx -t; then
    log "Current Nginx configuration is valid"
else
    error "Current Nginx configuration is invalid"
    exit 1
fi

# Phase 7: Start services
log "Phase 7: Starting production services..."

# Start Docker services
log "Starting Docker services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 30

# Start PM2 services
log "Starting PM2 services..."
cd "$PLATFORM_DIR"
pm2 start ecosystem.config.js --env production

# Wait for PM2 services to be online
sleep 15

# Verify PM2 services are running
if ! pm2 list | grep -q online; then
    error "PM2 services failed to start"
    pm2 logs --lines 50
    exit 1
fi

success "PM2 services started successfully"

# Phase 8: Health checks
log "Phase 8: Running health checks..."

check_service() {
    local name=$1
    local url=$2
    local expected=${3:-200}
    
    log "Checking $name..."
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected"; then
        success "✓ $name is healthy"
        return 0
    else
        error "✗ $name is not responding"
        return 1
    fi
}

# Wait for services to fully start
sleep 20

# Health check results
health_checks_passed=true

# Check API
if ! check_service "API" "http://localhost:3001/health"; then
    health_checks_passed=false
fi

# Check Web Frontend
if ! check_service "Web Frontend" "http://localhost:3003"; then
    health_checks_passed=false
fi

# Check Database
if ! docker exec cryb-postgres-optimized pg_isready -U postgres >/dev/null 2>&1; then
    error "✗ Database is not ready"
    health_checks_passed=false
else
    success "✓ Database is healthy"
fi

# Check Redis
if ! docker exec cryb-redis-dev redis-cli ping | grep -q PONG; then
    error "✗ Redis is not responding"
    health_checks_passed=false
else
    success "✓ Redis is healthy"
fi

# Phase 9: SSL and Domain Setup Information
log "Phase 9: SSL and Domain Setup..."

echo
log "🔒 SSL Setup Instructions:"
echo "1. Ensure your domain DNS points to this server:"
echo "   IP Address: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo
echo "2. Run SSL setup script:"
echo "   bash /home/ubuntu/cryb-platform/scripts/setup-ssl-production.sh"
echo
echo "3. Update your domain records:"
echo "   - A record: cryb.ai -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "   - A record: www.cryb.ai -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "   - A record: platform.cryb.ai -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "   - A record: api.cryb.ai -> $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"

# Phase 10: Monitoring Setup
log "Phase 10: Starting monitoring stack..."

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d || warning "Monitoring stack failed to start"

# Phase 11: Generate deployment report
log "Phase 11: Generating deployment report..."

REPORT_FILE="$LOG_DIR/deployment-$(date +%Y%m%d-%H%M%S).log"

cat > "$REPORT_FILE" << EOF
CRYB Platform Production Deployment Report
==========================================
Date: $(date)
User: $(whoami)
Server: $(hostname)
IP Address: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')

Services Status:
$(pm2 list)

Docker Containers:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

System Resources:
Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')
Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')
CPU: $(nproc) cores

Environment:
Node.js: $(node --version)
PM2: $(pm2 --version)
Docker: $(docker --version)

Health Checks: $([ "$health_checks_passed" = true ] && echo "PASSED" || echo "FAILED")

Next Steps:
1. Configure DNS records
2. Run SSL setup script
3. Test all functionality
4. Set up monitoring alerts
5. Configure backups

EOF

success "Deployment report saved to: $REPORT_FILE"

# Final status
echo
echo "=================================================="
if [ "$health_checks_passed" = true ]; then
    success "🎉 CRYB Platform Production Deployment SUCCESSFUL!"
    echo
    echo "Your platform is now running:"
    echo "- API: http://localhost:3001"
    echo "- Web: http://localhost:3003"
    echo "- Monitoring: http://localhost:3005 (Grafana)"
    echo "- Database: localhost:5433"
    echo
    echo "Next steps:"
    echo "1. Configure your domain DNS"
    echo "2. Run: bash scripts/setup-ssl-production.sh"
    echo "3. Test: https://platform.cryb.ai"
    echo "4. Set up monitoring alerts"
    echo "5. Configure automated backups"
else
    error "❌ Deployment completed with health check failures"
    echo "Check the logs and fix issues before proceeding to SSL setup"
    echo "Logs: $REPORT_FILE"
    echo "PM2 logs: pm2 logs"
    exit 1
fi

echo "=================================================="

log "🚀 Production deployment completed successfully!"
echo
echo "Log file: $REPORT_FILE"
echo "PM2 status: pm2 list"
echo "Docker status: docker ps"
echo "Nginx status: sudo systemctl status nginx"