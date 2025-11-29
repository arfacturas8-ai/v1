#!/bin/bash

echo "🔧 CRYB Platform - Complete Fix and Start Script"
echo "================================================"

# Set environment variables
export DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5433/cryb"
export REDIS_URL="redis://:cryb_redis_password@localhost:6380/0"
export JWT_SECRET="cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024"
export NODE_ENV="development"
export VITE_API_URL="http://localhost:3002"
export NEXT_PUBLIC_API_URL="http://localhost:3002"

# Check services
echo ""
echo "1️⃣  Checking required services..."
echo "-----------------------------------"

# Check PostgreSQL
if pg_isready -h localhost -p 5433 -U cryb_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running on port 5433"
else
    echo "❌ PostgreSQL is NOT running on port 5433"
    echo "   Start it with: docker start cryb-postgres"
fi

# Check Redis
if redis-cli -p 6380 -a cryb_redis_password ping > /dev/null 2>&1; then
    echo "✅ Redis is running on port 6380"
else
    echo "❌ Redis is NOT running on port 6380"
    echo "   Start it with: docker start cryb-redis"
fi

# Check Elasticsearch
if curl -s http://localhost:9201/_cluster/health > /dev/null 2>&1; then
    echo "✅ Elasticsearch is running on port 9201"
else
    echo "⚠️  Elasticsearch is NOT running (optional)"
fi

# Check MinIO
if curl -s http://localhost:9000/minio/health/ready > /dev/null 2>&1; then
    echo "✅ MinIO is running on port 9000"
else
    echo "⚠️  MinIO is NOT running (optional for file uploads)"
fi

echo ""
echo "2️⃣  Generating Prisma Client..."
echo "--------------------------------"
cd /home/ubuntu/cryb-platform/packages/database
pnpm prisma generate

echo ""
echo "3️⃣  Stopping all existing processes..."
echo "---------------------------------------"
pm2 stop all
pkill -f "tsx"
pkill -f "vite"
pkill -f "next"

echo ""
echo "4️⃣  Starting API Server..."
echo "---------------------------"
cd /home/ubuntu/cryb-platform/apps/api
pm2 delete cryb-api 2>/dev/null
pm2 start npm --name "cryb-api" -- run dev

echo ""
echo "5️⃣  Starting React App (Vite)..."
echo "---------------------------------"
cd /home/ubuntu/cryb-platform/apps/react-app
pm2 delete cryb-react 2>/dev/null
pm2 start npm --name "cryb-react" -- run dev

echo ""
echo "6️⃣  Service Status..."
echo "---------------------"
sleep 5
pm2 list

echo ""
echo "7️⃣  Testing Services..."
echo "-----------------------"
sleep 3

# Test API
echo -n "API Health: "
curl -s http://localhost:3002/health | jq -c . 2>/dev/null || echo "❌ Not responding"

# Test React App
echo -n "React App: "
if curl -s http://localhost:3003 | grep -q "CRYB"; then
    echo "✅ Running on http://localhost:3003"
else
    echo "❌ Not responding"
fi

# Test Next.js App
echo -n "Next.js App: "
if curl -s http://localhost:3000 | grep -q "CRYB"; then
    echo "✅ Running on http://localhost:3000"
else
    echo "❌ Not responding"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Access the platform at:"
echo "   - Next.js App: http://localhost:3000"
echo "   - React App: http://localhost:3003"
echo "   - API: http://localhost:3002"
echo ""
echo "📝 View logs with:"
echo "   pm2 logs"
echo ""
echo "🔄 Restart services with:"
echo "   pm2 restart all"