#!/usr/bin/env tsx

/**
 * Test JWT token verification directly
 */

import dotenv from 'dotenv';
dotenv.config(); // Load .env file

import { verifyToken } from '@cryb/auth';

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItc29ja2V0LWF1dGgtMTIzIiwic2Vzc2lvbklkIjoiM2RmZDJiYmYtNDczNy00ZjY4LTg2ODgtMTViMDUzZDU3NzQ3IiwiZW1haWwiOiJzb2NrZXR0ZXN0QGNyeWIuYWkiLCJ3YWxsZXRBZGRyZXNzIjpudWxsLCJpc1ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTc1MzQ0NDksImV4cCI6MTc1NzUzNTM0OSwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.7bFM6r8yYiqRSpCrN-6YHux9zafOJ-6WUNuWz5kuDEY';

async function testTokenVerification() {
    console.log('🔧 Testing JWT token verification directly...');
    console.log('📝 Token length:', TEST_TOKEN.length);
    
    // Show token parts
    const parts = TEST_TOKEN.split('.');
    console.log('📄 Token parts:', parts.length);
    
    try {
        const payload = verifyToken(TEST_TOKEN);
        console.log('✅ Token verification SUCCESS!');
        console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    } catch (error) {
        console.log('❌ Token verification FAILED!');
        console.log('💥 Error:', error instanceof Error ? error.message : error);
        console.log('🔍 Error type:', typeof error);
        console.log('🔍 Error name:', error instanceof Error ? error.name : 'Unknown');
        
        if (error instanceof Error) {
            console.log('📚 Full error:', error);
        }
    }
    
    // Test environment variables
    console.log('\n🔧 Environment check:');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
    console.log('JWT_SECRET preview:', process.env.JWT_SECRET?.substring(0, 20) + '...');
    console.log('JWT_ISSUER:', process.env.JWT_ISSUER || 'default: cryb-platform');
    console.log('JWT_AUDIENCE:', process.env.JWT_AUDIENCE || 'default: cryb-users');
}

testTokenVerification().catch(console.error);