"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { walletManager, transactionManager, siweAuth, type CryptoWallet, SimpleWeb3Manager } from '@cryb/web3';

// Types
export interface SimpleWeb3State {
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  wallet: CryptoWallet | null;
  isAuthenticated: boolean;
  siweSession: any | null;
  error: string | null;
}

export interface SimpleWeb3Actions {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  authenticateWithSiwe: () => Promise<void>;
  clearError: () => void;
}

export interface SimpleWeb3ContextType {
  state: SimpleWeb3State;
  actions: SimpleWeb3Actions;
}

// Initial state
const initialState: SimpleWeb3State = {
  isInitialized: false,
  isConnecting: false,
  isConnected: false,
  wallet: null,
  isAuthenticated: false,
  siweSession: null,
  error: null,
};

// Context
const SimpleWeb3Context = createContext<SimpleWeb3ContextType | null>(null);

// Provider component
interface SimpleWeb3ProviderProps {
  children: ReactNode;
}

export function SimpleWeb3Provider({ children }: SimpleWeb3ProviderProps) {
  const [state, setState] = useState<SimpleWeb3State>(initialState);

  // Initialize Web3
  useEffect(() => {
    const initialize = async () => {
      try {
        const web3Manager = new SimpleWeb3Manager();
        await web3Manager.initialize();
        
        // Set up event listeners
        walletManager.onWalletChanged = handleWalletChanged;
        walletManager.onWalletDisconnected = handleWalletDisconnected;
        
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isConnected: !!walletManager.getCurrentWallet(),
          wallet: walletManager.getCurrentWallet(),
        }));
      } catch (error: any) {
        console.error('Web3 initialization failed:', error);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          error: error.message,
        }));
      }
    };

    initialize();
  }, []);

  const handleWalletChanged = useCallback((wallet: CryptoWallet) => {
    setState(prev => ({
      ...prev,
      wallet,
      isConnected: true,
      error: null,
    }));
  }, []);

  const handleWalletDisconnected = useCallback(() => {
    setState(prev => ({
      ...prev,
      wallet: null,
      isConnected: false,
      isAuthenticated: false,
      siweSession: null,
    }));
  }, []);

  // Actions
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));
      
      if (!walletManager.isMetaMaskAvailable()) {
        throw new Error('MetaMask not available. Please install MetaMask to continue.');
      }

      const wallet = await walletManager.connectMetaMask();
      
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        wallet,
        error: null,
      }));
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletManager.disconnect();
      setState(prev => ({
        ...prev,
        isConnected: false,
        wallet: null,
        isAuthenticated: false,
        siweSession: null,
        error: null,
      }));
    } catch (error: any) {
      console.error('Wallet disconnect failed:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      await walletManager.switchNetwork(chainId);
      
      // Update wallet state
      const currentWallet = walletManager.getCurrentWallet();
      if (currentWallet) {
        setState(prev => ({
          ...prev,
          wallet: currentWallet,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('Network switch failed:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    try {
      const signature = await walletManager.signMessage(message);
      setState(prev => ({ ...prev, error: null }));
      return signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const authenticateWithSiwe = useCallback(async () => {
    try {
      const wallet = walletManager.getCurrentWallet();
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      const { message, signature } = await siweAuth.signMessage({
        statement: 'Sign in to CRYB Platform',
      });

      const session = {
        address: wallet.address,
        message,
        signature,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        siweSession: session,
        error: null,
      }));

      // Persist session
      localStorage.setItem('cryb_siwe_session', JSON.stringify(session));
    } catch (error: any) {
      console.error('SIWE authentication failed:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const actions: SimpleWeb3Actions = {
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    authenticateWithSiwe,
    clearError,
  };

  const contextValue: SimpleWeb3ContextType = {
    state,
    actions,
  };

  return (
    <SimpleWeb3Context.Provider value={contextValue}>
      {children}
    </SimpleWeb3Context.Provider>
  );
}

// Hook to use Web3 context
export function useSimpleWeb3() {
  const context = useContext(SimpleWeb3Context);
  if (!context) {
    throw new Error('useSimpleWeb3 must be used within a SimpleWeb3Provider');
  }
  return context;
}

// Compatibility hooks for existing code
export function useCrashSafeWeb3() {
  return useSimpleWeb3();
}

export function useWalletConnection() {
  const { state, actions } = useSimpleWeb3();
  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    account: state.wallet?.address || null,
    chainId: state.wallet?.chainId || null,
    balance: state.wallet?.balance || null,
    ensName: null, // ENS not implemented in simple version
    error: state.error,
    connect: actions.connectWallet,
    disconnect: actions.disconnectWallet,
    switchChain: actions.switchNetwork,
  };
}

export function useSiweAuth() {
  const { state, actions } = useSimpleWeb3();
  return {
    isAuthenticated: state.isAuthenticated,
    session: state.siweSession,
    authenticate: actions.authenticateWithSiwe,
    signMessage: actions.signMessage,
  };
}

export function useTransactions() {
  const { actions } = useSimpleWeb3();
  return {
    pendingTransactions: 0, // Not tracked in simple version
    sendTransaction: async (tx: any) => {
      return await walletManager.sendTransaction(tx);
    },
  };
}

export function useConnectionHealth() {
  return {
    connectionHealth: {
      rpcStatus: {},
      lastHealthCheck: Date.now(),
    },
    refresh: () => {},
    retry: async () => {},
  };
}