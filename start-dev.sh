#!/bin/bash

echo "🚀 Starting CRYB Platform Development Environment"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "📦 Starting Redis..."
    sudo systemctl start redis-server
fi

# Check database connection
echo "🔍 Checking database connection..."
echo "Please ensure your PostgreSQL database is configured in .env"

# Generate Prisma client
echo "📊 Generating Prisma client..."
cd packages/database
pnpm prisma generate

# Return to root
cd ../..

# Start development servers
echo "🎯 Starting development servers..."
echo "API Server: http://localhost:3001"
echo "Web App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Run turbo dev
pnpm dev