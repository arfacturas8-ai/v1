/**
 * API Client
 * Axios-based HTTP client with interceptors for auth, error handling, and retries
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../config/environment';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/uiStore';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: environment.API_BASE_URL,
  timeout: environment.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshSession();
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    handleApiError(error);
    return Promise.reject(error);
  }
);

// Error handler
function handleApiError(error: AxiosError<any>) {
  if (!error.response) {
    // Network error
    toast.error('Network error. Please check your connection.');
    return;
  }

  const status = error.response.status;
  const message = error.response.data?.message || error.message;

  switch (status) {
    case 400:
      toast.error(message || 'Invalid request');
      break;
    case 401:
      // Handled by interceptor
      break;
    case 403:
      toast.error('You don\'t have permission to do that');
      break;
    case 404:
      toast.error('Resource not found');
      break;
    case 429:
      toast.error('Too many requests. Please slow down.');
      break;
    case 500:
    case 502:
    case 503:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error(message || 'Something went wrong');
  }
}

// API methods
export const api = {
  // GET request
  get: <T = any>(url: string, config?: any) =>
    apiClient.get<T>(url, config).then((res) => res.data),

  // POST request
  post: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),

  // PUT request
  put: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: any) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),

  // DELETE request
  delete: <T = any>(url: string, config?: any) =>
    apiClient.delete<T>(url, config).then((res) => res.data),

  // Upload file
  upload: <T = any>(url: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }).then((res) => res.data);
  },
};

export default apiClient;
