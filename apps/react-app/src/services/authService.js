/**
 * Authentication Service for CRYB Platform
 * Handles user authentication, registration, and JWT token management
 */

import apiService from './api';

class AuthService {
  constructor() {
    this.endpoints = {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/me',
      changePassword: '/auth/change-password',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email',
      resendVerification: '/auth/resend-verification',
      twoFactor: '/2fa',
      web3: '/auth/web3'
    };
  }

  // Store tokens securely
  storeTokens(tokens, rememberMe = false) {
    const { accessToken, refreshToken, expiresAt } = tokens;
    
    // Store session token (short-lived)
    const sessionToken = {
      token: accessToken,
      expiresAt: expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    };
    localStorage.setItem('cryb_session_token', JSON.stringify(sessionToken));
    
    // Store refresh token if remember me is enabled (long-lived)
    if (rememberMe && refreshToken) {
      const rememberToken = {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      localStorage.setItem('cryb_remember_token', JSON.stringify(rememberToken));
    }
  }

  // Clear all authentication data
  clearAuth() {
    localStorage.removeItem('cryb_session_token');
    localStorage.removeItem('cryb_remember_token');
    localStorage.removeItem('user');
    localStorage.removeItem('cryb_siwe_session');
  }

  // Register new user
  async register(userData) {
    try {
      const response = await apiService.post(this.endpoints.register, {
        username: userData.username,
        displayName: userData.displayName || userData.username,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword
      }, { auth: false });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens
        this.storeTokens(tokens, false);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user, tokens };
      }

      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      // Check if error.data has the API error response structure
      if (error.data && error.data.error) {
        return { 
          success: false, 
          error: error.data.error 
        };
      }
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Registration failed' 
      };
    }
  }

  // Login with email/username/identifier and password
  async login(identifier, password, rememberMe = false) {
    try {
      const response = await apiService.post(this.endpoints.login, {
        identifier,
        password,
        rememberMe
      }, { auth: false });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens
        this.storeTokens(tokens, rememberMe);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user, tokens };
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      // Check if error.data has the API error response structure
      if (error.data && error.data.error) {
        return { 
          success: false, 
          error: error.data.error 
        };
      }
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Invalid credentials' 
      };
    }
  }

  // Logout
  async logout() {
    try {
      // Call backend logout endpoint
      await apiService.post(this.endpoints.logout);
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Always clear local auth data
      this.clearAuth();
    }
    
    return { success: true };
  }

  // Refresh access token
  async refreshToken() {
    try {
      const rememberToken = localStorage.getItem('cryb_remember_token');
      if (!rememberToken) {
        throw new Error('No refresh token available');
      }

      const tokenData = JSON.parse(rememberToken);
      if (!tokenData.token || new Date(tokenData.expiresAt) <= new Date()) {
        throw new Error('Refresh token expired');
      }

      const response = await apiService.post(this.endpoints.refresh, {
        refreshToken: tokenData.token
      }, { auth: false });

      if (response.success && response.data) {
        const { tokens } = response.data;
        this.storeTokens(tokens, true);
        return { success: true, tokens };
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return { success: false, error: error.message };
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiService.get(this.endpoints.profile);
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
      }

      return { success: false, error: 'Failed to fetch profile' };
    } catch (error) {
      console.error('Get profile error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to fetch profile' 
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put(this.endpoints.profile, profileData);
      
      if (response.success && response.data) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
      }

      return { success: false, error: 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to update profile' 
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.post(this.endpoints.changePassword, {
        currentPassword,
        newPassword
      });
      
      return { 
        success: response.success, 
        message: response.message || 'Password changed successfully' 
      };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to change password' 
      };
    }
  }

  // Request password reset email
  async resetPassword(email) {
    try {
      const response = await apiService.post(this.endpoints.forgotPassword, {
        email
      }, { auth: false });

      return {
        success: response.success,
        message: response.message || 'Password reset email sent'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to send reset email'
      };
    }
  }

  // Confirm password reset with token
  async confirmPasswordReset(token, password, confirmPassword) {
    try {
      const response = await apiService.post(this.endpoints.resetPassword, {
        token,
        password,
        confirmPassword
      }, { auth: false });

      return {
        success: response.success,
        message: response.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to reset password'
      };
    }
  }

  // Verify email address
  async verifyEmail(token) {
    try {
      const response = await apiService.post(this.endpoints.verifyEmail, {
        token
      }, { auth: false });
      
      if (response.success && response.data?.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return { 
        success: response.success, 
        message: response.message || 'Email verified successfully' 
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to verify email' 
      };
    }
  }

  // Resend verification email
  async resendVerification() {
    try {
      const response = await apiService.post(this.endpoints.resendVerification);
      
      return { 
        success: response.success, 
        message: response.message || 'Verification email sent' 
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to send verification email' 
      };
    }
  }

  // Two-factor authentication methods
  async enableTwoFactor() {
    try {
      const response = await apiService.post(`${this.endpoints.twoFactor}/enable`);
      return response;
    } catch (error) {
      console.error('Enable 2FA error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to enable 2FA' 
      };
    }
  }

  async disableTwoFactor(password) {
    try {
      const response = await apiService.post(`${this.endpoints.twoFactor}/disable`, {
        password
      });
      return response;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to disable 2FA' 
      };
    }
  }

  async verifyTwoFactor(token) {
    try {
      const response = await apiService.post(`${this.endpoints.twoFactor}/verify`, {
        token
      });
      return response;
    } catch (error) {
      console.error('Verify 2FA error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Invalid 2FA token' 
      };
    }
  }

  // Web3 authentication methods
  async requestWeb3Nonce(walletAddress) {
    try {
      const response = await apiService.post(`${this.endpoints.web3}/nonce`, {
        walletAddress
      }, { auth: false });
      
      return response;
    } catch (error) {
      console.error('Web3 nonce error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Failed to get Web3 nonce' 
      };
    }
  }

  async authenticateWeb3(walletAddress, signature, message) {
    try {
      const response = await apiService.post(`${this.endpoints.web3}/authenticate`, {
        walletAddress,
        signature,
        message
      }, { auth: false });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        
        // Store tokens
        this.storeTokens(tokens, true); // Web3 users typically expect persistent sessions
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        
        // Store Web3 session info
        const web3Session = {
          account: walletAddress,
          expirationTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          ensName: user.ensName || null
        };
        localStorage.setItem('cryb_siwe_session', JSON.stringify(web3Session));
        
        return { success: true, user, tokens };
      }

      return { success: false, error: 'Web3 authentication failed' };
    } catch (error) {
      console.error('Web3 auth error:', error);
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Web3 authentication failed' 
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = apiService.getAuthToken();
    return !!token;
  }

  // Get stored user data
  getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if tokens need refresh
  shouldRefreshToken() {
    const sessionToken = localStorage.getItem('cryb_session_token');
    if (!sessionToken) return false;

    try {
      const tokenData = JSON.parse(sessionToken);
      const expiresAt = new Date(tokenData.expiresAt);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch (error) {
      return true; // If we can't parse, assume we need to refresh
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;