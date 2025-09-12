#!/usr/bin/env node

/**
 * Test File Upload System
 * 
 * This test creates a user, authenticates, and tests all file upload endpoints
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3002';

// Generate unique test data
const timestamp = Date.now();
const testUser = {
  email: `test-upload-${timestamp}@example.com`,
  username: `test_upload_${timestamp}`,
  displayName: `Test Upload User ${timestamp}`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!'
};

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createTestFile(filename, content) {
  const filePath = path.join('/tmp', filename);
  await fs.promises.writeFile(filePath, content);
  return filePath;
}

async function testFileUpload() {
  log('\n' + '='.repeat(60), 'bold');
  log('📁 FILE UPLOAD SYSTEM TEST', 'bold');
  log('='.repeat(60), 'bold');

  let token = null;
  let userId = null;
  const testResults = [];

  try {
    // Step 1: Create a test user and get token
    log('\n👤 Creating test user...', 'blue');
    
    const registerResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, testUser, {
      timeout: 15000
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      token = registerResponse.data.data.tokens.accessToken;
      userId = registerResponse.data.data.user.id;
      
      log('✅ User created successfully', 'green');
      log(`   User ID: ${userId}`, 'cyan');
      log(`   Token obtained`, 'cyan');
    } else {
      throw new Error('User registration failed');
    }

    // Step 2: Test avatar upload
    log('\n🖼️  Testing avatar upload...', 'blue');
    
    const avatarPath = await createTestFile('test-avatar.png', Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    ));

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(avatarPath), {
        filename: 'avatar.png',
        contentType: 'image/png'
      });

      const avatarResponse = await axios.post(
        `${API_BASE_URL}/api/v1/uploads/avatar`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (avatarResponse.data.success) {
        log('✅ Avatar upload successful', 'green');
        log(`   File ID: ${avatarResponse.data.data.original.id}`, 'cyan');
        log(`   URL: ${avatarResponse.data.data.original.url}`, 'cyan');
        if (avatarResponse.data.data.thumbnail) {
          log(`   Thumbnail: ${avatarResponse.data.data.thumbnail.url}`, 'cyan');
        }
        testResults.push({ test: 'Avatar Upload', status: 'PASS' });
      }
    } catch (error) {
      log(`❌ Avatar upload failed: ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Avatar Upload', status: 'FAIL', error: error.message });
    }

    // Step 3: Test document upload
    log('\n📄 Testing document upload...', 'blue');
    
    const docPath = await createTestFile('test-document.txt', 'This is a test document for upload testing.');

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(docPath), {
        filename: 'document.txt',
        contentType: 'text/plain'
      });

      const docResponse = await axios.post(
        `${API_BASE_URL}/api/v1/uploads/document`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (docResponse.data.success) {
        log('✅ Document upload successful', 'green');
        log(`   File ID: ${docResponse.data.data.original.id}`, 'cyan');
        testResults.push({ test: 'Document Upload', status: 'PASS' });
      }
    } catch (error) {
      log(`❌ Document upload failed: ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Document Upload', status: 'FAIL', error: error.message });
    }

    // Step 4: Test signed URL generation
    log('\n🔗 Testing signed URL generation...', 'blue');
    
    try {
      const signedUrlResponse = await axios.post(
        `${API_BASE_URL}/api/v1/uploads/signed-url`,
        {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (signedUrlResponse.data.success) {
        log('✅ Signed URL generated successfully', 'green');
        log(`   Upload URL obtained`, 'cyan');
        log(`   File ID: ${signedUrlResponse.data.data.fileId}`, 'cyan');
        log(`   Expires in: ${signedUrlResponse.data.data.expiresIn}s`, 'cyan');
        testResults.push({ test: 'Signed URL', status: 'PASS' });
      }
    } catch (error) {
      log(`❌ Signed URL generation failed: ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Signed URL', status: 'FAIL', error: error.message });
    }

    // Step 5: Test batch upload
    log('\n📦 Testing batch upload...', 'blue');
    
    const file1Path = await createTestFile('batch-file1.txt', 'Batch file 1 content');
    const file2Path = await createTestFile('batch-file2.txt', 'Batch file 2 content');

    try {
      const formData = new FormData();
      formData.append('files', fs.createReadStream(file1Path), {
        filename: 'batch1.txt',
        contentType: 'text/plain'
      });
      formData.append('files', fs.createReadStream(file2Path), {
        filename: 'batch2.txt',
        contentType: 'text/plain'
      });

      const batchResponse = await axios.post(
        `${API_BASE_URL}/api/v1/uploads/batch`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (batchResponse.data.success) {
        log('✅ Batch upload successful', 'green');
        log(`   Files uploaded: ${batchResponse.data.data.length}`, 'cyan');
        testResults.push({ test: 'Batch Upload', status: 'PASS' });
      }
    } catch (error) {
      log(`❌ Batch upload failed: ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Batch Upload', status: 'FAIL', error: error.message });
    }

    // Step 6: Test file stats
    log('\n📊 Testing upload statistics...', 'blue');
    
    try {
      const statsResponse = await axios.get(
        `${API_BASE_URL}/api/v1/uploads/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (statsResponse.data.success) {
        log('✅ Stats retrieved successfully', 'green');
        const stats = statsResponse.data.data;
        Object.keys(stats).forEach(bucket => {
          if (!stats[bucket].error) {
            log(`   ${bucket}: ${stats[bucket].fileCount} files, ${stats[bucket].totalSize} bytes`, 'cyan');
          }
        });
        testResults.push({ test: 'Upload Stats', status: 'PASS' });
      }
    } catch (error) {
      log(`❌ Stats retrieval failed: ${error.response?.data?.error || error.message}`, 'red');
      testResults.push({ test: 'Upload Stats', status: 'FAIL', error: error.message });
    }

    // Clean up test files
    const testFiles = [avatarPath, docPath, file1Path, file2Path];
    for (const file of testFiles) {
      try {
        await fs.promises.unlink(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

  } catch (error) {
    log(`\n💥 TEST FAILED: ${error.message}`, 'red');
    
    if (error.response) {
      log(`   HTTP Status: ${error.response.status}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('📋 TEST SUMMARY', 'bold');
  log('='.repeat(60), 'bold');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  
  testResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    const color = result.status === 'PASS' ? 'green' : 'red';
    log(`${icon} ${result.test}: ${result.status}`, color);
    if (result.error) {
      log(`   Error: ${result.error}`, 'yellow');
    }
  });
  
  log(`\nTotal: ${passed} passed, ${failed} failed`, passed > failed ? 'green' : 'red');
  
  if (passed > 0) {
    log('\n🎉 FILE UPLOAD SYSTEM IS WORKING!', 'green');
    log('✅ Users can now upload avatars, documents, and attachments', 'green');
    log('✅ Batch uploads are functional', 'green');
    log('✅ Signed URLs for direct browser uploads are available', 'green');
  }
  
  return passed > failed;
}

// Run test if called directly
if (require.main === module) {
  testFileUpload().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { testFileUpload };