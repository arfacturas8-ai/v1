#!/usr/bin/env node

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE = 'http://localhost:3002';

async function testUploads() {
  try {
    console.log('🔐 Creating test user and getting token...');
    
    // Create a unique test user
    const timestamp = Date.now();
    const username = `uploadtest_${timestamp}`;
    const email = `uploadtest_${timestamp}@test.local`;
    
    const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, {
      username,
      email,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      displayName: 'Upload Test User'
    });
    
    console.log('✅ Test user created:', registerResponse.data.user.username);
    
    // Login to get token 
    const loginResponse = await axios.post(`${API_BASE}/api/v1/auth/login`, {
      identifier: email,
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.accessToken;
    const user = loginResponse.data.user;
    
    console.log('✅ JWT token generated successfully');
    console.log(`👤 User: ${user.username} (${user.id})`);
    console.log(`🎫 Token: ${token.substring(0, 20)}...`);
    
    // Create test file
    const testContent = `Hello from CRYB Platform - File Upload Test
User: ${user.username}
Timestamp: ${new Date().toISOString()}`;
    
    fs.writeFileSync('/tmp/test-upload.txt', testContent);
    
    console.log('\n📤 Testing file upload endpoints...');
    
    // Test upload endpoints
    const endpoints = [
      { path: '/api/v1/uploads/media', name: 'Media Upload' },
      { path: '/api/v1/uploads/attachment', name: 'Attachment Upload' },
      { path: '/api/v1/uploads/avatar', name: 'Avatar Upload' }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint.name} (${endpoint.path}):`);
      
      try {
        // Create form data
        const form = new FormData();
        form.append('file', fs.createReadStream('/tmp/test-upload.txt'));
        
        const response = await axios.post(`${API_BASE}${endpoint.path}`, form, {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...form.getHeaders()
          },
          timeout: 10000
        });
        
        console.log('✅ Success:', response.data);
        
      } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
      }
    }
    
    // Test file listing
    console.log('\n📋 Testing file listing:');
    
    try {
      const listResponse = await axios.get(`${API_BASE}/api/v1/uploads/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ File listing:', listResponse.data);
      
    } catch (error) {
      console.log('❌ List error:', error.response?.data || error.message);
    }
    
    // Cleanup
    try {
      fs.unlinkSync('/tmp/test-upload.txt');
    } catch (e) {}
    
    console.log('\n✅ Upload testing complete');
    
  } catch (error) {
    console.error('❌ Main error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testUploads();