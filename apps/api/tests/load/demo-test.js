#!/usr/bin/env node

/**
 * Demo Load Test - Simple demonstration of the load testing framework
 */

const http = require('http');
const { performance } = require('perf_hooks');

class SimpleLoadTest {
  constructor() {
    this.baseURL = 'http://localhost:3002';
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      startTime: null,
      endTime: null
    };
  }

  async runDemo() {
    console.log('🚀 Starting Simple Load Test Demo');
    console.log('=' .repeat(50));
    
    this.results.startTime = performance.now();
    
    // Test API health endpoint
    console.log('📡 Testing API Health Endpoint...');
    await this.testHealthEndpoint();
    
    // Simulate basic load
    console.log('⚡ Simulating Basic Load (10 concurrent requests)...');
    await this.simulateBasicLoad();
    
    this.results.endTime = performance.now();
    
    // Generate results
    this.displayResults();
  }

  async testHealthEndpoint() {
    try {
      const startTime = performance.now();
      const response = await this.makeRequest('/api/v1/health');
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      this.results.responseTimes.push(responseTime);
      this.results.totalRequests++;
      
      if (response.statusCode === 200) {
        this.results.successfulRequests++;
        console.log(`✅ Health check successful (${Math.round(responseTime)}ms)`);
      } else {
        this.results.failedRequests++;
        console.log(`❌ Health check failed (status: ${response.statusCode})`);
      }
    } catch (error) {
      this.results.failedRequests++;
      this.results.totalRequests++;
      console.log(`❌ Health check error: ${error.message}`);
    }
  }

  async simulateBasicLoad() {
    const promises = [];
    
    // Create 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(this.makeLoadRequest(i));
    }
    
    await Promise.allSettled(promises);
  }

  async makeLoadRequest(requestId) {
    try {
      const startTime = performance.now();
      const response = await this.makeRequest('/api/v1/health');
      const endTime = performance.now();
      
      const responseTime = endTime - startTime;
      this.results.responseTimes.push(responseTime);
      this.results.totalRequests++;
      
      if (response.statusCode === 200) {
        this.results.successfulRequests++;
        console.log(`✅ Request ${requestId + 1} completed (${Math.round(responseTime)}ms)`);
      } else {
        this.results.failedRequests++;
        console.log(`❌ Request ${requestId + 1} failed (status: ${response.statusCode})`);
      }
    } catch (error) {
      this.results.failedRequests++;
      this.results.totalRequests++;
      console.log(`❌ Request ${requestId + 1} error: ${error.message}`);
    }
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: path,
        method: 'GET',
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  displayResults() {
    const duration = this.results.endTime - this.results.startTime;
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    const requestsPerSecond = (this.results.totalRequests / (duration / 1000)).toFixed(2);
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 LOAD TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests}`);
    console.log(`Failed: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`Requests per Second: ${requestsPerSecond}`);
    console.log(`Total Duration: ${Math.round(duration)}ms`);
    
    if (this.results.responseTimes.length > 0) {
      const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      
      console.log(`95th Percentile: ${Math.round(p95)}ms`);
      console.log(`99th Percentile: ${Math.round(p99)}ms`);
    }
    
    console.log('=' .repeat(50));
    
    // Assessment
    if (successRate >= 95 && avgResponseTime < 1000) {
      console.log('✅ ASSESSMENT: System performing well under basic load');
    } else if (successRate >= 90 && avgResponseTime < 2000) {
      console.log('⚠️ ASSESSMENT: System performance acceptable with minor issues');
    } else {
      console.log('❌ ASSESSMENT: System performance needs attention');
    }
    
    console.log('\n🎯 Load Testing Framework Ready!');
    console.log('Use the comprehensive test suites for full production testing:');
    console.log('  node run-load-tests.js list    # List available tests');
    console.log('  node run-load-tests.js all     # Run all tests');
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new SimpleLoadTest();
  demo.runDemo().catch(console.error);
}

module.exports = SimpleLoadTest;