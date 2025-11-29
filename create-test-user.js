const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@cryb/database');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Test123!@#', 10);
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@cryb.ai',
        username: 'testuser',
        displayName: 'Test User',
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        profile: {
          create: {
            bio: 'Test user for CRYB platform',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
          }
        }
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('Email: test@cryb.ai');
    console.log('Password: Test123!@#');
    console.log('Username:', user.username);
    console.log('User ID:', user.id);

    // Create another test user
    const user2 = await prisma.user.create({
      data: {
        email: 'demo@cryb.ai',
        username: 'demouser',
        displayName: 'Demo User',
        password: hashedPassword,
        emailVerified: true,
        isActive: true,
        profile: {
          create: {
            bio: 'Demo user for testing',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser'
          }
        }
      }
    });

    console.log('\n✅ Demo user created successfully!');
    console.log('Email: demo@cryb.ai');
    console.log('Password: Test123!@#');
    console.log('Username:', user2.username);
    console.log('User ID:', user2.id);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ Test users already exist');
      console.log('Email: test@cryb.ai');
      console.log('Password: Test123!@#');
      console.log('\nEmail: demo@cryb.ai');
      console.log('Password: Test123!@#');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();