#!/usr/bin/env node

const { io } = require('socket.io-client');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZuNjFnbnYwMDAxdjhxOW54ZjU0dXFkIiwic2Vzc2lvbklkIjoiYTZiYTRhZmEtNjdiNC00YWU2LWE2YzMtZjE3MGJkNTM5NzEzIiwiZW1haWwiOiJzb2NrZXR0ZXN0MTc1ODA2NDIxM0BleGFtcGxlLmNvbSIsIndhbGxldEFkZHJlc3MiOm51bGwsImlzVmVyaWZpZWQiOmZhbHNlLCJqdGkiOiJmN2M4MjAzNC1lZjU2LTQ5ZDYtYjljOS0xZGI4NzdjMjYwNTQiLCJpYXQiOjE3NTgwNjQyMTMsImV4cCI6MTc1ODA2NTExMywiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.pNnazopq6lcZs-b1TlNGUBDGxvX466Vk6KWCIoISA9o";

console.log('🔌 Testing Socket.IO connection with JWT token...');

const socket = io('http://localhost:3002', {
  auth: {
    token: TOKEN
  },
  transports: ['polling', 'websocket'],
  timeout: 10000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✅ Connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // Listen for ready event
  socket.on('ready', (data) => {
    console.log('🎉 Authentication successful!');
    console.log('User:', data.user);
    console.log('Session ID:', data.session_id);
    
    // Test heartbeat
    console.log('💓 Testing heartbeat...');
    socket.emit('heartbeat');
  });
  
  socket.on('heartbeat_ack', (data) => {
    console.log('✅ Heartbeat acknowledged:', data.timestamp);
    
    // Test presence update
    console.log('👥 Testing presence update...');
    socket.emit('presence:update', {
      status: 'online',
      activity: 'Testing Socket.IO functionality'
    });
    
    // Test message sending
    console.log('💬 Testing message sending...');
    socket.emit('message:send', {
      channelId: 'test_channel_123',
      content: 'Hello from Socket.IO test!'
    });
    
    setTimeout(() => {
      console.log('🎉 All tests completed successfully!');
      socket.disconnect();
      process.exit(0);
    }, 2000);
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('presence:update', (data) => {
  console.log('👥 Presence update received:', data);
});

socket.on('message:new', (data) => {
  console.log('💬 Message received:', data);
});

setTimeout(() => {
  console.log('⏰ Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 15000);