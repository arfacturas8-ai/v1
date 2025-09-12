#!/usr/bin/env node
/**
 * Database Status and Analytics Overview
 * Quick health check and analytics summary for CRYB Platform
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function getDatabaseStatus() {
  try {
    console.log('🔍 CRYB Platform Database Status Report');
    console.log('==========================================');
    
    const startTime = Date.now();
    
    // Basic connection and counts
    const [userCount, serverCount, channelCount, messageCount, postCount] = await Promise.all([
      prisma.user.count(),
      prisma.server.count(),
      prisma.channel.count(),
      prisma.message.count(),
      prisma.post.count()
    ]);
    
    const connectionTime = Date.now() - startTime;
    
    console.log(`\n📊 Core Statistics (Query time: ${connectionTime}ms)`);
    console.log(`├── Users: ${userCount.toLocaleString()}`);
    console.log(`├── Servers: ${serverCount.toLocaleString()}`);
    console.log(`├── Channels: ${channelCount.toLocaleString()}`);
    console.log(`├── Messages: ${messageCount.toLocaleString()}`);
    console.log(`└── Posts: ${postCount.toLocaleString()}`);
    
    // Recent activity analysis
    const recentActivity = await prisma.$queryRaw`
      SELECT 
        'messages' as type,
        COUNT(*) as count
      FROM "Message" 
      WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT 
        'users_joined' as type,
        COUNT(*) as count
      FROM "ServerMember" 
      WHERE "joinedAt" >= NOW() - INTERVAL '24 hours'
      UNION ALL
      SELECT 
        'posts' as type,
        COUNT(*) as count
      FROM "Post" 
      WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
    `;
    
    console.log(`\n📈 24-Hour Activity`);
    recentActivity.forEach(activity => {
      const label = activity.type.replace('_', ' ').toUpperCase();
      console.log(`├── ${label}: ${parseInt(activity.count).toLocaleString()}`);
    });
    
    // Analytics tables status
    const analyticsStats = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "MessageAnalytics"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "VoiceAnalytics"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM "ServerAnalytics"`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM user_activity_metrics`,
    ]);
    
    console.log(`\n📊 Analytics Data`);
    console.log(`├── Message Analytics: ${parseInt(analyticsStats[0][0].count).toLocaleString()}`);
    console.log(`├── Voice Analytics: ${parseInt(analyticsStats[1][0].count).toLocaleString()}`);
    console.log(`├── Server Analytics: ${parseInt(analyticsStats[2][0].count).toLocaleString()}`);
    console.log(`└── User Activity: ${parseInt(analyticsStats[3][0].count).toLocaleString()}`);
    
    // Most active server analysis
    const mostActiveServer = await prisma.server.findFirst({
      orderBy: { members: { _count: 'desc' } },
      include: {
        members: { take: 1 },
        channels: { take: 1 },
        _count: { select: { members: true, channels: true } }
      }
    });
    
    if (mostActiveServer) {
      console.log(`\n🏆 Most Active Server`);
      console.log(`├── Name: ${mostActiveServer.name}`);
      console.log(`├── Members: ${mostActiveServer._count.members.toLocaleString()}`);
      console.log(`└── Channels: ${mostActiveServer._count.channels.toLocaleString()}`);
    }
    
    // Database health indicators
    const healthChecks = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('Message', 'User', 'Server', 'MessageAnalytics')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;
    
    console.log(`\n💾 Storage Overview`);
    healthChecks.forEach(table => {
      console.log(`├── ${table.tablename}: ${table.size}`);
    });
    
    // Performance test
    const perfStart = Date.now();
    const complexQuery = await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, displayName: true } },
        channel: { 
          select: { 
            name: true, 
            server: { select: { name: true } }
          } 
        },
        reactions: { take: 5 }
      }
    });
    const perfTime = Date.now() - perfStart;
    
    console.log(`\n⚡ Performance Test`);
    console.log(`├── Complex query (10 messages with relations): ${perfTime}ms`);
    console.log(`└── Average per message: ${(perfTime/10).toFixed(1)}ms`);
    
    console.log(`\n✅ Database Status: HEALTHY`);
    console.log(`🕐 Report generated: ${new Date().toISOString()}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Database status check failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  getDatabaseStatus()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { getDatabaseStatus };