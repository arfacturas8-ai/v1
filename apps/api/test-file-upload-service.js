#!/usr/bin/env node

const { createFileUploadService } = require('./src/services/file-upload');
const fs = require('fs');
const path = require('path');

async function testFileUploadService() {
  console.log('🔧 Testing FileUploadService...\n');
  
  try {
    // Create FileUploadService instance with same config as app
    const fileUploadService = createFileUploadService({
      endpoint: 'localhost',
      port: 9000,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin123',
      useSSL: false,
      bucket: 'cryb-uploads',
      cdnBaseUrl: undefined
    });
    
    console.log('✅ FileUploadService created successfully');
    
    // Test service initialization (wait for buckets to be created)
    console.log('⏳ Waiting for service initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give it time to initialize
    
    // Create a test file
    const testFileName = 'test-image.txt';
    const testContent = 'This is a test file for upload service testing';
    const tempFilePath = path.join(__dirname, testFileName);
    
    fs.writeFileSync(tempFilePath, testContent);
    console.log('✅ Test file created');
    
    // Create a mock MultipartFile object
    const mockFile = {
      filename: testFileName,
      mimetype: 'text/plain',
      file: {
        truncated: false
      },
      toBuffer: async () => Buffer.from(testContent)
    };
    
    // Test upload
    console.log('📤 Testing file upload...');
    try {
      const result = await fileUploadService.uploadFile(mockFile, 'test-user-123', {
        bucket: 'cryb-uploads',
        generateThumbnail: false,
        scanForMalware: false
      });
      
      console.log('✅ File uploaded successfully!');
      console.log('Upload result:', {
        id: result.original.id,
        filename: result.original.filename,
        bucket: result.original.bucket,
        url: result.original.url,
        size: result.original.size
      });
      
      // Test file info retrieval
      console.log('\n📋 Testing file info retrieval...');
      const fileInfo = await fileUploadService.getFileInfo(
        result.original.bucket, 
        result.original.filename
      );
      console.log('✅ File info retrieved:', {
        size: fileInfo.size,
        etag: fileInfo.etag,
        lastModified: fileInfo.lastModified
      });
      
      // Test file download URL
      console.log('\n🔗 Testing download URL generation...');
      const downloadUrl = await fileUploadService.getDownloadUrl(
        result.original.bucket,
        result.original.filename,
        3600
      );
      console.log('✅ Download URL generated:', downloadUrl.substring(0, 100) + '...');
      
      // Test file listing
      console.log('\n📋 Testing file listing...');
      const files = await fileUploadService.listFiles(result.original.bucket, '', 10);
      console.log(`✅ Found ${files.length} files in bucket`);
      
      // Test file deletion
      console.log('\n🗑️ Testing file deletion...');
      await fileUploadService.deleteFile(result.original.bucket, result.original.filename);
      console.log('✅ File deleted successfully');
      
    } catch (uploadError) {
      console.error('❌ File upload failed:', uploadError.message);
      console.error(uploadError.stack);
    }
    
    // Cleanup
    fs.unlinkSync(tempFilePath);
    console.log('✅ Temporary file cleaned up');
    
    console.log('\n🎉 FileUploadService test completed successfully!');
    
  } catch (error) {
    console.error('❌ FileUploadService test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testFileUploadService().catch(console.error);
