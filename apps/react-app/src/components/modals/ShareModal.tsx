/**
 * CRYB Platform - Share Modal
 * Share content with copy link, social sharing, and QR code
 */

import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { copyToClipboard } from '../../lib/utils';
import {
  Share2,
  Link2,
  CheckCircle,
  QrCode,
  Code,
  Twitter,
  Facebook,
  Send,
  Copy,
  MessageCircle,
} from 'lucide-react';

// ===== SOCIAL PLATFORMS =====
interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (url: string, text?: string) => string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <Twitter style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
    getUrl: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || '')}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    color: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2]',
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: <Send style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    color: 'hover:bg-[#0088cc]/10 hover:text-[#0088cc]',
    getUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || '')}`,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <MessageCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />,
    color: 'hover:bg-[#25D366]/10 hover:text-[#25D366]',
    getUrl: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text || ''} ${url}`)}`,
  },
];

// ===== MODAL PROPS =====
export interface ShareModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** URL to share */
  url: string;
  /** Title/text to share */
  title?: string;
  /** Description */
  description?: string;
  /** Show QR code */
  showQRCode?: boolean;
  /** QR code data (defaults to url) */
  qrCodeData?: string;
  /** Show embed code option */
  showEmbedCode?: boolean;
  /** Embed code */
  embedCode?: string;
  /** Custom platforms */
  platforms?: SocialPlatform[];
  /** Callback when shared */
  onShare?: (platform: string) => void;
}

// ===== SHARE MODAL COMPONENT =====
export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onOpenChange,
  url,
  title = '',
  description = 'Share this with your friends',
  showQRCode = false,
  qrCodeData,
  showEmbedCode = false,
  embedCode,
  platforms = SOCIAL_PLATFORMS,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'qr' | 'embed'>('share');

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      await copyToClipboard(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle copy embed code
  const handleCopyEmbed = async () => {
    if (!embedCode) return;

    try {
      await copyToClipboard(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle social share
  const handleSocialShare = (platform: SocialPlatform) => {
    const shareUrl = platform.getUrl(url, title);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onShare?.(platform.id);
  };

  // Reset state on close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCopied(false);
      setEmbedCopied(false);
      setActiveTab('share');
    }
    onOpenChange(newOpen);
  };

  // Render share tab
  const renderShareTab = () => (
    <div className="space-y-6">
      {/* Copy Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Share Link</label>
        <div className="flex gap-2">
          <Input
            value={url}
            readOnly
            className="flex-1"
          />
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Social Platforms */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Share on Social Media</label>
        <div className="grid grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => handleSocialShare(platform)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 border-border',
                'transition-all duration-200',
                'hover:border-primary/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                platform.color
              )}
            >
              {platform.icon}
              <span className="font-medium">{platform.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render QR code tab
  const renderQRTab = () => (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="p-4 bg-white rounded-lg mb-4">
        {qrCodeData || url ? (
          <div className="w-64 h-64 flex items-center justify-center">
            <QrCode className="w-full h-full text-gray-900" />
          </div>
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
            <div className="text-center text-gray-500">
              <QrCode style={{ width: "80px", height: "80px", flexShrink: 0 }} />
              <p className="text-sm">QR Code</p>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Scan this QR code to share
      </p>
      <Button
        variant="outline"
        onClick={handleCopyLink}
        leftIcon={copied ? <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} /> : <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />}
      >
        {copied ? 'Link Copied!' : 'Copy Link'}
      </Button>
    </div>
  );

  // Render embed tab
  const renderEmbedTab = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground mb-2">
          Copy and paste this code to embed on your website
        </p>
      </div>

      <div className="relative">
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-xs font-mono">
          {embedCode || `<iframe src="${url}" width="100%" height="400" frameborder="0"></iframe>`}
        </pre>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyEmbed}
          className="absolute top-2 right-2"
        >
          {embedCopied ? (
            <>
              <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Copied
            </>
          ) : (
            <>
              <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="font-medium mb-2">Preview</h4>
        <div className="bg-muted/30 rounded p-4 min-h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Embed preview would appear here</p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal open={open} onOpenChange={handleOpenChange} size="default">
      <ModalHeader>
        <ModalTitle>
          <div className="flex items-center gap-2">
            <Share2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Share
          </div>
        </ModalTitle>
        <ModalDescription>{description}</ModalDescription>
      </ModalHeader>

      <ModalBody>
        {/* Tabs */}
        {(showQRCode || showEmbedCode) && (
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('share')}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === 'share'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Share2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Share
              </div>
              {activeTab === 'share' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            {showQRCode && (
              <button
                onClick={() => setActiveTab('qr')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  activeTab === 'qr'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <QrCode style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  QR Code
                </div>
                {activeTab === 'qr' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )}

            {showEmbedCode && (
              <button
                onClick={() => setActiveTab('embed')}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors relative',
                  activeTab === 'embed'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Code style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Embed
                </div>
                {activeTab === 'embed' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'share' && renderShareTab()}
        {activeTab === 'qr' && renderQRTab()}
        {activeTab === 'embed' && renderEmbedTab()}
      </ModalBody>

      <ModalFooter justify="center">
        <p className="text-xs text-muted-foreground text-center">
          Share responsibly and respect others' privacy
        </p>
      </ModalFooter>
    </Modal>
  );
};

export default ShareModal;
