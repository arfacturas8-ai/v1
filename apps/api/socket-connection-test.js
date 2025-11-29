#!/usr/bin/env node

const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3002';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZ2a204bjcwMDAwZGdwcDd0MTZ6bDlzIiwic2Vzc2lvbklkIjoiY2E1MzFhODUtNDBlOS00YzhlLWIzNDMtODhmODg5NTgzNjVkIiwiZW1haWwiOiJuZXdzb2NrZXRAZXhhbXBsZS5jb20iLCJ3YWxsZXRBZGRyZXNzIjpudWxsLCJpc1ZlcmlmaWVkIjpmYWxzZSwianRpIjoiMzg2ZGY3YWQtMzc5OS00NWM1LWJlYzktZTc0MjgyZjkxMzZiIiwiaWF0IjoxNzU4NTcyNDI2LCJleHAiOjE3NTg1NzMzMjYsImF1ZCI6ImNyeWItdXNlcnMiLCJpc3MiOiJjcnliLXBsYXRmb3JtIn0.JaDg_vHx2BOrZk3QqnD2kuDB0nF4M5nl4kQycjhREyM';

console.log('🚀 DIRECT SOCKET.IO CONNECTION TEST');
console.log('==================================');

function testConnection(connectionName, socketOptions) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Testing ${connectionName}...`);
    console.log('Options:', JSON.stringify(socketOptions, null, 2));
    
    const socket = io(SOCKET_URL, socketOptions);
    
    const timeout = setTimeout(() => {
      console.log(`❌ ${connectionName} timed out`);
      socket.disconnect();
      resolve({ success: false, error: 'timeout' });
    }, 15000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`✅ ${connectionName} connected successfully!`);
      console.log('Socket ID:', socket.id);
      
      // Set up listeners
      socket.on('ready', (data) => {
        console.log('📦 Ready event received:', {
          user: data.user?.displayName,
          sessionId: data.session_id
        });
      });

      socket.on('message:create', (message) => {
        console.log('📨 Message received:', message.content);
      });

      socket.on('heartbeat_ack', () => {
        console.log('💓 Heartbeat acknowledged');
      });

      // Test heartbeat
      console.log('💓 Sending heartbeat...');
      socket.emit('heartbeat');
      
      setTimeout(() => {
        socket.disconnect();
        resolve({ success: true, socketId: socket.id });
      }, 5000);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.error(`❌ ${connectionName} failed:`, error.message);
      resolve({ success: false, error: error.message });
    });

    socket.on('error', (error) => {
      console.error(`❌ Socket error in ${connectionName}:`, error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ ${connectionName} disconnected:`, reason);
    });
  });
}

async function main() {
  const tests = [
    {
      name: 'Auth Token Method',
      options: {
        auth: { token: TEST_TOKEN },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      }
    },
    {
      name: 'Authorization Header Method',
      options: {
        extraHeaders: { Authorization: `Bearer ${TEST_TOKEN}` },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      }
    },
    {
      name: 'Query Parameter Method',
      options: {
        query: { token: TEST_TOKEN },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      }
    }
  ];

  console.log(`Using token: ${TEST_TOKEN.substring(0, 50)}...`);
  
  let successfulConnections = 0;
  
  for (const test of tests) {
    const result = await testConnection(test.name, test.options);
    if (result.success) {
      successfulConnections++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎯 FINAL RESULT: ${successfulConnections}/${tests.length} connection methods successful`);
  
  if (successfulConnections > 0) {
    console.log('✅ SOCKET.IO AUTHENTICATION IS WORKING!');
    console.log('✅ Real-time connection system is functional');
  } else {
    console.log('❌ ALL SOCKET.IO CONNECTIONS FAILED');
    console.log('🔧 Authentication or Socket.io server has issues');
  }
}

main().catch(console.error);
