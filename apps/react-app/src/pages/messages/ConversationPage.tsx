/**
 * ConversationPage - Main chat interface
 * Features: Message list, input with media/emoji/GIF, typing indicators, reactions, replies
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import MessageBubble, { MessageMedia, MessageReaction, ReplyToMessage } from '../../components/organisms/MessageBubble';
import { formatRelativeTime, generateId, formatFileSize } from '../../lib/utils';

// Icons
const BackIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M18.3333 14.1V16.6C18.3343 16.8321 18.2866 17.0618 18.1936 17.2745C18.1006 17.4871 17.9643 17.678 17.7933 17.8349C17.6222 17.9918 17.4203 18.1112 17.2005 18.1856C16.9806 18.26 16.7477 18.288 16.5166 18.2683C13.9523 17.9892 11.489 17.1117 9.32498 15.7083C7.31151 14.4289 5.60443 12.7218 4.32498 10.7083C2.91663 8.53438 2.03912 6.05909 1.76665 3.48333C1.74697 3.25284 1.77482 3.02055 1.84895 2.80127C1.92308 2.58199 2.04206 2.38049 2.19832 2.2096C2.35459 2.03871 2.54476 1.90218 2.75669 1.80869C2.96861 1.7152 3.1976 1.6668 3.42831 1.66667H5.92831C6.32743 1.66267 6.71325 1.8079 7.01094 2.07407C7.30862 2.34024 7.49768 2.70961 7.54165 3.10667C7.62378 3.90009 7.79371 4.68084 8.04831 5.43667C8.16286 5.76571 8.18078 6.12177 8.09984 6.46079C8.01889 6.79981 7.84238 7.10756 7.59165 7.35L6.56665 8.375C7.74139 10.4657 9.53431 12.2586 11.625 13.4333L12.65 12.4083C12.8924 12.1576 13.2002 11.9811 13.5392 11.9001C13.8782 11.8192 14.2343 11.8371 14.5633 11.9517C15.3192 12.2063 16.0999 12.3762 16.8933 12.4583C17.295 12.5029 17.6681 12.6956 17.9351 12.9989C18.2022 13.3022 18.3445 13.6945 18.3333 14.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M13.3333 1.66667H6.66666C3.90523 1.66667 1.66666 3.90524 1.66666 6.66667V13.3333C1.66666 16.0948 3.90523 18.3333 6.66666 18.3333H13.3333C16.0948 18.3333 18.3333 16.0948 18.3333 13.3333V6.66667C18.3333 3.90524 16.0948 1.66667 13.3333 1.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.33334 7.5L12.5 10L8.33334 12.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EmojiIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.66667 11.6667C6.66667 11.6667 7.91667 13.3333 10 13.3333C12.0833 13.3333 13.3333 11.6667 13.3333 11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7.5" cy="8.33333" r="0.833333" fill="currentColor" />
    <circle cx="12.5" cy="8.33333" r="0.833333" fill="currentColor" />
  </svg>
);

const GifIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 8.5H7V11.5M9 8.5V11.5M11 8.5H13V10M13 10V11.5M13 10H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AttachIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M17.0833 9.58333L10 16.6667C8.84906 17.8176 7.28986 18.4653 5.66667 18.4653C4.04348 18.4653 2.48427 17.8176 1.33333 16.6667C0.182403 15.5157 -0.465332 13.9565 -0.465332 12.3333C-0.465332 10.7101 0.182403 9.15094 1.33333 8L8.41667 0.916667C9.22633 0.106998 10.3244 -0.348953 11.4688 -0.348953C12.6131 -0.348953 13.7112 0.106998 14.5208 0.916667C15.3305 1.72633 15.7865 2.82441 15.7865 3.96875C15.7865 5.11309 15.3305 6.21117 14.5208 7.02083L7.42917 14.1042C7.02433 14.509 6.47529 14.7365 5.90208 14.7365C5.32887 14.7365 4.77984 14.509 4.375 14.1042C3.97016 13.6993 3.74268 13.1503 3.74268 12.5771C3.74268 12.0039 3.97016 11.4548 4.375 11.05L10.9167 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NFTIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7L10 13L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MicIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.66667V10M10 10C11.3807 10 12.5 8.88071 12.5 7.5V3.33333C12.5 1.95262 11.3807 0.833333 10 0.833333C8.61929 0.833333 7.5 1.95262 7.5 3.33333V7.5C7.5 8.88071 8.61929 10 10 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 7.5C5 10.2614 7.23858 12.5 10 12.5C12.7614 12.5 15 10.2614 15 7.5M10 12.5V15.8333M10 15.8333H7.5M10 15.8333H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M18.3333 1.66667L9.16667 10.8333M18.3333 1.66667L12.5 18.3333L9.16667 10.8333M18.3333 1.66667L1.66667 7.5L9.16667 10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDownIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4.16667V15.8333M10 15.8333L15.8333 10M10 15.8333L4.16667 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Types
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  media?: MessageMedia[];
  reactions?: MessageReaction[];
  replyTo?: ReplyToMessage;
  isRead?: boolean;
  isDelivered?: boolean;
  isSending?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar?: string;
  participants: User[];
  messages: Message[];
}

const ConversationPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const currentUserId = 'user-1'; // Mock current user

  // Mock data
  useEffect(() => {
    // Simulate loading conversation
    const mockConversation: Conversation = {
      id: conversationId || '1',
      type: 'direct',
      name: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/150?img=1',
      participants: [
        {
          id: 'user-1',
          name: 'You',
          isOnline: true,
        },
        {
          id: 'user-2',
          name: 'Sarah Chen',
          avatar: 'https://i.pravatar.cc/150?img=1',
          isOnline: true,
        },
      ],
      messages: [],
    };

    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Hey! How are you doing?',
        timestamp: new Date(Date.now() - 3600000),
        senderId: 'user-2',
        isRead: true,
        isDelivered: true,
      },
      {
        id: '2',
        content: "I'm good! Just working on some new NFT designs.",
        timestamp: new Date(Date.now() - 3500000),
        senderId: 'user-1',
        isRead: true,
        isDelivered: true,
      },
      {
        id: '3',
        content: 'Oh cool! Can I see them?',
        timestamp: new Date(Date.now() - 3400000),
        senderId: 'user-2',
        isRead: true,
        isDelivered: true,
      },
      {
        id: '4',
        content: 'Sure! Here are a few samples',
        timestamp: new Date(Date.now() - 3300000),
        senderId: 'user-1',
        media: [
          {
            id: 'img-1',
            type: 'image',
            url: 'https://picsum.photos/400/300?random=1',
            thumbnail: 'https://picsum.photos/200/150?random=1',
          },
          {
            id: 'img-2',
            type: 'image',
            url: 'https://picsum.photos/400/300?random=2',
            thumbnail: 'https://picsum.photos/200/150?random=2',
          },
        ],
        isRead: true,
        isDelivered: true,
      },
      {
        id: '5',
        content: 'These are amazing! I especially love the second one!',
        timestamp: new Date(Date.now() - 3200000),
        senderId: 'user-2',
        reactions: [
          { emoji: '❤️', count: 1, users: ['user-1'], isReactedByMe: true },
        ],
        isRead: true,
        isDelivered: true,
      },
      {
        id: '6',
        content: 'Thanks! That one took me the longest to create.',
        timestamp: new Date(Date.now() - 3100000),
        senderId: 'user-1',
        replyTo: {
          id: '5',
          author: 'Sarah Chen',
          content: 'These are amazing! I especially love the second one!',
        },
        isRead: true,
        isDelivered: true,
      },
    ];

    setConversation(mockConversation);
    setMessages(mockMessages);

    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }, 1000);
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messageListRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = messageListRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        scrollToBottom();
      } else {
        setShowScrollButton(true);
      }
    }
  }, [messages]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isAtBottom);

    // Load more messages when scrolled to top
    if (scrollTop < 100 && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [isLoadingMore]);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };

  const loadMoreMessages = async () => {
    setIsLoadingMore(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoadingMore(false);
  };

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const newMessage: Message = {
      id: generateId(),
      content: inputValue.trim(),
      timestamp: new Date(),
      senderId: currentUserId,
      isSending: true,
      media: attachments.map((file, index) => ({
        id: `attachment-${index}`,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        mimeType: file.type,
      })),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        author: conversation?.participants.find(p => p.id === replyingTo.senderId)?.name || 'Unknown',
        content: replyingTo.content,
      } : undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setAttachments([]);
    setReplyingTo(null);
    inputRef.current?.focus();

    // Simulate sending
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id
            ? { ...msg, isSending: false, isDelivered: true }
            : msg
        )
      );

      // Simulate read receipt after 1 second
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id ? { ...msg, isRead: true } : msg
          )
        );
      }, 1000);
    }, 500);
  }, [inputValue, attachments, replyingTo, conversation, currentUserId]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle voice recording
  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setRecordingDuration(0);

    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    // Store interval ID for cleanup
    (window as any).recordingInterval = interval;
  };

  const stopVoiceRecording = () => {
    setIsRecordingVoice(false);
    clearInterval((window as any).recordingInterval);

    // Simulate sending voice message
    if (recordingDuration > 0) {
      const newMessage: Message = {
        id: generateId(),
        content: `Voice message (${recordingDuration}s)`,
        timestamp: new Date(),
        senderId: currentUserId,
        isSending: true,
      };
      setMessages(prev => [...prev, newMessage]);
    }
    setRecordingDuration(0);
  };

  // Message actions
  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);

        if (existingReaction) {
          // Toggle reaction
          if (existingReaction.isReactedByMe) {
            return {
              ...msg,
              reactions: existingReaction.count === 1
                ? reactions.filter(r => r.emoji !== emoji)
                : reactions.map(r =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count - 1,
                          users: r.users.filter(u => u !== currentUserId),
                          isReactedByMe: false,
                        }
                      : r
                  ),
            };
          } else {
            return {
              ...msg,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      users: [...r.users, currentUserId],
                      isReactedByMe: true,
                    }
                  : r
              ),
            };
          }
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [
              ...reactions,
              { emoji, count: 1, users: [currentUserId], isReactedByMe: true },
            ],
          };
        }
      })
    );
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, isDeleted: true } : msg
      )
    );
    setShowContextMenu(null);
  };

  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setShowContextMenu(null);
  };

  // Format typing duration
  const formatRecordingDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const dateKey = new Date(message.timestamp).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  if (!conversation) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: colors.bg.primary,
        color: colors.text.primary,
      }}>
        Loading...
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);

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
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.primary,
            cursor: 'pointer',
            padding: spacing[2],
            display: 'flex',
            alignItems: 'center',
            borderRadius: radii.md,
          }}
          aria-label="Back to messages"
        >
          <BackIcon />
        </button>

        {/* Avatar */}
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
          {otherParticipant?.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {otherParticipant?.name.charAt(0).toUpperCase()}
            </div>
          )}
          {otherParticipant?.isOnline && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '12px',
                height: '12px',
                background: colors.semantic.success,
                border: `2px solid ${colors.bg.secondary}`,
                borderRadius: radii.full,
              }}
            />
          )}
        </div>

        {/* User info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            {conversation.name}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
            {otherParticipant?.isOnline ? 'Online' : `Last seen ${formatRelativeTime(otherParticipant?.lastSeen || new Date())}`}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing[2] }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.secondary,
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
              borderRadius: radii.md,
            }}
            aria-label="Voice call"
          >
            <PhoneIcon />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.secondary,
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
              borderRadius: radii.md,
            }}
            aria-label="Video call"
          >
            <VideoIcon />
          </button>
          <button
            onClick={() => navigate(`/messages/${conversationId}/info`)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.secondary,
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
              borderRadius: radii.md,
            }}
            aria-label="Conversation info"
          >
            <InfoIcon />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing[4],
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        }}
      >
        {isLoadingMore && (
          <div style={{ textAlign: 'center', padding: spacing[4], color: colors.text.tertiary }}>
            Loading more messages...
          </div>
        )}

        {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            {/* Date separator */}
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
                {new Date(dateKey).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Messages */}
            {dateMessages.map((message, index) => {
              const prevMessage = dateMessages[index - 1];
              const nextMessage = dateMessages[index + 1];
              const isMine = message.senderId === currentUserId;
              const author = conversation.participants.find(p => p.id === message.senderId);

              const groupWithPrevious =
                prevMessage &&
                prevMessage.senderId === message.senderId &&
                new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() < 60000;

              const groupWithNext =
                nextMessage &&
                nextMessage.senderId === message.senderId &&
                new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() < 60000;

              return (
                <MessageBubble
                  key={message.id}
                  id={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                  isMine={isMine}
                  author={author}
                  media={message.media}
                  reactions={message.reactions}
                  replyTo={message.replyTo}
                  isRead={message.isRead}
                  isDelivered={message.isDelivered}
                  isSending={message.isSending}
                  isEdited={message.isEdited}
                  isDeleted={message.isDeleted}
                  groupWithPrevious={groupWithPrevious}
                  groupWithNext={groupWithNext}
                  onReact={(emoji) => handleReaction(message.id, emoji)}
                  onReply={() => handleReply(message)}
                  onMore={() => setShowContextMenu({ messageId: message.id, x: 0, y: 0 })}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.full,
                overflow: 'hidden',
                background: colors.bg.tertiary,
              }}
            >
              {otherParticipant?.avatar && (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <div
              style={{
                background: colors.bg.tertiary,
                borderRadius: radii.lg,
                padding: spacing[3],
                display: 'flex',
                gap: spacing[1],
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: radii.full,
                  background: colors.text.tertiary,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0s',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: radii.full,
                  background: colors.text.tertiary,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.2s',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: radii.full,
                  background: colors.text.tertiary,
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: attachments.length > 0 ? '180px' : '100px',
            right: spacing[4],
            width: '40px',
            height: '40px',
            borderRadius: radii.full,
            background: colors.bg.elevated,
            border: `1px solid ${colors.border.subtle}`,
            color: colors.text.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.lg,
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          aria-label="Scroll to bottom"
        >
          <ArrowDownIcon />
        </button>
      )}

      {/* Reply preview */}
      {replyingTo && (
        <div
          style={{
            padding: spacing[3],
            background: colors.bg.secondary,
            borderTop: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
              Replying to {conversation.participants.find(p => p.id === replyingTo.senderId)?.name}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {replyingTo.content.length > 50
                ? `${replyingTo.content.substring(0, 50)}...`
                : replyingTo.content}
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.tertiary,
              cursor: 'pointer',
              padding: spacing[2],
            }}
            aria-label="Cancel reply"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div
          style={{
            padding: spacing[3],
            background: colors.bg.secondary,
            borderTop: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            gap: spacing[2],
            overflowX: 'auto',
          }}
        >
          {attachments.map((file, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                borderRadius: radii.md,
                overflow: 'hidden',
                background: colors.bg.tertiary,
              }}
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing[2],
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  <AttachIcon />
                  <div style={{ marginTop: spacing[1], textAlign: 'center' }}>
                    {file.name.length > 12 ? `${file.name.substring(0, 12)}...` : file.name}
                  </div>
                  <div style={{ color: colors.text.tertiary }}>{formatFileSize(file.size)}</div>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                style={{
                  position: 'absolute',
                  top: spacing[1],
                  right: spacing[1],
                  width: '20px',
                  height: '20px',
                  borderRadius: radii.full,
                  background: colors.bg.primary,
                  border: 'none',
                  color: colors.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Remove attachment"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: spacing[4],
          background: colors.bg.secondary,
          borderTop: `1px solid ${colors.border.subtle}`,
        }}
      >
        {isRecordingVoice ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: spacing[3],
              background: colors.bg.tertiary,
              borderRadius: radii.lg,
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: radii.full,
                background: colors.semantic.error,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div style={{ flex: 1, fontSize: typography.fontSize.base }}>
              Recording... {formatRecordingDuration(recordingDuration)}
            </div>
            <button
              onClick={stopVoiceRecording}
              style={{
                background: colors.brand.primary,
                border: 'none',
                borderRadius: radii.full,
                padding: `${spacing[2]} ${spacing[4]}`,
                color: '#FFFFFF',
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              Send
            </button>
            <button
              onClick={() => {
                setIsRecordingVoice(false);
                clearInterval((window as any).recordingInterval);
                setRecordingDuration(0);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: 'pointer',
                padding: spacing[2],
              }}
              aria-label="Cancel recording"
            >
              <CloseIcon />
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: spacing[2],
              background: colors.bg.tertiary,
              borderRadius: radii.lg,
              padding: spacing[2],
            }}
          >
            {/* Attachment buttons */}
            <div style={{ display: 'flex', gap: spacing[1] }}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
                aria-label="Add emoji"
              >
                <EmojiIcon />
              </button>
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
                aria-label="Add GIF"
              >
                <GifIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
                aria-label="Attach file"
              >
                <AttachIcon />
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
                aria-label="Share NFT"
              >
                <NFTIcon />
              </button>
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                resize: 'none',
                minHeight: '24px',
                maxHeight: '120px',
                padding: spacing[2],
                fontFamily: typography.fontFamily.sans,
              }}
              rows={1}
            />

            {/* Send/Voice button */}
            {inputValue.trim() || attachments.length > 0 ? (
              <button
                onClick={sendMessage}
                style={{
                  background: colors.brand.primary,
                  border: 'none',
                  borderRadius: radii.full,
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            ) : (
              <button
                onClick={startVoiceRecording}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
                aria-label="Record voice message"
              >
                <MicIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <>
          <div
            onClick={() => setShowContextMenu(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: spacing[4],
              left: '50%',
              transform: 'translateX(-50%)',
              background: colors.bg.elevated,
              borderRadius: radii.lg,
              padding: spacing[2],
              boxShadow: shadows.xl,
              zIndex: 1001,
              minWidth: '200px',
            }}
          >
            {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReaction(showContextMenu.messageId, emoji);
                  setShowContextMenu(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: spacing[2],
                }}
              >
                {emoji}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${colors.border.subtle}`, margin: spacing[2] }} />
            <button
              onClick={() => {
                const message = messages.find(m => m.id === showContextMenu.messageId);
                if (message) handleReply(message);
                setShowContextMenu(null);
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                cursor: 'pointer',
                padding: spacing[3],
                textAlign: 'left',
                fontSize: typography.fontSize.base,
                borderRadius: radii.md,
              }}
            >
              Reply
            </button>
            <button
              onClick={() => {
                const message = messages.find(m => m.id === showContextMenu.messageId);
                if (message) handleCopyMessage(message);
              }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                cursor: 'pointer',
                padding: spacing[3],
                textAlign: 'left',
                fontSize: typography.fontSize.base,
                borderRadius: radii.md,
              }}
            >
              Copy
            </button>
            <button
              onClick={() => handleDeleteMessage(showContextMenu.messageId)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: colors.semantic.error,
                cursor: 'pointer',
                padding: spacing[3],
                textAlign: 'left',
                fontSize: typography.fontSize.base,
                borderRadius: radii.md,
              }}
            >
              Delete
            </button>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ConversationPage;
