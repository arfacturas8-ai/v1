const { prisma } = require('@cryb/database');
const bcrypt = require('bcrypt');

async function updateDemoUser() {
  try {
    console.log('Updating demo user with proper password hash...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('Demo123!@#', 10);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: 'demo@cryb.ai' }
    });
    
    if (!user) {
      // Create the user
      user = await prisma.user.create({
        data: {
          email: 'demo@cryb.ai',
          username: 'DemoUser',
          displayName: 'Demo User',
          passwordHash: passwordHash,
          isVerified: true
        }
      });
      console.log('✅ Created demo user with password');
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { email: 'demo@cryb.ai' },
        data: {
          passwordHash: passwordHash,
          displayName: user.displayName || 'Demo User',
          isVerified: true
        }
      });
      console.log('✅ Updated demo user password');
    }
    
    console.log('\n📝 Demo User Credentials:');
    console.log('Email: demo@cryb.ai');
    console.log('Username:', user.username);
    console.log('Password: Demo123!@#');
    console.log('\nUser ID:', user.id);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoUser();