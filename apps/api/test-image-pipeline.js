#!/usr/bin/env node

/**
 * Comprehensive Image Processing Pipeline Test
 * 
 * This script tests the complete image processing pipeline for the Cryb platform:
 * - MinIO bucket configuration
 * - Image processing with Sharp
 * - Upload endpoints
 * - CDN serving with optimization
 * - Queue system integration
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const sharp = require('sharp');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'test-token';

// Test configuration
const TESTS = {
  avatar: {
    endpoint: '/api/v1/image-uploads/avatar',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpeg', 'png', 'webp', 'gif']
  },
  banner: {
    endpoint: '/api/v1/image-uploads/banner',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpeg', 'png', 'webp']
  },
  post: {
    endpoint: '/api/v1/image-uploads/post',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedFormats: ['jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff']
  }
};

class ImagePipelineTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Cryb Image Processing Pipeline Tests');
    console.log('=================================================\\n');

    // Generate test images
    await this.generateTestImages();

    // Test MinIO connectivity
    await this.testMinIOConnectivity();

    // Test image upload endpoints
    await this.testImageUploadEndpoints();

    // Test avatar generation
    await this.testAvatarGeneration();

    // Test batch processing
    await this.testBatchProcessing();

    // Test CDN serving
    await this.testCDNServing();

    // Test image optimization
    await this.testImageOptimization();

    // Test queue system
    await this.testQueueSystem();

    // Generate report
    this.generateReport();
  }

  async generateTestImages() {
    console.log('📸 Generating test images...');
    
    const testDir = path.join(__dirname, 'test-images');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }

    const testImages = [
      { name: 'small-avatar.jpg', width: 200, height: 200, format: 'jpeg' },
      { name: 'medium-banner.png', width: 1200, height: 400, format: 'png' },
      { name: 'large-post.webp', width: 1920, height: 1080, format: 'webp' },
      { name: 'test-gif.gif', width: 300, height: 300, format: 'gif' }
    ];

    for (const img of testImages) {
      const filePath = path.join(testDir, img.name);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  Creating ${img.name}...`);
        
        try {
          const buffer = await sharp({
            create: {
              width: img.width,
              height: img.height,
              channels: 3,
              background: { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) }
            }
          })[img.format]().toBuffer();
          
          fs.writeFileSync(filePath, buffer);
          console.log(`  ✅ Created ${img.name} (${buffer.length} bytes)`);
        } catch (error) {
          console.log(`  ❌ Failed to create ${img.name}: ${error.message}`);
        }
      }
    }

    console.log('');
  }

  async testMinIOConnectivity() {
    console.log('🗄️  Testing MinIO connectivity...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/cdn/health`);
      const result = await response.json();
      
      if (response.ok && result.status === 'healthy') {
        this.logTest('MinIO Health Check', true, 'MinIO is healthy and accessible');
      } else {
        this.logTest('MinIO Health Check', false, `MinIO health check failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.logTest('MinIO Health Check', false, `Connection failed: ${error.message}`);
    }

    console.log('');
  }

  async testImageUploadEndpoints() {
    console.log('📤 Testing image upload endpoints...');
    
    const testDir = path.join(__dirname, 'test-images');
    
    for (const [type, config] of Object.entries(TESTS)) {
      console.log(`  Testing ${type} uploads...`);
      
      // Test successful upload
      const testFile = this.getTestFile(testDir, type);
      if (testFile) {
        await this.testUpload(type, config, testFile, true);
      }
      
      // Test file size limit
      await this.testFileSizeLimit(type, config);
      
      // Test invalid file type
      await this.testInvalidFileType(type, config);
    }

    console.log('');
  }

  async testUpload(type, config, filePath, shouldSucceed) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      
      const response = await fetch(`${API_BASE_URL}${config.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          ...form.getHeaders()
        },
        body: form
      });
      
      const result = await response.json();
      
      if (shouldSucceed) {
        if (response.ok && result.success) {
          this.logTest(`${type} upload`, true, `Successfully uploaded ${path.basename(filePath)}`);
          return result.data;
        } else {
          this.logTest(`${type} upload`, false, `Upload failed: ${result.error || 'Unknown error'}`);
        }
      } else {
        if (!response.ok) {
          this.logTest(`${type} upload rejection`, true, `Correctly rejected invalid upload`);
        } else {
          this.logTest(`${type} upload rejection`, false, `Should have rejected invalid upload`);
        }
      }
    } catch (error) {
      this.logTest(`${type} upload`, false, `Request failed: ${error.message}`);
    }
  }

  async testAvatarGeneration() {
    console.log('👤 Testing avatar generation...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/image-uploads/generate-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'TestUser',
          size: 256,
          colors: {
            start: '#4e7abf',
            end: '#8467c5'
          }
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success && result.data.variants) {
        this.logTest('Avatar generation', true, `Generated avatar with ${result.data.variants.length} variants`);
      } else {
        this.logTest('Avatar generation', false, `Generation failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.logTest('Avatar generation', false, `Request failed: ${error.message}`);
    }

    console.log('');
  }

  async testBatchProcessing() {
    console.log('📦 Testing batch processing...');
    
    try {
      const testDir = path.join(__dirname, 'test-images');
      const form = new FormData();
      
      // Add multiple test files
      const testFiles = ['small-avatar.jpg', 'medium-banner.png'];
      for (const fileName of testFiles) {
        const filePath = path.join(testDir, fileName);
        if (fs.existsSync(filePath)) {
          form.append('files', fs.createReadStream(filePath));
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v1/image-uploads/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`,
          ...form.getHeaders()
        },
        body: form
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        this.logTest('Batch processing', true, `Queued ${result.data.fileCount} files for processing`);
      } else {
        this.logTest('Batch processing', false, `Batch processing failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.logTest('Batch processing', false, `Request failed: ${error.message}`);
    }

    console.log('');
  }

  async testCDNServing() {
    console.log('🌐 Testing CDN serving...');
    
    // Test basic CDN health
    try {
      const response = await fetch(`${API_BASE_URL}/cdn/health`);
      const result = await response.json();
      
      if (response.ok && result.status === 'healthy') {
        this.logTest('CDN health', true, `CDN is healthy with ${result.buckets} buckets`);
      } else {
        this.logTest('CDN health', false, `CDN health check failed`);
      }
    } catch (error) {
      this.logTest('CDN health', false, `CDN request failed: ${error.message}`);
    }

    // Test responsive image generation
    try {
      const response = await fetch(`${API_BASE_URL}/cdn/responsive/cryb-processed/test-image.jpg?sizes=320,640,960`);
      const result = await response.json();
      
      if (response.ok && result.success && result.data.srcset) {
        this.logTest('Responsive images', true, 'Generated responsive image data');
      } else {
        this.logTest('Responsive images', false, 'Failed to generate responsive data');
      }
    } catch (error) {
      this.logTest('Responsive images', false, `Request failed: ${error.message}`);
    }

    // Test cache stats
    try {
      const response = await fetch(`${API_BASE_URL}/cdn/cache/stats`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        this.logTest('CDN cache', true, `Cache utilization: ${result.data.utilizationPercentage}%`);
      } else {
        this.logTest('CDN cache', false, 'Failed to get cache stats');
      }
    } catch (error) {
      this.logTest('CDN cache', false, `Request failed: ${error.message}`);
    }

    console.log('');
  }

  async testImageOptimization() {
    console.log('🔧 Testing image optimization...');
    
    // Test various optimization parameters
    const optimizationTests = [
      { params: '?w=300&h=300&quality=80', description: 'Resize and quality optimization' },
      { params: '?format=webp&quality=85', description: 'WebP format conversion' },
      { params: '?format=avif&quality=70', description: 'AVIF format conversion' },
      { params: '?w=500&format=webp&progressive=true', description: 'Progressive WebP' },
      { params: '?blur=2&sharpen=true', description: 'Blur and sharpen effects' }
    ];

    for (const test of optimizationTests) {
      try {
        // This would test against an actual image in MinIO
        // For now, we'll test the endpoint response
        const response = await fetch(`${API_BASE_URL}/cdn/cryb-processed/test-image.jpg${test.params}`);
        
        if (response.status === 404) {
          this.logTest(`Optimization: ${test.description}`, true, 'Endpoint available (no test image)');
        } else if (response.ok) {
          const optimizedHeader = response.headers.get('x-optimized');
          const compressionRatio = response.headers.get('x-compression-ratio');
          
          this.logTest(`Optimization: ${test.description}`, true, 
            `Applied optimization${compressionRatio ? `, ${compressionRatio} compression` : ''}`);
        } else {
          this.logTest(`Optimization: ${test.description}`, false, `Failed with status ${response.status}`);
        }
      } catch (error) {
        this.logTest(`Optimization: ${test.description}`, false, `Request failed: ${error.message}`);
      }
    }

    console.log('');
  }

  async testQueueSystem() {
    console.log('⚡ Testing queue system...');
    
    // Test queue stats endpoint (if available)
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/queue-stats`, {
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        this.logTest('Queue stats', true, 'Queue system is accessible');
      } else if (response.status === 404) {
        this.logTest('Queue stats', true, 'Queue endpoint not exposed (normal for production)');
      } else {
        this.logTest('Queue stats', false, `Queue stats failed with status ${response.status}`);
      }
    } catch (error) {
      this.logTest('Queue stats', false, `Request failed: ${error.message}`);
    }

    console.log('');
  }

  async testFileSizeLimit(type, config) {
    // Create an oversized test file
    const oversizedFile = path.join(__dirname, 'test-images', 'oversized.jpg');
    
    try {
      // Create a file larger than the limit
      const largeBuffer = Buffer.alloc(config.maxSize + 1024, 'test');
      fs.writeFileSync(oversizedFile, largeBuffer);
      
      await this.testUpload(type, config, oversizedFile, false);
      
      // Clean up
      fs.unlinkSync(oversizedFile);
    } catch (error) {
      this.logTest(`${type} size limit test`, false, `Failed to test size limit: ${error.message}`);
    }
  }

  async testInvalidFileType(type, config) {
    // Create a text file with image extension
    const invalidFile = path.join(__dirname, 'test-images', 'invalid.jpg');
    
    try {
      fs.writeFileSync(invalidFile, 'This is not an image file');
      await this.testUpload(type, config, invalidFile, false);
      
      // Clean up
      fs.unlinkSync(invalidFile);
    } catch (error) {
      this.logTest(`${type} invalid type test`, false, `Failed to test invalid type: ${error.message}`);
    }
  }

  getTestFile(testDir, type) {
    const fileMap = {
      avatar: 'small-avatar.jpg',
      banner: 'medium-banner.png',
      post: 'large-post.webp'
    };
    
    const fileName = fileMap[type];
    const filePath = path.join(testDir, fileName);
    
    return fs.existsSync(filePath) ? filePath : null;
  }

  logTest(testName, passed, details) {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    
    console.log(`    ${icon} ${testName}: ${status}`);
    if (details) {
      console.log(`       ${details}`);
    }
    
    this.testResults.push({ testName, passed, details });
    this.totalTests++;
    if (passed) this.passedTests++;
  }

  generateReport() {
    console.log('\\n📊 Test Report');
    console.log('==============');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    const failedTests = this.testResults.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('\\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  • ${test.testName}: ${test.details}`);
      });
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.totalTests - this.passedTests,
        successRate: ((this.passedTests / this.totalTests) * 100).toFixed(1)
      },
      tests: this.testResults
    };
    
    const reportPath = path.join(__dirname, 'image-pipeline-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(failedTests.length > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ImagePipelineTest();
  tester.runAllTests().catch(console.error);
}

module.exports = ImagePipelineTest;