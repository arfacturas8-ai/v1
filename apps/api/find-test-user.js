const { prisma } = require('@cryb/database');

async function findTestUser() {
  console.log('👤 Looking for test user...');
  
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'testuser' },
          { email: 'test@example.com' },
          { id: 'test-user-123' }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true
      }
    });

    if (user) {
      console.log('✅ Found test user:', user);
      return user;
    } else {
      console.log('❌ No test user found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error finding user:', error);
    return null;
  }
}

findTestUser().then(user => {
  if (user) {
    console.log('\n🔑 Use this user ID for token generation:', user.id);
  }
  process.exit(0);
}).catch(console.error);