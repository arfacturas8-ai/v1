const { prisma } = require('@cryb/database');

async function checkUserServerAccess() {
  const userId = 'cmfli232m00007r75206dsan1';
  const serverId = 'cmfluxcc800027me2b1o6mzhq';
  
  console.log('👤 Checking user server access...');
  console.log('🔍 User ID:', userId);
  console.log('🏠 Server ID:', serverId);
  
  try {
    // Check if user is a member of the server
    const membership = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          userId: userId,
          serverId: serverId
        }
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true
          }
        },
        server: {
          select: {
            name: true
          }
        }
      }
    });

    if (membership) {
      console.log('✅ User is a member of the server:', membership);
      return true;
    } else {
      console.log('❌ User is not a member of the server');
      
      // Let's add them as a member
      console.log('🏗️  Adding user as server member...');
      const newMembership = await prisma.serverMember.create({
        data: {
          userId: userId,
          serverId: serverId,
          joinedAt: new Date()
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true
            }
          },
          server: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log('✅ User added as server member:', newMembership);
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking server access:', error);
    
    // If membership already exists (unique constraint error)
    if (error.code === 'P2002') {
      console.log('✅ User is already a member of the server');
      return true;
    }
    
    return false;
  }
}

checkUserServerAccess().then(hasAccess => {
  console.log('\n🎯 User has server access:', hasAccess);
  process.exit(0);
}).catch(console.error);