#!/usr/bin/env node

const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function createTestUser() {
  try {
    // First register a test user
    const registerResponse = await fetch('http://localhost:3002/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuploaduser',
        email: 'testupload@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      })
    });
    
    if (!registerResponse.ok) {
      // User might already exist, try login
      console.log('User might exist, trying login...');
      const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testupload@example.com',
          password: 'TestPassword123!'
        })
      });
      
      if (!loginResponse.ok) {
        const loginError = await loginResponse.text();
        throw new Error(`Login failed: ${loginError}`);
      }
      
      const loginData = await loginResponse.json();
      return loginData.data.token;
    }
    
    const registerData = await registerResponse.json();
    return registerData.data.token;
    
  } catch (error) {
    console.error('Failed to create/login test user:', error.message);
    throw error;
  }
}

async function testFileUpload() {
  console.log('🔧 Testing file upload endpoints...\n');
  
  try {
    // Get authentication token
    console.log('1. Getting authentication token...');
    const token = await createTestUser();
    console.log('✅ Authentication token obtained');
    
    // Create a test file
    const testFileName = 'test-upload.txt';
    const testContent = 'Hello from CRYB file upload test!';
    fs.writeFileSync(testFileName, testContent);
    console.log('✅ Test file created');
    
    // Test avatar upload
    console.log('\n2. Testing avatar upload...');
    const avatarForm = new FormData();
    avatarForm.append('file', fs.createReadStream(testFileName), {
      filename: 'avatar.txt',
      contentType: 'text/plain'
    });
    
    const avatarResponse = await fetch('http://localhost:3002/api/v1/uploads/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...avatarForm.getHeaders()
      },
      body: avatarForm
    });
    
    const avatarResult = await avatarResponse.text();
    console.log('Avatar upload response status:', avatarResponse.status);
    console.log('Avatar upload response:', avatarResult);
    
    if (avatarResponse.ok) {
      console.log('✅ Avatar upload successful');
    } else {
      console.log('❌ Avatar upload failed');
    }
    
    // Test media upload
    console.log('\n3. Testing media upload...');
    const mediaForm = new FormData();
    mediaForm.append('file', fs.createReadStream(testFileName), {
      filename: 'media.txt',
      contentType: 'text/plain'
    });
    
    const mediaResponse = await fetch('http://localhost:3002/api/v1/uploads/media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...mediaForm.getHeaders()
      },
      body: mediaForm
    });
    
    const mediaResult = await mediaResponse.text();
    console.log('Media upload response status:', mediaResponse.status);
    console.log('Media upload response:', mediaResult);
    
    if (mediaResponse.ok) {
      console.log('✅ Media upload successful');
    } else {
      console.log('❌ Media upload failed');
    }
    
    // Test attachment upload
    console.log('\n4. Testing attachment upload...');
    const attachmentForm = new FormData();
    attachmentForm.append('files', fs.createReadStream(testFileName), {
      filename: 'attachment.txt',
      contentType: 'text/plain'
    });
    
    const attachmentResponse = await fetch('http://localhost:3002/api/v1/uploads/attachment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...attachmentForm.getHeaders()
      },
      body: attachmentForm
    });
    
    const attachmentResult = await attachmentResponse.text();
    console.log('Attachment upload response status:', attachmentResponse.status);
    console.log('Attachment upload response:', attachmentResult);
    
    if (attachmentResponse.ok) {
      console.log('✅ Attachment upload successful');
    } else {
      console.log('❌ Attachment upload failed');
    }
    
    // Test file listing
    console.log('\n5. Testing file listing...');
    const listResponse = await fetch('http://localhost:3002/api/v1/uploads/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const listResult = await listResponse.text();
    console.log('File listing response status:', listResponse.status);
    console.log('File listing response:', listResult);
    
    if (listResponse.ok) {
      console.log('✅ File listing successful');
    } else {
      console.log('❌ File listing failed');
    }
    
    // Cleanup
    fs.unlinkSync(testFileName);
    console.log('\n✅ Test file cleaned up');
    
    console.log('\n🎉 Upload endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Upload endpoint test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testFileUpload().catch(console.error);
