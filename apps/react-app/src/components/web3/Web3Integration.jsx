import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Zap, 
  History, 
  Settings, 
  Globe,
  Send,
  ArrowUpRight,
  Shield,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import Button from '../ui/Button';

// Enhanced Web3 Components
import EnhancedWalletConnectButton from './EnhancedWalletConnectButton';
import NetworkSwitcher from './NetworkSwitcher';
import GasEstimator from './GasEstimator';
import TransactionConfirmation from './TransactionConfirmation';
import TransactionHistory from './TransactionHistory';
import TokenBalanceDisplay from './TokenBalanceDisplay';
import CryptoTippingButton from './CryptoTippingButton';
import NFTProfileBadge from './NFTProfileBadge';

// Web3 Provider and Error Handling
import { useWeb3 } from '../../lib/providers/Web3Provider';
import Web3ErrorHandler, { Web3ErrorBoundary } from './Web3ErrorHandler';

// Skeleton components
import {
  WalletConnectSkeleton,
  TokenBalanceSkeleton,
  TransactionHistorySkeleton,
  GasEstimatorSkeleton
} from './Web3Skeletons';

function Web3Integration({ 
  showFullInterface = true,
  showHistory = true,
  showBalances = true,
  showTipping = true,
  className = '' 
}) {
  const { state, actions, utils } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTxModal, setShowTxModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);

  // Demo transaction for testing
  const demoTransaction = {
    type: 'send',
    amount: '0.1',
    symbol: 'ETH',
    recipient: '0x742d35CC6a2C4E8f8a8f8A8C9b8E8F8A8C9b8E8F',
    recipientName: '@alice',
    usdValue: 200,
    decimals: 18
  };

  const handleSendTransaction = () => {
    setPendingTransaction(demoTransaction);
    setShowTxModal(true);
  };

  const handleTransactionConfirm = (txData) => {
    setShowTxModal(false);
    setPendingTransaction(null);
    // Refresh transaction history if needed
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Wallet style={{
  height: '16px',
  width: '16px'
}} /> },
    { id: 'balances', name: 'Balances', icon: <DollarSign style={{
  height: '16px',
  width: '16px'
}} /> },
    { id: 'history', name: 'History', icon: <History style={{
  height: '16px',
  width: '16px'
}} /> },
    { id: 'settings', name: 'Settings', icon: <Settings style={{
  height: '16px',
  width: '16px'
}} /> }
  ];

  // Show loading state during initialization
  if (state.isInitializing) {
    return (
      <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
        <div className="space-y-6">
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <WalletConnectSkeleton />
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  width: '96px',
  height: '32px',
  borderRadius: '4px'
}} />
              <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '4px'
}} />
            </div>
          </div>
          <TokenBalanceSkeleton />
          {showHistory && <TransactionHistorySkeleton itemCount={3} />}
        </div>
      </div>
    );
  }

  return (
    <Web3ErrorBoundary>
      <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  overflow: 'hidden'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Wallet style={{
  height: '16px',
  width: '16px',
  color: '#ffffff'
}} />
              </div>
              <div>
                <h2 style={{
  fontWeight: '600'
}}>Web3 Dashboard</h2>
                <p className="text-sm text-muted">
                  {state.isConnected 
                    ? `Connected to ${state.providerType || 'wallet'}` 
                    : 'Connect your wallet to get started'
                  }
                </p>
              </div>
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <NetworkSwitcher size="sm" />
              <EnhancedWalletConnectButton 
                size="sm"
                showInstallPrompts={true}
                onConnect={(provider, account) => {
                }}
                onError={(error, context) => {
                  console.error(`Web3 error in ${context}:`, error);
                }}
              />
            </div>
          </div>

          {/* Connection Status */}
          {state.isConnected && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                <span className="text-success">Connected</span>
              </div>
              {utils.isSessionExpiringSoon() && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <Shield style={{
  height: '12px',
  width: '12px'
}} />
                  <span>Session expires in {utils.formatSessionTime()}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => actions.extendSession()}
                    style={{
  paddingTop: '4px',
  paddingBottom: '4px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}
                  >
                    Extend
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        {state.isConnected ? (
          <div>
            {/* Tab Navigation */}
            {showFullInterface && (
              <div style={{
  display: 'flex'
}}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontWeight: '500'
}}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </div>
            )}

            {/* Tab Content */}
            <div style={{
  padding: '24px'
}}>
              {(activeTab === 'overview' || !showFullInterface) && (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div style={{
  display: 'grid',
  gap: '16px'
}}>
                    <Button
                      onClick={handleSendTransaction}
                      style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '48px'
}}
                    >
                      <Send style={{
  height: '16px',
  width: '16px'
}} />
                      Send Transaction
                    </Button>
                    
                    {showTipping && (
                      <CryptoTippingButton 
                        recipientName="@demo"
                        style={{
  height: '48px'
}}
                      />
                    )}
                    
                    <Button
                      variant="secondary"
                      style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '48px'
}}
                      onClick={() => window.open('https://etherscan.io', '_blank')}
                    >
                      <ArrowUpRight style={{
  height: '16px',
  width: '16px'
}} />
                      Block Explorer
                    </Button>
                  </div>

                  {/* Balances */}
                  {showBalances && (
                    <div>
                      <h3 style={{
  fontWeight: '600'
}}>Token Balances</h3>
                      <TokenBalanceDisplay 
                        account={state.account}
                        showUsdValues={true}
                        showPrivacyToggle={true}
                      />
                    </div>
                  )}

                  {/* Recent Transactions */}
                  {showHistory && (
                    <div>
                      <h3 style={{
  fontWeight: '600'
}}>Recent Activity</h3>
                      <TransactionHistory 
                        account={state.account}
                        maxTransactions={5}
                        showFilters={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'balances' && showBalances && (
                <div className="space-y-6">
                  <TokenBalanceDisplay 
                    account={state.account}
                    showUsdValues={true}
                    showPrivacyToggle={true}
                    showRefreshButton={true}
                  />
                  
                  {/* Portfolio Performance */}
                  <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                      <h4 style={{
  fontWeight: '500'
}}>Portfolio Performance</h4>
                      <TrendingUp style={{
  height: '20px',
  width: '20px'
}} />
                    </div>
                    <div style={{
  display: 'grid',
  gap: '16px'
}}>
                      <div>
                        <div className="text-muted">24h Change</div>
                        <div style={{
  fontWeight: '500'
}}>+5.67%</div>
                      </div>
                      <div>
                        <div className="text-muted">Total Value</div>
                        <div style={{
  fontWeight: '500'
}}>$2,847.32</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && showHistory && (
                <TransactionHistory 
                  account={state.account}
                  showFilters={true}
                  maxTransactions={50}
                />
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 style={{
  fontWeight: '600'
}}>Network Settings</h3>
                    <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <div>
                          <div style={{
  fontWeight: '500'
}}>Active Network</div>
                          <div className="text-sm text-muted">Switch between supported networks</div>
                        </div>
                        <NetworkSwitcher showDropdown={true} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
  fontWeight: '600'
}}>Gas Settings</h3>
                    <GasEstimator
                      transaction={demoTransaction}
                      onGasEstimateChange={setGasEstimate}
                      showAdvanced={true}
                    />
                  </div>

                  <div>
                    <h3 style={{
  fontWeight: '600'
}}>Session Management</h3>
                    <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span className="text-muted">Session expires:</span>
                        <span className="text-primary">{utils.formatSessionTime()}</span>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => actions.extendSession()}
                        >
                          Extend Session
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => actions.clearAllSessions()}
                        >
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Not connected state
          <div style={{
  padding: '32px',
  textAlign: 'center'
}}>
            <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
              <Wallet style={{
  height: '32px',
  width: '32px'
}} />
            </div>
            <h3 style={{
  fontWeight: '600'
}}>
              Connect Your Wallet
            </h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Connect your Web3 wallet to access decentralized features, view your balances, 
              and interact with blockchain applications.
            </p>
            <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px'
}}>
              <EnhancedWalletConnectButton
                showProviderList={true}
                showInstallPrompts={true}
                onConnect={(provider) => {
                }}
              />
              <Button
                variant="secondary"
                onClick={() => window.open('https://ethereum.org/wallets/', '_blank')}
              >
                Learn About Wallets
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        {showTxModal && pendingTransaction && (
          <TransactionConfirmation
            isOpen={showTxModal}
            onClose={() => setShowTxModal(false)}
            transaction={pendingTransaction}
            onConfirm={handleTransactionConfirm}
            onCancel={() => {
              setShowTxModal(false);
              setPendingTransaction(null);
            }}
          />
        )}
      </div>
    </Web3ErrorBoundary>
  );
}

// Simplified version for basic integration
export function SimpleWeb3Integration({ className = '' }) {
  return (
    <Web3Integration
      showFullInterface={false}
      showHistory={false}
      showBalances={true}
      showTipping={false}
      className={className}
    />
  );
}

// Header-only version for navigation
export function Web3HeaderIntegration({ className = '' }) {
  const { state } = useWeb3();
  
  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
      <NetworkSwitcher size="sm" />
      <EnhancedWalletConnectButton 
        size="sm"
        showProviderList={true}
        variant="outline"
      />
      {state.isConnected && (
        <NFTProfileBadge 
          collection="CRYB Genesis"
          rarity="legendary"
          size="sm"
        />
      )}
    </div>
  );
}




export default Web3Integration
