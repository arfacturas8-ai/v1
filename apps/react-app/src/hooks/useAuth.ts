/**
 * useAuth Hook
 * Authentication utilities and actions
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { websocket } from '../lib/websocket';
import { ROUTES } from '../config/constants';

export const useAuth = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login,
    loginWithWallet,
    logout: logoutStore,
    updateUser,
    clearError,
  } = useAuthStore();

  // Login handler
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        await login(email, password);
        websocket.connect();
        navigate(ROUTES.HOME);
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    [login, navigate]
  );

  // Wallet login handler
  const handleWalletLogin = useCallback(
    async (address: string, signature: string) => {
      try {
        await loginWithWallet(address, signature);
        websocket.connect();
        navigate(ROUTES.HOME);
      } catch (error) {
        console.error('Wallet login failed:', error);
      }
    },
    [loginWithWallet, navigate]
  );

  // Logout handler
  const handleLogout = useCallback(() => {
    logoutStore();
    websocket.disconnect();
    navigate(ROUTES.LOGIN);
  }, [logoutStore, navigate]);

  // Check if user has permission
  const can = useCallback(
    (permission: string): boolean => {
      // Implement permission checking logic
      // For now, just check if user is authenticated
      return isAuthenticated;
    },
    [isAuthenticated]
  );

  return {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login: handleLogin,
    loginWithWallet: handleWalletLogin,
    logout: handleLogout,
    updateUser,
    clearError,
    can,
  };
};

export default useAuth;
