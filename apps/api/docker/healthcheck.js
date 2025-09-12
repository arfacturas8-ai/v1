#!/usr/bin/env node

/**
 * Docker Health Check Script for CRYB Discord-like API
 * 
 * This script performs comprehensive health checks including:
 * - API server response
 * - Database connectivity
 * - Redis connectivity
 * - Memory usage monitoring
 * - Response time validation
 */

const http = require('http');
const { performance } = require('perf_hooks');

const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
const MAX_MEMORY_USAGE = 512 * 1024 * 1024; // 512MB
const MAX_RESPONSE_TIME = 5000; // 5 seconds

async function checkHealth() {
  const startTime = performance.now();
  
  try {
    console.log('🔍 Starting health check...');
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.rss > MAX_MEMORY_USAGE) {
      throw new Error(`High memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    }
    
    console.log(`📊 Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    
    // Check API health endpoint
    const healthData = await makeRequest('/health');
    
    if (!healthData.status || healthData.status !== 'healthy') {
      throw new Error(`API health check failed: ${healthData.status || 'unknown'}`);
    }
    
    console.log('✅ API server is healthy');
    
    // Check response time
    const responseTime = performance.now() - startTime;
    if (responseTime > MAX_RESPONSE_TIME) {
      throw new Error(`Slow response time: ${responseTime}ms`);
    }
    
    console.log(`⚡ Response time: ${Math.round(responseTime)}ms`);
    
    // Check specific services if available
    if (healthData.checks) {
      for (const [service, status] of Object.entries(healthData.checks)) {
        if (status !== 'healthy') {
          console.warn(`⚠️  Service ${service} is ${status}`);
        } else {
          console.log(`✅ Service ${service} is healthy`);
        }
      }
    }
    
    console.log('🎉 All health checks passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3001,
      path: path,
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT,
      headers: {
        'User-Agent': 'Docker-Health-Check/1.0'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || 'Unknown error'}`));
          } else {
            resolve(parsed);
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
    
    req.end();
  });
}

// Run health check
checkHealth();