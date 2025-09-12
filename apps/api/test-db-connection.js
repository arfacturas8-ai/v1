#!/usr/bin/env node

// Simple database connection test without full server initialization
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://cryb_user:cryb_password@localhost:5433/cryb"
    }
  }
});

async function testDatabaseConnection() {
  console.log('🔄 Testing database connection...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Try to query Community table structure
    const communityCount = await prisma.community.count();
    console.log(`✅ Community table accessible. Found ${communityCount} communities`);
    
    // Test validation schema requirements
    console.log('\n📋 Testing Community model schema...');
    const communitySchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Community' 
      ORDER BY ordinal_position
    `;
    
    console.log('Community table schema:');
    communitySchema.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

testDatabaseConnection().catch(console.error);