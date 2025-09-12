import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Message, DirectMessage, Server, Channel, User } from '@/lib/types';

interface ChatState {
  // Current selection
  selectedServerId: string | null;
  selectedChannelId: string | null;
  selectedDmUserId: string | null;
  
  // Data
  servers: Record<string, Server>;
  channels: Record<string, Channel>;
  messages: Record<string, Message[]>; // channelId -> messages
  directMessages: Record<string, DirectMessage[]>; // userId -> messages
  users: Record<string, User>;
  
  // UI state
  typingUsers: Record<string, Set<string>>; // channelId -> Set of userIds
  messageCache: Record<string, Message>;
  dmCache: Record<string, DirectMessage>;
  unreadCounts: Record<string, number>; // channelId -> unread count
  scrollPositions: Record<string, number>; // channelId -> scroll position
  
  // Loading states
  isLoadingMessages: boolean;
  isLoadingServers: boolean;
  isConnecting: boolean;
}

interface ChatActions {
  // Selection actions
  selectServer: (serverId: string | null) => void;
  selectChannel: (channelId: string | null) => void;
  selectDM: (userId: string | null) => void;
  
  // Data actions
  setServers: (servers: Server[]) => void;
  addServer: (server: Server) => void;
  updateServer: (serverId: string, updates: Partial<Server>) => void;
  removeServer: (serverId: string) => void;
  
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;
  
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  
  // Message actions
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string, channelId: string) => void;
  prependMessages: (channelId: string, messages: Message[]) => void;
  
  // Direct message actions
  setDirectMessages: (userId: string, messages: DirectMessage[]) => void;
  addDirectMessage: (dm: DirectMessage) => void;
  updateDirectMessage: (dmId: string, updates: Partial<DirectMessage>) => void;
  removeDirectMessage: (dmId: string, userId: string) => void;
  
  // Typing actions
  setTyping: (channelId: string, userId: string, isTyping: boolean) => void;
  clearTyping: (channelId: string) => void;
  
  // UI actions
  markAsRead: (channelId: string) => void;
  setScrollPosition: (channelId: string, position: number) => void;
  setLoadingMessages: (loading: boolean) => void;
  setLoadingServers: (loading: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  
  // Utility actions
  reset: () => void;
  getChannelMessages: (channelId: string) => Message[];
  getUserDMs: (userId: string) => DirectMessage[];
  getCurrentChannel: () => Channel | null;
  getCurrentServer: () => Server | null;
}

const initialState: ChatState = {
  selectedServerId: null,
  selectedChannelId: null,
  selectedDmUserId: null,
  servers: {},
  channels: {},
  messages: {},
  directMessages: {},
  users: {},
  typingUsers: {},
  messageCache: {},
  dmCache: {},
  unreadCounts: {},
  scrollPositions: {},
  isLoadingMessages: false,
  isLoadingServers: false,
  isConnecting: false,
};

export const useChatStore = create<ChatState & ChatActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Selection actions
    selectServer: (serverId) => {
      set({ 
        selectedServerId: serverId,
        selectedChannelId: null,
        selectedDmUserId: null 
      });
    },

    selectChannel: (channelId) => {
      set({ 
        selectedChannelId: channelId,
        selectedDmUserId: null 
      });
      if (channelId) {
        get().markAsRead(channelId);
      }
    },

    selectDM: (userId) => {
      set({ 
        selectedDmUserId: userId,
        selectedServerId: null,
        selectedChannelId: null 
      });
    },

    // Server actions
    setServers: (servers) => {
      const serverMap = servers.reduce((acc, server) => {
        acc[server.id] = server;
        return acc;
      }, {} as Record<string, Server>);
      
      const channelMap = servers.reduce((acc, server) => {
        server.channels.forEach(channel => {
          acc[channel.id] = channel;
        });
        return acc;
      }, {} as Record<string, Channel>);
      
      set({ 
        servers: serverMap,
        channels: { ...get().channels, ...channelMap }
      });
    },

    addServer: (server) => {
      const channelMap = server.channels.reduce((acc, channel) => {
        acc[channel.id] = channel;
        return acc;
      }, {} as Record<string, Channel>);
      
      set(state => ({ 
        servers: { ...state.servers, [server.id]: server },
        channels: { ...state.channels, ...channelMap }
      }));
    },

    updateServer: (serverId, updates) => {
      set(state => ({
        servers: {
          ...state.servers,
          [serverId]: { ...state.servers[serverId], ...updates }
        }
      }));
    },

    removeServer: (serverId) => {
      set(state => {
        const { [serverId]: removed, ...servers } = state.servers;
        
        // Remove associated channels
        const channels = { ...state.channels };
        Object.keys(channels).forEach(channelId => {
          if (channels[channelId].serverId === serverId) {
            delete channels[channelId];
          }
        });
        
        return { 
          servers, 
          channels,
          selectedServerId: state.selectedServerId === serverId ? null : state.selectedServerId
        };
      });
    },

    // Channel actions
    setChannels: (channels) => {
      const channelMap = channels.reduce((acc, channel) => {
        acc[channel.id] = channel;
        return acc;
      }, {} as Record<string, Channel>);
      
      set({ channels: channelMap });
    },

    addChannel: (channel) => {
      set(state => ({ 
        channels: { ...state.channels, [channel.id]: channel }
      }));
    },

    updateChannel: (channelId, updates) => {
      set(state => ({
        channels: {
          ...state.channels,
          [channelId]: { ...state.channels[channelId], ...updates }
        }
      }));
    },

    removeChannel: (channelId) => {
      set(state => {
        const { [channelId]: removed, ...channels } = state.channels;
        return { 
          channels,
          selectedChannelId: state.selectedChannelId === channelId ? null : state.selectedChannelId
        };
      });
    },

    // User actions
    setUsers: (users) => {
      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, User>);
      
      set({ users: userMap });
    },

    addUser: (user) => {
      set(state => ({ 
        users: { ...state.users, [user.id]: user }
      }));
    },

    updateUser: (userId, updates) => {
      set(state => ({
        users: {
          ...state.users,
          [userId]: { ...state.users[userId], ...updates }
        }
      }));
    },

    // Message actions
    setMessages: (channelId, messages) => {
      set(state => ({
        messages: { ...state.messages, [channelId]: messages }
      }));
    },

    addMessage: (message) => {
      set(state => {
        const channelMessages = state.messages[message.channelId] || [];
        
        // Prevent duplicates
        const existingIndex = channelMessages.findIndex(m => m.id === message.id);
        if (existingIndex !== -1) {
          channelMessages[existingIndex] = message;
          return {
            messages: { ...state.messages, [message.channelId]: [...channelMessages] },
            messageCache: { ...state.messageCache, [message.id]: message }
          };
        }
        
        return {
          messages: { 
            ...state.messages, 
            [message.channelId]: [...channelMessages, message] 
          },
          messageCache: { ...state.messageCache, [message.id]: message }
        };
      });
    },

    updateMessage: (messageId, updates) => {
      set(state => {
        const message = state.messageCache[messageId];
        if (!message) return state;
        
        const updatedMessage = { ...message, ...updates };
        const channelMessages = state.messages[message.channelId] || [];
        const messageIndex = channelMessages.findIndex(m => m.id === messageId);
        
        if (messageIndex === -1) return state;
        
        const newMessages = [...channelMessages];
        newMessages[messageIndex] = updatedMessage;
        
        return {
          messages: { ...state.messages, [message.channelId]: newMessages },
          messageCache: { ...state.messageCache, [messageId]: updatedMessage }
        };
      });
    },

    removeMessage: (messageId, channelId) => {
      set(state => {
        const channelMessages = state.messages[channelId] || [];
        const filteredMessages = channelMessages.filter(m => m.id !== messageId);
        
        const { [messageId]: removed, ...messageCache } = state.messageCache;
        
        return {
          messages: { ...state.messages, [channelId]: filteredMessages },
          messageCache
        };
      });
    },

    prependMessages: (channelId, messages) => {
      set(state => {
        const existingMessages = state.messages[channelId] || [];
        const newMessageCache = { ...state.messageCache };
        
        messages.forEach(message => {
          newMessageCache[message.id] = message;
        });
        
        return {
          messages: { 
            ...state.messages, 
            [channelId]: [...messages, ...existingMessages] 
          },
          messageCache: newMessageCache
        };
      });
    },

    // Direct message actions
    setDirectMessages: (userId, messages) => {
      set(state => ({
        directMessages: { ...state.directMessages, [userId]: messages }
      }));
    },

    addDirectMessage: (dm) => {
      const partnerId = dm.authorId === get().selectedDmUserId ? dm.recipientId : dm.authorId;
      
      set(state => {
        const userDMs = state.directMessages[partnerId] || [];
        
        // Prevent duplicates
        const existingIndex = userDMs.findIndex(d => d.id === dm.id);
        if (existingIndex !== -1) {
          userDMs[existingIndex] = dm;
          return {
            directMessages: { ...state.directMessages, [partnerId]: [...userDMs] },
            dmCache: { ...state.dmCache, [dm.id]: dm }
          };
        }
        
        return {
          directMessages: { 
            ...state.directMessages, 
            [partnerId]: [...userDMs, dm] 
          },
          dmCache: { ...state.dmCache, [dm.id]: dm }
        };
      });
    },

    updateDirectMessage: (dmId, updates) => {
      set(state => {
        const dm = state.dmCache[dmId];
        if (!dm) return state;
        
        const updatedDM = { ...dm, ...updates };
        const partnerId = dm.authorId === get().selectedDmUserId ? dm.recipientId : dm.authorId;
        const userDMs = state.directMessages[partnerId] || [];
        const dmIndex = userDMs.findIndex(d => d.id === dmId);
        
        if (dmIndex === -1) return state;
        
        const newDMs = [...userDMs];
        newDMs[dmIndex] = updatedDM;
        
        return {
          directMessages: { ...state.directMessages, [partnerId]: newDMs },
          dmCache: { ...state.dmCache, [dmId]: updatedDM }
        };
      });
    },

    removeDirectMessage: (dmId, userId) => {
      set(state => {
        const userDMs = state.directMessages[userId] || [];
        const filteredDMs = userDMs.filter(d => d.id !== dmId);
        
        const { [dmId]: removed, ...dmCache } = state.dmCache;
        
        return {
          directMessages: { ...state.directMessages, [userId]: filteredDMs },
          dmCache
        };
      });
    },

    // Typing actions
    setTyping: (channelId, userId, isTyping) => {
      set(state => {
        const channelTyping = new Set(state.typingUsers[channelId] || []);
        
        if (isTyping) {
          channelTyping.add(userId);
        } else {
          channelTyping.delete(userId);
        }
        
        return {
          typingUsers: { ...state.typingUsers, [channelId]: channelTyping }
        };
      });
    },

    clearTyping: (channelId) => {
      set(state => {
        const { [channelId]: removed, ...typingUsers } = state.typingUsers;
        return { typingUsers };
      });
    },

    // UI actions
    markAsRead: (channelId) => {
      set(state => ({
        unreadCounts: { ...state.unreadCounts, [channelId]: 0 }
      }));
    },

    setScrollPosition: (channelId, position) => {
      set(state => ({
        scrollPositions: { ...state.scrollPositions, [channelId]: position }
      }));
    },

    setLoadingMessages: (loading) => {
      set({ isLoadingMessages: loading });
    },

    setLoadingServers: (loading) => {
      set({ isLoadingServers: loading });
    },

    setConnecting: (connecting) => {
      set({ isConnecting: connecting });
    },

    // Utility actions
    reset: () => {
      set(initialState);
    },

    getChannelMessages: (channelId) => {
      return get().messages[channelId] || [];
    },

    getUserDMs: (userId) => {
      return get().directMessages[userId] || [];
    },

    getCurrentChannel: () => {
      const { selectedChannelId, channels } = get();
      return selectedChannelId ? channels[selectedChannelId] || null : null;
    },

    getCurrentServer: () => {
      const { selectedServerId, servers } = get();
      return selectedServerId ? servers[selectedServerId] || null : null;
    },
  }))
);