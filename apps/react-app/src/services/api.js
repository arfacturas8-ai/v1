/**
 * Core API Service for CRYB Platform
 * Handles HTTP requests to the backend API server
 */

import rateLimiter from '../utils/rateLimiter.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://api.cryb.ai';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.wsURL = WS_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from localStorage
  getAuthToken() {
    const sessionToken = localStorage.getItem('cryb_session_token');
    if (sessionToken) {
      try {
        const tokenData = JSON.parse(sessionToken);
        // Check if token is not expired
        if (tokenData.expiresAt && new Date(tokenData.expiresAt) > new Date()) {
          return tokenData.token;
        } else {
          localStorage.removeItem('cryb_session_token');
        }
      } catch (error) {
        localStorage.removeItem('cryb_session_token');
      }
    }
    return null;
  }

  // Get headers with authentication
  getHeaders(includeAuth = true) {
    const headers = { ...this.defaultHeaders };
    
    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Handle API response
  async handleResponse(response) {
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    // Check rate limit (unless explicitly bypassed)
    if (options.bypassRateLimit !== true) {
      await rateLimiter.waitUntilAllowed(endpoint)
      rateLimiter.recordRequest(endpoint)
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    // Handle FormData for file uploads
    if (config.body instanceof FormData) {
      // Remove Content-Type header to let browser set it with boundary
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API Request failed: ${config.method || 'GET'} ${url}`, error);

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your connection.');
      }

      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  async put(endpoint, data, options = {}) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  async patch(endpoint, data, options = {}) {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  // File upload helper
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.post(endpoint, formData);
  }

  // Multiple file upload helper
  async uploadFiles(endpoint, files, additionalData = {}) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    
    // Add any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    return this.post(endpoint, formData);
  }

  // Retry mechanism for important requests
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

// Create and export singleton instance
const apiService = new APIService();

export default apiService;
export { API_BASE_URL, WS_BASE_URL };