/**
 * CRYB Wallet Management Page
 * Manage connected wallets, balances, and primary wallet
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  Plus,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../components/ui/modal';
import { cn, truncate } from '../../lib/utils';

interface WalletData {
  id: string;
  address: string;
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
  balance: {
    eth: number;
    usd: number;
  };
  nftCount: number;
  isPrimary: boolean;
  label?: string;
  connectedAt: Date;
}

const WalletManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([
    {
      id: '1',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      network: 'ethereum',
      balance: { eth: 2.5, usd: 4250 },
      nftCount: 12,
      isPrimary: true,
      label: 'Main Wallet',
      connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    },
    {
      id: '2',
      address: '0x123d35Cc6634C0532925a3b844Bc9e7595f0abc',
      network: 'polygon',
      balance: { eth: 0.5, usd: 850 },
      nftCount: 5,
      isPrimary: false,
      label: 'Trading Wallet',
      connectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    },
  ]);

  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [walletToRemove, setWalletToRemove] = useState<WalletData | null>(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const networkColors: Record<WalletData['network'], string> = {
    ethereum: 'bg-blue-500',
    polygon: 'bg-purple-500',
    arbitrum: 'bg-cyan-500',
    optimism: 'bg-red-500',
    base: 'bg-blue-600',
  };

  const networkNames: Record<WalletData['network'], string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    base: 'Base',
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleSetPrimary = (walletId: string) => {
    setWallets(
      wallets.map((w) => ({
        ...w,
        isPrimary: w.id === walletId,
      }))
    );
  };

  const handleRemoveWallet = async (walletId: string) => {
    // Check if it's the primary wallet
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet?.isPrimary && wallets.length > 1) {
      alert('Cannot remove primary wallet. Please set another wallet as primary first.');
      setWalletToRemove(null);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setWallets(wallets.filter((w) => w.id !== walletId));
    setWalletToRemove(null);
  };

  const handleConnectWallet = async () => {
    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newWallet: WalletData = {
      id: Date.now().toString(),
      address: '0x' + Math.random().toString(16).substring(2, 42),
      network: 'ethereum',
      balance: { eth: 0, usd: 0 },
      nftCount: 0,
      isPrimary: wallets.length === 0,
      connectedAt: new Date(),
    };
    setWallets([...wallets, newWallet]);
    setShowAddWallet(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Wallets</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Wallet className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-500">
              <div className="font-medium mb-1">Wallet Management</div>
              <div className="opacity-90">
                Connect multiple wallets to manage your assets. Your primary wallet is used
                for transactions and displayed on your profile.
              </div>
            </div>
          </div>
        </div>

        {/* Add Wallet Button */}
        <Button
          onClick={() => setShowAddWallet(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          fullWidth
        >
          Connect New Wallet
        </Button>

        {/* Wallets List */}
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={cn(
                'bg-card border rounded-xl p-6 space-y-4 transition-all',
                wallet.isPrimary
                  ? 'border-primary/50 shadow-lg shadow-primary/10'
                  : 'border-border hover:border-border/60'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center text-white',
                      networkColors[wallet.network]
                    )}
                  >
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {wallet.label && (
                        <div className="font-semibold">{wallet.label}</div>
                      )}
                      {wallet.isPrimary && (
                        <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground font-mono">
                        {truncate(wallet.address, 20)}
                      </span>
                      <button
                        onClick={() => handleCopyAddress(wallet.address)}
                        className="p-1 hover:bg-accent rounded transition-colors"
                      >
                        {copiedAddress === wallet.address ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {networkNames[wallet.network]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div>
                  <div className="text-sm text-muted-foreground">Balance</div>
                  <div className="font-semibold mt-1">{wallet.balance.eth} ETH</div>
                  <div className="text-xs text-muted-foreground">
                    ${wallet.balance.usd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">NFTs</div>
                  <div className="font-semibold mt-1">{wallet.nftCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Network</div>
                  <div className="font-semibold mt-1 text-sm">
                    {networkNames[wallet.network]}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWallet(wallet)}
                  className="flex-1"
                >
                  View Details
                </Button>
                {!wallet.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(wallet.id)}
                    leftIcon={<Star className="h-4 w-4" />}
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWalletToRemove(wallet)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {wallets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <div className="font-medium">No wallets connected</div>
              <div className="text-sm mt-1">Connect a wallet to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Wallet Modal */}
      <Modal open={showAddWallet} onOpenChange={setShowAddWallet} size="default">
        <ModalHeader>
          <ModalTitle>Connect Wallet</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a wallet provider to connect your account
            </p>
            <div className="space-y-2">
              {['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rainbow'].map(
                (provider) => (
                  <button
                    key={provider}
                    onClick={handleConnectWallet}
                    className="w-full p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div style={{color: "var(--text-primary)"}} className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center  font-bold">
                        {provider.charAt(0)}
                      </div>
                      <span className="font-medium">{provider}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowAddWallet(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Wallet Details Modal */}
      <Modal
        open={!!selectedWallet}
        onOpenChange={(open) => !open && setSelectedWallet(null)}
        size="default"
      >
        <ModalHeader>
          <ModalTitle>Wallet Details</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {selectedWallet && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                    {selectedWallet.address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAddress(selectedWallet.address)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Network</label>
                <div className="px-3 py-2 bg-muted rounded-md text-sm">
                  {networkNames[selectedWallet.network]}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Label (Optional)</label>
                <input
                  type="text"
                  defaultValue={selectedWallet.label}
                  placeholder="e.g., Main Wallet"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="text-sm text-blue-500">
                  Connected {new Date(selectedWallet.connectedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSelectedWallet(null)}>
            Close
          </Button>
          <Button onClick={() => setSelectedWallet(null)}>Save Changes</Button>
        </ModalFooter>
      </Modal>

      {/* Remove Wallet Confirmation */}
      <Modal
        open={!!walletToRemove}
        onOpenChange={(open) => !open && setWalletToRemove(null)}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Remove Wallet</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              Are you sure you want to remove this wallet? This action cannot be undone.
              You can always reconnect it later.
              {walletToRemove?.isPrimary && wallets.length > 1 && (
                <div className="mt-2 font-medium text-destructive">
                  Note: This is your primary wallet. Please set another wallet as primary
                  before removing.
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setWalletToRemove(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => walletToRemove && handleRemoveWallet(walletToRemove.id)}
          >
            Remove Wallet
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default WalletManagementPage;
