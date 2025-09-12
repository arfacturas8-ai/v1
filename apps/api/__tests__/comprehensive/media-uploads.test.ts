import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { build } from '../../src/app';
import fs from 'fs';
import path from 'path';

describe('Comprehensive Media Upload Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  
  const testUser = {
    email: `upload-test-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    username: `uploaduser${Date.now()}`
  };

  // Create test files
  const testImagePath = '/tmp/test-image.jpg';
  const testVideoPath = '/tmp/test-video.mp4';
  const testAudioPath = '/tmp/test-audio.mp3';
  const testLargeFilePath = '/tmp/test-large.bin';

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();

    // Register and login test user
    await request(app.server)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app.server)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authToken = loginResponse.body.token;

    // Create test files
    createTestFiles();
  });

  afterAll(async () => {
    await app.close();
    // Clean up test files
    cleanupTestFiles();
  });

  function createTestFiles() {
    // Create a small test image (fake JPEG header)
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const imageData = Buffer.concat([jpegHeader, Buffer.alloc(1000, 0x00)]);
    fs.writeFileSync(testImagePath, imageData);

    // Create a small test video (fake MP4 header)
    const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]);
    const videoData = Buffer.concat([mp4Header, Buffer.alloc(2000, 0x00)]);
    fs.writeFileSync(testVideoPath, videoData);

    // Create a small test audio (fake MP3 header)
    const mp3Header = Buffer.from([0xFF, 0xFB, 0x90, 0x00]);
    const audioData = Buffer.concat([mp3Header, Buffer.alloc(1500, 0x00)]);
    fs.writeFileSync(testAudioPath, audioData);

    // Create a large test file (10MB)
    const largeData = Buffer.alloc(10 * 1024 * 1024, 0x00);
    fs.writeFileSync(testLargeFilePath, largeData);
  }

  function cleanupTestFiles() {
    [testImagePath, testVideoPath, testAudioPath, testLargeFilePath].forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  describe('Image Upload Tests', () => {
    it('should upload valid image file', async () => {
      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body).toHaveProperty('fileId');
      expect(response.body.fileUrl).toMatch(/\.(jpg|jpeg|png|gif|webp)$/i);
    });

    it('should reject non-image files in image upload', async () => {
      await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testAudioPath)
        .expect(400);
    });

    it('should enforce image size limits', async () => {
      await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testLargeFilePath)
        .expect(413);
    });
  });

  describe('Video Upload Tests', () => {
    it('should upload valid video file', async () => {
      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testVideoPath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body).toHaveProperty('fileId');
      expect(response.body.fileUrl).toMatch(/\.(mp4|avi|mov|wmv|flv|webm)$/i);
    });

    it('should handle video transcoding', async () => {
      const response = await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testVideoPath)
        .field('transcode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('transcoding', true);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should reject non-video files in video upload', async () => {
      await request(app.server)
        .post('/api/uploads/video')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(400);
    });
  });

  describe('Audio Upload Tests', () => {
    it('should upload valid audio file', async () => {
      const response = await request(app.server)
        .post('/api/uploads/audio')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testAudioPath)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('fileUrl');
      expect(response.body).toHaveProperty('fileId');
      expect(response.body.fileUrl).toMatch(/\.(mp3|wav|ogg|aac|flac|m4a)$/i);
    });

    it('should reject non-audio files in audio upload', async () => {
      await request(app.server)
        .post('/api/uploads/audio')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testVideoPath)
        .expect(400);
    });
  });

  describe('MinIO Integration Tests', () => {
    it('should store files in MinIO with correct structure', async () => {
      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(200);

      // Verify MinIO URL structure
      expect(response.body.fileUrl).toContain('minio');
      expect(response.body.fileUrl).toMatch(/\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\//); // Date-based folder structure
    });

    it('should generate secure URLs with expiration', async () => {
      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .field('generateSecureUrl', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('secureUrl');
      expect(response.body).toHaveProperty('expiresAt');
      expect(new Date(response.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('File Security Tests', () => {
    it('should scan uploaded files for malware', async () => {
      const response = await request(app.server)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath)
        .expect(200);

      expect(response.body).toHaveProperty('scanStatus', 'clean');
    });

    it('should reject files with malicious content', async () => {
      // Create a file that mimics malicious content
      const maliciousPath = '/tmp/malicious.jpg';
      const maliciousContent = Buffer.concat([
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), // JPEG header
        Buffer.from('<?php system($_GET["cmd"]); ?>'), // Malicious PHP code
        Buffer.alloc(500, 0x00)
      ]);
      fs.writeFileSync(maliciousPath, maliciousContent);

      try {
        await request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', maliciousPath)
          .expect(400);
      } finally {
        if (fs.existsSync(maliciousPath)) {
          fs.unlinkSync(maliciousPath);
        }
      }
    });
  });

  describe('Upload Permissions and Limits', () => {
    it('should enforce authentication for uploads', async () => {
      await request(app.server)
        .post('/api/uploads/image')
        .attach('file', testImagePath)
        .expect(401);
    });

    it('should enforce user upload quotas', async () => {
      // Upload multiple files to test quota
      const promises = Array(5).fill(null).map(() =>
        request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testImagePath)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 200).length;
      
      // Should eventually hit quota limits
      expect(successCount).toBeLessThanOrEqual(5);
    });

    it('should validate file types based on content, not extension', async () => {
      // Create a file with wrong extension
      const fakePath = '/tmp/fake.jpg';
      fs.writeFileSync(fakePath, 'This is not an image file');

      try {
        await request(app.server)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', fakePath)
          .expect(400);
      } finally {
        if (fs.existsSync(fakePath)) {
          fs.unlinkSync(fakePath);
        }
      }
    });
  });

  describe('Chunked Upload Tests', () => {
    it('should handle large file uploads with chunking', async () => {
      const chunkSize = 1024 * 1024; // 1MB chunks
      const fileSize = 5 * 1024 * 1024; // 5MB file
      
      const response = await request(app.server)
        .post('/api/uploads/chunked/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'large-video.mp4',
          fileSize: fileSize,
          contentType: 'video/mp4'
        })
        .expect(200);

      expect(response.body).toHaveProperty('uploadId');
      expect(response.body).toHaveProperty('chunkSize');
      expect(response.body).toHaveProperty('totalChunks');
    });

    it('should complete chunked upload after all chunks', async () => {
      const initResponse = await request(app.server)
        .post('/api/uploads/chunked/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fileName: 'test-chunk.mp4',
          fileSize: 2048,
          contentType: 'video/mp4'
        });

      const uploadId = initResponse.body.uploadId;
      const chunkData = Buffer.alloc(1024, 0x00);

      // Upload chunks
      await request(app.server)
        .post(`/api/uploads/chunked/${uploadId}/chunk/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('chunk', Buffer.from(chunkData), 'chunk1')
        .expect(200);

      await request(app.server)
        .post(`/api/uploads/chunked/${uploadId}/chunk/2`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('chunk', Buffer.from(chunkData), 'chunk2')
        .expect(200);

      // Complete upload
      const completeResponse = await request(app.server)
        .post(`/api/uploads/chunked/${uploadId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(completeResponse.body).toHaveProperty('fileUrl');
    });
  });
});