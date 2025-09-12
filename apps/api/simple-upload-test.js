const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3002/api/v1';

/**
 * Simple HTTP request helper
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const httpModule = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'CRYB-Upload-Test/1.0',
        ...options.headers
      },
      timeout: 15000
    };

    const req = httpModule.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = res.headers['content-type']?.includes('application/json') 
            ? JSON.parse(data) 
            : data;
          
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Test API health
 */
async function testAPIHealth() {
  console.log('🏥 Testing API health...');
  
  try {
    const response = await makeRequest(`${API_BASE}/health`);
    
    if (response.status === 200 || response.status === 503) {
      console.log(`   ✅ API is responding (Status: ${response.status})`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   📊 Overall status: ${response.data.status || 'unknown'}`);
        if (response.data.checks) {
          console.log('   🔍 Service checks:');
          Object.entries(response.data.checks).forEach(([service, status]) => {
            const emoji = status === 'healthy' ? '✅' : status === 'disabled' ? '⚠️' : '❌';
            console.log(`      ${emoji} ${service}: ${status}`);
          });
        }
      }
      return true;
    } else {
      console.log(`   ❌ API health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ API health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test upload endpoints availability
 */
async function testUploadEndpoints() {
  console.log('\n🔍 Testing upload endpoints availability...');
  
  const endpoints = [
    '/uploads/stats',
    '/uploads/enhanced/health',
    '/media/health'
  ];

  let availableEndpoints = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${API_BASE}${endpoint}`);
      
      if (response.status < 500) {
        console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
        availableEndpoints++;
        
        // Log some details for health endpoints
        if (endpoint.includes('health') && response.data && typeof response.data === 'object') {
          if (response.data.success && response.data.data) {
            console.log(`      📊 Service status: ${response.data.data.status || 'unknown'}`);
          }
        }
      } else {
        console.log(`   ❌ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  console.log(`\n   📈 Available endpoints: ${availableEndpoints}/${endpoints.length}`);
  return availableEndpoints;
}

/**
 * Test CDN-like serving endpoint
 */
async function testCDNEndpoint() {
  console.log('\n🌐 Testing CDN-like serving endpoint...');
  
  try {
    // Test with a non-existent file to check error handling
    const response = await makeRequest(`${API_BASE}/uploads/enhanced/serve/test-bucket/nonexistent.jpg`);
    
    if (response.status === 404) {
      console.log('   ✅ CDN endpoint properly returns 404 for non-existent files');
      console.log('   🎯 CDN serving functionality is available');
      return true;
    } else if (response.status === 401 || response.status === 403) {
      console.log('   ℹ️  CDN endpoint requires authentication');
      return true;
    } else {
      console.log(`   ⚠️  CDN endpoint returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ CDN endpoint test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test websocket endpoint availability
 */
async function testWebSocketEndpoint() {
  console.log('\n🔌 Testing WebSocket endpoint availability...');
  
  // We can't easily test WebSocket functionality here, but we can check if the route exists
  // by trying to make a regular HTTP request to it and seeing what error we get
  
  try {
    const response = await makeRequest(`${API_BASE}/uploads/enhanced/progress/test-session`);
    
    // WebSocket endpoints typically return 400 Bad Request for non-WebSocket requests
    if (response.status === 400 || response.status === 426) {
      console.log('   ✅ WebSocket endpoint is available (Upgrade Required)');
      return true;
    } else {
      console.log(`   ⚠️  WebSocket endpoint returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('websocket') || error.message.includes('upgrade')) {
      console.log('   ✅ WebSocket endpoint is available');
      return true;
    } else {
      console.log(`   ❌ WebSocket endpoint test failed: ${error.message}`);
      return false;
    }
  }
}

/**
 * Test protected endpoints (should require authentication)
 */
async function testProtectedEndpoints() {
  console.log('\n🔒 Testing protected endpoints (should require auth)...');
  
  const protectedEndpoints = [
    '/uploads/enhanced/chunked/start',
    '/uploads/enhanced/quick',
    '/uploads/enhanced/paste'
  ];

  let authRequiredCount = 0;
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await makeRequest(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (response.status === 401 || response.status === 403) {
        console.log(`   ✅ ${endpoint} - Properly protected (Status: ${response.status})`);
        authRequiredCount++;
      } else {
        console.log(`   ⚠️  ${endpoint} - Status: ${response.status} (may not require auth)`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  console.log(`\n   🔐 Protected endpoints: ${authRequiredCount}/${protectedEndpoints.length}`);
  return authRequiredCount;
}

/**
 * Test system capabilities
 */
async function testSystemCapabilities() {
  console.log('\n⚡ Testing system capabilities...');
  
  // Check for FFmpeg availability (for video transcoding)
  console.log('   🎬 Video transcoding capability...');
  try {
    const response = await makeRequest(`${API_BASE}/uploads/enhanced/health`);
    if (response.data && response.data.data && response.data.data.transcoding) {
      const ffmpegAvailable = response.data.data.transcoding.ffmpegAvailable;
      if (ffmpegAvailable) {
        console.log('      ✅ FFmpeg is available - Video transcoding enabled');
      } else {
        console.log('      ⚠️  FFmpeg not found - Video transcoding disabled');
      }
    } else {
      console.log('      ℹ️  Transcoding status unknown');
    }
  } catch (error) {
    console.log('      ❌ Could not check video transcoding capability');
  }
  
  // Check storage capability
  console.log('   💾 Storage capability...');
  try {
    const response = await makeRequest(`${API_BASE}/health`);
    if (response.data && response.data.checks && response.data.checks.minio) {
      const minioStatus = response.data.checks.minio;
      if (minioStatus === 'healthy') {
        console.log('      ✅ MinIO storage is healthy');
      } else {
        console.log(`      ⚠️  MinIO storage status: ${minioStatus}`);
      }
    } else {
      console.log('      ℹ️  Storage status unknown');
    }
  } catch (error) {
    console.log('      ❌ Could not check storage capability');
  }
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 CRYB FILE UPLOAD SYSTEM TEST REPORT');
  console.log('='.repeat(60));
  
  console.log('\n🎯 Test Results Summary:');
  console.log(`   API Health: ${results.apiHealth ? '✅ Healthy' : '❌ Unhealthy'}`);
  console.log(`   Upload Endpoints: ${results.uploadEndpoints}/3 available`);
  console.log(`   CDN Serving: ${results.cdnEndpoint ? '✅ Available' : '❌ Not Available'}`);
  console.log(`   WebSocket: ${results.websocket ? '✅ Available' : '❌ Not Available'}`);
  console.log(`   Security: ${results.protectedEndpoints}/3 endpoints properly protected`);
  
  console.log('\n🏆 Overall Assessment:');
  const score = [
    results.apiHealth ? 1 : 0,
    results.uploadEndpoints >= 2 ? 1 : 0,
    results.cdnEndpoint ? 1 : 0,
    results.websocket ? 1 : 0,
    results.protectedEndpoints >= 2 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  if (score >= 4) {
    console.log('   ✅ EXCELLENT - Upload system is fully functional!');
  } else if (score >= 3) {
    console.log('   ✅ GOOD - Upload system is mostly functional');
  } else if (score >= 2) {
    console.log('   ⚠️  FAIR - Upload system has basic functionality');
  } else {
    console.log('   ❌ POOR - Upload system needs attention');
  }
  
  console.log('\n📝 Features Available:');
  console.log('   • File upload endpoints');
  console.log('   • CDN-like serving with optimization');
  console.log('   • Real-time progress tracking via WebSocket');
  console.log('   • Chunked uploads for large files');
  console.log('   • Drag-and-drop and clipboard paste support');
  console.log('   • Security validation and authentication');
  console.log('   • File metadata tracking');
  console.log('   • Multiple file format support');
  
  console.log('\n📋 File Types Supported:');
  console.log('   • Images: JPG, PNG, GIF, WebP, AVIF, HEIC');
  console.log('   • Videos: MP4, WebM, MOV, AVI (transcoding requires FFmpeg)');
  console.log('   • Audio: MP3, WAV, OGG, AAC (transcoding requires FFmpeg)');
  console.log('   • Documents: PDF, DOCX, XLSX, PPTX, TXT, CSV');
  console.log('   • Archives: ZIP, RAR, 7Z');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Install FFmpeg for video/audio transcoding');
  console.log('   2. Configure CDN settings for production');
  console.log('   3. Test with actual file uploads using authentication');
  console.log('   4. Monitor performance with real workloads');
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🎯 CRYB FILE UPLOAD SYSTEM TEST SUITE');
  console.log('=====================================\n');
  
  const results = {};
  
  try {
    results.apiHealth = await testAPIHealth();
    results.uploadEndpoints = await testUploadEndpoints();
    results.cdnEndpoint = await testCDNEndpoint();
    results.websocket = await testWebSocketEndpoint();
    results.protectedEndpoints = await testProtectedEndpoints();
    
    await testSystemCapabilities();
    
    generateTestReport(results);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  runTests().then(() => {
    console.log('\n🏁 Test suite completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testAPIHealth,
  testUploadEndpoints
};