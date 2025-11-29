#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

/**
 * Simple Media Optimization Test
 * Tests the key functionality to verify 70% completion
 */

const API_BASE = 'http://localhost:3002/api/v1';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2MzAwMDAwMDB9.test';

class SimpleMediaTester {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async testHealthCheck() {
    console.log('🏥 Testing media service health...');
    try {
      const response = await this.client.get('/media/health');
      const health = response.data.data;
      
      console.log(`✅ Health Check: ${health.overall}`);
      console.log(`   Services: ${JSON.stringify(health.services, null, 2)}`);
      return true;
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
      return false;
    }
  }

  async testAnalytics() {
    console.log('📊 Testing analytics endpoint...');
    try {
      const response = await this.client.get('/media/analytics');
      const analytics = response.data.data;
      
      console.log('✅ Analytics retrieved');
      console.log(`   Storage: ${analytics.storage ? 'Available' : 'Unavailable'}`);
      console.log(`   Performance: ${analytics.performance ? JSON.stringify(analytics.performance) : 'N/A'}`);
      return true;
    } catch (error) {
      console.log(`❌ Analytics failed: ${error.message}`);
      return false;
    }
  }

  async testResponsiveImages() {
    console.log('📱 Testing responsive image generation...');
    try {
      const response = await this.client.post('/media/responsive-srcset', {
        fileId: 'test-file-123',
        format: 'webp',
        quality: 80
      });
      
      console.log('✅ Responsive images generated');
      console.log(`   SrcSet: ${response.data.data.srcSet.substring(0, 100)}...`);
      return true;
    } catch (error) {
      console.log(`❌ Responsive images failed: ${error.message}`);
      return false;
    }
  }

  async testCDNPurge() {
    console.log('🌐 Testing CDN cache purge...');
    try {
      const response = await this.client.post('/media/cdn/purge', {
        tags: ['test', 'media'],
        urls: ['https://example.com/test.jpg']
      });
      
      console.log('✅ CDN purge completed');
      console.log(`   Result: ${JSON.stringify(response.data.data)}`);
      return true;
    } catch (error) {
      console.log(`❌ CDN purge failed: ${error.message}`);
      return false;
    }
  }

  async testStorageStats() {
    console.log('💾 Testing storage statistics...');
    try {
      const response = await this.client.get('/media/storage/stats');
      const stats = response.data.data;
      
      console.log('✅ Storage stats retrieved');
      console.log(`   Total Files: ${stats.overview.totalFiles}`);
      console.log(`   Total Size: ${stats.overview.totalSizeMB}MB`);
      return true;
    } catch (error) {
      console.log(`❌ Storage stats failed: ${error.message}`);
      return false;
    }
  }

  async runTests() {
    console.log('🚀 Starting Simple Media Test Suite');
    console.log('=' .repeat(50));
    
    const tests = [
      this.testHealthCheck(),
      this.testAnalytics(),
      this.testResponsiveImages(),
      this.testCDNPurge(),
      this.testStorageStats()
    ];
    
    const results = await Promise.allSettled(tests);
    const passed = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\n' + '=' .repeat(50));
    console.log('📋 TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`🎯 Success Rate: ${percentage}%`);
    
    if (percentage >= 70) {
      console.log('🎉 SUCCESS: Media optimization is 70%+ complete!');
      return true;
    } else {
      console.log('⚠️  NEEDS WORK: Below 70% target');
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SimpleMediaTester();
  tester.runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = SimpleMediaTester;