const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('🔧 Creating test user in database...');
  
  const testUserId = 'test-user-socket-123';
  const testUserData = {
    id: testUserId,
    username: 'sockettestuser',
    displayName: 'Socket Test User',
    email: 'sockettest@example.com',
    passwordHash: 'dummy_hash', // We don't need real password for socket testing
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    // First try to find if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.username);
      return existingUser;
    }

    // Create the user
    const user = await prisma.user.create({
      data: testUserData
    });

    console.log('✅ Test user created successfully:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Display Name:', user.displayName);
    
    return user;

  } catch (error) {
    // Check if it's a unique constraint error
    if (error.code === 'P2002') {
      console.log('⚠️ User with this username/email already exists, trying to find them...');
      
      try {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: testUserData.username },
              { email: testUserData.email }
            ]
          }
        });
        
        if (existingUser) {
          console.log('✅ Found existing user:', existingUser.username);
          return existingUser;
        }
      } catch (findError) {
        console.log('❌ Could not find existing user:', findError.message);
      }
    }

    console.error('❌ Failed to create test user:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const user = await createTestUser();
    console.log('\n✅ Test user is ready for Socket.io testing');
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTestUser };