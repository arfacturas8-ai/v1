#!/usr/bin/env node

const { Client } = require('minio');

async function testMinioConnection() {
  console.log('🔧 Testing MinIO connection and bucket setup...\n');
  
  // Create MinIO client with the same config as the app
  const minioClient = new Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin123'
  });

  try {
    // Test basic connectivity
    console.log('1. Testing MinIO connectivity...');
    const buckets = await minioClient.listBuckets();
    console.log('✅ MinIO connection successful!');
    console.log(`   Found ${buckets.length} existing buckets:`, buckets.map(b => b.name));
    
    // Test bucket creation
    console.log('\n2. Testing bucket creation...');
    const requiredBuckets = [
      'cryb-uploads',
      'cryb-avatars', 
      'cryb-attachments',
      'cryb-media',
      'cryb-thumbnails',
      'cryb-temp'
    ];
    
    for (const bucketName of requiredBuckets) {
      try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
          await minioClient.makeBucket(bucketName);
          console.log(`✅ Created bucket: ${bucketName}`);
          
          // Set public policy for avatars and thumbnails
          if (['cryb-avatars', 'cryb-thumbnails'].includes(bucketName)) {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucketName}/*`]
                }
              ]
            };
            
            try {
              await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
              console.log(`   ✅ Set public policy for ${bucketName}`);
            } catch (policyError) {
              console.log(`   ⚠️  Warning: Could not set public policy for ${bucketName}:`, policyError.message);
            }
          }
        } else {
          console.log(`✅ Bucket already exists: ${bucketName}`);
        }
      } catch (bucketError) {
        console.error(`❌ Failed to create bucket ${bucketName}:`, bucketError.message);
      }
    }
    
    // Test file upload
    console.log('\n3. Testing file upload...');
    const testFileName = 'test-upload.txt';
    const testContent = 'Hello from CRYB upload test!';
    const testBucket = 'cryb-uploads';
    
    try {
      await minioClient.putObject(testBucket, testFileName, testContent, testContent.length, {
        'Content-Type': 'text/plain',
        'X-Amz-Meta-Test': 'true'
      });
      console.log(`✅ Test file uploaded successfully: ${testFileName}`);
      
      // Test file retrieval
      const fileStream = await minioClient.getObject(testBucket, testFileName);
      let retrievedContent = '';
      
      fileStream.on('data', (chunk) => {
        retrievedContent += chunk;
      });
      
      await new Promise((resolve, reject) => {
        fileStream.on('end', resolve);
        fileStream.on('error', reject);
      });
      
      if (retrievedContent === testContent) {
        console.log('✅ Test file retrieved successfully');
      } else {
        console.log('❌ Test file content mismatch');
      }
      
      // Cleanup test file
      await minioClient.removeObject(testBucket, testFileName);
      console.log('✅ Test file cleaned up');
      
    } catch (uploadError) {
      console.error('❌ File upload test failed:', uploadError.message);
    }
    
    // Test presigned URL generation
    console.log('\n4. Testing presigned URL generation...');
    try {
      const presignedUrl = await minioClient.presignedPutObject('cryb-uploads', 'presigned-test.txt', 3600);
      console.log('✅ Presigned upload URL generated successfully');
      console.log(`   URL: ${presignedUrl.substring(0, 100)}...`);
    } catch (presignedError) {
      console.error('❌ Presigned URL generation failed:', presignedError.message);
    }
    
    console.log('\n🎉 All MinIO tests completed successfully!');
    
  } catch (error) {
    console.error('❌ MinIO connection failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    });
    process.exit(1);
  }
}

// Run the test
testMinioConnection().catch(console.error);
