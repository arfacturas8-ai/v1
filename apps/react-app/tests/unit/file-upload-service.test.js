/**
 * CRYB Platform - File Upload Service Unit Tests
 * 
 * Comprehensive unit tests for fileUploadService.js
 * Tests all methods, error handling, and edge cases
 */

// Mock API service
jest.mock('../../src/services/api.js', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  baseURL: 'http://localhost:3002',
  getAuthToken: jest.fn(() => 'mock-token'),
  default: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    baseURL: 'http://localhost:3002',
    getAuthToken: jest.fn(() => 'mock-token')
  }
}));

import fileUploadService from '../../src/services/fileUploadService.js';
import { jest } from '@jest/globals';

// Mock XMLHttpRequest for progress testing
class MockXMLHttpRequest {
  constructor() {
    this.readyState = 0;
    this.status = 200;
    this.responseText = '';
    this.upload = {
      addEventListener: jest.fn()
    };
    this.addEventListener = jest.fn();
    this.setRequestHeader = jest.fn();
    this.open = jest.fn();
    this.send = jest.fn();
  }
}

global.XMLHttpRequest = MockXMLHttpRequest;

// Helper to create mock files
function createMockFile(name, size, type, content = 'test content') {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Helper to create mock image for canvas tests
function createMockImage() {
  const img = {
    onload: null,
    src: '',
    width: 800,
    height: 600
  };
  
  setTimeout(() => {
    if (img.onload) img.onload();
  }, 0);
  
  return img;
}

// Mock canvas and image APIs
global.Image = jest.fn(() => createMockImage());
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

describe('FileUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.post.mockResolvedValue({ 
      success: true, 
      data: { 
        file: { id: 'test-file-id', url: 'http://example.com/file.jpg' },
        url: 'http://example.com/file.jpg'
      } 
    });
  });

  describe('File Validation', () => {
    test('should validate file size limits', () => {
      const smallFile = createMockFile('small.jpg', 1024, 'image/jpeg');
      const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg'); // 15MB

      const smallErrors = fileUploadService.validateFile(smallFile, 'image');
      const largeErrors = fileUploadService.validateFile(largeFile, 'image');

      expect(smallErrors).toHaveLength(0);
      expect(largeErrors).toHaveLength(1);
      expect(largeErrors[0]).toMatch(/size exceeds/i);
    });

    test('should validate file types', () => {
      const validImage = createMockFile('test.jpg', 1024, 'image/jpeg');
      const invalidImage = createMockFile('test.exe', 1024, 'application/x-msdownload');

      const validErrors = fileUploadService.validateFile(validImage, 'image');
      const invalidErrors = fileUploadService.validateFile(invalidImage, 'image');

      expect(validErrors).toHaveLength(0);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0]).toMatch(/not allowed/i);
    });

    test('should detect malicious file extensions', () => {
      const maliciousFiles = [
        createMockFile('virus.exe', 1024, 'image/jpeg'),
        createMockFile('script.bat', 1024, 'text/plain'),
        createMockFile('payload.scr', 1024, 'application/octet-stream')
      ];

      maliciousFiles.forEach(file => {
        const errors = fileUploadService.validateFile(file);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toMatch(/security/i);
      });
    });

    test('should handle missing file', () => {
      const errors = fileUploadService.validateFile(null);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('No file provided');
    });
  });

  describe('File Category Detection', () => {
    test('should correctly categorize files', () => {
      const testCases = [
        { file: createMockFile('img.jpg', 1024, 'image/jpeg'), expected: 'image' },
        { file: createMockFile('vid.mp4', 1024, 'video/mp4'), expected: 'video' },
        { file: createMockFile('audio.mp3', 1024, 'audio/mpeg'), expected: 'audio' },
        { file: createMockFile('doc.pdf', 1024, 'application/pdf'), expected: 'document' },
        { file: createMockFile('other.bin', 1024, 'application/octet-stream'), expected: 'general' }
      ];

      testCases.forEach(({ file, expected }) => {
        const category = fileUploadService.getFileCategory(file);
        expect(category).toBe(expected);
      });
    });
  });

  describe('File Size Formatting', () => {
    test('should format file sizes correctly', () => {
      const testCases = [
        { bytes: 0, expected: '0 Bytes' },
        { bytes: 1024, expected: '1 KB' },
        { bytes: 1024 * 1024, expected: '1 MB' },
        { bytes: 1536, expected: '1.5 KB' },
        { bytes: 1024 * 1024 * 1024, expected: '1 GB' }
      ];

      testCases.forEach(({ bytes, expected }) => {
        const formatted = fileUploadService.formatFileSize(bytes);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe('File Preview Generation', () => {
    beforeEach(() => {
      // Mock FileReader
      global.FileReader = jest.fn(() => ({
        readAsDataURL: jest.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,mock-data' } });
          }, 0);
        }),
        onload: null
      }));

      // Mock canvas
      global.document = {
        createElement: jest.fn((tag) => {
          if (tag === 'video') {
            return {
              preload: '',
              onloadedmetadata: null,
              src: '',
              videoWidth: 1920,
              videoHeight: 1080,
              duration: 60
            };
          }
          return {};
        })
      };
    });

    test('should generate image preview', async () => {
      const imageFile = createMockFile('test.jpg', 1024, 'image/jpeg');
      const preview = await fileUploadService.createFilePreview(imageFile);

      expect(preview.type).toBe('image');
      expect(preview.url).toBeDefined();
    });

    test('should generate video preview', async () => {
      const videoFile = createMockFile('test.mp4', 1024, 'video/mp4');
      
      // Mock video element behavior
      setTimeout(() => {
        const video = document.createElement('video');
        if (video.onloadedmetadata) {
          video.onloadedmetadata();
        }
      }, 0);

      const preview = await fileUploadService.createFilePreview(videoFile);

      expect(preview.type).toBe('video');
      expect(preview.width).toBeDefined();
      expect(preview.height).toBeDefined();
      expect(preview.duration).toBeDefined();
    });

    test('should generate generic preview for other files', async () => {
      const docFile = createMockFile('test.pdf', 1024, 'application/pdf');
      const preview = await fileUploadService.createFilePreview(docFile);

      expect(preview.type).toBe('document');
      expect(preview.name).toBe('test.pdf');
      expect(preview.size).toBe(1024);
    });
  });

  describe('Single File Upload', () => {
    test('should upload file successfully', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const options = { channelId: 'test-channel' };

      const result = await fileUploadService.uploadFile(file, options);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.url).toBe('http://example.com/file.jpg');
      expect(mockApiService.post).toHaveBeenCalledWith('/uploads', expect.any(FormData));
    });

    test('should handle upload failure', async () => {
      mockApiService.post.mockResolvedValue({ success: false, error: 'Upload failed' });
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    test('should handle network errors', async () => {
      mockApiService.post.mockRejectedValue(new Error('Network error'));
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should validate file before upload', async () => {
      const invalidFile = createMockFile('huge.jpg', 50 * 1024 * 1024, 'image/jpeg'); // 50MB

      const result = await fileUploadService.uploadFile(invalidFile, { category: 'image' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/size exceeds/i);
      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    test('should use enhanced endpoint when specified', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      
      await fileUploadService.uploadFile(file, { enhanced: true });

      expect(mockApiService.post).toHaveBeenCalledWith('/uploads/enhanced', expect.any(FormData));
    });
  });

  describe('Multiple File Upload', () => {
    test('should upload multiple files successfully', async () => {
      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.png', 2048, 'image/png')
      ];

      mockApiService.post.mockResolvedValue({
        success: true,
        data: {
          files: [
            { id: 'file1', url: 'http://example.com/file1.jpg' },
            { id: 'file2', url: 'http://example.com/file2.png' }
          ],
          urls: ['http://example.com/file1.jpg', 'http://example.com/file2.png']
        }
      });

      const result = await fileUploadService.uploadFiles(files);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.urls).toHaveLength(2);
    });

    test('should validate all files before upload', async () => {
      const files = [
        createMockFile('valid.jpg', 1024, 'image/jpeg'),
        createMockFile('invalid.exe', 1024, 'application/x-msdownload')
      ];

      const result = await fileUploadService.uploadFiles(files);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/security/i);
      expect(mockApiService.post).not.toHaveBeenCalled();
    });
  });

  describe('Upload with Progress', () => {
    test('should track upload progress', async () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const progressCallback = jest.fn();

      const mockXHR = new MockXMLHttpRequest();
      mockXHR.responseText = JSON.stringify({ 
        success: true, 
        data: { file: { id: 'test' }, url: 'http://example.com/test.jpg' } 
      });

      global.XMLHttpRequest = jest.fn(() => mockXHR);

      const resultPromise = fileUploadService.uploadFileWithProgress(file, {}, progressCallback);

      // Simulate progress events
      setTimeout(() => {
        const progressEvent = { lengthComputable: true, loaded: 512, total: 1024 };
        mockXHR.upload.addEventListener.mock.calls[0][1](progressEvent);
      }, 10);

      setTimeout(() => {
        mockXHR.addEventListener.mock.calls[0][1]();
      }, 20);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(progressCallback).toHaveBeenCalledWith(50);
    });
  });

  describe('File Info Retrieval', () => {
    test('should get file info successfully', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: { file: { id: 'test-file', name: 'test.jpg', size: 1024 } }
      });

      const result = await fileUploadService.getFileInfo('test-file');

      expect(result.success).toBe(true);
      expect(result.file.id).toBe('test-file');
      expect(mockApiService.get).toHaveBeenCalledWith('/media/test-file');
    });

    test('should handle file not found', async () => {
      mockApiService.get.mockRejectedValue(new Error('Not found'));

      const result = await fileUploadService.getFileInfo('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  describe('File Deletion', () => {
    test('should delete file successfully', async () => {
      mockApiService.delete.mockResolvedValue({ success: true, message: 'Deleted' });

      const result = await fileUploadService.deleteFile('test-file');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Deleted');
      expect(mockApiService.delete).toHaveBeenCalledWith('/media/test-file');
    });

    test('should handle deletion errors', async () => {
      mockApiService.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await fileUploadService.deleteFile('test-file');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('User Files Retrieval', () => {
    test('should get user files with pagination', async () => {
      mockApiService.get.mockResolvedValue({
        success: true,
        data: {
          files: [{ id: 'file1' }, { id: 'file2' }],
          pagination: { page: 1, total: 2 }
        }
      });

      const result = await fileUploadService.getUserFiles({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
    });

    test('should handle filtering options', async () => {
      await fileUploadService.getUserFiles({ 
        category: 'image', 
        serverId: 'server1',
        channelId: 'channel1'
      });

      const expectedUrl = '/media?page=1&limit=20&category=image&serverId=server1&channelId=channel1';
      expect(mockApiService.get).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('Thumbnail Generation', () => {
    test('should generate thumbnail successfully', async () => {
      mockApiService.post.mockResolvedValue({
        success: true,
        data: { thumbnail: 'http://example.com/thumb.jpg' }
      });

      const result = await fileUploadService.generateThumbnail('test-file', {
        width: 200,
        height: 200,
        quality: 80
      });

      expect(result.success).toBe(true);
      expect(result.thumbnail).toBe('http://example.com/thumb.jpg');
      expect(mockApiService.post).toHaveBeenCalledWith('/media/test-file/thumbnail', {
        width: 200,
        height: 200,
        quality: 80
      });
    });
  });

  describe('Image Compression', () => {
    beforeEach(() => {
      // Mock canvas APIs
      global.document = {
        createElement: jest.fn(() => ({
          getContext: jest.fn(() => ({
            drawImage: jest.fn()
          })),
          toBlob: jest.fn((callback) => {
            const blob = new Blob(['compressed'], { type: 'image/jpeg' });
            callback(blob);
          }),
          width: 0,
          height: 0
        }))
      };
    });

    test('should compress image', async () => {
      const file = createMockFile('large.jpg', 1024, 'image/jpeg');
      
      const compressed = await fileUploadService.compressImage(file, 800, 600, 0.8);

      expect(compressed).toBeInstanceOf(File);
      expect(compressed.name).toBe('large.jpg');
      expect(compressed.type).toBe('image/jpeg');
    });
  });

  describe('Batch Operations', () => {
    test('should perform batch operations successfully', async () => {
      mockApiService.post.mockResolvedValue({
        success: true,
        data: {
          results: ['success', 'success'],
          errors: []
        }
      });

      const result = await fileUploadService.batchOperation(
        ['file1', 'file2'], 
        'delete', 
        { force: true }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(mockApiService.post).toHaveBeenCalledWith('/media/batch', {
        fileIds: ['file1', 'file2'],
        operation: 'delete',
        options: { force: true }
      });
    });

    test('should handle batch operation errors', async () => {
      mockApiService.post.mockRejectedValue(new Error('Batch failed'));

      const result = await fileUploadService.batchOperation(['file1'], 'delete');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Batch failed');
    });
  });

  describe('Configuration Validation', () => {
    test('should have correct file size limits', () => {
      expect(fileUploadService.maxSizes.image).toBe(10 * 1024 * 1024); // 10MB
      expect(fileUploadService.maxSizes.video).toBe(100 * 1024 * 1024); // 100MB
      expect(fileUploadService.maxSizes.audio).toBe(50 * 1024 * 1024); // 50MB
      expect(fileUploadService.maxSizes.document).toBe(25 * 1024 * 1024); // 25MB
      expect(fileUploadService.maxSizes.general).toBe(50 * 1024 * 1024); // 50MB
    });

    test('should have correct allowed file types', () => {
      expect(fileUploadService.allowedTypes.image).toContain('image/jpeg');
      expect(fileUploadService.allowedTypes.image).toContain('image/png');
      expect(fileUploadService.allowedTypes.video).toContain('video/mp4');
      expect(fileUploadService.allowedTypes.audio).toContain('audio/mp3');
      expect(fileUploadService.allowedTypes.document).toContain('application/pdf');
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('should handle undefined API responses', async () => {
      mockApiService.post.mockResolvedValue(undefined);
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    test('should handle malformed API responses', async () => {
      mockApiService.post.mockResolvedValue({ success: true }); // No data field
      
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    test('should handle empty file lists', async () => {
      const result = await fileUploadService.uploadFiles([]);

      expect(result.success).toBe(false);
      expect(mockApiService.post).not.toHaveBeenCalled();
    });
  });
});