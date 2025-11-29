/**
 * Comprehensive Tests for VoiceEffectsProcessor
 * Tests audio effects, Web Audio API integration, and processing pipeline
 */
import VoiceEffectsProcessor from '../../../../services/voiceEffectsProcessor';

describe('VoiceEffectsProcessor', () => {
  let processor;
  let mockAudioContext;
  let mockSourceNode;
  let mockOutputNode;
  let mockGainNode;
  let mockCompressorNode;
  let mockFilterNode;
  let mockDelayNode;
  let mockReverbNode;
  let mockAnalyserNode;
  let mockPannerNode;
  let mockWorkletNode;
  let mockMediaStream;
  let mockAudioWorklet;

  beforeEach(() => {
    // Mock audio nodes
    mockGainNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      gain: {
        value: 1.0,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      }
    };

    mockCompressorNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      threshold: { value: -24, setValueAtTime: jest.fn() },
      ratio: { value: 6, setValueAtTime: jest.fn() },
      attack: { value: 0.003, setValueAtTime: jest.fn() },
      release: { value: 0.1, setValueAtTime: jest.fn() },
      knee: { value: 30 },
      reduction: 0
    };

    mockFilterNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      type: 'peaking',
      frequency: { value: 3000, setValueAtTime: jest.fn() },
      Q: { value: 1.0, setValueAtTime: jest.fn() },
      gain: { value: 3, setValueAtTime: jest.fn() }
    };

    mockDelayNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      delayTime: { value: 0.3, setValueAtTime: jest.fn() }
    };

    mockReverbNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      buffer: null,
      normalize: true
    };

    mockAnalyserNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      getByteTimeDomainData: jest.fn((array) => {
        // Fill with realistic audio data
        for (let i = 0; i < array.length; i++) {
          array[i] = 128 + Math.random() * 10;
        }
      }),
      getFloatFrequencyData: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = -60 + Math.random() * 30;
        }
      }),
      getByteFrequencyData: jest.fn()
    };

    mockPannerNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      setPosition: jest.fn(),
      setOrientation: jest.fn(),
      refDistance: 5,
      maxDistance: 50,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0
    };

    mockWorkletNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      port: {
        postMessage: jest.fn(),
        onmessage: null
      }
    };

    mockSourceNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      mediaStream: {}
    };

    mockOutputNode = {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      stream: new MediaStream()
    };

    mockAudioWorklet = {
      addModule: jest.fn().mockResolvedValue(undefined)
    };

    // Mock AudioContext
    mockAudioContext = {
      state: 'running',
      sampleRate: 48000,
      currentTime: 0,
      baseLatency: 0.005,
      outputLatency: 0.01,
      destination: {},
      audioWorklet: mockAudioWorklet,
      createGain: jest.fn(() => ({ ...mockGainNode })),
      createDynamicsCompressor: jest.fn(() => ({ ...mockCompressorNode })),
      createBiquadFilter: jest.fn(() => ({ ...mockFilterNode })),
      createDelay: jest.fn(() => ({ ...mockDelayNode })),
      createConvolver: jest.fn(() => ({ ...mockReverbNode })),
      createAnalyser: jest.fn(() => ({ ...mockAnalyserNode })),
      createPanner: jest.fn(() => ({ ...mockPannerNode })),
      createMediaStreamSource: jest.fn(() => ({ ...mockSourceNode })),
      createMediaStreamDestination: jest.fn(() => ({ ...mockOutputNode })),
      createChannelMerger: jest.fn((channels) => ({
        connect: jest.fn().mockReturnThis(),
        disconnect: jest.fn()
      })),
      createBuffer: jest.fn((channels, length, sampleRate) => ({
        length,
        sampleRate,
        numberOfChannels: channels,
        getChannelData: jest.fn((channel) => new Float32Array(length))
      })),
      close: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined)
    };

    global.AudioContext = jest.fn(() => mockAudioContext);
    global.webkitAudioContext = jest.fn(() => mockAudioContext);
    global.AudioWorkletNode = jest.fn(() => ({ ...mockWorkletNode }));

    // Mock MediaStream
    mockMediaStream = new MediaStream();

    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));

    processor = new VoiceEffectsProcessor();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Constructor and Initialization', () => {
    it('initializes with default configuration', () => {
      expect(processor.audioContext).toBeNull();
      expect(processor.sourceNode).toBeNull();
      expect(processor.outputNode).toBeNull();
      expect(processor.effectsChain).toEqual([]);
      expect(processor.isProcessing).toBe(false);
    });

    it('initializes effect nodes object', () => {
      expect(processor.nodes).toBeDefined();
      expect(processor.nodes.gainNode).toBeNull();
      expect(processor.nodes.compressorNode).toBeNull();
      expect(processor.nodes.filterNode).toBeNull();
      expect(processor.nodes.delayNode).toBeNull();
      expect(processor.nodes.reverbNode).toBeNull();
    });

    it('initializes all effect configurations', () => {
      expect(processor.effects.robot).toBeDefined();
      expect(processor.effects.echo).toBeDefined();
      expect(processor.effects.reverb).toBeDefined();
      expect(processor.effects.pitchShift).toBeDefined();
      expect(processor.effects.noiseGate).toBeDefined();
      expect(processor.effects.compressor).toBeDefined();
      expect(processor.effects.voiceEnhancement).toBeDefined();
      expect(processor.effects.spatialAudio).toBeDefined();
    });

    it('initializes robot effect with correct defaults', () => {
      expect(processor.effects.robot).toEqual({
        enabled: false,
        carrierFreq: 1000,
        modulatorFreq: 30,
        depth: 0.8
      });
    });

    it('initializes echo effect with correct defaults', () => {
      expect(processor.effects.echo).toEqual({
        enabled: false,
        delay: 0.3,
        feedback: 0.4,
        wetness: 0.3
      });
    });

    it('initializes reverb effect with correct defaults', () => {
      expect(processor.effects.reverb).toEqual({
        enabled: false,
        roomSize: 0.7,
        damping: 0.3,
        wetness: 0.4
      });
    });

    it('initializes pitch shift effect with correct defaults', () => {
      expect(processor.effects.pitchShift).toEqual({
        enabled: false,
        pitch: 0,
        formantCorrection: true
      });
    });

    it('initializes noise gate with correct defaults', () => {
      expect(processor.effects.noiseGate).toEqual({
        enabled: true,
        threshold: -50,
        ratio: 10,
        attack: 0.003,
        release: 0.1
      });
    });

    it('initializes compressor with correct defaults', () => {
      expect(processor.effects.compressor).toEqual({
        enabled: true,
        threshold: -24,
        ratio: 6,
        attack: 0.003,
        release: 0.1,
        makeupGain: 2
      });
    });

    it('initializes voice enhancement with correct defaults', () => {
      expect(processor.effects.voiceEnhancement).toEqual({
        enabled: true,
        clarity: 0.3,
        presence: 0.2,
        warmth: 0.1
      });
    });

    it('initializes spatial audio with correct defaults', () => {
      expect(processor.effects.spatialAudio).toEqual({
        enabled: false,
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: -1 },
        roomSize: 'medium',
        reverbDistance: 10
      });
    });

    it('initializes voice activity detection', () => {
      expect(processor.voiceActivity).toBeDefined();
      expect(processor.voiceActivity.threshold).toBe(-50);
      expect(processor.voiceActivity.isActive).toBe(false);
      expect(processor.voiceActivity.activityHistory).toEqual([]);
      expect(processor.voiceActivity.smoothing).toBe(0.8);
    });

    it('initializes AI features', () => {
      expect(processor.aiFeatures.noiseReduction).toBeDefined();
      expect(processor.aiFeatures.voiceCloning).toBeDefined();
      expect(processor.aiFeatures.languageTranslation).toBeDefined();
    });

    it('initializes analysis object', () => {
      expect(processor.analysis).toBeDefined();
      expect(processor.analysis.fundamentalFreq).toBe(0);
      expect(processor.analysis.formants).toEqual([]);
      expect(processor.analysis.spectralCentroid).toBe(0);
      expect(processor.analysis.spectralRolloff).toBe(0);
      expect(processor.analysis.pitch).toBe(0);
      expect(processor.analysis.confidence).toBe(0);
    });

    it('initializes performance monitoring', () => {
      expect(processor.performance).toBeDefined();
      expect(processor.performance.latency).toBe(0);
      expect(processor.performance.cpuUsage).toBe(0);
      expect(processor.performance.dropouts).toBe(0);
      expect(processor.performance.lastUpdate).toBeLessThanOrEqual(Date.now());
    });

    it('generates audio worklet code', () => {
      const workletCode = processor.generateAudioWorkletCode();
      expect(workletCode).toContain('VoiceEffectsWorklet');
      expect(workletCode).toContain('AudioWorkletProcessor');
      expect(workletCode).toContain('registerProcessor');
    });

    it('creates worklet URL on initialization', () => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(processor.workletUrl).toBe('blob:mock-url');
    });
  });

  describe('Audio Context Initialization', () => {
    it('creates audio context with correct settings', async () => {
      await processor.initialize(mockMediaStream);

      expect(global.AudioContext).toHaveBeenCalledWith({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });
    });

    it('loads audio worklet module', async () => {
      await processor.initialize(mockMediaStream);

      expect(mockAudioWorklet.addModule).toHaveBeenCalledWith('blob:mock-url');
    });

    it('creates media stream source', async () => {
      await processor.initialize(mockMediaStream);

      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream);
    });

    it('creates media stream destination', async () => {
      await processor.initialize(mockMediaStream);

      expect(mockAudioContext.createMediaStreamDestination).toHaveBeenCalled();
    });

    it('sets isProcessing to true', async () => {
      await processor.initialize(mockMediaStream);

      expect(processor.isProcessing).toBe(true);
    });

    it('returns output stream', async () => {
      const outputStream = await processor.initialize(mockMediaStream);

      expect(outputStream).toBeInstanceOf(MediaStream);
    });

    it('handles initialization errors gracefully', async () => {
      mockAudioContext.createMediaStreamSource = jest.fn(() => {
        throw new Error('Failed to create source');
      });

      await expect(processor.initialize(mockMediaStream)).rejects.toThrow('Failed to create source');
    });

    it('handles missing audio worklet support', async () => {
      mockAudioContext.audioWorklet = null;

      await expect(processor.initialize(mockMediaStream)).resolves.toBeDefined();
    });
  });

  describe('Effect Nodes Creation', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('creates gain node', () => {
      expect(processor.nodes.gainNode).toBeDefined();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('creates compressor node', () => {
      expect(processor.nodes.compressorNode).toBeDefined();
      expect(mockAudioContext.createDynamicsCompressor).toHaveBeenCalled();
    });

    it('creates filter node for voice enhancement', () => {
      expect(processor.nodes.filterNode).toBeDefined();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('creates delay node for echo', () => {
      expect(processor.nodes.delayNode).toBeDefined();
      expect(mockAudioContext.createDelay).toHaveBeenCalledWith(1.0);
    });

    it('creates convolver node for reverb', () => {
      expect(processor.nodes.reverbNode).toBeDefined();
      expect(mockAudioContext.createConvolver).toHaveBeenCalled();
    });

    it('creates analyser node', () => {
      expect(processor.nodes.analyserNode).toBeDefined();
      expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    });

    it('creates panner node for spatial audio', () => {
      expect(processor.nodes.spatialNode).toBeDefined();
      expect(mockAudioContext.createPanner).toHaveBeenCalled();
    });

    it('creates audio worklet node', () => {
      expect(processor.nodes.workletNode).toBeDefined();
      expect(global.AudioWorkletNode).toHaveBeenCalledWith(mockAudioContext, 'voice-effects-worklet');
    });

    it('configures gain node with default value', () => {
      expect(processor.nodes.gainNode.gain.value).toBe(1.0);
    });

    it('configures filter node for voice enhancement', () => {
      const filterNode = processor.nodes.filterNode;
      expect(filterNode.type).toBe('peaking');
    });

    it('configures analyser node with correct FFT size', () => {
      expect(processor.nodes.analyserNode.fftSize).toBe(2048);
      expect(processor.nodes.analyserNode.smoothingTimeConstant).toBe(0.8);
    });

    it('handles panner node creation failure', async () => {
      const tempCreatePanner = mockAudioContext.createPanner;
      mockAudioContext.createPanner = null;

      const newProcessor = new VoiceEffectsProcessor();
      await newProcessor.initialize(mockMediaStream);

      expect(newProcessor.nodes.spatialNode).toBeNull();

      mockAudioContext.createPanner = tempCreatePanner;
    });
  });

  describe('Echo Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables echo effect', async () => {
      await processor.setEffect('echo', true);

      expect(processor.effects.echo.enabled).toBe(true);
    });

    it('updates echo delay parameter', async () => {
      await processor.setEffect('echo', true, { delay: 0.5 });

      expect(processor.effects.echo.delay).toBe(0.5);
    });

    it('updates echo feedback parameter', async () => {
      await processor.setEffect('echo', true, { feedback: 0.6 });

      expect(processor.effects.echo.feedback).toBe(0.6);
    });

    it('updates echo wetness parameter', async () => {
      await processor.setEffect('echo', true, { wetness: 0.5 });

      expect(processor.effects.echo.wetness).toBe(0.5);
    });

    it('disables echo effect', async () => {
      await processor.setEffect('echo', true);
      await processor.setEffect('echo', false);

      expect(processor.effects.echo.enabled).toBe(false);
    });

    it('applies delay time changes to delay node', async () => {
      await processor.setEffect('echo', true, { delay: 0.7 });

      expect(processor.nodes.delayNode.delayTime.value).toBe(0.7);
    });
  });

  describe('Reverb Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables reverb effect', async () => {
      await processor.setEffect('reverb', true);

      expect(processor.effects.reverb.enabled).toBe(true);
    });

    it('updates reverb room size parameter', async () => {
      await processor.setEffect('reverb', true, { roomSize: 0.9 });

      expect(processor.effects.reverb.roomSize).toBe(0.9);
    });

    it('updates reverb damping parameter', async () => {
      await processor.setEffect('reverb', true, { damping: 0.5 });

      expect(processor.effects.reverb.damping).toBe(0.5);
    });

    it('updates reverb wetness parameter', async () => {
      await processor.setEffect('reverb', true, { wetness: 0.6 });

      expect(processor.effects.reverb.wetness).toBe(0.6);
    });

    it('disables reverb effect', async () => {
      await processor.setEffect('reverb', true);
      await processor.setEffect('reverb', false);

      expect(processor.effects.reverb.enabled).toBe(false);
    });

    it('loads reverb impulse response', async () => {
      expect(processor.nodes.reverbNode.buffer).toBeDefined();
    });

    it('generates synthetic reverb impulse', () => {
      const buffer = processor.nodes.reverbNode.buffer;
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });
  });

  describe('Pitch Shift Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables pitch shift effect', async () => {
      await processor.setEffect('pitchShift', true);

      expect(processor.effects.pitchShift.enabled).toBe(true);
    });

    it('updates pitch parameter in semitones', async () => {
      await processor.setEffect('pitchShift', true, { pitch: 5 });

      expect(processor.effects.pitchShift.pitch).toBe(5);
    });

    it('handles negative pitch shift', async () => {
      await processor.setEffect('pitchShift', true, { pitch: -7 });

      expect(processor.effects.pitchShift.pitch).toBe(-7);
    });

    it('supports formant correction', async () => {
      await processor.setEffect('pitchShift', true, { formantCorrection: false });

      expect(processor.effects.pitchShift.formantCorrection).toBe(false);
    });

    it('disables pitch shift effect', async () => {
      await processor.setEffect('pitchShift', true);
      await processor.setEffect('pitchShift', false);

      expect(processor.effects.pitchShift.enabled).toBe(false);
    });
  });

  describe('Robot Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables robot effect', async () => {
      await processor.setEffect('robot', true);

      expect(processor.effects.robot.enabled).toBe(true);
    });

    it('updates carrier frequency', async () => {
      await processor.setEffect('robot', true, { carrierFreq: 1500 });

      expect(processor.effects.robot.carrierFreq).toBe(1500);
    });

    it('updates modulator frequency', async () => {
      await processor.setEffect('robot', true, { modulatorFreq: 50 });

      expect(processor.effects.robot.modulatorFreq).toBe(50);
    });

    it('updates effect depth', async () => {
      await processor.setEffect('robot', true, { depth: 0.6 });

      expect(processor.effects.robot.depth).toBe(0.6);
    });

    it('disables robot effect', async () => {
      await processor.setEffect('robot', true);
      await processor.setEffect('robot', false);

      expect(processor.effects.robot.enabled).toBe(false);
    });
  });

  describe('Compressor Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables compressor by default', () => {
      expect(processor.effects.compressor.enabled).toBe(true);
    });

    it('updates compressor threshold', async () => {
      await processor.setEffect('compressor', true, { threshold: -30 });

      expect(processor.effects.compressor.threshold).toBe(-30);
    });

    it('updates compressor ratio', async () => {
      await processor.setEffect('compressor', true, { ratio: 8 });

      expect(processor.effects.compressor.ratio).toBe(8);
    });

    it('updates compressor attack time', async () => {
      await processor.setEffect('compressor', true, { attack: 0.005 });

      expect(processor.effects.compressor.attack).toBe(0.005);
    });

    it('updates compressor release time', async () => {
      await processor.setEffect('compressor', true, { release: 0.2 });

      expect(processor.effects.compressor.release).toBe(0.2);
    });

    it('updates makeup gain', async () => {
      await processor.setEffect('compressor', true, { makeupGain: 3 });

      expect(processor.effects.compressor.makeupGain).toBe(3);
    });

    it('applies compressor settings to node', async () => {
      await processor.setEffect('compressor', true, {
        threshold: -20,
        ratio: 4,
        attack: 0.01,
        release: 0.15
      });

      expect(processor.nodes.compressorNode.threshold.value).toBe(-20);
      expect(processor.nodes.compressorNode.ratio.value).toBe(4);
      expect(processor.nodes.compressorNode.attack.value).toBe(0.01);
      expect(processor.nodes.compressorNode.release.value).toBe(0.15);
    });

    it('disables compressor effect', async () => {
      await processor.setEffect('compressor', false);

      expect(processor.effects.compressor.enabled).toBe(false);
    });
  });

  describe('Noise Gate Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables noise gate by default', () => {
      expect(processor.effects.noiseGate.enabled).toBe(true);
    });

    it('updates noise gate threshold', async () => {
      await processor.setEffect('noiseGate', true, { threshold: -40 });

      expect(processor.effects.noiseGate.threshold).toBe(-40);
    });

    it('updates noise gate ratio', async () => {
      await processor.setEffect('noiseGate', true, { ratio: 20 });

      expect(processor.effects.noiseGate.ratio).toBe(20);
    });

    it('updates noise gate attack', async () => {
      await processor.setEffect('noiseGate', true, { attack: 0.001 });

      expect(processor.effects.noiseGate.attack).toBe(0.001);
    });

    it('updates noise gate release', async () => {
      await processor.setEffect('noiseGate', true, { release: 0.05 });

      expect(processor.effects.noiseGate.release).toBe(0.05);
    });

    it('syncs threshold with voice activity detection', async () => {
      await processor.setEffect('noiseGate', true, { threshold: -45 });

      expect(processor.voiceActivity.threshold).toBe(-45);
    });

    it('disables noise gate effect', async () => {
      await processor.setEffect('noiseGate', false);

      expect(processor.effects.noiseGate.enabled).toBe(false);
    });
  });

  describe('Voice Enhancement Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables voice enhancement by default', () => {
      expect(processor.effects.voiceEnhancement.enabled).toBe(true);
    });

    it('updates clarity parameter', async () => {
      await processor.setEffect('voiceEnhancement', true, { clarity: 0.5 });

      expect(processor.effects.voiceEnhancement.clarity).toBe(0.5);
    });

    it('updates presence parameter', async () => {
      await processor.setEffect('voiceEnhancement', true, { presence: 0.4 });

      expect(processor.effects.voiceEnhancement.presence).toBe(0.4);
    });

    it('updates warmth parameter', async () => {
      await processor.setEffect('voiceEnhancement', true, { warmth: 0.3 });

      expect(processor.effects.voiceEnhancement.warmth).toBe(0.3);
    });

    it('disables voice enhancement', async () => {
      await processor.setEffect('voiceEnhancement', false);

      expect(processor.effects.voiceEnhancement.enabled).toBe(false);
    });
  });

  describe('Spatial Audio Effect', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables spatial audio effect', async () => {
      await processor.setEffect('spatialAudio', true);

      expect(processor.effects.spatialAudio.enabled).toBe(true);
    });

    it('updates spatial position', async () => {
      const position = { x: 5, y: 2, z: -3 };
      await processor.setEffect('spatialAudio', true, { position });

      expect(processor.effects.spatialAudio.position).toEqual(position);
    });

    it('updates spatial orientation', async () => {
      const orientation = { x: 1, y: 0, z: 0 };
      await processor.setEffect('spatialAudio', true, { orientation });

      expect(processor.effects.spatialAudio.orientation).toEqual(orientation);
    });

    it('updates room size to small', async () => {
      await processor.setEffect('spatialAudio', true, { roomSize: 'small' });

      expect(processor.effects.spatialAudio.roomSize).toBe('small');
      expect(processor.nodes.spatialNode.refDistance).toBe(1);
      expect(processor.nodes.spatialNode.maxDistance).toBe(10);
    });

    it('updates room size to medium', async () => {
      await processor.setEffect('spatialAudio', true, { roomSize: 'medium' });

      expect(processor.effects.spatialAudio.roomSize).toBe('medium');
      expect(processor.nodes.spatialNode.refDistance).toBe(5);
      expect(processor.nodes.spatialNode.maxDistance).toBe(50);
    });

    it('updates room size to large', async () => {
      await processor.setEffect('spatialAudio', true, { roomSize: 'large' });

      expect(processor.effects.spatialAudio.roomSize).toBe('large');
      expect(processor.nodes.spatialNode.refDistance).toBe(10);
      expect(processor.nodes.spatialNode.maxDistance).toBe(100);
    });

    it('applies position to panner node', async () => {
      await processor.setEffect('spatialAudio', true, { position: { x: 3, y: 4, z: 5 } });

      expect(processor.nodes.spatialNode.setPosition).toHaveBeenCalledWith(3, 4, 5);
    });

    it('applies orientation to panner node', async () => {
      await processor.setEffect('spatialAudio', true, { orientation: { x: 1, y: 0, z: -1 } });

      expect(processor.nodes.spatialNode.setOrientation).toHaveBeenCalledWith(1, 0, -1);
    });

    it('disables spatial audio effect', async () => {
      await processor.setEffect('spatialAudio', true);
      await processor.setEffect('spatialAudio', false);

      expect(processor.effects.spatialAudio.enabled).toBe(false);
    });
  });

  describe('Volume Control', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('sets volume to specified value', () => {
      processor.setVolume(0.5);

      expect(processor.nodes.gainNode.gain.value).toBe(0.5);
    });

    it('clamps volume to minimum 0', () => {
      processor.setVolume(-0.5);

      expect(processor.nodes.gainNode.gain.value).toBe(0);
    });

    it('clamps volume to maximum 2', () => {
      processor.setVolume(3);

      expect(processor.nodes.gainNode.gain.value).toBe(2);
    });

    it('handles volume at exactly 0', () => {
      processor.setVolume(0);

      expect(processor.nodes.gainNode.gain.value).toBe(0);
    });

    it('handles volume at exactly 2', () => {
      processor.setVolume(2);

      expect(processor.nodes.gainNode.gain.value).toBe(2);
    });
  });

  describe('Spatial Position Control', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('sets spatial position', () => {
      processor.setSpatialPosition(10, 5, -15);

      expect(processor.effects.spatialAudio.position).toEqual({ x: 10, y: 5, z: -15 });
    });

    it('updates panner node position', () => {
      processor.setSpatialPosition(7, 3, -8);

      expect(processor.nodes.spatialNode.setPosition).toHaveBeenCalledWith(7, 3, -8);
    });

    it('handles zero position', () => {
      processor.setSpatialPosition(0, 0, 0);

      expect(processor.effects.spatialAudio.position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('handles negative coordinates', () => {
      processor.setSpatialPosition(-5, -10, -20);

      expect(processor.effects.spatialAudio.position).toEqual({ x: -5, y: -10, z: -20 });
    });
  });

  describe('Voice Activity Detection', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('detects voice activity above threshold', () => {
      const audioData = new Uint8Array(1024);
      // Fill with high amplitude data
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 50; // High amplitude
      }

      processor.detectVoiceActivity(audioData);

      expect(processor.voiceActivity.isActive).toBe(true);
    });

    it('detects silence below threshold', () => {
      const audioData = new Uint8Array(1024);
      // Fill with low amplitude data
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 1; // Very low amplitude
      }

      processor.detectVoiceActivity(audioData);

      expect(processor.voiceActivity.isActive).toBe(false);
    });

    it('tracks voice activity history', () => {
      const audioData = new Uint8Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 30;
      }

      processor.detectVoiceActivity(audioData);

      expect(processor.voiceActivity.activityHistory.length).toBeGreaterThan(0);
      expect(processor.voiceActivity.activityHistory[0]).toHaveProperty('timestamp');
      expect(processor.voiceActivity.activityHistory[0]).toHaveProperty('active');
      expect(processor.voiceActivity.activityHistory[0]).toHaveProperty('level');
    });

    it('limits activity history to 100 samples', () => {
      const audioData = new Uint8Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 30;
      }

      // Add more than 100 samples
      for (let i = 0; i < 150; i++) {
        processor.detectVoiceActivity(audioData);
      }

      expect(processor.voiceActivity.activityHistory.length).toBeLessThanOrEqual(100);
    });

    it('calculates RMS energy correctly', () => {
      const audioData = new Uint8Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128;
      }

      processor.detectVoiceActivity(audioData);

      // With normalized samples of 0, dB level should be very low
      const lastActivity = processor.voiceActivity.activityHistory[processor.voiceActivity.activityHistory.length - 1];
      expect(lastActivity.level).toBeLessThan(-40);
    });
  });

  describe('Pitch Detection', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('detects pitch from audio data', () => {
      const audioData = new Uint8Array(2048);
      // Create a simple periodic waveform
      const frequency = 440; // A4
      const sampleRate = 48000;
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 50 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
      }

      processor.detectPitch(audioData);

      expect(processor.analysis.fundamentalFreq).toBeGreaterThan(0);
    });

    it('calculates MIDI note number', () => {
      const audioData = new Uint8Array(2048);
      const frequency = 440;
      const sampleRate = 48000;
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 50 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
      }

      processor.detectPitch(audioData);

      expect(processor.analysis.pitch).toBeDefined();
    });

    it('provides confidence value', () => {
      const audioData = new Uint8Array(2048);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + Math.random() * 20;
      }

      processor.detectPitch(audioData);

      expect(processor.analysis.confidence).toBeDefined();
      expect(processor.analysis.confidence).toBeGreaterThanOrEqual(0);
    });

    it('handles noisy audio gracefully', () => {
      const audioData = new Uint8Array(2048);
      // Pure noise
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 255;
      }

      expect(() => processor.detectPitch(audioData)).not.toThrow();
    });
  });

  describe('Spectral Analysis', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('calculates spectral centroid', () => {
      const freqData = new Float32Array(1024);
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = -60 + Math.random() * 30;
      }

      processor.analyzeSpectrum(freqData);

      expect(processor.analysis.spectralCentroid).toBeGreaterThanOrEqual(0);
    });

    it('calculates spectral rolloff', () => {
      const freqData = new Float32Array(1024);
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = -40 - i * 0.1;
      }

      processor.analyzeSpectrum(freqData);

      expect(processor.analysis.spectralRolloff).toBeGreaterThanOrEqual(0);
    });

    it('handles zero energy spectrum', () => {
      const freqData = new Float32Array(1024);
      freqData.fill(-100); // Very low energy

      processor.analyzeSpectrum(freqData);

      expect(processor.analysis.spectralCentroid).toBe(0);
    });

    it('updates analysis on each call', () => {
      const freqData1 = new Float32Array(1024);
      freqData1.fill(-50);

      processor.analyzeSpectrum(freqData1);
      const centroid1 = processor.analysis.spectralCentroid;

      const freqData2 = new Float32Array(1024);
      freqData2.fill(-30);

      processor.analyzeSpectrum(freqData2);
      const centroid2 = processor.analysis.spectralCentroid;

      // Different energy levels should produce different results
      expect(centroid1).not.toBe(centroid2);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('updates performance metrics', () => {
      processor.updatePerformanceMetrics();

      expect(processor.performance.lastUpdate).toBeLessThanOrEqual(Date.now());
    });

    it('calculates total latency', () => {
      processor.updatePerformanceMetrics();

      const expectedLatency = mockAudioContext.baseLatency + mockAudioContext.outputLatency;
      expect(processor.performance.latency).toBe(expectedLatency);
    });

    it('tracks audio dropouts', () => {
      mockAudioContext.state = 'suspended';
      const initialDropouts = processor.performance.dropouts;

      processor.updatePerformanceMetrics();

      expect(processor.performance.dropouts).toBe(initialDropouts + 1);
    });

    it('does not increment dropouts when running', () => {
      mockAudioContext.state = 'running';
      const initialDropouts = processor.performance.dropouts;

      processor.updatePerformanceMetrics();

      expect(processor.performance.dropouts).toBe(initialDropouts);
    });
  });

  describe('AI Features', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables noise reduction', async () => {
      await processor.enableNoiseReduction(0.8);

      expect(processor.aiFeatures.noiseReduction.enabled).toBe(true);
      expect(processor.aiFeatures.noiseReduction.aggressiveness).toBe(0.8);
    });

    it('uses default aggressiveness for noise reduction', async () => {
      await processor.enableNoiseReduction();

      expect(processor.aiFeatures.noiseReduction.aggressiveness).toBe(0.7);
    });

    it('enables voice cloning', async () => {
      const voiceProfile = { id: 'profile-123', features: [] };
      await processor.enableVoiceCloning(voiceProfile);

      expect(processor.aiFeatures.voiceCloning.enabled).toBe(true);
      expect(processor.aiFeatures.voiceCloning.targetVoice).toEqual(voiceProfile);
    });

    it('initializes with adaptive noise reduction mode', () => {
      expect(processor.aiFeatures.noiseReduction.adaptiveMode).toBe(true);
    });

    it('supports language translation configuration', () => {
      expect(processor.aiFeatures.languageTranslation).toBeDefined();
      expect(processor.aiFeatures.languageTranslation.enabled).toBe(false);
      expect(processor.aiFeatures.languageTranslation.targetLanguage).toBe('en');
      expect(processor.aiFeatures.languageTranslation.preserveIntonation).toBe(true);
    });
  });

  describe('Getters and State Retrieval', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('returns voice activity state', () => {
      const voiceActivity = processor.getVoiceActivity();

      expect(voiceActivity).toHaveProperty('isActive');
      expect(voiceActivity).toHaveProperty('level');
      expect(voiceActivity).toHaveProperty('history');
    });

    it('returns audio analysis data', () => {
      const analysis = processor.getAudioAnalysis();

      expect(analysis).toHaveProperty('fundamentalFreq');
      expect(analysis).toHaveProperty('formants');
      expect(analysis).toHaveProperty('spectralCentroid');
      expect(analysis).toHaveProperty('spectralRolloff');
      expect(analysis).toHaveProperty('pitch');
      expect(analysis).toHaveProperty('confidence');
    });

    it('returns performance metrics', () => {
      const performance = processor.getPerformanceMetrics();

      expect(performance).toHaveProperty('latency');
      expect(performance).toHaveProperty('cpuUsage');
      expect(performance).toHaveProperty('dropouts');
      expect(performance).toHaveProperty('lastUpdate');
    });

    it('returns effects state', () => {
      const effects = processor.getEffectsState();

      expect(effects).toHaveProperty('robot');
      expect(effects).toHaveProperty('echo');
      expect(effects).toHaveProperty('reverb');
      expect(effects).toHaveProperty('pitchShift');
      expect(effects).toHaveProperty('noiseGate');
      expect(effects).toHaveProperty('compressor');
      expect(effects).toHaveProperty('voiceEnhancement');
      expect(effects).toHaveProperty('spatialAudio');
    });

    it('limits voice activity history to last 50 samples', () => {
      const audioData = new Uint8Array(1024);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = 128 + 30;
      }

      // Add more than 50 samples
      for (let i = 0; i < 80; i++) {
        processor.detectVoiceActivity(audioData);
      }

      const voiceActivity = processor.getVoiceActivity();
      expect(voiceActivity.history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Effect Parameter Validation', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('throws error for unknown effect', async () => {
      await expect(processor.setEffect('unknownEffect', true)).rejects.toThrow('Unknown effect: unknownEffect');
    });

    it('accepts valid effect names', async () => {
      const validEffects = ['robot', 'echo', 'reverb', 'pitchShift', 'noiseGate', 'compressor', 'voiceEnhancement', 'spatialAudio'];

      for (const effect of validEffects) {
        await expect(processor.setEffect(effect, true)).resolves.not.toThrow();
      }
    });

    it('updates worklet when effect changes', async () => {
      const postMessage = processor.nodes.workletNode.port.postMessage;

      await processor.setEffect('echo', true);

      expect(postMessage).toHaveBeenCalledWith({
        type: 'updateEffects',
        effects: expect.any(Object)
      });
    });

    it('handles missing worklet node gracefully', async () => {
      processor.nodes.workletNode = null;

      await expect(processor.setEffect('echo', true)).resolves.not.toThrow();
    });
  });

  describe('Audio Worklet Integration', () => {
    it('sends initial effects to worklet on creation', async () => {
      await processor.initialize(mockMediaStream);

      expect(mockWorkletNode.port.postMessage).toHaveBeenCalledWith({
        type: 'updateEffects',
        effects: processor.effects
      });
    });

    it('handles worklet creation failure gracefully', async () => {
      global.AudioWorkletNode = jest.fn(() => {
        throw new Error('Worklet not supported');
      });

      const newProcessor = new VoiceEffectsProcessor();
      await expect(newProcessor.initialize(mockMediaStream)).resolves.toBeDefined();
    });

    it('handles missing audio worklet support', async () => {
      mockAudioContext.audioWorklet = null;

      const newProcessor = new VoiceEffectsProcessor();
      await newProcessor.initialize(mockMediaStream);

      expect(newProcessor.nodes.workletNode).toBeUndefined();
    });

    it('generates valid worklet processor code', () => {
      const code = processor.generateAudioWorkletCode();

      expect(code).toContain('class VoiceEffectsWorklet');
      expect(code).toContain('extends AudioWorkletProcessor');
      expect(code).toContain('process(inputs, outputs, parameters)');
      expect(code).toContain('applyNoiseGate');
      expect(code).toContain('applyPitchShift');
      expect(code).toContain('registerProcessor');
    });
  });

  describe('Effects Chain Connection', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('connects analyser to output', () => {
      expect(processor.nodes.analyserNode.connect).toHaveBeenCalled();
    });

    it('connects gain node in chain', () => {
      expect(processor.nodes.gainNode.connect).toHaveBeenCalled();
    });

    it('creates channel merger for stereo effects', () => {
      expect(mockAudioContext.createChannelMerger).toHaveBeenCalled();
    });

    it('starts real-time analysis after connection', () => {
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Destruction', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('closes audio context on destroy', async () => {
      await processor.destroy();

      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('sets isProcessing to false', async () => {
      await processor.destroy();

      expect(processor.isProcessing).toBe(false);
    });

    it('nullifies audio context', async () => {
      await processor.destroy();

      expect(processor.audioContext).toBeNull();
    });

    it('cleans up all nodes', async () => {
      await processor.destroy();

      expect(processor.nodes.gainNode).toBeNull();
      expect(processor.nodes.compressorNode).toBeNull();
      expect(processor.nodes.filterNode).toBeNull();
      expect(processor.nodes.delayNode).toBeNull();
      expect(processor.nodes.reverbNode).toBeNull();
    });

    it('revokes worklet URL', async () => {
      const workletUrl = processor.workletUrl;
      await processor.destroy();

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(workletUrl);
    });

    it('handles destroy without initialization', async () => {
      const newProcessor = new VoiceEffectsProcessor();
      await expect(newProcessor.destroy()).resolves.not.toThrow();
    });

    it('handles audio context close error gracefully', async () => {
      mockAudioContext.close = jest.fn().mockRejectedValue(new Error('Close failed'));

      await expect(processor.destroy()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles missing AudioContext', () => {
      const tempAudioContext = global.AudioContext;
      const tempWebkitAudioContext = global.webkitAudioContext;
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      expect(() => new VoiceEffectsProcessor()).not.toThrow();

      global.AudioContext = tempAudioContext;
      global.webkitAudioContext = tempWebkitAudioContext;
    });

    it('handles audio context creation failure', async () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('AudioContext creation failed');
      });

      const newProcessor = new VoiceEffectsProcessor();
      await expect(newProcessor.initialize(mockMediaStream)).rejects.toThrow();
    });

    it('handles null audio stream', async () => {
      await expect(processor.initialize(null)).rejects.toThrow();
    });

    it('handles empty frequency data in spectrum analysis', () => {
      const freqData = new Float32Array(0);

      expect(() => processor.analyzeSpectrum(freqData)).not.toThrow();
    });

    it('handles empty audio data in pitch detection', () => {
      const audioData = new Uint8Array(0);

      expect(() => processor.detectPitch(audioData)).not.toThrow();
    });

    it('handles volume setting without initialized nodes', () => {
      const newProcessor = new VoiceEffectsProcessor();

      expect(() => newProcessor.setVolume(0.5)).not.toThrow();
    });

    it('handles spatial position setting without panner node', () => {
      const newProcessor = new VoiceEffectsProcessor();

      expect(() => newProcessor.setSpatialPosition(1, 2, 3)).not.toThrow();
    });
  });

  describe('Multiple Effects Combination', () => {
    beforeEach(async () => {
      await processor.initialize(mockMediaStream);
    });

    it('enables multiple effects simultaneously', async () => {
      await processor.setEffect('echo', true);
      await processor.setEffect('reverb', true);
      await processor.setEffect('pitchShift', true);

      expect(processor.effects.echo.enabled).toBe(true);
      expect(processor.effects.reverb.enabled).toBe(true);
      expect(processor.effects.pitchShift.enabled).toBe(true);
    });

    it('maintains independent effect parameters', async () => {
      await processor.setEffect('echo', true, { delay: 0.5, feedback: 0.6 });
      await processor.setEffect('reverb', true, { roomSize: 0.8, wetness: 0.5 });

      expect(processor.effects.echo.delay).toBe(0.5);
      expect(processor.effects.echo.feedback).toBe(0.6);
      expect(processor.effects.reverb.roomSize).toBe(0.8);
      expect(processor.effects.reverb.wetness).toBe(0.5);
    });

    it('disables individual effects without affecting others', async () => {
      await processor.setEffect('echo', true);
      await processor.setEffect('reverb', true);
      await processor.setEffect('echo', false);

      expect(processor.effects.echo.enabled).toBe(false);
      expect(processor.effects.reverb.enabled).toBe(true);
    });
  });

  describe('Real-time Analysis Loop', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      await processor.initialize(mockMediaStream);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('continuously updates analysis data', () => {
      const initialCentroid = processor.analysis.spectralCentroid;

      jest.advanceTimersByTime(100);

      // Analysis should have been updated
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('stops analysis when processing is disabled', async () => {
      processor.isProcessing = false;

      jest.advanceTimersByTime(100);

      // Should not continue requesting animation frames
      const callCount = global.requestAnimationFrame.mock.calls.length;
      jest.advanceTimersByTime(100);

      // Call count should not increase significantly
      expect(global.requestAnimationFrame.mock.calls.length).toBeLessThan(callCount + 10);
    });
  });
});

export default workletCode
