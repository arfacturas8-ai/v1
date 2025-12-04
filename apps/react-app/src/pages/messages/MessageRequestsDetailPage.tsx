/**
 * MessageRequestsDetailPage - Handle message requests
 * Features: Preview conversation, accept/delete options, block user
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import MessageBubble, { MessageMedia } from '../../components/organisms/MessageBubble';
import { formatRelativeTime, generateId } from '../../lib/utils';

// Icons
const BackIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.66667L3.33333 4.16667V9.16667C3.33333 13.0167 5.94167 16.6333 10 17.5C14.0583 16.6333 16.6667 13.0167 16.6667 9.16667V4.16667L10 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 6.66667V10M10 13.3333H10.0083M8.57501 2.5L1.51667 14.1667C1.37094 14.4187 1.29379 14.7046 1.29321 14.9957C1.29263 15.2868 1.36864 15.573 1.51339 15.8256C1.65814 16.0783 1.86661 16.2887 2.11824 16.4359C2.36988 16.5831 2.65552 16.6619 2.94667 16.6667H17.0533C17.3445 16.6619 17.6301 16.5831 17.8818 16.4359C18.1334 16.2887 18.3419 16.0783 18.4866 15.8256C18.6314 15.573 18.7074 15.2868 18.7068 14.9957C18.7062 14.7046 18.6291 14.4187 18.4833 14.1667L11.425 2.5C11.2763 2.25372 11.0663 2.04992 10.8151 1.9085C10.5639 1.76709 10.2799 1.69287 9.99084 1.69287C9.70182 1.69287 9.41779 1.76709 9.16659 1.9085C8.91539 2.04992 8.70541 2.25372 8.55667 2.5L8.57501 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BlockIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3.75 3.75L16.25 16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 10.6667V8M8 5.33333H8.00667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Types
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  media?: MessageMedia[];
  isRead?: boolean;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
  mutualFollowers?: number;
  isVerified?: boolean;
}

interface MessageRequest {
  id: string;
  sender: User;
  messages: Message[];
  receivedAt: Date;
  reason?: string;
}

const MessageRequestsDetailPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'user-1';

  // State
  const [request, setRequest] = useState<MessageRequest | null>(null);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data
  useEffect(() => {
    const mockRequest: MessageRequest = {
      id: requestId || '1',
      sender: {
        id: 'user-99',
        name: 'Unknown User',
        username: '@unknownuser',
        avatar: 'https://i.pravatar.cc/150?img=99',
        bio: 'NFT collector and crypto enthusiast',
        followers: 1234,
        following: 567,
        mutualFollowers: 3,
        isVerified: false,
      },
      messages: [
        {
          id: '1',
          content: 'Hey! I saw your NFT collection and wanted to reach out.',
          timestamp: new Date(Date.now() - 3600000),
          senderId: 'user-99',
        },
        {
          id: '2',
          content: "I'm particularly interested in the cyberpunk series. Are you open to discussing a potential collaboration?",
          timestamp: new Date(Date.now() - 3500000),
          senderId: 'user-99',
        },
        {
          id: '3',
          content: 'Let me know if you\'d like to chat more about this!',
          timestamp: new Date(Date.now() - 3400000),
          senderId: 'user-99',
        },
      ],
      receivedAt: new Date(Date.now() - 3600000),
      reason: 'This person doesn\'t follow you',
    };

    setRequest(mockRequest);
  }, [requestId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [request?.messages]);

  // Accept request
  const handleAccept = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate to conversation
    navigate(`/messages/${generateId()}`);
  };

  // Delete request
  const handleDelete = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate back to requests list
    navigate('/messages/requests');
  };

  // Block user
  const handleBlock = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Navigate back to requests list
    navigate('/messages/requests');
  };

  if (!request) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.bg.primary,
          color: colors.text.primary,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: colors.bg.primary,
        color: colors.text.primary,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
        }}
      >
        <button
          onClick={() => navigate('/messages/requests')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.primary,
            cursor: 'pointer',
            padding: spacing[2],
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back to requests"
        >
          <BackIcon />
        </button>

        {/* Sender info */}
        <div
          style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: radii.full,
            overflow: 'hidden',
            background: colors.bg.tertiary,
          }}
        >
          {request.sender.avatar && (
            <img
              src={request.sender.avatar}
              alt={request.sender.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            {request.sender.name}
            {request.sender.isVerified && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: radii.full,
                  background: colors.brand.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <CheckIcon />
              </div>
            )}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
            Message Request
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: spacing[3],
            padding: spacing[3],
            background: 'rgba(255, 184, 0, 0.1)',
            border: `1px solid rgba(255, 184, 0, 0.3)`,
            borderRadius: radii.md,
          }}
        >
          <div style={{ color: colors.semantic.warning, flexShrink: 0 }}>
            <AlertIcon />
          </div>
          <div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.warning,
                marginBottom: spacing[1],
              }}
            >
              Be Careful
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {request.reason || 'This person is not in your contacts'}.
              Be cautious about sharing personal information or clicking links from unknown senders.
            </div>
          </div>
        </div>
      </div>

      {/* Sender profile preview */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[4],
            padding: spacing[4],
            background: colors.bg.tertiary,
            borderRadius: radii.lg,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: radii.full,
              overflow: 'hidden',
              background: colors.bg.elevated,
              flexShrink: 0,
            }}
          >
            {request.sender.avatar && (
              <img
                src={request.sender.avatar}
                alt={request.sender.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[1],
              }}
            >
              {request.sender.name}
            </div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
                marginBottom: spacing[2],
              }}
            >
              {request.sender.username}
            </div>
            {request.sender.bio && (
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  marginBottom: spacing[2],
                }}
              >
                {request.sender.bio}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: spacing[4],
                fontSize: typography.fontSize.sm,
                color: colors.text.tertiary,
              }}
            >
              <span>
                <strong style={{ color: colors.text.primary }}>{request.sender.followers || 0}</strong> followers
              </span>
              <span>
                <strong style={{ color: colors.text.primary }}>{request.sender.following || 0}</strong> following
              </span>
            </div>
            {request.sender.mutualFollowers && request.sender.mutualFollowers > 0 && (
              <div
                style={{
                  marginTop: spacing[2],
                  fontSize: typography.fontSize.sm,
                  color: colors.brand.primary,
                }}
              >
                {request.sender.mutualFollowers} mutual follower{request.sender.mutualFollowers > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* View profile button */}
          <button
            onClick={() => navigate(`/profile/${request.sender.id}`)}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              background: colors.bg.elevated,
              border: `1px solid ${colors.border.default}`,
              borderRadius: radii.md,
              color: colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            View Profile
          </button>
        </div>
      </div>

      {/* Message preview */}
      <div
        ref={messageListRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[4],
        }}
      >
        <div
          style={{
            textAlign: 'center',
            margin: `${spacing[4]} 0`,
          }}
        >
          <span
            style={{
              background: colors.bg.tertiary,
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: radii.full,
              fontSize: typography.fontSize.xs,
              color: colors.text.tertiary,
            }}
          >
            {new Date(request.receivedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {request.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            id={message.id}
            content={message.content}
            timestamp={message.timestamp}
            isMine={message.senderId === currentUserId}
            author={{
              name: request.sender.name,
              avatar: request.sender.avatar,
            }}
            media={message.media}
            showTimestamp={true}
            groupWithPrevious={index > 0 && request.messages[index - 1].senderId === message.senderId}
            groupWithNext={
              index < request.messages.length - 1 &&
              request.messages[index + 1].senderId === message.senderId
            }
          />
        ))}

        {/* Info note */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            padding: spacing[4],
            background: colors.bg.secondary,
            borderRadius: radii.md,
            marginTop: spacing[4],
          }}
        >
          <div style={{ color: colors.text.tertiary, flexShrink: 0 }}>
            <InfoIcon />
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            You'll only be able to reply to this conversation after accepting the request.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderTop: `1px solid ${colors.border.subtle}`,
        }}
      >
        <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: spacing[4],
              background: 'none',
              border: `1px solid ${colors.border.default}`,
              borderRadius: radii.lg,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <XIcon />
            Delete
          </button>
          <button
            onClick={() => setShowAcceptConfirm(true)}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: spacing[4],
              background: colors.brand.primary,
              border: 'none',
              borderRadius: radii.lg,
              color: '#FFFFFF',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
          >
            <CheckIcon />
            Accept
          </button>
        </div>
        <button
          onClick={() => setShowBlockConfirm(true)}
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: spacing[3],
            background: 'none',
            border: 'none',
            color: colors.semantic.error,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
          }}
        >
          <BlockIcon />
          Block {request.sender.name}
        </button>
      </div>

      {/* Accept confirmation modal */}
      {showAcceptConfirm && (
        <>
          <div
            onClick={() => setShowAcceptConfirm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: colors.bg.elevated,
              borderRadius: radii.lg,
              padding: spacing[6],
              maxWidth: '400px',
              width: '90%',
              zIndex: 1001,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radii.full,
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.brand.primary,
                margin: `0 auto ${spacing[4]}`,
              }}
            >
              <CheckIcon />
            </div>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                margin: `0 0 ${spacing[3]} 0`,
                textAlign: 'center',
              }}
            >
              Accept Message Request?
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                margin: `0 0 ${spacing[6]} 0`,
                textAlign: 'center',
              }}
            >
              {request.sender.name} will be able to see when you've read their messages and you'll be able to call
              each other.
            </p>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowAcceptConfirm(false)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.bg.tertiary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.brand.primary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <>
          <div
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: colors.bg.elevated,
              borderRadius: radii.lg,
              padding: spacing[6],
              maxWidth: '400px',
              width: '90%',
              zIndex: 1001,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radii.full,
                background: 'rgba(255, 59, 59, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.semantic.error,
                margin: `0 auto ${spacing[4]}`,
              }}
            >
              <XIcon />
            </div>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                margin: `0 0 ${spacing[3]} 0`,
                textAlign: 'center',
              }}
            >
              Delete Message Request?
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                margin: `0 0 ${spacing[6]} 0`,
                textAlign: 'center',
              }}
            >
              This will permanently delete all messages from {request.sender.name}. They won't be notified.
            </p>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.bg.tertiary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.semantic.error,
                  border: 'none',
                  borderRadius: radii.md,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Block confirmation modal */}
      {showBlockConfirm && (
        <>
          <div
            onClick={() => setShowBlockConfirm(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: colors.bg.elevated,
              borderRadius: radii.lg,
              padding: spacing[6],
              maxWidth: '400px',
              width: '90%',
              zIndex: 1001,
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radii.full,
                background: 'rgba(255, 59, 59, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.semantic.error,
                margin: `0 auto ${spacing[4]}`,
              }}
            >
              <BlockIcon />
            </div>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                margin: `0 0 ${spacing[3]} 0`,
                textAlign: 'center',
              }}
            >
              Block {request.sender.name}?
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                margin: `0 0 ${spacing[6]} 0`,
                textAlign: 'center',
              }}
            >
              They won't be able to message you or see your profile. They won't be notified that you've blocked them.
            </p>
            <div style={{ display: 'flex', gap: spacing[3] }}>
              <button
                onClick={() => setShowBlockConfirm(false)}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.bg.tertiary,
                  border: 'none',
                  borderRadius: radii.md,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: spacing[3],
                  background: colors.semantic.error,
                  border: 'none',
                  borderRadius: radii.md,
                  color: '#FFFFFF',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageRequestsDetailPage;
