/**
 * Typing Indicator Component
 * Shows who is currently typing in a conversation
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface TypingIndicatorProps {
  conversationId: string;
  users?: { id: string; displayName: string }[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ conversationId, users = [] }) => {
  // Get typing users from cache (set by WebSocket handler)
  const { data: typingUserIds = [] } = useQuery<string[]>({
    queryKey: ['messages', 'typing', conversationId],
    initialData: [],
    staleTime: Infinity, // Never stale - updated by WebSocket
  });

  // Filter to get typing user names
  const typingUsers = users.filter((user) => typingUserIds.includes(user.id));

  if (typingUsers.length === 0) return null;

  // Format typing text
  let typingText = '';
  if (typingUsers.length === 1) {
    typingText = `${typingUsers[0].displayName} is typing...`;
  } else if (typingUsers.length === 2) {
    typingText = `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`;
  } else {
    typingText = `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing...`;
  }

  return (
    <div
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        color: '#8B949E',
        fontStyle: 'italic',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <TypingDots />
      <span>{typingText}</span>
    </div>
  );
};

/**
 * Animated typing dots
 */
const TypingDots: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8B949E',
          animation: 'typingDot 1.4s infinite',
          animationDelay: '0s',
        }}
      />
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8B949E',
          animation: 'typingDot 1.4s infinite',
          animationDelay: '0.2s',
        }}
      />
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#8B949E',
          animation: 'typingDot 1.4s infinite',
          animationDelay: '0.4s',
        }}
      />
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
