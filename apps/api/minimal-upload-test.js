// Minimal upload test using existing infrastructure
const http = require('http');
const { Client } = require('minio');

// Test MinIO directly
const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin123'
});

const server = http.createServer(async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'minimal-upload-api',
      timestamp: new Date().toISOString(),
      minio: 'connected'
    }));
    return;
  }

  if (req.url === '/api/v1/uploads/test-minio') {
    try {
      const buckets = await minioClient.listBuckets();
      res.end(JSON.stringify({
        success: true,
        buckets: buckets.map(b => b.name),
        message: 'MinIO connection successful'
      }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }

  if (req.url === '/api/v1/uploads/stats') {
    try {
      const buckets = await minioClient.listBuckets();
      const stats = {};
      
      for (const bucket of buckets.slice(0, 5)) { // Limit to prevent timeout
        try {
          const files = [];
          const stream = minioClient.listObjects(bucket.name, '', true);
          let count = 0;
          for await (const obj of stream) {
            if (count >= 10) break; // Limit files per bucket
            files.push(obj);
            count++;
          }
          stats[bucket.name] = {
            fileCount: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0)
          };
        } catch (err) {
          stats[bucket.name] = { error: err.message };
        }
      }

      res.end(JSON.stringify({
        success: true,
        data: {
          ...stats,
          storageType: 'minio',
          totalBuckets: buckets.length
        }
      }));
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }

  // Default 404
  res.statusCode = 404;
  res.end(JSON.stringify({
    success: false,
    error: 'Route not found'
  }));
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Upload API running on port ${PORT}`);
  console.log(`📁 MinIO test endpoint: http://localhost:${PORT}/api/v1/uploads/test-minio`);
  console.log(`📊 Stats endpoint: http://localhost:${PORT}/api/v1/uploads/stats`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});