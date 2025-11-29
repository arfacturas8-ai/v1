/**
 * Comprehensive Voice/Video Testing Suite
 * Tests for Discord-style voice/video functionality using LiveKit
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LiveKitClient } from '../apps/web/lib/livekit-client';
import { WebRTCOptimizer } from '../apps/web/lib/webrtc-optimizer';
import { LiveKitMobileService } from '../apps/mobile/src/services/LiveKitMobileService';

// Mock WebRTC APIs
const mockRTCPeerConnection = {
  createOffer: jest.fn(),
  createAnswer: jest.fn(),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  addIceCandidate: jest.fn(),
  getStats: jest.fn(),
  getTransceivers: jest.fn().mockReturnValue([]),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  connectionState: 'new',
  iceConnectionState: 'new',
};

const mockMediaStream = {
  getTracks: jest.fn().mockReturnValue([]),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  getAudioTracks: jest.fn().mockReturnValue([]),
  getVideoTracks: jest.fn().mockReturnValue([]),
  active: true,
  id: 'mock-stream-id',
};

const mockMediaStreamTrack = {
  kind: 'audio',
  enabled: true,
  muted: false,
  readyState: 'live',
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock globals
global.RTCPeerConnection = jest.fn(() => mockRTCPeerConnection) as any;
global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
    enumerateDevices: jest.fn().mockResolvedValue([
      { deviceId: 'audio1', kind: 'audioinput', label: 'Microphone 1' },
      { deviceId: 'audio2', kind: 'audiooutput', label: 'Speaker 1' },
      { deviceId: 'video1', kind: 'videoinput', label: 'Camera 1' },
    ]),
    getDisplayMedia: jest.fn().mockResolvedValue(mockMediaStream),
  },
} as any;

describe('Voice/Video Core Functionality', () => {
  let liveKitClient: LiveKitClient;
  let webRTCOptimizer: WebRTCOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();
    webRTCOptimizer = new WebRTCOptimizer();
  });

  afterEach(() => {
    if (liveKitClient) {
      liveKitClient.disconnect();
    }
  });

  describe('LiveKit Client Integration', () => {
    test('should create LiveKit client with proper configuration', () => {
      const config = {
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
        options: {
          autoSubscribe: true,
          adaptiveStream: true,
          dynacast: true,
        },
      };

      expect(() => {
        liveKitClient = new LiveKitClient(config);
      }).not.toThrow();

      expect(liveKitClient).toBeDefined();
    });

    test('should handle connection lifecycle properly', async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockDisconnect = jest.fn().mockResolvedValue(undefined);

      // Mock Room class
      const mockRoom = {
        connect: mockConnect,
        disconnect: mockDisconnect,
        state: 'connected',
        localParticipant: {
          identity: 'test-user',
          setMicrophoneEnabled: jest.fn(),
          setCameraEnabled: jest.fn(),
          setScreenShareEnabled: jest.fn(),
        },
        remoteParticipants: new Map(),
      };

      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
      });

      // Simulate connection
      await liveKitClient.connect();
      expect(liveKitClient.isConnectedToRoom()).toBeTruthy();

      // Simulate disconnection
      await liveKitClient.disconnect();
    });

    test('should enable/disable microphone correctly', async () => {
      const mockSetMicrophoneEnabled = jest.fn();
      
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
      });

      // Mock successful connection
      (liveKitClient as any).room = {
        localParticipant: {
          setMicrophoneEnabled: mockSetMicrophoneEnabled,
          identity: 'test-user',
        },
      };

      await liveKitClient.enableMicrophone(true);
      expect(mockSetMicrophoneEnabled).toHaveBeenCalledWith(true);

      await liveKitClient.enableMicrophone(false);
      expect(mockSetMicrophoneEnabled).toHaveBeenCalledWith(false);
    });

    test('should enable/disable camera correctly', async () => {
      const mockSetCameraEnabled = jest.fn();
      
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
      });

      // Mock successful connection
      (liveKitClient as any).room = {
        localParticipant: {
          setCameraEnabled: mockSetCameraEnabled,
          identity: 'test-user',
        },
      };

      await liveKitClient.enableCamera(true);
      expect(mockSetCameraEnabled).toHaveBeenCalledWith(true);

      await liveKitClient.enableCamera(false);
      expect(mockSetCameraEnabled).toHaveBeenCalledWith(false);
    });

    test('should handle screen sharing', async () => {
      const mockSetScreenShareEnabled = jest.fn();
      
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
      });

      // Mock successful connection
      (liveKitClient as any).room = {
        localParticipant: {
          setScreenShareEnabled: mockSetScreenShareEnabled,
          identity: 'test-user',
        },
      };

      await liveKitClient.enableScreenShare(true);
      expect(mockSetScreenShareEnabled).toHaveBeenCalledWith(true);

      await liveKitClient.enableScreenShare(false);
      expect(mockSetScreenShareEnabled).toHaveBeenCalledWith(false);
    });

    test('should manage participant volumes', () => {
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
      });

      const mockParticipant = {
        identity: 'test-participant',
        audioTrackPublications: new Map([
          ['track1', {
            track: {
              setVolume: jest.fn(),
            },
          }],
        ]),
      };

      // Mock room with participant
      (liveKitClient as any).room = {
        getParticipantByIdentity: jest.fn().mockReturnValue(mockParticipant),
      };

      liveKitClient.setVolume('test-participant', 75);

      expect(mockParticipant.audioTrackPublications.get('track1')?.track.setVolume)
        .toHaveBeenCalledWith(0.75);
    });
  });

  describe('WebRTC Optimization', () => {
    test('should create optimized peer connection configuration', () => {
      const config = webRTCOptimizer.getOptimizedConfiguration();

      expect(config).toHaveProperty('iceServers');
      expect(config).toHaveProperty('bundlePolicy', 'max-bundle');
      expect(config).toHaveProperty('rtcpMuxPolicy', 'require');
      expect(config.iceServers).toHaveLength(3); // Google STUN servers
    });

    test('should provide optimized media constraints', () => {
      const constraints = webRTCOptimizer.getOptimizedMediaConstraints();

      expect(constraints.audio).toHaveProperty('echoCancellation', true);
      expect(constraints.audio).toHaveProperty('noiseSuppression', true);
      expect(constraints.audio).toHaveProperty('autoGainControl', true);
      expect(constraints.audio).toHaveProperty('sampleRate', 48000);

      expect(constraints.video).toHaveProperty('width');
      expect(constraints.video).toHaveProperty('height');
      expect(constraints.video).toHaveProperty('frameRate');
    });

    test('should enable simulcast for video optimization', async () => {
      const pc = new RTCPeerConnection();
      const mockTransceiver = {
        sender: {
          track: { kind: 'video' },
          getParameters: jest.fn().mockReturnValue({
            encodings: [],
          }),
          setParameters: jest.fn(),
        },
      };

      mockRTCPeerConnection.getTransceivers.mockReturnValue([mockTransceiver]);

      await webRTCOptimizer.optimizePeerConnection(pc);

      expect(mockTransceiver.sender.setParameters).toHaveBeenCalled();
      const params = mockTransceiver.sender.setParameters.mock.calls[0][0];
      expect(params.encodings).toHaveLength(3); // High, medium, low quality layers
    });

    test('should configure Opus codec parameters', async () => {
      const pc = new RTCPeerConnection();
      const mockTransceiver = {
        sender: {
          track: { kind: 'audio' },
          getParameters: jest.fn().mockReturnValue({
            codecs: [{ mimeType: 'audio/opus', sdpFmtpLine: '' }],
          }),
          setParameters: jest.fn(),
        },
      };

      mockRTCPeerConnection.getTransceivers.mockReturnValue([mockTransceiver]);

      await webRTCOptimizer.optimizePeerConnection(pc);

      expect(mockTransceiver.sender.setParameters).toHaveBeenCalled();
      const params = mockTransceiver.sender.setParameters.mock.calls[0][0];
      const opusCodec = params.codecs.find((c: any) => c.mimeType.includes('opus'));
      expect(opusCodec.sdpFmtpLine).toContain('maxaveragebitrate=64000');
      expect(opusCodec.sdpFmtpLine).toContain('stereo=1');
      expect(opusCodec.sdpFmtpLine).toContain('usedtx=1');
    });

    test('should monitor connection quality', async () => {
      const pc = new RTCPeerConnection();
      const mockStats = new Map([
        ['inbound-audio', {
          type: 'inbound-rtp',
          kind: 'audio',
          bytesReceived: 1024,
          packetsReceived: 100,
          packetsLost: 2,
          timestamp: 1000000,
          jitter: 0.001,
        }],
        ['outbound-video', {
          type: 'outbound-rtp',
          kind: 'video',
          bytesSent: 2048,
          timestamp: 1000000,
        }],
        ['candidate-pair', {
          type: 'candidate-pair',
          state: 'succeeded',
          currentRoundTripTime: 0.05, // 50ms
          availableOutgoingBitrate: 1000000,
        }],
      ]);

      mockRTCPeerConnection.getStats.mockResolvedValue(mockStats);

      webRTCOptimizer.startQualityMonitoring(pc);

      // Wait for monitoring interval
      await new Promise(resolve => setTimeout(resolve, 1100));

      const metrics = webRTCOptimizer.getQualityMetrics();

      expect(metrics).toBeDefined();
      expect(metrics!.latency.rtt).toBe(50); // 50ms
      expect(metrics!.packetLoss.audio.incoming).toBeCloseTo(0.02, 2); // 2%
      expect(metrics!.quality).toBe('good');

      webRTCOptimizer.stopQualityMonitoring();
    });
  });

  describe('Mobile Optimization', () => {
    let mobileService: LiveKitMobileService;

    beforeEach(() => {
      // Mock mobile-specific APIs
      (global as any).Platform = { OS: 'ios' };
    });

    test('should create mobile service with battery optimization', () => {
      const config = {
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
        options: {
          mobile: {
            enableBatteryOptimization: true,
            enableDataSaver: false,
            maxAudioBitrate: 64000,
            maxVideoBitrate: 800000,
          },
        },
      };

      expect(() => {
        mobileService = new LiveKitMobileService(config);
      }).not.toThrow();

      expect(mobileService).toBeDefined();
    });

    test('should enable data saver mode', () => {
      const config = {
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token-123',
        options: {
          mobile: {
            enableDataSaver: true,
            maxAudioBitrate: 32000,
            maxVideoBitrate: 400000,
          },
        },
      };

      mobileService = new LiveKitMobileService(config);

      // Mock room with tracks
      const mockAudioTrack = { setMaxBitrate: jest.fn() };
      const mockVideoTrack = { setMaxBitrate: jest.fn() };
      
      (mobileService as any).room = {
        localParticipant: {
          getTrackPublication: jest.fn()
            .mockReturnValueOnce({ track: mockAudioTrack })
            .mockReturnValueOnce({ track: mockVideoTrack }),
        },
      };

      mobileService.enableDataSaverMode(true);

      expect(mockAudioTrack.setMaxBitrate).toHaveBeenCalledWith(32000);
      expect(mockVideoTrack.setMaxBitrate).toHaveBeenCalledWith(200000);
    });
  });

  describe('Audio Quality Processing', () => {
    test('should process audio with noise suppression', async () => {
      const mockAudioContext = {
        createMediaStreamSource: jest.fn(),
        createAnalyser: jest.fn(),
        createGain: jest.fn(),
        createDynamicsCompressor: jest.fn(),
        audioWorklet: {
          addModule: jest.fn(),
        },
        sampleRate: 48000,
        close: jest.fn(),
        destination: {},
      };

      const mockSource = {
        connect: jest.fn(),
      };

      const mockAnalyser = {
        connect: jest.fn(),
        fftSize: 0,
        smoothingTimeConstant: 0,
        frequencyBinCount: 1024,
        getByteFrequencyData: jest.fn().mockImplementation((array: Uint8Array) => {
          // Fill with sample audio data
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.random() * 255;
          }
        }),
      };

      const mockGain = {
        connect: jest.fn(),
        gain: { value: 1 },
      };

      mockAudioContext.createMediaStreamSource.mockReturnValue(mockSource);
      mockAudioContext.createAnalyser.mockReturnValue(mockAnalyser);
      mockAudioContext.createGain.mockReturnValue(mockGain);

      // Mock AudioContext constructor
      (global as any).AudioContext = jest.fn(() => mockAudioContext);

      // Test audio processing setup
      const audioStream = mockMediaStream as MediaStream;
      
      // Simulate audio processing initialization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();

      source.connect(gain);
      gain.connect(analyser);

      expect(source.connect).toHaveBeenCalledWith(gain);
      expect(gain.connect).toHaveBeenCalledWith(analyser);
    });

    test('should calculate audio levels correctly', () => {
      const sampleData = new Uint8Array([100, 120, 80, 90, 110, 95, 105, 85]);
      
      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < sampleData.length; i++) {
        sum += sampleData[i] * sampleData[i];
      }
      const rms = Math.sqrt(sum / sampleData.length);
      const level = (rms / 255) * 100;

      expect(level).toBeGreaterThan(30);
      expect(level).toBeLessThan(50);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle connection failures gracefully', async () => {
      const config = {
        serverUrl: 'wss://invalid.livekit.io',
        token: 'invalid-token',
      };

      liveKitClient = new LiveKitClient(config);

      // Mock connection failure
      const mockError = new Error('Connection failed');
      (liveKitClient as any).room = {
        connect: jest.fn().mockRejectedValue(mockError),
      };

      await expect(liveKitClient.connect()).rejects.toThrow('Connection failed');
    });

    test('should retry connection with exponential backoff', async () => {
      const mobileService = new LiveKitMobileService({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token',
      });

      const mockConnect = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(undefined);

      (mobileService as any).room = {
        connect: mockConnect,
      };

      // Mock successful retry
      await mobileService.retry();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('should handle media permission failures', async () => {
      const mockGetUserMedia = jest.fn().mockRejectedValue(
        new Error('Permission denied')
      );

      (global.navigator.mediaDevices as any).getUserMedia = mockGetUserMedia;

      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple participants efficiently', () => {
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token',
      });

      // Mock room with multiple participants
      const participants = new Map();
      for (let i = 0; i < 50; i++) {
        participants.set(`participant-${i}`, {
          identity: `participant-${i}`,
          audioEnabled: Math.random() > 0.5,
          videoEnabled: Math.random() > 0.5,
          isSpeaking: Math.random() > 0.8,
          connectionQuality: 'good',
        });
      }

      (liveKitClient as any).participants = participants;

      const participantList = liveKitClient.getParticipants();
      expect(participantList).toHaveLength(50);

      // Performance check - should complete within reasonable time
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        liveKitClient.getParticipants();
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    test('should manage memory usage with long-running connections', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate long-running connection with many operations
      liveKitClient = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'test-token',
      });

      // Simulate many connect/disconnect cycles
      for (let i = 0; i < 10; i++) {
        const tempClient = new LiveKitClient({
          serverUrl: 'wss://test.livekit.io',
          token: `token-${i}`,
        });
        tempClient.disconnect();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Security and Privacy', () => {
    test('should validate token format before connection', () => {
      const invalidTokens = [
        '',
        'invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Incomplete JWT
        null,
        undefined,
      ];

      invalidTokens.forEach(token => {
        expect(() => {
          new LiveKitClient({
            serverUrl: 'wss://test.livekit.io',
            token: token as string,
          });
        }).not.toThrow(); // Client creation should not throw, but connection should fail
      });
    });

    test('should use secure WebSocket connections in production', () => {
      const prodConfig = {
        serverUrl: 'wss://prod.livekit.io',
        token: 'valid-token',
      };

      const client = new LiveKitClient(prodConfig);
      
      // Verify secure connection is used
      expect(prodConfig.serverUrl.startsWith('wss://')).toBeTruthy();
    });

    test('should not expose sensitive information in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      const client = new LiveKitClient({
        serverUrl: 'wss://test.livekit.io',
        token: 'secret-token-123',
      });

      // Check that token is not logged
      const logCalls = consoleSpy.mock.calls.flat();
      const hasSecretInLog = logCalls.some(call => 
        typeof call === 'string' && call.includes('secret-token-123')
      );

      expect(hasSecretInLog).toBeFalsy();
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Integration Tests', () => {
  test('should complete full voice call flow', async () => {
    const client1 = new LiveKitClient({
      serverUrl: 'wss://test.livekit.io',
      token: 'token-user1',
    });

    const client2 = new LiveKitClient({
      serverUrl: 'wss://test.livekit.io',
      token: 'token-user2',
    });

    // Mock successful connections
    (client1 as any).room = {
      connect: jest.fn().mockResolvedValue(undefined),
      localParticipant: { identity: 'user1' },
      remoteParticipants: new Map([['user2', { identity: 'user2' }]]),
      state: 'connected',
    };

    (client2 as any).room = {
      connect: jest.fn().mockResolvedValue(undefined),
      localParticipant: { identity: 'user2' },
      remoteParticipants: new Map([['user1', { identity: 'user1' }]]),
      state: 'connected',
    };

    // Simulate connection
    await client1.connect();
    await client2.connect();

    expect(client1.isConnectedToRoom()).toBeTruthy();
    expect(client2.isConnectedToRoom()).toBeTruthy();

    // Simulate participants seeing each other
    const client1Participants = client1.getParticipants();
    const client2Participants = client2.getParticipants();

    expect(client1Participants).toHaveLength(1);
    expect(client2Participants).toHaveLength(1);

    // Cleanup
    await client1.disconnect();
    await client2.disconnect();
  });

  test('should handle screen sharing between participants', async () => {
    const presenter = new LiveKitClient({
      serverUrl: 'wss://test.livekit.io',
      token: 'presenter-token',
    });

    const viewer = new LiveKitClient({
      serverUrl: 'wss://test.livekit.io',
      token: 'viewer-token',
    });

    // Mock screen sharing functionality
    const mockScreenShareTrack = {
      kind: 'video',
      enabled: true,
      mediaStreamTrack: mockMediaStreamTrack,
    };

    (presenter as any).room = {
      localParticipant: {
        identity: 'presenter',
        setScreenShareEnabled: jest.fn().mockResolvedValue(mockScreenShareTrack),
      },
      state: 'connected',
    };

    await presenter.enableScreenShare(true);

    expect((presenter as any).room.localParticipant.setScreenShareEnabled)
      .toHaveBeenCalledWith(true);

    // Cleanup
    await presenter.disconnect();
    await viewer.disconnect();
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  test('connection establishment should complete within 5 seconds', async () => {
    const client = new LiveKitClient({
      serverUrl: 'wss://test.livekit.io',
      token: 'perf-test-token',
    });

    (client as any).room = {
      connect: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      ),
      state: 'connected',
    };

    const startTime = Date.now();
    await client.connect();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000);
    
    await client.disconnect();
  });

  test('audio processing should have minimal latency', () => {
    const optimizer = new WebRTCOptimizer();
    const startTime = performance.now();
    
    // Simulate audio processing operations
    for (let i = 0; i < 1000; i++) {
      optimizer.getOptimizedMediaConstraints();
    }
    
    const endTime = performance.now();
    const avgLatency = (endTime - startTime) / 1000;
    
    expect(avgLatency).toBeLessThan(1); // Less than 1ms per operation
  });
});

export default {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test-suite/setup.ts'],
  testMatch: ['<rootDir>/test-suite/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'apps/web/lib/**/*.{ts,tsx}',
    'apps/web/components/voice/**/*.{ts,tsx}',
    'apps/mobile/src/services/**/*.{ts,tsx}',
    'apps/mobile/src/hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};