# Call Screens Integration Guide

Quick guide to integrate the call screens into your application.

## Step 1: Add Routes

Add these routes to your React Router configuration:

```typescript
// In your routes file (e.g., App.tsx or routes.tsx)
import {
  CallsHistoryPage,
  ActiveCallPage,
  CallEndedPage,
} from './pages/calls';

// Inside your Routes component
<Route path="/calls" element={<CallsHistoryPage />} />
<Route path="/calls/active/:callId" element={<ActiveCallPage />} />
<Route path="/calls/ended" element={<CallEndedPage />} />
```

## Step 2: Add Incoming Call Modal to App Layout

Add the IncomingCallModal to your main app layout so it can appear anywhere:

```typescript
// In your AppLayout.tsx or main App.tsx
import { useState, useEffect } from 'react';
import { IncomingCallModal, IncomingCall } from './pages/calls';

function AppLayout() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Listen for incoming calls (via WebSocket, etc.)
  useEffect(() => {
    // Example: WebSocket listener
    // socket.on('incoming-call', (data) => {
    //   setIncomingCall({
    //     id: data.callId,
    //     caller: data.caller,
    //     type: data.type,
    //     timestamp: new Date(),
    //   });
    // });

    return () => {
      // socket.off('incoming-call');
    };
  }, []);

  const handleAcceptCall = (withVideo: boolean) => {
    // Handle call acceptance
    console.log('Call accepted with video:', withVideo);
  };

  const handleDeclineCall = () => {
    // Handle call decline
    console.log('Call declined');
    setIncomingCall(null);
  };

  const handleDeclineWithMessage = () => {
    // Send quick reply and decline
    console.log('Declined with message');
    setIncomingCall(null);
  };

  return (
    <div>
      {/* Your app content */}
      <YourAppContent />

      {/* Incoming Call Modal */}
      <IncomingCallModal
        call={incomingCall}
        isOpen={!!incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onDeclineWithMessage={handleDeclineWithMessage}
        onClose={() => setIncomingCall(null)}
      />
    </div>
  );
}
```

## Step 3: Add Call Button to Messages/Chat

Add call buttons to your message or chat interface:

```typescript
import { Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function ChatHeader({ user }) {
  const navigate = useNavigate();

  const startCall = (type: 'voice' | 'video') => {
    navigate(`/calls/active/new`, {
      state: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        type,
        direction: 'outgoing',
      },
    });
  };

  return (
    <div className="chat-header">
      <h2>{user.displayName}</h2>
      <div className="call-buttons">
        <button onClick={() => startCall('voice')}>
          <Phone size={20} />
        </button>
        <button onClick={() => startCall('video')}>
          <Video size={20} />
        </button>
      </div>
    </div>
  );
}
```

## Step 4: WebSocket Integration (Example)

Set up WebSocket for signaling:

```typescript
// services/call-signaling.ts
import io from 'socket.io-client';

class CallSignalingService {
  private socket: any;

  constructor() {
    this.socket = io('wss://your-signaling-server.com');
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for incoming calls
    this.socket.on('incoming-call', (data: any) => {
      // Trigger incoming call modal
      window.dispatchEvent(
        new CustomEvent('incoming-call', { detail: data })
      );
    });

    // Listen for call acceptance
    this.socket.on('call-accepted', (data: any) => {
      // Start peer connection
      console.log('Call accepted:', data);
    });

    // Listen for call rejection
    this.socket.on('call-rejected', (data: any) => {
      // Handle rejection
      console.log('Call rejected:', data);
    });

    // Listen for ICE candidates
    this.socket.on('ice-candidate', (data: any) => {
      // Add ICE candidate to peer connection
      console.log('ICE candidate received:', data);
    });
  }

  // Initiate a call
  initiateCall(userId: string, type: 'voice' | 'video') {
    this.socket.emit('initiate-call', {
      to: userId,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  // Accept a call
  acceptCall(callId: string) {
    this.socket.emit('accept-call', { callId });
  }

  // Decline a call
  declineCall(callId: string, message?: string) {
    this.socket.emit('decline-call', { callId, message });
  }

  // Send ICE candidate
  sendIceCandidate(callId: string, candidate: RTCIceCandidate) {
    this.socket.emit('ice-candidate', { callId, candidate });
  }

  // End a call
  endCall(callId: string) {
    this.socket.emit('end-call', { callId });
  }
}

export const callSignaling = new CallSignalingService();
```

## Step 5: State Management (Optional)

If using Zustand for state management:

```typescript
// stores/call-store.ts
import { create } from 'zustand';

interface CallStore {
  activeCall: any | null;
  incomingCall: any | null;
  callHistory: any[];

  setActiveCall: (call: any) => void;
  setIncomingCall: (call: any) => void;
  addToHistory: (call: any) => void;
  clearActiveCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  activeCall: null,
  incomingCall: null,
  callHistory: [],

  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  addToHistory: (call) =>
    set((state) => ({
      callHistory: [call, ...state.callHistory]
    })),
  clearActiveCall: () => set({ activeCall: null }),
}));
```

## Step 6: Navigation Integration

Add call history link to your navigation:

```typescript
// In your navigation component
import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

<Link to="/calls">
  <Phone size={20} />
  <span>Calls</span>
</Link>
```

## Step 7: Permissions Check

Check permissions before starting a call:

```typescript
import { requestMediaPermissions, isWebRTCSupported } from './pages/calls/webrtc-utils';

async function checkPermissionsBeforeCall(type: 'voice' | 'video') {
  // Check WebRTC support
  if (!isWebRTCSupported()) {
    alert('Your browser does not support video calls');
    return false;
  }

  // Request permissions
  const stream = await requestMediaPermissions(type);

  if (!stream) {
    alert('Please allow camera and microphone access to make calls');
    return false;
  }

  // Clean up test stream
  stream.getTracks().forEach(track => track.stop());

  return true;
}
```

## Step 8: Testing

Test the implementation:

1. **Local Testing**:
   ```bash
   npm run dev
   # Navigate to /calls to see call history
   # Click call button to start a test call
   ```

2. **WebRTC Testing**:
   - Test with two browser tabs/windows
   - Test camera and microphone access
   - Test screen sharing
   - Test network quality indicators

3. **Cross-Browser Testing**:
   - Chrome/Edge
   - Firefox
   - Safari
   - Mobile browsers

## Environment Variables

Add these to your `.env` file:

```env
# Signaling server
VITE_SIGNALING_SERVER_URL=wss://your-signaling-server.com

# STUN/TURN servers
VITE_STUN_SERVER_URL=stun:stun.l.google.com:19302
VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-password
```

## Troubleshooting

### Common Issues

1. **No video/audio**:
   - Check browser permissions
   - Verify camera/microphone are not in use by another app
   - Check getUserMedia errors in console

2. **Connection fails**:
   - Verify STUN/TURN server configuration
   - Check firewall rules
   - Test ICE candidate gathering

3. **Poor quality**:
   - Adjust media constraints
   - Check network bandwidth
   - Monitor WebRTC stats

### Debug Mode

Enable debug logging:

```typescript
// Add to ActiveCallPage.tsx
useEffect(() => {
  if (import.meta.env.DEV) {
    console.log('WebRTC Debug Mode Enabled');
    // Log all WebRTC events
  }
}, []);
```

## Production Checklist

- [ ] Configure production STUN/TURN servers
- [ ] Set up signaling server
- [ ] Test on all target browsers
- [ ] Test on mobile devices
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Add analytics tracking
- [ ] Test under various network conditions
- [ ] Set up monitoring alerts
- [ ] Document API endpoints

## Support

For issues or questions about integration:
1. Check the README.md for detailed documentation
2. Review webrtc-utils.ts for helper functions
3. Check browser console for errors
4. Verify WebRTC stats for connection issues

## Next Steps

After integration:
1. Customize UI colors and styling to match your brand
2. Add call recording functionality
3. Implement group calls
4. Add virtual backgrounds
5. Integrate with your notification system
6. Add call analytics and metrics
