/**
 * CRYB Platform - File Upload Load & Performance Tests
 * 
 * Tests the file upload system under various load conditions:
 * - Concurrent uploads
 * - Large file handling
 * - Memory usage during uploads
 * - Network failure recovery
 * - MinIO performance
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class FileUploadLoadTester {
  constructor(config = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3002',
      maxConcurrentUploads: config.maxConcurrentUploads || 10,
      testDuration: config.testDuration || 60000, // 1 minute
      filesSizes: config.fileSizes || [
        1024,           // 1KB
        10 * 1024,      // 10KB
        100 * 1024,     // 100KB
        1024 * 1024,    // 1MB
        5 * 1024 * 1024, // 5MB
        10 * 1024 * 1024 // 10MB
      ],
      authToken: config.authToken || null,
      ...config
    };

    this.stats = {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      totalBytes: 0,
      uploadTimes: [],
      errors: [],
      memoryUsage: [],
      concurrentUploads: 0,
      peakConcurrency: 0
    };

    this.testFiles = new Map();
    this.activeUploads = new Set();
  }

  async initialize() {
    console.log('🚀 Initializing File Upload Load Tester...');
    
    // Create test files directory
    this.testDir = path.join(__dirname, '../fixtures/load-test');
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }

    // Generate test files of various sizes
    await this.generateTestFiles();
    
    // Authenticate if token is not provided
    if (!this.config.authToken) {
      this.config.authToken = await this.authenticate();
    }

    console.log('✅ Load tester initialized');
  }

  async generateTestFiles() {
    console.log('📁 Generating test files...');
    
    for (const size of this.config.filesSizes) {
      const filename = `test-file-${this.formatSize(size)}.bin`;
      const filePath = path.join(this.testDir, filename);
      
      if (!fs.existsSync(filePath)) {
        // Generate random binary data
        const buffer = crypto.randomBytes(size);
        fs.writeFileSync(filePath, buffer);
      }
      
      this.testFiles.set(size, filePath);
    }

    // Generate test images
    await this.generateTestImages();
    
    console.log(`✅ Generated ${this.testFiles.size} test files`);
  }

  async generateTestImages() {
    const imageSizes = [
      { width: 100, height: 100, name: 'small.jpg' },
      { width: 800, height: 600, name: 'medium.jpg' },
      { width: 1920, height: 1080, name: 'large.jpg' },
      { width: 4000, height: 3000, name: 'xlarge.jpg' }
    ];

    for (const { width, height, name } of imageSizes) {
      const filePath = path.join(this.testDir, name);
      if (!fs.existsSync(filePath)) {
        // Create a simple JPEG header and data
        const jpegHeader = Buffer.from([
          0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
          0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00
        ]);
        const imageData = crypto.randomBytes(width * height / 10); // Approximate compression
        const jpegFooter = Buffer.from([0xFF, 0xD9]);
        
        const fullImage = Buffer.concat([jpegHeader, imageData, jpegFooter]);
        fs.writeFileSync(filePath, fullImage);
      }
      
      this.testFiles.set(`image-${width}x${height}`, filePath);
    }
  }

  async authenticate() {
    console.log('🔐 Authenticating test user...');
    
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'loadtest@example.com',
          password: 'LoadTest123!'
        })
      });

      if (!response.ok) {
        // Try to create user first
        await fetch(`${this.config.apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'loadtest@example.com',
            username: 'loadtest',
            password: 'LoadTest123!',
            firstName: 'Load',
            lastName: 'Test'
          })
        });

        // Retry login
        const retryResponse = await fetch(`${this.config.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'loadtest@example.com',
            password: 'LoadTest123!'
          })
        });

        const retryData = await retryResponse.json();
        return retryData.data.token;
      }

      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  async uploadFile(filePath, uploadType = 'media', options = {}) {
    const uploadId = crypto.randomUUID();
    this.activeUploads.add(uploadId);
    this.stats.concurrentUploads++;
    this.stats.peakConcurrency = Math.max(this.stats.peakConcurrency, this.stats.concurrentUploads);

    const startTime = performance.now();
    
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      // Create File object from buffer
      const file = new File([fileBuffer], fileName, {
        type: this.getContentType(fileName)
      });
      
      formData.append('file', file);
      
      // Add test metadata
      formData.append('description', `Load test upload - ${uploadId}`);
      formData.append('category', this.getFileCategory(fileName));

      const response = await fetch(`${this.config.apiBaseUrl}/uploads/${uploadType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`
        },
        body: formData
      });

      const endTime = performance.now();
      const uploadTime = endTime - startTime;
      
      if (response.ok) {
        this.stats.successfulUploads++;
        this.stats.totalBytes += fileBuffer.length;
        this.stats.uploadTimes.push(uploadTime);
        
        return {
          success: true,
          uploadId,
          time: uploadTime,
          size: fileBuffer.length,
          response: await response.json()
        };
      } else {
        this.stats.failedUploads++;
        const errorText = await response.text();
        this.stats.errors.push({
          uploadId,
          error: `HTTP ${response.status}: ${errorText}`,
          time: uploadTime,
          file: fileName
        });
        
        return {
          success: false,
          uploadId,
          error: errorText,
          time: uploadTime
        };
      }
    } catch (error) {
      const endTime = performance.now();
      this.stats.failedUploads++;
      this.stats.errors.push({
        uploadId,
        error: error.message,
        time: endTime - startTime,
        file: path.basename(filePath)
      });
      
      return {
        success: false,
        uploadId,
        error: error.message,
        time: endTime - startTime
      };
    } finally {
      this.activeUploads.delete(uploadId);
      this.stats.concurrentUploads--;
      this.stats.totalUploads++;
    }
  }

  async runConcurrencyTest() {
    console.log(`🔄 Running concurrency test with ${this.config.maxConcurrentUploads} concurrent uploads...`);
    
    const promises = [];
    const startTime = performance.now();
    
    // Start memory monitoring
    const memoryMonitor = setInterval(() => {
      this.stats.memoryUsage.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });
    }, 1000);

    try {
      for (let i = 0; i < this.config.maxConcurrentUploads; i++) {
        // Randomly select file size
        const fileSizes = Array.from(this.testFiles.keys());
        const randomFileKey = fileSizes[Math.floor(Math.random() * fileSizes.length)];
        const filePath = this.testFiles.get(randomFileKey);
        
        const promise = this.uploadFile(filePath, 'media', { concurrent: true });
        promises.push(promise);
      }

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      
      clearInterval(memoryMonitor);
      
      console.log(`✅ Concurrency test completed in ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Results: ${results.filter(r => r.status === 'fulfilled' && r.value.success).length} success, ${results.filter(r => r.status === 'rejected' || !r.value?.success).length} failed`);
      
      return results;
    } catch (error) {
      clearInterval(memoryMonitor);
      throw error;
    }
  }

  async runLoadTest() {
    console.log(`⚡ Running load test for ${this.config.testDuration}ms...`);
    
    const startTime = Date.now();
    const endTime = startTime + this.config.testDuration;
    const uploadPromises = [];

    // Start memory monitoring
    const memoryMonitor = setInterval(() => {
      this.stats.memoryUsage.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });
    }, 2000);

    try {
      while (Date.now() < endTime) {
        // Maintain concurrent upload limit
        if (this.activeUploads.size < this.config.maxConcurrentUploads) {
          // Randomly select file
          const fileSizes = Array.from(this.testFiles.keys());
          const randomFileKey = fileSizes[Math.floor(Math.random() * fileSizes.length)];
          const filePath = this.testFiles.get(randomFileKey);
          
          const uploadPromise = this.uploadFile(filePath, 'media', { loadTest: true });
          uploadPromises.push(uploadPromise);
        }
        
        // Small delay to prevent overwhelming
        await this.sleep(100);
      }

      console.log('⏳ Waiting for remaining uploads to complete...');
      await Promise.allSettled(uploadPromises);
      
      clearInterval(memoryMonitor);
      
      console.log(`✅ Load test completed`);
      return this.generateReport();
    } catch (error) {
      clearInterval(memoryMonitor);
      throw error;
    }
  }

  async runLargeFileTest() {
    console.log('📦 Running large file test...');
    
    // Create a 50MB test file
    const largeFilePath = path.join(this.testDir, 'large-50mb.bin');
    if (!fs.existsSync(largeFilePath)) {
      console.log('📝 Creating 50MB test file...');
      const buffer = crypto.randomBytes(50 * 1024 * 1024);
      fs.writeFileSync(largeFilePath, buffer);
    }

    const startTime = performance.now();
    const result = await this.uploadFile(largeFilePath, 'media', { largeFile: true });
    const endTime = performance.now();

    console.log(`✅ Large file test completed in ${Math.round(endTime - startTime)}ms`);
    console.log(`📊 Success: ${result.success}, Size: ${this.formatSize(50 * 1024 * 1024)}`);
    
    return result;
  }

  async runFailureRecoveryTest() {
    console.log('🔧 Running failure recovery test...');
    
    const results = [];
    
    // Test with invalid auth token
    const originalToken = this.config.authToken;
    this.config.authToken = 'invalid-token';
    
    const filePath = this.testFiles.get(1024 * 1024); // 1MB file
    const result1 = await this.uploadFile(filePath, 'media', { testType: 'invalid-auth' });
    results.push({ test: 'invalid-auth', result: result1 });
    
    // Restore valid token
    this.config.authToken = originalToken;
    
    // Test upload after recovery
    const result2 = await this.uploadFile(filePath, 'media', { testType: 'recovery' });
    results.push({ test: 'recovery', result: result2 });
    
    console.log('✅ Failure recovery test completed');
    return results;
  }

  async runAvatarUploadTest() {
    console.log('👤 Running avatar upload test...');
    
    const avatarPath = this.testFiles.get('image-100x100');
    const results = [];
    
    // Test multiple avatar uploads
    for (let i = 0; i < 5; i++) {
      const result = await this.uploadFile(avatarPath, 'avatar', { iteration: i });
      results.push(result);
    }
    
    console.log(`✅ Avatar upload test completed: ${results.filter(r => r.success).length}/5 successful`);
    return results;
  }

  generateReport() {
    const avgUploadTime = this.stats.uploadTimes.length > 0 
      ? this.stats.uploadTimes.reduce((a, b) => a + b, 0) / this.stats.uploadTimes.length 
      : 0;
    
    const p95UploadTime = this.stats.uploadTimes.length > 0
      ? this.stats.uploadTimes.sort((a, b) => a - b)[Math.floor(this.stats.uploadTimes.length * 0.95)]
      : 0;

    const throughputMBps = this.stats.totalBytes / (1024 * 1024) / (this.config.testDuration / 1000);
    
    const maxMemory = this.stats.memoryUsage.length > 0
      ? Math.max(...this.stats.memoryUsage.map(m => m.usage.heapUsed))
      : 0;

    const report = {
      summary: {
        totalUploads: this.stats.totalUploads,
        successfulUploads: this.stats.successfulUploads,
        failedUploads: this.stats.failedUploads,
        successRate: this.stats.totalUploads > 0 ? (this.stats.successfulUploads / this.stats.totalUploads * 100).toFixed(2) + '%' : '0%',
        totalDataTransferred: this.formatSize(this.stats.totalBytes),
        peakConcurrency: this.stats.peakConcurrency
      },
      performance: {
        averageUploadTime: Math.round(avgUploadTime) + 'ms',
        p95UploadTime: Math.round(p95UploadTime) + 'ms',
        throughputMBps: throughputMBps.toFixed(2) + ' MB/s',
        maxMemoryUsage: this.formatSize(maxMemory)
      },
      errors: this.stats.errors.slice(0, 10), // First 10 errors
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const successRate = this.stats.totalUploads > 0 ? this.stats.successfulUploads / this.stats.totalUploads : 0;
    
    if (successRate < 0.95) {
      recommendations.push('Success rate is below 95%. Investigate error patterns and improve error handling.');
    }
    
    const avgUploadTime = this.stats.uploadTimes.reduce((a, b) => a + b, 0) / this.stats.uploadTimes.length;
    if (avgUploadTime > 5000) {
      recommendations.push('Average upload time is high. Consider optimizing file processing and storage.');
    }
    
    if (this.stats.peakConcurrency < this.config.maxConcurrentUploads * 0.8) {
      recommendations.push('Peak concurrency is low. Check for bottlenecks in concurrent processing.');
    }
    
    const errorPatterns = {};
    this.stats.errors.forEach(error => {
      const pattern = error.error.split(':')[0];
      errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
    });
    
    Object.entries(errorPatterns).forEach(([pattern, count]) => {
      if (count > this.stats.totalUploads * 0.1) {
        recommendations.push(`High frequency of "${pattern}" errors (${count} occurrences). Investigate root cause.`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All metrics look good! The file upload system is performing well.');
    }
    
    return recommendations;
  }

  // Utility methods
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.pdf': 'application/pdf',
      '.bin': 'application/octet-stream'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  getFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
    if (['.mp4', '.avi', '.mov'].includes(ext)) return 'video';
    if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
    if (['.pdf', '.doc', '.docx'].includes(ext)) return 'document';
    return 'general';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('🧹 Cleaning up test files...');
    try {
      fs.rmSync(this.testDir, { recursive: true, force: true });
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }
}

// Main test runner
async function runFileUploadLoadTests() {
  console.log('🚀 Starting CRYB File Upload Load Tests\n');
  
  const tester = new FileUploadLoadTester({
    maxConcurrentUploads: 20,
    testDuration: 30000, // 30 seconds
    apiBaseUrl: 'http://localhost:3002'
  });

  try {
    await tester.initialize();
    
    console.log('\n📋 Running Test Suite:\n');
    
    // 1. Concurrency Test
    console.log('1️⃣ Concurrency Test');
    await tester.runConcurrencyTest();
    
    // 2. Load Test
    console.log('\n2️⃣ Load Test');
    await tester.runLoadTest();
    
    // 3. Large File Test
    console.log('\n3️⃣ Large File Test');
    await tester.runLargeFileTest();
    
    // 4. Avatar Upload Test
    console.log('\n4️⃣ Avatar Upload Test');
    await tester.runAvatarUploadTest();
    
    // 5. Failure Recovery Test
    console.log('\n5️⃣ Failure Recovery Test');
    await tester.runFailureRecoveryTest();
    
    // Generate final report
    console.log('\n📊 Generating Final Report...\n');
    const report = tester.generateReport();
    
    console.log('='.repeat(80));
    console.log('📈 CRYB FILE UPLOAD LOAD TEST REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    Object.entries(report.summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n⚡ PERFORMANCE:');
    Object.entries(report.performance).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (report.errors.length > 0) {
      console.log('\n❌ ERRORS (Top 10):');
      report.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.error} (${error.file})`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log('\n='.repeat(80));
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'file-upload-load-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: tester.config,
      stats: tester.stats,
      report
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    throw error;
  } finally {
    // await tester.cleanup();
  }
}

// Run tests if called directly
if (require.main === module) {
  runFileUploadLoadTests()
    .then((report) => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { FileUploadLoadTester, runFileUploadLoadTests };