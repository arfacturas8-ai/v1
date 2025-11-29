/**
 * CRYB Platform - File Upload Integration Tests
 * 
 * Integration tests for file upload functionality with real API and services
 * Tests the actual upload pipeline from frontend to backend to storage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

describe('File Upload Integration Tests', () => {
  let authToken;
  let testUser;
  let testCommunity;
  
  const API_BASE = 'http://localhost:3002';
  const FIXTURES_DIR = path.join(__dirname, '../fixtures/integration');

  beforeAll(async () => {
    // Create fixtures directory
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }

    // Create test files
    await createTestFiles();
    
    // Register and authenticate test user
    authToken = await authenticateTestUser();
    
    // Create test community
    testCommunity = await createTestCommunity();
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  describe('Avatar Upload Integration', () => {
    test('should upload and process avatar image', async () => {
      const avatarPath = path.join(FIXTURES_DIR, 'avatar-test.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(avatarPath);
      const file = new File([fileBuffer], 'avatar-test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.data.file).toBeDefined();
      expect(data.data.url).toBeDefined();

      // Verify the uploaded image is accessible
      const imageResponse = await fetch(data.data.url);
      expect(imageResponse.ok).toBeTruthy();
      expect(imageResponse.headers.get('content-type')).toMatch(/^image\//);
    });

    test('should enforce avatar size limits', async () => {
      const largePath = path.join(FIXTURES_DIR, 'large-avatar.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(largePath);
      const file = new File([fileBuffer], 'large-avatar.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBeFalsy();
      expect(data.error).toMatch(/size|limit/i);
    });
  });

  describe('Post Media Upload Integration', () => {
    test('should upload multiple media files for post', async () => {
      const files = [
        { path: path.join(FIXTURES_DIR, 'post-image.jpg'), type: 'image/jpeg' },
        { path: path.join(FIXTURES_DIR, 'post-video.mp4'), type: 'video/mp4' }
      ];

      const formData = new FormData();
      
      files.forEach((fileInfo, index) => {
        const fileBuffer = fs.readFileSync(fileInfo.path);
        const file = new File([fileBuffer], path.basename(fileInfo.path), { type: fileInfo.type });
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.data.files).toHaveLength(2);

      // Verify each uploaded file
      for (const file of data.data.files) {
        const fileResponse = await fetch(file.url);
        expect(fileResponse.ok).toBeTruthy();
      }
    });

    test('should process and resize large images', async () => {
      const largePath = path.join(FIXTURES_DIR, 'large-image.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(largePath);
      const file = new File([fileBuffer], 'large-image.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      
      // The processed file should be smaller than the original
      const processedResponse = await fetch(data.data.url);
      const processedBuffer = await processedResponse.arrayBuffer();
      
      expect(processedBuffer.byteLength).toBeLessThan(fileBuffer.length);
    });
  });

  describe('Chat Media Upload Integration', () => {
    test('should upload chat attachments', async () => {
      const attachmentPath = path.join(FIXTURES_DIR, 'chat-attachment.pdf');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(attachmentPath);
      const file = new File([fileBuffer], 'document.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.data.file).toBeDefined();
    });

    test('should handle audio file uploads', async () => {
      const audioPath = path.join(FIXTURES_DIR, 'audio-message.mp3');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(audioPath);
      const file = new File([fileBuffer], 'audio.mp3', { type: 'audio/mpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBeTruthy();
    });
  });

  describe('MinIO Integration Tests', () => {
    test('should store files in correct buckets', async () => {
      // Test avatar storage
      const avatarPath = path.join(FIXTURES_DIR, 'avatar-test.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(avatarPath);
      const file = new File([fileBuffer], 'avatar.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      await fetch(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      // Verify files are in the avatars bucket
      const statsResponse = await fetch(`${API_BASE}/uploads/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(statsResponse.ok).toBeTruthy();
      const stats = await statsResponse.json();
      expect(stats.data.avatars).toBeDefined();
      expect(stats.data.avatars.fileCount).toBeGreaterThan(0);
    });

    test('should handle file download URLs', async () => {
      // Upload a file first
      const testPath = path.join(FIXTURES_DIR, 'download-test.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(testPath);
      const file = new File([fileBuffer], 'download-test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.data.file.id;

      // Get download URL
      const downloadResponse = await fetch(`${API_BASE}/uploads/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(downloadResponse.ok).toBeTruthy();
      const downloadData = await downloadResponse.json();
      expect(downloadData.data.downloadUrl).toBeDefined();

      // Verify download URL works
      const fileResponse = await fetch(downloadData.data.downloadUrl);
      expect(fileResponse.ok).toBeTruthy();
    });
  });

  describe('Error Handling Integration', () => {
    test('should reject unauthorized uploads', async () => {
      const testPath = path.join(FIXTURES_DIR, 'test-image.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(testPath);
      const file = new File([fileBuffer], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        // No authorization header
        body: formData
      });

      expect(response.status).toBe(401);
    });

    test('should reject invalid file types', async () => {
      const execPath = path.join(FIXTURES_DIR, 'malicious.exe');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(execPath);
      const file = new File([fileBuffer], 'malicious.exe', { type: 'application/x-msdownload' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/not allowed|invalid/i);
    });

    test('should handle corrupted file uploads', async () => {
      const corruptPath = path.join(FIXTURES_DIR, 'corrupt-image.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(corruptPath);
      const file = new File([fileBuffer], 'corrupt.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      // Should either process successfully or reject gracefully
      expect([200, 400, 422]).toContain(response.status);
    });
  });

  describe('Performance Integration', () => {
    test('should handle concurrent uploads', async () => {
      const uploadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const testPath = path.join(FIXTURES_DIR, 'concurrent-test.jpg');
        const formData = new FormData();
        
        const fileBuffer = fs.readFileSync(testPath);
        const file = new File([fileBuffer], `concurrent-${i}.jpg`, { type: 'image/jpeg' });
        formData.append('file', file);

        const promise = fetch(`${API_BASE}/uploads/media`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });
        
        uploadPromises.push(promise);
      }

      const responses = await Promise.allSettled(uploadPromises);
      const successfulUploads = responses.filter(r => 
        r.status === 'fulfilled' && r.value.ok
      ).length;

      expect(successfulUploads).toBeGreaterThanOrEqual(3); // At least 60% success rate
    });

    test('should complete uploads within reasonable time', async () => {
      const testPath = path.join(FIXTURES_DIR, 'performance-test.jpg');
      const formData = new FormData();
      
      const fileBuffer = fs.readFileSync(testPath);
      const file = new File([fileBuffer], 'perf-test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/uploads/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      const endTime = Date.now();
      const uploadTime = endTime - startTime;

      expect(response.ok).toBeTruthy();
      expect(uploadTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  // Helper functions
  async function createTestFiles() {
    console.log('Creating test files...');

    // Create various test images
    const testImages = [
      { name: 'avatar-test.jpg', width: 200, height: 200 },
      { name: 'large-avatar.jpg', width: 2000, height: 2000 },
      { name: 'post-image.jpg', width: 800, height: 600 },
      { name: 'large-image.jpg', width: 4000, height: 3000 },
      { name: 'download-test.jpg', width: 400, height: 300 },
      { name: 'test-image.jpg', width: 300, height: 300 },
      { name: 'concurrent-test.jpg', width: 500, height: 400 },
      { name: 'performance-test.jpg', width: 600, height: 500 }
    ];

    for (const img of testImages) {
      const filePath = path.join(FIXTURES_DIR, img.name);
      await createJPEGFile(filePath, img.width, img.height);
    }

    // Create test video (minimal MP4)
    const videoPath = path.join(FIXTURES_DIR, 'post-video.mp4');
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
      0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
    ]);
    fs.writeFileSync(videoPath, mp4Header);

    // Create test audio (minimal MP3)
    const audioPath = path.join(FIXTURES_DIR, 'audio-message.mp3');
    const mp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    fs.writeFileSync(audioPath, mp3Header);

    // Create test PDF
    const pdfPath = path.join(FIXTURES_DIR, 'chat-attachment.pdf');
    const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
301
%%EOF`;
    fs.writeFileSync(pdfPath, pdfContent);

    // Create malicious executable for error testing
    const exePath = path.join(FIXTURES_DIR, 'malicious.exe');
    fs.writeFileSync(exePath, 'MZ\x90\x00\x03\x00\x00\x00');

    // Create corrupt image
    const corruptPath = path.join(FIXTURES_DIR, 'corrupt-image.jpg');
    fs.writeFileSync(corruptPath, Buffer.from('invalid jpeg data'));

    console.log('Test files created');
  }

  async function createJPEGFile(filePath, width, height) {
    // Create a simple JPEG file with basic header
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
      0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00
    ]);
    
    // Generate appropriate amount of data based on dimensions
    const dataSize = Math.max(1024, Math.floor(width * height / 10));
    const imageData = crypto.randomBytes(dataSize);
    
    const jpegFooter = Buffer.from([0xFF, 0xD9]);
    
    const fullImage = Buffer.concat([jpegHeader, imageData, jpegFooter]);
    fs.writeFileSync(filePath, fullImage);
  }

  async function authenticateTestUser() {
    console.log('Authenticating test user...');

    const userEmail = 'integration-test@example.com';
    const userPassword = 'IntegrationTest123!';

    try {
      // Try to login first
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        testUser = loginData.data.user;
        return loginData.data.token;
      }

      // Register new user
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          username: 'integrationtest',
          password: userPassword,
          firstName: 'Integration',
          lastName: 'Test'
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register test user');
      }

      // Login after registration
      const retryLoginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: userPassword
        })
      });

      const loginData = await retryLoginResponse.json();
      testUser = loginData.data.user;
      return loginData.data.token;

    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async function createTestCommunity() {
    console.log('Creating test community...');

    const response = await fetch(`${API_BASE}/communities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Integration Test Community',
        description: 'Community for integration testing',
        type: 'public'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.community;
    } else {
      console.warn('Failed to create test community, using mock data');
      return { id: 'test-community-id' };
    }
  }
});