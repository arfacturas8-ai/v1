const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('@cryb/auth');

const prisma = new PrismaClient();

async function updateDemoUser() {
  try {
    console.log('Updating demo user password...');
    
    // Hash the password using the auth package
    const passwordHash = await hashPassword('Demo123!@#');
    
    // Update the demo user
    const user = await prisma.user.update({
      where: { email: 'demo@cryb.ai' },
      data: {
        passwordHash: passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true
      }
    });
    
    console.log('✅ Demo user password updated successfully!');
    console.log('\n📝 Demo User Credentials:');
    console.log('Email: demo@cryb.ai');
    console.log('Username: DemoUser');
    console.log('Password: Demo123!@#');
    console.log('\nUser details:', user);
    
  } catch (error) {
    console.error('Error updating demo user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoUser();