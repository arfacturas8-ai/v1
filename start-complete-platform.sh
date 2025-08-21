#!/bin/bash

# CRYB Platform - Complete Startup Script
# This script starts the entire CRYB platform infrastructure

set -e

echo "🚀 Starting CRYB Platform - Complete Infrastructure"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start $1${NC}"
        exit 1
    fi
}

# Step 1: Start Docker services
echo -e "\n${BLUE}Step 1: Starting Docker services...${NC}"
sudo docker compose -f docker-compose.complete.yml up -d
check_service "Docker services"

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Step 2: Check database connection
echo -e "\n${BLUE}Step 2: Checking database connection...${NC}"
sudo docker exec cryb-postgres pg_isready -U cryb_user
check_service "PostgreSQL"

# Step 3: Check Redis
echo -e "\n${BLUE}Step 3: Checking Redis...${NC}"
sudo docker exec cryb-redis-master redis-cli -a cryb_redis_password ping > /dev/null 2>&1
check_service "Redis"

# Step 4: Install dependencies if needed
echo -e "\n${BLUE}Step 4: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    pnpm install
    check_service "Dependencies"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 5: Generate Prisma client
echo -e "\n${BLUE}Step 5: Generating Prisma client...${NC}"
cd packages/database
pnpm prisma generate
check_service "Prisma client"
cd ../..

# Step 6: Push database schema
echo -e "\n${BLUE}Step 6: Syncing database schema...${NC}"
cd packages/database
pnpm prisma db push --skip-generate
check_service "Database schema"
cd ../..

# Step 7: Start API server
echo -e "\n${BLUE}Step 7: Starting API server...${NC}"
cd apps/api
pnpm dev &
API_PID=$!
cd ../..
sleep 5
if ps -p $API_PID > /dev/null; then
    echo -e "${GREEN}✅ API server started (PID: $API_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start API server${NC}"
fi

# Step 8: Start Web frontend
echo -e "\n${BLUE}Step 8: Starting Web frontend...${NC}"
cd apps/web
pnpm dev &
WEB_PID=$!
cd ../..
sleep 5
if ps -p $WEB_PID > /dev/null; then
    echo -e "${GREEN}✅ Web frontend started (PID: $WEB_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Web frontend${NC}"
fi

# Step 9: Start Admin dashboard
echo -e "\n${BLUE}Step 9: Starting Admin dashboard...${NC}"
cd apps/admin
pnpm dev &
ADMIN_PID=$!
cd ../..
sleep 5
if ps -p $ADMIN_PID > /dev/null; then
    echo -e "${GREEN}✅ Admin dashboard started (PID: $ADMIN_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Admin dashboard${NC}"
fi

# Step 10: Start Workers
echo -e "\n${BLUE}Step 10: Starting Worker services...${NC}"
cd services/workers
pnpm start:all &
WORKERS_PID=$!
cd ../..
sleep 5
if ps -p $WORKERS_PID > /dev/null; then
    echo -e "${GREEN}✅ Workers started (PID: $WORKERS_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start Workers${NC}"
fi

# Summary
echo -e "\n${GREEN}=================================================="
echo "🎉 CRYB Platform is now running!"
echo "=================================================="
echo -e "${NC}"
echo "📊 Infrastructure Services:"
echo "  • PostgreSQL:      http://localhost:5433"
echo "  • Redis:           http://localhost:6380"
echo "  • Elasticsearch:   http://localhost:9201"
echo "  • MinIO:           http://localhost:9001"
echo "  • RabbitMQ:        http://localhost:15672"
echo ""
echo "🔧 Management Tools:"
echo "  • pgAdmin:         http://localhost:5050"
echo "  • Redis Commander: http://localhost:8081"
echo "  • Kibana:          http://localhost:5601"
echo "  • Grafana:         http://localhost:3001"
echo "  • Prometheus:      http://localhost:9090"
echo ""
echo "🚀 Application Services:"
echo "  • API Server:      http://localhost:3000"
echo "  • Web Frontend:    http://localhost:3002"
echo "  • Admin Dashboard: http://localhost:3003"
echo "  • API Docs:        http://localhost:3000/documentation"
echo ""
echo "📱 Mobile Development:"
echo "  • Run 'cd apps/mobile && pnpm start' to start Expo"
echo ""
echo "⚡ Process IDs:"
echo "  • API Server:      $API_PID"
echo "  • Web Frontend:    $WEB_PID"
echo "  • Admin Dashboard: $ADMIN_PID"
echo "  • Workers:         $WORKERS_PID"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-platform.sh${NC}"
echo ""

# Create stop script
cat > stop-platform.sh << 'STOP_SCRIPT'
#!/bin/bash
echo "Stopping CRYB Platform..."
pkill -f "pnpm dev"
pkill -f "tsx watch"
sudo docker compose -f docker-compose.complete.yml down
echo "✅ Platform stopped"
STOP_SCRIPT
chmod +x stop-platform.sh

# Keep script running
echo -e "${BLUE}Platform is running. Press Ctrl+C to stop all services.${NC}"

# Trap Ctrl+C and stop all services
trap 'echo -e "\n${YELLOW}Stopping all services...${NC}"; ./stop-platform.sh; exit' INT

# Keep the script running
while true; do
    sleep 1
done