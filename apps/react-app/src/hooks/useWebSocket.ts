/**
 * useWebSocket Hook
 * React hook for WebSocket subscriptions
 */

import { useEffect, useCallback } from 'react';
import { websocket, WS_EVENTS } from '../lib/websocket';

type EventCallback = (data: any) => void;

export const useWebSocket = (event: string, callback: EventCallback, deps: any[] = []) => {
  useEffect(() => {
    // Subscribe to event
    websocket.on(event, callback);

    // Unsubscribe on unmount
    return () => {
      websocket.off(event, callback);
    };
  }, [event, ...deps]);
};

export const useWebSocketConnection = () => {
  const connect = useCallback(() => {
    websocket.connect();
  }, []);

  const disconnect = useCallback(() => {
    websocket.disconnect();
  }, []);

  const send = useCallback((event: string, data: any) => {
    websocket.send(event, data);
  }, []);

  return {
    connect,
    disconnect,
    send,
    isConnected: websocket.isConnected,
  };
};

// Hook for typing indicators
export const useTypingIndicator = (conversationId: string) => {
  const sendTypingStart = useCallback(() => {
    websocket.send(WS_EVENTS.TYPING_START, { conversationId });
  }, [conversationId]);

  const sendTypingStop = useCallback(() => {
    websocket.send(WS_EVENTS.TYPING_STOP, { conversationId });
  }, [conversationId]);

  return {
    sendTypingStart,
    sendTypingStop,
  };
};

// Hook for online status
export const useOnlineStatus = (userId: string, callback: (online: boolean) => void) => {
  useWebSocket(
    WS_EVENTS.USER_ONLINE,
    (data) => {
      if (data.userId === userId) {
        callback(true);
      }
    },
    [userId]
  );

  useWebSocket(
    WS_EVENTS.USER_OFFLINE,
    (data) => {
      if (data.userId === userId) {
        callback(false);
      }
    },
    [userId]
  );
};

export default useWebSocket;
