#!/bin/bash

echo "🗄️  CRYB Database Migration Script"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection
export DATABASE_URL="postgresql://cryb_user:cryb_password@localhost:5433/cryb"

echo ""
echo "1️⃣  Checking Database Connection..."
echo "------------------------------------"

if pg_isready -h localhost -p 5433 -U cryb_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"
else
    echo -e "${RED}❌ Cannot connect to PostgreSQL${NC}"
    echo "   Ensure PostgreSQL is running: docker start cryb-postgres"
    exit 1
fi

echo ""
echo "2️⃣  Current Database Status..."
echo "-------------------------------"

cd /home/ubuntu/cryb-platform/packages/database

# Check current migration status
echo "Checking migration history..."
npx prisma migrate status 2>&1 | grep -E "(applied|pending|failed)" || echo "No migrations found"

echo ""
echo "3️⃣  Migration Options"
echo "---------------------"
echo "1) Dev Migration - Create and apply migrations (dev environment)"
echo "2) Deploy Migration - Apply existing migrations (production)"
echo "3) Reset Database - Drop all data and recreate schema (⚠️  DESTRUCTIVE)"
echo "4) Push Schema - Force sync schema without migrations (dev only)"
echo "5) Generate Client - Only regenerate Prisma client"
echo "6) Exit"
echo ""
read -p "Select option (1-6): " option

case $option in
    1)
        echo ""
        echo "Creating development migration..."
        read -p "Enter migration name: " migration_name
        if [ -z "$migration_name" ]; then
            migration_name="update"
        fi
        npx prisma migrate dev --name "$migration_name"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration created and applied${NC}"
        else
            echo -e "${RED}❌ Migration failed${NC}"
        fi
        ;;
    2)
        echo ""
        echo "Deploying migrations to database..."
        npx prisma migrate deploy
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migrations deployed${NC}"
        else
            echo -e "${RED}❌ Deployment failed${NC}"
        fi
        ;;
    3)
        echo ""
        echo -e "${YELLOW}⚠️  WARNING: This will DELETE ALL DATA!${NC}"
        read -p "Type 'RESET' to confirm: " confirm
        if [ "$confirm" = "RESET" ]; then
            echo "Resetting database..."
            npx prisma migrate reset --force
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Database reset complete${NC}"
            else
                echo -e "${RED}❌ Reset failed${NC}"
            fi
        else
            echo "Reset cancelled"
        fi
        ;;
    4)
        echo ""
        echo "Pushing schema to database..."
        npx prisma db push --accept-data-loss
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Schema pushed successfully${NC}"
        else
            echo -e "${RED}❌ Schema push failed${NC}"
        fi
        ;;
    5)
        echo ""
        echo "Generating Prisma client..."
        npx prisma generate
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Client generated${NC}"
        else
            echo -e "${RED}❌ Generation failed${NC}"
        fi
        ;;
    6)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "4️⃣  Post-Migration Check"
echo "------------------------"

# Verify tables exist
echo "Checking database tables..."
PGPASSWORD=cryb_password psql -h localhost -p 5433 -U cryb_user -d cryb -c "\dt" 2>/dev/null | grep -E "(User|Community|Post|Comment)" | head -5

echo ""
echo -e "${BLUE}Migration complete!${NC}"
echo ""
echo "Next steps:"
echo "  - Run './start.sh' to start the platform"
echo "  - Check logs with 'pm2 logs' if issues occur"