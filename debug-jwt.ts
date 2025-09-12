#!/usr/bin/env node

/**
 * Debug JWT token verification directly
 * This will help identify why authentication is failing
 */

import { verifyToken, decodeToken } from './packages/auth/src/jwt';

const COMPLETE_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZkNm9uNzEwMDByaXZ0Y2RsbGRqNzBiIiwic2Vzc2lvbklkIjoiNzhhYjFjYzItZWM0MS00MWFlLTk2MmUtYzczODlhOTFmZTRlIiwiZW1haWwiOiJmcmVzaHNvY2tldHRlc3Q5OTlAdGVzdC5sb2NhbCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI0OGYwODIxZC1lOTZhLTQ3ZDktOTNkYy0yMzc0ZGE4OGU1MDkiLCJpYXQiOjE3NTc0NjE5NTAsImV4cCI6MTc1NzQ2Mjg1MCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.irBVUSM78Rah-ZvOIquXXDmi59m3Lkn4c4s6W6fSWFU';

console.log('🔍 JWT TOKEN DEBUGGING');
console.log('====================\n');

// Test 1: Decode token without verification
console.log('1️⃣ DECODING TOKEN (no verification)...');
try {
  const decoded = decodeToken(COMPLETE_JWT_TOKEN);
  if (decoded) {
    console.log('✅ Token decoded successfully:');
    console.log('   - User ID:', decoded.userId);
    console.log('   - Session ID:', decoded.sessionId);
    console.log('   - Email:', decoded.email);
    console.log('   - Issued at:', new Date(decoded.iat * 1000).toISOString());
    console.log('   - Expires at:', new Date(decoded.exp * 1000).toISOString());
    console.log('   - Current time:', new Date().toISOString());
    
    // Check if expired
    const isExpired = decoded.exp * 1000 < Date.now();
    console.log('   - Is expired:', isExpired ? '❌ YES' : '✅ NO');
    
    if (isExpired) {
      const expiredMinutesAgo = (Date.now() - (decoded.exp * 1000)) / 60000;
      console.log(`   - Expired ${expiredMinutesAgo.toFixed(1)} minutes ago`);
    } else {
      const expiresInMinutes = ((decoded.exp * 1000) - Date.now()) / 60000;
      console.log(`   - Expires in ${expiresInMinutes.toFixed(1)} minutes`);
    }
  } else {
    console.log('❌ Failed to decode token');
  }
} catch (error) {
  console.log('❌ Token decode error:', error.message);
}

console.log('\n2️⃣ VERIFYING TOKEN (with signature check)...');
try {
  const verified = verifyToken(COMPLETE_JWT_TOKEN);
  console.log('✅ Token verified successfully:');
  console.log('   - User ID:', verified.userId);
  console.log('   - Session ID:', verified.sessionId);
  console.log('   - Email:', verified.email);
  console.log('   - JWT ID:', verified.jti);
  console.log('   - Type:', verified.type || 'access');
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
  
  // Check common failure reasons
  if (error.message.includes('expired')) {
    console.log('   💡 Reason: Token has expired');
  } else if (error.message.includes('invalid signature')) {
    console.log('   💡 Reason: Invalid JWT signature (wrong secret?)');
  } else if (error.message.includes('malformed')) {
    console.log('   💡 Reason: Malformed token structure');
  } else {
    console.log('   💡 Reason: Unknown verification error');
  }
}

console.log('\n3️⃣ ENVIRONMENT CHECK...');
console.log('   - NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('   - JWT_SECRET set:', process.env.JWT_SECRET ? '✅ YES' : '❌ NO');
console.log('   - JWT_ISSUER:', process.env.JWT_ISSUER || 'cryb-platform (default)');
console.log('   - JWT_AUDIENCE:', process.env.JWT_AUDIENCE || 'cryb-users (default)');

console.log('\n🎯 JWT DEBUG COMPLETE!');