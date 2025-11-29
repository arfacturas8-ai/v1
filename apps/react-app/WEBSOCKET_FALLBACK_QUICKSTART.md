# WebSocket Fallback - Quick Start Guide

## What Was Changed?

The WebSocket service now automatically falls back to HTTP polling when WebSocket connections fail. **No code changes are required in your existing application** - the fallback is completely transparent!

## Files Modified

1. **`src/services/websocketService.js`** - Enhanced with HTTP polling fallback

## Files Created

1. **`src/hooks/useConnectionStatus.js`** - Hook to monitor connection status
2. **`src/components/ConnectionStatusIndicator.jsx`** - Visual connection status indicator
3. **`src/components/ConnectionStatusIndicator.css`** - Styles for the indicator
4. **`src/services/__tests__/websocketFallback.test.js`** - Test suite for fallback

## How It Works

```
┌─────────────────────────────────────────────────┐
│  User connects to app                           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Try WebSocket Connection (Socket.IO)           │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ✓ Success         ✗ Failed
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────────────┐
│ Use WebSocket   │  │ Retry (up to 3 times)   │
│ (Real-time)     │  └──────────┬──────────────┘
└─────────────────┘             │
                                │
                           ✗ Still failing
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Fall back to HTTP Polling │
                    │ (2-second intervals)      │
                    └──────────────────────────┘
```

## Quick Integration (Optional)

To show connection status to users, add this to any page:

```jsx
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';

function YourPage() {
  return (
    <div>
      {/* Your page content */}

      {/* Add this at the bottom */}
      <ConnectionStatusIndicator />
    </div>
  );
}
```

That's it! The indicator will automatically show when the connection is degraded.

## Backend Requirements

Your backend needs to implement two new endpoints:

### 1. Poll Events - `POST /api/v1/events/poll`

**Request:**
```json
{
  "lastTimestamp": 1234567890,
  "userId": "user-id",
  "serverId": "server-id",
  "channelId": "channel-id"
}
```

**Response:**
```json
{
  "events": [
    {
      "type": "message:new",
      "data": { "id": "msg-1", "content": "Hello" },
      "timestamp": 1234567891
    }
  ]
}
```

### 2. Send Events - `POST /api/v1/events/send`

**Request:**
```json
{
  "type": "message:send",
  "data": {
    "channelId": "channel-1",
    "content": "Hello",
    "userId": "user-1"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Testing

### Test WebSocket Mode:
```bash
# Normal operation - WebSocket should work
npm run dev
# Check browser DevTools Network tab for WebSocket connection
```

### Test Polling Fallback:
```bash
# Block WebSocket connections using browser extension or firewall
# The app should automatically fall back to polling
# You'll see POST requests to /api/events/poll every 2 seconds
```

## Configuration

You can adjust these settings in `websocketService.js`:

```javascript
// Change polling interval (default: 2000ms / 2 seconds)
this.pollingRate = 2000;

// Change max connection attempts before fallback (default: 3)
this.maxConnectionAttempts = 3;

// Change max reconnect attempts (default: 5)
this.maxReconnectAttempts = 5;
```

## Monitoring

Check connection status programmatically:

```javascript
import websocketService from './services/websocketService';

const status = websocketService.getConnectionStatus();
console.log(status);

// Output:
// {
//   isConnected: true,
//   connectionType: 'polling', // or 'websocket'
//   usePolling: true,
//   reconnectAttempts: 0,
//   ...
// }
```

## Common Questions

**Q: Will my existing code break?**
A: No! The API remains the same. All existing code continues to work.

**Q: How do I know if fallback is active?**
A: Use the `ConnectionStatusIndicator` component or check the browser console for messages like "Switching to HTTP polling fallback".

**Q: What's the performance impact?**
A: In WebSocket mode - none. In polling mode - events may be delayed by up to 2 seconds.

**Q: Can I disable the fallback?**
A: Yes, set `maxConnectionAttempts = 0` to never use polling fallback.

**Q: Does voice chat work with polling?**
A: No, voice chat requires WebSocket. Show a message to users in polling mode.

## Need Help?

- See `WEBSOCKET_FALLBACK_INTEGRATION.md` for detailed documentation
- See `INTEGRATION_EXAMPLES.md` for code examples
- Check `src/services/__tests__/websocketFallback.test.js` for test examples

## Summary

✅ **WebSocket fallback integration is complete and ready to use!**

- ✓ Automatic fallback to HTTP polling
- ✓ Transparent to existing code
- ✓ Connection status monitoring available
- ✓ Exponential backoff for reconnection
- ✓ Visual indicator component included
- ✓ Comprehensive test suite provided

No immediate action required - the fallback works automatically!
