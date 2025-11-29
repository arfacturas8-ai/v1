#!/usr/bin/env node

const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'crybe0eef044684b122e',
  secretKey: 'b99c16168f617c3b695a0e92f91d95166f385cbf7124818535729bc55836696b'
});

const buckets = [
  'cryb-uploads',
  'cryb-avatars', 
  'cryb-attachments',
  'cryb-media',
  'cryb-thumbnails',
  'cryb-temp',
  'cryb-banners',
  'cryb-emojis'
];

async function createBuckets() {
  console.log('📦 Creating MinIO buckets...\n');
  
  for (const bucketName of buckets) {
    try {
      // Check if bucket exists
      const exists = await minioClient.bucketExists(bucketName);
      
      if (exists) {
        console.log(`✅ Bucket '${bucketName}' already exists`);
      } else {
        // Create bucket
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ Created bucket: ${bucketName}`);
        
        // Set public read policy for avatars bucket
        if (bucketName === 'cryb-avatars') {
          const policy = {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }]
          };
          
          await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
          console.log(`  📝 Set public read policy for ${bucketName}`);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to create bucket '${bucketName}':`, error.message);
    }
  }
  
  // List all buckets to verify
  console.log('\n📋 All MinIO buckets:');
  try {
    const bucketsList = await minioClient.listBuckets();
    bucketsList.forEach(bucket => {
      console.log(`  - ${bucket.name} (created: ${bucket.creationDate})`);
    });
  } catch (error) {
    console.error('Failed to list buckets:', error.message);
  }
  
  console.log('\n✅ MinIO bucket setup complete!');
}

createBuckets().catch(console.error);