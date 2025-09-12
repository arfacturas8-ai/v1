#!/usr/bin/env node

const io = require('socket.io-client');
const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testSocketIO() {
    console.log('🔌 Testing Socket.IO Connection...');
    
    // First get a valid token
    const testUser = {
        username: `sockettest_${Date.now()}`,
        displayName: 'Socket Test User',
        email: `sockettest_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
    };

    try {
        const registerResponse = await axios.post(`${API_BASE}/api/v1/auth/register`, testUser);
        const tokens = registerResponse.data.data.tokens;
        
        return new Promise((resolve) => {
            let isResolved = false;
            const resolveOnce = (result) => {
                if (isResolved) return;
                isResolved = true;
                resolve(result);
            };

            const socket = io(API_BASE, {
                auth: {
                    token: tokens.accessToken
                },
                transports: ['websocket', 'polling'],
                timeout: 10000
            });

            socket.on('connect', () => {
                console.log('✅ Socket.IO connected successfully');
                console.log(`Socket ID: ${socket.id}`);
                console.log(`Transport: ${socket.io.engine.transport.name}`);
                
                // Test message sending
                socket.emit('test_message', { content: 'Hello from test' });
                
                setTimeout(() => {
                    socket.disconnect();
                    resolveOnce({ success: true, socketId: socket.id });
                }, 2000);
            });

            socket.on('connect_error', (error) => {
                console.log(`❌ Socket.IO connection error: ${error.message}`);
                resolveOnce({ success: false, error: error.message });
            });

            socket.on('test_message_response', (data) => {
                console.log('✅ Received test message response:', data);
            });

            // Timeout
            setTimeout(() => {
                resolveOnce({ success: false, error: 'Connection timeout' });
            }, 10000);
        });
    } catch (error) {
        console.log(`❌ Socket.IO test failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

if (require.main === module) {
    testSocketIO().then(result => {
        console.log('Socket.IO Test Result:', result);
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { testSocketIO };