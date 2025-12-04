# CRYB Platform - Modal Components

Complete collection of accessible, feature-rich modal and dialog components for the CRYB platform.

## Components

### 1. WalletConnectModal
Wallet selection modal with provider detection and WalletConnect QR code support.

**Features:**
- Automatic wallet detection (MetaMask, Coinbase, Trust, Rainbow)
- WalletConnect QR code option
- Mobile wallet detection
- Loading states during connection
- Success/error animations
- Download links for uninstalled wallets

**Usage:**
```tsx
import { WalletConnectModal } from '@/components/modals';

function App() {
  const [open, setOpen] = useState(false);

  const handleConnect = async (providerId: string) => {
    // Connect to wallet
    console.log('Connecting to:', providerId);
  };

  return (
    <WalletConnectModal
      open={open}
      onOpenChange={setOpen}
      onConnect={handleConnect}
      showQRCode={true}
    />
  );
}
```

### 2. TransactionConfirmationModal
Transaction confirmation with detailed information and gas estimates.

**Features:**
- Transaction type display with icons
- From/To address display
- Amount and token information
- Gas fee estimates
- Total cost calculation
- Transaction states (confirm, signing, pending, success, error)
- Block explorer integration
- Warning messages

**Usage:**
```tsx
import { TransactionConfirmationModal } from '@/components/modals';

function App() {
  const transaction = {
    type: 'transfer',
    title: 'Send ETH',
    from: '0x1234...',
    to: '0x5678...',
    amount: '0.5',
    tokenSymbol: 'ETH',
    gasEstimate: '0.002 ETH',
    totalCostUSD: '1,250.00',
  };

  return (
    <TransactionConfirmationModal
      open={open}
      onOpenChange={setOpen}
      transaction={transaction}
      onConfirm={async () => {
        // Execute transaction
        return { hash: '0x...', explorerUrl: 'https://...' };
      }}
    />
  );
}
```

### 3. SignMessageModal
Message signing modal with security warnings.

**Features:**
- Message preview
- Wallet address display
- Security warnings
- Copy to clipboard
- Technical details section
- Signing states (confirm, signing, success, error)

**Usage:**
```tsx
import { SignMessageModal } from '@/components/modals';

function App() {
  return (
    <SignMessageModal
      open={open}
      onOpenChange={setOpen}
      message="Sign this message to authenticate"
      walletAddress="0x1234..."
      onSign={async () => {
        // Sign message
        return { signature: '0x...' };
      }}
    />
  );
}
```

### 4. ReportModal
Content/user reporting modal with categorization.

**Features:**
- Report type selection (Spam, Abuse, Harassment, Fraud, Inappropriate, Other)
- Additional details textarea
- Block user toggle
- Anonymous reporting
- Success confirmation

**Usage:**
```tsx
import { ReportModal } from '@/components/modals';

function App() {
  return (
    <ReportModal
      open={open}
      onOpenChange={setOpen}
      entityType="post"
      entityId="123"
      entityName="Suspicious Post"
      onSubmit={async (data) => {
        // Submit report
        console.log(data);
      }}
      showBlockOption={true}
    />
  );
}
```

### 5. ShareModal
Share content with multiple options.

**Features:**
- Copy link with success feedback
- Social share buttons (Twitter, Facebook, Telegram, WhatsApp)
- QR code generation
- Embed code with preview
- Tab-based interface

**Usage:**
```tsx
import { ShareModal } from '@/components/modals';

function App() {
  return (
    <ShareModal
      open={open}
      onOpenChange={setOpen}
      url="https://cryb.ai/post/123"
      title="Check out this post!"
      showQRCode={true}
      showEmbedCode={true}
      onShare={(platform) => console.log('Shared to:', platform)}
    />
  );
}
```

### 6. ImageViewerModal
Full-screen media viewer with advanced controls.

**Features:**
- Fullscreen image/video display
- Pinch to zoom (0.5x - 3x)
- Rotation controls
- Swipe to dismiss
- Download button
- Share integration
- Gallery navigation with thumbnails
- Keyboard shortcuts

**Keyboard Shortcuts:**
- Arrow keys: Navigate gallery
- +/-: Zoom in/out
- R: Rotate image
- Escape: Close viewer

**Usage:**
```tsx
import { ImageViewerModal } from '@/components/modals';

function App() {
  const media = [
    { id: '1', type: 'image', url: '/image1.jpg', title: 'Photo 1' },
    { id: '2', type: 'video', url: '/video.mp4', title: 'Video 1' },
  ];

  return (
    <ImageViewerModal
      open={open}
      onOpenChange={setOpen}
      media={media}
      initialIndex={0}
      allowDownload={true}
      allowShare={true}
      onShare={(item) => console.log('Share:', item)}
    />
  );
}
```

### 7. MediaPickerModal
Media selection with gallery, camera, and crop options.

**Features:**
- File upload from device
- Camera access for photos
- Multi-select support
- File size validation
- Image cropping (basic)
- Preview thumbnails
- Selection counter

**Usage:**
```tsx
import { MediaPickerModal } from '@/components/modals';

function App() {
  return (
    <MediaPickerModal
      open={open}
      onOpenChange={setOpen}
      multiple={true}
      maxFiles={5}
      accept="image/*"
      showCamera={true}
      showCrop={true}
      maxFileSize={10 * 1024 * 1024} // 10MB
      onSelect={(files, cropData) => {
        console.log('Selected files:', files);
      }}
    />
  );
}
```

### 8. ConfirmationDialog
Generic confirmation dialog with presets.

**Features:**
- Multiple types (info, warning, error, success, question)
- Keyboard shortcuts (Enter to confirm, Escape to cancel)
- Loading states
- Destructive action styling
- Custom icons
- Preset configurations

**Usage:**
```tsx
import { ConfirmationDialog, useConfirmation, confirmDelete } from '@/components/modals';

// Direct usage
function Component1() {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      type="warning"
      title="Delete Item"
      description="Are you sure?"
      onConfirm={async () => {
        // Perform action
      }}
    />
  );
}

// Hook usage
function Component2() {
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleDelete = async () => {
    const confirmed = await confirm(confirmDelete('this post'));
    if (confirmed) {
      // Delete the post
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      {ConfirmationDialog}
    </>
  );
}
```

## Common Props

All modals support these base props:

- `open: boolean` - Whether the modal is open
- `onOpenChange: (open: boolean) => void` - Callback when modal state changes

## Accessibility Features

All modals include:
- ✅ Focus trapping
- ✅ Escape key to close
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus return on close
- ✅ Backdrop click to close (configurable)

## Animations

All modals use smooth animations:
- Fade in/out for overlays
- Zoom + slide for modal content
- Loading spinners
- Success checkmarks
- Error shake (where applicable)

## Z-Index Management

Modals use a consistent z-index hierarchy:
- Overlay: `z-50`
- Modal content: `z-50`
- Nested modals: Automatically handled by Radix UI

## Theming

All modals support dark mode and use CSS custom properties from the design system.

## Best Practices

1. **Always provide onOpenChange**: Allows users to close modals with Escape or backdrop click
2. **Use appropriate modal size**: `sm`, `default`, `lg`, `xl`, or `full`
3. **Handle loading states**: Show spinners during async operations
4. **Provide clear action buttons**: Use descriptive text like "Delete Post" instead of "OK"
5. **Consider mobile UX**: All modals are responsive and touch-friendly
6. **Cleanup on unmount**: Modals automatically cleanup resources (camera streams, object URLs)

## Dependencies

- `@radix-ui/react-dialog` - Base dialog primitives
- `lucide-react` - Icons
- `framer-motion` - Animations (optional)
- `class-variance-authority` - Variant management

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## File Structure

```
modals/
├── WalletConnectModal.tsx
├── TransactionConfirmationModal.tsx
├── SignMessageModal.tsx
├── ReportModal.tsx
├── ShareModal.tsx
├── ImageViewerModal.tsx
├── MediaPickerModal.tsx
├── ConfirmationDialog.tsx
├── index.ts
└── README.md
```
