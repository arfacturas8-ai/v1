/**
 * CRYB Platform - Modal Usage Examples
 * Example implementations for all modal components
 */

import React, { useState } from 'react';
import {
  WalletConnectModal,
  TransactionConfirmationModal,
  SignMessageModal,
  ReportModal,
  ShareModal,
  ImageViewerModal,
  MediaPickerModal,
  ConfirmationDialog,
  useConfirmation,
  confirmDelete,
} from './index';
import type {
  TransactionData,
  MediaItem,
} from './index';

// ===== WALLET CONNECT EXAMPLE =====
export function WalletConnectExample() {
  const [open, setOpen] = useState(false);

  const handleConnect = async (providerId: string) => {
    console.log('Connecting to wallet:', providerId);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Connect Wallet</button>
      <WalletConnectModal
        open={open}
        onOpenChange={setOpen}
        onConnect={handleConnect}
        showQRCode={true}
      />
    </div>
  );
}

// ===== TRANSACTION CONFIRMATION EXAMPLE =====
export function TransactionExample() {
  const [open, setOpen] = useState(false);

  const transaction: TransactionData = {
    type: 'transfer',
    title: 'Send ETH',
    description: 'Transfer Ethereum to recipient',
    from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    to: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    amount: '0.5',
    tokenSymbol: 'ETH',
    gasEstimate: '0.002 ETH',
    gasPriceGwei: '30',
    totalCostUSD: '1,250.00',
    estimatedTime: '~30 seconds',
    warnings: ['Make sure you trust the recipient address'],
  };

  const handleConfirm = async () => {
    console.log('Executing transaction...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      hash: '0x1234567890abcdef...',
      explorerUrl: 'https://etherscan.io/tx/0x1234567890abcdef',
    };
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Send Transaction</button>
      <TransactionConfirmationModal
        open={open}
        onOpenChange={setOpen}
        transaction={transaction}
        onConfirm={handleConfirm}
        networkName="Ethereum Mainnet"
      />
    </div>
  );
}

// ===== SIGN MESSAGE EXAMPLE =====
export function SignMessageExample() {
  const [open, setOpen] = useState(false);

  const handleSign = async () => {
    console.log('Signing message...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      signature: '0xabcdef1234567890...',
    };
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Sign Message</button>
      <SignMessageModal
        open={open}
        onOpenChange={setOpen}
        message="Welcome to CRYB Platform! Please sign this message to verify your identity."
        walletAddress="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        appName="CRYB Platform"
        onSign={handleSign}
      />
    </div>
  );
}

// ===== REPORT EXAMPLE =====
export function ReportExample() {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: any) => {
    console.log('Submitting report:', data);
    await new Promise(resolve => setTimeout(resolve, 1500));
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Report Content</button>
      <ReportModal
        open={open}
        onOpenChange={setOpen}
        entityType="post"
        entityId="post123"
        entityName="Suspicious Post Title"
        onSubmit={handleSubmit}
        showBlockOption={true}
      />
    </div>
  );
}

// ===== SHARE EXAMPLE =====
export function ShareExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Share Post</button>
      <ShareModal
        open={open}
        onOpenChange={setOpen}
        url="https://cryb.ai/post/123"
        title="Check out this amazing post on CRYB!"
        description="Share this post with your friends"
        showQRCode={true}
        showEmbedCode={true}
        onShare={(platform) => console.log('Shared to:', platform)}
      />
    </div>
  );
}

// ===== IMAGE VIEWER EXAMPLE =====
export function ImageViewerExample() {
  const [open, setOpen] = useState(false);

  const media: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://picsum.photos/1920/1080?random=1',
      thumbnail: 'https://picsum.photos/200/200?random=1',
      title: 'Beautiful Landscape',
      description: 'A stunning mountain view',
    },
    {
      id: '2',
      type: 'image',
      url: 'https://picsum.photos/1920/1080?random=2',
      thumbnail: 'https://picsum.photos/200/200?random=2',
      title: 'Ocean Sunset',
    },
    {
      id: '3',
      type: 'image',
      url: 'https://picsum.photos/1920/1080?random=3',
      thumbnail: 'https://picsum.photos/200/200?random=3',
      title: 'City Lights',
    },
  ];

  return (
    <div>
      <button onClick={() => setOpen(true)}>View Gallery</button>
      <ImageViewerModal
        open={open}
        onOpenChange={setOpen}
        media={media}
        initialIndex={0}
        allowDownload={true}
        allowShare={true}
        showInfo={true}
        onShare={(item) => console.log('Share media:', item.title)}
      />
    </div>
  );
}

// ===== MEDIA PICKER EXAMPLE =====
export function MediaPickerExample() {
  const [open, setOpen] = useState(false);

  const handleSelect = (files: File[], cropData?: any) => {
    console.log('Selected files:', files);
    console.log('Crop data:', cropData);
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Select Media</button>
      <MediaPickerModal
        open={open}
        onOpenChange={setOpen}
        multiple={true}
        maxFiles={5}
        accept="image/*"
        showCamera={true}
        showCrop={true}
        maxFileSize={10 * 1024 * 1024}
        onSelect={handleSelect}
      />
    </div>
  );
}

// ===== CONFIRMATION DIALOG EXAMPLE =====
export function ConfirmationExample() {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    console.log('Confirmed!');
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>Delete Item</button>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        type="error"
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        actionType="delete"
        onConfirm={handleConfirm}
      />
    </div>
  );
}

// ===== HOOK USAGE EXAMPLE =====
export function ConfirmationHookExample() {
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleDelete = async () => {
    const confirmed = await confirm(confirmDelete('this post'));

    if (confirmed) {
      console.log('Deleting post...');
      // Perform delete operation
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      type: 'warning',
      title: 'Logout',
      description: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Stay',
    });

    if (confirmed) {
      console.log('Logging out...');
      // Perform logout
    }
  };

  return (
    <div className="space-x-2">
      <button onClick={handleDelete}>Delete Post</button>
      <button onClick={handleLogout}>Logout</button>
      {ConfirmationDialog}
    </div>
  );
}

// ===== ALL EXAMPLES SHOWCASE =====
export function ModalsShowcase() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">CRYB Platform - Modal Examples</h1>

      <div className="grid grid-cols-2 gap-4">
        <WalletConnectExample />
        <TransactionExample />
        <SignMessageExample />
        <ReportExample />
        <ShareExample />
        <ImageViewerExample />
        <MediaPickerExample />
        <ConfirmationExample />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Hook Usage</h2>
        <ConfirmationHookExample />
      </div>
    </div>
  );
}

export default ModalsShowcase;
