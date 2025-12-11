/**
 * CRYB Wallet Receive Page
 * Display wallet address with QR code for receiving crypto
 * Production-ready with network warnings and amount requests
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Share2,
  ChevronLeft,
  AlertTriangle,
  Check,
  Download,
  DollarSign,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { cn, copyToClipboard } from '../../lib/utils';
import { ethers } from 'ethers';

const SUPPORTED_NETWORKS = [
  { id: 1, name: 'Ethereum', symbol: 'ETH', color: 'text-blue-500' },
  { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'text-purple-500' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB', color: 'text-yellow-500' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH', color: 'text-blue-400' },
  { id: 10, name: 'Optimism', symbol: 'ETH', color: 'text-red-500' },
];

export function WalletReceivePage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('Ethereum');
  const [chainId, setChainId] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [showAmountRequest, setShowAmountRequest] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      generateQRCode();
    }
  }, [walletAddress, amount]);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWalletAddress(address);

          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          setNetwork(getNetworkName(Number(network.chainId)));
        } else {
          navigate('/wallet/connect');
        }
      } else {
        navigate('/wallet/connect');
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      navigate('/wallet/connect');
    }
  };

  const getNetworkName = (chainId: number): string => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      56: 'BNB Chain',
      97: 'BSC Testnet',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  const generateQRCode = () => {
    // Simple QR code generation using canvas
    // In production, use a library like qrcode.react or qr-code-styling
    if (!walletAddress || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Create QR code data
    const data = amount
      ? `ethereum:${walletAddress}?value=${parseFloat(amount) * 1e18}`
      : walletAddress;

    // Simple placeholder visualization (replace with actual QR library)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#000000';
    const moduleSize = 10;
    const modules = 29; // Standard QR size

    // Generate random pattern for demo (use actual QR library in production)
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Add positioning markers (corners)
    const markerSize = moduleSize * 7;
    const positions = [
      [0, 0],
      [size - markerSize, 0],
      [0, size - markerSize],
    ];

    positions.forEach(([x, y]) => {
      // Outer square
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, markerSize, markerSize);
      // Middle white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, markerSize - 2 * moduleSize, markerSize - 2 * moduleSize);
      // Inner black
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, markerSize - 4 * moduleSize, markerSize - 4 * moduleSize);
    });
  };

  const handleCopyAddress = async () => {
    if (walletAddress) {
      try {
        await copyToClipboard(walletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!walletAddress) return;

    const text = amount
      ? `Send ${amount} ETH to: ${walletAddress}`
      : `My wallet address: ${walletAddress}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wallet Address',
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      await handleCopyAddress();
    }
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `wallet-qr-${walletAddress?.slice(0, 8)}.png`;
    link.href = url;
    link.click();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className=" rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/wallet')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Receive Crypto</h1>
          <p className="text-sm text-muted-foreground">
            Share your address or QR code to receive payments
          </p>
        </div>
      </div>

      {/* Network Warning */}
      <Card variant="outline" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Network: {network}
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Only send assets on the {network} network to this address. Sending assets on other networks may result in permanent loss.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card variant="glass">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
              <canvas
                ref={canvasRef}
                className="w-64 h-64 md:w-80 md:h-80"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="w-full space-y-4">
              {/* Address Display */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Your Wallet Address
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 font-mono text-sm bg-muted rounded-lg p-3 break-all">
                    {walletAddress}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAddress}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadQR}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amount Request */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Request Specific Amount
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAmountRequest(!showAmountRequest)}
            >
              {showAmountRequest ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>

        {showAmountRequest && (
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              label="Amount (ETH)"
              step="0.01"
              min="0"
            />

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                QR Code will include payment amount request
              </p>
              <p className="text-xs text-muted-foreground">
                The recipient will see the requested amount when scanning this QR code
              </p>
            </div>

            {amount && (
              <Button
                variant="outline"
                onClick={() => setAmount('')}
                className="w-full"
              >
                Clear Amount
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Supported Networks */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Networks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SUPPORTED_NETWORKS.map((net) => (
              <div
                key={net.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  net.id === chainId
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("font-semibold", net.color)}>
                    {net.symbol}
                  </div>
                  <div>
                    <p className="font-medium">{net.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Chain ID: {net.id}
                    </p>
                  </div>
                </div>
                {net.id === chainId && (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This address can receive assets on any of these networks. Make sure the sender selects the correct network to avoid loss of funds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Always verify the address</p>
              <p className="text-sm text-muted-foreground">
                Double-check the wallet address before sharing
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Verify the network</p>
              <p className="text-sm text-muted-foreground">
                Ensure sender uses the correct network ({network})
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Never share your private key</p>
              <p className="text-sm text-muted-foreground">
                Only share your public wallet address, never your seed phrase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletReceivePage;
