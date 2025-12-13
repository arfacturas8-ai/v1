/**
 * CRYB Onboarding - Step 1: Welcome & Wallet Connection
 * Optional wallet connection for Web3 features
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

const WalletProviders = [
  { id: 'metamask', name: 'MetaMask', icon: Wallet, color: '#F6851B', description: 'Most popular Web3 wallet' },
  { id: 'walletconnect', name: 'WalletConnect', icon: Wallet, color: '#3B99FC', description: 'Connect any wallet' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: Wallet, color: '#0052FF', description: 'Secure and easy to use' },
  { id: 'rainbow', name: 'Rainbow', icon: Wallet, color: '#FF6B6B', description: 'Fun and friendly' },
];

export default function OnboardingWelcomePage() {
  const navigate = useNavigate();
  const [walletConnecting, setWalletConnecting] = useState<string | null>(null);

  const handleWalletConnect = async (walletId: string) => {
    setWalletConnecting(walletId);

    try {
      // Mock wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Connected to ${walletId}`);

      // Proceed to next step
      navigate('/auth/onboarding-profile');
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    } finally {
      setWalletConnecting(null);
    }
  };

  const handleSkip = () => {
    navigate('/auth/onboarding-profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#58a6ff] top-20 left-10" />
        <div className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-[#a371f7] bottom-20 right-10" />
      </div>

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                'h-1.5 rounded-full transition-all',
                step === 1 ? 'w-8 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]' : 'w-1.5 bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl bg-white backdrop-blur-xl border-[var(--border-subtle)]">
        <CardContent className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--text-primary)]">Welcome to CRYB</h1>
            <p className="text-lg text-[var(--text-secondary)]">Let's get you set up</p>
          </div>

          {/* Step indicator */}
          <div className="mb-8 text-center">
            <span className="inline-block px-4 py-2 bg-[var(--bg-secondary)] rounded-full text-sm text-[var(--text-secondary)]">
              Step 1 of 5
            </span>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)] text-center">Connect your wallet (optional)</h2>
            <p className="text-[var(--text-secondary)] text-center mb-8">
              Connect your Web3 wallet to access NFTs, crypto features, and more. You can always do this later.
            </p>

            <div className="grid gap-4">
              {WalletProviders.map((wallet) => {
                const WalletIcon = wallet.icon;
                const isConnecting = walletConnecting === wallet.id;

                return (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet.id)}
                    disabled={!!walletConnecting}
                    className={cn(
                      'group relative p-6 bg-[var(--bg-secondary)] rounded-xl border-2 transition-all',
                      'hover:border-blue-500/50 hover:bg-gray-50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isConnecting ? 'border-blue-500/50 bg-gray-50' : 'border-[var(--border-subtle)]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${wallet.color}20` }}
                        >
                          <WalletIcon className="w-6 h-6" style={{ color: wallet.color }} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-[var(--text-primary)] font-semibold mb-1">{wallet.name}</h3>
                          <p className="text-sm text-[var(--text-secondary)]">{wallet.description}</p>
                        </div>
                      </div>
                      {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full " />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              fullWidth
              size="lg"
              onClick={handleSkip}
              disabled={!!walletConnecting}
              className="bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-gray-50"
            >
              Skip for now
            </Button>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleSkip}
              disabled={!!walletConnecting}
              className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don't have a wallet? No problem! You can still use CRYB without one.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
