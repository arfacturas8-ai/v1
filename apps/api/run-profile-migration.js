#!/usr/bin/env node

/**
 * Database Migration Script for Enhanced User Profile System
 * 
 * This script runs the comprehensive database migration to add
 * all the new profile-related tables and features.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'cryb',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
};

async function runMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'enhanced-user-profile-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Running enhanced user profile migration...');
    console.log('⚠️  This migration will:');
    console.log('   - Add new columns to the User table');
    console.log('   - Create new profile-related tables');
    console.log('   - Add indexes for performance');
    console.log('   - Create triggers for automatic updates');
    console.log('   - Insert default achievements');
    console.log('   - Create privacy settings for existing users');

    // Confirm before running
    if (process.argv.includes('--force') || process.env.NODE_ENV === 'development') {
      console.log('🚀 Running migration...');
    } else {
      console.log('❌ Migration not run. Use --force flag to execute.');
      process.exit(0);
    }

    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');

    // Verify the migration by checking if new tables exist
    console.log('🔍 Verifying migration...');
    
    const tableChecks = [
      'UserProfile',
      'UserAchievement', 
      'Achievement',
      'UserActivityTimeline',
      'UserFollow',
      'UserBlocked',
      'UserPrivacySettings',
      'UserStatistics'
    ];

    for (const tableName of tableChecks) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table "${tableName}" created successfully`);
      } else {
        console.log(`❌ Table "${tableName}" not found`);
      }
    }

    // Check if new User columns were added
    const userColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('location', 'website', 'occupation', 'education', 'interests', 'socialLinks', 'privacySettings', 'profileViews', 'followersCount', 'followingCount', 'achievementPoints', 'profileCompleteness')
    `);

    console.log(`✅ Added ${userColumns.rows.length} new columns to User table`);

    // Check achievements
    const achievementCount = await client.query('SELECT COUNT(*) FROM "Achievement"');
    console.log(`✅ Inserted ${achievementCount.rows[0].count} default achievements`);

    // Check if existing users got default settings
    const userCount = await client.query('SELECT COUNT(*) FROM "User"');
    const privacySettingsCount = await client.query('SELECT COUNT(*) FROM "UserPrivacySettings"');
    const profileCount = await client.query('SELECT COUNT(*) FROM "UserProfile"');

    console.log(`📊 Migration Summary:`);
    console.log(`   - Total users: ${userCount.rows[0].count}`);
    console.log(`   - Privacy settings created: ${privacySettingsCount.rows[0].count}`);
    console.log(`   - User profiles created: ${profileCount.rows[0].count}`);

    console.log('🎉 Enhanced User Profile System migration completed successfully!');
    console.log('');
    console.log('📚 New API endpoints available:');
    console.log('   - GET/PUT /api/v1/users/:userId/profile');
    console.log('   - POST/DELETE /api/v1/users/:userId/follow');
    console.log('   - GET /api/v1/users/search');
    console.log('   - GET /api/v1/users/:userId/activity');
    console.log('   - GET/PUT /api/v1/users/:userId/achievements');
    console.log('   - POST /api/v1/users/:userId/avatar');
    console.log('   - PUT /api/v1/users/:userId/privacy');
    console.log('   - POST/DELETE /api/v1/users/:userId/block');
    console.log('   - GET /api/v1/users/blocked');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    try {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Handle command line arguments
if (require.main === module) {
  console.log('🚀 Enhanced User Profile System Migration');
  console.log('=========================================');
  
  if (process.argv.includes('--help')) {
    console.log('Usage: node run-profile-migration.js [--force]');
    console.log('');
    console.log('Options:');
    console.log('  --force    Run migration without confirmation');
    console.log('  --help     Show this help message');
    process.exit(0);
  }

  runMigration().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };