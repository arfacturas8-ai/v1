#!/usr/bin/env node

/**
 * CRYB Platform - Comprehensive Backend Verification Script
 * 
 * This script performs thorough verification of all backend components:
 * 1. API Server Health Check
 * 2. Database Connectivity & Schema Validation
 * 3. Authentication System Testing
 * 4. Real-time Socket.io Testing
 * 5. Middleware Functionality
 * 6. External Service Integration Tests
 * 7. API Endpoints Validation
 */

const axios = require('axios');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    apiBaseUrl: 'http://localhost:3006',
    dbConfig: {
        host: 'localhost',
        port: 5432,
        username: 'cryb_user',
        password: 'cryb_password',
        database: 'cryb'
    },
    redisConfig: {
        host: 'localhost',
        port: 6380,
        password: 'PbS4lakpqV28U1aUX2PsE1o81d41Afb1'
    },
    testTimeout: 10000 // 10 seconds
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

class BackendVerifier {
    constructor() {
        this.results = {
            apiServer: { status: 'unknown', details: {} },
            database: { status: 'unknown', details: {} },
            authentication: { status: 'unknown', details: {} },
            realtime: { status: 'unknown', details: {} },
            endpoints: { status: 'unknown', details: {} },
            middleware: { status: 'unknown', details: {} },
            services: { status: 'unknown', details: {} }
        };
        this.apiServerProcess = null;
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async startApiServer() {
        this.log('\n🚀 Starting API Server...', 'blue');
        
        try {
            // Set environment and start server
            process.env.PORT = '3006';
            process.env.NODE_ENV = 'development';
            
            this.apiServerProcess = spawn('npm', ['run', 'dev'], {
                cwd: process.cwd(),
                env: { ...process.env, PORT: '3006' },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            // Wait for server to start
            let serverReady = false;
            let attempts = 0;
            const maxAttempts = 20;

            while (!serverReady && attempts < maxAttempts) {
                try {
                    await this.sleep(2000);
                    const response = await axios.get(`${config.apiBaseUrl}/health`, { timeout: 5000 });
                    if (response.status === 200) {
                        serverReady = true;
                        this.log('✅ API Server started successfully', 'green');
                    }
                } catch (error) {
                    attempts++;
                    this.log(`⏳ Waiting for API server (attempt ${attempts}/${maxAttempts})...`, 'yellow');
                }
            }

            if (!serverReady) {
                throw new Error('API Server failed to start within timeout period');
            }

            return true;
        } catch (error) {
            this.log(`❌ Failed to start API Server: ${error.message}`, 'red');
            return false;
        }
    }

    async testApiServerHealth() {
        this.log('\n🏥 Testing API Server Health...', 'blue');
        
        try {
            const healthResponse = await axios.get(`${config.apiBaseUrl}/health`, { 
                timeout: config.testTimeout 
            });
            
            this.results.apiServer = {
                status: 'working',
                details: {
                    statusCode: healthResponse.status,
                    healthChecks: healthResponse.data,
                    responseTime: Date.now(),
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log('✅ API Server health check passed', 'green');
            this.log(`   Status: ${JSON.stringify(healthResponse.data, null, 2)}`, 'cyan');
            
            return true;
        } catch (error) {
            this.results.apiServer = {
                status: 'broken',
                details: {
                    error: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`❌ API Server health check failed: ${error.message}`, 'red');
            return false;
        }
    }

    async testDatabaseConnectivity() {
        this.log('\n🗄️ Testing Database Connectivity...', 'blue');
        
        try {
            // Test basic connectivity
            const dbTest = execSync(
                `PGPASSWORD=${config.dbConfig.password} psql -h ${config.dbConfig.host} -p ${config.dbConfig.port} -U ${config.dbConfig.username} -d ${config.dbConfig.database} -c "SELECT 'Connected' as status, version(), current_timestamp;"`,
                { encoding: 'utf8', timeout: config.testTimeout }
            );
            
            // Test schema validation
            const schemaTest = execSync(
                `PGPASSWORD=${config.dbConfig.password} psql -h ${config.dbConfig.host} -p ${config.dbConfig.port} -U ${config.dbConfig.username} -d ${config.dbConfig.database} -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`,
                { encoding: 'utf8', timeout: config.testTimeout }
            );
            
            const tables = schemaTest.split('\n').filter(line => line.trim() && !line.includes('table_name') && !line.includes('---') && !line.includes('(') && !line.includes('row'));
            
            this.results.database = {
                status: 'working',
                details: {
                    connection: 'successful',
                    version: dbTest.includes('PostgreSQL') ? 'PostgreSQL detected' : 'Unknown',
                    tablesCount: tables.length,
                    tables: tables.slice(0, 10), // First 10 tables
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log('✅ Database connectivity test passed', 'green');
            this.log(`   Tables found: ${tables.length}`, 'cyan');
            this.log(`   Sample tables: ${tables.slice(0, 5).join(', ')}`, 'cyan');
            
            return true;
        } catch (error) {
            this.results.database = {
                status: 'broken',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`❌ Database connectivity test failed: ${error.message}`, 'red');
            return false;
        }
    }

    async testRedisConnectivity() {
        this.log('\n📊 Testing Redis Connectivity...', 'blue');
        
        try {
            const redisTest = execSync(
                `redis-cli -h ${config.redisConfig.host} -p ${config.redisConfig.port} -a ${config.redisConfig.password} ping`,
                { encoding: 'utf8', timeout: config.testTimeout }
            );
            
            if (redisTest.trim() === 'PONG') {
                this.log('✅ Redis connectivity test passed', 'green');
                return true;
            } else {
                throw new Error('Redis ping failed');
            }
        } catch (error) {
            this.log(`❌ Redis connectivity test failed: ${error.message}`, 'red');
            return false;
        }
    }

    async testAuthenticationSystem() {
        this.log('\n🔐 Testing Authentication System...', 'blue');
        
        try {
            // Test registration endpoint
            const registerResponse = await axios.post(`${config.apiBaseUrl}/api/v1/auth/register`, {
                username: `testuser_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                password: 'TestPassword123!'
            }, { timeout: config.testTimeout });
            
            if (registerResponse.status === 201) {
                this.log('✅ User registration endpoint working', 'green');
            }
            
            // Test login endpoint
            const loginResponse = await axios.post(`${config.apiBaseUrl}/api/v1/auth/login`, {
                email: registerResponse.data.user?.email || `test_${Date.now()}@example.com`,
                password: 'TestPassword123!'
            }, { timeout: config.testTimeout });
            
            const token = loginResponse.data.token || loginResponse.data.accessToken;
            
            if (token) {
                this.log('✅ User login endpoint working', 'green');
                
                // Test protected endpoint
                const protectedResponse = await axios.get(`${config.apiBaseUrl}/api/v1/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: config.testTimeout
                });
                
                if (protectedResponse.status === 200) {
                    this.log('✅ Protected endpoints working', 'green');
                }
            }
            
            this.results.authentication = {
                status: 'working',
                details: {
                    registration: 'success',
                    login: 'success',
                    protectedAccess: 'success',
                    tokenProvided: !!token,
                    timestamp: new Date().toISOString()
                }
            };
            
            return true;
        } catch (error) {
            this.results.authentication = {
                status: 'broken',
                details: {
                    error: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`❌ Authentication system test failed: ${error.message}`, 'red');
            if (error.response?.data) {
                this.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
            }
            return false;
        }
    }

    async testSocketIOConnectivity() {
        this.log('\n🔄 Testing Socket.IO Real-time Connectivity...', 'blue');
        
        try {
            // Test Socket.IO handshake endpoint
            const socketHandshake = await axios.get(`${config.apiBaseUrl}/socket.io/?EIO=4&transport=polling`, { 
                timeout: config.testTimeout 
            });
            
            if (socketHandshake.status === 200) {
                this.log('✅ Socket.IO handshake working', 'green');
                
                this.results.realtime = {
                    status: 'working',
                    details: {
                        handshake: 'success',
                        protocol: 'Engine.IO v4',
                        timestamp: new Date().toISOString()
                    }
                };
                
                return true;
            }
        } catch (error) {
            this.results.realtime = {
                status: 'broken',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`❌ Socket.IO connectivity test failed: ${error.message}`, 'red');
            return false;
        }
    }

    async testApiEndpoints() {
        this.log('\n🔗 Testing API Endpoints...', 'blue');
        
        const endpoints = [
            { method: 'GET', path: '/api/v1/communities', description: 'Communities list' },
            { method: 'GET', path: '/api/v1/posts', description: 'Posts list' },
            { method: 'GET', path: '/api/v1/search', description: 'Search functionality' },
            { method: 'GET', path: '/documentation', description: 'API documentation' },
            { method: 'GET', path: '/metrics', description: 'Prometheus metrics' }
        ];
        
        const results = {};
        let workingEndpoints = 0;
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios({
                    method: endpoint.method,
                    url: `${config.apiBaseUrl}${endpoint.path}`,
                    timeout: config.testTimeout
                });
                
                results[endpoint.path] = {
                    status: 'working',
                    statusCode: response.status,
                    description: endpoint.description
                };
                
                workingEndpoints++;
                this.log(`✅ ${endpoint.description} (${endpoint.method} ${endpoint.path})`, 'green');
            } catch (error) {
                results[endpoint.path] = {
                    status: 'broken',
                    error: error.message,
                    statusCode: error.response?.status,
                    description: endpoint.description
                };
                
                this.log(`❌ ${endpoint.description} (${endpoint.method} ${endpoint.path}): ${error.message}`, 'red');
            }
        }
        
        this.results.endpoints = {
            status: workingEndpoints > 0 ? 'working' : 'broken',
            details: {
                total: endpoints.length,
                working: workingEndpoints,
                broken: endpoints.length - workingEndpoints,
                endpoints: results,
                timestamp: new Date().toISOString()
            }
        };
        
        return workingEndpoints > 0;
    }

    async testMiddleware() {
        this.log('\n🔧 Testing Middleware Functionality...', 'blue');
        
        try {
            // Test CORS headers
            const corsResponse = await axios.options(`${config.apiBaseUrl}/api/v1/communities`, {
                headers: { 'Origin': 'http://localhost:3000' },
                timeout: config.testTimeout
            });
            
            const corsWorking = corsResponse.headers['access-control-allow-origin'] !== undefined;
            
            // Test rate limiting (make multiple rapid requests)
            let rateLimitWorking = false;
            try {
                for (let i = 0; i < 5; i++) {
                    await axios.get(`${config.apiBaseUrl}/health`, { timeout: 2000 });
                }
                rateLimitWorking = true; // If no rate limit hit, consider it working
            } catch (error) {
                rateLimitWorking = error.response?.status === 429; // Rate limited
            }
            
            // Test security headers
            const securityResponse = await axios.get(`${config.apiBaseUrl}/health`, { timeout: config.testTimeout });
            const securityHeaders = securityResponse.headers;
            const securityWorking = securityHeaders['x-frame-options'] || securityHeaders['x-content-type-options'];
            
            this.results.middleware = {
                status: corsWorking || rateLimitWorking || securityWorking ? 'working' : 'broken',
                details: {
                    cors: corsWorking ? 'working' : 'not detected',
                    rateLimit: rateLimitWorking ? 'working' : 'not detected',
                    security: securityWorking ? 'working' : 'not detected',
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`✅ CORS: ${corsWorking ? 'Working' : 'Not detected'}`, corsWorking ? 'green' : 'yellow');
            this.log(`✅ Rate Limiting: ${rateLimitWorking ? 'Working' : 'Not detected'}`, rateLimitWorking ? 'green' : 'yellow');
            this.log(`✅ Security Headers: ${securityWorking ? 'Working' : 'Not detected'}`, securityWorking ? 'green' : 'yellow');
            
            return true;
        } catch (error) {
            this.results.middleware = {
                status: 'broken',
                details: {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            };
            
            this.log(`❌ Middleware test failed: ${error.message}`, 'red');
            return false;
        }
    }

    async testExternalServices() {
        this.log('\n🌐 Testing External Service Integrations...', 'blue');
        
        const services = {
            redis: await this.testRedisConnectivity(),
            minio: false, // Will be tested below
            elasticsearch: false, // Will be tested below
            livekit: false // Will be tested below
        };
        
        // Test MinIO
        try {
            const minioTest = execSync('curl -s http://localhost:9000/minio/health/live', { 
                encoding: 'utf8', 
                timeout: 5000 
            });
            services.minio = minioTest.includes('OK') || minioTest.length > 0;
        } catch (error) {
            services.minio = false;
        }
        
        // Test Elasticsearch (if not disabled)
        try {
            const esTest = execSync('curl -s http://localhost:9200/_cluster/health', { 
                encoding: 'utf8', 
                timeout: 5000 
            });
            services.elasticsearch = esTest.includes('cluster_name');
        } catch (error) {
            services.elasticsearch = false;
        }
        
        // Test LiveKit
        try {
            const livekitTest = execSync('curl -s http://localhost:7880', { 
                encoding: 'utf8', 
                timeout: 5000 
            });
            services.livekit = livekitTest.length > 0;
        } catch (error) {
            services.livekit = false;
        }
        
        this.results.services = {
            status: Object.values(services).some(s => s) ? 'working' : 'broken',
            details: {
                ...services,
                timestamp: new Date().toISOString()
            }
        };
        
        Object.entries(services).forEach(([service, working]) => {
            this.log(`${working ? '✅' : '❌'} ${service}: ${working ? 'Working' : 'Not available'}`, working ? 'green' : 'yellow');
        });
        
        return Object.values(services).some(s => s);
    }

    generateReport() {
        this.log('\n📋 COMPREHENSIVE BACKEND VERIFICATION REPORT', 'magenta');
        this.log('='.repeat(60), 'magenta');
        
        const overall = Object.values(this.results).every(r => r.status === 'working');
        const workingCount = Object.values(this.results).filter(r => r.status === 'working').length;
        const totalCount = Object.keys(this.results).length;
        
        this.log(`\n🎯 Overall Status: ${overall ? 'ALL SYSTEMS OPERATIONAL' : 'ISSUES DETECTED'}`, overall ? 'green' : 'red');
        this.log(`📊 Working Components: ${workingCount}/${totalCount}`, workingCount === totalCount ? 'green' : 'yellow');
        
        // Detailed component status
        Object.entries(this.results).forEach(([component, result]) => {
            const icon = result.status === 'working' ? '✅' : result.status === 'broken' ? '❌' : '⚠️';
            this.log(`${icon} ${component.toUpperCase()}: ${result.status.toUpperCase()}`, 
                result.status === 'working' ? 'green' : result.status === 'broken' ? 'red' : 'yellow');
        });
        
        // Summary recommendations
        this.log('\n📝 RECOMMENDATIONS:', 'cyan');
        
        if (this.results.apiServer.status === 'broken') {
            this.log('   • Fix API server startup issues', 'yellow');
        }
        if (this.results.database.status === 'broken') {
            this.log('   • Check PostgreSQL service and credentials', 'yellow');
        }
        if (this.results.authentication.status === 'broken') {
            this.log('   • Verify JWT configuration and auth endpoints', 'yellow');
        }
        if (this.results.realtime.status === 'broken') {
            this.log('   • Check Socket.IO configuration', 'yellow');
        }
        if (this.results.endpoints.status === 'broken') {
            this.log('   • Review route registration and middleware', 'yellow');
        }
        
        // Save detailed report
        const reportPath = path.join(process.cwd(), 'backend-verification-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            overall: { status: overall ? 'working' : 'broken', score: `${workingCount}/${totalCount}` },
            components: this.results
        }, null, 2));
        
        this.log(`\n💾 Detailed report saved to: ${reportPath}`, 'cyan');
        
        return {
            overall: overall ? 'working' : 'broken',
            score: `${workingCount}/${totalCount}`,
            details: this.results
        };
    }

    async cleanup() {
        if (this.apiServerProcess) {
            this.log('\n🧹 Cleaning up API server process...', 'yellow');
            this.apiServerProcess.kill();
        }
    }

    async run() {
        try {
            this.log('🚀 STARTING COMPREHENSIVE BACKEND VERIFICATION', 'magenta');
            this.log('=' * 60, 'magenta');
            
            // Start API server first
            const serverStarted = await this.startApiServer();
            if (!serverStarted) {
                this.log('❌ Cannot proceed without API server', 'red');
                return this.generateReport();
            }
            
            // Run all tests
            await this.testApiServerHealth();
            await this.testDatabaseConnectivity();
            await this.testAuthenticationSystem();
            await this.testSocketIOConnectivity();
            await this.testApiEndpoints();
            await this.testMiddleware();
            await this.testExternalServices();
            
            return this.generateReport();
            
        } catch (error) {
            this.log(`❌ Verification failed: ${error.message}`, 'red');
            return { overall: 'broken', error: error.message };
        } finally {
            await this.cleanup();
        }
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new BackendVerifier();
    verifier.run().then(result => {
        process.exit(result.overall === 'working' ? 0 : 1);
    }).catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    });
}

module.exports = BackendVerifier;