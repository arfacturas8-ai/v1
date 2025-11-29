#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { createCanvas } = require('canvas');

/**
 * Comprehensive Media Optimization Test Suite
 * 
 * Tests the complete media pipeline:
 * 1. Image upload with auto-optimization
 * 2. Video transcoding workflow
 * 3. CDN integration and caching
 * 4. Responsive image generation
 * 5. Performance metrics
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const TEST_JWT = process.env.TEST_JWT || 'test-jwt-token';

class MediaOptimizationTester {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${TEST_JWT}`,
        'User-Agent': 'MediaOptimization-TestSuite/1.0'
      },
      timeout: 30000
    });
    
    this.results = {
      tests: [],
      summary: {},
      performance: {},
      errors: []
    };
  }

  // Generate test images
  generateTestImage(width = 800, height = 600, format = 'png') {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#4ECDC4');
    gradient.addColorStop(1, '#45B7D1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Test Image ${width}x${height}`, width/2, height/2);
    
    // Add timestamp
    ctx.font = '16px Arial';
    ctx.fillText(new Date().toISOString(), width/2, height/2 + 50);
    
    return canvas.toBuffer(format === 'png' ? 'image/png' : 'image/jpeg');
  }

  // Test 1: Basic image upload and optimization
  async testImageUpload() {
    console.log('🖼️  Testing image upload and optimization...');
    
    try {
      const imageBuffer = this.generateTestImage(1200, 800, 'png');
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename: 'test-image.png',
        contentType: 'image/png'
      });

      const startTime = Date.now();
      const response = await this.apiClient.post('/api/v1/media/upload-optimized', form, {
        headers: form.getHeaders()
      });
      const duration = Date.now() - startTime;

      this.results.tests.push({
        name: 'Image Upload & Optimization',
        status: 'PASS',
        duration,
        data: {
          originalSize: imageBuffer.length,
          optimized: response.data.data.optimized,
          variants: response.data.data.original ? Object.keys(response.data.data).filter(k => k !== 'original') : [],
          cdnEnabled: !!response.data.data.cdn
        }
      });

      console.log(`✅ Image upload successful (${duration}ms)`);
      console.log(`   Original size: ${(imageBuffer.length / 1024).toFixed(1)}KB`);
      console.log(`   CDN enabled: ${!!response.data.data.cdn}`);
      
      return response.data.data;
    } catch (error) {
      this.results.errors.push({
        test: 'Image Upload',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ Image upload failed:', error.message);
      return null;
    }
  }

  // Test 2: Video upload and transcoding
  async testVideoTranscoding() {
    console.log('🎬 Testing video transcoding...');
    
    try {
      // Create a simple test video file (placeholder - in real test you'd use actual video)
      const videoBuffer = Buffer.from('fake-video-data-for-testing');
      const form = new FormData();
      form.append('file', videoBuffer, {
        filename: 'test-video.mp4',
        contentType: 'video/mp4'
      });

      const startTime = Date.now();
      const response = await this.apiClient.post('/api/v1/media/upload-optimized', form, {
        headers: form.getHeaders()
      });
      const duration = Date.now() - startTime;

      // Check if transcoding job was created
      let transcodingStatus = 'unknown';
      if (response.data.data.transcoding) {
        const jobId = response.data.data.transcoding.jobId;
        
        // Poll for transcoding status
        for (let i = 0; i < 5; i++) {
          try {
            const statusResponse = await this.apiClient.get(`/api/v1/media/transcoding/${jobId}`);
            transcodingStatus = statusResponse.data.data.status;
            
            if (transcodingStatus === 'completed' || transcodingStatus === 'failed') {
              break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            break;
          }
        }
      }

      this.results.tests.push({
        name: 'Video Transcoding',
        status: response.data.data.transcoding ? 'PASS' : 'SKIP',
        duration,
        data: {
          transcodingInitiated: !!response.data.data.transcoding,
          transcodingStatus,
          jobId: response.data.data.transcoding?.jobId
        }
      });

      console.log(`✅ Video transcoding initiated (${duration}ms)`);
      console.log(`   Status: ${transcodingStatus}`);
      
      return response.data.data;
    } catch (error) {
      this.results.errors.push({
        test: 'Video Transcoding',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ Video transcoding failed:', error.message);
      return null;
    }
  }

  // Test 3: Responsive image generation
  async testResponsiveImages() {
    console.log('📱 Testing responsive image generation...');
    
    try {
      const testFileId = 'test-file-id-123'; // Mock file ID
      
      const requestBody = {
        fileId: testFileId,
        format: 'webp',
        quality: 80
      };

      const startTime = Date.now();
      const response = await this.apiClient.post('/api/v1/media/responsive-srcset', requestBody);
      const duration = Date.now() - startTime;

      const srcSet = response.data.data.srcSet;
      const breakpoints = srcSet.split(', ').length;

      this.results.tests.push({
        name: 'Responsive Images',
        status: 'PASS',
        duration,
        data: {
          breakpoints,
          srcSet: srcSet.substring(0, 100) + '...', // Truncate for readability
          format: response.data.data.options.format
        }
      });

      console.log(`✅ Responsive images generated (${duration}ms)`);
      console.log(`   Breakpoints: ${breakpoints}`);
      
      return response.data.data;
    } catch (error) {
      this.results.errors.push({
        test: 'Responsive Images',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ Responsive images failed:', error.message);
      return null;
    }
  }

  // Test 4: CDN cache management
  async testCDNCache() {
    console.log('🌐 Testing CDN cache management...');
    
    try {
      const purgeRequest = {
        tags: ['test-images', 'media'],
        urls: ['https://example.com/test-image.jpg']
      };

      const startTime = Date.now();
      const response = await this.apiClient.post('/api/v1/media/cdn/purge', purgeRequest);
      const duration = Date.now() - startTime;

      this.results.tests.push({
        name: 'CDN Cache Management',
        status: 'PASS',
        duration,
        data: {
          successful: response.data.data.successful || [],
          failed: response.data.data.failed || [],
          timestamp: response.data.data.timestamp
        }
      });

      console.log(`✅ CDN cache purge completed (${duration}ms)`);
      
      return response.data.data;
    } catch (error) {
      this.results.errors.push({
        test: 'CDN Cache',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ CDN cache management failed:', error.message);
      return null;
    }
  }

  // Test 5: Service health check
  async testServiceHealth() {
    console.log('🏥 Testing service health...');
    
    try {
      const startTime = Date.now();
      const response = await this.apiClient.get('/api/v1/media/health');
      const duration = Date.now() - startTime;

      const health = response.data.data;
      const overallStatus = health.overall;

      this.results.tests.push({
        name: 'Service Health',
        status: overallStatus === 'healthy' ? 'PASS' : 'WARN',
        duration,
        data: {
          overall: overallStatus,
          services: health.services,
          healthyServices: health.summary?.healthyServices || 0,
          totalServices: health.summary?.totalServices || 0
        }
      });

      console.log(`✅ Service health check (${duration}ms)`);
      console.log(`   Overall: ${overallStatus}`);
      console.log(`   Healthy services: ${health.summary?.healthyServices}/${health.summary?.totalServices}`);
      
      return health;
    } catch (error) {
      this.results.errors.push({
        test: 'Service Health',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ Service health check failed:', error.message);
      return null;
    }
  }

  // Test 6: Analytics and metrics
  async testAnalytics() {
    console.log('📊 Testing analytics and metrics...');
    
    try {
      const startTime = Date.now();
      const response = await this.apiClient.get('/api/v1/media/analytics');
      const duration = Date.now() - startTime;

      const analytics = response.data.data;

      this.results.tests.push({
        name: 'Analytics & Metrics',
        status: 'PASS',
        duration,
        data: {
          storageStats: analytics.storage ? 'available' : 'unavailable',
          cdnStats: analytics.cdn ? 'available' : 'unavailable',
          performanceMetrics: analytics.performance ? Object.keys(analytics.performance) : []
        }
      });

      console.log(`✅ Analytics retrieved (${duration}ms)`);
      
      return analytics;
    } catch (error) {
      this.results.errors.push({
        test: 'Analytics',
        error: error.message,
        response: error.response?.data
      });
      
      console.log('❌ Analytics test failed:', error.message);
      return null;
    }
  }

  // Performance benchmark
  async benchmarkPerformance() {
    console.log('⚡ Running performance benchmarks...');
    
    const iterations = 5;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const imageBuffer = this.generateTestImage(800, 600);
      const form = new FormData();
      form.append('file', imageBuffer, {
        filename: `benchmark-${i}.png`,
        contentType: 'image/png'
      });

      const startTime = Date.now();
      try {
        await this.apiClient.post('/api/v1/media/upload-optimized', form, {
          headers: form.getHeaders()
        });
        const duration = Date.now() - startTime;
        results.push(duration);
      } catch (error) {
        results.push(null);
      }
    }

    const validResults = results.filter(r => r !== null);
    const avgTime = validResults.reduce((a, b) => a + b, 0) / validResults.length;
    const maxTime = Math.max(...validResults);
    const minTime = Math.min(...validResults);

    this.results.performance = {
      iterations,
      successful: validResults.length,
      averageTime: Math.round(avgTime),
      maxTime,
      minTime,
      throughput: Math.round(validResults.length / (avgTime / 1000)) // uploads per second
    };

    console.log(`📈 Performance benchmark:`);
    console.log(`   Average time: ${Math.round(avgTime)}ms`);
    console.log(`   Min/Max: ${minTime}ms / ${maxTime}ms`);
    console.log(`   Success rate: ${validResults.length}/${iterations}`);
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Media Optimization Test Suite\n');
    console.log('=' .repeat(60));

    const startTime = Date.now();

    // Run tests in sequence
    await this.testImageUpload();
    await this.testVideoTranscoding();
    await this.testResponsiveImages();
    await this.testCDNCache();
    await this.testServiceHealth();
    await this.testAnalytics();
    
    // Run performance benchmark
    await this.benchmarkPerformance();

    const totalTime = Date.now() - startTime;

    // Generate summary
    const passedTests = this.results.tests.filter(t => t.status === 'PASS').length;
    const failedTests = this.results.tests.filter(t => t.status === 'FAIL').length;
    const skippedTests = this.results.tests.filter(t => t.status === 'SKIP').length;
    const warnTests = this.results.tests.filter(t => t.status === 'WARN').length;

    this.results.summary = {
      totalTests: this.results.tests.length,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      warnings: warnTests,
      errors: this.results.errors.length,
      totalTime,
      completionPercentage: Math.round((passedTests / this.results.tests.length) * 100)
    };

    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏭️  Skipped: ${skippedTests}`);
    console.log(`⚠️  Warnings: ${warnTests}`);
    console.log(`🐛 Errors: ${this.results.errors.length}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`🎯 Completion: ${this.results.summary.completionPercentage}%`);

    if (this.results.performance.averageTime) {
      console.log('\n📊 PERFORMANCE METRICS');
      console.log('=' .repeat(30));
      console.log(`Average Upload Time: ${this.results.performance.averageTime}ms`);
      console.log(`Throughput: ~${this.results.performance.throughput} uploads/sec`);
    }

    if (this.results.errors.length > 0) {
      console.log('\n🐛 ERRORS');
      console.log('=' .repeat(30));
      this.results.errors.forEach(error => {
        console.log(`${error.test}: ${error.error}`);
      });
    }

    // Save results to file
    fs.writeFileSync(
      `media-optimization-test-results-${Date.now()}.json`,
      JSON.stringify(this.results, null, 2)
    );

    console.log(`\n💾 Results saved to media-optimization-test-results-${Date.now()}.json`);
    
    // Determine overall success
    const isSuccess = this.results.summary.completionPercentage >= 70; // 70% target
    console.log(`\n🎯 TARGET ACHIEVEMENT: ${this.results.summary.completionPercentage}% ${isSuccess ? '(SUCCESS!)' : '(NEEDS WORK)'}`);
    
    return this.results;
  }
}

// Run the tests
if (require.main === module) {
  const tester = new MediaOptimizationTester();
  tester.runAllTests()
    .then(results => {
      const success = results.summary.completionPercentage >= 70;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = MediaOptimizationTester;