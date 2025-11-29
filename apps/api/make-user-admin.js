#!/usr/bin/env node

/**
 * Script to make a user an admin by updating their verification status and flags
 */

const { prisma } = require('@cryb/database');

async function makeUserAdmin(email) {
  try {
    console.log(`Making user with email ${email} an admin...`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return false;
    }
    
    // Update user to be verified and have admin flags
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        flags: 1, // Set admin flag bit
        publicFlags: 10 // Set high public flags
      }
    });
    
    console.log(`✅ User ${updatedUser.username} (${updatedUser.email}) is now an admin!`);
    console.log(`   - Verified: ${updatedUser.isVerified}`);
    console.log(`   - Flags: ${updatedUser.flags}`);
    console.log(`   - Public Flags: ${updatedUser.publicFlags}`);
    
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (process.argv.length < 3) {
  console.log('Usage: node make-user-admin.js <email>');
  process.exit(1);
}

const email = process.argv[2];
makeUserAdmin(email).then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});