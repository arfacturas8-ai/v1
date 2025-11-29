/**
 * WebAuthn / Passkey Service
 * Enables passwordless authentication using platform authenticators (Face ID, Touch ID, Windows Hello)
 */

import api from './api';

class WebAuthnService {
  /**
   * Check if WebAuthn is supported in this browser
   */
  isSupported() {
    return window.PublicKeyCredential !== undefined &&
           navigator.credentials !== undefined;
  }

  /**
   * Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
   */
  async isPlatformAuthenticatorAvailable() {
    if (!this.isSupported()) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Failed to check platform authenticator:', error);
      return false;
    }
  }

  /**
   * Register a new passkey
   * @returns {Object} Registration result with credentialId
   */
  async registerPasskey(deviceName = null) {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Step 1: Get registration options from backend
      const optionsResponse = await api.post('/auth/webauthn/register/init', {
        deviceName
      });

      if (!optionsResponse.success) {
        throw new Error(optionsResponse.error || 'Failed to initialize registration');
      }

      const options = optionsResponse.data.options;

      // Step 2: Convert base64 strings to ArrayBuffers
      const publicKey = {
        ...options,
        challenge: this._base64ToArrayBuffer(options.challenge),
        user: {
          ...options.user,
          id: this._base64ToArrayBuffer(options.user.id)
        },
        excludeCredentials: options.excludeCredentials?.map(cred => ({
          ...cred,
          id: this._base64ToArrayBuffer(cred.id)
        }))
      };

      // Step 3: Create credential using platform authenticator
      const credential = await navigator.credentials.create({ publicKey });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Step 4: Prepare credential data for backend
      const credentialData = {
        id: credential.id,
        rawId: this._arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this._arrayBufferToBase64(credential.response.clientDataJSON),
          attestationObject: this._arrayBufferToBase64(credential.response.attestationObject)
        }
      };

      // Step 5: Verify and register with backend
      const verifyResponse = await api.post('/auth/webauthn/register/verify', {
        credential: credentialData,
        deviceName
      });

      return verifyResponse;
    } catch (error) {
      console.error('Passkey registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate using passkey
   * @returns {Object} Authentication result with tokens
   */
  async authenticateWithPasskey() {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Step 1: Get authentication options from backend
      const optionsResponse = await api.post('/auth/webauthn/login/init');

      if (!optionsResponse.success) {
        throw new Error(optionsResponse.error || 'Failed to initialize authentication');
      }

      const options = optionsResponse.data.options;

      // Step 2: Convert base64 strings to ArrayBuffers
      const publicKey = {
        ...options,
        challenge: this._base64ToArrayBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map(cred => ({
          ...cred,
          id: this._base64ToArrayBuffer(cred.id)
        }))
      };

      // Step 3: Get credential from platform authenticator
      const assertion = await navigator.credentials.get({ publicKey });

      if (!assertion) {
        throw new Error('Failed to get credential');
      }

      // Step 4: Prepare assertion data for backend
      const assertionData = {
        id: assertion.id,
        rawId: this._arrayBufferToBase64(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: this._arrayBufferToBase64(assertion.response.clientDataJSON),
          authenticatorData: this._arrayBufferToBase64(assertion.response.authenticatorData),
          signature: this._arrayBufferToBase64(assertion.response.signature),
          userHandle: assertion.response.userHandle
            ? this._arrayBufferToBase64(assertion.response.userHandle)
            : null
        }
      };

      // Step 5: Verify with backend and get tokens
      const verifyResponse = await api.post('/auth/webauthn/login/verify', {
        assertion: assertionData
      });

      return verifyResponse;
    } catch (error) {
      console.error('Passkey authentication error:', error);
      throw error;
    }
  }

  /**
   * Get list of registered passkeys for current user
   */
  async getPasskeys() {
    try {
      const response = await api.get('/auth/webauthn/credentials');
      return response;
    } catch (error) {
      console.error('Failed to fetch passkeys:', error);
      return { success: false, data: { credentials: [] } };
    }
  }

  /**
   * Remove a passkey
   * @param {String} credentialId - Credential ID to remove
   */
  async removePasskey(credentialId) {
    try {
      const response = await api.delete(`/auth/webauthn/credentials/${credentialId}`);
      return response;
    } catch (error) {
      console.error('Failed to remove passkey:', error);
      throw error;
    }
  }

  /**
   * Update passkey nickname
   * @param {String} credentialId - Credential ID
   * @param {String} nickname - New nickname
   */
  async updatePasskeyNickname(credentialId, nickname) {
    try {
      const response = await api.patch(`/auth/webauthn/credentials/${credentialId}`, {
        nickname
      });
      return response;
    } catch (error) {
      console.error('Failed to update passkey nickname:', error);
      throw error;
    }
  }

  // Helper methods for base64 and ArrayBuffer conversions
  _base64ToArrayBuffer(base64) {
    // Handle both regular base64 and base64url
    const base64url = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = window.atob(base64url);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Convert to base64url (URL-safe base64)
    return window.btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get device/browser info for passkey naming
   */
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown Device';
    let browser = 'Unknown Browser';

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect device
    if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Android')) device = 'Android';
    else if (ua.includes('Linux')) device = 'Linux';

    return `${device} - ${browser}`;
  }
}

export default new WebAuthnService();
