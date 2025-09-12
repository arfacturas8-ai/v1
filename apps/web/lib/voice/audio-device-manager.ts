/**
 * Advanced Audio Device Manager for WebRTC Voice Communications
 * Handles device enumeration, switching, hot-plug events, and device monitoring
 */

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
  isDefault: boolean;
  isConnected: boolean;
  capabilities?: MediaTrackCapabilities;
  lastUsed?: number;
  preferenceScore?: number;
}

export interface DevicePreferences {
  preferredInputDevice?: string;
  preferredOutputDevice?: string;
  autoSwitchToNewDevices: boolean;
  rememberedDevices: Map<string, AudioDeviceInfo>;
  fallbackBehavior: 'default' | 'last_known' | 'highest_quality';
}

export interface DeviceQualityMetrics {
  sampleRates: number[];
  channelCounts: number[];
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  latency: { min: number; max: number };
}

export interface DeviceManagerEvents {
  deviceAdded: (device: AudioDeviceInfo) => void;
  deviceRemoved: (device: AudioDeviceInfo) => void;
  deviceChanged: (oldDevice: AudioDeviceInfo | null, newDevice: AudioDeviceInfo) => void;
  defaultDeviceChanged: (kind: 'audioinput' | 'audiooutput', device: AudioDeviceInfo) => void;
  deviceError: (device: AudioDeviceInfo, error: Error) => void;
  permissionChanged: (granted: boolean) => void;
}

export class AudioDeviceManager {
  private devices: Map<string, AudioDeviceInfo> = new Map();
  private preferences: DevicePreferences;
  private currentInputDevice: AudioDeviceInfo | null = null;
  private currentOutputDevice: AudioDeviceInfo | null = null;
  private eventHandlers: Map<keyof DeviceManagerEvents, Function[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private permissionGranted = false;
  private isDestroyed = false;

  constructor() {
    this.preferences = {
      autoSwitchToNewDevices: false,
      rememberedDevices: new Map(),
      fallbackBehavior: 'default'
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check for media device permissions
      await this.checkPermissions();
      
      // Initial device enumeration
      await this.enumerateDevices();
      
      // Set up device monitoring
      this.startDeviceMonitoring();
      
      console.log('Audio Device Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Audio Device Manager:', error);
    }
  }

  private async checkPermissions(): Promise<void> {
    try {
      // Request microphone permission to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      this.permissionGranted = true;
      
      // Stop the stream immediately - we only needed it for permissions
      stream.getTracks().forEach(track => track.stop());
      
      this.emit('permissionChanged', true);
      console.log('Microphone permission granted');
      
    } catch (error) {
      this.permissionGranted = false;
      this.emit('permissionChanged', false);
      console.warn('Microphone permission denied or unavailable');
    }
  }

  private async enumerateDevices(): Promise<void> {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = mediaDevices.filter(device => 
        device.kind === 'audioinput' || device.kind === 'audiooutput'
      );

      // Clear current device list
      const previousDevices = new Map(this.devices);
      this.devices.clear();

      // Process each device
      for (const mediaDevice of audioDevices) {
        const deviceInfo: AudioDeviceInfo = {
          deviceId: mediaDevice.deviceId,
          label: mediaDevice.label || `${mediaDevice.kind} (${mediaDevice.deviceId.slice(0, 8)})`,
          kind: mediaDevice.kind as 'audioinput' | 'audiooutput',
          groupId: mediaDevice.groupId,
          isDefault: mediaDevice.deviceId === 'default',
          isConnected: true
        };

        // Get device capabilities if possible
        try {
          if (mediaDevice.kind === 'audioinput') {
            const capabilities = await this.getDeviceCapabilities(mediaDevice.deviceId);
            deviceInfo.capabilities = capabilities;
          }
        } catch (error) {
          console.warn(`Could not get capabilities for device ${mediaDevice.deviceId}:`, error);
        }

        this.devices.set(mediaDevice.deviceId, deviceInfo);

        // Check if this is a new device
        if (!previousDevices.has(mediaDevice.deviceId)) {
          console.log(`New audio device detected: ${deviceInfo.label}`);
          this.emit('deviceAdded', deviceInfo);
          
          // Auto-switch logic
          if (this.preferences.autoSwitchToNewDevices) {
            await this.handleAutoSwitch(deviceInfo);
          }
        }
      }

      // Check for removed devices
      for (const [deviceId, device] of previousDevices) {
        if (!this.devices.has(deviceId)) {
          console.log(`Audio device removed: ${device.label}`);
          device.isConnected = false;
          this.emit('deviceRemoved', device);
          
          // Handle device removal if it was currently in use
          await this.handleDeviceRemoval(device);
        }
      }

      console.log(`Enumerated ${this.devices.size} audio devices`);
      
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  }

  private async getDeviceCapabilities(deviceId: string): Promise<MediaTrackCapabilities | undefined> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      const track = stream.getAudioTracks()[0];
      const capabilities = track.getCapabilities();
      
      // Stop the stream
      track.stop();
      
      return capabilities;
    } catch (error) {
      console.warn(`Could not get capabilities for device ${deviceId}:`, error);
      return undefined;
    }
  }

  private async handleAutoSwitch(newDevice: AudioDeviceInfo): Promise<void> {
    try {
      if (newDevice.kind === 'audioinput' && !this.currentInputDevice) {
        await this.setInputDevice(newDevice.deviceId);
      } else if (newDevice.kind === 'audiooutput' && !this.currentOutputDevice) {
        await this.setOutputDevice(newDevice.deviceId);
      }
    } catch (error) {
      console.error('Failed to auto-switch to new device:', error);
    }
  }

  private async handleDeviceRemoval(removedDevice: AudioDeviceInfo): Promise<void> {
    try {
      if (removedDevice.deviceId === this.currentInputDevice?.deviceId) {
        console.log('Current input device was removed, finding alternative');
        await this.selectFallbackInputDevice();
      }
      
      if (removedDevice.deviceId === this.currentOutputDevice?.deviceId) {
        console.log('Current output device was removed, finding alternative');
        await this.selectFallbackOutputDevice();
      }
    } catch (error) {
      console.error('Failed to handle device removal:', error);
    }
  }

  private async selectFallbackInputDevice(): Promise<void> {
    const inputDevices = this.getDevicesByKind('audioinput');
    
    let fallbackDevice: AudioDeviceInfo | null = null;
    
    switch (this.preferences.fallbackBehavior) {
      case 'default':
        fallbackDevice = inputDevices.find(device => device.isDefault) || null;
        break;
        
      case 'last_known':
        // Find the most recently used device that's still available
        const rememberedInputs = Array.from(this.preferences.rememberedDevices.values())
          .filter(device => device.kind === 'audioinput')
          .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        
        fallbackDevice = inputDevices.find(device => 
          rememberedInputs.some(remembered => remembered.deviceId === device.deviceId)
        ) || null;
        break;
        
      case 'highest_quality':
        fallbackDevice = this.selectHighestQualityDevice(inputDevices);
        break;
    }
    
    if (!fallbackDevice && inputDevices.length > 0) {
      fallbackDevice = inputDevices[0]; // Last resort
    }
    
    if (fallbackDevice) {
      await this.setInputDevice(fallbackDevice.deviceId);
    }
  }

  private async selectFallbackOutputDevice(): Promise<void> {
    const outputDevices = this.getDevicesByKind('audiooutput');
    
    let fallbackDevice = outputDevices.find(device => device.isDefault);
    if (!fallbackDevice && outputDevices.length > 0) {
      fallbackDevice = outputDevices[0];
    }
    
    if (fallbackDevice) {
      await this.setOutputDevice(fallbackDevice.deviceId);
    }
  }

  private selectHighestQualityDevice(devices: AudioDeviceInfo[]): AudioDeviceInfo | null {
    if (devices.length === 0) return null;
    
    // Score devices based on capabilities
    const scoredDevices = devices.map(device => {
      let score = 0;
      
      if (device.capabilities) {
        const caps = device.capabilities;
        
        // Higher sample rates get more points
        if (caps.sampleRate) {
          const maxSampleRate = Math.max(...(caps.sampleRate as any).map((sr: any) => sr.max || sr));
          score += maxSampleRate / 1000; // Scale down
        }
        
        // Multiple channels get points
        if (caps.channelCount) {
          const maxChannels = Math.max(...(caps.channelCount as any).map((cc: any) => cc.max || cc));
          score += maxChannels * 10;
        }
        
        // Audio processing features get points
        if (caps.echoCancellation) score += 20;
        if (caps.noiseSuppression) score += 20;
        if (caps.autoGainControl) score += 15;
      }
      
      return { device, score };
    });
    
    scoredDevices.sort((a, b) => b.score - a.score);
    return scoredDevices[0]?.device || null;
  }

  public async setInputDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device || device.kind !== 'audioinput') {
      throw new Error(`Input device ${deviceId} not found or invalid`);
    }

    try {
      // Test the device by creating a stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      // Stop test stream
      stream.getTracks().forEach(track => track.stop());
      
      const oldDevice = this.currentInputDevice;
      this.currentInputDevice = device;
      device.lastUsed = Date.now();
      
      // Remember this device choice
      this.preferences.rememberedDevices.set(deviceId, device);
      
      console.log(`Input device changed to: ${device.label}`);
      this.emit('deviceChanged', oldDevice, device);
      
    } catch (error) {
      console.error(`Failed to set input device ${deviceId}:`, error);
      this.emit('deviceError', device, error as Error);
      throw error;
    }
  }

  public async setOutputDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device || device.kind !== 'audiooutput') {
      throw new Error(`Output device ${deviceId} not found or invalid`);
    }

    try {
      // Test if browser supports setting output device
      if ('setSinkId' in HTMLAudioElement.prototype) {
        const audio = new Audio();
        await (audio as any).setSinkId(deviceId);
      }
      
      const oldDevice = this.currentOutputDevice;
      this.currentOutputDevice = device;
      device.lastUsed = Date.now();
      
      // Remember this device choice
      this.preferences.rememberedDevices.set(deviceId, device);
      
      console.log(`Output device changed to: ${device.label}`);
      this.emit('deviceChanged', oldDevice, device);
      
    } catch (error) {
      console.error(`Failed to set output device ${deviceId}:`, error);
      this.emit('deviceError', device, error as Error);
      throw error;
    }
  }

  private startDeviceMonitoring(): void {
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange.bind(this));
    
    // Periodic device check (as backup)
    this.monitoringInterval = setInterval(() => {
      this.enumerateDevices();
    }, 5000);
    
    console.log('Device monitoring started');
  }

  private handleDeviceChange(): void {
    console.log('Device change event detected');
    // Delay enumeration slightly to allow device to fully connect/disconnect
    setTimeout(() => {
      this.enumerateDevices();
    }, 100);
  }

  public getDevicesByKind(kind: 'audioinput' | 'audiooutput'): AudioDeviceInfo[] {
    return Array.from(this.devices.values()).filter(device => device.kind === kind);
  }

  public getAllDevices(): AudioDeviceInfo[] {
    return Array.from(this.devices.values());
  }

  public getCurrentInputDevice(): AudioDeviceInfo | null {
    return this.currentInputDevice;
  }

  public getCurrentOutputDevice(): AudioDeviceInfo | null {
    return this.currentOutputDevice;
  }

  public getDeviceById(deviceId: string): AudioDeviceInfo | null {
    return this.devices.get(deviceId) || null;
  }

  public async testDevice(deviceId: string, duration: number = 3000): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device || device.kind !== 'audioinput') {
      throw new Error('Device not found or not an input device');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      console.log(`Testing device ${device.label} for ${duration}ms`);
      
      // Keep stream alive for test duration
      await new Promise(resolve => setTimeout(resolve, duration));
      
      // Stop stream
      stream.getTracks().forEach(track => track.stop());
      
      console.log(`Device test completed successfully: ${device.label}`);
      return true;
      
    } catch (error) {
      console.error(`Device test failed: ${device.label}`, error);
      this.emit('deviceError', device, error as Error);
      return false;
    }
  }

  public setPreferences(newPreferences: Partial<DevicePreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    console.log('Device preferences updated:', this.preferences);
  }

  public getPreferences(): DevicePreferences {
    return { ...this.preferences };
  }

  public async refreshDevices(): Promise<void> {
    console.log('Manually refreshing device list');
    await this.enumerateDevices();
  }

  // Event handling
  public on<K extends keyof DeviceManagerEvents>(event: K, handler: DeviceManagerEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof DeviceManagerEvents>(event: K, handler: DeviceManagerEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof DeviceManagerEvents>(event: K, ...args: Parameters<DeviceManagerEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in device manager event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Remove event listeners
    navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange.bind(this));
    
    // Clear data
    this.devices.clear();
    this.preferences.rememberedDevices.clear();
    this.eventHandlers.clear();
    
    this.currentInputDevice = null;
    this.currentOutputDevice = null;
    
    console.log('Audio Device Manager destroyed');
  }
}