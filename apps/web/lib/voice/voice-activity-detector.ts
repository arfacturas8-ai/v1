export interface VADConfig {
  // Detection thresholds
  energyThreshold: number; // 0-1, energy level threshold for speech detection
  frequencyThreshold: number; // 0-1, frequency domain threshold
  zeroCrossingThreshold: number; // Zero crossing rate threshold
  
  // Timing parameters
  minSpeechDuration: number; // ms, minimum duration to register as speech
  minSilenceDuration: number; // ms, minimum silence before ending speech
  lookbackDuration: number; // ms, how far back to look for speech patterns
  
  // Processing parameters
  sampleRate: number;
  frameSize: number; // Number of samples per frame
  hopSize: number; // Number of samples to advance per frame
  
  // Adaptive parameters
  adaptiveThreshold: boolean; // Adjust threshold based on background noise
  noiseFloor: number; // Minimum noise level estimation
  adaptationSpeed: number; // How quickly to adapt to noise changes
}

export interface AudioLevelInfo {
  rms: number; // Root Mean Square level (0-1)
  peak: number; // Peak level (0-1)
  frequency: number; // Dominant frequency in Hz
  spectralCentroid: number; // Spectral centroid for voice quality
  zeroCrossingRate: number; // Zero crossing rate
  voiceProbability: number; // Probability this is voice (0-1)
}

export interface VADResult {
  isSpeaking: boolean;
  confidence: number; // 0-1, confidence in the detection
  audioLevel: AudioLevelInfo;
  noiseLevel: number; // Current noise floor estimate
  speechDuration: number; // ms, how long current speech segment has lasted
  silenceDuration: number; // ms, how long current silence has lasted
  timestamp: number;
}

export interface SpeakingEvent {
  type: 'speech_start' | 'speech_end' | 'level_change';
  participantId?: string;
  timestamp: number;
  data: VADResult;
}

export class VoiceActivityDetector {
  private config: VADConfig = {
    energyThreshold: 0.02,
    frequencyThreshold: 0.1,
    zeroCrossingThreshold: 0.1,
    minSpeechDuration: 150,
    minSilenceDuration: 300,
    lookbackDuration: 1000,
    sampleRate: 48000,
    frameSize: 1024,
    hopSize: 512,
    adaptiveThreshold: true,
    noiseFloor: 0.001,
    adaptationSpeed: 0.1
  };

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  
  private isInitialized = false;
  private isRunning = false;
  private isDestroyed = false;
  
  // State tracking
  private currentState: VADResult = {
    isSpeaking: false,
    confidence: 0,
    audioLevel: {
      rms: 0,
      peak: 0,
      frequency: 0,
      spectralCentroid: 0,
      zeroCrossingRate: 0,
      voiceProbability: 0
    },
    noiseLevel: 0.001,
    speechDuration: 0,
    silenceDuration: 0,
    timestamp: Date.now()
  };
  
  private history: VADResult[] = [];
  private readonly MAX_HISTORY = 100;
  
  // Adaptive noise estimation
  private noiseProfile: Float32Array | null = null;
  private noiseUpdateCounter = 0;
  private readonly NOISE_UPDATE_INTERVAL = 10; // Update noise profile every N frames
  
  // Timing state
  private lastSpeechTime = 0;
  private lastSilenceTime = 0;
  private speechStartTime = 0;
  private silenceStartTime = 0;
  
  // Event handling
  private eventHandlers: Map<string, Function[]> = new Map();
  private levelMonitorTimer: NodeJS.Timeout | null = null;
  
  // Frequency analysis buffers
  private fftSize = 2048;
  private frequencyData: Float32Array | null = null;
  private timeData: Float32Array | null = null;

  constructor(config?: Partial<VADConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    this.initializeBuffers();
  }

  private initializeBuffers(): void {
    this.frequencyData = new Float32Array(this.fftSize / 2);
    this.timeData = new Float32Array(this.fftSize);
    this.noiseProfile = new Float32Array(this.fftSize / 2);
    
    // Initialize noise profile with small values
    this.noiseProfile.fill(this.config.noiseFloor);
  }

  public async initialize(audioContext: AudioContext): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('VAD has been destroyed');
    }

    if (this.isInitialized) {
      console.warn('VAD already initialized');
      return;
    }

    try {
      this.audioContext = audioContext;
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.3;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      
      // Create processor node for real-time analysis
      this.processorNode = this.audioContext.createScriptProcessor(
        this.config.frameSize,
        1, // mono input
        1  // mono output
      );
      
      this.processorNode.onaudioprocess = (event) => {
        this.processAudioFrame(event);
      };
      
      this.isInitialized = true;
      console.log('Voice Activity Detector initialized');
      
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
      throw error;
    }
  }

  public start(inputNode: AudioNode): void {
    if (!this.isInitialized || !this.analyser || !this.processorNode) {
      throw new Error('VAD not initialized');
    }

    if (this.isRunning) {
      console.warn('VAD already running');
      return;
    }

    try {
      // Connect the audio graph
      inputNode.connect(this.analyser);
      inputNode.connect(this.processorNode);
      
      // Processor must connect to destination to function (but we set gain to 0)
      const gainNode = this.audioContext!.createGain();
      gainNode.gain.value = 0; // Silent passthrough
      this.processorNode.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      this.isRunning = true;
      this.startLevelMonitoring();
      
      console.log('Voice Activity Detector started');
      this.emit('started');
      
    } catch (error) {
      console.error('Failed to start VAD:', error);
      throw error;
    }
  }

  public stop(): void {
    if (!this.isRunning) return;

    try {
      // Disconnect nodes
      if (this.analyser) {
        this.analyser.disconnect();
      }
      if (this.processorNode) {
        this.processorNode.disconnect();
      }
      
      this.stopLevelMonitoring();
      this.isRunning = false;
      
      console.log('Voice Activity Detector stopped');
      this.emit('stopped');
      
    } catch (error) {
      console.error('Error stopping VAD:', error);
    }
  }

  private processAudioFrame(event: AudioProcessingEvent): void {
    try {
      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);
      
      // Pass audio through unchanged
      outputData.set(inputData);
      
      // Analyze the audio frame
      this.analyzeAudioFrame(inputData);
      
    } catch (error) {
      console.error('Error processing audio frame:', error);
    }
  }

  private analyzeAudioFrame(audioData: Float32Array): void {
    if (!this.analyser || !this.frequencyData || !this.timeData) return;

    try {
      // Get frequency and time domain data
      this.analyser.getFloatFrequencyData(this.frequencyData);
      this.analyser.getFloatTimeDomainData(this.timeData);
      
      // Calculate audio level information
      const audioLevel = this.calculateAudioLevel(audioData, this.frequencyData);
      
      // Update noise profile if adaptive threshold is enabled
      if (this.config.adaptiveThreshold) {
        this.updateNoiseProfile(this.frequencyData);
      }
      
      // Perform voice activity detection
      const vadResult = this.performVAD(audioLevel);
      
      // Update state and emit events if needed
      this.updateState(vadResult);
      
    } catch (error) {
      console.error('Error analyzing audio frame:', error);
    }
  }

  private calculateAudioLevel(timeData: Float32Array, frequencyData: Float32Array): AudioLevelInfo {
    // Calculate RMS (Root Mean Square)
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = timeData[i];
      sum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    const rms = Math.sqrt(sum / timeData.length);
    
    // Calculate zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i - 1] >= 0) !== (timeData[i] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeData.length;
    
    // Find dominant frequency
    let maxMagnitude = -Infinity;
    let dominantFrequencyBin = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        dominantFrequencyBin = i;
      }
    }
    const dominantFrequency = (dominantFrequencyBin * this.config.sampleRate) / (2 * frequencyData.length);
    
    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      const frequency = (i * this.config.sampleRate) / (2 * frequencyData.length);
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    // Calculate voice probability based on spectral characteristics
    const voiceProbability = this.calculateVoiceProbability(
      dominantFrequency, 
      spectralCentroid, 
      zeroCrossingRate,
      rms
    );
    
    return {
      rms,
      peak,
      frequency: dominantFrequency,
      spectralCentroid,
      zeroCrossingRate,
      voiceProbability
    };
  }

  private calculateVoiceProbability(
    dominantFreq: number, 
    spectralCentroid: number, 
    zcr: number,
    rms: number
  ): number {
    let probability = 0;
    
    // Voice typically has dominant frequencies in 85-300 Hz range (fundamental)
    if (dominantFreq >= 85 && dominantFreq <= 300) {
      probability += 0.3;
    }
    
    // Voice typically has spectral centroid in 500-4000 Hz range
    if (spectralCentroid >= 500 && spectralCentroid <= 4000) {
      probability += 0.3;
    }
    
    // Voice typically has moderate zero crossing rate
    if (zcr >= 0.02 && zcr <= 0.15) {
      probability += 0.2;
    }
    
    // Sufficient energy level
    if (rms > this.config.energyThreshold) {
      probability += 0.2;
    }
    
    return Math.min(1, Math.max(0, probability));
  }

  private updateNoiseProfile(frequencyData: Float32Array): void {
    if (!this.noiseProfile) return;
    
    this.noiseUpdateCounter++;
    
    // Only update during silence periods
    if (!this.currentState.isSpeaking && this.noiseUpdateCounter >= this.NOISE_UPDATE_INTERVAL) {
      this.noiseUpdateCounter = 0;
      
      // Exponential moving average of noise profile
      for (let i = 0; i < this.noiseProfile.length; i++) {
        const currentMagnitude = Math.pow(10, frequencyData[i] / 20);
        this.noiseProfile[i] = 
          (1 - this.config.adaptationSpeed) * this.noiseProfile[i] + 
          this.config.adaptationSpeed * currentMagnitude;
      }
      
      // Update noise floor estimate
      const avgNoise = this.noiseProfile.reduce((sum, val) => sum + val, 0) / this.noiseProfile.length;
      this.currentState.noiseLevel = Math.max(this.config.noiseFloor, avgNoise);
    }
  }

  private performVAD(audioLevel: AudioLevelInfo): VADResult {
    const now = Date.now();
    
    // Calculate adaptive thresholds
    const energyThreshold = this.config.adaptiveThreshold 
      ? Math.max(this.config.energyThreshold, this.currentState.noiseLevel * 3)
      : this.config.energyThreshold;
    
    // Multi-criteria detection
    const energyDetection = audioLevel.rms > energyThreshold;
    const voiceDetection = audioLevel.voiceProbability > 0.5;
    const frequencyDetection = audioLevel.frequency > 85 && audioLevel.frequency < 4000;
    
    // Combine criteria
    const rawDetection = energyDetection && (voiceDetection || frequencyDetection);
    
    // Apply temporal smoothing
    const smoothedDetection = this.applyTemporalSmoothing(rawDetection, now);
    
    // Calculate confidence based on how many criteria are met
    let confidence = 0;
    if (energyDetection) confidence += 0.4;
    if (voiceDetection) confidence += 0.4;
    if (frequencyDetection) confidence += 0.2;
    
    // Calculate durations
    let speechDuration = 0;
    let silenceDuration = 0;
    
    if (smoothedDetection) {
      if (this.speechStartTime === 0) {
        this.speechStartTime = now;
      }
      speechDuration = now - this.speechStartTime;
      this.silenceStartTime = 0;
    } else {
      if (this.silenceStartTime === 0) {
        this.silenceStartTime = now;
      }
      silenceDuration = now - this.silenceStartTime;
      this.speechStartTime = 0;
    }
    
    return {
      isSpeaking: smoothedDetection,
      confidence,
      audioLevel,
      noiseLevel: this.currentState.noiseLevel,
      speechDuration,
      silenceDuration,
      timestamp: now
    };
  }

  private applyTemporalSmoothing(rawDetection: boolean, timestamp: number): boolean {
    // Apply minimum duration constraints
    if (rawDetection) {
      // Need minimum speech duration to register as speaking
      if (this.lastSpeechTime === 0) {
        this.lastSpeechTime = timestamp;
        return false; // Don't immediately switch to speaking
      }
      
      const speechDuration = timestamp - this.lastSpeechTime;
      if (speechDuration >= this.config.minSpeechDuration) {
        this.lastSilenceTime = 0;
        return true;
      }
      return this.currentState.isSpeaking; // Maintain current state
      
    } else {
      // Need minimum silence duration to stop speaking
      if (this.currentState.isSpeaking) {
        if (this.lastSilenceTime === 0) {
          this.lastSilenceTime = timestamp;
        }
        
        const silenceDuration = timestamp - this.lastSilenceTime;
        if (silenceDuration >= this.config.minSilenceDuration) {
          this.lastSpeechTime = 0;
          return false;
        }
        return true; // Maintain speaking state
      }
      
      this.lastSpeechTime = 0;
      return false;
    }
  }

  private updateState(newResult: VADResult): void {
    const previousSpeaking = this.currentState.isSpeaking;
    this.currentState = newResult;
    
    // Add to history
    this.history.push(newResult);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    }
    
    // Emit events on state changes
    if (previousSpeaking !== newResult.isSpeaking) {
      const eventType = newResult.isSpeaking ? 'speech_start' : 'speech_end';
      this.emit(eventType, { 
        type: eventType, 
        timestamp: newResult.timestamp, 
        data: newResult 
      });
      
      this.emit('speakingChanged', newResult.isSpeaking, newResult);
    }
    
    // Emit level change events
    this.emit('levelChange', newResult.audioLevel);
  }

  private startLevelMonitoring(): void {
    this.levelMonitorTimer = setInterval(() => {
      this.emit('statsUpdate', this.getStats());
    }, 100); // Update every 100ms
  }

  private stopLevelMonitoring(): void {
    if (this.levelMonitorTimer) {
      clearInterval(this.levelMonitorTimer);
      this.levelMonitorTimer = null;
    }
  }

  public getCurrentState(): VADResult {
    return { ...this.currentState };
  }

  public getHistory(): VADResult[] {
    return [...this.history];
  }

  public getStats(): {
    currentState: VADResult;
    averageLevel: number;
    peakLevel: number;
    speechTime: number;
    silenceTime: number;
  } {
    const recentHistory = this.history.slice(-10); // Last 1 second at 100ms intervals
    
    const averageLevel = recentHistory.length > 0 
      ? recentHistory.reduce((sum, result) => sum + result.audioLevel.rms, 0) / recentHistory.length
      : 0;
    
    const peakLevel = recentHistory.length > 0
      ? Math.max(...recentHistory.map(result => result.audioLevel.peak))
      : 0;
    
    // Calculate speech/silence ratios
    const speechFrames = recentHistory.filter(result => result.isSpeaking).length;
    const speechTime = (speechFrames / recentHistory.length) * 100;
    const silenceTime = 100 - speechTime;
    
    return {
      currentState: this.currentState,
      averageLevel,
      peakLevel,
      speechTime,
      silenceTime
    };
  }

  public updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('VAD configuration updated:', this.config);
    this.emit('configUpdated', this.config);
  }

  public calibrate(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Starting VAD calibration...');
      
      // Collect noise samples for 2 seconds
      let sampleCount = 0;
      const maxSamples = 20; // 2 seconds at 100ms intervals
      
      const calibrationTimer = setInterval(() => {
        sampleCount++;
        
        if (sampleCount >= maxSamples) {
          clearInterval(calibrationTimer);
          
          // Update thresholds based on collected noise profile
          const avgNoise = this.currentState.noiseLevel;
          this.config.energyThreshold = Math.max(0.01, avgNoise * 4);
          
          console.log('VAD calibration complete. New threshold:', this.config.energyThreshold);
          this.emit('calibrationComplete', this.config);
          resolve();
        }
      }, 100);
    });
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
          console.error(`Error in VAD event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    
    if (this.isRunning) {
      this.stop();
    }
    
    // Clear references
    this.audioContext = null;
    this.analyser = null;
    this.processorNode = null;
    this.frequencyData = null;
    this.timeData = null;
    this.noiseProfile = null;
    
    // Clear history and handlers
    this.history = [];
    this.eventHandlers.clear();
    
    console.log('Voice Activity Detector destroyed');
  }
}