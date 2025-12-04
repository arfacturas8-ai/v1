# Call Screens - WebRTC Ready Implementation

This directory contains production-ready call screens with WebRTC architecture for voice and video calling capabilities.

## Files Overview

### 1. CallsHistoryPage.tsx
Call history list with comprehensive features:
- **Filtering**: All, Missed, Incoming, Outgoing tabs
- **Search**: Real-time search by name or username
- **Call Types**: Voice and video indicators
- **Call Details**: Duration, timestamp, call quality
- **Actions**: Call back, view details, delete
- **Empty State**: Helpful messaging when no calls exist
- **Context Menu**: Per-call actions menu
- **Responsive Design**: Works on all screen sizes

**Key Features:**
- Real-time call history updates
- Persistent search functionality
- Color-coded call status (missed = red, incoming = green)
- Time-relative timestamps (e.g., "2h ago", "Yesterday")
- Avatar with online/offline status
- Smooth animations and transitions

### 2. ActiveCallPage.tsx
Full-screen active call interface:
- **WebRTC Integration**: RTCPeerConnection setup
- **Video Display**: Remote participant video stream
- **Self-Video Preview**: Draggable, mirrored local video
- **Controls**:
  - Mute/Unmute microphone
  - Enable/Disable camera
  - Flip camera (front/back)
  - Speaker toggle
  - Screen sharing
  - Add participants
  - Picture-in-picture mode
- **Connection Monitoring**:
  - Real-time quality indicator
  - Network stats overlay (bitrate, packet loss, latency, jitter)
  - Auto-reconnect on connection issues
- **Call Status**: Connecting, Connected, Reconnecting, Failed states
- **Duration Timer**: Real-time call duration display
- **Recording Indicator**: Visual indicator when call is being recorded

**WebRTC Implementation:**
```typescript
// Initialize WebRTC connection
const peerConnection = new RTCPeerConnection(configuration);

// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
  video: isVideoOn,
  audio: true,
});

// Add tracks to peer connection
stream.getTracks().forEach((track) => {
  peerConnection.addTrack(track, stream);
});

// Handle remote stream
peerConnection.ontrack = (event) => {
  remoteVideoRef.current.srcObject = event.streams[0];
};

// Monitor connection quality
peerConnection.oniceconnectionstatechange = () => {
  // Handle connection state changes
};
```

### 3. IncomingCallModal.tsx
Full-screen incoming call overlay:
- **Caller Information**: Avatar, name, username, verified badge
- **Call Type Indicator**: Voice or Video badge
- **Ringtone Simulation**: Audio playback (mutable)
- **Actions**:
  - Accept call (video or voice)
  - Decline call
  - Decline with message (quick replies)
  - Accept video call as voice only
- **Animations**: Pulsing avatar rings, smooth transitions
- **Auto-dismiss**: Automatically declines after 30 seconds
- **Quick Replies**:
  - "Can't talk now"
  - "I'll call you back"
  - "What's up?"
  - "Text me instead"

**Integration Example:**
```typescript
const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

<IncomingCallModal
  call={incomingCall}
  isOpen={!!incomingCall}
  onAccept={(withVideo) => {
    // Handle call acceptance
    navigate(`/calls/active/${incomingCall.id}`);
  }}
  onDecline={() => {
    // Handle decline
    setIncomingCall(null);
  }}
  onDeclineWithMessage={() => {
    // Send quick reply and decline
  }}
  onClose={() => setIncomingCall(null)}
/>
```

### 4. CallEndedPage.tsx
Post-call summary and feedback:
- **Call Summary**:
  - Duration display
  - Participant information
  - Connection quality rating
- **Quick Actions**:
  - Call again (immediate redial)
  - Send message
  - Back to call history
- **Quality Feedback**:
  - 5-star rating system
  - Issue reporting (audio, video, lag, connection, echo)
  - Additional comments
  - Thank you confirmation
- **Stats Display**: Duration and quality metrics
- **Smooth Transitions**: Animated entry and exit

## WebRTC Architecture

### Connection Flow

```
1. User initiates call
   ↓
2. Get user media (camera/microphone)
   ↓
3. Create RTCPeerConnection
   ↓
4. Create offer/answer (SDP)
   ↓
5. Exchange ICE candidates
   ↓
6. Establish peer-to-peer connection
   ↓
7. Stream media tracks
   ↓
8. Monitor connection quality
   ↓
9. End call and cleanup
```

### Signaling Server Integration

The implementation is ready for signaling server integration. You'll need to implement:

```typescript
// Signaling service example
class SignalingService {
  async createCall(userId: string, type: 'voice' | 'video') {
    // Send call initiation to signaling server
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    await this.sendToServer({
      type: 'call-offer',
      to: userId,
      offer: offer,
    });
  }

  async handleIncomingCall(data: any) {
    // Handle incoming call from signaling server
    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    await this.sendToServer({
      type: 'call-answer',
      to: data.from,
      answer: answer,
    });
  }

  async handleICECandidate(candidate: RTCIceCandidate) {
    // Send ICE candidate to signaling server
    await this.sendToServer({
      type: 'ice-candidate',
      candidate: candidate,
    });
  }
}
```

### STUN/TURN Server Configuration

For production, configure STUN/TURN servers:

```typescript
const configuration: RTCConfiguration = {
  iceServers: [
    // STUN servers (public)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },

    // TURN servers (private - required for most production scenarios)
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password',
    },
  ],
  iceCandidatePoolSize: 10,
};
```

### Media Constraints

Optimized media constraints for different scenarios:

```typescript
// High quality video call
const hdConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// Mobile-optimized constraints
const mobileConstraints = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
    facingMode: 'user',
  },
  audio: true,
};

// Voice-only call
const audioOnlyConstraints = {
  video: false,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};
```

## State Management Integration

### Using Zustand Store

```typescript
// stores/call-store.ts
import { create } from 'zustand';

interface CallState {
  activeCall: ActiveCall | null;
  incomingCall: IncomingCall | null;
  callHistory: CallHistoryItem[];

  setActiveCall: (call: ActiveCall | null) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  addToHistory: (call: CallHistoryItem) => void;
  updateCallStatus: (callId: string, status: CallStatus) => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  incomingCall: null,
  callHistory: [],

  setActiveCall: (call) => set({ activeCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  addToHistory: (call) =>
    set((state) => ({
      callHistory: [call, ...state.callHistory],
    })),
  updateCallStatus: (callId, status) =>
    set((state) => ({
      callHistory: state.callHistory.map((call) =>
        call.id === callId ? { ...call, status } : call
      ),
    })),
}));
```

## Error Handling

Comprehensive error handling is implemented for:

1. **Media Access Errors**: Permission denied, device not found
2. **Connection Errors**: Failed to connect, timeout
3. **Network Errors**: Poor connection, packet loss
4. **Browser Compatibility**: WebRTC not supported

Example error handling:
```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied camera/microphone permission
    showPermissionDialog();
  } else if (error.name === 'NotFoundError') {
    // Camera/microphone not found
    showDeviceNotFoundError();
  } else if (error.name === 'NotReadableError') {
    // Device already in use
    showDeviceInUseError();
  }
}
```

## Performance Optimizations

1. **Adaptive Bitrate**: Automatically adjusts based on network conditions
2. **Media Track Management**: Proper cleanup to prevent memory leaks
3. **Connection State Monitoring**: Real-time quality adjustments
4. **Lazy Loading**: Components load only when needed
5. **Memoization**: React.memo and useMemo for expensive operations

## Testing Recommendations

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test WebRTC connection flow
3. **E2E Tests**: Test complete call scenarios
4. **Network Simulation**: Test under various network conditions
5. **Device Testing**: Test on multiple devices and browsers

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11+)
- Opera: Full support

## Security Considerations

1. **Encrypted Media**: All media streams are encrypted (DTLS-SRTP)
2. **Secure Signaling**: Use WSS (WebSocket Secure) for signaling
3. **Permission Management**: Request only necessary permissions
4. **TURN Authentication**: Use time-limited credentials
5. **Content Security Policy**: Configure CSP headers properly

## Production Deployment Checklist

- [ ] Configure STUN/TURN servers
- [ ] Implement signaling server
- [ ] Set up media server (optional, for group calls)
- [ ] Configure firewall rules for WebRTC ports
- [ ] Implement call recording (if needed)
- [ ] Set up monitoring and analytics
- [ ] Test across all target browsers and devices
- [ ] Implement rate limiting for API calls
- [ ] Add error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets

## Future Enhancements

- [ ] Group calls (multiple participants)
- [ ] Screen sharing with audio
- [ ] Virtual backgrounds
- [ ] Call recording and playback
- [ ] Live captions/transcription
- [ ] Noise cancellation (advanced)
- [ ] Beauty filters
- [ ] Call transfer
- [ ] Call waiting
- [ ] Conference rooms

## Usage Examples

### Basic Call Flow

```typescript
// Start a call
const startCall = (userId: string, type: 'voice' | 'video') => {
  navigate(`/calls/active/new`, {
    state: {
      user: { id: userId, ... },
      type,
      direction: 'outgoing',
    },
  });
};

// Handle incoming call
useEffect(() => {
  // Listen for incoming calls from WebSocket
  socket.on('incoming-call', (data) => {
    setIncomingCall({
      id: data.callId,
      caller: data.caller,
      type: data.type,
      timestamp: new Date(),
    });
  });
}, []);
```

## Support

For issues or questions:
- Check browser console for WebRTC errors
- Verify camera/microphone permissions
- Test STUN/TURN server connectivity
- Review network firewall settings

## License

Part of the CRYB.AI platform - All rights reserved.
