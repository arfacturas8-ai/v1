#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

/**
 * Comprehensive database integrity verification
 * Checks constraints, relationships, and data consistency
 */
async function verifyDataIntegrity() {
  console.log('🔍 Starting CRYB Database Integrity Verification...\n');
  
  const issues = [];
  const warnings = [];
  let checksRun = 0;

  try {
    // 1. Check Primary Key Constraints
    console.log('1️⃣  Verifying Primary Key Constraints...');
    const tables = [
      'User', 'Server', 'Channel', 'Message', 'Role', 'ServerMember', 
      'Community', 'Post', 'Comment', 'Session', 'Token'
    ];
    
    for (const table of tables) {
      const query = `
        SELECT COUNT(*) as total_count, COUNT(DISTINCT id) as unique_count 
        FROM "${table}"
      `;
      
      const [result] = await prisma.$queryRawUnsafe(query);
      checksRun++;
      
      if (result.total_count !== result.unique_count) {
        issues.push(`❌ ${table}: Duplicate primary keys found`);
      }
    }
    
    // 2. Check Foreign Key Relationships
    console.log('2️⃣  Verifying Foreign Key Relationships...');
    
    // Check Server ownership
    const serverOwnerCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as orphaned_servers
      FROM "Server" s 
      WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."ownerId")
    `;
    checksRun++;
    
    if (Number(serverOwnerCheck[0].orphaned_servers) > 0) {
      issues.push(`❌ Found ${serverOwnerCheck[0].orphaned_servers} servers with invalid owner references`);
    }
    
    // Check Channel server relationships
    const channelServerCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as orphaned_channels
      FROM "Channel" c 
      WHERE c."serverId" IS NOT NULL 
      AND NOT EXISTS (SELECT 1 FROM "Server" s WHERE s.id = c."serverId")
    `;
    checksRun++;
    
    if (Number(channelServerCheck[0].orphaned_channels) > 0) {
      issues.push(`❌ Found ${channelServerCheck[0].orphaned_channels} channels with invalid server references`);
    }
    
    // Check Message relationships
    const messageCheck = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "Message" m WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = m."userId")) as orphaned_users,
        (SELECT COUNT(*) FROM "Message" m WHERE NOT EXISTS (SELECT 1 FROM "Channel" c WHERE c.id = m."channelId")) as orphaned_channels
    `;
    checksRun++;
    
    const messageResult = messageCheck[0];
    if (Number(messageResult.orphaned_users) > 0) {
      issues.push(`❌ Found ${messageResult.orphaned_users} messages with invalid user references`);
    }
    if (Number(messageResult.orphaned_channels) > 0) {
      issues.push(`❌ Found ${messageResult.orphaned_channels} messages with invalid channel references`);
    }
    
    // Check ServerMember relationships
    const memberCheck = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "ServerMember" sm WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = sm."userId")) as orphaned_users,
        (SELECT COUNT(*) FROM "ServerMember" sm WHERE NOT EXISTS (SELECT 1 FROM "Server" s WHERE s.id = sm."serverId")) as orphaned_servers
    `;
    checksRun++;
    
    const memberResult = memberCheck[0];
    if (Number(memberResult.orphaned_users) > 0) {
      issues.push(`❌ Found ${memberResult.orphaned_users} server members with invalid user references`);
    }
    if (Number(memberResult.orphaned_servers) > 0) {
      issues.push(`❌ Found ${memberResult.orphaned_servers} server members with invalid server references`);
    }
    
    // 3. Check Unique Constraints
    console.log('3️⃣  Verifying Unique Constraints...');
    
    // User unique constraints
    const userUniqueCheck = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) - COUNT(DISTINCT username) FROM "User" WHERE username IS NOT NULL) as duplicate_usernames,
        (SELECT COUNT(*) - COUNT(DISTINCT email) FROM "User" WHERE email IS NOT NULL) as duplicate_emails,
        (SELECT COUNT(*) - COUNT(DISTINCT "walletAddress") FROM "User" WHERE "walletAddress" IS NOT NULL) as duplicate_wallets
    `;
    checksRun++;
    
    const userUniqueResult = userUniqueCheck[0];
    if (Number(userUniqueResult.duplicate_usernames) > 0) {
      issues.push(`❌ Found ${userUniqueResult.duplicate_usernames} duplicate usernames`);
    }
    if (Number(userUniqueResult.duplicate_emails) > 0) {
      issues.push(`❌ Found ${userUniqueResult.duplicate_emails} duplicate emails`);
    }
    if (Number(userUniqueResult.duplicate_wallets) > 0) {
      issues.push(`❌ Found ${userUniqueResult.duplicate_wallets} duplicate wallet addresses`);
    }
    
    // Session unique constraints
    const sessionUniqueCheck = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) - COUNT(DISTINCT token) FROM "Session" WHERE token IS NOT NULL) as duplicate_tokens,
        (SELECT COUNT(*) - COUNT(DISTINCT "refreshToken") FROM "Session" WHERE "refreshToken" IS NOT NULL) as duplicate_refresh_tokens
    `;
    checksRun++;
    
    const sessionUniqueResult = sessionUniqueCheck[0];
    if (Number(sessionUniqueResult.duplicate_tokens) > 0) {
      issues.push(`❌ Found ${sessionUniqueResult.duplicate_tokens} duplicate session tokens`);
    }
    if (Number(sessionUniqueResult.duplicate_refresh_tokens) > 0) {
      issues.push(`❌ Found ${sessionUniqueResult.duplicate_refresh_tokens} duplicate refresh tokens`);
    }
    
    // 4. Check Data Consistency
    console.log('4️⃣  Verifying Data Consistency...');
    
    // Check if server member counts match actual members
    const memberCountCheck = await prisma.$queryRaw`
      SELECT s.id, s.name, 
             COALESCE(s."approximateMemberCount", 0) as reported_count,
             COUNT(sm.id) as actual_count
      FROM "Server" s 
      LEFT JOIN "ServerMember" sm ON s.id = sm."serverId" AND sm.pending = false
      GROUP BY s.id, s.name, s."approximateMemberCount"
      HAVING ABS(COALESCE(s."approximateMemberCount", 0) - COUNT(sm.id)) > 10
    `;
    checksRun++;
    
    if (memberCountCheck.length > 0) {
      warnings.push(`⚠️  Found ${memberCountCheck.length} servers with member count discrepancies`);
    }
    
    // Check message content length
    const messageLengthCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as long_messages
      FROM "Message" 
      WHERE LENGTH(content) > 2000
    `;
    checksRun++;
    
    if (Number(messageLengthCheck[0].long_messages) > 0) {
      warnings.push(`⚠️  Found ${messageLengthCheck[0].long_messages} messages exceeding Discord's 2000 character limit`);
    }
    
    // Check for users with invalid premium until dates
    const premiumCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as invalid_premium
      FROM "User" 
      WHERE "premiumUntil" IS NOT NULL AND "premiumUntil" < NOW()
      AND "premiumType" != 'NONE'
    `;
    checksRun++;
    
    if (Number(premiumCheck[0].invalid_premium) > 0) {
      warnings.push(`⚠️  Found ${premiumCheck[0].invalid_premium} users with expired premium but active premium type`);
    }
    
    // 5. Check Indexes Usage
    console.log('5️⃣  Verifying Index Usage...');
    
    // Check for unused indexes (this is informational)
    const indexUsageCheck = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
      AND n_distinct IS NOT NULL
      AND ABS(correlation) > 0.9
      ORDER BY ABS(correlation) DESC
      LIMIT 10
    `;
    checksRun++;
    
    if (indexUsageCheck.length > 0) {
      console.log(`ℹ️  Found ${indexUsageCheck.length} columns with high correlation (>0.9) - good for indexing`);
    }
    
    // 6. Check Performance Metrics
    console.log('6️⃣  Verifying Performance Metrics...');
    
    // Check table sizes
    const tableSizeCheck = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `;
    checksRun++;
    
    console.log('\n📊 Top 10 Largest Tables:');
    for (const table of tableSizeCheck) {
      console.log(`   ${table.tablename}: ${table.size}`);
    }
    
    // 7. Check Connection Health
    console.log('\n7️⃣  Verifying Connection Health...');
    
    const connectionCheck = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE waiting = true) as waiting_connections
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
    `;
    checksRun++;
    
    const connResult = connectionCheck[0];
    console.log(`   Total Connections: ${connResult.total_connections}`);
    console.log(`   Active: ${connResult.active_connections}`);
    console.log(`   Idle: ${connResult.idle_connections}`);
    console.log(`   Waiting: ${connResult.waiting_connections}`);
    
    if (Number(connResult.waiting_connections) > 0) {
      warnings.push(`⚠️  Found ${connResult.waiting_connections} connections waiting for resources`);
    }
    
    // 8. Final Statistics
    console.log('\n8️⃣  Database Statistics...');
    
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.server.count(), 
      prisma.channel.count(),
      prisma.message.count(),
      prisma.serverMember.count(),
      prisma.reaction.count(),
      prisma.voiceState.count(),
      prisma.session.count(),
    ]);
    
    const [userCount, serverCount, channelCount, messageCount, memberCount, reactionCount, voiceCount, sessionCount] = stats;
    
    console.log(`   Users: ${userCount.toLocaleString()}`);
    console.log(`   Servers: ${serverCount.toLocaleString()}`);
    console.log(`   Channels: ${channelCount.toLocaleString()}`);
    console.log(`   Messages: ${messageCount.toLocaleString()}`);
    console.log(`   Server Members: ${memberCount.toLocaleString()}`);
    console.log(`   Reactions: ${reactionCount.toLocaleString()}`);
    console.log(`   Voice States: ${voiceCount.toLocaleString()}`);
    console.log(`   Sessions: ${sessionCount.toLocaleString()}`);
    
    // Generate Report
    console.log('\n' + '='.repeat(60));
    console.log('📋 INTEGRITY VERIFICATION REPORT');
    console.log('='.repeat(60));
    console.log(`Checks performed: ${checksRun}`);
    console.log(`Issues found: ${issues.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (issues.length > 0) {
      console.log('\n🔥 CRITICAL ISSUES:');
      issues.forEach(issue => console.log(issue));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(warning));
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n🎉 DATABASE INTEGRITY VERIFICATION PASSED!');
      console.log('✅ All constraints and relationships are valid');
      console.log('✅ No data consistency issues found');
      console.log('✅ Database is ready for production use');
    }
    
    // Performance Recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    
    if (messageCount > 10000) {
      console.log('• Consider implementing message archiving for old messages');
    }
    
    if (Number(connResult.total_connections) > 15) {
      console.log('• Consider implementing connection pooling with PgBouncer');
    }
    
    if (userCount > 1000) {
      console.log('• Consider implementing read replicas for better read performance');
    }
    
    console.log('• Regular VACUUM and ANALYZE operations recommended');
    console.log('• Monitor slow queries with pg_stat_statements');
    console.log('• Consider implementing application-level caching');
    
    console.log('\n🏁 Verification completed successfully!');
    
    return {
      success: issues.length === 0,
      issues,
      warnings,
      stats: {
        users: userCount,
        servers: serverCount,
        channels: channelCount,
        messages: messageCount,
        members: memberCount,
        reactions: reactionCount,
        voiceStates: voiceCount,
        sessions: sessionCount,
      }
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return {
      success: false,
      error: error.message,
      issues,
      warnings
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  verifyDataIntegrity()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification error:', error);
      process.exit(1);
    });
}

module.exports = { verifyDataIntegrity };