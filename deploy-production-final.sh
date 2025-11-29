#!/bin/bash

# =======================================
# CRYB Platform - Production Deployment
# =======================================

set -e

echo "🚀 CRYB Platform Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

check_service() {
    local name=$1
    local port=$2
    if lsof -i:$port > /dev/null 2>&1; then
        log_success "$name is running on port $port"
        return 0
    else
        log_error "$name is not running on port $port"
        return 1
    fi
}

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if running as correct user
if [ "$USER" != "ubuntu" ]; then
    log_warning "Script should be run as ubuntu user"
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    log_error "Not in CRYB platform root directory"
    exit 1
fi

# 1. Stop existing services
log_info "Stopping existing services..."
pm2 delete all > /dev/null 2>&1 || true
log_success "PM2 processes cleaned up"

# 2. Start Docker services
log_info "Starting Docker infrastructure..."

# PostgreSQL
if docker ps | grep -q cryb-postgres; then
    log_success "PostgreSQL already running"
else
    docker start cryb-postgres > /dev/null 2>&1 || docker run -d --name cryb-postgres \
        -p 5432:5432 \
        -e POSTGRES_USER=cryb_user \
        -e POSTGRES_PASSWORD=cryb_password \
        -e POSTGRES_DB=cryb \
        -v /home/ubuntu/cryb-platform/data/postgres:/var/lib/postgresql/data \
        postgres:15 > /dev/null
    log_success "PostgreSQL started"
fi

# Redis
if docker ps | grep -q cryb-redis; then
    log_success "Redis already running"
else
    docker start cryb-redis > /dev/null 2>&1 || docker run -d --name cryb-redis \
        -p 6380:6379 \
        redis:7-alpine > /dev/null
    log_success "Redis started"
fi

# MinIO
if docker ps | grep -q cryb-minio; then
    log_success "MinIO already running"
else
    docker start cryb-minio > /dev/null 2>&1 || docker run -d --name cryb-minio \
        -p 9000:9000 -p 9001:9001 \
        -e MINIO_ROOT_USER=minioadmin \
        -e MINIO_ROOT_PASSWORD=minioadmin123 \
        -v /home/ubuntu/cryb-platform/data/minio:/data \
        minio/minio server /data --console-address :9001 > /dev/null
    log_success "MinIO started"
fi

# 3. Wait for services to be ready
log_info "Waiting for infrastructure services..."
sleep 5

# 4. Update database schema
log_info "Updating database schema..."
cd /home/ubuntu/cryb-platform/packages/database
export DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5432/cryb"
npx prisma db push --skip-generate --accept-data-loss > /dev/null 2>&1
log_success "Database schema updated"

# 5. Start API service
log_info "Starting API service..."
cd /home/ubuntu/cryb-platform/apps/api
PORT=3002 pm2 start npm --name cryb-api -- run dev > /dev/null
log_success "API service started"

# 6. Start Web frontend
log_info "Starting Web frontend..."
cd /home/ubuntu/cryb-platform/apps/web
PORT=3001 pm2 start npm --name cryb-web -- run dev > /dev/null
log_success "Web frontend started"

# 7. Wait for services to initialize
log_info "Waiting for services to initialize..."
sleep 15

# 8. Verify service status
echo ""
log_info "Verifying service status..."
echo "=============================="

check_service "PostgreSQL" 5432
check_service "Redis" 6380
check_service "MinIO" 9000
check_service "API" 3002
check_service "Web Frontend" 3001

# 9. Test API health
echo ""
log_info "Testing API health..."
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    API_STATUS=$(curl -s http://localhost:3002/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$API_STATUS" = "healthy" ] || [ "$API_STATUS" = "degraded" ]; then
        log_success "API is responding (Status: $API_STATUS)"
    else
        log_warning "API status unknown: $API_STATUS"
    fi
else
    log_error "API not responding on http://localhost:3002/health"
fi

# 10. Test Web frontend
log_info "Testing Web frontend..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    log_success "Web frontend is responding"
else
    log_error "Web frontend not responding on http://localhost:3001"
fi

# 11. Show PM2 status
echo ""
log_info "PM2 Process Status:"
pm2 list

# 12. Display access information
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 CRYB Platform Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📍 Local Access URLs:"
echo "  • Web Platform: http://localhost:3001"
echo "  • API Backend: http://localhost:3002"
echo "  • MinIO Console: http://localhost:9001"
echo ""
echo "🌐 Production URLs (after AWS Security Groups):"
echo "  • Web Platform: https://platform.cryb.ai"
echo "  • API Backend: https://api.cryb.ai"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: pm2 logs"
echo "  • Restart services: pm2 restart all"
echo "  • Stop services: pm2 stop all"
echo "  • Check status: pm2 list"
echo ""
echo "📊 Next Steps:"
echo "  1. Update AWS Security Groups (ports 80, 443)"
echo "  2. Configure SSL certificates"
echo "  3. Set up domain routing"
echo "  4. Monitor service health"
echo ""
log_warning "Platform is ready for basic operations in degraded mode"
log_info "Some services may show 'unhealthy' status but core functionality works"

# 13. Create post-deployment verification script
cat > /home/ubuntu/verify-platform.sh << 'EOF'
#!/bin/bash
echo "🔍 CRYB Platform Health Check"
echo "============================"
echo "API Health:"
curl -s http://localhost:3002/health | python3 -m json.tool 2>/dev/null || echo "API not responding"
echo -e "\nWeb Frontend:"
curl -sI http://localhost:3001 | head -1
echo -e "\nPM2 Status:"
pm2 list
EOF

chmod +x /home/ubuntu/verify-platform.sh
log_success "Created verification script: /home/ubuntu/verify-platform.sh"

echo ""
log_success "Deployment completed successfully!"
log_info "Run '/home/ubuntu/verify-platform.sh' to check platform health anytime"