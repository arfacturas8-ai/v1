#!/usr/bin/env node

/**
 * Test Socket.io connection with JWT authentication
 */

const { io } = require('socket.io-client');

const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItc29ja2V0LWF1dGgtMTIzIiwic2Vzc2lvbklkIjoiNTgwNTk2YWItNmI5NC00Y2FkLWFmZWItZTJlZGUwYTBlZGE2IiwiZW1haWwiOiJzb2NrZXR0ZXN0QGNyeWIuYWkiLCJ3YWxsZXRBZGRyZXNzIjpudWxsLCJpc1ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTc1MzQ2MDMsImV4cCI6MTc1NzUzNTUwMywiYXVkIjoiY3J5Yi11c2VycyIsImlzcyI6ImNyeWItcGxhdGZvcm0ifQ.0GCy1gxKUNkVobP77fyNG0SBdcGAvXflr1KR_nrya8A';

console.log('🔧 Testing Socket.io JWT Authentication...');
console.log('🎯 Target: http://localhost:3002');
console.log('🎫 Using generated JWT token');

const socket = io('http://localhost:3002', {
    auth: {
        token: TEST_TOKEN
    },
    extraHeaders: {
        'Authorization': `Bearer ${TEST_TOKEN}`
    },
    query: {
        token: TEST_TOKEN
    },
    transports: ['polling', 'websocket'],
    timeout: 10000
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Socket connected successfully!');
    console.log(`🔗 Socket ID: ${socket.id}`);
    
    // Test ping
    console.log('🏓 Sending ping...');
    socket.emit('ping');
});

socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${reason}`);
    process.exit(1);
});

socket.on('connect_error', (error) => {
    console.log(`💥 Connection error: ${error.message}`);
    
    if (error.message.includes('Authentication')) {
        console.log('🔐 Authentication failed - this is expected if the user doesn\'t exist');
        console.log('📄 Error details:', error.message);
    } else if (error.message.includes('token')) {
        console.log('🔐 Token-related error:', error.message);
    }
    
    process.exit(1);
});

// Test events
socket.on('pong', (data) => {
    console.log('🏓 Pong received!', data);
    
    // Test presence update
    console.log('👁️ Updating presence...');
    socket.emit('update-presence', {
        status: 'online',
        activity: 'Testing Socket.io authentication'
    });
});

socket.on('presence-update', (data) => {
    console.log('👁️ Presence update received:', data);
});

socket.on('error', (error) => {
    console.log(`💥 Socket error:`, error);
});

// Generic event listener
socket.onAny((eventName, ...args) => {
    console.log(`📡 Event received: ${eventName}`, args.length > 0 ? args : '');
});

// Timeout after 30 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - disconnecting...');
    socket.disconnect();
    process.exit(0);
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
});