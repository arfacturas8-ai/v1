/**
 * Tests for fileUploadService
 */
import fileUploadService from './fileUploadService';
import apiService from './api';

jest.mock('./api');

describe('fileUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('validates image files', () => {
      const file = {
        name: 'test.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };

      const errors = fileUploadService.validateFile(file, 'image');
      expect(errors).toHaveLength(0);
    });

    it('rejects oversized files', () => {
      const file = {
        name: 'large.jpg',
        size: 20 * 1024 * 1024, // 20MB
        type: 'image/jpeg'
      };

      const errors = fileUploadService.validateFile(file, 'image');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('exceeds');
    });

    it('rejects invalid file types', () => {
      const file = {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain'
      };

      const errors = fileUploadService.validateFile(file, 'image');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('not allowed');
    });

    it('rejects missing file', () => {
      const errors = fileUploadService.validateFile(null);
      expect(errors).toContain('No file provided');
    });

    it('validates video files', () => {
      const file = {
        name: 'video.mp4',
        size: 10 * 1024 * 1024,
        type: 'video/mp4'
      };

      const errors = fileUploadService.validateFile(file, 'video');
      expect(errors).toHaveLength(0);
    });

    it('validates audio files', () => {
      const file = {
        name: 'audio.mp3',
        size: 5 * 1024 * 1024,
        type: 'audio/mp3'
      };

      const errors = fileUploadService.validateFile(file, 'audio');
      expect(errors).toHaveLength(0);
    });

    it('validates document files', () => {
      const file = {
        name: 'doc.pdf',
        size: 2 * 1024 * 1024,
        type: 'application/pdf'
      };

      const errors = fileUploadService.validateFile(file, 'document');
      expect(errors).toHaveLength(0);
    });
  });

  describe('uploadFile', () => {
    it('uploads file successfully', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      apiService.post.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/test.jpg' }
      });

      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(true);
      expect(result.data.url).toBeDefined();
      expect(apiService.post).toHaveBeenCalled();
    });

    it('handles upload errors', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      apiService.post.mockRejectedValue(new Error('Upload failed'));

      const result = await fileUploadService.uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('includes progress callback', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = jest.fn();

      apiService.post.mockResolvedValue({
        success: true,
        data: { url: 'https://cdn.example.com/test.jpg' }
      });

      await fileUploadService.uploadFile(file, { onProgress });

      expect(apiService.post).toHaveBeenCalled();
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes to human readable', () => {
      expect(fileUploadService.formatFileSize(1024)).toContain('KB');
      expect(fileUploadService.formatFileSize(1024 * 1024)).toContain('MB');
      expect(fileUploadService.formatFileSize(1024 * 1024 * 1024)).toContain('GB');
    });

    it('handles zero bytes', () => {
      const result = fileUploadService.formatFileSize(0);
      expect(result).toContain('0');
    });
  });

  describe('configuration', () => {
    it('has max size limits', () => {
      expect(fileUploadService.maxSizes.image).toBeDefined();
      expect(fileUploadService.maxSizes.video).toBeDefined();
      expect(fileUploadService.maxSizes.audio).toBeDefined();
      expect(fileUploadService.maxSizes.document).toBeDefined();
    });

    it('has allowed types', () => {
      expect(fileUploadService.allowedTypes.image).toContain('image/jpeg');
      expect(fileUploadService.allowedTypes.video).toContain('video/mp4');
      expect(fileUploadService.allowedTypes.audio).toContain('audio/mp3');
      expect(fileUploadService.allowedTypes.document).toContain('application/pdf');
    });

    it('has endpoint configuration', () => {
      expect(fileUploadService.endpoints.upload).toBe('/uploads');
      expect(fileUploadService.endpoints.enhancedUpload).toBe('/uploads/enhanced');
      expect(fileUploadService.endpoints.media).toBe('/media');
    });
  });
});
