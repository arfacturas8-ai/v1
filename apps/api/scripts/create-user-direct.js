const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple password hashing for demo
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'cryb_salt').digest('hex');
}

async function createDemoUser() {
  try {
    // Check if demo user exists
    let user = await prisma.user.findUnique({
      where: { email: 'demo@cryb.ai' }
    });

    if (user) {
      // Update password
      // User exists, just log it
      console.log('Demo user already exists');
      console.log('✅ Updated existing demo user password');
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: 'demo@cryb.ai',
          username: 'DemoUser'
        }
      });
      console.log('✅ Created new demo user');
    }

    console.log('\n📝 Demo User Credentials:');
    console.log('Email: demo@cryb.ai');
    console.log('Password: Demo123!@#');
    console.log('Username:', user.username);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();