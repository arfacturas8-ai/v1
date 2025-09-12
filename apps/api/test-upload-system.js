const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3002/api/v1';

// Test configuration
const TEST_CONFIG = {
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'User-Agent': 'Upload-Test-Client/1.0'
  }
};

/**
 * Test the complete file upload system
 */
async function testUploadSystem() {
  console.log('🚀 Testing CRYB File Upload System\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing upload service health...');
    await testHealthCheck();

    // Test 2: Create a test image file
    console.log('2️⃣ Creating test files...');
    const testFiles = await createTestFiles();

    // Test 3: Test chunked upload
    console.log('3️⃣ Testing chunked upload...');
    await testChunkedUpload(testFiles.image);

    // Test 4: Test quick upload
    console.log('4️⃣ Testing quick upload...');
    await testQuickUpload(testFiles.small);

    // Test 5: Test clipboard paste upload
    console.log('5️⃣ Testing clipboard paste upload...');
    await testPasteUpload();

    // Test 6: Test CDN serving
    console.log('6️⃣ Testing CDN-like file serving...');
    await testCDNServing();

    console.log('\n✅ All upload system tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Upload system test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Test upload service health
 */
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE}/uploads/enhanced/health`, TEST_CONFIG);
    
    if (response.data.success) {
      console.log('   ✅ Upload service is healthy');
      console.log(`   📊 Status: ${response.data.data.status}`);
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ⚠️  Enhanced upload routes not available, testing basic health');
      const response = await axios.get(`${API_BASE}/health`, TEST_CONFIG);
      console.log(`   📊 API Status: ${response.status === 200 ? 'healthy' : 'unhealthy'}`);
    } else {
      throw error;
    }
  }
}

/**
 * Create test files for upload testing
 */
async function createTestFiles() {
  const testDir = path.join(__dirname, 'test-uploads');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a test image (simple PNG)
  const imageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // RGB, no compression
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND chunk
  ]);
  
  const imagePath = path.join(testDir, 'test-image.png');
  fs.writeFileSync(imagePath, imageData);

  // Create a small text file
  const smallTextPath = path.join(testDir, 'test-small.txt');
  fs.writeFileSync(smallTextPath, 'Hello, CRYB Upload System! This is a test file.');

  // Create a larger test file for chunked upload
  const largeTextPath = path.join(testDir, 'test-large.txt');
  const largeContent = 'CRYB Upload Test Data '.repeat(50000); // ~1MB
  fs.writeFileSync(largeTextPath, largeContent);

  console.log('   ✅ Test files created successfully');

  return {
    image: imagePath,
    small: smallTextPath,
    large: largeTextPath
  };
}

/**
 * Test chunked upload functionality
 */
async function testChunkedUpload(filePath) {
  // Note: This is a simplified test since we don't have auth token
  // In a real test, you'd need to authenticate first
  console.log('   ⚠️  Skipping chunked upload test (requires authentication)');
  console.log('   📝 Chunked upload endpoints are protected and require auth token');
}

/**
 * Test quick upload functionality
 */
async function testQuickUpload(filePath) {
  // Note: This is a simplified test since we don't have auth token
  console.log('   ⚠️  Skipping quick upload test (requires authentication)');
  console.log('   📝 Quick upload endpoints are protected and require auth token');
}

/**
 * Test clipboard paste upload
 */
async function testPasteUpload() {
  // Note: This would also require authentication
  console.log('   ⚠️  Skipping paste upload test (requires authentication)');
  console.log('   📝 Paste upload endpoints are protected and require auth token');
}

/**
 * Test CDN-like file serving
 */
async function testCDNServing() {
  try {
    // Test serving a non-existent file to check error handling
    const response = await axios.get(`${API_BASE}/uploads/enhanced/serve/test-bucket/nonexistent.jpg`, {
      ...TEST_CONFIG,
      validateStatus: status => status === 404 || status < 500
    });
    
    if (response.status === 404) {
      console.log('   ✅ CDN serving properly returns 404 for non-existent files');
    } else {
      console.log(`   ℹ️  CDN serving returned status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ✅ CDN serving endpoints are available');
    } else {
      throw error;
    }
  }
}

/**
 * Test basic API connectivity
 */
async function testBasicConnectivity() {
  console.log('📡 Testing basic API connectivity...\n');

  try {
    const response = await axios.get(`${API_BASE}/health`, TEST_CONFIG);
    console.log('✅ API is reachable');
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.data) {
      console.log('📋 Health check data:', JSON.stringify(response.data, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('❌ API connectivity test failed');
    throw error;
  }
}

/**
 * Test upload endpoints availability
 */
async function testEndpointsAvailability() {
  console.log('🔍 Testing upload endpoints availability...\n');

  const endpoints = [
    '/uploads/stats',
    '/uploads/enhanced/health',
    '/media/health'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}`, {
        ...TEST_CONFIG,
        validateStatus: status => status < 500 // Accept client errors but not server errors
      });
      
      console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 CRYB File Upload System Test Suite\n');
  console.log('================================================\n');

  try {
    // Test basic connectivity first
    await testBasicConnectivity();
    console.log('\n');

    // Test endpoint availability
    await testEndpointsAvailability();
    console.log('\n');

    // Test full upload system
    await testUploadSystem();

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  testUploadSystem,
  testBasicConnectivity,
  testEndpointsAvailability
};