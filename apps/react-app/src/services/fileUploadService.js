/**
 * File Upload Service for CRYB Platform
 * Handles file uploads, media processing, and storage integration
 */

import apiService from './api';

class FileUploadService {
  constructor() {
    this.endpoints = {
      upload: '/uploads',
      enhancedUpload: '/uploads/enhanced',
      media: '/media'
    };
    
    // Maximum file sizes (in bytes)
    this.maxSizes = {
      image: 10 * 1024 * 1024,    // 10MB
      video: 100 * 1024 * 1024,   // 100MB
      audio: 50 * 1024 * 1024,    // 50MB
      document: 25 * 1024 * 1024, // 25MB
      general: 50 * 1024 * 1024   // 50MB
    };
    
    // Allowed file types
    this.allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
      audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm'],
      document: ['application/pdf', 'text/plain', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    };
  }

  // Validate file before upload
  validateFile(file, type = 'general') {
    const errors = [];
    
    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return errors;
    }
    
    // Check file size
    const maxSize = this.maxSizes[type] || this.maxSizes.general;
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${this.formatFileSize(maxSize)} limit`);
    }
    
    // Check file type
    if (type !== 'general' && this.allowedTypes[type]) {
      if (!this.allowedTypes[type].includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed for ${type} uploads`);
      }
    }
    
    // Check for malicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      errors.push('File type not allowed for security reasons');
    }
    
    return errors;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type category
  getFileCategory(file) {
    const mimeType = file.type;
    
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (this.allowedTypes.document.includes(mimeType)) return 'document';
    
    return 'general';
  }

  // Create file preview
  createFilePreview(file) {
    return new Promise((resolve) => {
      const category = this.getFileCategory(file);
      
      if (category === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            type: 'image',
            url: e.target.result,
            width: null,
            height: null
          });
        };
        reader.readAsDataURL(file);
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          resolve({
            type: 'image',
            url: URL.createObjectURL(file),
            width: img.width,
            height: img.height
          });
        };
        img.src = URL.createObjectURL(file);
      } else if (category === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve({
            type: 'video',
            url: URL.createObjectURL(file),
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration
          });
        };
        video.src = URL.createObjectURL(file);
      } else {
        resolve({
          type: category,
          url: null,
          name: file.name,
          size: file.size,
          mimeType: file.type
        });
      }
    });
  }

  // Upload single file
  async uploadFile(file, options = {}) {
    try {
      const category = this.getFileCategory(file);
      const validationErrors = this.validateFile(file, category);
      
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: validationErrors.join(', ') 
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      if (options.channelId) {
        formData.append('channelId', options.channelId);
      }
      if (options.serverId) {
        formData.append('serverId', options.serverId);
      }
      if (options.description) {
        formData.append('description', options.description);
      }
      if (options.isPrivate) {
        formData.append('isPrivate', options.isPrivate);
      }
      
      // Add file category
      formData.append('category', category);

      // Use enhanced upload endpoint if available
      const endpoint = options.enhanced ? this.endpoints.enhancedUpload : this.endpoints.upload;
      const response = await apiService.post(endpoint, formData);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          file: response.data.file,
          url: response.data.url || response.data.file.url
        };
      }

      return { success: false, error: 'Upload failed' };
    } catch (error) {
      console.error('Upload file error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Upload failed' 
      };
    }
  }

  // Upload multiple files
  async uploadFiles(files, options = {}) {
    try {
      const results = [];
      const errors = [];
      
      // Validate all files first
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const category = this.getFileCategory(file);
        const validationErrors = this.validateFile(file, category);
        
        if (validationErrors.length > 0) {
          errors.push(`File ${i + 1}: ${validationErrors.join(', ')}`);
        }
      }
      
      if (errors.length > 0) {
        return { 
          success: false, 
          error: errors.join('\n') 
        };
      }

      const formData = new FormData();
      
      // Add all files
      for (const file of files) {
        formData.append('files', file);
      }
      
      // Add metadata
      if (options.channelId) {
        formData.append('channelId', options.channelId);
      }
      if (options.serverId) {
        formData.append('serverId', options.serverId);
      }
      if (options.description) {
        formData.append('description', options.description);
      }
      if (options.isPrivate) {
        formData.append('isPrivate', options.isPrivate);
      }

      const endpoint = options.enhanced ? this.endpoints.enhancedUpload : this.endpoints.upload;
      const response = await apiService.post(endpoint, formData);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          files: response.data.files || [],
          urls: response.data.urls || []
        };
      }

      return { success: false, error: 'Upload failed' };
    } catch (error) {
      console.error('Upload files error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Upload failed' 
      };
    }
  }

  // Upload with progress tracking
  async uploadFileWithProgress(file, options = {}, onProgress = null) {
    try {
      const category = this.getFileCategory(file);
      const validationErrors = this.validateFile(file, category);
      
      if (validationErrors.length > 0) {
        return { 
          success: false, 
          error: validationErrors.join(', ') 
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(options).forEach(key => {
        if (key !== 'enhanced' && options[key] !== undefined) {
          formData.append(key, options[key]);
        }
      });
      
      formData.append('category', category);

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const endpoint = options.enhanced ? this.endpoints.enhancedUpload : this.endpoints.upload;
        const url = `${apiService.baseURL}${endpoint}`;
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && response.success) {
              resolve({ 
                success: true, 
                file: response.data.file,
                url: response.data.url || response.data.file.url
              });
            } else {
              resolve({ 
                success: false, 
                error: response.message || response.error || 'Upload failed' 
              });
            }
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: 'Failed to parse server response' 
            });
          }
        });
        
        xhr.addEventListener('error', () => {
          resolve({ 
            success: false, 
            error: 'Network error during upload' 
          });
        });
        
        xhr.open('POST', url);
        
        // Add auth header
        const token = apiService.getAuthToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload with progress error:', error);
      return { 
        success: false, 
        error: error.message || 'Upload failed' 
      };
    }
  }

  // Get uploaded file info
  async getFileInfo(fileId) {
    try {
      const response = await apiService.get(`${this.endpoints.media}/${fileId}`);
      
      if (response.success && response.data) {
        return { success: true, file: response.data.file };
      }

      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('Get file info error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to get file info' 
      };
    }
  }

  // Delete uploaded file
  async deleteFile(fileId) {
    try {
      const response = await apiService.delete(`${this.endpoints.media}/${fileId}`);
      
      return { success: response.success, message: response.message || 'File deleted' };
    } catch (error) {
      console.error('Delete file error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to delete file' 
      };
    }
  }

  // Get user's uploaded files
  async getUserFiles(options = {}) {
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '20',
        ...(options.category && { category: options.category }),
        ...(options.serverId && { serverId: options.serverId }),
        ...(options.channelId && { channelId: options.channelId })
      });

      const response = await apiService.get(`${this.endpoints.media}?${params.toString()}`);
      
      if (response.success && response.data) {
        return { 
          success: true, 
          files: response.data.files || [],
          pagination: response.data.pagination || {}
        };
      }

      return { success: false, error: 'Failed to fetch files' };
    } catch (error) {
      console.error('Get user files error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch files' 
      };
    }
  }

  // Generate file thumbnail
  async generateThumbnail(fileId, options = {}) {
    try {
      const response = await apiService.post(`${this.endpoints.media}/${fileId}/thumbnail`, {
        width: options.width || 200,
        height: options.height || 200,
        quality: options.quality || 80
      });
      
      if (response.success && response.data) {
        return { success: true, thumbnail: response.data.thumbnail };
      }

      return { success: false, error: 'Failed to generate thumbnail' };
    } catch (error) {
      console.error('Generate thumbnail error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to generate thumbnail' 
      };
    }
  }

  // Compress image before upload
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          }));
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Batch file operations
  async batchOperation(fileIds, operation, options = {}) {
    try {
      const response = await apiService.post(`${this.endpoints.media}/batch`, {
        fileIds,
        operation, // 'delete', 'move', 'copy', etc.
        options
      });
      
      if (response.success && response.data) {
        return { 
          success: true, 
          results: response.data.results || [],
          errors: response.data.errors || []
        };
      }

      return { success: false, error: 'Batch operation failed' };
    } catch (error) {
      console.error('Batch operation error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Batch operation failed' 
      };
    }
  }
}

// Create and export singleton instance
const fileUploadService = new FileUploadService();

export default fileUploadService;