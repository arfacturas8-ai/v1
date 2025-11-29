#!/bin/bash

echo "🚀 CRYB Platform - Start Script (React + API)"
echo "============================================="

# Set environment variables
export DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5433/cryb"
export REDIS_URL="redis://:cryb_redis_password@localhost:6380/0"
export JWT_SECRET="cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024"
export NODE_ENV="development"
export VITE_API_URL="http://localhost:3002"
export PORT_API=3002
export PORT_REACT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "1️⃣  Checking Services..."
echo "-------------------------"

# Check PostgreSQL
if pg_isready -h localhost -p 5433 -U cryb_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL${NC} running on port 5433"
else
    echo -e "${RED}❌ PostgreSQL${NC} not running"
    echo "   Run: docker start cryb-postgres"
    exit 1
fi

# Check Redis
if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis${NC} running on port 6380"
else
    echo -e "${RED}❌ Redis${NC} not running"
    echo "   Run: docker start cryb-redis"
    exit 1
fi

# MinIO (optional)
if curl -s http://localhost:9000/minio/health/ready > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO${NC} running on port 9000"
else
    echo -e "${YELLOW}⚠️  MinIO${NC} not running (file uploads won't work)"
fi

echo ""
echo "2️⃣  Preparing Database..."
echo "-------------------------"
cd /home/ubuntu/cryb-platform/packages/database
echo "Generating Prisma client..."
pnpm prisma generate > /dev/null 2>&1
echo -e "${GREEN}✅ Prisma client generated${NC}"

echo ""
echo "3️⃣  Starting API Server..."
echo "---------------------------"
cd /home/ubuntu/cryb-platform/apps/api
pm2 start npm --name "cryb-api" --env "DATABASE_URL=$DATABASE_URL" --env "REDIS_URL=$REDIS_URL" --env "JWT_SECRET=$JWT_SECRET" --env "PORT=$PORT_API" -- run dev
echo -e "${GREEN}✅ API starting on port $PORT_API${NC}"

echo ""
echo "4️⃣  Starting React App..."
echo "-------------------------"
cd /home/ubuntu/cryb-platform/apps/react-app
pm2 start npm --name "cryb-react" --env "VITE_API_URL=$VITE_API_URL" --env "PORT=$PORT_REACT" -- run dev
echo -e "${GREEN}✅ React app starting on port $PORT_REACT${NC}"

echo ""
echo "5️⃣  Waiting for services to start..."
echo "------------------------------------"
sleep 5

# Test API
echo -n "Testing API... "
if curl -s http://localhost:$PORT_API/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API responding${NC}"
else
    echo -e "${YELLOW}⚠️  API not ready yet${NC}"
fi

# Test React
echo -n "Testing React App... "
if curl -s http://localhost:$PORT_REACT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ React app responding${NC}"
else
    echo -e "${YELLOW}⚠️  React app not ready yet${NC}"
fi

echo ""
echo "6️⃣  Process Status"
echo "------------------"
pm2 list

echo ""
echo "======================================"
echo -e "${GREEN}✅ CRYB Platform Started!${NC}"
echo "======================================"
echo ""
echo "🌐 Access Points:"
echo "   React App: http://localhost:$PORT_REACT"
echo "   API Server: http://localhost:$PORT_API"
echo "   API Health: http://localhost:$PORT_API/health"
echo ""
echo "📝 Commands:"
echo "   View logs: pm2 logs"
echo "   Stop all: pm2 stop all"
echo "   Restart: pm2 restart all"
echo "   Monitor: pm2 monit"
echo ""