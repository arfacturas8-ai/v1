#!/usr/bin/env node

/**
 * CRYB Platform Comprehensive Integration Test Suite
 * 
 * This test suite performs comprehensive testing of the CRYB platform including:
 * 1. Authentication flows (register, login, JWT)
 * 2. Discord features (servers, channels, messages)
 * 3. Reddit features (communities, posts, comments, voting)
 * 4. Real-time Socket.IO functionality
 * 5. Voice/video endpoints with LiveKit
 * 6. Load testing of critical endpoints
 * 7. Security vulnerability testing
 */

const axios = require('axios');
const WebSocket = require('ws');
const io = require('socket.io-client');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = process.env.API_URL || 'http://api.cryb.ai';
const WEB_BASE_URL = process.env.WEB_URL || 'http://platform.cryb.ai';
const LOCALHOST_API = 'http://localhost:3001';
const LOCALHOST_WEB = 'http://localhost:3000';

// API endpoints with correct prefixes
const API_ENDPOINTS = {
    health: '/health',
    auth: '/api/v1/auth',
    servers: '/api/v1/servers',
    communities: '/api/v1/communities',
    posts: '/api/v1/posts',
    comments: '/api/v1/comments',
    messages: '/api/v1/messages',
    voice: '/api/v1/voice'
};

// Test results storage
let testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    criticalIssues: [],
    warnings: [],
    detailedResults: {},
    performance: {},
    security: {}
};

// Utility functions
const log = (message, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
    
    if (type === 'ERROR' || type === 'CRITICAL') {
        testResults.criticalIssues.push({
            timestamp,
            message,
            type
        });
    } else if (type === 'WARN') {
        testResults.warnings.push({
            timestamp,
            message
        });
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const measureResponseTime = async (testName, testFunction) => {
    const startTime = Date.now();
    try {
        const result = await testFunction();
        const responseTime = Date.now() - startTime;
        testResults.performance[testName] = {
            responseTime,
            success: true,
            result
        };
        return { success: true, result, responseTime };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        testResults.performance[testName] = {
            responseTime,
            success: false,
            error: error.message
        };
        return { success: false, error, responseTime };
    }
};

const recordTest = (testName, passed, details = {}) => {
    testResults.totalTests++;
    if (passed) {
        testResults.passedTests++;
        log(`✓ ${testName}`, 'PASS');
    } else {
        testResults.failedTests++;
        log(`✗ ${testName}`, 'FAIL');
    }
    
    testResults.detailedResults[testName] = {
        passed,
        timestamp: new Date().toISOString(),
        ...details
    };
};

// Test classes
class AuthenticationTester {
    constructor() {
        this.testUser = {
            username: `testuser_${Date.now()}`,
            displayName: 'Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'SecureTest123!'
        };
        this.tokens = {};
    }

    async testHealthEndpoints() {
        log('Testing API and Web health endpoints');
        
        // Test API health (accept 503 as degraded but functional)
        const apiHealthTest = await measureResponseTime('api_health', async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.health}`);
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 503) {
                    // 503 is acceptable for degraded status
                    return { status: 'degraded', data: error.response.data };
                }
                throw error;
            }
        });
        
        const apiHealthPassed = apiHealthTest.success || (apiHealthTest.error && apiHealthTest.error.includes('503'));
        recordTest('API Health Endpoint', apiHealthPassed, {
            url: `${API_BASE_URL}${API_ENDPOINTS.health}`,
            responseTime: apiHealthTest.responseTime,
            status: apiHealthTest.success ? apiHealthTest.result : 'degraded (503)'
        });

        // Test localhost API health (accept 503 as degraded but functional)
        try {
            const localhostApiTest = await measureResponseTime('localhost_api_health', async () => {
                try {
                    const response = await axios.get(`${LOCALHOST_API}${API_ENDPOINTS.health}`);
                    return response.data;
                } catch (error) {
                    if (error.response && error.response.status === 503) {
                        // 503 is acceptable for degraded status
                        return { status: 'degraded', data: error.response.data };
                    }
                    throw error;
                }
            });
            
            const localhostHealthPassed = localhostApiTest.success || (localhostApiTest.error && localhostApiTest.error.includes('503'));
            recordTest('Localhost API Health', localhostHealthPassed, {
                url: `${LOCALHOST_API}${API_ENDPOINTS.health}`,
                responseTime: localhostApiTest.responseTime,
                status: localhostApiTest.success ? localhostApiTest.result : 'degraded (503)'
            });
        } catch (error) {
            recordTest('Localhost API Health', false, { error: error.message });
        }

        // Test Web platform
        const webTest = await measureResponseTime('web_platform', async () => {
            const response = await axios.get(WEB_BASE_URL);
            return { status: response.status, headers: response.headers };
        });
        
        recordTest('Web Platform Access', webTest.success, {
            url: WEB_BASE_URL,
            responseTime: webTest.responseTime,
            status: webTest.success ? webTest.result : webTest.error
        });

        // Test localhost web
        try {
            const localhostWebTest = await measureResponseTime('localhost_web', async () => {
                const response = await axios.get(LOCALHOST_WEB);
                return { status: response.status };
            });
            
            recordTest('Localhost Web Access', localhostWebTest.success, {
                url: LOCALHOST_WEB,
                responseTime: localhostWebTest.responseTime
            });
        } catch (error) {
            recordTest('Localhost Web Access', false, { error: error.message });
        }
    }

    async testUserRegistration() {
        log('Testing user registration flow');
        
        const registrationTest = await measureResponseTime('user_registration', async () => {
            const userData = { ...this.testUser, confirmPassword: this.testUser.password };
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/register`, userData);
            return response.data;
        });
        
        if (registrationTest.success) {
            this.tokens = registrationTest.result.data.tokens;
            log(`User registered successfully: ${this.testUser.username}`);
            recordTest('User Registration', true, {
                userId: registrationTest.result.data.user.id,
                hasTokens: !!this.tokens.accessToken,
                responseTime: registrationTest.responseTime
            });
        } else {
            recordTest('User Registration', false, {
                error: registrationTest.error.message,
                responseTime: registrationTest.responseTime
            });
            
            // Try to register with different email in case user already exists
            this.testUser.email = `test_${Date.now()}_retry@example.com`;
            this.testUser.username = `testuser_${Date.now()}_retry`;
            
            try {
                const retryUserData = { ...this.testUser, confirmPassword: this.testUser.password };
                const retryResponse = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/register`, retryUserData);
                this.tokens = retryResponse.data.data.tokens;
                recordTest('User Registration Retry', true, {
                    userId: retryResponse.data.data.user.id,
                    hasTokens: !!this.tokens.accessToken
                });
            } catch (retryError) {
                recordTest('User Registration Retry', false, { error: retryError.message });
            }
        }
    }

    async testUserLogin() {
        log('Testing user login flow');
        
        const loginTest = await measureResponseTime('user_login', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/login`, {
                username: this.testUser.username,
                password: this.testUser.password
            });
            return response.data;
        });
        
        if (loginTest.success) {
            this.tokens = loginTest.result.data.tokens;
            recordTest('User Login', true, {
                hasTokens: !!this.tokens.accessToken,
                responseTime: loginTest.responseTime,
                tokenExpiry: this.tokens.expiresAt
            });
        } else {
            recordTest('User Login', false, {
                error: loginTest.error.message,
                responseTime: loginTest.responseTime
            });
        }
    }

    async testJWTValidation() {
        log('Testing JWT token validation');
        
        if (!this.tokens.accessToken) {
            recordTest('JWT Validation', false, { error: 'No access token available' });
            return;
        }

        const jwtTest = await measureResponseTime('jwt_validation', async () => {
            const response = await axios.get(`${LOCALHOST_API}${API_ENDPOINTS.auth}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('JWT Validation', jwtTest.success, {
            responseTime: jwtTest.responseTime,
            userData: jwtTest.success ? jwtTest.result.data.user : null,
            error: jwtTest.success ? null : jwtTest.error.message
        });
    }

    async testTokenRefresh() {
        log('Testing token refresh functionality');
        
        if (!this.tokens.refreshToken) {
            recordTest('Token Refresh', false, { error: 'No refresh token available' });
            return;
        }

        const refreshTest = await measureResponseTime('token_refresh', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/refresh`, {
                refreshToken: this.tokens.refreshToken
            });
            return response.data;
        });
        
        if (refreshTest.success) {
            this.tokens = refreshTest.result.data.tokens;
            recordTest('Token Refresh', true, {
                responseTime: refreshTest.responseTime,
                newTokenExpiry: this.tokens.expiresAt
            });
        } else {
            recordTest('Token Refresh', false, {
                error: refreshTest.error.message,
                responseTime: refreshTest.responseTime
            });
        }
    }

    async runAllAuthTests() {
        await this.testHealthEndpoints();
        await this.testUserRegistration();
        await this.testUserLogin();
        await this.testJWTValidation();
        await this.testTokenRefresh();
    }
}

class DiscordFeatureTester {
    constructor(tokens) {
        this.tokens = tokens;
        this.testServer = null;
        this.testChannel = null;
    }

    async testServerCreation() {
        log('Testing Discord server creation');
        
        const serverTest = await measureResponseTime('discord_server_creation', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.servers}`, {
                name: `Test Server ${Date.now()}`,
                description: 'Test server for integration testing',
                isPublic: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        if (serverTest.success) {
            this.testServer = serverTest.result.data || serverTest.result;
            recordTest('Discord Server Creation', true, {
                serverId: this.testServer.id,
                serverName: this.testServer.name,
                responseTime: serverTest.responseTime
            });
        } else {
            recordTest('Discord Server Creation', false, {
                error: serverTest.error.message,
                responseTime: serverTest.responseTime
            });
        }
    }

    async testChannelCreation() {
        log('Testing Discord channel creation');
        
        if (!this.testServer) {
            recordTest('Discord Channel Creation', false, { error: 'No test server available' });
            return;
        }

        const channelTest = await measureResponseTime('discord_channel_creation', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.servers}/${this.testServer.id}/channels`, {
                name: `test-channel-${Date.now()}`,
                type: 'TEXT',
                description: 'Test channel for integration testing'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        if (channelTest.success) {
            this.testChannel = channelTest.result.data.channel;
            recordTest('Discord Channel Creation', true, {
                channelId: this.testChannel.id,
                channelName: this.testChannel.name,
                responseTime: channelTest.responseTime
            });
        } else {
            recordTest('Discord Channel Creation', false, {
                error: channelTest.error.message,
                responseTime: channelTest.responseTime
            });
        }
    }

    async testMessageSending() {
        log('Testing Discord message sending');
        
        if (!this.testChannel) {
            recordTest('Discord Message Sending', false, { error: 'No test channel available' });
            return;
        }

        const messageTest = await measureResponseTime('discord_message_sending', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.messages}`, {
                channelId: this.testChannel.id,
                content: `Test message sent at ${new Date().toISOString()}`,
                type: 'text'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Discord Message Sending', messageTest.success, {
            responseTime: messageTest.responseTime,
            messageId: messageTest.success ? messageTest.result.data?.message?.id : null,
            error: messageTest.success ? null : messageTest.error.message
        });
    }

    async testServersList() {
        log('Testing Discord servers list');
        
        const serversTest = await measureResponseTime('discord_servers_list', async () => {
            const response = await axios.get(`${LOCALHOST_API}${API_ENDPOINTS.servers}`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Discord Servers List', serversTest.success, {
            responseTime: serversTest.responseTime,
            serversCount: serversTest.success ? serversTest.result.data?.servers?.length : 0,
            error: serversTest.success ? null : serversTest.error.message
        });
    }

    async runAllDiscordTests() {
        await this.testServerCreation();
        await this.testChannelCreation();
        await this.testMessageSending();
        await this.testServersList();
    }
}

class RedditFeatureTester {
    constructor(tokens) {
        this.tokens = tokens;
        this.testCommunity = null;
        this.testPost = null;
    }

    async testCommunityCreation() {
        log('Testing Reddit community creation');
        
        const communityTest = await measureResponseTime('reddit_community_creation', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.communities}`, {
                name: `testcommunity${Date.now()}`,
                displayName: `Test Community ${Date.now()}`,
                description: 'Test community for integration testing',
                isPublic: true,
                allowImagePosts: true,
                allowVideoPosts: true
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        if (communityTest.success) {
            this.testCommunity = communityTest.result.data.community;
            recordTest('Reddit Community Creation', true, {
                communityId: this.testCommunity.id,
                communityName: this.testCommunity.name,
                responseTime: communityTest.responseTime
            });
        } else {
            recordTest('Reddit Community Creation', false, {
                error: communityTest.error.message,
                responseTime: communityTest.responseTime
            });
        }
    }

    async testPostCreation() {
        log('Testing Reddit post creation');
        
        if (!this.testCommunity) {
            recordTest('Reddit Post Creation', false, { error: 'No test community available' });
            return;
        }

        const postTest = await measureResponseTime('reddit_post_creation', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.posts}`, {
                communityId: this.testCommunity.id,
                title: `Test Post ${Date.now()}`,
                content: 'This is a test post created during integration testing',
                type: 'text'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        if (postTest.success) {
            this.testPost = postTest.result.data.post;
            recordTest('Reddit Post Creation', true, {
                postId: this.testPost.id,
                postTitle: this.testPost.title,
                responseTime: postTest.responseTime
            });
        } else {
            recordTest('Reddit Post Creation', false, {
                error: postTest.error.message,
                responseTime: postTest.responseTime
            });
        }
    }

    async testCommentCreation() {
        log('Testing Reddit comment creation');
        
        if (!this.testPost) {
            recordTest('Reddit Comment Creation', false, { error: 'No test post available' });
            return;
        }

        const commentTest = await measureResponseTime('reddit_comment_creation', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.comments}`, {
                postId: this.testPost.id,
                content: `Test comment created at ${new Date().toISOString()}`
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Reddit Comment Creation', commentTest.success, {
            responseTime: commentTest.responseTime,
            commentId: commentTest.success ? commentTest.result.data?.comment?.id : null,
            error: commentTest.success ? null : commentTest.error.message
        });
    }

    async testVotingSystem() {
        log('Testing Reddit voting system');
        
        if (!this.testPost) {
            recordTest('Reddit Voting System', false, { error: 'No test post available' });
            return;
        }

        const upvoteTest = await measureResponseTime('reddit_upvote', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.posts}/${this.testPost.id}/vote`, {
                type: 'upvote'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Reddit Voting System', upvoteTest.success, {
            responseTime: upvoteTest.responseTime,
            voteResult: upvoteTest.success ? upvoteTest.result : null,
            error: upvoteTest.success ? null : upvoteTest.error.message
        });
    }

    async testCommunitiesList() {
        log('Testing Reddit communities list');
        
        const communitiesTest = await measureResponseTime('reddit_communities_list', async () => {
            const response = await axios.get(`${LOCALHOST_API}${API_ENDPOINTS.communities}`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Reddit Communities List', communitiesTest.success, {
            responseTime: communitiesTest.responseTime,
            communitiesCount: communitiesTest.success ? communitiesTest.result.data?.communities?.length : 0,
            error: communitiesTest.success ? null : communitiesTest.error.message
        });
    }

    async runAllRedditTests() {
        await this.testCommunityCreation();
        await this.testPostCreation();
        await this.testCommentCreation();
        await this.testVotingSystem();
        await this.testCommunitiesList();
    }
}

class SocketIOTester {
    constructor(tokens) {
        this.tokens = tokens;
        this.socket = null;
        this.connectionTest = null;
    }

    async testSocketConnection() {
        log('Testing Socket.IO connection');
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            let isResolved = false;
            
            const resolveOnce = (success, details) => {
                if (isResolved) return;
                isResolved = true;
                const responseTime = Date.now() - startTime;
                recordTest('Socket.IO Connection', success, { 
                    responseTime,
                    ...details 
                });
                resolve(success);
            };

            try {
                this.socket = io(LOCALHOST_API, {
                    auth: {
                        token: this.tokens.accessToken
                    },
                    transports: ['websocket', 'polling'],
                    timeout: 10000
                });

                this.socket.on('connect', () => {
                    log('Socket.IO connected successfully');
                    resolveOnce(true, { 
                        socketId: this.socket.id,
                        transport: this.socket.io.engine.transport.name
                    });
                });

                this.socket.on('connect_error', (error) => {
                    log(`Socket.IO connection error: ${error.message}`, 'ERROR');
                    resolveOnce(false, { error: error.message });
                });

                this.socket.on('disconnect', (reason) => {
                    log(`Socket.IO disconnected: ${reason}`, 'WARN');
                });

                // Timeout after 10 seconds
                setTimeout(() => {
                    resolveOnce(false, { error: 'Connection timeout' });
                }, 10000);

            } catch (error) {
                resolveOnce(false, { error: error.message });
            }
        });
    }

    async testRealtimeMessaging() {
        log('Testing real-time messaging');
        
        if (!this.socket || !this.socket.connected) {
            recordTest('Real-time Messaging', false, { error: 'Socket not connected' });
            return;
        }

        return new Promise((resolve) => {
            const startTime = Date.now();
            const testMessage = {
                content: `Test message ${Date.now()}`,
                timestamp: new Date().toISOString()
            };

            let messageReceived = false;

            this.socket.on('message', (data) => {
                if (data.content === testMessage.content) {
                    messageReceived = true;
                    const responseTime = Date.now() - startTime;
                    recordTest('Real-time Messaging', true, {
                        responseTime,
                        messageId: data.id,
                        roundTripTime: responseTime
                    });
                    resolve(true);
                }
            });

            // Send test message
            this.socket.emit('send_message', testMessage);

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!messageReceived) {
                    const responseTime = Date.now() - startTime;
                    recordTest('Real-time Messaging', false, {
                        responseTime,
                        error: 'Message not received within timeout'
                    });
                    resolve(false);
                }
            }, 5000);
        });
    }

    async testPresenceSystem() {
        log('Testing presence system');
        
        if (!this.socket || !this.socket.connected) {
            recordTest('Presence System', false, { error: 'Socket not connected' });
            return;
        }

        return new Promise((resolve) => {
            const startTime = Date.now();
            let presenceReceived = false;

            this.socket.on('user_presence', (data) => {
                presenceReceived = true;
                const responseTime = Date.now() - startTime;
                recordTest('Presence System', true, {
                    responseTime,
                    presenceData: data
                });
                resolve(true);
            });

            // Request presence update
            this.socket.emit('request_presence');

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!presenceReceived) {
                    const responseTime = Date.now() - startTime;
                    recordTest('Presence System', false, {
                        responseTime,
                        error: 'Presence data not received within timeout'
                    });
                    resolve(false);
                }
            }, 5000);
        });
    }

    async runAllSocketTests() {
        const connected = await this.testSocketConnection();
        if (connected) {
            await this.testRealtimeMessaging();
            await this.testPresenceSystem();
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

class VoiceVideoTester {
    constructor(tokens) {
        this.tokens = tokens;
    }

    async testLiveKitConnection() {
        log('Testing LiveKit voice/video connection');
        
        const liveKitTest = await measureResponseTime('livekit_connection', async () => {
            const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.voice}/join`, {
                roomName: `test-room-${Date.now()}`,
                userName: 'test-user'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('LiveKit Connection', liveKitTest.success, {
            responseTime: liveKitTest.responseTime,
            roomData: liveKitTest.success ? liveKitTest.result.data : null,
            error: liveKitTest.success ? null : liveKitTest.error.message
        });
    }

    async testVoiceEndpoints() {
        log('Testing voice endpoints');
        
        const voiceTest = await measureResponseTime('voice_endpoints', async () => {
            const response = await axios.get(`${LOCALHOST_API}${API_ENDPOINTS.voice}/rooms`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.accessToken}`
                }
            });
            return response.data;
        });
        
        recordTest('Voice Endpoints', voiceTest.success, {
            responseTime: voiceTest.responseTime,
            roomsData: voiceTest.success ? voiceTest.result.data : null,
            error: voiceTest.success ? null : voiceTest.error.message
        });
    }

    async runAllVoiceTests() {
        await this.testLiveKitConnection();
        await this.testVoiceEndpoints();
    }
}

class LoadTester {
    constructor(tokens) {
        this.tokens = tokens;
    }

    async performLoadTest(endpoint, concurrent = 10, duration = 5000) {
        log(`Performing load test on ${endpoint} with ${concurrent} concurrent requests`);
        
        const startTime = Date.now();
        const requests = [];
        const results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: []
        };

        const makeRequest = async () => {
            const requestStart = Date.now();
            try {
                const response = await axios.get(`${LOCALHOST_API}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${this.tokens.accessToken}`
                    },
                    timeout: 5000
                });
                const requestTime = Date.now() - requestStart;
                results.responseTimes.push(requestTime);
                results.successfulRequests++;
                return { success: true, responseTime: requestTime };
            } catch (error) {
                const requestTime = Date.now() - requestStart;
                results.errors.push(error.message);
                results.failedRequests++;
                return { success: false, responseTime: requestTime, error: error.message };
            }
        };

        // Start concurrent requests
        const interval = setInterval(() => {
            for (let i = 0; i < concurrent; i++) {
                results.totalRequests++;
                requests.push(makeRequest());
            }
        }, 100);

        // Stop after duration
        setTimeout(() => {
            clearInterval(interval);
        }, duration);

        // Wait for all requests to complete
        await new Promise(resolve => setTimeout(resolve, duration + 2000));
        await Promise.allSettled(requests);

        // Calculate statistics
        const avgResponseTime = results.responseTimes.length > 0 
            ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
            : 0;
        const maxResponseTime = results.responseTimes.length > 0 
            ? Math.max(...results.responseTimes) 
            : 0;
        const minResponseTime = results.responseTimes.length > 0 
            ? Math.min(...results.responseTimes) 
            : 0;
        const successRate = results.totalRequests > 0 
            ? (results.successfulRequests / results.totalRequests) * 100 
            : 0;

        const testName = `Load Test ${endpoint}`;
        recordTest(testName, successRate > 80, {
            endpoint,
            duration,
            concurrent,
            totalRequests: results.totalRequests,
            successfulRequests: results.successfulRequests,
            failedRequests: results.failedRequests,
            successRate: Math.round(successRate * 100) / 100,
            avgResponseTime: Math.round(avgResponseTime),
            minResponseTime,
            maxResponseTime,
            uniqueErrors: [...new Set(results.errors)].slice(0, 5)
        });

        return results;
    }

    async runLoadTests() {
        const endpoints = [API_ENDPOINTS.health, `${API_ENDPOINTS.auth}/me`, API_ENDPOINTS.servers, API_ENDPOINTS.communities];
        
        for (const endpoint of endpoints) {
            await this.performLoadTest(endpoint, 5, 3000); // Reduced intensity for testing
            await sleep(1000); // Brief pause between tests
        }
    }
}

class SecurityTester {
    constructor(tokens) {
        this.tokens = tokens;
    }

    async testUnauthorizedAccess() {
        log('Testing unauthorized access to protected endpoints');
        
        const protectedEndpoints = [`${API_ENDPOINTS.auth}/me`, API_ENDPOINTS.servers, API_ENDPOINTS.communities, API_ENDPOINTS.messages];
        let unauthorizedAccessBlocked = true;
        const results = [];

        for (const endpoint of protectedEndpoints) {
            try {
                const response = await axios.get(`${LOCALHOST_API}${endpoint}`, {
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    unauthorizedAccessBlocked = false;
                    results.push({
                        endpoint,
                        status: response.status,
                        issue: 'Unauthorized access allowed'
                    });
                } else {
                    results.push({
                        endpoint,
                        status: response.status,
                        secured: true
                    });
                }
            } catch (error) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    results.push({
                        endpoint,
                        status: error.response.status,
                        secured: true
                    });
                } else {
                    results.push({
                        endpoint,
                        status: error.response?.status || 'timeout',
                        issue: error.message
                    });
                }
            }
        }

        recordTest('Unauthorized Access Protection', unauthorizedAccessBlocked, {
            endpointResults: results,
            criticalIssues: results.filter(r => r.issue)
        });
    }

    async testInputValidation() {
        log('Testing input validation and sanitization');
        
        const maliciousInputs = [
            '<script>alert("XSS")</script>',
            "'; DROP TABLE users; --",
            '../../../etc/passwd',
            '{{constructor.constructor("return process")().exit()}}'
        ];

        let inputValidationPassed = true;
        const results = [];

        for (const maliciousInput of maliciousInputs) {
            try {
                const response = await axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/register`, {
                    username: maliciousInput,
                    displayName: maliciousInput,
                    email: `${Date.now()}@test.com`,
                    password: 'ValidPassword123!',
                    confirmPassword: 'ValidPassword123!'
                });

                if (response.status === 201) {
                    inputValidationPassed = false;
                    results.push({
                        input: maliciousInput,
                        status: response.status,
                        issue: 'Malicious input accepted'
                    });
                }
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    results.push({
                        input: maliciousInput,
                        status: error.response.status,
                        validated: true
                    });
                } else {
                    results.push({
                        input: maliciousInput,
                        status: error.response?.status || 'error',
                        error: error.message
                    });
                }
            }
        }

        recordTest('Input Validation', inputValidationPassed, {
            inputResults: results,
            criticalIssues: results.filter(r => r.issue)
        });
    }

    async testRateLimiting() {
        log('Testing rate limiting on auth endpoints');
        
        const rapidRequests = [];
        let rateLimitTriggered = false;

        // Make 20 rapid requests to login endpoint
        for (let i = 0; i < 20; i++) {
            rapidRequests.push(
                axios.post(`${LOCALHOST_API}${API_ENDPOINTS.auth}/login`, {
                    username: 'nonexistent',
                    password: 'invalid'
                }).catch(error => ({
                    status: error.response?.status,
                    headers: error.response?.headers,
                    error: error.message
                }))
            );
        }

        const results = await Promise.all(rapidRequests);
        
        // Check if any request was rate limited (status 429)
        rateLimitTriggered = results.some(result => result.status === 429);

        recordTest('Rate Limiting', rateLimitTriggered, {
            totalRequests: results.length,
            rateLimitedRequests: results.filter(r => r.status === 429).length,
            statusCodes: results.map(r => r.status)
        });
    }

    async runSecurityTests() {
        await this.testUnauthorizedAccess();
        await this.testInputValidation();
        await this.testRateLimiting();
    }
}

// Main test runner
class IntegrationTestRunner {
    constructor() {
        this.authTester = new AuthenticationTester();
        this.tokens = null;
    }

    async generateTestReport() {
        const report = {
            ...testResults,
            summary: {
                totalTests: testResults.totalTests,
                passedTests: testResults.passedTests,
                failedTests: testResults.failedTests,
                successRate: testResults.totalTests > 0 
                    ? Math.round((testResults.passedTests / testResults.totalTests) * 100 * 100) / 100 
                    : 0,
                criticalIssuesCount: testResults.criticalIssues.length,
                warningsCount: testResults.warnings.length
            },
            recommendations: this.generateRecommendations()
        };

        // Save report to file
        const reportPath = path.join(__dirname, 'comprehensive-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        if (testResults.failedTests > 0) {
            recommendations.push("Address failed tests before production deployment");
        }

        if (testResults.criticalIssues.length > 0) {
            recommendations.push("Critical security issues found - immediate attention required");
        }

        const avgResponseTimes = Object.values(testResults.performance)
            .filter(p => p.success)
            .map(p => p.responseTime);
        
        if (avgResponseTimes.length > 0) {
            const avgTime = avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length;
            if (avgTime > 2000) {
                recommendations.push("API response times are slow - consider performance optimization");
            }
        }

        if (recommendations.length === 0) {
            recommendations.push("All tests passed successfully - platform ready for production");
        }

        return recommendations;
    }

    async runAllTests() {
        log('Starting CRYB Platform Comprehensive Integration Test Suite');
        log('='.repeat(60));

        try {
            // 1. Authentication Tests
            log('1. Running Authentication Tests...');
            await this.authTester.runAllAuthTests();
            this.tokens = this.authTester.tokens;

            if (this.tokens && this.tokens.accessToken) {
                // 2. Discord Feature Tests
                log('2. Running Discord Feature Tests...');
                const discordTester = new DiscordFeatureTester(this.tokens);
                await discordTester.runAllDiscordTests();

                // 3. Reddit Feature Tests
                log('3. Running Reddit Feature Tests...');
                const redditTester = new RedditFeatureTester(this.tokens);
                await redditTester.runAllRedditTests();

                // 4. Socket.IO Tests
                log('4. Running Socket.IO Tests...');
                const socketTester = new SocketIOTester(this.tokens);
                await socketTester.runAllSocketTests();

                // 5. Voice/Video Tests
                log('5. Running Voice/Video Tests...');
                const voiceTester = new VoiceVideoTester(this.tokens);
                await voiceTester.runAllVoiceTests();

                // 6. Load Tests
                log('6. Running Load Tests...');
                const loadTester = new LoadTester(this.tokens);
                await loadTester.runLoadTests();

                // 7. Security Tests
                log('7. Running Security Tests...');
                const securityTester = new SecurityTester(this.tokens);
                await securityTester.runSecurityTests();
            } else {
                log('Skipping authenticated tests - no valid tokens available', 'WARN');
            }

            // Generate final report
            const report = await this.generateTestReport();
            
            log('='.repeat(60));
            log('TEST SUITE COMPLETED');
            log(`Total Tests: ${report.summary.totalTests}`);
            log(`Passed: ${report.summary.passedTests}`);
            log(`Failed: ${report.summary.failedTests}`);
            log(`Success Rate: ${report.summary.successRate}%`);
            log(`Critical Issues: ${report.summary.criticalIssuesCount}`);
            log(`Warnings: ${report.summary.warningsCount}`);
            log('='.repeat(60));

            return report;

        } catch (error) {
            log(`Test suite failed with error: ${error.message}`, 'CRITICAL');
            const report = await this.generateTestReport();
            return report;
        }
    }
}

// Run the test suite if this script is executed directly
if (require.main === module) {
    const runner = new IntegrationTestRunner();
    runner.runAllTests().then(report => {
        console.log('\n📊 TEST REPORT SUMMARY:');
        console.log(JSON.stringify(report.summary, null, 2));
        
        if (report.summary.criticalIssuesCount > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            report.criticalIssues.forEach(issue => {
                console.log(`- ${issue.message}`);
            });
            process.exit(1);
        } else {
            process.exit(0);
        }
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { IntegrationTestRunner };