/**
 * useTypingIndicator Hook
 * Manages typing indicator state for messages
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTypingIndicator as useTypingWebSocket } from './useWebSocket';

interface UseTypingIndicatorProps {
  conversationId: string;
  isTyping: boolean;
}

/**
 * Send typing indicators when user is typing
 */
export const useTypingIndicator = ({ conversationId, isTyping }: UseTypingIndicatorProps) => {
  const { sendTypingStart, sendTypingStop } = useTypingWebSocket(conversationId);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      // Start typing
      sendTypingStart();
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop();
      isTypingRef.current = false;
    }, 3000);
  }, [sendTypingStart, sendTypingStop]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTypingRef.current) {
      sendTypingStop();
      isTypingRef.current = false;
    }
  }, [sendTypingStop]);

  // Handle typing state changes
  useEffect(() => {
    if (isTyping) {
      handleTyping();
    } else {
      stopTyping();
    }
  }, [isTyping, handleTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        sendTypingStop();
      }
    };
  }, [sendTypingStop]);

  return {
    startTyping: handleTyping,
    stopTyping,
  };
};

export default useTypingIndicator;
