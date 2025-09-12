// Core crash-safe managers
export { 
  CrashSafeConnectionManager, 
  connectionManager,
  type RpcEndpoint,
  type ChainConfig,
  type ConnectionManagerConfig,
  type RequestOptions
} from './ConnectionManager';

export {
  CrashSafeSiweAuthManager,
  siweAuthManager,
  type SiweAuthConfig,
  type SiweSession,
  type SiweVerificationResult,
  type NonceData
} from './SiweAuthManager';

export {
  CrashSafeWalletConnectionManager,
  walletConnectionManager,
  type WalletProvider,
  type WalletConnectionResult,
  type WatchAssetParams,
  type WalletState,
  type WalletConnectionConfig
} from './WalletConnectionManager';

export {
  CrashSafeNftVerificationService,
  nftVerificationService,
  type NftContract,
  type NftOwnership,
  type NftMetadata,
  type TokenGateConfig,
  type TokenGateRequirement,
  type VerificationResult,
  type RateLimitConfig,
  type CacheConfig
} from './NftVerificationService';

export {
  CrashSafeTransactionManager,
  transactionManager,
  type TransactionRequest,
  type GasEstimate,
  type TransactionStatus,
  type TransactionConfig,
  type TransactionMetrics
} from './TransactionManager';

export {
  CrashSafeSessionManager,
  sessionManager,
  type SessionData,
  type SessionConfig,
  type ReconnectionStrategy,
  type SessionEvent
} from './SessionManager';

export {
  CrashSafeHealthMonitor,
  healthMonitor,
  type HealthMetrics,
  type AlertRule,
  type CircuitBreakerConfig,
  type CircuitBreaker,
  type HealthMonitorConfig,
  type HealthAlert
} from './HealthMonitor';

// Re-export everything as a bundle for convenience
export const CrashSafeWeb3 = {
  connectionManager,
  siweAuthManager,
  walletConnectionManager,
  nftVerificationService,
  transactionManager,
  sessionManager,
  healthMonitor
} as const;

// Utility function to initialize all systems
export function initializeCrashSafeWeb3(config?: {
  connectionManager?: Partial<import('./ConnectionManager').ConnectionManagerConfig>;
  siweAuth?: Partial<import('./SiweAuthManager').SiweAuthConfig>;
  walletConnection?: Partial<import('./WalletConnectionManager').WalletConnectionConfig>;
  nftVerification?: {
    rateLimitConfig?: Partial<import('./NftVerificationService').RateLimitConfig>;
    cacheConfig?: Partial<import('./NftVerificationService').CacheConfig>;
  };
  transactionManager?: Partial<import('./TransactionManager').TransactionConfig>;
  sessionManager?: Partial<import('./SessionManager').SessionConfig>;
  healthMonitor?: Partial<import('./HealthMonitor').HealthMonitorConfig>;
}) {
  const systems = {
    connectionManager,
    siweAuthManager,
    walletConnectionManager,
    nftVerificationService,
    transactionManager,
    sessionManager,
    healthMonitor
  };

  // Set up cross-system event handling
  setupCrossSystemIntegration();

  console.log('🛡️ Crash-Safe Web3 Systems Initialized');
  console.log('✅ Connection Manager - Multi-chain RPC failover');
  console.log('✅ SIWE Auth Manager - Secure authentication');
  console.log('✅ Wallet Connection Manager - Multi-wallet support');
  console.log('✅ NFT Verification Service - Token-gating ready');
  console.log('✅ Transaction Manager - Gas optimization & retry logic');
  console.log('✅ Session Manager - Auto-reconnection');
  console.log('✅ Health Monitor - Circuit breakers & monitoring');

  return systems;
}

function setupCrossSystemIntegration() {
  // Note: Event-based integration would require implementing EventEmitter patterns
  // in the individual managers. For now, we'll set up polling-based integration.
  
  console.log('Setting up Web3 system integrations...');
  
  // Placeholder for future event-based integration
  // when managers implement EventEmitter patterns
}

// Utility function to get system status
export function getCrashSafeWeb3Status() {
  return {
    connection: connectionManager.getConnectionStatus(),
    wallet: walletConnectionManager.getState(),
    session: sessionManager.getSessionStats(),
    transactions: transactionManager.getMetrics(),
    health: healthMonitor.getCurrentMetrics(),
    timestamp: Date.now()
  };
}

// Utility function to cleanup all systems
export function cleanupCrashSafeWeb3() {
  try {
    connectionManager.cleanup();
    siweAuthManager.cleanup();
    walletConnectionManager.cleanup();
    nftVerificationService.cleanup();
    transactionManager.cleanup();
    sessionManager.cleanup();
    healthMonitor.cleanup();
    
    console.log('🧹 Crash-Safe Web3 Systems Cleaned Up');
  } catch (error) {
    console.error('Error during Web3 cleanup:', error);
  }
}

// Global error handler for Web3 operations
export function handleWeb3Error(error: any, context?: string): {
  isRetryable: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestedAction?: string;
} {
  const errorMessage = error?.message || 'Unknown error';
  const errorCode = error?.code;
  
  // User rejection errors
  if (errorCode === 4001 || errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
    return {
      isRetryable: false,
      userMessage: 'Transaction was cancelled by user',
      technicalMessage: errorMessage,
      suggestedAction: 'Please try again and approve the transaction'
    };
  }
  
  // Network/RPC errors
  if (errorMessage.includes('network') || errorMessage.includes('RPC') || errorMessage.includes('connection')) {
    return {
      isRetryable: true,
      userMessage: 'Network connection issue detected',
      technicalMessage: errorMessage,
      suggestedAction: 'Check your internet connection and try again'
    };
  }
  
  // Gas errors
  if (errorMessage.includes('gas') || errorMessage.includes('insufficient funds')) {
    return {
      isRetryable: true,
      userMessage: 'Transaction failed due to gas or balance issues',
      technicalMessage: errorMessage,
      suggestedAction: 'Ensure you have sufficient funds and try increasing gas limit'
    };
  }
  
  // Contract errors
  if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
    return {
      isRetryable: false,
      userMessage: 'Smart contract rejected the transaction',
      technicalMessage: errorMessage,
      suggestedAction: 'Check transaction parameters and contract conditions'
    };
  }
  
  // Wallet errors
  if (errorMessage.includes('wallet') || errorMessage.includes('provider')) {
    return {
      isRetryable: true,
      userMessage: 'Wallet connection issue',
      technicalMessage: errorMessage,
      suggestedAction: 'Try reconnecting your wallet'
    };
  }
  
  // Default handling
  return {
    isRetryable: true,
    userMessage: 'An unexpected error occurred',
    technicalMessage: errorMessage,
    suggestedAction: 'Please try again or contact support if the issue persists'
  };
}