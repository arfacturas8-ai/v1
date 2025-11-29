/**
 * React Hook for WebSocket Connection Status
 * Monitors real-time connection status including fallback to HTTP polling
 */

import { useState, useEffect } from 'react';
import websocketService from '../services/websocketService';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isConnecting: false,
    connectionType: 'websocket',
    usePolling: false,
    socketIOFailed: false,
    reconnectAttempts: 0,
    onlineUsersCount: 0,
  });

  useEffect(() => {
    // Update connection status periodically
    const updateStatus = () => {
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
    };

    // Initial update
    updateStatus();

    // Update every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    // Listen for connection events
    const handleConnectionSuccess = (data) => {
      updateStatus();
      if (data?.connectionType === 'polling') {
        console.info('Connection established via HTTP polling fallback');
      }
    };

    const handleConnectionLost = () => {
      updateStatus();
    };

    const handleConnectionError = () => {
      updateStatus();
    };

    const handleReconnecting = (data) => {
      updateStatus();
      console.info(`Reconnecting... Attempt ${data.attempt}`);
    };

    // Register event listeners
    websocketService.on('connection:success', handleConnectionSuccess);
    websocketService.on('connection:lost', handleConnectionLost);
    websocketService.on('connection:error', handleConnectionError);
    websocketService.on('connection:reconnecting', handleReconnecting);

    // Cleanup
    return () => {
      clearInterval(interval);
      websocketService.off('connection:success', handleConnectionSuccess);
      websocketService.off('connection:lost', handleConnectionLost);
      websocketService.off('connection:error', handleConnectionError);
      websocketService.off('connection:reconnecting', handleReconnecting);
    };
  }, []);

  return {
    ...connectionStatus,
    // Helper properties
    isPollingFallback: connectionStatus.usePolling,
    isWebSocket: !connectionStatus.usePolling && connectionStatus.isConnected,
    connectionQuality: connectionStatus.usePolling ? 'degraded' : 'good',
  };
};

export default useConnectionStatus;
