/**
 * PERMISSIONS SERVICE
 * Handles runtime permissions for camera, microphone, location, and other device features
 */

import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';
import { CrashDetector } from '../utils/CrashDetector';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface PermissionsState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
}

class PermissionsService {
  private static instance: PermissionsService;
  private permissionsCache: Partial<PermissionsState> = {};

  static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  // Camera Permissions
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.camera = result;

      if (!result.granted && !result.canAskAgain) {
        this.showPermissionAlert(
          'Camera Permission Required',
          'Camera access is needed for video calls and photo sharing. Please enable it in Settings.',
          'camera'
        );
      }

      return result;
    } catch (error) {
      console.error('[PermissionsService] Camera permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestCameraPermission' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getCameraPermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.camera = result;
      return result;
    } catch (error) {
      console.error('[PermissionsService] Get camera permission status error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Microphone Permissions (part of camera for Expo)
  async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // For Expo, microphone permission is typically bundled with camera
      const { status, canAskAgain } = await Camera.requestMicrophonePermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.microphone = result;

      if (!result.granted && !result.canAskAgain) {
        this.showPermissionAlert(
          'Microphone Permission Required',
          'Microphone access is needed for voice calls and voice messages. Please enable it in Settings.',
          'microphone'
        );
      }

      return result;
    } catch (error) {
      console.error('[PermissionsService] Microphone permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestMicrophonePermission' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getMicrophonePermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.getMicrophonePermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.microphone = result;
      return result;
    } catch (error) {
      console.error('[PermissionsService] Get microphone permission status error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Media Library Permissions
  async requestMediaLibraryPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.mediaLibrary = result;

      if (!result.granted && !result.canAskAgain) {
        this.showPermissionAlert(
          'Photo Library Permission Required',
          'Photo library access is needed to share images and save media. Please enable it in Settings.',
          'photos'
        );
      }

      return result;
    } catch (error) {
      console.error('[PermissionsService] Media library permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestMediaLibraryPermission' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getMediaLibraryPermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.mediaLibrary = result;
      return result;
    } catch (error) {
      console.error('[PermissionsService] Get media library permission status error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Location Permissions
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.location = result;

      if (!result.granted && !result.canAskAgain) {
        this.showPermissionAlert(
          'Location Permission Required',
          'Location access is needed to show nearby communities and location-based features. Please enable it in Settings.',
          'location'
        );
      }

      return result;
    } catch (error) {
      console.error('[PermissionsService] Location permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestLocationPermission' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getLocationPermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.location = result;
      return result;
    } catch (error) {
      console.error('[PermissionsService] Get location permission status error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Notification Permissions
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.notifications = result;

      if (!result.granted && !result.canAskAgain) {
        this.showPermissionAlert(
          'Notification Permission Required',
          'Notification access is needed to receive messages and updates. Please enable it in Settings.',
          'notifications'
        );
      }

      return result;
    } catch (error) {
      console.error('[PermissionsService] Notification permission request error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestNotificationPermission' },
        'medium'
      );

      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  async getNotificationPermissionStatus(): Promise<PermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.permissionsCache.notifications = result;
      return result;
    } catch (error) {
      console.error('[PermissionsService] Get notification permission status error:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Batch Operations
  async requestAllPermissions(): Promise<PermissionsState> {
    try {
      const [camera, microphone, mediaLibrary, location, notifications] = await Promise.all([
        this.requestCameraPermission(),
        this.requestMicrophonePermission(),
        this.requestMediaLibraryPermission(),
        this.requestLocationPermission(),
        this.requestNotificationPermission(),
      ]);

      const permissionsState: PermissionsState = {
        camera,
        microphone,
        mediaLibrary,
        location,
        notifications,
      };

      // Cache the results
      this.permissionsCache = permissionsState;

      return permissionsState;
    } catch (error) {
      console.error('[PermissionsService] Request all permissions error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestAllPermissions' },
        'high'
      );

      // Return denied state for all
      return {
        camera: { granted: false, canAskAgain: false, status: 'denied' },
        microphone: { granted: false, canAskAgain: false, status: 'denied' },
        mediaLibrary: { granted: false, canAskAgain: false, status: 'denied' },
        location: { granted: false, canAskAgain: false, status: 'denied' },
        notifications: { granted: false, canAskAgain: false, status: 'denied' },
      };
    }
  }

  async getAllPermissionStatuses(): Promise<PermissionsState> {
    try {
      const [camera, microphone, mediaLibrary, location, notifications] = await Promise.all([
        this.getCameraPermissionStatus(),
        this.getMicrophonePermissionStatus(),
        this.getMediaLibraryPermissionStatus(),
        this.getLocationPermissionStatus(),
        this.getNotificationPermissionStatus(),
      ]);

      const permissionsState: PermissionsState = {
        camera,
        microphone,
        mediaLibrary,
        location,
        notifications,
      };

      // Cache the results
      this.permissionsCache = permissionsState;

      return permissionsState;
    } catch (error) {
      console.error('[PermissionsService] Get all permission statuses error:', error);
      
      return {
        camera: { granted: false, canAskAgain: false, status: 'denied' },
        microphone: { granted: false, canAskAgain: false, status: 'denied' },
        mediaLibrary: { granted: false, canAskAgain: false, status: 'denied' },
        location: { granted: false, canAskAgain: false, status: 'denied' },
        notifications: { granted: false, canAskAgain: false, status: 'denied' },
      };
    }
  }

  // Essential permissions for app functionality
  async requestEssentialPermissions(): Promise<{ 
    granted: boolean; 
    missingPermissions: string[] 
  }> {
    try {
      const results = await Promise.all([
        this.requestCameraPermission(),
        this.requestMicrophonePermission(),
        this.requestNotificationPermission(),
      ]);

      const [camera, microphone, notifications] = results;
      const missingPermissions: string[] = [];

      if (!camera.granted) missingPermissions.push('Camera');
      if (!microphone.granted) missingPermissions.push('Microphone');
      if (!notifications.granted) missingPermissions.push('Notifications');

      const allGranted = missingPermissions.length === 0;

      if (!allGranted) {
        console.warn('[PermissionsService] Missing essential permissions:', missingPermissions);
      }

      return {
        granted: allGranted,
        missingPermissions,
      };
    } catch (error) {
      console.error('[PermissionsService] Request essential permissions error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'requestEssentialPermissions' },
        'high'
      );

      return {
        granted: false,
        missingPermissions: ['Camera', 'Microphone', 'Notifications'],
      };
    }
  }

  // Helper Methods
  private showPermissionAlert(
    title: string, 
    message: string, 
    permissionType: string
  ): void {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => {
            try {
              Linking.openSettings();
            } catch (error) {
              console.error('[PermissionsService] Open settings error:', error);
              
              // Fallback to URL scheme
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openURL('package:ai.cryb.app');
              }
            }
          },
        },
      ]
    );
  }

  // Cache Management
  getCachedPermissions(): Partial<PermissionsState> {
    return { ...this.permissionsCache };
  }

  clearPermissionsCache(): void {
    this.permissionsCache = {};
  }

  // Utility Methods
  areEssentialPermissionsGranted(): boolean {
    const cached = this.permissionsCache;
    return !!(
      cached.camera?.granted &&
      cached.microphone?.granted &&
      cached.notifications?.granted
    );
  }

  getPermissionStatusText(status: PermissionStatus): string {
    if (status.granted) return 'Granted';
    if (!status.canAskAgain) return 'Denied (Permanently)';
    return 'Not Granted';
  }

  // Permission-specific checks for features
  async canUseCamera(): Promise<boolean> {
    const status = await this.getCameraPermissionStatus();
    return status.granted;
  }

  async canUseMicrophone(): Promise<boolean> {
    const status = await this.getMicrophonePermissionStatus();
    return status.granted;
  }

  async canAccessMediaLibrary(): Promise<boolean> {
    const status = await this.getMediaLibraryPermissionStatus();
    return status.granted;
  }

  async canUseLocation(): Promise<boolean> {
    const status = await this.getLocationPermissionStatus();
    return status.granted;
  }

  async canSendNotifications(): Promise<boolean> {
    const status = await this.getNotificationPermissionStatus();
    return status.granted;
  }

  // Request permission with user-friendly messaging
  async requestPermissionWithRationale(
    permissionType: keyof PermissionsState,
    rationale?: {
      title: string;
      message: string;
      positiveButton?: string;
      negativeButton?: string;
    }
  ): Promise<PermissionStatus> {
    if (rationale) {
      return new Promise((resolve) => {
        Alert.alert(
          rationale.title,
          rationale.message,
          [
            {
              text: rationale.negativeButton || 'Cancel',
              style: 'cancel',
              onPress: () => resolve({
                granted: false,
                canAskAgain: true,
                status: 'denied',
              }),
            },
            {
              text: rationale.positiveButton || 'Allow',
              onPress: async () => {
                const result = await this.requestPermission(permissionType);
                resolve(result);
              },
            },
          ]
        );
      });
    } else {
      return this.requestPermission(permissionType);
    }
  }

  private async requestPermission(permissionType: keyof PermissionsState): Promise<PermissionStatus> {
    switch (permissionType) {
      case 'camera':
        return this.requestCameraPermission();
      case 'microphone':
        return this.requestMicrophonePermission();
      case 'mediaLibrary':
        return this.requestMediaLibraryPermission();
      case 'location':
        return this.requestLocationPermission();
      case 'notifications':
        return this.requestNotificationPermission();
      default:
        throw new Error(`Unknown permission type: ${permissionType}`);
    }
  }
}

export const permissionsService = PermissionsService.getInstance();