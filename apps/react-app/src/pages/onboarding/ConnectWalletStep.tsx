import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../design-system/atoms/Button';
import { colors, spacing, typography, radii } from '../../design-system/tokens';

interface ConnectWalletStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const ConnectWalletStep: React.FC<ConnectWalletStepProps> = ({ onNext, onSkip }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const walletOptions = [
    { name: 'MetaMask', icon: '🦊', installed: typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask },
    { name: 'WalletConnect', icon: '🔗', installed: true },
    { name: 'Coinbase Wallet', icon: '🔵', installed: typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet },
    { name: 'Rainbow', icon: '🌈', installed: false },
  ];

  const handleConnectWallet = async (walletName: string) => {
    setIsConnecting(true);

    // Simulate wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('0x742d...4a8e');
      setIsConnecting(false);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[8] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            marginBottom: spacing[6],
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Wallet size={40} color={colors.brand.primary} />
        </div>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing[3],
          }}
        >
          Connect Your Wallet
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          Connect your wallet to access all Web3 features, display your NFTs, and more
        </p>
      </div>

      {!isConnected ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3], marginBottom: spacing[6] }}>
            {walletOptions.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleConnectWallet(wallet.name)}
                disabled={isConnecting}
                style={{
                  padding: spacing[4],
                  borderRadius: radii.lg,
                  border: `1px solid ${colors.border.default}`,
                  backgroundColor: colors.bg.secondary,
                  color: colors.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease-out',
                  opacity: isConnecting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.borderColor = colors.brand.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                    e.currentTarget.style.borderColor = colors.border.default;
                  }
                }}
              >
                <div style={{ fontSize: '32px' }}>{wallet.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.base }}>
                    {wallet.name}
                  </div>
                  {!wallet.installed && (
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Not installed
                    </div>
                  )}
                </div>
                <ArrowRight size={20} color={colors.text.tertiary} />
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.secondary,
                fontSize: typography.fontSize.base,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: spacing[2],
              }}
            >
              Skip for now
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: spacing[6],
            borderRadius: radii.lg,
            backgroundColor: `${colors.semantic.success}20`,
            border: `1px solid ${colors.semantic.success}`,
            textAlign: 'center',
            marginBottom: spacing[6],
          }}
        >
          <CheckCircle size={48} color={colors.semantic.success} style={{ margin: '0 auto', marginBottom: spacing[4] }} />
          <h3
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.semantic.success,
              marginBottom: spacing[2],
            }}
          >
            Wallet Connected!
          </h3>
          <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, marginBottom: spacing[1] }}>
            {walletAddress}
          </p>
          <Button onClick={onNext} fullWidth size="lg" style={{ marginTop: spacing[4] }}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
};
