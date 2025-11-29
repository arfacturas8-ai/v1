#!/usr/bin/env node

const jwt = require('jsonwebtoken');

// Read JWT secret from environment or use default
const JWT_SECRET = process.env.JWT_SECRET || 'your-256-bit-secret-here-replace-in-production-with-secure-random-key';

// Create a test user payload
const testUser = {
  userId: 'test-user-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user'
};

// Generate token
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated test token:', token);
console.log('Token payload:', testUser);

module.exports = { token, JWT_SECRET, testUser };
