/**
 * Connection Status Indicator Component
 * Displays the current WebSocket/HTTP polling connection status
 */

import React from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
const ConnectionStatusIndicator = ({ showDetails = false, position = 'bottom-right' }) => {
  const {
    isConnected,
    isConnecting,
    connectionType,
    usePolling,
    reconnectAttempts,
    isPollingFallback,
    connectionQuality
  } = useConnectionStatus();

  // Don't show anything if connected normally via WebSocket
  if (isConnected && !usePolling && !showDetails) {
    return null;
  }

  const getStatusClass = () => {
    if (!isConnected && isConnecting) return 'status-connecting';
    if (!isConnected) return 'status-disconnected';
    if (usePolling) return 'status-degraded';
    return 'status-connected';
  };

  const getStatusText = () => {
    if (!isConnected && isConnecting) {
      return reconnectAttempts > 0
        ? `Reconnecting (${reconnectAttempts})...`
        : 'Connecting...';
    }
    if (!isConnected) return 'Disconnected';
    if (usePolling) return 'Limited Connection';
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!isConnected && isConnecting) return '⟳';
    if (!isConnected) return '⚠';
    if (usePolling) return '⚡';
    return '✓';
  };

  const getTooltip = () => {
    if (usePolling) {
      return 'Connected via HTTP polling fallback. Some features may be delayed.';
    }
    if (!isConnected) {
      return 'Connection lost. Attempting to reconnect...';
    }
    return 'Connected via WebSocket';
  };

  return (
    <div
      className={`connection-status-indicator ${getStatusClass()} position-${position}`}
      title={getTooltip()}
    >
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-text">{getStatusText()}</span>
      {showDetails && (
        <span className="status-type">
          ({connectionType})
        </span>
      )}
    </div>
  );
};




export default ConnectionStatusIndicator
