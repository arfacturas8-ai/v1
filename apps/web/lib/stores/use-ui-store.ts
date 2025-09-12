import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, NotificationType } from '@/lib/types';

interface UIState {
  // Layout state
  sidebarCollapsed: boolean;
  userListCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  
  // Modal and overlay state
  activeModal: string | null;
  modalData: Record<string, any>;
  activeOverlay: string | null;
  overlayData: Record<string, any>;
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  messageGrouping: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadNotifications: number;
  notificationSettings: {
    desktop: boolean;
    sound: boolean;
    mentions: boolean;
    dms: boolean;
  };
  
  // Search
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  searchFilters: {
    users: boolean;
    channels: boolean;
    messages: boolean;
    servers: boolean;
  };
  
  // Mobile/responsive
  isMobile: boolean;
  showMobileMenu: boolean;
  
  // Status and loading
  isOnline: boolean;
  lastActivity: Date;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  
  // Settings panels
  showSettings: boolean;
  activeSettingsTab: string;
  showUserProfile: boolean;
  profileUserId: string | null;
  
  // Error handling
  globalError: string | null;
  errorDetails: any;
}

interface UIActions {
  // Layout actions
  toggleSidebar: () => void;
  toggleUserList: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setUserListCollapsed: (collapsed: boolean) => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  setModalData: (data: any) => void;
  openOverlay: (overlayId: string, data?: any) => void;
  closeOverlay: () => void;
  setOverlayData: (data: any) => void;
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleMessageGrouping: () => void;
  toggleTimestamps: () => void;
  toggleCompactMode: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  updateNotificationSettings: (settings: Partial<UIState['notificationSettings']>) => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setSearching: (searching: boolean) => void;
  updateSearchFilters: (filters: Partial<UIState['searchFilters']>) => void;
  clearSearch: () => void;
  
  // Mobile actions
  setIsMobile: (mobile: boolean) => void;
  toggleMobileMenu: () => void;
  setShowMobileMenu: (show: boolean) => void;
  
  // Status actions
  setOnline: (online: boolean) => void;
  updateActivity: () => void;
  setConnectionStatus: (status: UIState['connectionStatus']) => void;
  
  // Settings actions
  openSettings: (tab?: string) => void;
  closeSettings: () => void;
  setActiveSettingsTab: (tab: string) => void;
  openUserProfile: (userId: string) => void;
  closeUserProfile: () => void;
  
  // Error actions
  setGlobalError: (error: string | null, details?: any) => void;
  clearGlobalError: () => void;
  
  // Utility actions
  reset: () => void;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  userListCollapsed: false,
  leftPanelWidth: 240,
  rightPanelWidth: 240,
  activeModal: null,
  modalData: {},
  activeOverlay: null,
  overlayData: {},
  theme: 'dark',
  fontSize: 'medium',
  messageGrouping: true,
  showTimestamps: false,
  compactMode: false,
  notifications: [],
  unreadNotifications: 0,
  notificationSettings: {
    desktop: true,
    sound: true,
    mentions: true,
    dms: true,
  },
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  searchFilters: {
    users: true,
    channels: true,
    messages: true,
    servers: true,
  },
  isMobile: false,
  showMobileMenu: false,
  isOnline: true,
  lastActivity: new Date(),
  connectionStatus: 'disconnected',
  showSettings: false,
  activeSettingsTab: 'account',
  showUserProfile: false,
  profileUserId: null,
  globalError: null,
  errorDetails: null,
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Layout actions
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      toggleUserList: () => {
        set(state => ({ userListCollapsed: !state.userListCollapsed }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      setUserListCollapsed: (collapsed) => {
        set({ userListCollapsed: collapsed });
      },

      setLeftPanelWidth: (width) => {
        set({ leftPanelWidth: Math.max(200, Math.min(400, width)) });
      },

      setRightPanelWidth: (width) => {
        set({ rightPanelWidth: Math.max(200, Math.min(400, width)) });
      },

      // Modal actions
      openModal: (modalId, data = {}) => {
        set({ 
          activeModal: modalId, 
          modalData: data,
          showMobileMenu: false // Close mobile menu when opening modal
        });
      },

      closeModal: () => {
        set({ 
          activeModal: null, 
          modalData: {} 
        });
      },

      setModalData: (data) => {
        set({ modalData: data });
      },

      openOverlay: (overlayId, data = {}) => {
        set({ 
          activeOverlay: overlayId, 
          overlayData: data 
        });
      },

      closeOverlay: () => {
        set({ 
          activeOverlay: null, 
          overlayData: {} 
        });
      },

      setOverlayData: (data) => {
        set({ overlayData: data });
      },

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
      },

      setFontSize: (fontSize) => {
        set({ fontSize });
      },

      toggleMessageGrouping: () => {
        set(state => ({ messageGrouping: !state.messageGrouping }));
      },

      toggleTimestamps: () => {
        set(state => ({ showTimestamps: !state.showTimestamps }));
      },

      toggleCompactMode: () => {
        set(state => ({ compactMode: !state.compactMode }));
      },

      // Notification actions
      addNotification: (notification) => {
        const id = crypto.randomUUID();
        const timestamp = new Date();
        
        set(state => ({
          notifications: [
            { ...notification, id, timestamp, isRead: false },
            ...state.notifications
          ].slice(0, 100), // Keep only last 100 notifications
          unreadNotifications: state.unreadNotifications + 1
        }));
      },

      removeNotification: (id) => {
        set(state => {
          const notification = state.notifications.find(n => n.id === id);
          const unreadDecrement = notification && !notification.isRead ? 1 : 0;
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadNotifications: Math.max(0, state.unreadNotifications - unreadDecrement)
          };
        });
      },

      markNotificationRead: (id) => {
        set(state => {
          const notifications = state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
          );
          
          const wasUnread = state.notifications.find(n => n.id === id && !n.isRead);
          const unreadDecrement = wasUnread ? 1 : 0;
          
          return {
            notifications,
            unreadNotifications: Math.max(0, state.unreadNotifications - unreadDecrement)
          };
        });
      },

      markAllNotificationsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
          unreadNotifications: 0
        }));
      },

      clearNotifications: () => {
        set({ 
          notifications: [], 
          unreadNotifications: 0 
        });
      },

      updateNotificationSettings: (settings) => {
        set(state => ({
          notificationSettings: { ...state.notificationSettings, ...settings }
        }));
      },

      // Search actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSearchResults: (results) => {
        set({ searchResults: results });
      },

      setSearching: (searching) => {
        set({ isSearching: searching });
      },

      updateSearchFilters: (filters) => {
        set(state => ({
          searchFilters: { ...state.searchFilters, ...filters }
        }));
      },

      clearSearch: () => {
        set({ 
          searchQuery: '', 
          searchResults: [], 
          isSearching: false 
        });
      },

      // Mobile actions
      setIsMobile: (mobile) => {
        set({ 
          isMobile: mobile,
          showMobileMenu: mobile ? get().showMobileMenu : false
        });
      },

      toggleMobileMenu: () => {
        set(state => ({ showMobileMenu: !state.showMobileMenu }));
      },

      setShowMobileMenu: (show) => {
        set({ showMobileMenu: show });
      },

      // Status actions
      setOnline: (online) => {
        set({ 
          isOnline: online,
          connectionStatus: online ? 'connected' : 'disconnected'
        });
      },

      updateActivity: () => {
        set({ lastActivity: new Date() });
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      // Settings actions
      openSettings: (tab = 'account') => {
        set({ 
          showSettings: true, 
          activeSettingsTab: tab,
          showMobileMenu: false
        });
      },

      closeSettings: () => {
        set({ showSettings: false });
      },

      setActiveSettingsTab: (tab) => {
        set({ activeSettingsTab: tab });
      },

      openUserProfile: (userId) => {
        set({ 
          showUserProfile: true, 
          profileUserId: userId,
          showMobileMenu: false
        });
      },

      closeUserProfile: () => {
        set({ 
          showUserProfile: false, 
          profileUserId: null 
        });
      },

      // Error actions
      setGlobalError: (error, details = null) => {
        set({ globalError: error, errorDetails: details });
      },

      clearGlobalError: () => {
        set({ globalError: null, errorDetails: null });
      },

      // Utility actions
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        userListCollapsed: state.userListCollapsed,
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        theme: state.theme,
        fontSize: state.fontSize,
        messageGrouping: state.messageGrouping,
        showTimestamps: state.showTimestamps,
        compactMode: state.compactMode,
        notificationSettings: state.notificationSettings,
        searchFilters: state.searchFilters,
      }),
    }
  )
);