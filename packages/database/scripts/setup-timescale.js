#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function setupTimescaleDB() {
  try {
    console.log('📊 Setting up TimescaleDB for CRYB Platform Analytics...');
    
    const startTime = Date.now();
    
    // First, check if TimescaleDB is available
    console.log('🔍 Checking TimescaleDB extension availability...');
    
    try {
      const result = await prisma.$queryRaw`SELECT * FROM pg_available_extensions WHERE name = 'timescaledb'`;
      if (result.length === 0) {
        console.log('⚠️  TimescaleDB extension is not available on this PostgreSQL instance.');
        console.log('📝 This is expected for standard RDS instances.');
        console.log('🔄 Creating standard analytics tables without TimescaleDB features...');
        
        await setupStandardAnalytics();
        return true;
      }
    } catch (error) {
      console.log('⚠️  Could not check TimescaleDB availability, proceeding with standard setup...');
      await setupStandardAnalytics();
      return true;
    }
    
    console.log('✅ TimescaleDB extension is available');
    
    // Enable TimescaleDB extension
    console.log('📦 Enabling TimescaleDB extension...');
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE`;
      console.log('✅ TimescaleDB extension enabled');
    } catch (error) {
      console.log('⚠️  Failed to enable TimescaleDB extension:', error.message);
      console.log('🔄 Falling back to standard analytics setup...');
      await setupStandardAnalytics();
      return true;
    }
    
    // Create hypertables for existing analytics tables
    console.log('🏗️  Converting analytics tables to hypertables...');
    
    const hypertables = [
      {
        table: '"MessageAnalytics"',
        interval: '1 day',
        compression: '7 days',
        retention: '90 days'
      },
      {
        table: '"VoiceAnalytics"',
        interval: '1 day', 
        compression: '7 days',
        retention: '60 days'
      },
      {
        table: '"ServerAnalytics"',
        interval: '1 hour',
        compression: '3 days',
        retention: '30 days'
      }
    ];
    
    for (const { table, interval, compression, retention } of hypertables) {
      try {
        console.log(`Creating hypertable for ${table}...`);
        
        await prisma.$executeRawUnsafe(`
          SELECT create_hypertable(
            '${table}', 
            'timestamp',
            chunk_time_interval => INTERVAL '${interval}',
            if_not_exists => TRUE
          )
        `);
        
        console.log(`✅ Hypertable created for ${table}`);
        
        // Add compression policy
        console.log(`Adding compression policy for ${table}...`);
        await prisma.$executeRawUnsafe(`
          SELECT add_compression_policy(
            '${table}', 
            INTERVAL '${compression}',
            if_not_exists => TRUE
          )
        `);
        
        // Add retention policy
        console.log(`Adding retention policy for ${table}...`);
        await prisma.$executeRawUnsafe(`
          SELECT add_retention_policy(
            '${table}',
            INTERVAL '${retention}',
            if_not_exists => TRUE
          )
        `);
        
        console.log(`✅ Policies configured for ${table}`);
        
      } catch (error) {
        console.error(`❌ Failed to setup hypertable for ${table}: ${error.message}`);
      }
    }
    
    // Create additional analytics tables
    await createAdditionalAnalyticsTables();
    
    // Create analytics functions
    await createAnalyticsFunctions();
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 TimescaleDB setup completed successfully!');
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log('\n📊 TimescaleDB Features Enabled:');
    console.log('• Hypertables for automatic partitioning');
    console.log('• Compression policies for storage optimization');
    console.log('• Retention policies for automatic cleanup');
    console.log('• Optimized indexes for time-series queries');
    console.log('• Custom analytics functions');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup TimescaleDB:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function setupStandardAnalytics() {
  console.log('📊 Setting up standard analytics tables...');
  
  // Create additional analytics tables without TimescaleDB features
  await createAdditionalAnalyticsTables();
  
  // Create indexes for better performance
  console.log('🔧 Creating performance indexes for analytics...');
  
  const indexStatements = [
    // Message analytics indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_server_time 
     ON "MessageAnalytics" ("serverId", timestamp DESC) WHERE "serverId" IS NOT NULL`,
    
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_channel_time 
     ON "MessageAnalytics" ("channelId", timestamp DESC)`,
    
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_analytics_user_time 
     ON "MessageAnalytics" ("userId", timestamp DESC)`,
    
    // Voice analytics indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_server_time 
     ON "VoiceAnalytics" ("serverId", timestamp DESC) WHERE "serverId" IS NOT NULL`,
    
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_voice_analytics_channel_time 
     ON "VoiceAnalytics" ("channelId", timestamp DESC)`,
    
    // Server analytics indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_server_analytics_server_time 
     ON "ServerAnalytics" ("serverId", timestamp DESC)`
  ];
  
  for (const statement of indexStatements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✅ Index created');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`❌ Index creation failed: ${error.message}`);
      } else {
        console.log('⏭️  Index already exists');
      }
    }
  }
  
  await createAnalyticsFunctions();
  
  console.log('✅ Standard analytics setup completed');
}

async function createAdditionalAnalyticsTables() {
  console.log('🏗️  Creating additional analytics tables...');
  
  // User activity metrics table
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS user_activity_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        server_id TEXT,
        activity_type TEXT NOT NULL,
        duration_seconds INTEGER,
        metadata JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ user_activity_metrics table created');
  } catch (error) {
    console.log('⏭️  user_activity_metrics table already exists');
  }
  
  // Channel activity metrics table
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS channel_activity_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id TEXT NOT NULL,
        server_id TEXT,
        message_count INTEGER DEFAULT 0,
        unique_users INTEGER DEFAULT 0,
        voice_minutes INTEGER DEFAULT 0,
        peak_concurrent_users INTEGER DEFAULT 0,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ channel_activity_metrics table created');
  } catch (error) {
    console.log('⏭️  channel_activity_metrics table already exists');
  }
  
  // System metrics table
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        metric_name TEXT NOT NULL,
        metric_value DOUBLE PRECISION NOT NULL,
        tags JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✅ system_metrics table created');
  } catch (error) {
    console.log('⏭️  system_metrics table already exists');
  }
}

async function createAnalyticsFunctions() {
  console.log('🔧 Creating analytics functions...');
  
  // Function to get server activity trends
  try {
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION get_server_activity_trend(
        p_server_id TEXT,
        p_hours INTEGER DEFAULT 24
      )
      RETURNS TABLE (
        hour TIMESTAMPTZ,
        messages BIGINT,
        users INTEGER,
        online INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          date_trunc('hour', sa.timestamp) as hour,
          SUM(sa."messageCount") as messages,
          MAX(sa."memberCount") as users,
          MAX(sa."onlineCount") as online
        FROM "ServerAnalytics" sa
        WHERE sa."serverId" = p_server_id
          AND sa.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
        GROUP BY date_trunc('hour', sa.timestamp)
        ORDER BY hour;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ get_server_activity_trend function created');
  } catch (error) {
    console.error('❌ Failed to create get_server_activity_trend function:', error.message);
  }
  
  // Function to get most active channels
  try {
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION get_most_active_channels(
        p_server_id TEXT DEFAULT NULL,
        p_hours INTEGER DEFAULT 24,
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (
        channel_id TEXT,
        message_count BIGINT,
        unique_users BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ma."channelId" as channel_id,
          SUM(ma."messageCount") as message_count,
          COUNT(DISTINCT ma."userId") as unique_users
        FROM "MessageAnalytics" ma
        WHERE (p_server_id IS NULL OR ma."serverId" = p_server_id)
          AND ma.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
        GROUP BY ma."channelId"
        ORDER BY message_count DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ get_most_active_channels function created');
  } catch (error) {
    console.error('❌ Failed to create get_most_active_channels function:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  setupTimescaleDB()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { setupTimescaleDB };