"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCrashSafeWeb3, useWalletConnection, useSiweAuth } from '@/lib/providers/simple-web3-provider';

export interface Web3AuthState {
  // Connection state
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  
  // Authentication state
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  
  // User data
  account: string | null;
  ensName: string | null;
  chainId: number | null;
  balance: bigint | null;
  
  // Error states
  connectionError: string | null;
  authError: string | null;
  
  // Loading states
  isLoadingProfile: boolean;
  isLoadingBalance: boolean;
  
  // Session info
  sessionId: string | null;
  sessionExpiresAt: Date | null;
  
  // Network status
  isOnline: boolean;
  networkStatus: 'online' | 'offline' | 'poor';
}

export interface Web3AuthActions {
  // Connection actions
  connect: (providerId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Authentication actions
  authenticate: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  
  // Network actions
  switchChain: (chainId: number) => Promise<void>;
  
  // Refresh actions
  refreshBalance: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Error handling
  clearErrors: () => void;
  retry: () => Promise<void>;
}

export interface Web3AuthConfig {
  autoConnect?: boolean;
  autoAuthenticate?: boolean;
  requireAuthentication?: boolean;
  supportedChains?: number[];
  fallbackChainId?: number;
  retryAttempts?: number;
  retryDelay?: number;
  sessionTimeout?: number;
}

const DEFAULT_CONFIG: Web3AuthConfig = {
  autoConnect: true,
  autoAuthenticate: true,
  requireAuthentication: false,
  supportedChains: [1, 137, 42161, 8453, 10, 56],
  fallbackChainId: 1,
  retryAttempts: 3,
  retryDelay: 2000,
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
};

export function useWeb3Auth(config: Web3AuthConfig = {}): {
  state: Web3AuthState;
  actions: Web3AuthActions;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { state: web3State, actions: web3Actions } = useCrashSafeWeb3();
  const walletConnection = useWalletConnection();
  const siweAuth = useSiweAuth();

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'poor'>('online');
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const initializationRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
      
      // If we come back online and have a session, try to reconnect
      if (navigator.onLine && siweAuth.session && !walletConnection.isConnected) {
        setTimeout(() => {
          attemptReconnection();
        }, 1000);
      }
    };

    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Initial status
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [siweAuth.session, walletConnection.isConnected]);

  // Session expiration monitoring
  useEffect(() => {
    if (siweAuth.session?.expirationTime) {
      setSessionExpiresAt(new Date(siweAuth.session.expirationTime));
      
      // Set up expiration timer
      const expirationTime = new Date(siweAuth.session.expirationTime).getTime();
      const now = Date.now();
      const timeUntilExpiration = expirationTime - now;
      
      if (timeUntilExpiration > 0) {
        const timer = setTimeout(() => {
          // Session expired, disconnect
          disconnect();
        }, timeUntilExpiration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [siweAuth.session]);

  // Error handling from wallet connection
  useEffect(() => {
    if (walletConnection.error) {
      setConnectionError(walletConnection.error);
    } else {
      setConnectionError(null);
    }
  }, [walletConnection.error]);

  // Auto-initialization
  useEffect(() => {
    if (!initializationRef.current && web3State.isInitialized) {
      initializationRef.current = true;
      initialize();
    }
  }, [web3State.isInitialized]);

  // Auto-authentication when connected
  useEffect(() => {
    if (
      finalConfig.autoAuthenticate &&
      walletConnection.isConnected &&
      !siweAuth.isAuthenticated &&
      !isAuthenticating &&
      walletConnection.account
    ) {
      authenticate();
    }
  }, [
    finalConfig.autoAuthenticate,
    walletConnection.isConnected,
    siweAuth.isAuthenticated,
    isAuthenticating,
    walletConnection.account
  ]);

  const initialize = async () => {
    try {
      setIsInitialized(false);
      
      // Auto-connect if enabled and we have a previous session
      if (finalConfig.autoConnect) {
        const hasPersistedSession = localStorage.getItem('cryb_siwe_session');
        if (hasPersistedSession && !walletConnection.isConnected) {
          await attemptAutoConnect();
        }
      }
      
      setIsInitialized(true);
    } catch (error: any) {
      console.error('Web3 Auth initialization failed:', error);
      setConnectionError(error.message);
      setIsInitialized(true);
    }
  };

  const attemptAutoConnect = async () => {
    try {
      // Try to restore from persisted session
      const savedSession = localStorage.getItem('cryb_siwe_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (new Date(session.expirationTime) > new Date()) {
          // Session is still valid, try to reconnect
          await connect();
        }
      }
    } catch (error) {
      console.warn('Auto-connect failed:', error);
    }
  };

  const attemptReconnection = async () => {
    if (retryCount >= finalConfig.retryAttempts!) {
      setConnectionError('Max retry attempts exceeded');
      return;
    }

    try {
      setRetryCount(prev => prev + 1);
      await connect();
      setRetryCount(0);
    } catch (error: any) {
      const delay = finalConfig.retryDelay! * Math.pow(2, retryCount);
      retryTimeoutRef.current = setTimeout(() => {
        attemptReconnection();
      }, delay);
    }
  };

  // Actions
  const connect = useCallback(async (providerId?: string) => {
    try {
      setConnectionError(null);
      
      // Determine which provider to use
      let targetProviderId = providerId;
      if (!targetProviderId) {
        // Auto-select based on availability
        if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
          targetProviderId = 'metamask';
        } else {
          targetProviderId = 'walletconnect';
        }
      }

      await walletConnection.connect(targetProviderId);
      
      // Check if we're on a supported chain
      if (walletConnection.chainId && !finalConfig.supportedChains!.includes(walletConnection.chainId)) {
        if (finalConfig.fallbackChainId) {
          await walletConnection.switchChain(finalConfig.fallbackChainId);
        }
      }
      
    } catch (error: any) {
      console.error('Connection failed:', error);
      setConnectionError(error.message);
      
      // Auto-retry for certain errors
      if (
        retryCount < finalConfig.retryAttempts! &&
        (error.message.includes('network') || error.message.includes('RPC'))
      ) {
        setTimeout(() => attemptReconnection(), finalConfig.retryDelay);
      }
      
      throw error;
    }
  }, [walletConnection, finalConfig, retryCount]);

  const disconnect = useCallback(async () => {
    try {
      setConnectionError(null);
      setAuthError(null);
      setSessionExpiresAt(null);
      setRetryCount(0);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      await walletConnection.disconnect();
      
      // Clear persisted session
      localStorage.removeItem('cryb_siwe_session');
      
    } catch (error: any) {
      console.error('Disconnect failed:', error);
      // Don't throw on disconnect errors
    }
  }, [walletConnection]);

  const authenticate = useCallback(async () => {
    if (!walletConnection.isConnected || !walletConnection.account) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      await siweAuth.authenticate();
      
      // Set session expiration
      if (siweAuth.session?.expirationTime) {
        setSessionExpiresAt(new Date(siweAuth.session.expirationTime));
      }
      
    } catch (error: any) {
      console.error('Authentication failed:', error);
      setAuthError(error.message);
      
      if (error.message.includes('User rejected')) {
        // User explicitly rejected, don't retry
        throw error;
      }
      
      // Auto-retry for network errors
      if (
        retryCount < finalConfig.retryAttempts! &&
        (error.message.includes('network') || error.message.includes('RPC'))
      ) {
        setTimeout(() => {
          authenticate();
        }, finalConfig.retryDelay);
      } else {
        throw error;
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [walletConnection, siweAuth, retryCount, finalConfig]);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!walletConnection.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await siweAuth.signMessage(message);
    } catch (error: any) {
      if (error.message.includes('User rejected')) {
        throw new Error('Message signing was rejected by user');
      }
      throw error;
    }
  }, [walletConnection, siweAuth]);

  const switchChain = useCallback(async (chainId: number) => {
    if (!finalConfig.supportedChains!.includes(chainId)) {
      throw new Error(`Chain ${chainId} is not supported`);
    }

    try {
      await walletConnection.switchChain(chainId);
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error(`Chain ${chainId} is not added to your wallet`);
      }
      throw error;
    }
  }, [walletConnection, finalConfig]);

  const refreshBalance = useCallback(async () => {
    if (!walletConnection.account || !walletConnection.chainId) {
      return;
    }

    try {
      setIsLoadingBalance(true);
      // Balance is automatically updated by the connection manager
      // This is just to trigger a manual refresh if needed
      await web3Actions.refreshConnectionHealth();
    } catch (error) {
      console.warn('Failed to refresh balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletConnection, web3Actions]);

  const refreshProfile = useCallback(async () => {
    if (!walletConnection.account) {
      return;
    }

    try {
      setIsLoadingProfile(true);
      // ENS and profile data are automatically updated
      // This is just to trigger a manual refresh if needed
      await web3Actions.refreshConnectionHealth();
    } catch (error) {
      console.warn('Failed to refresh profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [walletConnection, web3Actions]);

  const clearErrors = useCallback(() => {
    setConnectionError(null);
    setAuthError(null);
    setRetryCount(0);
  }, []);

  const retry = useCallback(async () => {
    clearErrors();
    
    try {
      if (!walletConnection.isConnected) {
        await connect();
      }
      
      if (
        finalConfig.requireAuthentication && 
        walletConnection.isConnected && 
        !siweAuth.isAuthenticated
      ) {
        await authenticate();
      }
    } catch (error) {
      // Errors will be handled by individual functions
    }
  }, [walletConnection, siweAuth, finalConfig, connect, authenticate, clearErrors]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const state: Web3AuthState = {
    isInitialized,
    isConnecting: walletConnection.isConnecting,
    isConnected: walletConnection.isConnected,
    isAuthenticating,
    isAuthenticated: siweAuth.isAuthenticated,
    account: walletConnection.account,
    ensName: walletConnection.ensName,
    chainId: walletConnection.chainId,
    balance: walletConnection.balance,
    connectionError,
    authError,
    isLoadingProfile,
    isLoadingBalance,
    sessionId: siweAuth.session?.sessionId || null,
    sessionExpiresAt,
    isOnline: networkStatus === 'online',
    networkStatus
  };

  const actions: Web3AuthActions = {
    connect,
    disconnect,
    authenticate,
    signMessage,
    switchChain,
    refreshBalance,
    refreshProfile,
    clearErrors,
    retry
  };

  return { state, actions };
}

// Additional specialized hooks
export function useWeb3AuthRequired(config?: Web3AuthConfig) {
  const auth = useWeb3Auth({ ...config, requireAuthentication: true });
  
  // Auto-redirect or show modal if not authenticated
  useEffect(() => {
    if (
      auth.state.isInitialized && 
      !auth.state.isConnected && 
      !auth.state.isConnecting &&
      !auth.state.connectionError
    ) {
      // Could trigger a connection modal here
      console.log('Web3 authentication required');
    }
  }, [
    auth.state.isInitialized,
    auth.state.isConnected,
    auth.state.isConnecting,
    auth.state.connectionError
  ]);
  
  return auth;
}

export function useWeb3AuthOptional(config?: Web3AuthConfig) {
  return useWeb3Auth({ ...config, requireAuthentication: false, autoConnect: false });
}

// Hook for checking specific permissions or requirements
export function useWeb3Requirements(requirements: {
  chainIds?: number[];
  minBalance?: bigint;
  requireAuthentication?: boolean;
  requireENS?: boolean;
}) {
  const { state } = useWeb3Auth();
  
  const [isChecking, setIsChecking] = useState(false);
  const [requirementsMet, setRequirementsMet] = useState(false);
  const [unmetRequirements, setUnmetRequirements] = useState<string[]>([]);
  
  useEffect(() => {
    if (!state.isInitialized) return;
    
    setIsChecking(true);
    const unmet: string[] = [];
    
    // Check connection requirement
    if (!state.isConnected) {
      unmet.push('Wallet connection required');
    }
    
    // Check authentication requirement
    if (requirements.requireAuthentication && !state.isAuthenticated) {
      unmet.push('Authentication required');
    }
    
    // Check chain requirement
    if (requirements.chainIds && state.chainId && !requirements.chainIds.includes(state.chainId)) {
      unmet.push(`Must be on supported chain (current: ${state.chainId})`);
    }
    
    // Check balance requirement
    if (requirements.minBalance && state.balance && state.balance < requirements.minBalance) {
      unmet.push(`Insufficient balance (minimum: ${requirements.minBalance.toString()})`);
    }
    
    // Check ENS requirement
    if (requirements.requireENS && !state.ensName) {
      unmet.push('ENS name required');
    }
    
    setUnmetRequirements(unmet);
    setRequirementsMet(unmet.length === 0 && state.isConnected);
    setIsChecking(false);
  }, [state, requirements]);
  
  return {
    isChecking,
    requirementsMet,
    unmetRequirements,
    canProceed: requirementsMet && state.isConnected
  };
}

// Hook for transaction signing with better UX
export function useWeb3Signing() {
  const { state, actions } = useWeb3Auth();
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [signingError, setSigningError] = useState<string | null>(null);
  
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsSigningMessage(true);
      setSigningError(null);
      
      const signature = await actions.signMessage(message);
      return signature;
    } catch (error: any) {
      setSigningError(error.message);
      throw error;
    } finally {
      setIsSigningMessage(false);
    }
  }, [state.isConnected, actions.signMessage]);
  
  const clearSigningError = useCallback(() => {
    setSigningError(null);
  }, []);
  
  return {
    signMessage,
    isSigningMessage,
    signingError,
    clearSigningError,
    canSign: state.isConnected && state.isAuthenticated
  };
}