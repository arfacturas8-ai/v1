/**
 * BIOMETRIC AUTHENTICATION SERVICE
 * Enhanced biometric authentication with keychain integration
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CrashDetector } from '../utils/CrashDetector';

export interface BiometricInfo {
  isAvailable: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  isEnrolled: boolean;
  securityLevel: 'none' | 'weak' | 'strong';
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  data?: any;
}

class BiometricAuthService {
  private static instance: BiometricAuthService;
  private biometricInfo: BiometricInfo | null = null;

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  async initialize(): Promise<BiometricInfo> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Determine security level
      let securityLevel: 'none' | 'weak' | 'strong' = 'none';
      if (hasHardware && isEnrolled) {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
            supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          securityLevel = 'strong';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.PASSCODE)) {
          securityLevel = 'weak';
        }
      }

      this.biometricInfo = {
        isAvailable: hasHardware && isEnrolled,
        supportedTypes,
        isEnrolled,
        securityLevel,
      };

      console.log('[BiometricAuthService] Initialized:', this.biometricInfo);
      return this.biometricInfo;
    } catch (error) {
      console.error('[BiometricAuthService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeBiometricAuth' },
        'medium'
      );

      this.biometricInfo = {
        isAvailable: false,
        supportedTypes: [],
        isEnrolled: false,
        securityLevel: 'none',
      };

      return this.biometricInfo;
    }
  }

  async authenticate(reason: string = 'Authenticate to access CRYB'): Promise<BiometricAuthResult> {
    try {
      if (!this.biometricInfo?.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        requireConfirmation: Platform.OS === 'ios',
      });

      if (result.success) {
        console.log('[BiometricAuthService] Authentication successful');
        return { success: true };
      } else {
        const errorMessage = this.getErrorMessage(result.error);
        console.warn('[BiometricAuthService] Authentication failed:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('[BiometricAuthService] Authentication error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'biometricAuthenticate', reason },
        'medium'
      );

      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      };
    }
  }

  async saveCredentials(key: string, value: string, requireAuth: boolean = true): Promise<boolean> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.biometricInfo?.isAvailable,
        authenticationPrompt: 'Authenticate to save credentials',
        keychainService: 'ai.cryb.mobile',
      };

      await SecureStore.setItemAsync(key, value, options);
      console.log('[BiometricAuthService] Credentials saved successfully');
      return true;
    } catch (error) {
      console.error('[BiometricAuthService] Save credentials error:', error);
      return false;
    }
  }

  async getCredentials(key: string, requireAuth: boolean = true): Promise<string | null> {
    try {
      const options: SecureStore.SecureStoreOptions = {
        requireAuthentication: requireAuth && this.biometricInfo?.isAvailable,
        authenticationPrompt: 'Authenticate to access credentials',
        keychainService: 'ai.cryb.mobile',
      };

      const value = await SecureStore.getItemAsync(key, options);
      if (value) {
        console.log('[BiometricAuthService] Credentials retrieved successfully');
      }
      return value;
    } catch (error) {
      console.error('[BiometricAuthService] Get credentials error:', error);
      return null;
    }
  }

  async deleteCredentials(key: string): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(key, {
        keychainService: 'ai.cryb.mobile',
      });
      console.log('[BiometricAuthService] Credentials deleted successfully');
      return true;
    } catch (error) {
      console.error('[BiometricAuthService] Delete credentials error:', error);
      return false;
    }
  }

  async enableBiometricLogin(): Promise<BiometricAuthResult> {
    try {
      if (!this.biometricInfo?.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Test authentication first
      const authResult = await this.authenticate('Enable biometric login for CRYB');
      if (!authResult.success) {
        return authResult;
      }

      // Save biometric preference
      await SecureStore.setItemAsync('biometric_enabled', 'true', {
        keychainService: 'ai.cryb.mobile',
      });

      console.log('[BiometricAuthService] Biometric login enabled');
      return { success: true };
    } catch (error) {
      console.error('[BiometricAuthService] Enable biometric login error:', error);
      return {
        success: false,
        error: 'Failed to enable biometric login',
      };
    }
  }

  async disableBiometricLogin(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync('biometric_enabled', {
        keychainService: 'ai.cryb.mobile',
      });
      
      // Also remove saved login credentials
      await this.deleteCredentials('login_credentials');
      
      console.log('[BiometricAuthService] Biometric login disabled');
      return true;
    } catch (error) {
      console.error('[BiometricAuthService] Disable biometric login error:', error);
      return false;
    }
  }

  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled', {
        keychainService: 'ai.cryb.mobile',
      });
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricAuthService] Check biometric login status error:', error);
      return false;
    }
  }

  getBiometricInfo(): BiometricInfo | null {
    return this.biometricInfo;
  }

  getBiometricTypeString(): string {
    if (!this.biometricInfo?.supportedTypes.length) {
      return 'Not Available';
    }

    const types = this.biometricInfo.supportedTypes;
    
    if (Platform.OS === 'ios') {
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
    } else {
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face Recognition';
      }
    }

    return 'Biometric Authentication';
  }

  private getErrorMessage(error?: string): string {
    switch (error) {
      case 'user_cancel':
        return 'Authentication was cancelled';
      case 'user_fallback':
        return 'User chose to use fallback authentication';
      case 'system_cancel':
        return 'Authentication was cancelled by the system';
      case 'passcode_not_set':
        return 'Passcode is not set on the device';
      case 'biometry_not_available':
        return 'Biometric authentication is not available';
      case 'biometry_not_enrolled':
        return 'Biometric authentication is not set up';
      case 'biometry_lockout':
        return 'Biometric authentication is locked out';
      case 'app_cancel':
        return 'Authentication was cancelled by the app';
      case 'invalid_context':
        return 'Authentication context is invalid';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  async testBiometricCapabilities(): Promise<{
    hardware: boolean;
    enrolled: boolean;
    supportedTypes: string[];
    securityLevel: string;
  }> {
    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      const supportedTypeNames = types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face Recognition';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          case LocalAuthentication.AuthenticationType.PASSCODE:
            return 'Passcode';
          default:
            return 'Unknown';
        }
      });

      return {
        hardware,
        enrolled,
        supportedTypes: supportedTypeNames,
        securityLevel: this.biometricInfo?.securityLevel || 'none',
      };
    } catch (error) {
      console.error('[BiometricAuthService] Test capabilities error:', error);
      return {
        hardware: false,
        enrolled: false,
        supportedTypes: [],
        securityLevel: 'none',
      };
    }
  }
}

export const biometricAuthService = BiometricAuthService.getInstance();