const { io } = require('socket.io-client');

// Test token - replace with real token from API
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZjeWJmejQwMDAwYXYyam93Mmc5Ynd3Iiwic2Vzc2lvbklkIjoiNzAzZDBiOGYtMTM1MC00YjJjLWI4MzgtMWMzYjRiZGU1ZWIxIiwiZW1haWwiOiJ0ZXN0MTc1NzQ0NjU3NEBleGFtcGxlLmNvbSIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiJiZjVhMGMzNS0yMjczLTRjMmItOTVkNS03NmRmOTY5MTc3YTUiLCJpYXQiOjE3NTc0NDY1ODAsImV4cCI6MTc1NzQ0NzQ4MCwiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.62VRT2Ax5FIFpxRrnGtL4vf-9qAFyo95piuaA3FAUys';

console.log('🔄 Testing Socket.IO with valid JWT token...\n');

// Test 1: No auth (should fail)
console.log('1️⃣ Testing without auth...');
const socket1 = io('http://localhost:3002', {
  timeout: 3000,
  transports: ['websocket', 'polling']
});

socket1.on('connect_error', (err) => {
  console.log('✅ Expected: Connection failed without token:', err.message);
  socket1.close();
  testWithToken();
});

function testWithToken() {
  console.log('\n2️⃣ Testing with valid JWT token...');
  
  // Test 2: With auth token via auth object
  const socket2 = io('http://localhost:3002', {
    auth: {
      token: TOKEN
    },
    timeout: 5000,
    transports: ['websocket', 'polling']
  });

  socket2.on('connect', () => {
    console.log('🎉 SUCCESS! Connected with JWT token');
    
    // Test real-time features
    socket2.emit('ping', (response) => {
      console.log('🏓 Ping response:', response);
    });
    
    setTimeout(() => {
      socket2.close();
      testWithHeaderAuth();
    }, 2000);
  });

  socket2.on('connect_error', (err) => {
    console.log('❌ Failed with auth object:', err.message);
    testWithHeaderAuth();
  });
}

function testWithHeaderAuth() {
  console.log('\n3️⃣ Testing with Authorization header...');
  
  // Test 3: With auth token via Authorization header
  const socket3 = io('http://localhost:3002', {
    extraHeaders: {
      'Authorization': `Bearer ${TOKEN}`
    },
    timeout: 5000,
    transports: ['websocket', 'polling']
  });

  socket3.on('connect', () => {
    console.log('🎉 SUCCESS! Connected with Authorization header');
    
    socket3.emit('ping', (response) => {
      console.log('🏓 Ping response:', response);
    });
    
    setTimeout(() => {
      socket3.close();
      console.log('\n✅ Socket.IO authentication tests completed!');
      process.exit(0);
    }, 2000);
  });

  socket3.on('connect_error', (err) => {
    console.log('❌ Failed with Authorization header:', err.message);
    console.log('\n❌ All authentication methods failed!');
    process.exit(1);
  });
}

// Timeout
setTimeout(() => {
  console.log('⏰ Tests timed out');
  process.exit(1);
}, 15000);