/**
 * UI Store (Zustand)
 * Manages global UI state, modals, toasts, and theme
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface UIState {
  // Theme
  theme: 'dark' | 'light' | 'system';

  // Modals
  modals: Modal[];

  // Toasts
  toasts: Toast[];

  // Loading states
  globalLoading: boolean;

  // Sidebar (mobile)
  sidebarOpen: boolean;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial State
      theme: 'dark',
      modals: [],
      toasts: [],
      globalLoading: false,
      sidebarOpen: false,
      commandPaletteOpen: false,

      // Set theme
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      // Open modal
      openModal: (modal) => {
        set((state) => ({
          modals: [...state.modals, modal],
        }));
      },

      // Close modal
      closeModal: (id) => {
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        }));
      },

      // Close all modals
      closeAllModals: () => {
        set({ modals: [] });
      },

      // Show toast
      showToast: (toast) => {
        const id = Math.random().toString(36).slice(2);
        const fullToast = { ...toast, id };

        set((state) => ({
          toasts: [...state.toasts, fullToast],
        }));

        // Auto dismiss after duration
        const duration = toast.duration || 4000;
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, duration);

        return id;
      },

      // Dismiss toast
      dismissToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      // Set global loading
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },

      // Toggle sidebar
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      // Set sidebar open
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      // Toggle command palette
      toggleCommandPalette: () => {
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
      },
    }),
    {
      name: 'cryb-ui',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);

// Toast helper functions
export const toast = {
  success: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ message, type: 'success', duration }),
  error: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) =>
    useUIStore.getState().showToast({ message, type: 'info', duration }),
};
