// Simple test to debug JWT issues
const jwt = require('jsonwebtoken');

// Use the same secret from the API environment
const JWT_SECRET = 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';

// Create a simple test token
const payload = {
  userId: 'test-user-123',
  sessionId: 'test-session-456',
  email: 'test@cryb.ai',
  isVerified: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  aud: 'cryb-users',
  iss: 'cryb-platform'
};

console.log('Creating JWT token...');
const token = jwt.sign(payload, JWT_SECRET);
console.log('Token:', token);

// Verify the token immediately
console.log('\nVerifying token...');
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token verified successfully');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

// Test with an HTTP request
console.log('\nTesting token with API...');
const https = require('http');

const postData = JSON.stringify({});
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/v1/channels?serverId=test-server-123',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();