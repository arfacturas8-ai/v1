# CRYB Platform Database

This package contains the complete database schema and setup for the CRYB Discord-like platform, built with PostgreSQL, Prisma ORM, and TimescaleDB for analytics.

## Features

### Core Discord-like Features
- **User Management**: Complete user profiles with discriminators, presence tracking, and premium types
- **Server System**: Guilds with roles, permissions, channels, and member management
- **Messaging**: Rich messages with attachments, embeds, reactions, and threading
- **Voice System**: Voice states, channel management, and session tracking
- **Friend System**: Friend requests, blocking, and relationship management
- **Direct Messages**: Private and group messaging channels

### Advanced Features
- **Real-time Analytics**: TimescaleDB integration for message, voice, and server metrics
- **Audit Logging**: Complete server action tracking
- **Custom Emojis & Stickers**: Server-specific media content
- **Search Optimization**: Full-text search indexes for messages
- **Performance Monitoring**: Built-in database health checking

## Database Schema

### Primary Models

#### Users
```typescript
model User {
  id              String
  username        String
  discriminator   String    // #0001-9999
  displayName     String
  avatar          String?
  banner          String?
  bio             String?
  pronouns        String?
  premiumType     PremiumType
  presence        UserPresence?
  // ... relationships
}
```

#### Servers (Guilds)
```typescript
model Server {
  id              String
  name            String
  description     String?
  icon            String?
  banner          String?
  ownerId         String
  features        Json      // Discord-like features array
  verificationLevel Int
  channels        Channel[]
  members         ServerMember[]
  roles           Role[]
  // ... additional fields
}
```

#### Channels
```typescript
model Channel {
  id              String
  serverId        String?   // Null for DM channels
  name            String
  type            ChannelType
  bitrate         Int?      // For voice channels
  userLimit       Int?      // For voice channels
  messages        Message[]
  voiceStates     VoiceState[]
  // ... additional fields
}
```

#### Messages
```typescript
model Message {
  id              String
  channelId       String
  userId          String
  content         String
  timestamp       DateTime
  attachments     MessageAttachment[]
  embeds          MessageEmbed[]
  reactions       Reaction[]
  // ... additional fields
}
```

### Analytics Models (TimescaleDB)

#### Message Analytics
```typescript
model MessageAnalytics {
  serverId        String?
  channelId       String
  userId          String
  messageCount    Int
  characterCount  Int
  timestamp       DateTime  // Partitioned by time
}
```

#### Voice Analytics
```typescript
model VoiceAnalytics {
  serverId        String?
  channelId       String
  userId          String
  sessionDuration Int       // in seconds
  timestamp       DateTime  // Partitioned by time
}
```

## Setup

### Prerequisites
- PostgreSQL 14+ with TimescaleDB extension (optional but recommended)
- Node.js 18+
- npm or pnpm

### Environment Variables
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cryb_platform"
```

### Installation

1. **Automated Setup** (Recommended)
```bash
cd packages/database
chmod +x setup.sh
./setup.sh
```

2. **Manual Setup**
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Setup TimescaleDB (if available)
npm run db:timescale

# Seed database (optional)
npm run db:seed
```

## Scripts

### Database Operations
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Create and apply new migration
- `npm run db:migrate:deploy` - Apply pending migrations
- `npm run db:push` - Push schema changes directly
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and seed

### Seeding
- `npm run db:seed` - Default seed (100 users, 10 servers)
- `npm run db:seed:small` - Small dataset for development
- `npm run db:seed:large` - Large dataset for performance testing

### Maintenance
- `./backup.sh` - Create compressed database backup
- `./monitor.sh` - Check database health and performance

## TimescaleDB Integration

TimescaleDB provides optimized time-series data storage for analytics:

### Hypertables
- **MessageAnalytics**: Partitioned by day, compressed after 7 days
- **VoiceAnalytics**: Partitioned by day, compressed after 7 days  
- **ServerAnalytics**: Partitioned by hour, compressed after 3 days

### Retention Policies
- Message analytics: 90 days
- Voice analytics: 60 days
- Server analytics: 30 days
- System metrics: 14 days

### Continuous Aggregates
- Hourly server activity summaries
- Daily user engagement metrics
- Real-time dashboard data

## Performance Optimizations

### Indexes
- **Full-text search**: GIN indexes on message content
- **Composite indexes**: Multi-column indexes for complex queries
- **Partial indexes**: Conditional indexes for filtered queries
- **JSON indexes**: GIN indexes for JSON field queries

### Query Patterns
```sql
-- Find active users in a server
SELECT u.*, up.status 
FROM "User" u
JOIN "ServerMember" sm ON u.id = sm."userId"
LEFT JOIN "UserPresence" up ON u.id = up."userId"
WHERE sm."serverId" = $1 AND up.status != 'OFFLINE';

-- Get message analytics for last 24 hours
SELECT 
  date_trunc('hour', timestamp) as hour,
  SUM("messageCount") as messages,
  COUNT(DISTINCT "userId") as unique_users
FROM "MessageAnalytics"
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND "serverId" = $1
GROUP BY hour
ORDER BY hour;
```

### Connection Pooling
Configure connection pooling in production:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/cryb_platform?pgbouncer=true&connection_limit=20"
```

## Monitoring

### Health Checks
```bash
# Quick health check
./monitor.sh

# Detailed performance metrics
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Key Metrics to Monitor
- Connection count and pooling efficiency
- Query performance and slow query log
- Index usage and table scan ratios
- TimescaleDB chunk statistics
- Cache hit ratios

## Backup and Recovery

### Automated Backups
```bash
# Create backup
./backup.sh

# Set up automated daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Point-in-Time Recovery
```bash
# Restore from backup
psql $DATABASE_URL < backup_file.sql

# Restore specific timestamp (requires WAL archiving)
pg_restore -d $DATABASE_URL -t "2024-01-01 12:00:00" backup_file
```

## Production Deployment

### AWS RDS Setup
1. Create PostgreSQL 14+ RDS instance
2. Enable TimescaleDB extension
3. Configure parameter group for performance
4. Set up read replicas for scaling
5. Configure automated backups and snapshots

### Recommended Settings
```sql
-- PostgreSQL configuration for production
shared_preload_libraries = 'timescaledb'
max_connections = 200
shared_buffers = '1GB'
effective_cache_size = '4GB'
work_mem = '16MB'
maintenance_work_mem = '256MB'
random_page_cost = 1.1
effective_io_concurrency = 200
```

## Troubleshooting

### Common Issues

**Connection Issues**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check connection limits
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Performance Issues**
```bash
# Analyze query performance
EXPLAIN ANALYZE SELECT ...;

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

**TimescaleDB Issues**
```bash
# Check hypertables
SELECT hypertable_name, num_chunks 
FROM timescaledb_information.hypertables;

# Verify compression
SELECT hypertable_name, compression_enabled 
FROM timescaledb_information.compression_settings;
```

## Development

### Adding New Models
1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name describe_change`
3. Update seed data if needed
4. Add to analytics if time-series data

### Schema Changes
```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Apply in production
npx prisma migrate deploy
```

### Testing
```bash
# Reset database with test data
npm run db:reset

# Run with small dataset for testing
npm run db:seed:small
```

## Support

For issues and questions:
- Check the troubleshooting section above
- Review PostgreSQL and TimescaleDB documentation
- Monitor database logs for errors
- Use Prisma Studio for data inspection

## License

This database schema is part of the CRYB Platform project.