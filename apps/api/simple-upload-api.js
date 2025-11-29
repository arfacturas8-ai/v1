const express = require('express');
const multer = require('multer');
const { Client } = require('minio');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://platform.cryb.ai', 'https://api.cryb.ai'],
  credentials: true
}));

app.use(express.json());

// MinIO client
const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'upload-api',
    timestamp: new Date().toISOString(),
    minio: 'connected'
  });
});

// Test MinIO connection
app.get('/api/v1/uploads/test-minio', async (req, res) => {
  try {
    const buckets = await minioClient.listBuckets();
    res.json({
      success: true,
      buckets: buckets.map(b => b.name),
      message: 'MinIO connection successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload endpoint
app.post('/api/v1/uploads/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    const file = req.file;
    const bucket = 'cryb-media';
    const objectName = `${Date.now()}-${file.originalname}`;
    
    console.log(`📁 Uploading file: ${objectName} (${file.size} bytes)`);

    // Ensure bucket exists
    const bucketExists = await minioClient.bucketExists(bucket);
    if (!bucketExists) {
      await minioClient.makeBucket(bucket);
      console.log(`🪣 Created bucket: ${bucket}`);
    }

    // Upload file
    await minioClient.putObject(
      bucket,
      objectName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'X-Amz-Meta-Original-Name': encodeURIComponent(file.originalname),
        'X-Amz-Meta-Upload-Date': new Date().toISOString()
      }
    );

    // Generate download URL
    const downloadUrl = await minioClient.presignedGetObject(bucket, objectName, 24 * 60 * 60); // 24 hours

    console.log(`✅ File uploaded successfully: ${objectName}`);

    res.json({
      success: true,
      data: {
        filename: objectName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        bucket: bucket,
        downloadUrl: downloadUrl,
        cdnUrl: `http://localhost:9000/${bucket}/${objectName}`,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List files endpoint
app.get('/api/v1/uploads', async (req, res) => {
  try {
    const bucket = req.query.bucket || 'cryb-media';
    const limit = parseInt(req.query.limit) || 50;
    
    const files = [];
    const stream = minioClient.listObjects(bucket, '', true);
    
    let count = 0;
    for await (const obj of stream) {
      if (count >= limit) break;
      files.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        etag: obj.etag
      });
      count++;
    }

    res.json({
      success: true,
      data: {
        files,
        bucket,
        count: files.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CDN proxy endpoint
app.get('/cdn/:bucket/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params;
    
    // Get file stream from MinIO
    const dataStream = await minioClient.getObject(bucket, filename);
    
    // Get file info for headers
    const stat = await minioClient.statObject(bucket, filename);
    
    // Set appropriate headers
    res.set({
      'Content-Type': stat.metaData['content-type'] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
      'ETag': stat.etag
    });

    // Stream the file
    dataStream.pipe(res);

  } catch (error) {
    console.error('❌ CDN serve failed:', error);
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Simple Upload API running on http://${HOST}:${PORT}`);
  console.log(`📁 Upload endpoint: http://${HOST}:${PORT}/api/v1/uploads/media`);
  console.log(`🔗 CDN endpoint: http://${HOST}:${PORT}/cdn/:bucket/:filename`);
  console.log(`❤️  Health check: http://${HOST}:${PORT}/health`);
});