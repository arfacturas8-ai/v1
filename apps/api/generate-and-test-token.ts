#!/usr/bin/env tsx

/**
 * Generate and test JWT token in same context
 */

import dotenv from 'dotenv';
dotenv.config();

import { generateAccessToken, verifyToken } from '@cryb/auth';
import { randomUUID } from 'crypto';

async function main() {
    console.log('🔐 Generating and testing JWT token in same context...');
    
    // Generate token
    const testPayload = {
        userId: 'test-user-socket-auth-123',
        sessionId: randomUUID(),
        email: 'sockettest@cryb.ai',
        walletAddress: null,
        isVerified: true
    };
    
    console.log('\n📋 Generating with payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    const token = generateAccessToken(testPayload);
    
    console.log('\n🎫 Generated JWT Token:');
    console.log(token);
    
    // Test verification immediately
    console.log('\n🔧 Testing verification...');
    
    try {
        const verifiedPayload = verifyToken(token);
        console.log('✅ Token verification SUCCESS!');
        console.log('📋 Verified payload:', JSON.stringify(verifiedPayload, null, 2));
        
        console.log('\n🧪 Now testing with Socket.io client...');
        
        // Update test script with this token
        const fs = await import('fs');
        const testScript = fs.readFileSync('./test-socket-connection.js', 'utf8');
        const updatedScript = testScript.replace(
            /const TEST_TOKEN = '[^']+'/,
            `const TEST_TOKEN = '${token}'`
        );
        fs.writeFileSync('./test-socket-connection.js', updatedScript);
        
        console.log('✅ Updated test-socket-connection.js with fresh token');
        console.log('🚀 Token is ready for Socket.io testing!');
        
        return { token, payload: verifiedPayload };
        
    } catch (error) {
        console.log('❌ Token verification FAILED!');
        console.log('💥 Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}

main().catch(console.error);