/**
 * App Providers
 * Wraps the entire app with necessary context providers
 */

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '../lib/queryClient';
import { websocket } from '../lib/websocket';
import { setupRealtimeHandlers, cleanupRealtimeHandlers } from '../lib/realtimeHandlers';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { environment } from '../config/environment';

// Toast Container Component
const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const dismissToast = useUIStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'error' ? '#FF3B3B' : toast.type === 'success' ? '#00D26A' : toast.type === 'warning' ? '#FFB800' : '#0095FF',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            animation: 'slideIn 0.3s ease-out',
          }}
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

// WebSocket Manager Component
const WebSocketManager: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Setup real-time event handlers
    setupRealtimeHandlers(queryClient);

    return () => {
      // Cleanup handlers on unmount
      cleanupRealtimeHandlers();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect WebSocket when authenticated
      websocket.connect();

      return () => {
        // Disconnect WebSocket on unmount
        websocket.disconnect();
      };
    }
  }, [isAuthenticated]);

  return null;
};

// Theme Manager Component
const ThemeManager: React.FC = () => {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    // Apply theme on mount and when it changes
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return null;
};

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeManager />
        <WebSocketManager />
        <ToastContainer />
        {children}
        {environment.APP_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default AppProviders;
