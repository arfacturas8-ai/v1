import { create } from 'zustand';
import { SimpleVoiceManager, ConnectionStatus, SimpleVoiceParticipant } from '../voice/simple-voice-manager';

interface SimpleVoiceState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  currentChannelId: string | null;
  status: ConnectionStatus;
  
  // Audio state
  isMuted: boolean;
  volume: number;
  
  // Participants
  participants: SimpleVoiceParticipant[];
  
  // Error state
  error: string | null;
}

interface SimpleVoiceActions {
  // Connection actions
  connect: (channelId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Audio actions
  toggleMute: () => Promise<void>;
  setVolume: (volume: number) => void;
  
  // Auth
  setAuth: (token: string, userId: string) => void;
  
  // Internal state management
  setStatus: (status: ConnectionStatus) => void;
  setParticipants: (participants: SimpleVoiceParticipant[]) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: SimpleVoiceState = {
  isConnected: false,
  isConnecting: false,
  currentChannelId: null,
  status: ConnectionStatus.DISCONNECTED,
  isMuted: true,
  volume: 100,
  participants: [],
  error: null,
};

// Global voice manager instance
let voiceManager: SimpleVoiceManager | null = null;

const initializeVoiceManager = () => {
  if (!voiceManager) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    voiceManager = new SimpleVoiceManager(apiBaseUrl);
  }
  return voiceManager;
};

export const useSimpleVoiceStore = create<SimpleVoiceState & SimpleVoiceActions>()((set, get) => ({
  ...initialState,

  connect: async (channelId: string) => {
    try {
      const manager = initializeVoiceManager();
      
      set({ 
        isConnecting: true, 
        currentChannelId: channelId,
        error: null 
      });

      // Set up event handlers
      manager.on('statusChanged', (status) => {
        get().setStatus(status);
      });

      manager.on('error', (error) => {
        get().setError(error.message);
        set({ isConnecting: false });
      });

      manager.on('participantJoined', (participant) => {
        const currentParticipants = get().participants;
        const existingIndex = currentParticipants.findIndex(p => p.sid === participant.sid);
        
        if (existingIndex === -1) {
          set({ participants: [...currentParticipants, participant] });
        }
      });

      manager.on('participantLeft', (participant) => {
        const currentParticipants = get().participants;
        set({ 
          participants: currentParticipants.filter(p => p.sid !== participant.sid)
        });
      });

      manager.on('participantUpdated', (participant) => {
        const currentParticipants = get().participants;
        const updatedParticipants = currentParticipants.map(p => 
          p.sid === participant.sid ? participant : p
        );
        set({ participants: updatedParticipants });
      });

      // Connect to voice channel
      await manager.connect(channelId);
      
      // Update mute status based on actual state
      set({ isMuted: manager.isMuted() });

    } catch (error) {
      console.error('Voice connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      set({ 
        error: errorMessage,
        isConnecting: false,
        currentChannelId: null
      });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      if (voiceManager) {
        await voiceManager.disconnect();
      }
      
      set({
        isConnected: false,
        isConnecting: false,
        currentChannelId: null,
        participants: [],
        error: null
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      // Force reset state even if disconnect fails
      get().reset();
    }
  },

  toggleMute: async () => {
    try {
      if (voiceManager) {
        await voiceManager.toggleMute();
        set({ isMuted: voiceManager.isMuted() });
      }
    } catch (error) {
      console.error('Toggle mute failed:', error);
      get().setError('Failed to toggle microphone');
    }
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(200, volume)) });
  },

  setAuth: (token: string, userId: string) => {
    const manager = initializeVoiceManager();
    manager.setAuth(token, userId);
  },

  setStatus: (status: ConnectionStatus) => {
    set({ 
      status,
      isConnected: status === ConnectionStatus.CONNECTED,
      isConnecting: status === ConnectionStatus.CONNECTING
    });
  },

  setParticipants: (participants: SimpleVoiceParticipant[]) => {
    set({ participants });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  reset: () => {
    if (voiceManager) {
      voiceManager.destroy();
      voiceManager = null;
    }
    set({ ...initialState });
  },
}));