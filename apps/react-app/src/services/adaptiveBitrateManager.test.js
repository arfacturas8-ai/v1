/**
 * Tests for adaptiveBitrateManager
 */
import AdaptiveBitrateManager from './adaptiveBitrateManager';

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  connection: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: jest.fn()
  }
};

global.navigator = mockNavigator;

// Mock window
global.window = {
  addEventListener: jest.fn()
};

describe('AdaptiveBitrateManager', () => {
  let manager;
  let mockWebRTCService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset navigator mocks
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      writable: true,
      configurable: true
    });

    mockNavigator.connection = {
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: jest.fn()
    };

    mockWebRTCService = {
      on: jest.fn(),
      off: jest.fn(),
      setVoiceEffectParameter: jest.fn().mockResolvedValue(true),
      qualitySettings: {
        audio: {},
        video: {}
      }
    };

    manager = new AdaptiveBitrateManager();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default settings', () => {
      expect(manager).toBeDefined();
      expect(manager.currentProfile).toBe('auto');
      expect(manager.deviceType).toBeDefined();
    });

    it('detects desktop device', () => {
      expect(manager.deviceType).toBe('desktop');
    });

    it('detects mobile device', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      const mobileManager = new AdaptiveBitrateManager();
      expect(mobileManager.deviceType).toBe('mobile');
      mobileManager.destroy();
    });

    it('detects tablet device', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      const tabletManager = new AdaptiveBitrateManager();
      expect(tabletManager.deviceType).toBe('tablet');
      tabletManager.destroy();
    });

    it('starts quality monitoring', () => {
      expect(manager.adaptationTimer).toBeDefined();
    });

    it('has quality profiles defined', () => {
      expect(manager.qualityProfiles).toBeDefined();
      expect(manager.qualityProfiles['ultra-low']).toBeDefined();
      expect(manager.qualityProfiles['low']).toBeDefined();
      expect(manager.qualityProfiles['medium']).toBeDefined();
      expect(manager.qualityProfiles['high']).toBeDefined();
      expect(manager.qualityProfiles['ultra-high']).toBeDefined();
    });
  });

  describe('Device Detection', () => {
    it('detects Android mobile', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36',
        writable: true,
        configurable: true
      });
      manager.detectDevice();
      expect(manager.deviceType).toBe('mobile');
    });

    it('detects Android tablet', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; Tablet) AppleWebKit/537.36',
        writable: true,
        configurable: true
      });
      manager.detectDevice();
      expect(manager.deviceType).toBe('tablet');
    });

    it('detects iPhone', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      manager.detectDevice();
      expect(manager.deviceType).toBe('mobile');
    });

    it('detects iPad', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
        writable: true,
        configurable: true
      });
      manager.detectDevice();
      expect(manager.deviceType).toBe('tablet');
    });
  });

  describe('WebRTC Integration', () => {
    it('initializes with WebRTC service', () => {
      manager.initialize(mockWebRTCService);

      expect(manager.webrtcService).toBe(mockWebRTCService);
      expect(mockWebRTCService.on).toHaveBeenCalledWith('connection_quality_updated', expect.any(Function));
      expect(mockWebRTCService.on).toHaveBeenCalledWith('bandwidth_stats_updated', expect.any(Function));
      expect(mockWebRTCService.on).toHaveBeenCalledWith('network_type_changed', expect.any(Function));
    });

    it('handles quality updates', () => {
      manager.initialize(mockWebRTCService);

      const qualityData = {
        packetLoss: 5,
        jitter: 30,
        rtt: 150
      };

      manager.handleQualityUpdate(qualityData);

      expect(manager.metrics.packetLoss).toBe(5);
      expect(manager.metrics.jitter).toBe(30);
      expect(manager.metrics.rtt).toBe(150);
    });

    it('handles bandwidth updates', () => {
      const bandwidthData = {
        'peer-1': { bytesSent: 10000, bytesReceived: 20000 },
        'peer-2': { bytesSent: 5000, bytesReceived: 15000 }
      };

      manager.handleBandwidthUpdate(bandwidthData);

      expect(manager.metrics.bandwidth.upload).toBeGreaterThan(0);
      expect(manager.metrics.bandwidth.download).toBeGreaterThan(0);
    });
  });

  describe('Network Monitoring', () => {
    it('updates network info', () => {
      const connection = {
        type: '4g',
        effectiveType: '4g',
        downlink: 15,
        rtt: 40,
        saveData: false
      };

      manager.updateNetworkInfo(connection);

      expect(manager.networkMonitor.connectionType).toBe('4g');
      expect(manager.networkMonitor.effectiveType).toBe('4g');
      expect(manager.networkMonitor.downlink).toBe(15);
      expect(manager.networkMonitor.rtt).toBe(40);
      expect(manager.networkMonitor.saveData).toBe(false);
    });

    it('handles save data mode', () => {
      const connection = {
        type: 'wifi',
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: true
      };

      manager.updateNetworkInfo(connection);
      expect(manager.networkMonitor.saveData).toBe(true);
    });
  });

  describe('Quality Score Calculation', () => {
    it('calculates perfect quality score', () => {
      manager.metrics.packetLoss = 0;
      manager.metrics.jitter = 10;
      manager.metrics.rtt = 50;
      manager.networkMonitor.effectiveType = '4g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBe(100);
    });

    it('penalizes packet loss', () => {
      manager.metrics.packetLoss = 5;
      manager.metrics.jitter = 10;
      manager.metrics.rtt = 50;
      manager.networkMonitor.effectiveType = '4g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBeLessThan(100);
    });

    it('penalizes high jitter', () => {
      manager.metrics.packetLoss = 0;
      manager.metrics.jitter = 100;
      manager.metrics.rtt = 50;
      manager.networkMonitor.effectiveType = '4g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBeLessThan(100);
    });

    it('penalizes high RTT', () => {
      manager.metrics.packetLoss = 0;
      manager.metrics.jitter = 10;
      manager.metrics.rtt = 500;
      manager.networkMonitor.effectiveType = '4g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBeLessThan(100);
    });

    it('caps score for 2g connections', () => {
      manager.metrics.packetLoss = 0;
      manager.metrics.jitter = 10;
      manager.metrics.rtt = 50;
      manager.networkMonitor.effectiveType = '2g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBeLessThanOrEqual(50);
    });

    it('caps score for 3g connections', () => {
      manager.metrics.packetLoss = 0;
      manager.metrics.jitter = 10;
      manager.metrics.rtt = 50;
      manager.networkMonitor.effectiveType = '3g';

      manager.calculateQualityScore();

      expect(manager.metrics.qualityScore).toBeLessThanOrEqual(70);
    });
  });

  describe('Profile Determination', () => {
    it('selects ultra-low for 2g', () => {
      manager.networkMonitor.effectiveType = '2g';
      manager.metrics.qualityScore = 100;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('ultra-low');
    });

    it('selects low for 3g with good quality', () => {
      manager.networkMonitor.effectiveType = '3g';
      manager.metrics.qualityScore = 70;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('low');
    });

    it('selects medium for 4g on mobile', () => {
      manager.deviceType = 'mobile';
      manager.networkMonitor.effectiveType = '4g';
      manager.metrics.qualityScore = 85;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('medium');
    });

    it('selects high for 4g on desktop', () => {
      manager.deviceType = 'desktop';
      manager.networkMonitor.effectiveType = '4g';
      manager.metrics.qualityScore = 85;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('high');
    });

    it('respects data saver mode', () => {
      manager.networkMonitor.saveData = true;
      manager.networkMonitor.effectiveType = '4g';
      manager.metrics.qualityScore = 100;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('low');
    });

    it('uses ultra-low in emergency mode', () => {
      manager.emergencyMode = true;

      const profile = manager.determineOptimalProfile();
      expect(profile).toBe('ultra-low');
    });
  });

  describe('Profile Adaptation', () => {
    it('adapts to new profile', async () => {
      manager.initialize(mockWebRTCService);

      const result = await manager.adaptToProfile('medium', 'manual');

      expect(result).toBe(true);
      expect(manager.currentProfile).toBe('medium');
    });

    it('records adaptation history', async () => {
      manager.initialize(mockWebRTCService);

      await manager.adaptToProfile('low', 'poor_quality');

      expect(manager.metrics.adaptationHistory.length).toBeGreaterThan(0);
      expect(manager.metrics.adaptationHistory[0].toProfile).toBe('low');
      expect(manager.metrics.adaptationHistory[0].reason).toBe('poor_quality');
    });

    it('limits adaptation history to 50 entries', async () => {
      manager.initialize(mockWebRTCService);

      for (let i = 0; i < 60; i++) {
        await manager.adaptToProfile(i % 2 === 0 ? 'low' : 'medium', 'test');
      }

      expect(manager.metrics.adaptationHistory.length).toBe(50);
    });

    it('applies audio settings', async () => {
      manager.initialize(mockWebRTCService);

      const audioSettings = {
        bitrate: 64000,
        sampleRate: 48000,
        codec: 'opus'
      };

      await manager.applyAudioSettings(audioSettings);

      expect(mockWebRTCService.qualitySettings.audio.bitrate).toBe(64000);
      expect(mockWebRTCService.setVoiceEffectParameter).toHaveBeenCalled();
    });

    it('applies video settings', async () => {
      manager.initialize(mockWebRTCService);

      const videoSettings = {
        width: 1280,
        height: 720,
        frameRate: 30,
        maxBitrate: 2000000,
        codec: 'vp9'
      };

      await manager.applyVideoSettings(videoSettings);

      expect(mockWebRTCService.qualitySettings.video.resolution).toBe('1280x720');
      expect(mockWebRTCService.qualitySettings.video.frameRate).toBe(30);
    });

    it('prevents concurrent adaptations', async () => {
      manager.initialize(mockWebRTCService);

      const promise1 = manager.adaptToProfile('low', 'test');
      const promise2 = manager.adaptToProfile('medium', 'test');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result2).toBe(false); // Second adaptation should fail
    });

    it('returns false for unknown profile', async () => {
      const result = await manager.adaptToProfile('invalid-profile', 'test');
      expect(result).toBe(false);
    });
  });

  describe('Device Optimizations', () => {
    it('applies mobile optimizations', () => {
      manager.deviceType = 'mobile';
      const profile = manager.qualityProfiles['high'];

      const optimized = manager.applyDeviceOptimizations(profile);

      expect(optimized.video.frameRate).toBeLessThanOrEqual(20);
      expect(optimized.audio.dtx).toBe(true);
    });

    it('preserves desktop quality', () => {
      manager.deviceType = 'desktop';
      const profile = manager.qualityProfiles['high'];

      const optimized = manager.applyDeviceOptimizations(profile);

      expect(optimized.video.frameRate).toBe(30);
    });

    it('reduces complexity for battery optimization', () => {
      manager.deviceType = 'mobile';
      const profile = manager.qualityProfiles['high'];

      const optimized = manager.applyDeviceOptimizations(profile);

      expect(optimized.audio.complexity).toBeLessThanOrEqual(5);
    });
  });

  describe('Emergency Mode', () => {
    it('enables emergency mode', () => {
      manager.initialize(mockWebRTCService);
      manager.enableEmergencyMode();

      expect(manager.emergencyMode).toBe(true);
    });

    it('triggers adaptation when emergency mode enabled', async () => {
      manager.initialize(mockWebRTCService);

      jest.spyOn(manager, 'adaptToProfile');
      manager.enableEmergencyMode();

      expect(manager.adaptToProfile).toHaveBeenCalledWith('ultra-low', 'emergency');
    });

    it('disables emergency mode', () => {
      manager.emergencyMode = true;
      manager.disableEmergencyMode();

      expect(manager.emergencyMode).toBe(false);
    });

    it('triggers emergency mode on very poor quality', () => {
      manager.initialize(mockWebRTCService);
      manager.metrics.qualityScore = 25;

      manager.handleQualityUpdate({
        packetLoss: 10,
        jitter: 200,
        rtt: 1000
      });

      expect(manager.emergencyMode).toBe(true);
    });
  });

  describe('Manual Control', () => {
    it('sets profile manually', async () => {
      manager.initialize(mockWebRTCService);

      const result = await manager.setProfile('high');

      expect(result).toBe(true);
      expect(manager.currentProfile).toBe('high');
    });
  });

  describe('Metrics and Analytics', () => {
    it('returns current metrics', () => {
      const metrics = manager.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.currentProfile).toBe('auto');
      expect(metrics.deviceType).toBeDefined();
      expect(metrics.networkInfo).toBeDefined();
      expect(metrics.connectionQuality).toBeDefined();
    });

    it('returns recommendations for poor quality', () => {
      manager.metrics.qualityScore = 40;

      const recommendations = manager.getRecommendations();

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBe('quality');
      expect(recommendations[0].severity).toBe('high');
    });

    it('recommends disabling data saver', () => {
      manager.networkMonitor.saveData = true;

      const recommendations = manager.getRecommendations();

      const dataSaverRec = recommendations.find(r => r.type === 'data');
      expect(dataSaverRec).toBeDefined();
    });

    it('warns about battery drain on mobile', () => {
      manager.deviceType = 'mobile';
      manager.currentProfile = 'high';

      const recommendations = manager.getRecommendations();

      const batteryRec = recommendations.find(r => r.type === 'battery');
      expect(batteryRec).toBeDefined();
    });
  });

  describe('Bandwidth Estimation', () => {
    it('estimates upload bandwidth', () => {
      const bandwidthData = {
        'peer-1': { bytesSent: 10000, packetsSent: 100 },
        'peer-2': { bytesSent: 5000, packetsSent: 50 }
      };

      const uploadBandwidth = manager.estimateUploadBandwidth(bandwidthData);

      expect(uploadBandwidth).toBeGreaterThan(0);
    });

    it('estimates download bandwidth', () => {
      const bandwidthData = {
        'peer-1': { bytesReceived: 20000, packetsReceived: 200 },
        'peer-2': { bytesReceived: 15000, packetsReceived: 150 }
      };

      const downloadBandwidth = manager.estimateDownloadBandwidth(bandwidthData);

      expect(downloadBandwidth).toBeGreaterThan(0);
    });
  });

  describe('Adaptation Triggers', () => {
    it('triggers adaptation with debounce', () => {
      jest.spyOn(manager, 'analyzeAndAdapt');

      manager.triggerAdaptation('network_change');
      manager.triggerAdaptation('network_change');
      manager.triggerAdaptation('network_change');

      jest.advanceTimersByTime(1000);

      // Should only call once due to debouncing
      expect(manager.analyzeAndAdapt).toHaveBeenCalledTimes(1);
    });

    it('respects minimum adaptation delay', () => {
      manager.metrics.lastAdaptation = Date.now();

      manager.analyzeAndAdapt();

      // Should not adapt too soon
      expect(manager.isAdapting).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers', () => {
      const timer = manager.adaptationTimer;
      expect(timer).toBeDefined();

      const spy = jest.spyOn(global, 'clearInterval');
      manager.destroy();

      // Timer should have been cleared
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('removes event listeners', () => {
      manager.initialize(mockWebRTCService);
      manager.destroy();

      expect(mockWebRTCService.off).toHaveBeenCalled();
    });
  });
});
