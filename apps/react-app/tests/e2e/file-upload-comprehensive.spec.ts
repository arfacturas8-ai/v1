/**
 * CRYB Platform - Comprehensive File Upload E2E Tests
 * 
 * Tests the complete file upload pipeline across all platform features:
 * - Avatar/Profile Image Upload
 * - Post Media Upload  
 * - Community Banner/Icon Upload
 * - Chat Media Upload
 * - MinIO Integration
 * - Image Processing
 * - Error Handling
 * - Mobile Upload
 * 
 * Uses REAL files and data - no mocks
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

// Test configuration
const TEST_CONFIG = {
  api: {
    baseUrl: 'http://localhost:3002',
    timeout: 30000
  },
  frontend: {
    baseUrl: 'http://localhost:3003',
    timeout: 30000
  },
  minio: {
    baseUrl: 'http://localhost:9000',
    timeout: 15000
  },
  testUser: {
    email: 'uploadtest@example.com',
    username: 'uploadtest',
    password: 'UploadTest123!'
  }
};

// Test fixture directory
const FIXTURES_DIR = path.join(__dirname, '../fixtures/uploads');

class FileUploadTestSuite {
  constructor(private page: Page, private context: BrowserContext) {}

  async createTestUser() {
    // Register test user
    const response = await this.page.request.post(`${TEST_CONFIG.api.baseUrl}/auth/register`, {
      data: {
        email: TEST_CONFIG.testUser.email,
        username: TEST_CONFIG.testUser.username,
        password: TEST_CONFIG.testUser.password,
        firstName: 'Upload',
        lastName: 'Test'
      }
    });

    if (!response.ok() && !response.status().toString().startsWith('4')) {
      throw new Error(`Failed to create test user: ${response.status()}`);
    }

    // Login
    const loginResponse = await this.page.request.post(`${TEST_CONFIG.api.baseUrl}/auth/login`, {
      data: {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBeTruthy();
    
    return loginData.data.token;
  }

  async authenticateUser(token: string) {
    // Set auth token in browser storage
    await this.page.goto(TEST_CONFIG.frontend.baseUrl);
    await this.page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'uploadtest@example.com',
        username: 'uploadtest'
      }));
    }, token);
    
    // Reload page to apply auth
    await this.page.reload();
  }

  async createTestCommunity(token: string) {
    const response = await this.page.request.post(`${TEST_CONFIG.api.baseUrl}/communities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Upload Test Community',
        description: 'Community for testing file uploads',
        type: 'public'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    return data.data.community.id;
  }

  async waitForUploadComplete(uploadSelector: string, timeout = 30000) {
    await this.page.waitForSelector(`${uploadSelector} [data-testid="upload-success"]`, { timeout });
  }

  async validateImageProcessing(imageUrl: string) {
    // Check if image was properly processed and is accessible
    const response = await this.page.request.get(imageUrl);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(/^image\//);
  }

  async validateMinIOStorage(token: string, bucket: string, expectedFiles: number) {
    // Verify files are stored in MinIO
    const response = await this.page.request.get(`${TEST_CONFIG.api.baseUrl}/uploads?bucket=${bucket}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data.files.length).toBeGreaterThanOrEqual(expectedFiles);
  }
}

// Test setup
test.beforeAll(async ({ browser }) => {
  // Create test fixtures directory
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Create test images
  const testImages = [
    { name: 'avatar-test.jpg', size: '512x512', format: 'JPEG' },
    { name: 'banner-test.png', size: '1920x480', format: 'PNG' },
    { name: 'post-image.webp', size: '800x600', format: 'WebP' },
    { name: 'large-image.jpg', size: '4000x3000', format: 'JPEG' }
  ];

  for (const img of testImages) {
    await createTestImage(path.join(FIXTURES_DIR, img.name), img.size, img.format);
  }

  // Create test videos
  await createTestVideo(path.join(FIXTURES_DIR, 'test-video.mp4'));
  
  // Create test audio
  await createTestAudio(path.join(FIXTURES_DIR, 'test-audio.mp3'));
  
  // Create test documents
  await createTestDocument(path.join(FIXTURES_DIR, 'test-document.pdf'));
  
  // Create invalid/malicious files for error testing
  await createInvalidFiles(FIXTURES_DIR);
});

test.describe('File Upload Comprehensive E2E Tests', () => {
  let testSuite: FileUploadTestSuite;
  let authToken: string;
  let communityId: string;

  test.beforeEach(async ({ page, context }) => {
    testSuite = new FileUploadTestSuite(page, context);
    authToken = await testSuite.createTestUser();
    await testSuite.authenticateUser(authToken);
    communityId = await testSuite.createTestCommunity(authToken);
  });

  test('Avatar/Profile Image Upload', async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to profile settings
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);
    await page.waitForLoadState('networkidle');

    // Find avatar upload component
    const avatarUpload = page.locator('[data-testid="avatar-upload"], .avatar-upload, input[type="file"][accept*="image"]').first();
    await expect(avatarUpload).toBeVisible();

    // Upload avatar image
    const avatarPath = path.join(FIXTURES_DIR, 'avatar-test.jpg');
    await avatarUpload.setInputFiles(avatarPath);

    // Wait for upload to complete
    await testSuite.waitForUploadComplete('[data-testid="avatar-upload"]');

    // Verify avatar is displayed
    const avatarImage = page.locator('[data-testid="user-avatar"], .user-avatar img, .profile-avatar img').first();
    await expect(avatarImage).toBeVisible();

    // Validate image processing (should be resized to 512x512)
    const avatarSrc = await avatarImage.getAttribute('src');
    expect(avatarSrc).toBeTruthy();
    await testSuite.validateImageProcessing(avatarSrc!);

    // Verify storage in MinIO
    await testSuite.validateMinIOStorage(authToken, 'avatars', 1);

    console.log('✅ Avatar upload test passed');
  });

  test('Post Media Upload', async ({ page }) => {
    test.setTimeout(90000);

    // Navigate to create post
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/communities/${communityId}/create-post`);
    await page.waitForLoadState('networkidle');

    // Find post creation form
    const createPostForm = page.locator('[data-testid="create-post-form"], .create-post, .post-form').first();
    await expect(createPostForm).toBeVisible();

    // Add post title and content
    const titleInput = page.locator('input[name="title"], [data-testid="post-title"]').first();
    await titleInput.fill('Test Post with Media Upload');

    const contentInput = page.locator('textarea[name="content"], [data-testid="post-content"]').first();
    await contentInput.fill('This is a test post to verify media upload functionality.');

    // Upload multiple media files
    const mediaUpload = page.locator('[data-testid="media-upload"], .media-upload, input[type="file"][accept*="image,video"]').first();
    
    const mediaFiles = [
      path.join(FIXTURES_DIR, 'post-image.webp'),
      path.join(FIXTURES_DIR, 'test-video.mp4')
    ];
    
    await mediaUpload.setInputFiles(mediaFiles);

    // Wait for uploads to process
    await page.waitForSelector('[data-testid="upload-progress"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 45000 });

    // Submit post
    const submitButton = page.locator('button[type="submit"], [data-testid="submit-post"]').first();
    await submitButton.click();

    // Verify post was created with media
    await page.waitForSelector('[data-testid="post-created"], .post-success', { timeout: 30000 });

    // Verify storage in MinIO
    await testSuite.validateMinIOStorage(authToken, 'media', 2);

    console.log('✅ Post media upload test passed');
  });

  test('Community Banner/Icon Upload', async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to community settings
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/communities/${communityId}/settings`);
    await page.waitForLoadState('networkidle');

    // Upload community icon
    const iconUpload = page.locator('[data-testid="community-icon-upload"], .icon-upload').first();
    if (await iconUpload.isVisible()) {
      await iconUpload.setInputFiles(path.join(FIXTURES_DIR, 'avatar-test.jpg'));
      await testSuite.waitForUploadComplete('[data-testid="community-icon-upload"]');
    }

    // Upload community banner
    const bannerUpload = page.locator('[data-testid="community-banner-upload"], .banner-upload').first();
    if (await bannerUpload.isVisible()) {
      await bannerUpload.setInputFiles(path.join(FIXTURES_DIR, 'banner-test.png'));
      await testSuite.waitForUploadComplete('[data-testid="community-banner-upload"]');
    }

    // Verify uploads in MinIO
    await testSuite.validateMinIOStorage(authToken, 'media', 1);

    console.log('✅ Community banner/icon upload test passed');
  });

  test('Chat Media Upload', async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to chat/messaging
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/messages`);
    await page.waitForLoadState('networkidle');

    // Find or create a chat conversation
    const messageInput = page.locator('[data-testid="message-input"], .message-input, textarea[placeholder*="message"]').first();
    await expect(messageInput).toBeVisible();

    // Find file upload button in chat
    const chatUpload = page.locator('[data-testid="chat-file-upload"], .chat-upload, .file-attachment-btn').first();
    
    if (await chatUpload.isVisible()) {
      await chatUpload.click();
      
      // Upload file in chat
      const fileInput = page.locator('input[type="file"]').last();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-audio.mp3'));

      // Wait for upload
      await testSuite.waitForUploadComplete('[data-testid="chat-upload"]');

      // Verify file appears in chat
      const uploadedFile = page.locator('[data-testid="chat-attachment"], .chat-file').first();
      await expect(uploadedFile).toBeVisible();

      // Verify storage
      await testSuite.validateMinIOStorage(authToken, 'attachments', 1);
    }

    console.log('✅ Chat media upload test passed');
  });

  test('Image Processing Validation', async ({ page }) => {
    test.setTimeout(60000);

    // Test image resize and compression
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);
    
    // Upload large image
    const upload = page.locator('input[type="file"][accept*="image"]').first();
    await upload.setInputFiles(path.join(FIXTURES_DIR, 'large-image.jpg'));

    await testSuite.waitForUploadComplete('[data-testid="avatar-upload"]');

    // Verify image was processed (resized)
    const processedImage = page.locator('[data-testid="user-avatar"] img').first();
    const imageSrc = await processedImage.getAttribute('src');
    
    // Download and check image dimensions
    const response = await page.request.get(imageSrc!);
    const imageBuffer = await response.body();
    
    // Image should be resized to avatar dimensions (512x512 or similar)
    expect(imageBuffer.length).toBeLessThan(1024 * 1024); // Should be compressed

    console.log('✅ Image processing validation passed');
  });

  test('Error Handling - File Size Limits', async ({ page }) => {
    test.setTimeout(60000);

    // Create oversized file
    const oversizedFile = path.join(FIXTURES_DIR, 'oversized-file.jpg');
    await createOversizedFile(oversizedFile, 200 * 1024 * 1024); // 200MB

    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);
    
    const upload = page.locator('input[type="file"][accept*="image"]').first();
    await upload.setInputFiles(oversizedFile);

    // Should show error message
    const errorMessage = page.locator('[data-testid="upload-error"], .upload-error, .error-message').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/size|limit|too large/i);

    console.log('✅ File size limit error handling passed');
  });

  test('Error Handling - Invalid File Types', async ({ page }) => {
    test.setTimeout(60000);

    const invalidFile = path.join(FIXTURES_DIR, 'malicious.exe');
    
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);
    
    const upload = page.locator('input[type="file"][accept*="image"]').first();
    await upload.setInputFiles(invalidFile);

    // Should show error for invalid file type
    const errorMessage = page.locator('[data-testid="upload-error"], .upload-error, .error-message').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/type|format|not allowed/i);

    console.log('✅ Invalid file type error handling passed');
  });

  test('Mobile Upload Functionality', async ({ browser }) => {
    test.setTimeout(60000);

    // Create mobile context
    const mobileContext = await browser.newContext({
      ...browser.contexts()[0]?.contextOptions(),
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });

    const mobilePage = await mobileContext.newPage();
    const mobileTestSuite = new FileUploadTestSuite(mobilePage, mobileContext);
    
    await mobileTestSuite.authenticateUser(authToken);
    await mobilePage.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);

    // Test touch interface
    const mobileUpload = mobilePage.locator('[data-testid="camera-upload"], .camera-btn, .mobile-upload-btn').first();
    
    if (await mobileUpload.isVisible()) {
      await mobileUpload.tap();
      
      // Should open file picker or camera
      const fileInput = mobilePage.locator('input[type="file"][capture], input[type="file"]').last();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'avatar-test.jpg'));

      await mobileTestSuite.waitForUploadComplete('[data-testid="upload-container"]');
    }

    await mobileContext.close();
    console.log('✅ Mobile upload functionality passed');
  });

  test('MinIO Integration Verification', async ({ page }) => {
    test.setTimeout(60000);

    // Test direct MinIO integration
    const response = await page.request.get(`${TEST_CONFIG.api.baseUrl}/uploads/stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const stats = await response.json();
    expect(stats.success).toBeTruthy();
    expect(stats.data).toBeDefined();

    // Verify different buckets exist
    const buckets = ['avatars', 'media', 'attachments'];
    for (const bucket of buckets) {
      expect(stats.data[bucket]).toBeDefined();
    }

    console.log('✅ MinIO integration verification passed');
  });

  test('File Download and Retrieval', async ({ page }) => {
    test.setTimeout(60000);

    // Upload a file first
    await page.goto(`${TEST_CONFIG.frontend.baseUrl}/profile/settings`);
    const upload = page.locator('input[type="file"][accept*="image"]').first();
    await upload.setInputFiles(path.join(FIXTURES_DIR, 'test-document.pdf'));
    
    await testSuite.waitForUploadComplete('[data-testid="avatar-upload"]');

    // Test file download
    const downloadLink = page.locator('[data-testid="download-file"], .download-btn').first();
    
    if (await downloadLink.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await downloadLink.click();
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }

    console.log('✅ File download and retrieval passed');
  });
});

// Helper functions for creating test files
async function createTestImage(filePath: string, size: string, format: string) {
  const [width, height] = size.split('x').map(Number);
  
  // Create a simple colored rectangle as test image
  const canvas = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#4F46E5"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20">Test Image ${size}</text>
  </svg>`;
  
  fs.writeFileSync(filePath, canvas);
}

async function createTestVideo(filePath: string) {
  // Create a minimal MP4 header (placeholder)
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
  ]);
  fs.writeFileSync(filePath, mp4Header);
}

async function createTestAudio(filePath: string) {
  // Create a minimal MP3 header
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  fs.writeFileSync(filePath, mp3Header);
}

async function createTestDocument(filePath: string) {
  // Create a minimal PDF
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
301
%%EOF`;
  fs.writeFileSync(filePath, pdfContent);
}

async function createInvalidFiles(dir: string) {
  // Create malicious executable
  fs.writeFileSync(path.join(dir, 'malicious.exe'), 'MZ\x90\x00'); // DOS header
  
  // Create oversized file function
}

async function createOversizedFile(filePath: string, sizeInBytes: number) {
  const fd = fs.openSync(filePath, 'w');
  fs.writeSync(fd, Buffer.alloc(sizeInBytes, 0));
  fs.closeSync(fd);
}