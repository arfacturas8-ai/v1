#!/usr/bin/env node

const axios = require('axios');
const io = require('socket.io-client');
const fs = require('fs');

console.log('\n' + '='.repeat(60));
console.log('   CRYB PLATFORM - FINAL STATUS CHECK');
console.log('='.repeat(60) + '\n');

async function checkService(name, url) {
  try {
    await axios.get(url, { timeout: 3000 });
    console.log(`✅ ${name}: WORKING`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: DOWN (${error.message})`);
    return false;
  }
}

async function main() {
  const results = {
    services: {},
    features: {},
    overall: 0
  };

  // Check services
  console.log('CHECKING SERVICES:');
  console.log('-'.repeat(40));
  results.services.api = await checkService('API Backend', 'http://localhost:3001/health');
  results.services.web = await checkService('Web Frontend', 'http://localhost:3003');
  results.services.simpleSocket = await checkService('Simple Socket.IO', 'http://localhost:3010/socket.io/');
  
  // Check API features
  console.log('\nCHECKING API FEATURES:');
  console.log('-'.repeat(40));
  
  try {
    const posts = await axios.get('http://localhost:3001/api/v1/posts');
    console.log(`✅ Posts API: ${posts.data.data.total} posts`);
    results.features.posts = true;
  } catch (e) {
    console.log('❌ Posts API: Failed');
    results.features.posts = false;
  }

  try {
    const communities = await axios.get('http://localhost:3001/api/v1/communities');
    console.log(`✅ Communities API: ${communities.data.data.total} communities`);
    results.features.communities = true;
  } catch (e) {
    console.log('❌ Communities API: Failed');
    results.features.communities = false;
  }

  try {
    const login = await axios.post('http://localhost:3001/api/v1/auth/login', {
      username: 'testuser1734624001',
      password: 'Test123456!'
    });
    console.log(`✅ Authentication: Working (${login.data.data.user.username})`);
    results.features.auth = true;
    
    // Test protected route
    const profile = await axios.get('http://localhost:3001/api/v1/users/me', {
      headers: { Authorization: `Bearer ${login.data.data.tokens.accessToken}` }
    });
    console.log(`✅ Protected Routes: Working`);
    results.features.protected = true;
  } catch (e) {
    console.log('❌ Authentication: Failed');
    results.features.auth = false;
    results.features.protected = false;
  }

  // Check Socket.IO
  console.log('\nCHECKING SOCKET.IO:');
  console.log('-'.repeat(40));
  
  await new Promise(resolve => {
    const socket = io('http://localhost:3010', { 
      transports: ['websocket', 'polling'],
      timeout: 3000
    });
    
    socket.on('connect', () => {
      console.log('✅ Simple Socket.IO: Connected');
      results.features.socketio = true;
      socket.disconnect();
      resolve();
    });
    
    socket.on('connect_error', () => {
      console.log('❌ Simple Socket.IO: Failed to connect');
      results.features.socketio = false;
      resolve();
    });
    
    setTimeout(resolve, 3000);
  });

  // Check files
  console.log('\nCHECKING FILES:');
  console.log('-'.repeat(40));
  
  const apkPath = '/home/ubuntu/cryb-platform/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk';
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ Android APK: ${sizeMB} MB`);
    results.features.apk = true;
  } else {
    console.log('❌ Android APK: Not found');
    results.features.apk = false;
  }

  // Calculate overall percentage
  const totalChecks = Object.keys(results.services).length + Object.keys(results.features).length;
  const passed = Object.values(results.services).filter(v => v).length + 
                 Object.values(results.features).filter(v => v).length;
  results.overall = Math.round((passed / totalChecks) * 100);

  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL PLATFORM STATUS: ${results.overall}% FUNCTIONAL`);
  console.log('='.repeat(60) + '\n');

  return results;
}

main().catch(console.error);