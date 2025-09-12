#!/usr/bin/env tsx

/**
 * Generate a proper JWT token using the @cryb/auth package
 */

import { generateAccessToken } from '@cryb/auth';
import { randomUUID } from 'crypto';

async function main() {
    console.log('🔐 Generating proper JWT token using @cryb/auth package...');
    
    try {
        const testPayload = {
            userId: 'test-user-socket-auth-123',
            sessionId: randomUUID(),
            email: 'sockettest@cryb.ai',
            walletAddress: null,
            isVerified: true
        };
        
        console.log('\n📋 Token Payload:');
        console.log(JSON.stringify(testPayload, null, 2));
        
        const token = generateAccessToken(testPayload);
        
        console.log('\n🎫 Generated JWT Token:');
        console.log(token);
        
        console.log('\n📊 Token Info:');
        console.log(`   Length: ${token.length} characters`);
        console.log(`   User ID: ${testPayload.userId}`);
        console.log(`   Session ID: ${testPayload.sessionId}`);
        console.log(`   Email: ${testPayload.email}`);
        console.log(`   Verified: ${testPayload.isVerified}`);
        
        // Save to file
        const fs = await import('fs');
        const testData = {
            token: token,
            payload: testPayload,
            usage: 'Copy the token above for Socket.io testing',
            expires: '15 minutes from generation'
        };
        
        fs.writeFileSync('./proper-token.json', JSON.stringify(testData, null, 2));
        
        console.log('\n✅ Token saved to proper-token.json');
        console.log('\n🧪 Testing Instructions:');
        console.log('   1. Copy the JWT token above');
        console.log('   2. Use this token to test Socket.io authentication');
        console.log('   3. Token expires in 15 minutes');
        
    } catch (error) {
        console.error('\n❌ Error generating token:', error instanceof Error ? error.message : error);
        console.error('Full error:', error);
        process.exit(1);
    }
}

main().catch(console.error);