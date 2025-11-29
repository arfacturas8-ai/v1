import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app';
import { testData } from '../helpers/test-data';
import path from 'path';
import fs from 'fs';
import { createReadStream } from 'fs';

describe('File Upload Operations', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();

    // Create authenticated user for tests
    const userData = testData.validUser();
    const response = await request(app.server)
      .post('/api/auth/register')
      .send(userData);
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Image Upload', () => {
    it('should upload valid image file', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      // Create a test image file if it doesn't exist
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('filename');
      expect(response.body.type).toBe('image');
      expect(response.body.uploadedBy).toBe(userId);
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('mimeType');
    });

    it('should reject non-image files for image upload', async () => {
      const testTextPath = path.join(__dirname, '../fixtures/test-file.txt');
      
      // Create a test text file
      if (!fs.existsSync(testTextPath)) {
        fs.writeFileSync(testTextPath, 'This is a text file');
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testTextPath)
        .expect(400);

      expect(response.body.error).toContain('invalid file type');
    });

    it('should reject oversized images', async () => {
      const largePath = path.join(__dirname, '../fixtures/large-image.jpg');
      
      // Create a large file (simulate 10MB+)
      if (!fs.existsSync(largePath)) {
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0); // 11MB
        fs.writeFileSync(largePath, largeBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largePath)
        .expect(413);

      expect(response.body.error).toContain('file too large');
    });

    it('should generate multiple image sizes (thumbnails)', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('variants');
      expect(response.body.variants).toHaveProperty('thumbnail');
      expect(response.body.variants).toHaveProperty('medium');
      expect(response.body.variants).toHaveProperty('large');
      
      // Each variant should have its own URL
      expect(response.body.variants.thumbnail).toHaveProperty('url');
      expect(response.body.variants.medium).toHaveProperty('url');
      expect(response.body.variants.large).toHaveProperty('url');
    });

    it('should scan images for malicious content', async () => {
      const maliciousImagePath = path.join(__dirname, '../fixtures/malicious-image.jpg');
      
      // Create a file that simulates malicious content
      if (!fs.existsSync(maliciousImagePath)) {
        const maliciousBuffer = Buffer.from('<?php echo "malicious code"; ?>', 'utf8');
        fs.writeFileSync(maliciousImagePath, maliciousBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', maliciousImagePath)
        .expect(400);

      expect(response.body.error).toContain('security scan failed');
    });

    it('should add watermark to uploaded images', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .field('addWatermark', 'true')
        .attach('image', testImagePath)
        .expect(201);

      expect(response.body.watermarked).toBe(true);
      expect(response.body.originalUrl).toBeDefined();
      expect(response.body.watermarkedUrl).toBeDefined();
    });
  });

  describe('Video Upload', () => {
    it('should upload valid video file', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
      
      if (!fs.existsSync(testVideoPath)) {
        const testVideoBuffer = Buffer.from('fake-video-data', 'utf8');
        fs.writeFileSync(testVideoPath, testVideoBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', testVideoPath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body.type).toBe('video');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('resolution');
    });

    it('should transcode video to multiple formats', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
      
      if (!fs.existsSync(testVideoPath)) {
        const testVideoBuffer = Buffer.from('fake-video-data', 'utf8');
        fs.writeFileSync(testVideoPath, testVideoBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', testVideoPath)
        .expect(201);

      expect(response.body).toHaveProperty('transcoding');
      expect(response.body.transcoding.status).toBe('queued');
      expect(response.body.transcoding).toHaveProperty('jobId');

      // Check transcoding status
      const statusResponse = await request(app.server)
        .get(`/api/uploads/transcode-status/${response.body.transcoding.jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('progress');
    });

    it('should generate video thumbnail', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
      
      if (!fs.existsSync(testVideoPath)) {
        const testVideoBuffer = Buffer.from('fake-video-data', 'utf8');
        fs.writeFileSync(testVideoPath, testVideoBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', testVideoPath)
        .expect(201);

      expect(response.body).toHaveProperty('thumbnail');
      expect(response.body.thumbnail).toHaveProperty('url');
      expect(response.body.thumbnail.type).toBe('image');
    });

    it('should reject video files exceeding duration limit', async () => {
      const longVideoPath = path.join(__dirname, '../fixtures/long-video.mp4');
      
      if (!fs.existsSync(longVideoPath)) {
        const longVideoBuffer = Buffer.from('fake-long-video-data', 'utf8');
        fs.writeFileSync(longVideoPath, longVideoBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .field('duration', '3601') // Over 1 hour limit
        .attach('video', longVideoPath)
        .expect(400);

      expect(response.body.error).toContain('video too long');
    });
  });

  describe('Document Upload', () => {
    it('should upload valid document file', async () => {
      const testDocPath = path.join(__dirname, '../fixtures/test-document.pdf');
      
      if (!fs.existsSync(testDocPath)) {
        const testDocBuffer = Buffer.from('fake-pdf-data', 'utf8');
        fs.writeFileSync(testDocPath, testDocBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/document')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('document', testDocPath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body.type).toBe('document');
      expect(response.body.mimeType).toBe('application/pdf');
    });

    it('should scan documents for malware', async () => {
      const suspiciousDocPath = path.join(__dirname, '../fixtures/suspicious-document.pdf');
      
      if (!fs.existsSync(suspiciousDocPath)) {
        // Simulate suspicious content
        const suspiciousBuffer = Buffer.from('suspicious-pattern-detected', 'utf8');
        fs.writeFileSync(suspiciousDocPath, suspiciousBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/document')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('document', suspiciousDocPath)
        .expect(400);

      expect(response.body.error).toContain('security scan failed');
    });

    it('should extract text content from documents', async () => {
      const testDocPath = path.join(__dirname, '../fixtures/text-document.pdf');
      
      if (!fs.existsSync(testDocPath)) {
        const testDocBuffer = Buffer.from('extractable text content', 'utf8');
        fs.writeFileSync(testDocPath, testDocBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/document')
        .set('Authorization', `Bearer ${authToken}`)
        .field('extractText', 'true')
        .attach('document', testDocPath)
        .expect(201);

      expect(response.body).toHaveProperty('textContent');
      expect(response.body.textExtraction.status).toBe('completed');
    });
  });

  describe('Audio Upload', () => {
    it('should upload valid audio file', async () => {
      const testAudioPath = path.join(__dirname, '../fixtures/test-audio.mp3');
      
      if (!fs.existsSync(testAudioPath)) {
        const testAudioBuffer = Buffer.from('fake-audio-data', 'utf8');
        fs.writeFileSync(testAudioPath, testAudioBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/audio')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audio', testAudioPath)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body.type).toBe('audio');
      expect(response.body).toHaveProperty('duration');
      expect(response.body).toHaveProperty('bitrate');
    });

    it('should transcode audio to different formats', async () => {
      const testAudioPath = path.join(__dirname, '../fixtures/test-audio.wav');
      
      if (!fs.existsSync(testAudioPath)) {
        const testAudioBuffer = Buffer.from('fake-wav-data', 'utf8');
        fs.writeFileSync(testAudioPath, testAudioBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/audio')
        .set('Authorization', `Bearer ${authToken}`)
        .field('transcode', 'true')
        .attach('audio', testAudioPath)
        .expect(201);

      expect(response.body).toHaveProperty('variants');
      expect(response.body.variants).toHaveProperty('mp3');
      expect(response.body.variants).toHaveProperty('ogg');
      expect(response.body.variants).toHaveProperty('webm');
    });

    it('should generate audio waveform', async () => {
      const testAudioPath = path.join(__dirname, '../fixtures/test-audio.mp3');
      
      if (!fs.existsSync(testAudioPath)) {
        const testAudioBuffer = Buffer.from('fake-audio-data', 'utf8');
        fs.writeFileSync(testAudioPath, testAudioBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/audio')
        .set('Authorization', `Bearer ${authToken}`)
        .field('generateWaveform', 'true')
        .attach('audio', testAudioPath)
        .expect(201);

      expect(response.body).toHaveProperty('waveform');
      expect(response.body.waveform).toHaveProperty('url');
      expect(response.body.waveform).toHaveProperty('data');
    });
  });

  describe('File Management', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath);

      uploadedFileId = response.body.id;
    });

    it('should get file metadata', async () => {
      const response = await request(app.server)
        .get(`/api/uploads/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(uploadedFileId);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('mimeType');
      expect(response.body).toHaveProperty('uploadedAt');
    });

    it('should list user uploaded files', async () => {
      // Upload a few more files
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      await Promise.all([
        request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath),
        request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
      ]);

      const response = await request(app.server)
        .get('/api/uploads/my-files')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(response.body.files.length).toBeGreaterThanOrEqual(3);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should delete uploaded file', async () => {
      await request(app.server)
        .delete(`/api/uploads/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify file is deleted
      await request(app.server)
        .get(`/api/uploads/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion of files by non-owner', async () => {
      // Create another user
      const otherUserData = testData.validUser('other@example.com');
      const otherUserResponse = await request(app.server)
        .post('/api/auth/register')
        .send(otherUserData);

      const otherToken = otherUserResponse.body.token;

      await request(app.server)
        .delete(`/api/uploads/${uploadedFileId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should update file metadata', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['tag1', 'tag2']
      };

      const response = await request(app.server)
        .put(`/api/uploads/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.tags).toEqual(updateData.tags);
    });
  });

  describe('Security and Validation', () => {
    it('should require authentication for uploads', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      await request(app.server)
        .post('/api/uploads/image')
        .attach('image', testImagePath)
        .expect(401);
    });

    it('should validate file extensions against MIME types', async () => {
      const fakeImagePath = path.join(__dirname, '../fixtures/fake-image.jpg');
      
      // Create a text file with .jpg extension
      if (!fs.existsSync(fakeImagePath)) {
        fs.writeFileSync(fakeImagePath, 'This is actually a text file');
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fakeImagePath)
        .expect(400);

      expect(response.body.error).toContain('file type mismatch');
    });

    it('should sanitize file names', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .field('filename', '../../../malicious-filename.jpg')
        .attach('image', testImagePath)
        .expect(201);

      // Filename should be sanitized
      expect(response.body.filename).not.toContain('../');
      expect(response.body.filename).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('should enforce user upload quotas', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      // Upload files to approach quota limit
      const uploadPromises = Array(10).fill(0).map(() =>
        request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
      );

      await Promise.all(uploadPromises);

      // Next upload should fail due to quota
      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .expect(429);

      expect(response.body.error).toContain('upload quota exceeded');
    });

    it('should rate limit upload requests', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      // Make rapid upload requests
      const uploadPromises = Array(20).fill(0).map(() =>
        request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', testImagePath)
      );

      const responses = await Promise.all(uploadPromises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CDN Integration', () => {
    it('should serve files from CDN', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .expect(201);

      // URL should point to CDN
      expect(response.body.url).toMatch(/^https:\/\/cdn\./);
      expect(response.body).toHaveProperty('cdnInfo');
      expect(response.body.cdnInfo).toHaveProperty('distribution');
      expect(response.body.cdnInfo).toHaveProperty('cacheKey');
    });

    it('should invalidate CDN cache when file is deleted', async () => {
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      if (!fs.existsSync(testImagePath)) {
        const testImageBuffer = Buffer.from('fake-image-data', 'utf8');
        fs.writeFileSync(testImagePath, testImageBuffer);
      }

      const uploadResponse = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath);

      const fileId = uploadResponse.body.id;

      const deleteResponse = await request(app.server)
        .delete(`/api/uploads/${fileId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // CDN invalidation should be triggered
      expect(deleteResponse.headers['x-cdn-invalidation']).toBeDefined();
    });
  });
});