import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Link as LinkIcon, MessageCircle, Copy, Check, Twitter, Facebook, Send } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function PostSharePage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const [copied, setCopied] = useState(false);
  const postUrl = `https://platform.cryb.ai/post/${postId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: copied ? 'Link copied!' : 'Copy link',
      icon: copied ? <Check size={20} color={colors.semantic.success} /> : <Copy size={20} color={colors.text.tertiary} />,
      action: handleCopyLink,
    },
    {
      id: 'message',
      label: 'Share via message',
      icon: <MessageCircle size={20} color={colors.text.tertiary} />,
      action: () => {
        navigate('/messages/new', { state: { shareUrl: postUrl } });
      },
    },
    {
      id: 'twitter',
      label: 'Share on Twitter',
      icon: <Twitter size={20} color={colors.text.tertiary} />,
      action: () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`, '_blank');
      },
    },
    {
      id: 'facebook',
      label: 'Share on Facebook',
      icon: <Facebook size={20} color={colors.text.tertiary} />,
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
      },
    },
    {
      id: 'telegram',
      label: 'Share on Telegram',
      icon: <Send size={20} color={colors.text.tertiary} />,
      action: () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}`, '_blank');
      },
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Close"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color={colors.text.primary} />
          </button>
          <h1
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
            }}
          >
            Share post
          </h1>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Link preview */}
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <div
            style={{
              padding: spacing[3],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <LinkIcon size={20} color={colors.text.tertiary} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {postUrl}
              </div>
            </div>
          </div>
        </div>

        {/* Share options */}
        <div style={{ padding: `${spacing[2]} 0` }}>
          {shareOptions.map((option) => (
            <div
              key={option.id}
              onClick={option.action}
              style={{
                padding: spacing[4],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
                borderBottom: `1px solid ${colors.border.default}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: option.id === 'copy' && copied ? colors.semantic.success + '20' : colors.bg.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {option.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: option.id === 'copy' && copied ? colors.semantic.success : colors.text.primary,
                  }}
                >
                  {option.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            margin: spacing[4],
            borderRadius: '12px',
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Share this post with your friends and followers. You can also quote repost it to add your own commentary.
          </p>
        </div>
      </div>
    </div>
  );
}
