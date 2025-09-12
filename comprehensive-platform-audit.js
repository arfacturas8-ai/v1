#!/usr/bin/env node

/**
 * CRYB Platform Comprehensive Audit
 * Tests all major features and provides completion percentages
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'http://localhost:3002/api/v1';
const WEB_BASE = 'http://localhost:3000';

// Test Results Storage
const results = {
    authentication: { tests: 0, passed: 0, details: [] },
    discord: { tests: 0, passed: 0, details: [] },
    reddit: { tests: 0, passed: 0, details: [] },
    realtime: { tests: 0, passed: 0, details: [] },
    voice: { tests: 0, passed: 0, details: [] },
    media: { tests: 0, passed: 0, details: [] },
    search: { tests: 0, passed: 0, details: [] },
    mobile: { tests: 0, passed: 0, details: [] },
    infrastructure: { tests: 0, passed: 0, details: [] }
};

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CRYB-Platform-Audit/1.0',
                ...headers
            }
        };

        const req = client.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody,
                        rawBody: body
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: null,
                        rawBody: body,
                        parseError: e.message
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test Authentication System
async function testAuthentication() {
    console.log('\n🔐 Testing Authentication System...');
    
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `testuser${Date.now()}`
    };
    
    let authToken = null;
    
    // Test 1: User Registration
    try {
        results.authentication.tests++;
        const response = await makeRequest(`${API_BASE}/auth/register`, 'POST', testUser);
        
        if (response.statusCode === 201 || response.statusCode === 200) {
            results.authentication.passed++;
            results.authentication.details.push('✅ User registration working');
            console.log('✅ User registration: PASS');
        } else {
            results.authentication.details.push(`❌ User registration failed: ${response.statusCode}`);
            console.log(`❌ User registration: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.authentication.details.push(`❌ User registration error: ${error.message}`);
        console.log(`❌ User registration: ERROR (${error.message})`);
    }
    
    // Test 2: User Login
    try {
        results.authentication.tests++;
        const loginData = {
            email: testUser.email,
            password: testUser.password
        };
        const response = await makeRequest(`${API_BASE}/auth/login`, 'POST', loginData);
        
        if (response.statusCode === 200 && response.body?.token) {
            authToken = response.body.token;
            results.authentication.passed++;
            results.authentication.details.push('✅ User login working with JWT token');
            console.log('✅ User login: PASS');
        } else {
            results.authentication.details.push(`❌ User login failed: ${response.statusCode}`);
            console.log(`❌ User login: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.authentication.details.push(`❌ User login error: ${error.message}`);
        console.log(`❌ User login: ERROR (${error.message})`);
    }
    
    // Test 3: Protected Route Access
    if (authToken) {
        try {
            results.authentication.tests++;
            const headers = { 'Authorization': `Bearer ${authToken}` };
            const response = await makeRequest(`${API_BASE}/auth/me`, 'GET', null, headers);
            
            if (response.statusCode === 200) {
                results.authentication.passed++;
                results.authentication.details.push('✅ Protected routes working with JWT');
                console.log('✅ Protected route access: PASS');
            } else {
                results.authentication.details.push(`❌ Protected route failed: ${response.statusCode}`);
                console.log(`❌ Protected route access: FAIL (${response.statusCode})`);
            }
        } catch (error) {
            results.authentication.details.push(`❌ Protected route error: ${error.message}`);
            console.log(`❌ Protected route access: ERROR (${error.message})`);
        }
    }
    
    return authToken;
}

// Test Discord Features
async function testDiscordFeatures(authToken) {
    console.log('\n💬 Testing Discord Features...');
    
    if (!authToken) {
        results.discord.details.push('❌ Cannot test Discord features - no auth token');
        return;
    }
    
    const headers = { 'Authorization': `Bearer ${authToken}` };
    let serverId = null;
    
    // Test 1: Server Creation
    try {
        results.discord.tests++;
        const serverData = {
            name: `Test Server ${Date.now()}`,
            description: 'Test server for audit',
            isPublic: true
        };
        const response = await makeRequest(`${API_BASE}/servers`, 'POST', serverData, headers);
        
        if (response.statusCode === 201 || response.statusCode === 200) {
            serverId = response.body?.data?.id || response.body?.id;
            results.discord.passed++;
            results.discord.details.push('✅ Server creation working');
            console.log('✅ Server creation: PASS');
        } else {
            results.discord.details.push(`❌ Server creation failed: ${response.statusCode}`);
            console.log(`❌ Server creation: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.discord.details.push(`❌ Server creation error: ${error.message}`);
        console.log(`❌ Server creation: ERROR (${error.message})`);
    }
    
    // Test 2: Server Listing
    try {
        results.discord.tests++;
        const response = await makeRequest(`${API_BASE}/servers`, 'GET', null, headers);
        
        if (response.statusCode === 200) {
            results.discord.passed++;
            results.discord.details.push('✅ Server listing working');
            console.log('✅ Server listing: PASS');
        } else {
            results.discord.details.push(`❌ Server listing failed: ${response.statusCode}`);
            console.log(`❌ Server listing: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.discord.details.push(`❌ Server listing error: ${error.message}`);
        console.log(`❌ Server listing: ERROR (${error.message})`);
    }
    
    // Test 3: Channel Management
    if (serverId) {
        try {
            results.discord.tests++;
            const channelData = {
                name: 'test-channel',
                type: 'TEXT'
            };
            const response = await makeRequest(`${API_BASE}/servers/${serverId}/channels`, 'POST', channelData, headers);
            
            if (response.statusCode === 201 || response.statusCode === 200) {
                results.discord.passed++;
                results.discord.details.push('✅ Channel creation working');
                console.log('✅ Channel creation: PASS');
            } else {
                results.discord.details.push(`❌ Channel creation failed: ${response.statusCode}`);
                console.log(`❌ Channel creation: FAIL (${response.statusCode})`);
            }
        } catch (error) {
            results.discord.details.push(`❌ Channel creation error: ${error.message}`);
            console.log(`❌ Channel creation: ERROR (${error.message})`);
        }
    }
    
    return serverId;
}

// Test Reddit Features
async function testRedditFeatures(authToken) {
    console.log('\n🔗 Testing Reddit Features...');
    
    if (!authToken) {
        results.reddit.details.push('❌ Cannot test Reddit features - no auth token');
        return;
    }
    
    const headers = { 'Authorization': `Bearer ${authToken}` };
    let communityId = null;
    let postId = null;
    
    // Test 1: Community Creation
    try {
        results.reddit.tests++;
        const communityData = {
            name: `testcommunity${Date.now()}`,
            displayName: `Test Community ${Date.now()}`,
            description: 'Test community for audit',
            isPublic: true
        };
        const response = await makeRequest(`${API_BASE}/communities`, 'POST', communityData, headers);
        
        if (response.statusCode === 201 || response.statusCode === 200) {
            communityId = response.body?.data?.id || response.body?.id;
            results.reddit.passed++;
            results.reddit.details.push('✅ Community creation working');
            console.log('✅ Community creation: PASS');
        } else {
            results.reddit.details.push(`❌ Community creation failed: ${response.statusCode}`);
            console.log(`❌ Community creation: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.reddit.details.push(`❌ Community creation error: ${error.message}`);
        console.log(`❌ Community creation: ERROR (${error.message})`);
    }
    
    // Test 2: Post Creation
    if (communityId) {
        try {
            results.reddit.tests++;
            const postData = {
                title: 'Test Post',
                content: 'This is a test post for the audit',
                type: 'TEXT',
                communityId: communityId
            };
            const response = await makeRequest(`${API_BASE}/posts`, 'POST', postData, headers);
            
            if (response.statusCode === 201 || response.statusCode === 200) {
                postId = response.body?.data?.id || response.body?.id;
                results.reddit.passed++;
                results.reddit.details.push('✅ Post creation working');
                console.log('✅ Post creation: PASS');
            } else {
                results.reddit.details.push(`❌ Post creation failed: ${response.statusCode}`);
                console.log(`❌ Post creation: FAIL (${response.statusCode})`);
            }
        } catch (error) {
            results.reddit.details.push(`❌ Post creation error: ${error.message}`);
            console.log(`❌ Post creation: ERROR (${error.message})`);
        }
    }
    
    // Test 3: Comments System
    if (postId) {
        try {
            results.reddit.tests++;
            const commentData = {
                content: 'Test comment for audit',
                postId: postId
            };
            const response = await makeRequest(`${API_BASE}/comments`, 'POST', commentData, headers);
            
            if (response.statusCode === 201 || response.statusCode === 200) {
                results.reddit.passed++;
                results.reddit.details.push('✅ Comment system working');
                console.log('✅ Comment system: PASS');
            } else {
                results.reddit.details.push(`❌ Comment system failed: ${response.statusCode}`);
                console.log(`❌ Comment system: FAIL (${response.statusCode})`);
            }
        } catch (error) {
            results.reddit.details.push(`❌ Comment system error: ${error.message}`);
            console.log(`❌ Comment system: ERROR (${error.message})`);
        }
    }
    
    // Test 4: Voting System
    if (postId) {
        try {
            results.reddit.tests++;
            const voteData = {
                type: 'UPVOTE',
                postId: postId
            };
            const response = await makeRequest(`${API_BASE}/posts/${postId}/vote`, 'POST', voteData, headers);
            
            if (response.statusCode === 200 || response.statusCode === 201) {
                results.reddit.passed++;
                results.reddit.details.push('✅ Voting system working');
                console.log('✅ Voting system: PASS');
            } else {
                results.reddit.details.push(`❌ Voting system failed: ${response.statusCode}`);
                console.log(`❌ Voting system: FAIL (${response.statusCode})`);
            }
        } catch (error) {
            results.reddit.details.push(`❌ Voting system error: ${error.message}`);
            console.log(`❌ Voting system: ERROR (${error.message})`);
        }
    }
}

// Test Real-time Features
async function testRealtimeFeatures() {
    console.log('\n⚡ Testing Real-time Features...');
    
    // Test Socket.IO connection
    try {
        results.realtime.tests++;
        // Simple HTTP check for Socket.IO endpoint
        const response = await makeRequest(`${API_BASE.replace('api/v1', 'socket.io')}/`, 'GET');
        
        if (response.statusCode === 200 || response.rawBody?.includes('socket.io')) {
            results.realtime.passed++;
            results.realtime.details.push('✅ Socket.IO endpoint accessible');
            console.log('✅ Socket.IO endpoint: PASS');
        } else {
            results.realtime.details.push(`❌ Socket.IO endpoint failed: ${response.statusCode}`);
            console.log(`❌ Socket.IO endpoint: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.realtime.details.push(`❌ Socket.IO endpoint error: ${error.message}`);
        console.log(`❌ Socket.IO endpoint: ERROR (${error.message})`);
    }
    
    // Additional real-time tests would require WebSocket client
    results.realtime.details.push('⚠️ Full real-time testing requires WebSocket client');
}

// Test Voice/Video Features
async function testVoiceVideoFeatures(authToken) {
    console.log('\n🎤 Testing Voice/Video Features...');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // Test 1: Voice Rooms Endpoint
    try {
        results.voice.tests++;
        const response = await makeRequest(`${API_BASE}/voice/rooms`, 'GET', null, headers);
        
        if (response.statusCode === 200) {
            results.voice.passed++;
            results.voice.details.push('✅ Voice rooms endpoint working');
            console.log('✅ Voice rooms: PASS');
        } else {
            results.voice.details.push(`❌ Voice rooms failed: ${response.statusCode}`);
            console.log(`❌ Voice rooms: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.voice.details.push(`❌ Voice rooms error: ${error.message}`);
        console.log(`❌ Voice rooms: ERROR (${error.message})`);
    }
    
    // Test 2: LiveKit Integration
    try {
        results.voice.tests++;
        const response = await makeRequest(`${API_BASE}/voice/livekit/token`, 'POST', { room: 'test' }, headers);
        
        if (response.statusCode === 200) {
            results.voice.passed++;
            results.voice.details.push('✅ LiveKit integration working');
            console.log('✅ LiveKit integration: PASS');
        } else {
            results.voice.details.push(`❌ LiveKit integration failed: ${response.statusCode}`);
            console.log(`❌ LiveKit integration: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.voice.details.push(`❌ LiveKit integration error: ${error.message}`);
        console.log(`❌ LiveKit integration: ERROR (${error.message})`);
    }
}

// Test Media Handling
async function testMediaFeatures(authToken) {
    console.log('\n📁 Testing Media Handling...');
    
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    // Test 1: Upload Endpoint
    try {
        results.media.tests++;
        const response = await makeRequest(`${API_BASE}/uploads`, 'GET', null, headers);
        
        if (response.statusCode === 200 || response.statusCode === 405) { // 405 means endpoint exists but wrong method
            results.media.passed++;
            results.media.details.push('✅ Upload endpoint accessible');
            console.log('✅ Upload endpoint: PASS');
        } else {
            results.media.details.push(`❌ Upload endpoint failed: ${response.statusCode}`);
            console.log(`❌ Upload endpoint: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.media.details.push(`❌ Upload endpoint error: ${error.message}`);
        console.log(`❌ Upload endpoint: ERROR (${error.message})`);
    }
    
    // Test 2: CDN/MinIO Health
    try {
        results.media.tests++;
        const response = await makeRequest(`${API_BASE}/health`, 'GET');
        
        if (response.body?.checks?.minio === 'healthy') {
            results.media.passed++;
            results.media.details.push('✅ MinIO storage healthy');
            console.log('✅ MinIO storage: PASS');
        } else {
            results.media.details.push(`❌ MinIO storage not healthy: ${response.body?.checks?.minio}`);
            console.log(`❌ MinIO storage: FAIL`);
        }
    } catch (error) {
        results.media.details.push(`❌ MinIO health check error: ${error.message}`);
        console.log(`❌ MinIO health check: ERROR (${error.message})`);
    }
}

// Test Search Features
async function testSearchFeatures() {
    console.log('\n🔍 Testing Search Features...');
    
    // Test 1: Elasticsearch Health
    try {
        results.search.tests++;
        const response = await makeRequest(`${API_BASE}/health`, 'GET');
        
        if (response.body?.checks?.elasticsearch === 'healthy') {
            results.search.passed++;
            results.search.details.push('✅ Elasticsearch healthy');
            console.log('✅ Elasticsearch: PASS');
        } else if (response.body?.checks?.elasticsearch === 'disabled') {
            results.search.details.push('⚠️ Elasticsearch disabled');
            console.log('⚠️ Elasticsearch: DISABLED');
        } else {
            results.search.details.push(`❌ Elasticsearch not healthy: ${response.body?.checks?.elasticsearch}`);
            console.log(`❌ Elasticsearch: FAIL`);
        }
    } catch (error) {
        results.search.details.push(`❌ Elasticsearch health error: ${error.message}`);
        console.log(`❌ Elasticsearch health: ERROR (${error.message})`);
    }
    
    // Test 2: Search Endpoint
    try {
        results.search.tests++;
        const response = await makeRequest(`${API_BASE}/search?q=test`, 'GET');
        
        if (response.statusCode === 200) {
            results.search.passed++;
            results.search.details.push('✅ Search endpoint working');
            console.log('✅ Search endpoint: PASS');
        } else {
            results.search.details.push(`❌ Search endpoint failed: ${response.statusCode}`);
            console.log(`❌ Search endpoint: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.search.details.push(`❌ Search endpoint error: ${error.message}`);
        console.log(`❌ Search endpoint: ERROR (${error.message})`);
    }
}

// Test Mobile App Readiness
async function testMobileReadiness() {
    console.log('\n📱 Testing Mobile App Readiness...');
    
    // Test 1: Mobile App Structure
    try {
        results.mobile.tests++;
        const mobileAppPath = '/home/ubuntu/cryb-platform/apps/mobile';
        if (fs.existsSync(path.join(mobileAppPath, 'package.json'))) {
            results.mobile.passed++;
            results.mobile.details.push('✅ Mobile app structure exists');
            console.log('✅ Mobile app structure: PASS');
        } else {
            results.mobile.details.push('❌ Mobile app structure missing');
            console.log('❌ Mobile app structure: FAIL');
        }
    } catch (error) {
        results.mobile.details.push(`❌ Mobile app structure error: ${error.message}`);
        console.log(`❌ Mobile app structure: ERROR (${error.message})`);
    }
    
    // Test 2: React Native Configuration
    try {
        results.mobile.tests++;
        const configPath = '/home/ubuntu/cryb-platform/apps/mobile/app.config.js';
        if (fs.existsSync(configPath)) {
            results.mobile.passed++;
            results.mobile.details.push('✅ React Native config exists');
            console.log('✅ React Native config: PASS');
        } else {
            results.mobile.details.push('❌ React Native config missing');
            console.log('❌ React Native config: FAIL');
        }
    } catch (error) {
        results.mobile.details.push(`❌ React Native config error: ${error.message}`);
        console.log(`❌ React Native config: ERROR (${error.message})`);
    }
    
    // Test 3: Android/iOS Builds
    try {
        results.mobile.tests++;
        const androidPath = '/home/ubuntu/cryb-platform/apps/mobile/android';
        const iosPath = '/home/ubuntu/cryb-platform/apps/mobile/ios';
        
        if (fs.existsSync(androidPath) && fs.existsSync(iosPath)) {
            results.mobile.passed++;
            results.mobile.details.push('✅ Android and iOS build configurations exist');
            console.log('✅ Mobile build configs: PASS');
        } else {
            results.mobile.details.push('❌ Mobile build configurations incomplete');
            console.log('❌ Mobile build configs: FAIL');
        }
    } catch (error) {
        results.mobile.details.push(`❌ Mobile build configs error: ${error.message}`);
        console.log(`❌ Mobile build configs: ERROR (${error.message})`);
    }
}

// Test Infrastructure
async function testInfrastructure() {
    console.log('\n🏗️ Testing Infrastructure...');
    
    // Test 1: API Health
    try {
        results.infrastructure.tests++;
        const response = await makeRequest(`${API_BASE}/health`, 'GET');
        
        if (response.statusCode === 200) {
            results.infrastructure.passed++;
            results.infrastructure.details.push('✅ API server healthy');
            console.log('✅ API health: PASS');
        } else {
            results.infrastructure.details.push(`❌ API health failed: ${response.statusCode}`);
            console.log(`❌ API health: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.infrastructure.details.push(`❌ API health error: ${error.message}`);
        console.log(`❌ API health: ERROR (${error.message})`);
    }
    
    // Test 2: Frontend Accessibility
    try {
        results.infrastructure.tests++;
        const response = await makeRequest(WEB_BASE, 'GET');
        
        if (response.statusCode === 200) {
            results.infrastructure.passed++;
            results.infrastructure.details.push('✅ Frontend accessible');
            console.log('✅ Frontend: PASS');
        } else {
            results.infrastructure.details.push(`❌ Frontend failed: ${response.statusCode}`);
            console.log(`❌ Frontend: FAIL (${response.statusCode})`);
        }
    } catch (error) {
        results.infrastructure.details.push(`❌ Frontend error: ${error.message}`);
        console.log(`❌ Frontend: ERROR (${error.message})`);
    }
    
    // Test 3: Docker Services
    try {
        results.infrastructure.tests++;
        const composePath = '/home/ubuntu/cryb-platform/docker-compose.yml';
        if (fs.existsSync(composePath)) {
            results.infrastructure.passed++;
            results.infrastructure.details.push('✅ Docker configuration exists');
            console.log('✅ Docker config: PASS');
        } else {
            results.infrastructure.details.push('❌ Docker configuration missing');
            console.log('❌ Docker config: FAIL');
        }
    } catch (error) {
        results.infrastructure.details.push(`❌ Docker config error: ${error.message}`);
        console.log(`❌ Docker config: ERROR (${error.message})`);
    }
}

// Calculate completion percentages
function calculateCompletion() {
    const categories = Object.keys(results);
    const completionStats = {};
    
    categories.forEach(category => {
        const { tests, passed } = results[category];
        const percentage = tests > 0 ? Math.round((passed / tests) * 100) : 0;
        completionStats[category] = {
            percentage,
            passed,
            total: tests,
            status: percentage >= 80 ? '✅' : percentage >= 50 ? '⚠️' : '❌'
        };
    });
    
    // Calculate overall completion
    const totalTests = categories.reduce((sum, cat) => sum + results[cat].tests, 0);
    const totalPassed = categories.reduce((sum, cat) => sum + results[cat].passed, 0);
    const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
    
    return { completionStats, overallPercentage };
}

// Generate comprehensive report
function generateReport() {
    const { completionStats, overallPercentage } = calculateCompletion();
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 CRYB PLATFORM COMPREHENSIVE AUDIT REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL COMPLETION: ${overallPercentage}%`);
    
    console.log('\n📋 CATEGORY BREAKDOWN:');
    console.log('-'.repeat(50));
    
    Object.entries(completionStats).forEach(([category, stats]) => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`${stats.status} ${categoryName}: ${stats.percentage}% (${stats.passed}/${stats.total})`);
    });
    
    console.log('\n🔍 DETAILED RESULTS:');
    console.log('-'.repeat(50));
    
    Object.entries(results).forEach(([category, data]) => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`\n${categoryName}:`);
        data.details.forEach(detail => {
            console.log(`  ${detail}`);
        });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY & RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    // Generate recommendations based on results
    const recommendations = [];
    
    if (completionStats.authentication.percentage < 100) {
        recommendations.push('🔐 Fix authentication issues for secure user access');
    }
    
    if (completionStats.realtime.percentage < 50) {
        recommendations.push('⚡ Critical: Fix Socket.IO for real-time features');
    }
    
    if (completionStats.voice.percentage < 50) {
        recommendations.push('🎤 Implement voice/video features with LiveKit');
    }
    
    if (completionStats.search.percentage < 50) {
        recommendations.push('🔍 Enable and configure Elasticsearch for search');
    }
    
    if (completionStats.mobile.percentage < 80) {
        recommendations.push('📱 Complete mobile app build and testing');
    }
    
    console.log('\n🎯 PRIORITY ACTIONS:');
    recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n✅ WORKING FEATURES:');
    const workingFeatures = [];
    if (completionStats.authentication.percentage >= 80) workingFeatures.push('User Authentication & JWT');
    if (completionStats.discord.percentage >= 60) workingFeatures.push('Discord Server Creation');
    if (completionStats.reddit.percentage >= 60) workingFeatures.push('Reddit Community Features');
    if (completionStats.infrastructure.percentage >= 80) workingFeatures.push('Infrastructure & API');
    
    workingFeatures.forEach(feature => {
        console.log(`  ✅ ${feature}`);
    });
    
    console.log('\n❌ BROKEN/INCOMPLETE FEATURES:');
    const brokenFeatures = [];
    if (completionStats.realtime.percentage < 50) brokenFeatures.push('Real-time Communication (Socket.IO)');
    if (completionStats.voice.percentage < 50) brokenFeatures.push('Voice/Video Calling');
    if (completionStats.search.percentage < 50) brokenFeatures.push('Search Functionality');
    if (completionStats.media.percentage < 50) brokenFeatures.push('Media Upload System');
    
    brokenFeatures.forEach(feature => {
        console.log(`  ❌ ${feature}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Write results to file
    const reportData = {
        timestamp: new Date().toISOString(),
        overallCompletion: overallPercentage,
        categoryStats: completionStats,
        detailedResults: results,
        recommendations
    };
    
    fs.writeFileSync('/home/ubuntu/cryb-platform/platform-audit-results.json', JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed results saved to: platform-audit-results.json');
}

// Main execution
async function runAudit() {
    console.log('🚀 Starting CRYB Platform Comprehensive Audit...');
    console.log('⏰ Time:', new Date().toISOString());
    
    try {
        const authToken = await testAuthentication();
        await testDiscordFeatures(authToken);
        await testRedditFeatures(authToken);
        await testRealtimeFeatures();
        await testVoiceVideoFeatures(authToken);
        await testMediaFeatures(authToken);
        await testSearchFeatures();
        await testMobileReadiness();
        await testInfrastructure();
        
        generateReport();
    } catch (error) {
        console.error('❌ Audit failed with error:', error);
        process.exit(1);
    }
}

// Run the audit
runAudit().catch(console.error);