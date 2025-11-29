import React from 'react';

// Base skeleton component with animation
function SkeletonBase({ className = '', children, ...props }) {
  return (
    <div 
      className={`animate-pulse ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

// Generic skeleton shapes
export function SkeletonBox({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div style={{
  borderRadius: '4px'
}} />
  );
}

export function SkeletonCircle({ size = 'w-8 h-8', className = '' }) {
  return (
    <div style={{
  borderRadius: '50%'
}} />
  );
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <SkeletonBase className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          style={{
  borderRadius: '4px',
  height: '16px'
}}
        />
      ))}
    </SkeletonBase>
  );
}

// Wallet Connection Button Skeleton
export function WalletConnectSkeleton({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-8 w-32',
    md: 'h-10 w-36',
    lg: 'h-12 w-40'
  };

  return (
    <SkeletonBase className={className}>
      <div style={{
  borderRadius: '12px'
}} />
    </SkeletonBase>
  );
}

// Token Balance Display Skeleton
export function TokenBalanceSkeleton({ showUSD = true, className = '' }) {
  return (
    <SkeletonBase style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
      <div className="space-y-3">
        {/* Header */}
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
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-1">
              <SkeletonBox width="w-16" height="h-4" />
              <SkeletonBox width="w-12" height="h-3" />
            </div>
          </div>
          <SkeletonBox width="w-6" height="h-6" />
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <SkeletonBox width="w-32" height="h-6" />
          {showUSD && <SkeletonBox width="w-24" height="h-4" />}
        </div>

        {/* Token list */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                <SkeletonCircle size="w-6 h-6" />
                <div className="space-y-1">
                  <SkeletonBox width="w-12" height="h-3" />
                  <SkeletonBox width="w-20" height="h-3" />
                </div>
              </div>
              <div style={{
  textAlign: 'right'
}}>
                <SkeletonBox width="w-16" height="h-3" />
                <SkeletonBox width="w-12" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonBase>
  );
}

// Network Switcher Skeleton
export function NetworkSwitcherSkeleton({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-8 w-28',
    md: 'h-10 w-32',
    lg: 'h-12 w-36'
  };

  return (
    <SkeletonBase className={className}>
      <div style={{
  borderRadius: '12px'
}} />
    </SkeletonBase>
  );
}

// Gas Estimator Skeleton
export function GasEstimatorSkeleton({ className = '' }) {
  return (
    <SkeletonBase style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
      <div className="space-y-4">
        {/* Header */}
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
            <SkeletonCircle size="w-5 h-5" />
            <SkeletonBox width="w-32" height="h-5" />
          </div>
          <SkeletonCircle size="w-4 h-4" />
        </div>

        {/* Network status */}
        <div style={{
  borderRadius: '12px',
  padding: '12px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <SkeletonCircle size="w-3 h-3" />
              <SkeletonBox width="w-20" height="h-3" />
              <SkeletonBox width="w-24" height="h-3" />
            </div>
            <SkeletonBox width="w-16" height="h-3" />
          </div>
        </div>

        {/* Gas options */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '12px'
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
                  <SkeletonCircle size="w-4 h-4" />
                  <div className="space-y-1">
                    <SkeletonBox width="w-16" height="h-4" />
                    <SkeletonBox width="w-32" height="h-3" />
                  </div>
                </div>
                <div style={{
  textAlign: 'right'
}}>
                  <SkeletonBox width="w-20" height="h-4" />
                  <SkeletonBox width="w-16" height="h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonBase>
  );
}

// Transaction Confirmation Skeleton
export function TransactionConfirmationSkeleton({ className = '' }) {
  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <SkeletonBase style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  width: '100%'
}}>
        {/* Header */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            <SkeletonCircle size="w-6 h-6" />
            <SkeletonBox width="w-32" height="h-5" />
          </div>
          <SkeletonBox width="w-48" height="h-4" />
        </div>

        {/* Content */}
        <div style={{
  padding: '24px'
}}>
          {/* Amount */}
          <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <SkeletonBox width="w-12" height="h-4" />
              <div style={{
  textAlign: 'right'
}}>
                <SkeletonBox width="w-24" height="h-5" />
                <SkeletonBox width="w-20" height="h-3" />
              </div>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <SkeletonBox width="w-8" height="h-4" />
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                <SkeletonBox width="w-20" height="h-4" />
                <SkeletonCircle size="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Gas fee */}
          <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <SkeletonBox width="w-20" height="h-4" />
              <div style={{
  textAlign: 'right'
}}>
                <SkeletonBox width="w-16" height="h-4" />
                <SkeletonBox width="w-12" height="h-3" />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{
  borderRadius: '12px',
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <SkeletonBox width="w-24" height="h-4" />
              <SkeletonBox width="w-12" height="h-4" />
            </div>
            <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
              <div style={{
  height: '8px',
  borderRadius: '50%'
}} />
            </div>
            <SkeletonBox width="w-40" height="h-3" />
          </div>
        </div>

        {/* Actions */}
        <div style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  gap: '12px'
}}>
            <SkeletonBox width="flex-1" height="h-10" style={{
  borderRadius: '12px'
}} />
            <SkeletonBox width="flex-1" height="h-10" style={{
  borderRadius: '12px'
}} />
          </div>
        </div>
      </SkeletonBase>
    </div>
  );
}

// Transaction History Skeleton
export function TransactionHistorySkeleton({ itemCount = 5, className = '' }) {
  return (
    <SkeletonBase style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
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
            <SkeletonCircle size="w-5 h-5" />
            <SkeletonBox width="w-40" height="h-5" />
            <SkeletonBox width="w-24" height="h-4" />
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <SkeletonCircle size="w-4 h-4" />
            <SkeletonBox width="w-8" height="h-8" style={{
  borderRadius: '4px'
}} />
          </div>
        </div>

        {/* Search */}
        <SkeletonBox width="w-full" height="h-10" style={{
  borderRadius: '12px'
}} />

        {/* Filters */}
        <div style={{
  display: 'grid',
  gap: '12px'
}}>
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={i} width="w-full" height="h-9" style={{
  borderRadius: '4px'
}} />
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-accent-primary/10">
        {[...Array(itemCount)].map((_, i) => (
          <div key={i} style={{
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              {/* Icon */}
              <SkeletonBox width="w-10 h-10" style={{
  borderRadius: '12px'
}} />

              {/* Info */}
              <div style={{
  flex: '1'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <SkeletonBox width="w-32" height="h-4" />
                  <SkeletonBox width="w-16" height="h-4" />
                </div>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
                  <SkeletonBox width="w-24" height="h-3" />
                  <SkeletonBox width="w-20" height="h-3" />
                  <SkeletonCircle size="w-3 h-3" />
                  <SkeletonCircle size="w-3 h-3" />
                </div>
              </div>

              {/* Amount */}
              <div style={{
  textAlign: 'right'
}}>
                <SkeletonBox width="w-24" height="h-4" />
                <SkeletonBox width="w-16" height="h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <SkeletonBox width="w-24" height="h-4" />
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <SkeletonBox width="w-16" height="h-8" style={{
  borderRadius: '4px'
}} />
            <SkeletonBox width="w-12" height="h-8" style={{
  borderRadius: '4px'
}} />
          </div>
        </div>
      </div>
    </SkeletonBase>
  );
}

// NFT Profile Badge Skeleton
export function NFTProfileBadgeSkeleton({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <SkeletonBase className={className}>
      <div style={{
  position: 'relative'
}}>
        <SkeletonBox width={sizeClasses[size]} style={{
  borderRadius: '12px'
}} />
        <div style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
      </div>
    </SkeletonBase>
  );
}

// Crypto Tipping Button Skeleton
export function CryptoTippingSkeleton({ className = '' }) {
  return (
    <SkeletonBase className={className}>
      <div style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px'
}}>
        <div className="space-y-4">
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <SkeletonCircle size="w-5 h-5" />
              <SkeletonBox width="w-20" height="h-5" />
            </div>
            <SkeletonBox width="w-6" height="h-6" style={{
  borderRadius: '4px'
}} />
          </div>

          {/* Amount buttons */}
          <div style={{
  display: 'grid',
  gap: '8px'
}}>
            {[...Array(6)].map((_, i) => (
              <SkeletonBox key={i} width="w-full" height="h-10" style={{
  borderRadius: '12px'
}} />
            ))}
          </div>

          {/* Custom amount */}
          <SkeletonBox width="w-full" height="h-10" style={{
  borderRadius: '12px'
}} />

          {/* Message */}
          <SkeletonBox width="w-full" height="h-20" style={{
  borderRadius: '12px'
}} />

          {/* Send button */}
          <SkeletonBox width="w-full" height="h-10" style={{
  borderRadius: '12px'
}} />
        </div>
      </div>
    </SkeletonBase>
  );
}

// Coming Soon Wrapper Skeleton
export function ComingSoonWrapperSkeleton({ children, className = '' }) {
  return (
    <SkeletonBase style={{
  position: 'relative'
}}>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div style={{
  position: 'absolute',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <SkeletonBox width="w-24" height="h-6" className="mx-auto mb-2" />
          <SkeletonBox width="w-32" height="h-4" className="mx-auto" />
        </div>
      </div>
    </SkeletonBase>
  );
}

// Loading states for different Web3 operations
export const Web3LoadingStates = {
  CONNECTING: 'Connecting to wallet...',
  SWITCHING_NETWORK: 'Switching network...',
  ESTIMATING_GAS: 'Estimating gas fees...',
  PREPARING_TRANSACTION: 'Preparing transaction...',
  WAITING_SIGNATURE: 'Waiting for signature...',
  BROADCASTING: 'Broadcasting transaction...',
  CONFIRMING: 'Waiting for confirmations...',
  LOADING_BALANCE: 'Loading balances...',
  LOADING_HISTORY: 'Loading transaction history...',
  LOADING_NFTS: 'Loading NFT collection...'
};

// Generic Web3 operation skeleton
export function Web3OperationSkeleton({ 
  operation = 'Loading...', 
  showProgress = false, 
  progress = 0,
  className = '' 
}) {
  return (
    <SkeletonBase style={{
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '24px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        {/* Loading icon */}
        <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
          <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%'
}} />
        </div>

        {/* Operation text */}
        <div>
          <SkeletonBox width="w-48" height="h-5" className="mx-auto mb-2" />
          <SkeletonBox width="w-32" height="h-4" className="mx-auto" />
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div style={{
  width: '100%'
}}>
            <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
              <div
                style={{
  height: '8px',
  borderRadius: '50%',
  width: `${progress}%`
}}
              />
            </div>
          </div>
        )}

        {/* Additional info */}
        <SkeletonBox width="w-56" height="h-3" className="mx-auto" />
      </div>
    </SkeletonBase>
  );
}



export default {
  SkeletonBox,
  SkeletonCircle,
  SkeletonText,
  WalletConnectSkeleton,
  TokenBalanceSkeleton,
  NetworkSwitcherSkeleton,
  GasEstimatorSkeleton,
  TransactionConfirmationSkeleton,
  TransactionHistorySkeleton,
  NFTProfileBadgeSkeleton,
  CryptoTippingSkeleton,
  ComingSoonWrapperSkeleton,
  Web3OperationSkeleton,
  Web3LoadingStates
};
