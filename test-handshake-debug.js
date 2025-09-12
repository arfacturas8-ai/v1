#!/usr/bin/env node

/**
 * Debug Socket.io handshake and token extraction
 * This will help identify if the token is being extracted correctly
 */

const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3002';
const COMPLETE_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZkNm9uNzEwMDByaXZ0Y2RsbGRqNzBiIiwic2Vzc2lvbklkIjoiNzhhYjFjYzItZWM0MS00MWFlLTk2MmUtYzczODlhOTFmZTRlIiwiZW1haWwiOiJmcmVzaHNvY2tldHRlc3Q5OTlAdGVzdC5sb2NhbCIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiI0OGYwODIxZC1lOTZhLTQ3ZDktOTNkYy0yMzc0ZGE4OGU1MDkiLCJpYXQiOjE3NTc0NjE5NTAsImV4cCI6MTc1NzQ2Mjg1MCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.irBVUSM78Rah-ZvOIquXXDmi59m3Lkn4c4s6W6fSWFU';

console.log('🔍 Socket.io Handshake Debug');
console.log('============================\n');

// Test all possible token passing methods
const tests = [
  {
    name: 'auth object',
    config: {
      autoConnect: false,
      transports: ['polling'],
      upgrade: false,
      forceNew: true,
      timeout: 5000,
      auth: {
        token: COMPLETE_JWT_TOKEN
      }
    }
  },
  {
    name: 'query parameter', 
    config: {
      autoConnect: false,
      transports: ['polling'],
      upgrade: false,
      forceNew: true,
      timeout: 5000,
      query: {
        token: COMPLETE_JWT_TOKEN
      }
    }
  },
  {
    name: 'extraHeaders Authorization',
    config: {
      autoConnect: false,
      transports: ['polling'],
      upgrade: false,
      forceNew: true,
      timeout: 5000,
      extraHeaders: {
        Authorization: `Bearer ${COMPLETE_JWT_TOKEN}`
      }
    }
  }
];

let currentTest = 0;

function runNextTest() {
  if (currentTest >= tests.length) {
    console.log('\n🎯 ALL HANDSHAKE TESTS COMPLETED');
    console.log('   All token passing methods failed - this suggests:');
    console.log('   1. The server authentication middleware has an internal issue');
    console.log('   2. The token format/encoding is incorrect');
    console.log('   3. There is a middleware conflict or setup issue');
    console.log('\n💡 Recommendation: Check server logs for detailed authentication errors');
    process.exit(1);
  }

  const test = tests[currentTest];
  console.log(`\n--- TEST ${currentTest + 1}: Token via ${test.name} ---`);
  
  const socket = io(SERVER_URL, test.config);
  
  socket.on('connect', () => {
    console.log(`✅ SUCCESS: ${test.name} method works!`);
    console.log(`🔌 Socket ID: ${socket.id}`);
    console.log('🎉 Socket.io authentication is working!');
    
    socket.disconnect();
    process.exit(0);
  });
  
  socket.on('connect_error', (error) => {
    console.log(`❌ FAILED: ${test.name} method`);
    console.log(`   Error: ${error.message}`);
    
    socket.disconnect();
    currentTest++;
    
    setTimeout(() => {
      runNextTest();
    }, 1000);
  });
  
  socket.on('error', (error) => {
    console.log(`🚨 Socket error with ${test.name}:`, error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Disconnected ${test.name}:`, reason);
  });
  
  console.log(`🚀 Attempting connection with ${test.name}...`);
  socket.connect();
}

// Start testing
runNextTest();