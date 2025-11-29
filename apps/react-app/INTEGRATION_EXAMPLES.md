# WebSocket Fallback - Integration Examples

This document provides practical examples of how to use the WebSocket fallback integration in your application.

## Example 1: Basic Connection Status Display

Add the connection status indicator to any page:

```jsx
// In ChatPage.jsx or any other page
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';

function ChatPage() {
  return (
    <div className="chat-page">
      {/* Your existing page content */}

      {/* Add connection status indicator */}
      <ConnectionStatusIndicator position="bottom-right" />
    </div>
  );
}
```

## Example 2: Custom Connection Status Display

Create a custom status display using the hook:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function CustomConnectionStatus() {
  const {
    isConnected,
    connectionType,
    isPollingFallback,
    reconnectAttempts
  } = useConnectionStatus();

  if (!isConnected) {
    return (
      <div className="alert alert-error">
        Connection lost. Reconnecting... (Attempt {reconnectAttempts})
      </div>
    );
  }

  if (isPollingFallback) {
    return (
      <div className="alert alert-warning">
        Using limited connection mode. Some features may be delayed.
      </div>
    );
  }

  return null; // Don't show anything when connection is normal
}
```

## Example 3: Conditional Feature Rendering

Disable certain features when using polling fallback:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function VoiceChatControls() {
  const { isPollingFallback } = useConnectionStatus();

  if (isPollingFallback) {
    return (
      <div className="alert alert-info">
        Voice chat requires a stable WebSocket connection.
        Please check your network settings.
      </div>
    );
  }

  return (
    <div className="voice-controls">
      {/* Voice chat controls */}
    </div>
  );
}
```

## Example 4: Connection Quality Indicator

Show connection quality in the UI:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function ConnectionQualityBadge() {
  const { connectionQuality, connectionType } = useConnectionStatus();

  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'good': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getQualityColor()}`} />
      <span className="text-sm text-gray-600">
        {connectionType === 'polling' ? 'Limited' : 'Live'}
      </span>
    </div>
  );
}
```

## Example 5: Auto-retry Logic with User Feedback

Show retry attempts to users:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useEffect, useState } from 'react';

function ConnectionRetryNotification() {
  const { isConnected, reconnectAttempts } = useConnectionStatus();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!isConnected && reconnectAttempts > 0) {
      setShowNotification(true);
    } else if (isConnected) {
      // Hide notification after successful reconnection
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [isConnected, reconnectAttempts]);

  if (!showNotification) return null;

  return (
    <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm">
      {!isConnected ? (
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <div>
            <p className="font-semibold">Reconnecting...</p>
            <p className="text-sm text-gray-600">
              Attempt {reconnectAttempts} of 5
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-green-500 text-2xl">✓</div>
          <div>
            <p className="font-semibold">Connected!</p>
            <p className="text-sm text-gray-600">
              Your connection has been restored
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Example 6: Monitoring Connection Events

Listen to connection events for analytics or logging:

```jsx
import { useEffect } from 'react';
import websocketService from '../services/websocketService';

function ConnectionMonitor() {
  useEffect(() => {
    const handleConnectionSuccess = (data) => {
      console.log('Connected:', data);

      if (data?.connectionType === 'polling') {
        // Track polling fallback usage
        analytics.track('websocket_fallback_activated', {
          reason: 'websocket_unavailable'
        });
      }
    };

    const handleConnectionLost = (data) => {
      console.log('Connection lost:', data);

      // Track connection loss
      analytics.track('websocket_connection_lost', {
        reason: data.reason
      });
    };

    const handleConnectionError = (data) => {
      console.error('Connection error:', data);

      // Track connection errors
      analytics.track('websocket_connection_error', {
        error: data.error
      });
    };

    // Register event listeners
    websocketService.on('connection:success', handleConnectionSuccess);
    websocketService.on('connection:lost', handleConnectionLost);
    websocketService.on('connection:error', handleConnectionError);

    // Cleanup
    return () => {
      websocketService.off('connection:success', handleConnectionSuccess);
      websocketService.off('connection:lost', handleConnectionLost);
      websocketService.off('connection:error', handleConnectionError);
    };
  }, []);

  return null; // This is a monitoring component, doesn't render anything
}
```

## Example 7: App-wide Integration

Add connection status to the main App component:

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
import ConnectionRetryNotification from './components/ConnectionRetryNotification';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* Your routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          {/* ... other routes */}
        </Routes>

        {/* Global connection status indicators */}
        <ConnectionStatusIndicator position="bottom-right" />
        <ConnectionRetryNotification />
      </div>
    </BrowserRouter>
  );
}
```

## Example 8: Debug Panel (Development Only)

Create a debug panel to see connection details during development:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function ConnectionDebugPanel() {
  const status = useConnectionStatus();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 bg-black bg-opacity-80 text-white p-4 text-xs font-mono">
      <h3 className="font-bold mb-2">WebSocket Debug Info</h3>
      <div className="space-y-1">
        <div>Connected: {status.isConnected ? 'Yes' : 'No'}</div>
        <div>Connecting: {status.isConnecting ? 'Yes' : 'No'}</div>
        <div>Type: {status.connectionType}</div>
        <div>Using Polling: {status.usePolling ? 'Yes' : 'No'}</div>
        <div>Socket.IO Failed: {status.socketIOFailed ? 'Yes' : 'No'}</div>
        <div>Reconnect Attempts: {status.reconnectAttempts}</div>
        <div>Online Users: {status.onlineUsersCount}</div>
        <div>Quality: {status.connectionQuality}</div>
      </div>
    </div>
  );
}
```

## Example 9: Graceful Degradation for Features

Handle feature availability based on connection type:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function TypingIndicator({ channelId }) {
  const { isPollingFallback } = useConnectionStatus();
  const [typingUsers, setTypingUsers] = useState([]);

  // Don't show typing indicators in polling mode (too delayed)
  if (isPollingFallback) {
    return null;
  }

  return (
    <div className="typing-indicator">
      {typingUsers.length > 0 && (
        <span>
          {typingUsers.map(u => u.username).join(', ')}
          {typingUsers.length === 1 ? ' is' : ' are'} typing...
        </span>
      )}
    </div>
  );
}
```

## Example 10: Connection Status in Navigation

Add connection status to your navigation bar:

```jsx
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function NavigationBar() {
  const { isConnected, isPollingFallback } = useConnectionStatus();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Logo />
        <Menu />
      </div>

      <div className="navbar-right">
        {/* Connection status badge */}
        {!isConnected && (
          <div className="badge badge-error">Offline</div>
        )}
        {isPollingFallback && (
          <div className="badge badge-warning" title="Limited connection">
            ⚡ Limited
          </div>
        )}

        <UserMenu />
      </div>
    </nav>
  );
}
```

## Testing the Fallback

### Manual Testing Steps:

1. **Test Normal WebSocket Connection:**
   ```
   - Open the app
   - Check browser DevTools Network tab
   - Look for WebSocket connection (ws:// or wss://)
   - Verify messages are real-time
   ```

2. **Test Polling Fallback:**
   ```
   - Block WebSocket in browser (use extensions like "WebSocket Blocker")
   - OR configure firewall to block WebSocket ports
   - Refresh the app
   - Check for HTTP POST requests to /api/events/poll
   - Verify ConnectionStatusIndicator shows "Limited Connection"
   ```

3. **Test Reconnection:**
   ```
   - Disconnect from network
   - Observe reconnection attempts
   - Reconnect to network
   - Verify connection restores automatically
   ```

4. **Test Feature Degradation:**
   ```
   - Force polling mode
   - Try voice chat (should show warning)
   - Try sending messages (should work with delay)
   - Check typing indicators (may not show)
   ```

---

**Pro Tips:**

1. **Use ConnectionStatusIndicator during development** to see when fallback is active
2. **Monitor analytics** to see how often users experience fallback
3. **Adjust polling rate** based on your app's needs (balance responsiveness vs. server load)
4. **Test on mobile networks** which often have restrictive firewalls
5. **Provide user feedback** when features are degraded in polling mode

