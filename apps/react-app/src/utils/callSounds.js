// Professional call sound effects and haptic feedback utility

class CallSoundManager {
  constructor() {
    this.audioContext = null
    this.sounds = new Map()
    this.isEnabled = true
    this.volume = 0.7
    
    // Initialize audio context lazily
    this.initAudioContext()
    
    // Load sound configurations
    this.soundConfigs = {
      // Call connection sounds
      calling: {
        frequency: 440,
        duration: 1000,
        type: 'sine',
        pattern: [0.5, 0.5], // Ring pattern
        repeat: true
      },
      
      connected: {
        frequencies: [523.25, 659.25, 783.99], // C-E-G chord
        duration: 500,
        type: 'sine',
        gain: 0.3
      },
      
      disconnected: {
        frequencies: [392, 293.66], // G-D descending
        duration: 800,
        type: 'sine',
        gain: 0.4
      },
      
      // UI interaction sounds
      buttonClick: {
        frequency: 800,
        duration: 50,
        type: 'square',
        gain: 0.2
      },
      
      toggleOn: {
        frequencies: [440, 880], // Ascending
        duration: 100,
        type: 'sine',
        gain: 0.3
      },
      
      toggleOff: {
        frequencies: [880, 440], // Descending
        duration: 100,
        type: 'sine',
        gain: 0.3
      },
      
      // Notification sounds
      participantJoined: {
        frequencies: [523.25, 659.25], // C-E
        duration: 300,
        type: 'sine',
        gain: 0.25
      },
      
      participantLeft: {
        frequencies: [659.25, 523.25], // E-C
        duration: 300,
        type: 'sine',
        gain: 0.25
      },
      
      messageReceived: {
        frequency: 1000,
        duration: 150,
        type: 'sine',
        gain: 0.2
      },
      
      screenShareStarted: {
        frequencies: [440, 554.37, 659.25], // A-C#-E
        duration: 400,
        type: 'sine',
        gain: 0.3
      },
      
      screenShareStopped: {
        frequencies: [659.25, 554.37, 440], // E-C#-A
        duration: 400,
        type: 'sine',
        gain: 0.3
      },
      
      // Error/warning sounds
      error: {
        frequency: 200,
        duration: 500,
        type: 'sawtooth',
        gain: 0.4
      },
      
      warning: {
        frequency: 800,
        duration: 200,
        type: 'triangle',
        gain: 0.3,
        pattern: [0.2, 0.1, 0.2]
      },
      
      // Quality indicators
      qualityGood: {
        frequency: 1200,
        duration: 100,
        type: 'sine',
        gain: 0.15
      },
      
      qualityPoor: {
        frequency: 300,
        duration: 200,
        type: 'triangle',
        gain: 0.25
      }
    }
  }

  async initAudioContext() {
    try {
      // Create audio context on first user interaction
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
    } catch (error) {
      this.isEnabled = false
    }
  }

  async playSound(soundName, options = {}) {
    if (!this.isEnabled || !this.audioContext) {
      return
    }

    try {
      await this.initAudioContext()
      
      const config = { ...this.soundConfigs[soundName], ...options }
      if (!config) {
        return
      }

      if (config.frequencies && Array.isArray(config.frequencies)) {
        // Play chord or sequence
        this.playChord(config)
      } else if (config.pattern) {
        // Play pattern (like ringing)
        this.playPattern(config)
      } else {
        // Play single tone
        this.playTone(config)
      }
    } catch (error) {
    }
  }

  playTone(config) {
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(config.frequency || 440, this.audioContext.currentTime)
    oscillator.type = config.type || 'sine'
    
    const volume = (config.gain || 0.5) * this.volume
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (config.duration / 1000) - 0.01)
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + (config.duration / 1000))
  }

  playChord(config) {
    config.frequencies.forEach((frequency, index) => {
      const delay = index * 0.05 // Slight delay for chord effect
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime + delay)
      oscillator.type = config.type || 'sine'
      
      const volume = ((config.gain || 0.5) * this.volume) / config.frequencies.length
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + delay + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + (config.duration / 1000) - 0.01)
      
      oscillator.start(this.audioContext.currentTime + delay)
      oscillator.stop(this.audioContext.currentTime + delay + (config.duration / 1000))
    })
  }

  playPattern(config) {
    let currentTime = this.audioContext.currentTime
    const totalDuration = config.duration / 1000
    const patternDuration = config.pattern.reduce((sum, duration) => sum + duration, 0)
    const repetitions = Math.floor(totalDuration / patternDuration)
    
    for (let rep = 0; rep < repetitions; rep++) {
      config.pattern.forEach((duration, index) => {
        if (index % 2 === 0) { // Play sound on even indices
          const oscillator = this.audioContext.createOscillator()
          const gainNode = this.audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(this.audioContext.destination)
          
          oscillator.frequency.setValueAtTime(config.frequency || 440, currentTime)
          oscillator.type = config.type || 'sine'
          
          const volume = (config.gain || 0.5) * this.volume
          gainNode.gain.setValueAtTime(volume, currentTime)
          
          oscillator.start(currentTime)
          oscillator.stop(currentTime + duration)
        }
        currentTime += duration
      })
    }
  }

  // Haptic feedback methods
  vibrate(pattern = [100]) {
    if ('vibrate' in navigator && Array.isArray(pattern)) {
      try {
        navigator.vibrate(pattern)
      } catch (error) {
      }
    }
  }

  // Predefined haptic patterns
  hapticFeedback = {
    buttonPress: () => this.vibrate([10]),
    toggle: () => this.vibrate([20, 10, 20]),
    error: () => this.vibrate([200, 100, 200]),
    success: () => this.vibrate([50, 25, 50]),
    notification: () => this.vibrate([100, 50, 100, 50, 100]),
    callIncoming: () => this.vibrate([300, 200, 300, 200, 300]),
    callConnected: () => this.vibrate([100]),
    callDisconnected: () => this.vibrate([200])
  }

  // High-level call event methods
  callEvents = {
    startCalling: () => {
      this.playSound('calling')
      this.hapticFeedback.callIncoming()
    },
    
    callConnected: () => {
      this.playSound('connected')
      this.hapticFeedback.callConnected()
    },
    
    callDisconnected: () => {
      this.playSound('disconnected')
      this.hapticFeedback.callDisconnected()
    },
    
    participantJoined: () => {
      this.playSound('participantJoined')
      this.hapticFeedback.notification()
    },
    
    participantLeft: () => {
      this.playSound('participantLeft')
      this.hapticFeedback.notification()
    },
    
    muteToggle: (isMuted) => {
      this.playSound(isMuted ? 'toggleOff' : 'toggleOn')
      this.hapticFeedback.toggle()
    },
    
    videoToggle: (isEnabled) => {
      this.playSound(isEnabled ? 'toggleOn' : 'toggleOff')
      this.hapticFeedback.toggle()
    },
    
    screenShareStart: () => {
      this.playSound('screenShareStarted')
      this.hapticFeedback.success()
    },
    
    screenShareStop: () => {
      this.playSound('screenShareStopped')
      this.hapticFeedback.success()
    },
    
    buttonClick: () => {
      this.playSound('buttonClick')
      this.hapticFeedback.buttonPress()
    },
    
    error: () => {
      this.playSound('error')
      this.hapticFeedback.error()
    },
    
    qualityChange: (quality) => {
      if (quality === 'poor') {
        this.playSound('qualityPoor')
      } else if (quality === 'excellent') {
        this.playSound('qualityGood')
      }
    }
  }

  // Settings methods
  setEnabled(enabled) {
    this.isEnabled = enabled
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  getSettings() {
    return {
      isEnabled: this.isEnabled,
      volume: this.volume
    }
  }

  // Initialize on first user interaction
  async enable() {
    try {
      await this.initAudioContext()
      this.setEnabled(true)
      
      // Play a quiet test sound to ensure audio is working
      this.playSound('buttonClick', { gain: 0.1 })
      
      return true
    } catch (error) {
      return false
    }
  }
}

// Create singleton instance
const callSoundManager = new CallSoundManager()

// Export both the class and singleton
export { CallSoundManager }
export default callSoundManager