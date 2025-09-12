#!/usr/bin/env node

/**
 * Manual API Test - Direct testing of the CRYB Platform API
 */

const http = require('http');

function makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Manual-API-Test/1.0',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`\n${method} ${path}`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers:`, res.headers);
                try {
                    const jsonBody = JSON.parse(body);
                    console.log('Body:', JSON.stringify(jsonBody, null, 2));
                } catch (e) {
                    console.log('Body (raw):', body);
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            const jsonData = JSON.stringify(data);
            console.log(`Sending data:`, jsonData);
            req.write(jsonData);
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('🔍 Manual API Testing...\n');
    
    // Test 1: Health endpoint
    console.log('='.repeat(60));
    console.log('TEST 1: Health Endpoint');
    console.log('='.repeat(60));
    await makeRequest('/health');
    
    // Test 2: API v1 base
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: API v1 Base');
    console.log('='.repeat(60));
    await makeRequest('/api/v1');
    
    // Test 3: Try to register a user
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: User Registration');
    console.log('='.repeat(60));
    const testUser = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        username: 'testuser'
    };
    await makeRequest('/api/v1/auth/register', 'POST', testUser);
    
    // Test 4: List available routes (if any)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Available Routes Discovery');
    console.log('='.repeat(60));
    
    const routesToTest = [
        '/api',
        '/api/v1/auth',
        '/api/v1/users',
        '/api/v1/servers',
        '/api/v1/communities',
        '/api/v1/posts',
        '/api/v1/messages',
        '/api/v1/uploads',
        '/api/v1/voice',
        '/api/v1/search'
    ];
    
    for (const route of routesToTest) {
        try {
            console.log(`\nTesting route: ${route}`);
            const result = await makeRequest(route);
            if (result.statusCode !== 404) {
                console.log(`✅ Route ${route} exists (${result.statusCode})`);
            } else {
                console.log(`❌ Route ${route} not found (404)`);
            }
        } catch (error) {
            console.log(`❌ Route ${route} error: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Manual API Test Complete');
    console.log('='.repeat(60));
}

runTests().catch(console.error);