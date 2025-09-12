#!/bin/bash

# CRYB Platform Database Setup Script
# This script sets up the complete database infrastructure with PostgreSQL + TimescaleDB

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    print_info "Please set DATABASE_URL to your PostgreSQL connection string"
    print_info "Example: postgresql://user:password@localhost:5432/cryb_platform"
    exit 1
fi

print_info "🚀 Starting CRYB Platform Database Setup"
print_info "Database URL: ${DATABASE_URL}"

# Check if PostgreSQL is accessible
print_info "Checking PostgreSQL connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    print_error "Cannot connect to PostgreSQL database"
    print_info "Please ensure PostgreSQL is running and DATABASE_URL is correct"
    exit 1
fi
print_success "PostgreSQL connection verified"

# Install dependencies if needed
print_info "Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi
print_success "Dependencies installed"

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migrations
print_info "Running database migrations..."
npx prisma migrate deploy
print_success "Database migrations completed"

# Check if TimescaleDB extension is available
print_info "Checking TimescaleDB availability..."
TIMESCALE_AVAILABLE=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_available_extensions WHERE name = 'timescaledb';" | xargs)

if [ "$TIMESCALE_AVAILABLE" -gt 0 ]; then
    print_info "TimescaleDB extension found. Setting up time-series analytics..."
    
    # Setup TimescaleDB
    if [ -f "timescale-setup.sql" ]; then
        psql "$DATABASE_URL" -f timescale-setup.sql
        print_success "TimescaleDB setup completed"
    else
        print_warning "TimescaleDB setup file not found"
    fi
else
    print_warning "TimescaleDB extension not available. Skipping time-series setup"
    print_info "Analytics tables will work as regular PostgreSQL tables"
fi

# Apply additional optimizations
print_info "Applying database optimizations..."

# Create additional indexes for performance
psql "$DATABASE_URL" << 'EOF'
-- Additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_content_search 
ON "Message" USING GIN (to_tsvector('english', content));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_time
ON "UserActivity" ("userId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_state_active
ON "VoiceState" ("serverId", "channelId", "connectedAt") WHERE "channelId" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_member_online
ON "ServerMember" ("serverId", "joinedAt" DESC) WHERE pending = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_friendship_lookup
ON "Friendship" ("initiatorId", "receiverId", status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_channel_time
ON "Message" ("channelId", "createdAt" DESC, type);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_with_reactions
ON "Message" ("channelId", "createdAt" DESC) 
WHERE EXISTS (SELECT 1 FROM "Reaction" WHERE "Reaction"."messageId" = "Message".id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_presences
ON "UserPresence" ("userId", "updatedAt" DESC) 
WHERE status IN ('ONLINE', 'IDLE', 'DND');

-- Optimize JSON queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_mentions
ON "Message" USING GIN (mentions) WHERE mentions IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_features
ON "Server" USING GIN (features) WHERE features IS NOT NULL;
EOF

print_success "Database optimizations applied"

# Offer to run seed data
echo
read -p "Would you like to populate the database with seed data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Choose seed data size:"
    echo "1. Small (20 users, 3 servers) - Good for development"
    echo "2. Medium (100 users, 10 servers) - Default"  
    echo "3. Large (500 users, 20 servers) - Performance testing"
    read -p "Enter choice [1-3] (default: 2): " SEED_CHOICE
    
    case $SEED_CHOICE in
        1)
            print_info "Running small seed..."
            npm run db:seed:small
            ;;
        3)
            print_info "Running large seed..."
            npm run db:seed:large
            ;;
        *)
            print_info "Running default seed..."
            npm run db:seed
            ;;
    esac
    
    print_success "Database seeded successfully"
else
    print_info "Skipping seed data"
fi

# Database statistics
print_info "Getting database statistics..."
psql "$DATABASE_URL" << 'EOF'
\echo '\n📊 Database Statistics:'
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Rows Inserted",
    n_tup_upd as "Rows Updated",
    n_tup_del as "Rows Deleted"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC
LIMIT 10;

\echo '\n💾 Table Sizes:'
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Size"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF

# Create database backup script
print_info "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
# CRYB Platform Database Backup Script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cryb_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "Backup compressed: $BACKUP_FILE.gz"
    
    # Clean up old backups (keep last 5)
    ls -t "$BACKUP_DIR"/cryb_backup_*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm
    echo "Old backups cleaned up"
else
    echo "Backup failed"
    exit 1
fi
EOF

chmod +x backup.sh
print_success "Backup script created at ./backup.sh"

# Create monitoring script
print_info "Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash
# CRYB Platform Database Monitoring Script

# Connection check
echo "🔗 Database Connection Status:"
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Performance metrics
echo -e "\n📊 Performance Metrics:"
psql "$DATABASE_URL" -c "
SELECT 
    'Active Connections' as metric, 
    count(*) as value 
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
    'Total Connections', 
    count(*) 
FROM pg_stat_activity
UNION ALL
SELECT 
    'Database Size', 
    pg_size_pretty(pg_database_size(current_database()))
UNION ALL
SELECT 
    'Cache Hit Ratio', 
    round(
        sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)), 2
    )::text || '%'
FROM pg_stat_database
WHERE datname = current_database();
"

# Recent activity
echo -e "\n🔄 Recent Activity:"
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND (n_tup_ins > 0 OR n_tup_upd > 0 OR n_tup_del > 0)
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
LIMIT 5;
"

# Long-running queries
echo -e "\n⏱️ Long-running Queries (>5 seconds):"
psql "$DATABASE_URL" -c "
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds'
    AND state = 'active'
ORDER BY duration DESC;
"
EOF

chmod +x monitor.sh
print_success "Monitoring script created at ./monitor.sh"

# Final setup summary
echo
print_success "🎉 Database setup completed successfully!"
echo
echo "📁 Files created:"
echo "  • backup.sh - Database backup script"
echo "  • monitor.sh - Database monitoring script"
echo
echo "🔧 Available commands:"
echo "  • npm run db:generate - Regenerate Prisma client"
echo "  • npm run db:migrate - Run new migrations"
echo "  • npm run db:studio - Open Prisma Studio"
echo "  • npm run db:seed - Populate with sample data"
echo "  • ./backup.sh - Create database backup"
echo "  • ./monitor.sh - Check database health"
echo
echo "🌐 Next steps:"
echo "  1. Start your application server"
echo "  2. Open Prisma Studio with: npm run db:studio"
echo "  3. Monitor database with: ./monitor.sh"
echo "  4. Set up automated backups with: crontab -e"
echo
print_success "Setup complete! Your CRYB Platform database is ready to use."