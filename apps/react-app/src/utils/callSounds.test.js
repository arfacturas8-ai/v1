/**
 * Tests for callSounds utility
 */
import { CallSoundManager } from './callSounds';
import callSoundManager from './callSounds';

describe('CallSoundManager', () => {
  let mockAudioContext;
  let mockOscillator;
  let mockGainNode;

  beforeEach(() => {
    // Mock Web Audio API
    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: {
        setValueAtTime: jest.fn()
      },
      type: 'sine'
    };

    mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn()
      }
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGainNode),
      resume: jest.fn().mockResolvedValue(undefined)
    };

    global.AudioContext = jest.fn(() => mockAudioContext);
    global.webkitAudioContext = jest.fn(() => mockAudioContext);

    // Mock navigator.vibrate
    global.navigator.vibrate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('initializes with default settings', () => {
      const manager = new CallSoundManager();

      expect(manager.isEnabled).toBe(true);
      expect(manager.volume).toBe(0.7);
      expect(manager.sounds).toBeInstanceOf(Map);
    });

    it('creates sound configurations', () => {
      const manager = new CallSoundManager();

      expect(manager.soundConfigs.calling).toBeDefined();
      expect(manager.soundConfigs.connected).toBeDefined();
      expect(manager.soundConfigs.disconnected).toBeDefined();
      expect(manager.soundConfigs.buttonClick).toBeDefined();
    });

    it('initializes audio context', () => {
      const manager = new CallSoundManager();

      expect(global.AudioContext).toHaveBeenCalled();
    });
  });

  describe('initAudioContext', () => {
    it('creates audio context if not exists', async () => {
      const manager = new CallSoundManager();
      manager.audioContext = null;

      await manager.initAudioContext();

      expect(manager.audioContext).toBeTruthy();
    });

    it('resumes suspended audio context', async () => {
      mockAudioContext.state = 'suspended';
      const manager = new CallSoundManager();

      await manager.initAudioContext();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('disables manager on error', async () => {
      global.AudioContext = jest.fn(() => {
        throw new Error('Audio not supported');
      });

      const manager = new CallSoundManager();
      await manager.initAudioContext();

      expect(manager.isEnabled).toBe(false);
    });
  });

  describe('playSound', () => {
    it('plays sound when enabled', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playTone').mockImplementation(() => {});

      await manager.playSound('buttonClick');

      expect(manager.playTone).toHaveBeenCalled();
    });

    it('does not play when disabled', async () => {
      const manager = new CallSoundManager();
      manager.isEnabled = false;
      jest.spyOn(manager, 'playTone').mockImplementation(() => {});

      await manager.playSound('buttonClick');

      expect(manager.playTone).not.toHaveBeenCalled();
    });

    it('plays chord for multi-frequency sounds', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playChord').mockImplementation(() => {});

      await manager.playSound('connected');

      expect(manager.playChord).toHaveBeenCalled();
    });

    it('plays pattern for patterned sounds', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playPattern').mockImplementation(() => {});

      await manager.playSound('calling');

      expect(manager.playPattern).toHaveBeenCalled();
    });

    it('handles non-existent sounds gracefully', async () => {
      const manager = new CallSoundManager();

      await expect(manager.playSound('nonexistent')).resolves.not.toThrow();
    });

    it('passes custom options', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playTone').mockImplementation(() => {});

      await manager.playSound('buttonClick', { gain: 0.5 });

      expect(manager.playTone).toHaveBeenCalledWith(
        expect.objectContaining({ gain: 0.5 })
      );
    });
  });

  describe('playTone', () => {
    it('creates oscillator and gain node', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 440, duration: 100, type: 'sine' });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('connects nodes properly', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 440, duration: 100 });

      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('sets frequency', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 880, duration: 100 });

      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        880,
        expect.any(Number)
      );
    });

    it('sets oscillator type', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 440, duration: 100, type: 'square' });

      expect(mockOscillator.type).toBe('square');
    });

    it('applies volume and gain', () => {
      const manager = new CallSoundManager();
      manager.volume = 0.8;

      manager.playTone({ frequency: 440, duration: 100, gain: 0.5 });

      // Volume applied: 0.5 * 0.8 = 0.4
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.4,
        expect.any(Number)
      );
    });

    it('starts and stops oscillator', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 440, duration: 100 });

      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });
  });

  describe('playChord', () => {
    it('creates oscillator for each frequency', () => {
      const manager = new CallSoundManager();

      manager.playChord({
        frequencies: [440, 550, 660],
        duration: 500,
        type: 'sine'
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('sets different frequencies', () => {
      const manager = new CallSoundManager();

      manager.playChord({
        frequencies: [440, 550, 660],
        duration: 500
      });

      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
        440,
        expect.any(Number)
      );
    });

    it('reduces volume per frequency', () => {
      const manager = new CallSoundManager();
      manager.volume = 0.7;

      manager.playChord({
        frequencies: [440, 550, 660],
        duration: 500,
        gain: 0.6
      });

      // Volume per oscillator: (0.6 * 0.7) / 3 = 0.14
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.14,
        expect.any(Number)
      );
    });
  });

  describe('playPattern', () => {
    it('creates oscillators based on pattern', () => {
      const manager = new CallSoundManager();

      manager.playPattern({
        frequency: 440,
        duration: 1000,
        pattern: [0.5, 0.5],
        type: 'sine'
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('respects pattern timing', () => {
      const manager = new CallSoundManager();

      manager.playPattern({
        frequency: 440,
        duration: 2000,
        pattern: [0.5, 0.5, 0.5, 0.5]
      });

      // Should create oscillators for even pattern indices
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('vibrate', () => {
    it('triggers vibration with pattern', () => {
      const manager = new CallSoundManager();

      manager.vibrate([100, 50, 100]);

      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('handles missing vibration support', () => {
      global.navigator.vibrate = undefined;
      const manager = new CallSoundManager();

      expect(() => {
        manager.vibrate([100]);
      }).not.toThrow();
    });

    it('handles vibration errors gracefully', () => {
      global.navigator.vibrate = jest.fn(() => {
        throw new Error('Vibration failed');
      });
      const manager = new CallSoundManager();

      expect(() => {
        manager.vibrate([100]);
      }).not.toThrow();
    });
  });

  describe('hapticFeedback', () => {
    it('provides button press feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.buttonPress();

      expect(navigator.vibrate).toHaveBeenCalledWith([10]);
    });

    it('provides toggle feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.toggle();

      expect(navigator.vibrate).toHaveBeenCalledWith([20, 10, 20]);
    });

    it('provides error feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.error();

      expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
    });

    it('provides success feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.success();

      expect(navigator.vibrate).toHaveBeenCalledWith([50, 25, 50]);
    });

    it('provides notification feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.notification();

      expect(navigator.vibrate).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
    });

    it('provides call incoming feedback', () => {
      const manager = new CallSoundManager();

      manager.hapticFeedback.callIncoming();

      expect(navigator.vibrate).toHaveBeenCalledWith([300, 200, 300, 200, 300]);
    });
  });

  describe('callEvents', () => {
    it('handles call connected', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.callConnected();

      expect(manager.playSound).toHaveBeenCalledWith('connected');
      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('handles call disconnected', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.callDisconnected();

      expect(manager.playSound).toHaveBeenCalledWith('disconnected');
    });

    it('handles participant joined', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.participantJoined();

      expect(manager.playSound).toHaveBeenCalledWith('participantJoined');
    });

    it('handles participant left', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.participantLeft();

      expect(manager.playSound).toHaveBeenCalledWith('participantLeft');
    });

    it('handles mute toggle on', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.muteToggle(false);

      expect(manager.playSound).toHaveBeenCalledWith('toggleOn');
    });

    it('handles mute toggle off', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.muteToggle(true);

      expect(manager.playSound).toHaveBeenCalledWith('toggleOff');
    });

    it('handles video toggle', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.videoToggle(true);

      expect(manager.playSound).toHaveBeenCalledWith('toggleOn');
    });

    it('handles screen share start', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.screenShareStart();

      expect(manager.playSound).toHaveBeenCalledWith('screenShareStarted');
    });

    it('handles screen share stop', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.screenShareStop();

      expect(manager.playSound).toHaveBeenCalledWith('screenShareStopped');
    });

    it('handles button click', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.buttonClick();

      expect(manager.playSound).toHaveBeenCalledWith('buttonClick');
    });

    it('handles error event', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.error();

      expect(manager.playSound).toHaveBeenCalledWith('error');
    });

    it('handles quality change to poor', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.qualityChange('poor');

      expect(manager.playSound).toHaveBeenCalledWith('qualityPoor');
    });

    it('handles quality change to excellent', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.qualityChange('excellent');

      expect(manager.playSound).toHaveBeenCalledWith('qualityGood');
    });

    it('ignores quality change for other levels', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      manager.callEvents.qualityChange('moderate');

      expect(manager.playSound).not.toHaveBeenCalled();
    });
  });

  describe('Settings', () => {
    it('sets enabled state', () => {
      const manager = new CallSoundManager();

      manager.setEnabled(false);

      expect(manager.isEnabled).toBe(false);
    });

    it('sets volume within bounds', () => {
      const manager = new CallSoundManager();

      manager.setVolume(0.5);

      expect(manager.volume).toBe(0.5);
    });

    it('clamps volume to maximum 1.0', () => {
      const manager = new CallSoundManager();

      manager.setVolume(1.5);

      expect(manager.volume).toBe(1.0);
    });

    it('clamps volume to minimum 0.0', () => {
      const manager = new CallSoundManager();

      manager.setVolume(-0.5);

      expect(manager.volume).toBe(0.0);
    });

    it('returns settings', () => {
      const manager = new CallSoundManager();
      manager.setEnabled(false);
      manager.setVolume(0.5);

      const settings = manager.getSettings();

      expect(settings.isEnabled).toBe(false);
      expect(settings.volume).toBe(0.5);
    });
  });

  describe('enable', () => {
    it('initializes audio context and enables manager', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      const result = await manager.enable();

      expect(result).toBe(true);
      expect(manager.isEnabled).toBe(true);
    });

    it('plays test sound', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'playSound').mockImplementation(() => {});

      await manager.enable();

      expect(manager.playSound).toHaveBeenCalledWith('buttonClick', { gain: 0.1 });
    });

    it('returns false on error', async () => {
      const manager = new CallSoundManager();
      jest.spyOn(manager, 'initAudioContext').mockRejectedValue(new Error('Failed'));

      const result = await manager.enable();

      expect(result).toBe(false);
    });
  });

  describe('Singleton Instance', () => {
    it('exports singleton instance', () => {
      expect(callSoundManager).toBeInstanceOf(CallSoundManager);
    });

    it('singleton has all methods', () => {
      expect(callSoundManager.playSound).toBeInstanceOf(Function);
      expect(callSoundManager.setEnabled).toBeInstanceOf(Function);
      expect(callSoundManager.setVolume).toBeInstanceOf(Function);
      expect(callSoundManager.enable).toBeInstanceOf(Function);
    });
  });

  describe('Edge Cases', () => {
    it('handles audio context creation failure', () => {
      global.AudioContext = undefined;
      global.webkitAudioContext = undefined;

      expect(() => {
        new CallSoundManager();
      }).not.toThrow();
    });

    it('handles empty pattern', () => {
      const manager = new CallSoundManager();

      expect(() => {
        manager.playPattern({ frequency: 440, duration: 1000, pattern: [] });
      }).not.toThrow();
    });

    it('handles zero duration', () => {
      const manager = new CallSoundManager();

      manager.playTone({ frequency: 440, duration: 0 });

      expect(mockOscillator.start).toHaveBeenCalled();
    });
  });
});
