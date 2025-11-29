#!/bin/bash

# CRYB Platform Seed Data Script Runner
# This script runs the comprehensive database seeding script

echo "🌱 CRYB Platform - Database Seeding Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "Please navigate to the CRYB platform root and run: ./scripts/run-seed.sh"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Warning: DATABASE_URL environment variable is not set"
    echo "Make sure your database connection is configured properly"
    echo ""
fi

echo "📍 Current directory: $(pwd)"
echo "🎯 Running seed script..."
echo ""

# Change to database package directory and run the seed script
cd packages/database

echo "🔧 Generating Prisma client..."
npx prisma generate

echo ""
echo "🌱 Running comprehensive seed script..."
npx ts-node seed-comprehensive.ts

# Check if seeding was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "🔍 Running verification script..."
    npx ts-node verify-comprehensive.ts
    
    echo ""
    echo "🎉 Your CRYB platform is now ready with realistic demo content!"
    echo ""
    echo "📋 What was created:"
    echo "  • 60 diverse users with realistic profiles"
    echo "  • 12 communities covering tech, gaming, art, and more"
    echo "  • 8 Discord-style servers with channels and members"
    echo "  • 180+ posts with engaging content"
    echo "  • 1,300+ comments with threaded conversations"
    echo "  • 1,200+ messages across server channels"
    echo "  • 10,000+ votes showing community engagement"
    echo "  • 240+ friendships connecting users"
    echo "  • 1,400+ reactions on messages"
    echo ""
    echo "🚀 Ready to demonstrate all platform features!"
else
    echo ""
    echo "❌ Database seeding failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi