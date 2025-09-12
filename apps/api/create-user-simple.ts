#!/usr/bin/env tsx

/**
 * Create test user directly using Prisma
 */

import { prisma } from '@cryb/database';

async function createTestUser() {
    console.log('🔄 Creating test user in database...');
    
    const userId = 'test-user-socket-auth-123';
    const sessionId = '9f524f8b-0178-411d-8806-b06f0cc9ec80';
    
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log(`   User ID: ${existingUser.id}`);
            console.log(`   Username: ${existingUser.username}`);
            console.log(`   Email: ${existingUser.email}`);
            
            // Check session
            const existingSession = await prisma.session.findUnique({
                where: { id: sessionId }
            });
            
            if (!existingSession) {
                // Create session
                await prisma.session.create({
                    data: {
                        id: sessionId,
                        userId: userId,
                        token: `session-token-${sessionId}`,
                        refreshToken: `refresh-token-${sessionId}`,
                        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                    }
                });
                console.log('✅ Created session for existing user');
            } else {
                console.log('✅ Session already exists');
            }
            
            return;
        }
        
        // Create user
        const newUser = await prisma.user.create({
            data: {
                id: userId,
                username: 'socketuser',
                email: 'sockettest@cryb.ai',
                displayName: 'Socket Test User',
                passwordHash: '$2b$10$dummyhashfortest1234567890123456789',
                avatar: 'https://via.placeholder.com/64/007acc/ffffff?text=ST',
                isVerified: true,
                bio: 'Test user for Socket.io authentication',
                lastSeenAt: new Date()
            }
        });
        
        console.log('✅ Test user created successfully!');
        console.log(`   User ID: ${newUser.id}`);
        console.log(`   Username: ${newUser.username}`);
        console.log(`   Email: ${newUser.email}`);
        
        // Create session
        await prisma.session.create({
            data: {
                id: sessionId,
                userId: userId,
                token: `session-token-${sessionId}`,
                refreshToken: `refresh-token-${sessionId}`,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        });
        
        console.log('✅ Test session created!');
        console.log(`   Session ID: ${sessionId}`);
        
        console.log('\n🎉 Database setup complete!');
        console.log('   Ready for Socket.io authentication testing');
        
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestUser().catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
});