#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing CRYB Platform Database Connection...');
    
    // Test basic connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ Database connection successful (${connectionTime}ms)`);
    
    // Get basic statistics
    const [userCount, serverCount, messageCount] = await Promise.all([
      prisma.user.count(),
      prisma.server.count(), 
      prisma.message.count()
    ]);
    
    console.log('\n📊 Database Statistics:');
    console.log(`Users: ${userCount}`);
    console.log(`Servers: ${serverCount}`);
    console.log(`Messages: ${messageCount}`);
    
    // Test a sample query for performance
    const queryStart = Date.now();
    const recentMessages = await prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true }
        },
        channel: {
          select: { name: true }
        }
      }
    });
    const queryTime = Date.now() - queryStart;
    
    console.log(`\n⚡ Sample query performance: ${queryTime}ms`);
    console.log(`Latest message: "${recentMessages[0]?.content?.substring(0, 50)}..." by ${recentMessages[0]?.user?.username}`);
    
    console.log('\n🎉 Database is healthy and ready!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { testDatabaseConnection };