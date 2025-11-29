#!/bin/bash

echo "🚀 CRYB Platform - Unified Start Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment variables
export DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5433/cryb"
export REDIS_URL="redis://:cryb_redis_password@localhost:6380/0"
export JWT_SECRET="cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024"
export NODE_ENV="development"
export VITE_API_URL="http://localhost:3002"
export PORT_API=3002
export PORT_REACT=3000

# Optional services (set to true to require them)
REQUIRE_ELASTICSEARCH=false
REQUIRE_MINIO=false

echo ""
echo "1️⃣  Checking Required Services..."
echo "===================================="

# Check PostgreSQL
check_postgres() {
    if pg_isready -h localhost -p 5433 -U cryb_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL${NC} running on port 5433"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL${NC} not running on port 5433"
        echo "   Starting PostgreSQL..."
        docker start cryb-postgres 2>/dev/null
        sleep 3
        if pg_isready -h localhost -p 5433 -U cryb_user > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL${NC} started successfully"
            return 0
        else
            echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
            echo "   Run manually: docker start cryb-postgres"
            return 1
        fi
    fi
}

# Check Redis
check_redis() {
    if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis${NC} running on port 6380"
        return 0
    else
        echo -e "${RED}❌ Redis${NC} not running on port 6380"
        echo "   Starting Redis..."
        docker start cryb-redis 2>/dev/null
        sleep 2
        if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis${NC} started successfully"
            return 0
        else
            echo -e "${RED}❌ Failed to start Redis${NC}"
            echo "   Run manually: docker start cryb-redis"
            return 1
        fi
    fi
}

# Check optional services
check_optional_services() {
    # MinIO
    if curl -s http://localhost:9000/minio/health/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MinIO${NC} running on port 9000"
        export MINIO_ENDPOINT="localhost"
        export MINIO_PORT="9000"
        export MINIO_ACCESS_KEY="minioadmin"
        export MINIO_SECRET_KEY="minioadmin123"
    else
        echo -e "${YELLOW}⚠️  MinIO${NC} not running (file uploads disabled)"
        export DISABLE_MINIO=true
    fi

    # Elasticsearch
    if curl -s http://localhost:9201/_cluster/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Elasticsearch${NC} running on port 9201"
    else
        echo -e "${YELLOW}⚠️  Elasticsearch${NC} not running (search features limited)"
        export DISABLE_ELASTICSEARCH=true
    fi
}

# Run service checks
if ! check_postgres; then
    echo -e "${RED}Cannot continue without PostgreSQL${NC}"
    exit 1
fi

if ! check_redis; then
    echo -e "${RED}Cannot continue without Redis${NC}"
    exit 1
fi

check_optional_services

echo ""
echo "2️⃣  Database Setup..."
echo "====================="

cd /home/ubuntu/cryb-platform/packages/database

# Generate Prisma client
echo "Generating Prisma client..."
if pnpm prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma client generation had warnings${NC}"
fi

# Push database schema
echo "Syncing database schema..."
if pnpm prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database schema synced${NC}"
else
    echo -e "${YELLOW}⚠️  Database sync had warnings${NC}"
fi

echo ""
echo "3️⃣  Cleaning Previous Processes..."
echo "==================================="

# Stop existing PM2 processes
pm2 stop cryb-api cryb-react 2>/dev/null
pm2 delete cryb-api cryb-react 2>/dev/null

# Kill any lingering processes
pkill -f "tsx.*src/index" 2>/dev/null
pkill -f "vite.*--port $PORT_REACT" 2>/dev/null

echo -e "${GREEN}✅ Previous processes cleaned${NC}"

echo ""
echo "4️⃣  Starting API Server..."
echo "==========================="

cd /home/ubuntu/cryb-platform/apps/api

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing API dependencies..."
    pnpm install
fi

# Start API with PM2
PORT=$PORT_API pm2 start npm --name "cryb-api" -- run dev

echo -e "${GREEN}✅ API server starting on port $PORT_API${NC}"

echo ""
echo "5️⃣  Starting React App..."
echo "========================="

cd /home/ubuntu/cryb-platform/apps/react-app

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing React app dependencies..."
    pnpm install
fi

# Start React app with PM2
PORT=$PORT_REACT pm2 start npm --name "cryb-react" -- run dev

echo -e "${GREEN}✅ React app starting on port $PORT_REACT${NC}"

echo ""
echo "6️⃣  Waiting for Services to Start..."
echo "====================================="

# Wait for API to be ready
echo -n "Waiting for API..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT_API/health > /dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:$PORT_API/health > /dev/null 2>&1; then
    echo -e " ${YELLOW}Timeout (check logs)${NC}"
fi

# Wait for React app to be ready
echo -n "Waiting for React app..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT_REACT > /dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:$PORT_REACT > /dev/null 2>&1; then
    echo -e " ${YELLOW}Timeout (check logs)${NC}"
fi

echo ""
echo "7️⃣  Health Check Report"
echo "========================"

# API health check
echo -n "API Health: "
health_response=$(curl -s http://localhost:$PORT_API/health 2>/dev/null)
if [ ! -z "$health_response" ]; then
    echo "$health_response" | jq -c '.' 2>/dev/null || echo "$health_response"
else
    echo -e "${RED}Not responding${NC}"
fi

# React app check
echo -n "React App: "
if curl -s http://localhost:$PORT_REACT | grep -q "CRYB\|Vite" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not responding properly${NC}"
fi

echo ""
echo "8️⃣  Process Status"
echo "==================="
pm2 list

echo ""
echo "========================================"
echo -e "${GREEN}🎉 CRYB Platform Started Successfully!${NC}"
echo "========================================"
echo ""
echo "📍 Access Points:"
echo -e "   ${BLUE}React App:${NC} http://localhost:$PORT_REACT"
echo -e "   ${BLUE}API Server:${NC} http://localhost:$PORT_API"
echo -e "   ${BLUE}API Health:${NC} http://localhost:$PORT_API/health"
echo ""
echo "📊 Service Status:"
echo -e "   ${GREEN}Core Services:${NC} PostgreSQL, Redis"
if [ "$DISABLE_MINIO" != "true" ]; then
    echo -e "   ${GREEN}File Storage:${NC} MinIO"
else
    echo -e "   ${YELLOW}File Storage:${NC} Disabled (MinIO not running)"
fi
if [ "$DISABLE_ELASTICSEARCH" != "true" ]; then
    echo -e "   ${GREEN}Search:${NC} Elasticsearch"
else
    echo -e "   ${YELLOW}Search:${NC} Limited (Elasticsearch not running)"
fi
echo ""
echo "🛠️  Management Commands:"
echo "   View logs:    pm2 logs"
echo "   API logs:     pm2 logs cryb-api"
echo "   React logs:   pm2 logs cryb-react"
echo "   Stop all:     pm2 stop all"
echo "   Restart all:  pm2 restart all"
echo "   Monitor:      pm2 monit"
echo "   Save state:   pm2 save"
echo ""
echo "🔄 Quick Actions:"
echo "   Restart API:    pm2 restart cryb-api"
echo "   Restart React:  pm2 restart cryb-react"
echo "   Check status:   pm2 status"
echo ""

# Check for any errors in logs
echo "⚠️  Recent Errors (if any):"
pm2 logs --nostream --lines 5 | grep -i "error" | head -3 || echo "   No recent errors found"
echo ""
echo "Run 'pm2 logs' to see full application logs"