const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Use the JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'cryb_development_jwt_secret_key_for_secure_authentication_minimum_64_characters_required_for_production_security_2024';

// Create a test token for our test user with correct ID
const payload = {
  userId: 'cmflubch9000011zcj4av40x1',
  sessionId: crypto.randomUUID(),
  email: 'discordtest@cryb.ai',
  walletAddress: null,
  isVerified: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
  aud: 'cryb-users',
  iss: 'cryb-platform'
};

const token = jwt.sign(payload, JWT_SECRET);

console.log('Generated token:', token);
console.log('Payload:', payload);

// Save to file for reuse
const fs = require('fs');
fs.writeFileSync('/tmp/test-token.json', JSON.stringify({
  token,
  payload,
  created: new Date().toISOString()
}, null, 2));

console.log('Token saved to /tmp/test-token.json');