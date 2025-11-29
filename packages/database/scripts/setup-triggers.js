#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function setupTimestampTriggers() {
  try {
    console.log('🕐 Setting up automatic updated_at timestamp triggers...');
    
    const startTime = Date.now();
    
    // First, create the trigger function
    console.log('Creating trigger function...');
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // List of tables that have updatedAt fields according to the Prisma schema
    const tablesWithUpdatedAt = [
      'User',
      'Session', 
      'Server',
      'Channel',
      'Message',
      'Thread',
      'Post',
      'Comment',
      'Community',
      'Role',
      'Notification',
      'UserPresence',
      'Friendship',
      'VoiceState',
      'AuditLog',
      'ServerAnalytics'
    ];
    
    console.log(`📊 Setting up triggers for ${tablesWithUpdatedAt.length} tables...`);
    
    let successCount = 0;
    
    for (const tableName of tablesWithUpdatedAt) {
      try {
        const triggerName = `set_timestamp_${tableName.toLowerCase()}`;
        
        console.log(`Creating trigger for ${tableName}...`);
        
        // Drop trigger if exists
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${triggerName} ON "${tableName}"`);
        
        // Create new trigger
        await prisma.$executeRawUnsafe(`
          CREATE TRIGGER ${triggerName}
            BEFORE UPDATE ON "${tableName}"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp()
        `);
        
        successCount++;
        console.log(`✅ Trigger created for ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Failed to create trigger for ${tableName}: ${error.message}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n🎉 Timestamp triggers setup completed!');
    console.log(`✅ Created: ${successCount} triggers`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    
    console.log('\n📝 Trigger Function Details:');
    console.log('• Function: trigger_set_timestamp()');
    console.log('• Purpose: Automatically updates updated_at field on record updates');
    console.log('• Trigger Type: BEFORE UPDATE FOR EACH ROW');
    console.log('• Language: PL/pgSQL');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup timestamp triggers:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupTimestampTriggers()
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { setupTimestampTriggers };