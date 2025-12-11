import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { useWeb3Auth } from '../hooks/useWeb3Auth';

const Web3Context = createContext(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export function Web3Provider({ 
  children,
  autoConnect = true,
  autoAuthenticate = false,
  sessionTimeout = 24 * 60 * 60 * 1000, // 24 hours
  onConnectionChange,
  onNetworkChange,
  onError
}) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [autoReconnectAttempts, setAutoReconnectAttempts] = useState(0);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  const web3Auth = useWeb3Auth({
    autoConnect,
    autoAuthenticate,
    sessionTimeout
  });

  const { state, actions } = web3Auth;

  // Track connection history
  useEffect(() => {
    if (state.isConnected && state.account) {
      const connectionEvent = {
        timestamp: new Date(),
        account: state.account,
        chainId: state.chainId,
        provider: state.providerType || 'unknown',
        type: 'connected'
      };
      
      setConnectionHistory(prev => [connectionEvent, ...prev.slice(0, 9)]); // Keep last 10 events
      setAutoReconnectAttempts(0);
      
      if (onConnectionChange) {
        onConnectionChange(true, connectionEvent);
      }
    } else if (!state.isConnecting && !state.isConnected) {
      const disconnectionEvent = {
        timestamp: new Date(),
        type: 'disconnected',
        reason: state.connectionError || 'unknown'
      };
      
      setConnectionHistory(prev => [disconnectionEvent, ...prev.slice(0, 9)]);
      
      if (onConnectionChange) {
        onConnectionChange(false, disconnectionEvent);
      }
    }
  }, [state.isConnected, state.account, state.chainId, state.providerType, onConnectionChange]);

  // Handle network changes
  useEffect(() => {
    if (state.chainId && onNetworkChange) {
      onNetworkChange(state.chainId);
    }
  }, [state.chainId, onNetworkChange]);

  // Handle errors
  useEffect(() => {
    if ((state.connectionError || state.authError) && onError) {
      onError(state.connectionError || state.authError);
    }
  }, [state.connectionError, state.authError, onError]);

  // Page visibility and activity tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setLastActiveTime(Date.now());
        // Check if session is still valid when page becomes visible
        checkSessionValidity();
      }
    };

    const handleUserActivity = () => {
      setLastActiveTime(Date.now());
    };

    // Activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, []);

  // Auto-reconnection logic
  const attemptAutoReconnect = useCallback(async () => {
    if (autoReconnectAttempts >= 3) {
      return false;
    }

    try {
      setAutoReconnectAttempts(prev => prev + 1);
      
      // Check if there's a valid session to restore
      const savedSession = localStorage.getItem('cryb_wallet_session');
      if (!savedSession) {
        return false;
      }

      const session = JSON.parse(savedSession);
      
      // Check if session is expired
      if (new Date(session.expirationTime) <= new Date()) {
        localStorage.removeItem('cryb_wallet_session');
        return false;
      }

      // Check if wallet is still available
      const lastProvider = localStorage.getItem('cryb_last_provider') || 'metamask';
      const walletInstalled = actions.checkWalletInstallation();
      
      if (!walletInstalled[lastProvider]) {
        return false;
      }

      // Attempt reconnection
      await actions.connect(lastProvider);
      return true;
      
    } catch (error) {
      console.error('Auto-reconnect failed:', error);
      return false;
    }
  }, [autoReconnectAttempts, actions]);

  // Session validation
  const checkSessionValidity = useCallback(() => {
    const savedSession = localStorage.getItem('cryb_wallet_session');
    if (!savedSession || !state.isConnected) {
      return;
    }

    try {
      const session = JSON.parse(savedSession);
      const now = Date.now();
      const timeUntilExpiry = session.expirationTime - now;
      
      // If session expires in less than 5 minutes, try to refresh
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        // In a real implementation, you might want to refresh the session
        // For now, we just log it
      }
      
      // If session has expired, disconnect
      if (timeUntilExpiry <= 0) {
        actions.disconnect();
      }
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }, [state.isConnected, actions]);

  // Periodic session check
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(checkSessionValidity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isConnected, checkSessionValidity]);

  // Initialize Web3 provider
  useEffect(() => {
    const initialize = async () => {
      try {
        // Wait for Web3Auth to initialize
        while (!state.isInitialized) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Attempt auto-reconnection if enabled and no current connection
        if (autoConnect && !state.isConnected && !state.connectionError) {
          await attemptAutoReconnect();
        }
        
      } catch (error) {
        console.error('Web3Provider initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [state.isInitialized, autoConnect, attemptAutoReconnect]);

  // Enhanced actions with additional functionality
  const enhancedActions = {
    ...actions,
    
    // Force reconnect
    forceReconnect: async () => {
      setAutoReconnectAttempts(0);
      return attemptAutoReconnect();
    },
    
    // Get connection history
    getConnectionHistory: () => connectionHistory,
    
    // Check if auto-reconnect is available
    canAutoReconnect: () => {
      const savedSession = localStorage.getItem('cryb_wallet_session');
      if (!savedSession) return false;
      
      try {
        const session = JSON.parse(savedSession);
        return new Date(session.expirationTime) > new Date();
      } catch {
        return false;
      }
    },
    
    // Extend session
    extendSession: (additionalTime = 24 * 60 * 60 * 1000) => {
      const savedSession = localStorage.getItem('cryb_wallet_session');
      if (!savedSession || !state.isConnected) return false;
      
      try {
        const session = JSON.parse(savedSession);
        session.expirationTime = Date.now() + additionalTime;
        localStorage.setItem('cryb_wallet_session', JSON.stringify(session));
        return true;
      } catch {
        return false;
      }
    },

    // Clear all session data
    clearAllSessions: () => {
      localStorage.removeItem('cryb_wallet_session');
      localStorage.removeItem('cryb_siwe_session');
      localStorage.removeItem('cryb_last_provider');
      setConnectionHistory([]);
      setAutoReconnectAttempts(0);
    }
  };

  // Enhanced state with additional information
  const enhancedState = {
    ...state,
    isInitializing,
    connectionHistory,
    autoReconnectAttempts,
    lastActiveTime,
    sessionTimeRemaining: (() => {
      const savedSession = localStorage.getItem('cryb_wallet_session');
      if (!savedSession) return 0;
      
      try {
        const session = JSON.parse(savedSession);
        return Math.max(0, session.expirationTime - Date.now());
      } catch {
        return 0;
      }
    })()
  };

  const contextValue = {
    state: enhancedState,
    actions: enhancedActions,
    utils: {
      isSessionExpiringSoon: () => {
        return enhancedState.sessionTimeRemaining < 5 * 60 * 1000; // Less than 5 minutes
      },
      getSessionExpiryDate: () => {
        const savedSession = localStorage.getItem('cryb_wallet_session');
        if (!savedSession) return null;
        
        try {
          const session = JSON.parse(savedSession);
          return new Date(session.expirationTime);
        } catch {
          return null;
        }
      },
      formatSessionTime: () => {
        const timeRemaining = enhancedState.sessionTimeRemaining;
        if (timeRemaining <= 0) return 'Expired';
        
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m`;
        }
      }
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <Web3Context.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-primary">
          <div className="text-center">
            <div className=" rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-muted">Initializing Web3...</p>
          </div>
        </div>
      </Web3Context.Provider>
    );
  }

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Hook for components that require Web3 connection
export function useRequireWeb3(config = {}) {
  const { 
    requireConnection = true, 
    requireAuthentication = false,
    requireSpecificChain = null,
    autoConnect = true,
    redirectUrl = null 
  } = config;
  
  const { state, actions } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkRequirements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if connection is required
        if (requireConnection && !state.isConnected) {
          if (autoConnect && actions.canAutoReconnect()) {
            await actions.forceReconnect();
          } else {
            setError('Wallet connection required');
            if (redirectUrl) {
              window.location.href = redirectUrl;
            }
            return;
          }
        }

        // Check if authentication is required
        if (requireAuthentication && state.isConnected && !state.isAuthenticated) {
          await actions.authenticate();
        }

        // Check if specific chain is required
        if (requireSpecificChain && state.chainId !== requireSpecificChain) {
          await actions.switchChain(requireSpecificChain);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkRequirements();
  }, [
    state.isConnected, 
    state.isAuthenticated, 
    state.chainId,
    requireConnection,
    requireAuthentication,
    requireSpecificChain,
    autoConnect,
    actions,
    redirectUrl
  ]);

  return {
    isLoading,
    error,
    canProceed: !isLoading && !error,
    retry: () => checkRequirements()
  };
}

export default Web3Provider;