# Cryb Platform Image Processing Pipeline

## Overview

The Cryb platform now includes a comprehensive image processing pipeline built with:
- **MinIO** for scalable object storage
- **Sharp** for high-performance image processing
- **BullMQ** for queue-based background processing
- **Redis** for caching and queue management
- **CDN** optimization with automatic format conversion

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Upload API     │    │   Queue System  │
│                 │───▶│                  │───▶│                 │
│ • Web/Mobile    │    │ • Validation     │    │ • Background    │
│ • File Upload   │    │ • Processing     │    │   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   MinIO Storage  │    │   Image Worker  │
                       │                  │    │                 │
                       │ • Original       │◀───│ • Sharp         │
                       │ • Processed      │    │ • Multi-format  │
                       │ • Thumbnails     │    │ • Multi-size    │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   CDN Serving    │
                       │                  │
                       │ • Auto-optimize  │
                       │ • Format detect  │
                       │ • Caching        │
                       └──────────────────┘
```

## Features

### 🖼️ Image Processing
- **Multiple Formats**: JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF
- **Smart Resizing**: Configurable sizes per image type (avatar, banner, post)
- **Quality Optimization**: Format-specific quality settings
- **Progressive Enhancement**: Progressive JPEG/PNG support
- **Metadata Removal**: Automatic EXIF data stripping for privacy

###  Storage Management
- **Organized Buckets**: Separate buckets for different image types
- **Version Control**: Original and processed variants stored separately
- **Lifecycle Management**: Automatic cleanup and retention policies
- **Multi-region Support**: Ready for CDN distribution

###  Performance Optimization
- **Background Processing**: Non-blocking image processing with queues
- **Caching Layer**: In-memory and CDN-level caching
- **Batch Processing**: Efficient handling of multiple images
- **Auto Format Detection**: Serve best format based on browser support

### 🎛️ CDN Features
- **On-the-fly Optimization**: Dynamic resizing and format conversion
- **Responsive Images**: Automatic srcset generation
- **Smart Caching**: ETags, conditional requests, immutable assets
- **Compression**: Advanced JPEG/PNG/WebP optimization

## API Endpoints

### Upload Endpoints
```bash
# Avatar Upload (5MB max, square crop)
POST /api/v1/image-uploads/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Banner Upload (10MB max, fit crop)
POST /api/v1/image-uploads/banner
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Post Image Upload (20MB max, various formats)
POST /api/v1/image-uploads/post
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Batch Upload (up to 10 images)
POST /api/v1/image-uploads/batch
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Generate Avatar from Username
POST /api/v1/image-uploads/generate-avatar
Content-Type: application/json
Authorization: Bearer <token>
{
  "username": "JohnDoe",
  "size": 512,
  "colors": {
    "start": "#4e7abf",
    "end": "#8467c5"
  }
}

# Analyze Image Properties
POST /api/v1/image-uploads/analyze
Content-Type: multipart/form-data
Authorization: Bearer <token>

# Check Processing Status
GET /api/v1/image-uploads/status/:jobId
Authorization: Bearer <token>
```

### CDN Endpoints
```bash
# Basic Image Serving
GET /cdn/{bucket}/{path}

# Optimized Image Serving
GET /cdn/{bucket}/{path}?w=300&h=300&quality=85&format=webp

# Responsive Image Data
GET /cdn/responsive/{bucket}/{path}?sizes=320,640,960&format=webp

# Transform Operations
GET /cdn/transform/{bucket}/{path}?operations=resize_300x300,quality_80,format_webp

# Cache Management
GET /cdn/cache/stats
DELETE /cdn/cache/clear
DELETE /cdn/cache/{key}

# Health Check
GET /cdn/health
```

## Query Parameters

### Optimization Parameters
- `w` - Width in pixels
- `h` - Height in pixels
- `quality` - Quality (1-100)
- `format` - Output format (jpeg, png, webp, avif)
- `fit` - Resize strategy (cover, contain, fill, inside, outside, scale-down)
- `progressive` - Enable progressive encoding (true/false)
- `sharpen` - Apply sharpening (true/false)
- `blur` - Blur radius (0.3-1000)
- `auto` - Auto-optimization (compress,format)

### Examples
```bash
# Resize to 300x300 with WebP format
/cdn/cryb-processed/image.jpg?w=300&h=300&format=webp

# High quality AVIF with sharpening
/cdn/cryb-processed/image.jpg?format=avif&quality=90&sharpen=true

# Blurred thumbnail
/cdn/cryb-processed/image.jpg?w=150&h=150&blur=5&quality=70

# Auto-detect best format
/cdn/cryb-processed/image.jpg?w=500&auto=format,compress
```

## Configuration

### Image Type Settings
```typescript
const IMAGE_CONFIGS = {
  avatar: {
    sizes: [32, 64, 128, 256, 512],
    formats: ['webp', 'jpeg'],
    quality: { webp: 85, jpeg: 85 },
    crop: 'square'
  },
  banner: {
    sizes: [400, 800, 1200, 1920],
    formats: ['webp', 'jpeg'],
    quality: { webp: 80, jpeg: 80 },
    crop: 'fit'
  },
  post: {
    sizes: [300, 600, 1200, 1920],
    formats: ['webp', 'jpeg', 'avif'],
    quality: { webp: 85, jpeg: 85, avif: 80 },
    crop: 'fit'
  }
};
```

### MinIO Buckets
- `cryb-original` - Original uploaded images
- `cryb-processed` - Processed image variants
- `cryb-thumbnails` - Thumbnail images
- `cryb-avatars` - User avatars
- `cryb-banners` - Community banners
- `cryb-optimized` - Optimized images

### Environment Variables
```bash
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# CDN Configuration
CDN_BASE_URL=https://api.cryb.ai

# Redis Configuration (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Queue System

### Job Types
1. **process-image** - Process single image with variants
2. **batch-process-images** - Process multiple images
3. **generate-avatar** - Generate avatar from username

### Worker Configuration
```typescript
// Image processing worker with 5 concurrent jobs
const imageWorker = new Worker('image-processing', processingFunction, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 5,
  limiter: { max: 10, duration: 1000 }
});
```

### Job Monitoring
```bash
# Check job status
GET /api/v1/image-uploads/status/{jobId}

# Response
{
  "success": true,
  "data": {
    "jobId": "12345",
    "status": "completed",
    "progress": 100,
    "result": {
      "original": { "url": "...", "size": 1024000 },
      "variants": [...],
      "thumbnail": { "url": "...", "size": 15000 }
    }
  }
}
```

## Testing

### Basic Pipeline Test
```bash
# Run simple connectivity test
node simple-image-test.js

# Run comprehensive test suite
node test-image-pipeline.js
```

### Manual Testing
```bash
# Upload an avatar
curl -X POST http://localhost:3002/api/v1/image-uploads/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-image.jpg"

# Generate an avatar
curl -X POST http://localhost:3002/api/v1/image-uploads/generate-avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"TestUser","size":256}'

# Test CDN optimization
curl -I "http://localhost:3002/cdn/cryb-processed/test.jpg?w=300&format=webp"
```

## Performance Characteristics

### Processing Times (approximate)
- **Small Avatar (200x200)**: 50-100ms
- **Medium Banner (1200x400)**: 100-200ms
- **Large Post Image (1920x1080)**: 200-500ms
- **Batch (5 images)**: 1-3 seconds

### Compression Ratios
- **JPEG → WebP**: 25-35% size reduction
- **PNG → WebP**: 40-60% size reduction
- **Any → AVIF**: 50-70% size reduction (when supported)

### Cache Performance
- **Memory Cache**: <1ms for cached images
- **CDN Cache**: 10-50ms depending on edge location
- **Storage Retrieval**: 50-200ms from MinIO

## Monitoring

### Health Checks
```bash
# CDN Health
GET /cdn/health

# Cache Statistics
GET /cdn/cache/stats

# MinIO Connectivity
GET /cdn/health
```

### Metrics
- Processing queue length
- Cache hit/miss ratios
- Average processing times
- Storage utilization
- Error rates by operation type

## Deployment Considerations

### Production Setup
1. **Load Balancing**: Multiple API instances behind load balancer
2. **Worker Scaling**: Separate worker processes for image processing
3. **Storage Replication**: MinIO cluster with replication
4. **CDN Integration**: CloudFront or similar for global distribution
5. **Monitoring**: Prometheus metrics and alerting

### Security
- **Upload Validation**: File type, size, and content validation
- **Virus Scanning**: Optional integration with ClamAV
- **Rate Limiting**: Upload frequency limits per user
- **Access Control**: Signed URLs for private images

### Backup & Recovery
- **Original Images**: Backed up to separate storage
- **Processed Variants**: Can be regenerated from originals
- **Queue Recovery**: Redis persistence for job recovery

## Troubleshooting

### Common Issues
1. **MinIO Connection**: Check connectivity with `/cdn/health`
2. **Queue Processing**: Monitor Redis and worker logs
3. **Sharp Dependencies**: Ensure native Sharp binaries are installed
4. **Memory Usage**: Monitor worker memory for large images
5. **Storage Space**: Monitor MinIO disk usage

### Debug Commands
```bash
# Check worker status
pm2 status

# View processing logs
pm2 logs api

# Check Redis queue
redis-cli monitor

# Test MinIO connectivity
mc admin info myminio
```

## Future Enhancements

### Planned Features
- **AI-powered cropping**: Smart crop detection
- **Face detection**: Automatic face-centered cropping
- **Watermarking**: Dynamic watermark application
- **Video processing**: Video thumbnail and optimization
- **Progressive web app**: Offline image caching

### Performance Optimizations
- **Edge processing**: Move optimization to CDN edge
- **ML optimization**: Quality settings based on content analysis
- **Predictive caching**: Pre-generate popular sizes
- **WebAssembly**: Client-side basic processing

---

*For technical support or feature requests, please refer to the Cryb platform documentation or contact the development team.*