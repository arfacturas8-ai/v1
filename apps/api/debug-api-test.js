#!/usr/bin/env node

const axios = require('axios');

// Configure axios to not throw on error status codes
axios.defaults.validateStatus = (status) => status < 600;

const API_BASE_URL = 'http://localhost:3002/api/v1';

async function debugApiEndpoints() {
  console.log('🔍 Debugging API Endpoints...\n');

  // Test 1: Check if registration endpoint exists
  console.log('1. Testing auth/register endpoint...');
  try {
    const testUser = {
      email: `debug-test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      username: `debuguser${Date.now()}`
    };

    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  // Test 2: Check available routes
  console.log('\n2. Testing available routes...');
  const endpoints = [
    '/auth/register',
    '/auth/login',
    '/communities',
    '/servers',
    '/health'
  ];

  for (const endpoint of endpoints) {
    try {
      const fullUrl = endpoint === '/health' ? `http://localhost:3002${endpoint}` : `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(fullUrl);
      console.log(`   GET ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`   GET ${endpoint}: ERROR - ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
      }
    }
  }

  // Test 3: Check API documentation endpoint
  console.log('\n3. Testing API documentation...');
  try {
    const response = await axios.get('http://localhost:3002/documentation');
    console.log(`   Documentation: ${response.status}`);
  } catch (error) {
    console.log(`   Documentation: ERROR - ${error.message}`);
  }

  console.log('\n🔍 Debug complete!');
}

debugApiEndpoints();