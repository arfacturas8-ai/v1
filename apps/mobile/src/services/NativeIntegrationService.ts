/**
 * NATIVE INTEGRATION SERVICE
 * Platform-specific native module integrations and device features
 */

import { Platform, Vibration, Alert, Share, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import * as KeepAwake from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { CrashDetector } from '../utils/CrashDetector';

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  deviceType: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  deviceName: string;
  isDevice: boolean;
  hasNotch: boolean;
  screenDimensions: {
    width: number;
    height: number;
    scale: number;
  };
  capabilities: {
    camera: boolean;
    microphone: boolean;
    biometrics: boolean;
    haptics: boolean;
    location: boolean;
    contacts: boolean;
  };
}

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

class NativeIntegrationService {
  private static instance: NativeIntegrationService;
  private deviceInfo: DeviceInfo | null = null;
  private permissions: Map<string, boolean> = new Map();

  static getInstance(): NativeIntegrationService {
    if (!NativeIntegrationService.instance) {
      NativeIntegrationService.instance = new NativeIntegrationService();
    }
    return NativeIntegrationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Gather device information
      await this.gatherDeviceInfo();
      
      // Check initial permissions
      await this.checkInitialPermissions();
      
      console.log('[NativeIntegrationService] Initialized successfully');
    } catch (error) {
      console.error('[NativeIntegrationService] Initialization error:', error);
      
      await CrashDetector.reportError(
        error instanceof Error ? error : new Error(String(error)),
        { action: 'initializeNativeIntegration' },
        'medium'
      );
    }
  }

  private async gatherDeviceInfo(): Promise<void> {
    try {
      const { width, height, scale } = require('react-native').Dimensions.get('screen');
      
      this.deviceInfo = {
        platform: Platform.OS as 'ios' | 'android',
        deviceType: Device.deviceType?.toString() || 'unknown',
        osVersion: Platform.Version.toString(),
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        buildNumber: Application.nativeBuildVersion || '1',
        deviceName: Device.deviceName || 'Unknown Device',
        isDevice: Device.isDevice,
        hasNotch: this.detectNotch(),
        screenDimensions: { width, height, scale },
        capabilities: {
          camera: await this.checkCameraCapability(),
          microphone: await this.checkMicrophoneCapability(),
          biometrics: await this.checkBiometricCapability(),
          haptics: await this.checkHapticsCapability(),
          location: await this.checkLocationCapability(),
          contacts: await this.checkContactsCapability(),
        },
      };

      console.log('[NativeIntegrationService] Device info gathered:', this.deviceInfo);
    } catch (error) {
      console.error('[NativeIntegrationService] Gather device info error:', error);
    }
  }

  private detectNotch(): boolean {
    // Simple notch detection based on screen dimensions
    const { width, height } = require('react-native').Dimensions.get('screen');
    
    if (Platform.OS === 'ios') {
      // iPhone X and later models typically have these dimensions
      const iphoneXDimensions = [
        { width: 375, height: 812 }, // iPhone X, Xs, 11 Pro
        { width: 414, height: 896 }, // iPhone Xr, 11, Xs Max, 11 Pro Max
        { width: 390, height: 844 }, // iPhone 12, 12 Pro
        { width: 428, height: 926 }, // iPhone 12 Pro Max
      ];
      
      return iphoneXDimensions.some(dim => 
        (dim.width === width && dim.height === height) ||
        (dim.width === height && dim.height === width)
      );
    }
    
    return false; // Android notch detection is more complex
  }

  private async checkInitialPermissions(): Promise<void> {
    try {
      // Check camera permission
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      this.permissions.set('camera', cameraStatus.granted);

      // Check media library permission
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      this.permissions.set('mediaLibrary', mediaStatus.granted);

      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();
      this.permissions.set('location', locationStatus.granted);

      console.log('[NativeIntegrationService] Initial permissions checked');
    } catch (error) {
      console.error('[NativeIntegrationService] Check initial permissions error:', error);
    }
  }

  // Capability checks

  private async checkCameraCapability(): Promise<boolean> {
    try {
      return await Camera.isAvailableAsync();
    } catch {
      return false;
    }
  }

  private async checkMicrophoneCapability(): Promise<boolean> {
    // Microphone capability is typically available if camera is available
    return this.checkCameraCapability();
  }

  private async checkBiometricCapability(): Promise<boolean> {
    try {
      const { LocalAuthentication } = await import('expo-local-authentication');
      return await LocalAuthentication.hasHardwareAsync();
    } catch {
      return false;
    }
  }

  private async checkHapticsCapability(): Promise<boolean> {
    return Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 26);
  }

  private async checkLocationCapability(): Promise<boolean> {
    try {
      const { LocationAccuracy } = await import('expo-location');
      return true;
    } catch {
      return false;
    }
  }

  private async checkContactsCapability(): Promise<boolean> {
    try {
      return Platform.OS === 'ios' || Platform.OS === 'android';
    } catch {
      return false;
    }
  }

  // Permission management

  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      this.permissions.set('camera', granted);
      return granted;
    } catch (error) {
      console.error('[NativeIntegrationService] Request camera permission error:', error);
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestMicrophonePermissionsAsync();
      const granted = status === 'granted';
      this.permissions.set('microphone', granted);
      return granted;
    } catch (error) {
      console.error('[NativeIntegrationService] Request microphone permission error:', error);
      return false;
    }
  }

  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';
      this.permissions.set('mediaLibrary', granted);
      return granted;
    } catch (error) {
      console.error('[NativeIntegrationService] Request media library permission error:', error);
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      this.permissions.set('location', granted);
      return granted;
    } catch (error) {
      console.error('[NativeIntegrationService] Request location permission error:', error);
      return false;
    }
  }

  async requestContactsPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      this.permissions.set('contacts', granted);
      return granted;
    } catch (error) {
      console.error('[NativeIntegrationService] Request contacts permission error:', error);
      return false;
    }
  }

  // Media capture and selection

  async capturePhoto(): Promise<MediaAsset | null> {
    try {
      if (!this.permissions.get('camera')) {
        const granted = await this.requestCameraPermission();
        if (!granted) {
          throw new Error('Camera permission not granted');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: 'image/jpeg',
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
        };
      }

      return null;
    } catch (error) {
      console.error('[NativeIntegrationService] Capture photo error:', error);
      return null;
    }
  }

  async captureVideo(): Promise<MediaAsset | null> {
    try {
      if (!this.permissions.get('camera')) {
        const granted = await this.requestCameraPermission();
        if (!granted) {
          throw new Error('Camera permission not granted');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'video',
          mimeType: 'video/mp4',
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          fileName: asset.fileName,
        };
      }

      return null;
    } catch (error) {
      console.error('[NativeIntegrationService] Capture video error:', error);
      return null;
    }
  }

  async selectImageFromLibrary(): Promise<MediaAsset | null> {
    try {
      if (!this.permissions.get('mediaLibrary')) {
        const granted = await this.requestMediaLibraryPermission();
        if (!granted) {
          throw new Error('Media library permission not granted');
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName,
        };
      }

      return null;
    } catch (error) {
      console.error('[NativeIntegrationService] Select image from library error:', error);
      return null;
    }
  }

  async selectDocument(): Promise<MediaAsset | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'document',
          mimeType: asset.mimeType,
          fileSize: asset.size,
          fileName: asset.name,
        };
      }

      return null;
    } catch (error) {
      console.error('[NativeIntegrationService] Select document error:', error);
      return null;
    }
  }

  // Location services

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      if (!this.permissions.get('location')) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('[NativeIntegrationService] Get current location error:', error);
      return null;
    }
  }

  async watchLocation(callback: (location: LocationData) => void): Promise<() => void> {
    try {
      if (!this.permissions.get('location')) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: location.timestamp,
          });
        }
      );

      return () => subscription.remove();
    } catch (error) {
      console.error('[NativeIntegrationService] Watch location error:', error);
      return () => {};
    }
  }

  // Haptic feedback

  async playHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): Promise<void> {
    try {
      if (!this.deviceInfo?.capabilities.haptics) {
        return;
      }

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.error('[NativeIntegrationService] Play haptic feedback error:', error);
    }
  }

  async vibrate(pattern?: number[]): Promise<void> {
    try {
      if (pattern) {
        Vibration.vibrate(pattern);
      } else {
        Vibration.vibrate();
      }
    } catch (error) {
      console.error('[NativeIntegrationService] Vibrate error:', error);
    }
  }

  // Device utilities

  async getDeviceInfo(): Promise<DeviceInfo | null> {
    return this.deviceInfo;
  }

  async getBatteryLevel(): Promise<number> {
    try {
      return await Battery.getBatteryLevelAsync();
    } catch (error) {
      console.error('[NativeIntegrationService] Get battery level error:', error);
      return -1;
    }
  }

  async getNetworkState(): Promise<any> {
    try {
      return await Network.getNetworkStateAsync();
    } catch (error) {
      console.error('[NativeIntegrationService] Get network state error:', error);
      return null;
    }
  }

  async keepScreenAwake(): Promise<void> {
    try {
      KeepAwake.activateKeepAwake();
    } catch (error) {
      console.error('[NativeIntegrationService] Keep screen awake error:', error);
    }
  }

  async allowScreenSleep(): Promise<void> {
    try {
      KeepAwake.deactivateKeepAwake();
    } catch (error) {
      console.error('[NativeIntegrationService] Allow screen sleep error:', error);
    }
  }

  async lockOrientation(orientation: 'portrait' | 'landscape'): Promise<void> {
    try {
      if (orientation === 'portrait') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    } catch (error) {
      console.error('[NativeIntegrationService] Lock orientation error:', error);
    }
  }

  async unlockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.unlockAsync();
    } catch (error) {
      console.error('[NativeIntegrationService] Unlock orientation error:', error);
    }
  }

  // System interactions

  async shareContent(content: { message?: string; url?: string; title?: string }): Promise<boolean> {
    try {
      const result = await Share.share({
        message: content.message || '',
        url: content.url,
        title: content.title,
      });

      return result.action === Share.sharedAction;
    } catch (error) {
      console.error('[NativeIntegrationService] Share content error:', error);
      return false;
    }
  }

  async openURL(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NativeIntegrationService] Open URL error:', error);
      return false;
    }
  }

  async openWebBrowser(url: string): Promise<void> {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#007AFF',
      });
    } catch (error) {
      console.error('[NativeIntegrationService] Open web browser error:', error);
    }
  }

  async showAlert(title: string, message: string, buttons?: any[]): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        buttons || [{ text: 'OK', onPress: resolve }],
        { cancelable: false }
      );
    });
  }

  // File system operations

  async saveFile(uri: string, filename: string): Promise<string | null> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });
      return fileUri;
    } catch (error) {
      console.error('[NativeIntegrationService] Save file error:', error);
      return null;
    }
  }

  async deleteFile(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri);
      return true;
    } catch (error) {
      console.error('[NativeIntegrationService] Delete file error:', error);
      return false;
    }
  }

  async getFileInfo(uri: string): Promise<any> {
    try {
      return await FileSystem.getInfoAsync(uri);
    } catch (error) {
      console.error('[NativeIntegrationService] Get file info error:', error);
      return null;
    }
  }

  // Permission utilities

  hasPermission(permission: string): boolean {
    return this.permissions.get(permission) || false;
  }

  getAllPermissions(): Record<string, boolean> {
    return Object.fromEntries(this.permissions);
  }

  async checkAllPermissions(): Promise<void> {
    await this.checkInitialPermissions();
  }

  // Platform-specific features

  async getAndroidSystemInfo(): Promise<any> {
    if (Platform.OS !== 'android') return null;
    
    try {
      return {
        buildNumber: Application.nativeBuildVersion,
        version: Application.nativeApplicationVersion,
        androidId: Application.androidId,
      };
    } catch (error) {
      console.error('[NativeIntegrationService] Get Android system info error:', error);
      return null;
    }
  }

  async getIOSSystemInfo(): Promise<any> {
    if (Platform.OS !== 'ios') return null;
    
    try {
      return {
        buildNumber: Application.nativeBuildVersion,
        version: Application.nativeApplicationVersion,
        bundleId: Application.applicationId,
      };
    } catch (error) {
      console.error('[NativeIntegrationService] Get iOS system info error:', error);
      return null;
    }
  }

  cleanup(): void {
    this.permissions.clear();
    this.allowScreenSleep();
    this.unlockOrientation();
    console.log('[NativeIntegrationService] Cleaned up');
  }
}

export const nativeIntegrationService = NativeIntegrationService.getInstance();