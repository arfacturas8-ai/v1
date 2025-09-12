import { VoiceError, VoiceErrorEvent } from './crash-safe-livekit';

export interface MediaPermissionStatus {
  microphone: PermissionState | null;
  camera: PermissionState | null;
  notifications: PermissionState | null;
}

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export interface MediaErrorContext {
  userAgent: string;
  platform: string;
  deviceCount: {
    audioInput: number;
    videoInput: number;
    audioOutput: number;
  };
  permissions: MediaPermissionStatus;
  isSecureContext: boolean;
  protocolVersion: string;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'fallback' | 'user_action' | 'ignore';
  message: string;
  actionText?: string;
  callback?: () => Promise<void>;
  delay?: number;
}

export class MediaErrorHandler {
  private permissionCache = new Map<string, PermissionState>();
  private deviceCache: MediaDeviceInfo[] = [];
  private lastDeviceCheck = 0;
  private readonly DEVICE_CACHE_TTL = 5000; // 5 seconds
  
  constructor() {
    this.setupDeviceChangeListeners();
  }

  private setupDeviceChangeListeners(): void {
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        this.clearDeviceCache();
        this.checkDeviceAvailability();
      });
    }
  }

  private clearDeviceCache(): void {
    this.deviceCache = [];
    this.lastDeviceCheck = 0;
  }

  public async checkMediaPermissions(): Promise<MediaPermissionStatus> {
    const permissions: MediaPermissionStatus = {
      microphone: null,
      camera: null,
      notifications: null
    };

    if (!navigator.permissions) {
      return permissions;
    }

    try {
      // Check microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      permissions.microphone = micPermission.state;
      this.permissionCache.set('microphone', micPermission.state);

      // Listen for permission changes
      micPermission.addEventListener('change', () => {
        this.permissionCache.set('microphone', micPermission.state);
      });
    } catch (error) {
      console.warn('Could not check microphone permission:', error);
    }

    try {
      // Check camera permission
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      permissions.camera = cameraPermission.state;
      this.permissionCache.set('camera', cameraPermission.state);

      cameraPermission.addEventListener('change', () => {
        this.permissionCache.set('camera', cameraPermission.state);
      });
    } catch (error) {
      console.warn('Could not check camera permission:', error);
    }

    try {
      // Check notifications permission (useful for error notifications)
      const notificationPermission = await navigator.permissions.query({ name: 'notifications' as PermissionName });
      permissions.notifications = notificationPermission.state;
      this.permissionCache.set('notifications', notificationPermission.state);
    } catch (error) {
      console.warn('Could not check notifications permission:', error);
    }

    return permissions;
  }

  public async checkDeviceAvailability(): Promise<MediaDeviceInfo[]> {
    const now = Date.now();
    
    // Return cached devices if still valid
    if (this.deviceCache.length > 0 && now - this.lastDeviceCheck < this.DEVICE_CACHE_TTL) {
      return this.deviceCache;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Media devices API not supported');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      this.deviceCache = devices.map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        kind: device.kind,
        groupId: device.groupId
      }));
      
      this.lastDeviceCheck = now;
      return this.deviceCache;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  public async getErrorContext(): Promise<MediaErrorContext> {
    const permissions = await this.checkMediaPermissions();
    const devices = await this.checkDeviceAvailability();
    
    const deviceCount = {
      audioInput: devices.filter(d => d.kind === 'audioinput').length,
      videoInput: devices.filter(d => d.kind === 'videoinput').length,
      audioOutput: devices.filter(d => d.kind === 'audiooutput').length
    };

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceCount,
      permissions,
      isSecureContext: window.isSecureContext,
      protocolVersion: window.location.protocol
    };
  }

  public async analyzeError(error: VoiceErrorEvent): Promise<ErrorRecoveryAction> {
    const context = await this.getErrorContext();
    
    switch (error.error) {
      case VoiceError.MICROPHONE_PERMISSION_DENIED:
        return this.handleMicrophonePermissionError(context);
        
      case VoiceError.CAMERA_PERMISSION_DENIED:
        return this.handleCameraPermissionError(context);
        
      case VoiceError.SCREEN_SHARE_PERMISSION_DENIED:
        return this.handleScreenSharePermissionError(context);
        
      case VoiceError.MICROPHONE_NOT_FOUND:
        return this.handleMicrophoneNotFoundError(context);
        
      case VoiceError.CAMERA_NOT_FOUND:
        return this.handleCameraNotFoundError(context);
        
      case VoiceError.CONNECTION_FAILED:
        return this.handleConnectionError(error, context);
        
      case VoiceError.NETWORK_ERROR:
        return this.handleNetworkError(error, context);
        
      case VoiceError.SERVER_UNREACHABLE:
        return this.handleServerUnreachableError(context);
        
      case VoiceError.AUTHENTICATION_FAILED:
        return this.handleAuthenticationError(context);
        
      default:
        return this.handleGenericError(error, context);
    }
  }

  private handleMicrophonePermissionError(context: MediaErrorContext): ErrorRecoveryAction {
    if (!context.isSecureContext) {
      return {
        type: 'user_action',
        message: 'Microphone access requires a secure connection (HTTPS). Please ensure you are using HTTPS.',
        actionText: 'Switch to HTTPS'
      };
    }

    if (context.deviceCount.audioInput === 0) {
      return {
        type: 'user_action',
        message: 'No microphone devices found. Please connect a microphone and refresh the page.',
        actionText: 'Refresh Page',
        callback: () => Promise.resolve(window.location.reload())
      };
    }

    return {
      type: 'user_action',
      message: 'Microphone access was denied. Please click the microphone icon in your browser\'s address bar and allow microphone access.',
      actionText: 'Open Settings',
      callback: async () => {
        // Try to trigger permission dialog again
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          // Expected if permission is still denied
        }
      }
    };
  }

  private handleCameraPermissionError(context: MediaErrorContext): ErrorRecoveryAction {
    if (!context.isSecureContext) {
      return {
        type: 'user_action',
        message: 'Camera access requires a secure connection (HTTPS). Please ensure you are using HTTPS.',
        actionText: 'Switch to HTTPS'
      };
    }

    if (context.deviceCount.videoInput === 0) {
      return {
        type: 'user_action',
        message: 'No camera devices found. Please connect a camera and refresh the page.',
        actionText: 'Refresh Page',
        callback: () => Promise.resolve(window.location.reload())
      };
    }

    return {
      type: 'user_action',
      message: 'Camera access was denied. Please click the camera icon in your browser\'s address bar and allow camera access.',
      actionText: 'Open Settings',
      callback: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          // Expected if permission is still denied
        }
      }
    };
  }

  private handleScreenSharePermissionError(context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'retry',
      message: 'Screen sharing permission was denied. You can try again or continue with audio and video only.',
      actionText: 'Try Again',
      delay: 1000
    };
  }

  private handleMicrophoneNotFoundError(context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'user_action',
      message: 'No microphone found. Please connect a microphone device and refresh the page.',
      actionText: 'Check Devices',
      callback: async () => {
        // Trigger device enumeration to refresh the list
        await this.checkDeviceAvailability();
        window.location.reload();
      }
    };
  }

  private handleCameraNotFoundError(context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'user_action',
      message: 'No camera found. Please connect a camera device and refresh the page.',
      actionText: 'Check Devices',
      callback: async () => {
        await this.checkDeviceAvailability();
        window.location.reload();
      }
    };
  }

  private handleConnectionError(error: VoiceErrorEvent, context: MediaErrorContext): ErrorRecoveryAction {
    if (error.retryCount < error.maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, error.retryCount), 10000);
      return {
        type: 'retry',
        message: `Connection failed. Retrying in ${Math.ceil(delay / 1000)} seconds... (${error.retryCount + 1}/${error.maxRetries})`,
        delay
      };
    }

    return {
      type: 'user_action',
      message: 'Could not establish voice connection after multiple attempts. Please check your internet connection and try again.',
      actionText: 'Retry Connection'
    };
  }

  private handleNetworkError(error: VoiceErrorEvent, context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'retry',
      message: 'Network error detected. Checking connection and retrying...',
      delay: 2000,
      callback: async () => {
        // Check network connectivity
        try {
          await fetch('/api/health', { method: 'HEAD' });
        } catch (e) {
          throw new Error('Network connectivity issues detected');
        }
      }
    };
  }

  private handleServerUnreachableError(context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'fallback',
      message: 'Voice server is temporarily unavailable. You can still use text chat.',
      actionText: 'Try Again Later',
      delay: 30000 // Try again in 30 seconds
    };
  }

  private handleAuthenticationError(context: MediaErrorContext): ErrorRecoveryAction {
    return {
      type: 'user_action',
      message: 'Voice authentication failed. Please refresh the page and try again.',
      actionText: 'Refresh Page',
      callback: () => Promise.resolve(window.location.reload())
    };
  }

  private handleGenericError(error: VoiceErrorEvent, context: MediaErrorContext): ErrorRecoveryAction {
    console.error('Unhandled voice error:', error, context);
    
    return {
      type: 'retry',
      message: 'An unexpected error occurred. Retrying...',
      delay: 3000
    };
  }

  public async testMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Test if we actually get audio data
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      await audioContext.close();
      
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  public async testCameraAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      // Test if we get a video track with frames
      const videoTrack = stream.getVideoTracks()[0];
      const hasVideo = videoTrack && videoTrack.readyState === 'live';
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
      
      return hasVideo;
    } catch (error) {
      console.error('Camera test failed:', error);
      return false;
    }
  }

  public async testScreenShareAccess(): Promise<boolean> {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: true,
        audio: false
      });
      
      // Clean up immediately
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      
      return true;
    } catch (error) {
      console.error('Screen share test failed:', error);
      return false;
    }
  }

  public formatErrorForUser(error: VoiceErrorEvent): string {
    const baseMessage = this.getBaseErrorMessage(error.error);
    
    if (error.recoverable && error.retryCount < error.maxRetries) {
      return `${baseMessage} Retrying... (${error.retryCount}/${error.maxRetries})`;
    }
    
    return baseMessage;
  }

  private getBaseErrorMessage(error: VoiceError): string {
    switch (error) {
      case VoiceError.MICROPHONE_PERMISSION_DENIED:
        return 'Please allow microphone access to use voice chat';
      case VoiceError.CAMERA_PERMISSION_DENIED:
        return 'Please allow camera access to share video';
      case VoiceError.SCREEN_SHARE_PERMISSION_DENIED:
        return 'Screen sharing permission was denied';
      case VoiceError.MICROPHONE_NOT_FOUND:
        return 'No microphone device found';
      case VoiceError.CAMERA_NOT_FOUND:
        return 'No camera device found';
      case VoiceError.CONNECTION_FAILED:
        return 'Failed to connect to voice channel';
      case VoiceError.NETWORK_ERROR:
        return 'Network connection error';
      case VoiceError.SERVER_UNREACHABLE:
        return 'Voice server is temporarily unavailable';
      case VoiceError.AUTHENTICATION_FAILED:
        return 'Voice authentication failed';
      default:
        return 'An unexpected error occurred';
    }
  }

  public destroy(): void {
    this.permissionCache.clear();
    this.deviceCache = [];
  }
}