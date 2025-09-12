"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, base, optimism, bsc } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";

// Import our crash-safe Web3 systems
import { 
  connectionManager,
  walletConnectionManager,
  siweAuthManager,
  nftVerificationService,
  transactionManager 
} from '@cryb/web3/crash-safe';

// Types
export interface Web3State {
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: any;
  balance: bigint | null;
  ensName: string | null;
  error: string | null;
  
  // Connection health
  connectionHealth: {
    rpcStatus: Record<number, { healthy: number; total: number; status: string }>;
    lastHealthCheck: number;
  };

  // Transaction state
  pendingTransactions: number;
  
  // Session state
  siweSession: any;
  isAuthenticated: boolean;
}

export interface Web3Actions {
  connectWallet: (providerId: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  authenticateWithSiwe: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (tx: any) => Promise<string>;
  
  // Health and monitoring
  refreshConnectionHealth: () => void;
  retryFailedConnections: () => Promise<void>;
}

export interface Web3ContextType {
  state: Web3State;
  actions: Web3Actions;
}

// Initial state
const initialState: Web3State = {
  isInitialized: false,
  isConnecting: false,
  isConnected: false,
  account: null,
  chainId: null,
  provider: null,
  balance: null,
  ensName: null,
  error: null,
  connectionHealth: {
    rpcStatus: {},
    lastHealthCheck: 0
  },
  pendingTransactions: 0,
  siweSession: null,
  isAuthenticated: false
};

// Action types
type Web3Action = 
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION'; payload: { isConnected: boolean; account?: string; chainId?: number; provider?: any } }
  | { type: 'SET_BALANCE'; payload: bigint | null }
  | { type: 'SET_ENS_NAME'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_HEALTH'; payload: any }
  | { type: 'SET_PENDING_TRANSACTIONS'; payload: number }
  | { type: 'SET_SIWE_SESSION'; payload: any }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Reducer
function web3Reducer(state: Web3State, action: Web3Action): Web3State {
  switch (action.type) {
    case 'SET_INITIALIZING':
      return { ...state, isInitialized: !action.payload };
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };
    case 'SET_CONNECTION':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        account: action.payload.account || null,
        chainId: action.payload.chainId || null,
        provider: action.payload.provider || null,
        error: action.payload.isConnected ? null : state.error
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_ENS_NAME':
      return { ...state, ensName: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONNECTION_HEALTH':
      return { ...state, connectionHealth: action.payload };
    case 'SET_PENDING_TRANSACTIONS':
      return { ...state, pendingTransactions: action.payload };
    case 'SET_SIWE_SESSION':
      return { ...state, siweSession: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'RESET_STATE':
      return { ...initialState, isInitialized: true };
    default:
      return state;
  }
}

// Context
const Web3Context = createContext<Web3ContextType | null>(null);

// Wagmi configuration with crash-safe RPC endpoints
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

const createCrashSafeConfig = () => {
  const supportedChains = connectionManager.getSupportedChains();
  const transports: Record<number, any> = {};
  
  // Use our crash-safe connection manager for RPC endpoints
  for (const chain of supportedChains) {
    transports[chain.id] = http(undefined, {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000
    });
  }

  return createConfig({
    chains: [mainnet, polygon, arbitrum, base, optimism, bsc] as any,
    connectors: [
      injected(),
      walletConnect({ projectId: projectId !== "demo" ? projectId : undefined }),
      coinbaseWallet({ appName: "CRYB Platform" }),
    ],
    transports,
  });
};

// Provider component
interface CrashSafeWeb3ProviderProps {
  children: ReactNode;
  config?: {
    autoConnect?: boolean;
    enableHealthChecks?: boolean;
    healthCheckInterval?: number;
    enableSiweAuth?: boolean;
  };
}

export function CrashSafeWeb3Provider({ 
  children, 
  config = {} 
}: CrashSafeWeb3ProviderProps) {
  const {
    autoConnect = true,
    enableHealthChecks = true,
    healthCheckInterval = 60000,
    enableSiweAuth = true
  } = config;

  const [state, dispatch] = useReducer(web3Reducer, initialState);
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry if it's a user rejection or similar
          if (error?.message?.includes('User rejected') || error?.message?.includes('User denied')) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  }));

  // Initialize Web3 systems
  useEffect(() => {
    const initialize = async () => {
      try {
        dispatch({ type: 'SET_INITIALIZING', payload: true });

        // Initialize connection health monitoring
        if (enableHealthChecks) {
          const healthStatus = connectionManager.getConnectionStatus();
          dispatch({ 
            type: 'SET_CONNECTION_HEALTH', 
            payload: { rpcStatus: healthStatus, lastHealthCheck: Date.now() }
          });
        }

        // Set up wallet event listeners
        walletConnectionManager.on('connect', handleWalletConnect);
        walletConnectionManager.on('disconnect', handleWalletDisconnect);
        walletConnectionManager.on('accountChanged', handleAccountChanged);
        walletConnectionManager.on('chainChanged', handleChainChanged);
        walletConnectionManager.on('error', handleWalletError);

        // Attempt auto-connect if enabled
        if (autoConnect) {
          // Check for existing session or previous connection
          await attemptAutoConnect();
        }

        dispatch({ type: 'SET_INITIALIZING', payload: false });
      } catch (error: any) {
        console.error('Failed to initialize Web3 provider:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_INITIALIZING', payload: false });
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      walletConnectionManager.off('connect', handleWalletConnect);
      walletConnectionManager.off('disconnect', handleWalletDisconnect);
      walletConnectionManager.off('accountChanged', handleAccountChanged);
      walletConnectionManager.off('chainChanged', handleChainChanged);
      walletConnectionManager.off('error', handleWalletError);
    };
  }, [autoConnect, enableHealthChecks]);

  // Health check monitoring
  useEffect(() => {
    if (!enableHealthChecks) return;

    const interval = setInterval(async () => {
      try {
        const healthStatus = connectionManager.getConnectionStatus();
        dispatch({ 
          type: 'SET_CONNECTION_HEALTH', 
          payload: { rpcStatus: healthStatus, lastHealthCheck: Date.now() }
        });

        // Check for critical RPC failures and attempt recovery
        const criticalChains = Object.entries(healthStatus).filter(
          ([_, status]) => status.status === 'critical'
        );

        if (criticalChains.length > 0) {
          console.warn('Critical RPC failures detected:', criticalChains);
          // Could trigger automatic failover here
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, healthCheckInterval);

    return () => clearInterval(interval);
  }, [enableHealthChecks, healthCheckInterval]);

  // Transaction monitoring
  useEffect(() => {
    const updatePendingTransactions = () => {
      const pending = transactionManager.getPendingTransactions();
      dispatch({ type: 'SET_PENDING_TRANSACTIONS', payload: pending.length });
    };

    // Initial check
    updatePendingTransactions();

    // Set up periodic updates
    const interval = setInterval(updatePendingTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Event handlers
  const handleWalletConnect = useCallback(async (event: any) => {
    try {
      dispatch({ 
        type: 'SET_CONNECTION', 
        payload: { 
          isConnected: true, 
          account: event.account, 
          chainId: event.chainId 
        } 
      });

      // Update balance and ENS name
      await updateAccountDetails(event.account, event.chainId);

      // Auto-authenticate with SIWE if enabled
      if (enableSiweAuth) {
        try {
          await authenticateWithSiwe();
        } catch (authError) {
          console.warn('SIWE authentication failed:', authError);
        }
      }
    } catch (error: any) {
      console.error('Error handling wallet connect:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [enableSiweAuth]);

  const handleWalletDisconnect = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_INITIALIZING', payload: false });
  }, []);

  const handleAccountChanged = useCallback(async (event: any) => {
    if (event.account) {
      dispatch({ 
        type: 'SET_CONNECTION', 
        payload: { 
          isConnected: true, 
          account: event.account 
        } 
      });
      await updateAccountDetails(event.account, state.chainId);
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [state.chainId]);

  const handleChainChanged = useCallback(async (event: any) => {
    dispatch({ 
      type: 'SET_CONNECTION', 
      payload: { 
        isConnected: state.isConnected, 
        account: state.account, 
        chainId: event.chainId 
      } 
    });
    
    if (state.account) {
      await updateAccountDetails(state.account, event.chainId);
    }
  }, [state.isConnected, state.account]);

  const handleWalletError = useCallback((error: any) => {
    console.error('Wallet error:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message });
  }, []);

  // Helper functions
  const attemptAutoConnect = async () => {
    try {
      const availableProviders = walletConnectionManager.getAvailableProviders();
      
      // Check for existing SIWE session
      const savedSession = localStorage.getItem('cryb_siwe_session');
      if (savedSession && enableSiweAuth) {
        try {
          const session = JSON.parse(savedSession);
          if (new Date(session.expirationTime) > new Date()) {
            // Try to restore wallet connection
            for (const provider of availableProviders) {
              if (provider.isInstalled()) {
                const accounts = await provider.getAccounts();
                if (accounts.length > 0 && accounts[0].toLowerCase() === session.address) {
                  await walletConnectionManager.connectWallet(provider.id);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to restore session:', error);
        }
      }
    } catch (error) {
      console.warn('Auto-connect failed:', error);
    }
  };

  const updateAccountDetails = async (account: string, chainId: number | null) => {
    if (!chainId) return;

    try {
      const publicClient = await connectionManager.getPublicClient(chainId);
      
      // Update balance
      const balance = await publicClient.getBalance({ 
        address: account as `0x${string}` 
      });
      dispatch({ type: 'SET_BALANCE', payload: balance });

      // Update ENS name (only on mainnet)
      if (chainId === 1) {
        try {
          const ensName = await publicClient.getEnsName({
            address: account as `0x${string}`
          });
          dispatch({ type: 'SET_ENS_NAME', payload: ensName });
        } catch (error) {
          // ENS resolution failed, ignore
          dispatch({ type: 'SET_ENS_NAME', payload: null });
        }
      } else {
        dispatch({ type: 'SET_ENS_NAME', payload: null });
      }
    } catch (error: any) {
      console.warn('Failed to update account details:', error);
    }
  };

  // Actions
  const connectWallet = async (providerId: string) => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await walletConnectionManager.connectWallet(providerId);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Connection failed');
      }

      // Connection success is handled by event listeners
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_CONNECTING', payload: false });
      throw error;
    } finally {
      dispatch({ type: 'SET_CONNECTING', payload: false });
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletConnectionManager.disconnectWallet();
      
      // Clear SIWE session
      if (enableSiweAuth) {
        const session = siweAuthManager.getSession(state.account || '');
        if (session) {
          siweAuthManager.removeSession(session.sessionId);
        }
        localStorage.removeItem('cryb_siwe_session');
      }

      dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'SET_INITIALIZING', payload: false });
    } catch (error: any) {
      console.error('Wallet disconnect failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const switchChain = async (chainId: number) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await walletConnectionManager.switchChain(chainId);
      // Chain change is handled by event listeners
    } catch (error: any) {
      console.error('Chain switch failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const authenticateWithSiwe = async () => {
    if (!state.account || !state.chainId) {
      throw new Error('No wallet connected');
    }

    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      // Generate nonce
      const nonce = siweAuthManager.generateNonce();

      // Create SIWE message
      const { message, error } = await siweAuthManager.createSiweMessage(
        state.account,
        state.chainId,
        nonce
      );

      if (error) {
        throw new Error(error);
      }

      // Sign message
      const signature = await walletConnectionManager.signMessage(message);

      // Verify signature
      const verification = await siweAuthManager.verifySiweMessage(message, signature);

      if (!verification.success || !verification.session) {
        throw new Error(verification.error?.message || 'SIWE verification failed');
      }

      // Store session
      dispatch({ type: 'SET_SIWE_SESSION', payload: verification.session });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });

      // Persist session
      localStorage.setItem('cryb_siwe_session', JSON.stringify(verification.session));

      return verification.session;
    } catch (error: any) {
      console.error('SIWE authentication failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const signMessage = async (message: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await walletConnectionManager.signMessage(message);
    } catch (error: any) {
      console.error('Message signing failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const sendTransaction = async (tx: any) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      return await transactionManager.sendTransaction(tx);
    } catch (error: any) {
      console.error('Transaction failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const refreshConnectionHealth = () => {
    const healthStatus = connectionManager.getConnectionStatus();
    dispatch({ 
      type: 'SET_CONNECTION_HEALTH', 
      payload: { rpcStatus: healthStatus, lastHealthCheck: Date.now() }
    });
  };

  const retryFailedConnections = async () => {
    // This would implement connection recovery logic
    try {
      if (state.isConnected && state.account) {
        await updateAccountDetails(state.account, state.chainId);
      }
      refreshConnectionHealth();
    } catch (error: any) {
      console.error('Connection retry failed:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const actions: Web3Actions = {
    connectWallet,
    disconnectWallet,
    switchChain,
    authenticateWithSiwe,
    signMessage,
    sendTransaction,
    refreshConnectionHealth,
    retryFailedConnections
  };

  const contextValue: Web3ContextType = {
    state,
    actions
  };

  const wagmiConfig = createCrashSafeConfig();

  return (
    <Web3Context.Provider value={contextValue}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </Web3Context.Provider>
  );
}

// Hook to use Web3 context
export function useCrashSafeWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useCrashSafeWeb3 must be used within a CrashSafeWeb3Provider');
  }
  return context;
}

// Additional hooks for specific functionality
export function useWalletConnection() {
  const { state, actions } = useCrashSafeWeb3();
  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    account: state.account,
    chainId: state.chainId,
    balance: state.balance,
    ensName: state.ensName,
    error: state.error,
    connect: actions.connectWallet,
    disconnect: actions.disconnectWallet,
    switchChain: actions.switchChain
  };
}

export function useSiweAuth() {
  const { state, actions } = useCrashSafeWeb3();
  return {
    isAuthenticated: state.isAuthenticated,
    session: state.siweSession,
    authenticate: actions.authenticateWithSiwe,
    signMessage: actions.signMessage
  };
}

export function useTransactions() {
  const { state, actions } = useCrashSafeWeb3();
  return {
    pendingTransactions: state.pendingTransactions,
    sendTransaction: actions.sendTransaction
  };
}

export function useConnectionHealth() {
  const { state, actions } = useCrashSafeWeb3();
  return {
    connectionHealth: state.connectionHealth,
    refresh: actions.refreshConnectionHealth,
    retry: actions.retryFailedConnections
  };
}