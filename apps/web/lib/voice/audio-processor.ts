export interface AudioProcessingConfig {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate: number;
  channelCount: number;
  bufferSize: number;
  enableVAD: boolean; // Voice Activity Detection
  vadThreshold: number;
  enableCompressor: boolean;
  enableLimiter: boolean;
  enableEqualizer: boolean;
}

export interface AudioStats {
  inputLevel: number; // 0-100
  outputLevel: number; // 0-100
  noiseLevel: number; // 0-100
  isSpeaking: boolean;
  clipping: boolean;
  latency: number; // ms
  processingLoad: number; // 0-100
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private inputStream: MediaStream | null = null;
  private outputDestination: MediaStreamAudioDestinationNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processingChain: AudioNode[] = [];
  
  private config: AudioProcessingConfig = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
    bufferSize: 2048, // Reduced for lower latency
    enableVAD: true,
    vadThreshold: 0.008, // More sensitive threshold
    enableCompressor: true,
    enableLimiter: true,
    enableEqualizer: true // Enable for better voice clarity
  };

  private stats: AudioStats = {
    inputLevel: 0,
    outputLevel: 0,
    noiseLevel: 0,
    isSpeaking: false,
    clipping: false,
    latency: 0,
    processingLoad: 0
  };

  private analysers: {
    input?: AnalyserNode;
    output?: AnalyserNode;
    noise?: AnalyserNode;
  } = {};

  private processors: {
    compressor?: DynamicsCompressorNode;
    limiter?: DynamicsCompressorNode;
    equalizer?: BiquadFilterNode[];
    gainNode?: GainNode;
    vadProcessor?: ScriptProcessorNode;
    noiseGate?: GainNode;
    dcBlocker?: BiquadFilterNode;
  } = {};

  private eventHandlers: Map<string, Function[]> = new Map();
  private cleanupFunctions: Function[] = [];
  private vadTimer: NodeJS.Timeout | null = null;
  private statsTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private isProcessing = false;

  constructor(config?: Partial<AudioProcessingConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      if (event.error?.stack?.includes('AudioContext') ||
          event.error?.stack?.includes('audio processing') ||
          event.error?.stack?.includes('getUserMedia')) {
        console.error('Audio processing error:', event.error);
        this.emit('error', {
          type: 'processing_error',
          message: event.error.message,
          recoverable: true
        });
      }
    });
  }

  public async initialize(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('AudioProcessor has been destroyed');
    }

    try {
      // Create audio context
      await this.createAudioContext();
      
      // Set up processing chain
      await this.setupProcessingChain();
      
      // Start monitoring
      this.startStatsMonitoring();
      
      console.log('Audio processor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  private async createAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      // Optimal settings for voice communication
      this.audioContext = new AudioContextClass({
        sampleRate: this.config.sampleRate,
        latencyHint: 'interactive' // Critical for low-latency voice chat
      });

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Set up context state change handlers
      this.audioContext.addEventListener('statechange', () => {
        console.log('Audio context state changed to:', this.audioContext?.state);
        this.emit('contextStateChange', this.audioContext?.state);
      });

      console.log('Audio context created:', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
        baseLatency: this.audioContext.baseLatency,
        outputLatency: this.audioContext.outputLatency
      });

    } catch (error) {
      console.error('Failed to create audio context:', error);
      throw error;
    }
  }

  private async setupProcessingChain(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      // Create output destination
      this.outputDestination = this.audioContext.createMediaStreamDestination();

      // Set up analyzers for monitoring
      this.analysers.input = this.audioContext.createAnalyser();
      this.analysers.output = this.audioContext.createAnalyser();
      this.analysers.noise = this.audioContext.createAnalyser();

      // Configure analyzers
      Object.values(this.analysers).forEach(analyser => {
        if (analyser) {
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.8;
        }
      });

      // Set up processing chain in optimal order
      await this.setupDCBlocker(); // Remove DC offset first
      await this.setupNoiseGate(); // Gate before processing
      await this.setupEqualizer(); // EQ before dynamics
      await this.setupCompressor(); // Compress before limiting
      await this.setupLimiter(); // Final limiting
      await this.setupGainNode(); // Output gain
      await this.setupVADProcessor(); // Monitor processed signal

      console.log('Audio processing chain set up successfully');

    } catch (error) {
      console.error('Failed to set up processing chain:', error);
      throw error;
    }
  }

  private async setupCompressor(): Promise<void> {
    if (!this.audioContext || !this.config.enableCompressor) return;

    try {
      this.processors.compressor = this.audioContext.createDynamicsCompressor();
      
      // Optimized compressor settings for voice communication
      this.processors.compressor.threshold.value = -18; // Higher threshold for voice
      this.processors.compressor.knee.value = 6; // Softer knee for natural sound
      this.processors.compressor.ratio.value = 4; // Gentler compression ratio
      this.processors.compressor.attack.value = 0.001; // Fast attack for transients
      this.processors.compressor.release.value = 0.1; // Faster release for speech

      this.processingChain.push(this.processors.compressor);
      console.log('Voice-optimized compressor configured');

    } catch (error) {
      console.error('Failed to set up compressor:', error);
    }
  }

  private async setupLimiter(): Promise<void> {
    if (!this.audioContext || !this.config.enableLimiter) return;

    try {
      this.processors.limiter = this.audioContext.createDynamicsCompressor();
      
      // Configure as a limiter (high ratio, fast attack)
      this.processors.limiter.threshold.value = -6; // dB
      this.processors.limiter.knee.value = 0; // dB (hard knee)
      this.processors.limiter.ratio.value = 20; // 20:1 ratio
      this.processors.limiter.attack.value = 0.001; // 1ms
      this.processors.limiter.release.value = 0.1; // 100ms

      this.processingChain.push(this.processors.limiter);
      console.log('Audio limiter configured');

    } catch (error) {
      console.error('Failed to set up limiter:', error);
    }
  }

  private async setupEqualizer(): Promise<void> {
    if (!this.audioContext || !this.config.enableEqualizer) return;

    try {
      // Create professional 4-band EQ for voice processing
      this.processors.equalizer = [
        this.audioContext.createBiquadFilter(), // High-pass filter
        this.audioContext.createBiquadFilter(), // Low-mid cut
        this.audioContext.createBiquadFilter(), // Presence boost
        this.audioContext.createBiquadFilter()  // De-esser
      ];

      const [highpass, lowMidCut, presenceBoost, deEsser] = this.processors.equalizer;

      // High-pass filter to remove rumble and breath noise
      highpass.type = 'highpass';
      highpass.frequency.value = 80; // Hz
      highpass.Q.value = 0.7;

      // Slight cut in low-mids to reduce muddiness
      lowMidCut.type = 'peaking';
      lowMidCut.frequency.value = 300; // Hz
      lowMidCut.Q.value = 1.2;
      lowMidCut.gain.value = -2; // dB

      // Presence boost for speech intelligibility
      presenceBoost.type = 'peaking';
      presenceBoost.frequency.value = 2800; // Hz - optimal for voice clarity
      presenceBoost.Q.value = 1.4;
      presenceBoost.gain.value = 4; // dB

      // De-esser to reduce harsh sibilants
      deEsser.type = 'peaking';
      deEsser.frequency.value = 6500; // Hz
      deEsser.Q.value = 2.0;
      deEsser.gain.value = -3; // dB

      this.processingChain.push(...this.processors.equalizer);
      console.log('Professional voice EQ configured with 4 bands');

    } catch (error) {
      console.error('Failed to set up voice EQ:', error);
    }
  }

  private async setupGainNode(): Promise<void> {
    if (!this.audioContext) return;

    try {
      this.processors.gainNode = this.audioContext.createGain();
      this.processors.gainNode.gain.value = 1.0; // Unity gain initially

      this.processingChain.push(this.processors.gainNode);
      console.log('Audio gain node configured');

    } catch (error) {
      console.error('Failed to set up gain node:', error);
    }
  }

  private async setupVADProcessor(): Promise<void> {
    if (!this.audioContext || !this.config.enableVAD) return;

    try {
      // Use ScriptProcessorNode for VAD (deprecated but still widely supported)
      this.processors.vadProcessor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        this.config.channelCount,
        this.config.channelCount
      );

      this.processors.vadProcessor.onaudioprocess = (event) => {
        this.processVAD(event);
      };

      this.processingChain.push(this.processors.vadProcessor);
      console.log('VAD processor configured');

    } catch (error) {
      console.error('Failed to set up VAD processor:', error);
    }
  }

  private async setupDCBlocker(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // DC blocking filter to remove DC offset from microphone
      this.processors.dcBlocker = this.audioContext.createBiquadFilter();
      this.processors.dcBlocker.type = 'highpass';
      this.processors.dcBlocker.frequency.value = 20; // 20Hz highpass
      this.processors.dcBlocker.Q.value = 0.1;

      this.processingChain.push(this.processors.dcBlocker);
      console.log('DC blocking filter configured');

    } catch (error) {
      console.error('Failed to set up DC blocker:', error);
    }
  }

  private async setupNoiseGate(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Intelligent noise gate using a gain node controlled by VAD
      this.processors.noiseGate = this.audioContext.createGain();
      this.processors.noiseGate.gain.value = 1.0; // Initially open

      this.processingChain.push(this.processors.noiseGate);
      console.log('Intelligent noise gate configured');

    } catch (error) {
      console.error('Failed to set up noise gate:', error);
    }
  }

  private processVAD(event: AudioProcessingEvent): void {
    try {
      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;

      // Enhanced VAD with multiple detection algorithms
      const channelData = inputBuffer.getChannelData(0);
      
      // Calculate RMS (Root Mean Square) for energy detection
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        const sample = Math.abs(channelData[i]);
        sum += sample * sample;
        peak = Math.max(peak, sample);
      }
      
      const rms = Math.sqrt(sum / channelData.length);
      
      // Calculate zero crossing rate for voice characteristics
      let zeroCrossings = 0;
      for (let i = 1; i < channelData.length; i++) {
        if ((channelData[i - 1] >= 0) !== (channelData[i] >= 0)) {
          zeroCrossings++;
        }
      }
      const zeroCrossingRate = zeroCrossings / channelData.length;
      
      // Multi-criteria voice detection
      const energyDetection = rms > this.config.vadThreshold;
      const peakDetection = peak > this.config.vadThreshold * 2;
      const voiceCharacteristics = zeroCrossingRate > 0.01 && zeroCrossingRate < 0.3;
      
      const isSpeaking = energyDetection && (peakDetection || voiceCharacteristics);

      // Control noise gate based on VAD
      if (this.processors.noiseGate) {
        const targetGain = isSpeaking ? 1.0 : 0.1; // Reduce gain when not speaking
        const currentTime = this.audioContext?.currentTime || 0;
        
        // Smooth gain changes to avoid artifacts
        this.processors.noiseGate.gain.cancelScheduledValues(currentTime);
        this.processors.noiseGate.gain.setTargetAtTime(targetGain, currentTime, 0.02); // 20ms time constant
      }

      // Update stats with enhanced metrics
      this.stats.inputLevel = Math.min(100, rms * 1000); // Scale to 0-100
      this.stats.noiseLevel = Math.min(100, (rms * 500) * (1 - (isSpeaking ? 1 : 0))); // Estimate noise level
      
      if (this.stats.isSpeaking !== isSpeaking) {
        this.stats.isSpeaking = isSpeaking;
        this.emit('speakingChanged', isSpeaking);
        console.log(`Voice activity: ${isSpeaking ? 'speaking' : 'silent'} (RMS: ${rms.toFixed(4)}, ZCR: ${zeroCrossingRate.toFixed(4)})`);
      }

      // Pass audio through (no modification)
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const inputData = inputBuffer.getChannelData(channel);
        const outputData = outputBuffer.getChannelData(channel);
        outputData.set(inputData);
      }

    } catch (error) {
      console.error('VAD processing error:', error);
    }
  }

  public async processInputStream(stream: MediaStream): Promise<MediaStream> {
    if (!this.audioContext || !this.outputDestination) {
      throw new Error('Audio processor not initialized');
    }

    if (this.isProcessing) {
      await this.stopProcessing();
    }

    try {
      this.inputStream = stream;
      this.isProcessing = true;

      // Create source node from input stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Connect processing chain
      let previousNode: AudioNode = this.sourceNode;

      // Connect to input analyser
      if (this.analysers.input) {
        previousNode.connect(this.analysers.input);
      }

      // Connect through processing chain
      for (const processor of this.processingChain) {
        previousNode.connect(processor);
        previousNode = processor;
      }

      // Connect to output analyser and destination
      if (this.analysers.output) {
        previousNode.connect(this.analysers.output);
      }
      
      previousNode.connect(this.outputDestination);

      console.log('Audio processing started');
      this.emit('processingStarted');

      return this.outputDestination.stream;

    } catch (error) {
      this.isProcessing = false;
      console.error('Failed to process input stream:', error);
      throw error;
    }
  }

  public async stopProcessing(): Promise<void> {
    try {
      // Disconnect all nodes
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      // Disconnect processing chain
      this.processingChain.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting audio node:', error);
        }
      });

      // Disconnect analysers
      Object.values(this.analysers).forEach(analyser => {
        if (analyser) {
          try {
            analyser.disconnect();
          } catch (error) {
            console.warn('Error disconnecting analyser:', error);
          }
        }
      });

      this.isProcessing = false;
      this.inputStream = null;

      console.log('Audio processing stopped');
      this.emit('processingStopped');

    } catch (error) {
      console.error('Error stopping audio processing:', error);
    }
  }

  public updateConfig(config: Partial<AudioProcessingConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Apply configuration changes
    this.applyConfigChanges(oldConfig, this.config);
    
    this.emit('configUpdated', this.config);
  }

  private applyConfigChanges(
    oldConfig: AudioProcessingConfig, 
    newConfig: AudioProcessingConfig
  ): void {
    // Update VAD threshold
    if (oldConfig.vadThreshold !== newConfig.vadThreshold) {
      console.log('Updated VAD threshold to:', newConfig.vadThreshold);
    }

    // Update gain
    if (this.processors.gainNode && oldConfig.channelCount !== newConfig.channelCount) {
      // Gain adjustments would go here
    }

    // Update compressor settings
    if (this.processors.compressor) {
      // Dynamic compressor updates would go here
    }
  }

  public setGain(gain: number): void {
    if (this.processors.gainNode) {
      // Smooth gain changes to avoid pops
      const currentTime = this.audioContext?.currentTime || 0;
      this.processors.gainNode.gain.cancelScheduledValues(currentTime);
      this.processors.gainNode.gain.setTargetAtTime(gain, currentTime, 0.1);
      
      console.log('Audio gain set to:', gain);
      this.emit('gainChanged', gain);
    }
  }

  public async getAvailableDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label,
          kind: device.kind as 'audioinput' | 'audiooutput',
          groupId: device.groupId
        }));
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  public getStats(): AudioStats {
    this.updateStats();
    return { ...this.stats };
  }

  private startStatsMonitoring(): void {
    this.statsTimer = setInterval(() => {
      this.updateStats();
    }, 100); // Update every 100ms

    this.cleanupFunctions.push(() => {
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
        this.statsTimer = null;
      }
    });
  }

  private updateStats(): void {
    try {
      // Update audio levels from analyzers
      if (this.analysers.input) {
        this.stats.inputLevel = this.getAudioLevel(this.analysers.input);
      }

      if (this.analysers.output) {
        this.stats.outputLevel = this.getAudioLevel(this.analysers.output);
      }

      // Calculate processing load (simplified)
      if (this.audioContext) {
        const expectedLatency = this.config.bufferSize / this.audioContext.sampleRate;
        const actualLatency = this.audioContext.outputLatency || 0;
        this.stats.latency = actualLatency * 1000; // Convert to ms
        this.stats.processingLoad = Math.min(100, (actualLatency / expectedLatency) * 100);
      }

      // Check for clipping
      this.stats.clipping = this.stats.outputLevel > 95;

    } catch (error) {
      console.error('Error updating audio stats:', error);
    }
  }

  private getAudioLevel(analyser: AnalyserNode): number {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    
    return (sum / bufferLength) * (100 / 255); // Scale to 0-100
  }

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in audio processor event handler for ${event}:`, error);
        }
      });
    }
  }

  public async destroy(): Promise<void> {
    this.isDestroyed = true;

    // Stop processing
    await this.stopProcessing();

    // Clean up timers
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.length = 0;

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing audio context:', error);
      }
    }

    // Clear references
    this.audioContext = null;
    this.inputStream = null;
    this.outputDestination = null;
    this.sourceNode = null;
    this.processingChain = [];
    this.analysers = {};
    this.processors = {};
    this.eventHandlers.clear();

    console.log('AudioProcessor destroyed');
  }
}