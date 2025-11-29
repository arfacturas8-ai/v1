const { prisma } = require('@cryb/database');
const bcrypt = require('bcrypt');

async function createTestUser() {
  console.log('👤 Creating Discord test user for Socket.IO testing...');
  
  // Using shared prisma instance from @cryb/database

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'discordtest@test.com' }
    });

    if (existing) {
      console.log('✅ Discord test user already exists:', existing.username);
      console.log('   Email:', existing.email);
      console.log('   User ID:', existing.id);
      console.log('   Password: TestPassword123!');
      return existing;
    }

    // Create the user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const user = await prisma.user.create({
      data: {
        username: 'discordtest',
        displayName: 'Discord Test User',
        email: 'discordtest@test.com',
        passwordHash: hashedPassword,
        isEmailVerified: true,
        profile: {
          create: {
            bio: 'Test user for Socket.IO functionality',
            theme: 'dark'
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log('✅ Discord test user created successfully:');
    console.log('   Email:', user.email);
    console.log('   Username:', user.username);
    console.log('   User ID:', user.id);
    console.log('   Password: TestPassword123!');
    
    return user;

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ User already exists with that email/username');
      return await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'discordtest@test.com' },
            { username: 'discordtest' }
          ]
        }
      });
    }
    console.error('❌ Failed to create Discord test user:', error);
    throw error;
  } finally {
    // Prisma connection is managed by @cryb/database
  }
}

createTestUser().catch(console.error);