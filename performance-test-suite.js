#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  API_BASE: 'http://localhost:3002',
  WEB_BASE: 'http://localhost:3001',
  CONCURRENT_USERS: 10,
  TEST_DURATION: 30000, // 30 seconds
  REQUEST_DELAY: 100, // ms between requests
  TIMEOUT: 5000
};

class PerformanceTestSuite {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errorRates: {},
      throughput: 0
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const emoji = level === 'ERROR' ? '❌' : level === 'SUCCESS' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Single request performance test
  async testSingleRequest(url, description) {
    const startTime = performance.now();
    try {
      const response = await axios.get(url, {
        timeout: CONFIG.TIMEOUT
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.metrics.totalRequests++;
      this.metrics.successfulRequests++;
      this.metrics.responseTimes.push(responseTime);
      
      return {
        success: true,
        responseTime,
        statusCode: response.status,
        description
      };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.metrics.totalRequests++;
      this.metrics.failedRequests++;
      this.metrics.responseTimes.push(responseTime);
      
      const statusCode = error.response?.status || 0;
      this.metrics.errorRates[statusCode] = (this.metrics.errorRates[statusCode] || 0) + 1;
      
      return {
        success: false,
        responseTime,
        statusCode,
        error: error.message,
        description
      };
    }
  }

  // Load test - multiple concurrent users
  async loadTest(endpoint, duration = CONFIG.TEST_DURATION) {
    this.log(`🔥 Starting load test on ${endpoint} for ${duration}ms with ${CONFIG.CONCURRENT_USERS} concurrent users`);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    const workers = [];
    
    // Create concurrent workers
    for (let i = 0; i < CONFIG.CONCURRENT_USERS; i++) {
      const worker = this.createWorker(endpoint, endTime, i);
      workers.push(worker);
    }
    
    // Wait for all workers to complete
    const results = await Promise.allSettled(workers);
    
    const successfulWorkers = results.filter(r => r.status === 'fulfilled').length;
    const failedWorkers = results.filter(r => r.status === 'rejected').length;
    
    return {
      duration: duration / 1000,
      concurrentUsers: CONFIG.CONCURRENT_USERS,
      successfulWorkers,
      failedWorkers,
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      averageResponseTime: this.calculateAverage(this.metrics.responseTimes),
      throughput: (this.metrics.totalRequests / duration) * 1000 // requests per second
    };
  }

  async createWorker(endpoint, endTime, workerId) {
    let requests = 0;
    
    while (Date.now() < endTime) {
      try {
        await this.testSingleRequest(endpoint, `Worker ${workerId}`);
        requests++;
        await this.delay(CONFIG.REQUEST_DELAY);
      } catch (error) {
        // Worker continues even if individual requests fail
      }
    }
    
    return { workerId, requests };
  }

  // Stress test - gradually increase load
  async stressTest(endpoint, maxUsers = 20, stepDuration = 5000) {
    this.log(`💪 Starting stress test on ${endpoint}`);
    const results = [];
    
    for (let users = 1; users <= maxUsers; users += 2) {
      this.log(`Testing with ${users} concurrent users...`);
      
      // Reset metrics for this step
      this.resetMetrics();
      
      const stepStartTime = Date.now();
      const workers = [];
      
      for (let i = 0; i < users; i++) {
        const worker = this.createWorker(endpoint, stepStartTime + stepDuration, i);
        workers.push(worker);
      }
      
      await Promise.allSettled(workers);
      
      const stepResult = {
        concurrentUsers: users,
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        averageResponseTime: this.calculateAverage(this.metrics.responseTimes),
        throughput: (this.metrics.totalRequests / stepDuration) * 1000,
        errorRate: (this.metrics.failedRequests / this.metrics.totalRequests) * 100
      };
      
      results.push(stepResult);
      
      // Brief pause between steps
      await this.delay(1000);
    }
    
    return results;
  }

  // Memory and resource usage test
  async resourceUsageTest() {
    this.log('🔍 Testing resource usage...');
    
    const initialMemory = process.memoryUsage();
    const startTime = performance.now();
    
    // Make many requests to test memory leaks
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(this.testSingleRequest(`${CONFIG.API_BASE}/health`, `Resource test ${i}`));
      if (i % 10 === 0) {
        await this.delay(100); // Brief pause every 10 requests
      }
    }
    
    await Promise.allSettled(promises);
    
    const finalMemory = process.memoryUsage();
    const endTime = performance.now();
    
    return {
      duration: Math.round(endTime - startTime),
      initialMemory: initialMemory,
      finalMemory: finalMemory,
      memoryIncrease: {
        rss: finalMemory.rss - initialMemory.rss,
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
        external: finalMemory.external - initialMemory.external
      }
    };
  }

  // Database performance test
  async databasePerformanceTest(accessToken) {
    if (!accessToken) {
      return { skipped: true, reason: 'No access token provided' };
    }
    
    this.log('🗄️ Testing database performance...');
    
    const dbEndpoints = [
      '/api/v1/auth/me',
      '/api/v1/posts',
      '/api/v1/communities'
    ];
    
    const results = {};
    
    for (const endpoint of dbEndpoints) {
      const dbStartTime = performance.now();
      try {
        const response = await axios.get(`${CONFIG.API_BASE}${endpoint}`, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
          timeout: CONFIG.TIMEOUT
        });
        const dbEndTime = performance.now();
        
        results[endpoint] = {
          responseTime: Math.round(dbEndTime - dbStartTime),
          statusCode: response.status,
          success: true
        };
      } catch (error) {
        const dbEndTime = performance.now();
        results[endpoint] = {
          responseTime: Math.round(dbEndTime - dbStartTime),
          statusCode: error.response?.status || 0,
          success: false,
          error: error.message
        };
      }
      
      await this.delay(200);
    }
    
    return results;
  }

  // Response time percentiles
  calculatePercentiles(responseTimes) {
    if (responseTimes.length === 0) return {};
    
    const sorted = responseTimes.sort((a, b) => a - b);
    
    return {
      p50: this.getPercentile(sorted, 50),
      p75: this.getPercentile(sorted, 75),
      p90: this.getPercentile(sorted, 90),
      p95: this.getPercentile(sorted, 95),
      p99: this.getPercentile(sorted, 99),
      min: Math.min(...sorted),
      max: Math.max(...sorted)
    };
  }

  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return Math.round(sortedArray[index] || 0);
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errorRates: {},
      throughput: 0
    };
  }

  async runPerformanceTests() {
    console.log('🚀 Starting Performance Test Suite for CRYB Platform\n');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      platform: {
        api: CONFIG.API_BASE,
        web: CONFIG.WEB_BASE
      },
      configuration: {
        concurrentUsers: CONFIG.CONCURRENT_USERS,
        testDuration: CONFIG.TEST_DURATION,
        timeout: CONFIG.TIMEOUT
      },
      tests: {}
    };

    // Test 1: Basic response times
    this.log('1️⃣ Testing basic response times...');
    this.resetMetrics();
    
    const basicEndpoints = [
      `${CONFIG.API_BASE}/health`,
      `${CONFIG.WEB_BASE}`,
      `${CONFIG.API_BASE}/documentation`
    ];
    
    const basicResults = {};
    for (const endpoint of basicEndpoints) {
      const result = await this.testSingleRequest(endpoint, 'Basic test');
      basicResults[endpoint] = result;
      await this.delay(100);
    }
    
    testResults.tests.basicResponseTimes = {
      results: basicResults,
      percentiles: this.calculatePercentiles(this.metrics.responseTimes)
    };

    // Test 2: Load test on health endpoint
    this.log('2️⃣ Running load test...');
    this.resetMetrics();
    testResults.tests.loadTest = await this.loadTest(`${CONFIG.API_BASE}/health`, 10000);

    // Test 3: Stress test
    this.log('3️⃣ Running stress test...');
    this.resetMetrics();
    testResults.tests.stressTest = await this.stressTest(`${CONFIG.API_BASE}/health`, 10, 3000);

    // Test 4: Resource usage
    this.log('4️⃣ Testing resource usage...');
    this.resetMetrics();
    testResults.tests.resourceUsage = await this.resourceUsageTest();

    // Test 5: Database performance
    this.log('5️⃣ Testing database performance...');
    testResults.tests.databasePerformance = await this.databasePerformanceTest();

    this.generatePerformanceReport(testResults);
    return testResults;
  }

  generatePerformanceReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('                    PERFORMANCE TEST REPORT');
    console.log('='.repeat(80));
    
    // Basic Response Times
    console.log('\n📊 BASIC RESPONSE TIMES:');
    Object.entries(results.tests.basicResponseTimes.results).forEach(([endpoint, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${endpoint}: ${result.responseTime}ms (${result.statusCode})`);
    });
    
    const percentiles = results.tests.basicResponseTimes.percentiles;
    console.log(`   Percentiles: p50=${percentiles.p50}ms, p95=${percentiles.p95}ms, p99=${percentiles.p99}ms`);

    // Load Test Results
    console.log('\n🔥 LOAD TEST RESULTS:');
    const loadTest = results.tests.loadTest;
    console.log(`   Duration: ${loadTest.duration}s`);
    console.log(`   Concurrent Users: ${loadTest.concurrentUsers}`);
    console.log(`   Total Requests: ${loadTest.totalRequests}`);
    console.log(`   Successful: ${loadTest.successfulRequests} (${((loadTest.successfulRequests/loadTest.totalRequests)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${loadTest.failedRequests}`);
    console.log(`   Average Response Time: ${loadTest.averageResponseTime}ms`);
    console.log(`   Throughput: ${loadTest.throughput.toFixed(2)} req/s`);

    // Stress Test Results
    console.log('\n💪 STRESS TEST RESULTS:');
    results.tests.stressTest.forEach(step => {
      console.log(`   ${step.concurrentUsers} users: ${step.throughput.toFixed(2)} req/s, ${step.averageResponseTime}ms avg, ${step.errorRate.toFixed(1)}% errors`);
    });

    // Resource Usage
    console.log('\n🔍 RESOURCE USAGE:');
    const resource = results.tests.resourceUsage;
    console.log(`   Test Duration: ${resource.duration}ms`);
    console.log(`   Memory Increase: ${(resource.memoryIncrease.heapUsed/1024/1024).toFixed(2)}MB heap`);
    console.log(`   RSS Increase: ${(resource.memoryIncrease.rss/1024/1024).toFixed(2)}MB`);

    // Performance Recommendations
    console.log('\n🎯 PERFORMANCE RECOMMENDATIONS:');
    
    if (loadTest.averageResponseTime > 1000) {
      console.log('   ⚠️  High average response time detected. Consider optimizing database queries.');
    }
    
    if (loadTest.throughput < 10) {
      console.log('   ⚠️  Low throughput detected. Consider scaling infrastructure.');
    }
    
    if ((resource.memoryIncrease.heapUsed / 1024 / 1024) > 50) {
      console.log('   ⚠️  High memory usage increase. Check for memory leaks.');
    }
    
    if (loadTest.failedRequests / loadTest.totalRequests > 0.05) {
      console.log('   ⚠️  High error rate detected. Review error handling and capacity.');
    } else {
      console.log('   ✅ Error rate within acceptable limits.');
    }
    
    if (loadTest.averageResponseTime < 500 && loadTest.throughput > 20) {
      console.log('   ✅ Good performance metrics detected. Platform performs well under load.');
    }

    console.log('\n' + '='.repeat(80));
    
    // Save detailed report
    require('fs').writeFileSync('performance-test-report.json', JSON.stringify(results, null, 2));
    console.log('📄 Performance report saved to: performance-test-report.json\n');
  }
}

// Run the tests
async function main() {
  const testSuite = new PerformanceTestSuite();
  try {
    await testSuite.runPerformanceTests();
  } catch (error) {
    console.error('💥 Performance test suite crashed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTestSuite;