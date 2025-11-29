import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Navigation
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Modals
  activeModal: string | null;
  modalData: any;
  
  // Loading states
  pageLoading: boolean;
  componentLoading: Record<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Theme and layout
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  
  // Performance
  reduceMotion: boolean;
  enableAnimations: boolean;
  
  // Chat/Voice
  selectedChannelId: string | null;
  voiceChannelId: string | null;
  mutedChannels: string[];
  
  // Search
  searchQuery: string;
  searchFilters: Record<string, any>;
  recentSearches: string[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface UIActions {
  // Navigation
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Modals
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
  // Loading
  setPageLoading: (loading: boolean) => void;
  setComponentLoading: (componentId: string, loading: boolean) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Theme and layout
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCompactMode: (compact: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Performance
  setReduceMotion: (reduce: boolean) => void;
  setEnableAnimations: (enable: boolean) => void;
  
  // Chat/Voice
  setSelectedChannel: (channelId: string | null) => void;
  setVoiceChannel: (channelId: string | null) => void;
  muteChannel: (channelId: string) => void;
  unmuteChannel: (channelId: string) => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  setSearchFilters: (filters: Record<string, any>) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarOpen: true,
  mobileMenuOpen: false,
  activeModal: null,
  modalData: null,
  pageLoading: false,
  componentLoading: {},
  notifications: [],
  unreadCount: 0,
  theme: 'system',
  compactMode: false,
  fontSize: 'medium',
  reduceMotion: false,
  enableAnimations: true,
  selectedChannelId: null,
  voiceChannelId: null,
  mutedChannels: [],
  searchQuery: '',
  searchFilters: {},
  recentSearches: [],
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setMobileMenuOpen: (mobileMenuOpen: boolean) => set({ mobileMenuOpen }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Modals
      openModal: (activeModal: string, modalData?: any) => set({ activeModal, modalData }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Loading
      setPageLoading: (pageLoading: boolean) => set({ pageLoading }),
      setComponentLoading: (componentId: string, loading: boolean) =>
        set((state) => ({
          componentLoading: {
            ...state.componentLoading,
            [componentId]: loading,
          },
        })),

      // Notifications
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      removeNotification: (id: string) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read 
              ? state.unreadCount - 1 
              : state.unreadCount,
          };
        }),

      markNotificationRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: state.notifications.find((n) => n.id === id && !n.read)
            ? state.unreadCount - 1
            : state.unreadCount,
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // Theme and layout
      setTheme: (theme) => set({ theme }),
      setCompactMode: (compactMode) => set({ compactMode }),
      setFontSize: (fontSize) => set({ fontSize }),

      // Performance
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setEnableAnimations: (enableAnimations) => set({ enableAnimations }),

      // Chat/Voice
      setSelectedChannel: (selectedChannelId) => set({ selectedChannelId }),
      setVoiceChannel: (voiceChannelId) => set({ voiceChannelId }),
      muteChannel: (channelId) =>
        set((state) => ({
          mutedChannels: [...state.mutedChannels, channelId],
        })),
      unmuteChannel: (channelId) =>
        set((state) => ({
          mutedChannels: state.mutedChannels.filter((id) => id !== channelId),
        })),

      // Search
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSearchFilters: (searchFilters) => set({ searchFilters }),
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((q) => q !== query),
          ].slice(0, 10), // Keep only last 10
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        compactMode: state.compactMode,
        fontSize: state.fontSize,
        reduceMotion: state.reduceMotion,
        enableAnimations: state.enableAnimations,
        mutedChannels: state.mutedChannels,
        recentSearches: state.recentSearches,
      }),
    }
  )
);