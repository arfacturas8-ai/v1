import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  PhoneOff,
  Camera,
  Volume2,
  VolumeX,
  UserPlus,
  Maximize,
  Minimize,
  Settings,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Avatar } from '../../design-system/atoms/Avatar';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type CallStatus = 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

interface CallUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface CallState {
  user?: CallUser;
  type?: 'voice' | 'video';
  direction?: 'incoming' | 'outgoing';
  isCallback?: boolean;
}

interface NetworkStats {
  bitrate: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  resolution?: string;
  fps?: number;
}

const ActiveCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { callId } = useParams();
  const location = useLocation();
  const callData = (location.state as CallState) || {};

  const [callStatus, setCallStatus] = useState<CallStatus>('connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callData.type === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [showNetworkStats, setShowNetworkStats] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('excellent');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Mock network stats - replace with actual WebRTC stats
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    bitrate: 2500,
    packetLoss: 0.5,
    latency: 45,
    jitter: 2,
    resolution: '1280x720',
    fps: 30,
  });

  // Simulate connection and call flow
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  // Initialize WebRTC (placeholder for actual implementation)
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const configuration: RTCConfiguration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Add TURN servers here for production
          ],
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Monitor connection quality
        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          if (state === 'connected' || state === 'completed') {
            setCallStatus('connected');
            setConnectionQuality('excellent');
          } else if (state === 'disconnected') {
            setCallStatus('reconnecting');
            setConnectionQuality('poor');
          } else if (state === 'failed') {
            setCallStatus('failed');
            setConnectionQuality('disconnected');
          }
        };

        // Get network stats periodically
        const statsInterval = setInterval(async () => {
          const stats = await peerConnection.getStats();
          // Process stats here to update networkStats state
          // This is a simplified version
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              setNetworkStats((prev) => ({
                ...prev,
                bitrate: Math.round((report.bytesReceived * 8) / 1000),
                packetLoss: (report.packetsLost / report.packetsReceived) * 100 || 0,
              }));
            }
          });
        }, 1000);

        return () => {
          clearInterval(statsInterval);
          stream.getTracks().forEach((track) => track.stop());
          peerConnection.close();
        };
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        setCallStatus('failed');
      }
    };

    initializeWebRTC();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = useCallback(() => {
    setCallStatus('ended');

    // Stop all media tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Navigate to call ended page with summary
    setTimeout(() => {
      navigate('/calls/ended', {
        state: {
          duration,
          user: callData.user,
          type: callData.type,
          quality: connectionQuality,
        },
      });
    }, 500);
  }, [duration, callData, connectionQuality, navigate]);

  const toggleMute = useCallback(() => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // Replace video track in peer connection
        const videoTrack = screenStream.getVideoTracks()[0];
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Restore camera video
          toggleVideo();
        };

        setIsScreenSharing(true);
      } else {
        // Stop screen sharing and restore camera
        setIsScreenSharing(false);
        toggleVideo();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  }, [isScreenSharing, toggleVideo]);

  const flipCamera = useCallback(async () => {
    // Implementation for mobile devices to switch between front/back camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Toggle between 'user' and 'environment'
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error flipping camera:', error);
    }
  }, []);

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return <Wifi size={16} color={colors.semantic.success} />;
      case 'fair':
        return <Wifi size={16} color={colors.semantic.warning} />;
      case 'poor':
      case 'disconnected':
        return <WifiOff size={16} color={colors.semantic.error} />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'good':
        return colors.semantic.success;
      case 'fair':
        return colors.semantic.warning;
      case 'poor':
      case 'disconnected':
        return colors.semantic.error;
    }
  };

  if (callStatus === 'failed') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: colors.bg.primary,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
          color: colors.text.primary,
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: radii.full,
            backgroundColor: colors.bg.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[4],
          }}
        >
          <PhoneOff size={40} color={colors.semantic.error} />
        </div>
        <h2
          style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing[2],
          }}
        >
          Call Failed
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.base,
            color: colors.text.secondary,
            textAlign: 'center',
            marginBottom: spacing[5],
          }}
        >
          Unable to connect. Please check your internet connection and try again.
        </p>
        <button
          onClick={() => navigate('/calls')}
          style={{
            padding: `${spacing[3]} ${spacing[6]}`,
            backgroundColor: colors.brand.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: radii.lg,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: 'pointer',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.brand.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.brand.primary;
          }}
        >
          Back to Calls
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: colors.bg.primary,
        display: 'flex',
        flexDirection: 'column',
        color: colors.text.primary,
      }}
    >
      {/* Remote Video / Avatar Display */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg.secondary,
        }}
      >
        {isVideoOn && callStatus === 'connected' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing[4],
            }}
          >
            <Avatar
              src={callData.user?.avatar}
              alt={callData.user?.displayName || 'User'}
              name={callData.user?.displayName || 'User'}
              size="2xl"
            />
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.bold,
                  marginBottom: spacing[2],
                }}
              >
                {callData.user?.displayName || 'Unknown'}
              </h2>
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                }}
              >
                @{callData.user?.username || 'unknown'}
              </p>
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div
          style={{
            position: 'absolute',
            top: spacing[4],
            left: '50%',
            transform: 'translateX(-50%)',
            padding: `${spacing[2]} ${spacing[4]}`,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: radii.full,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          {callStatus === 'connecting' && (
            <>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: radii.full,
                  backgroundColor: colors.semantic.warning,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <span style={{ fontSize: typography.fontSize.sm }}>Connecting...</span>
            </>
          )}
          {callStatus === 'connected' && (
            <>
              {getConnectionIcon()}
              <span style={{ fontSize: typography.fontSize.sm }}>{formatDuration(duration)}</span>
            </>
          )}
          {callStatus === 'reconnecting' && (
            <>
              <WifiOff size={16} color={colors.semantic.warning} />
              <span style={{ fontSize: typography.fontSize.sm }}>Reconnecting...</span>
            </>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div
            style={{
              position: 'absolute',
              top: spacing[4],
              right: spacing[4],
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: 'rgba(255, 59, 59, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: radii.full,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              border: `1px solid ${colors.semantic.error}`,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: radii.full,
                backgroundColor: colors.semantic.error,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.error,
              }}
            >
              REC
            </span>
          </div>
        )}

        {/* Self Video Preview */}
        {isVideoOn && !isScreenSharing && (
          <div
            style={{
              position: 'absolute',
              top: spacing[4],
              left: spacing[4],
              width: '180px',
              height: '135px',
              borderRadius: radii.lg,
              overflow: 'hidden',
              border: `2px solid ${colors.border.default}`,
              backgroundColor: colors.bg.tertiary,
              cursor: 'move',
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror effect
              }}
            />
          </div>
        )}

        {/* Network Stats Overlay */}
        {showNetworkStats && (
          <div
            style={{
              position: 'absolute',
              bottom: spacing[20],
              left: spacing[4],
              padding: spacing[4],
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: radii.lg,
              minWidth: '200px',
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[3],
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Network Stats</span>
              <button
                onClick={() => setShowNetworkStats(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Bitrate:
                </span>
                <span style={{ fontSize: typography.fontSize.xs }}>{networkStats.bitrate} kbps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Packet Loss:
                </span>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color:
                      networkStats.packetLoss > 5
                        ? colors.semantic.error
                        : networkStats.packetLoss > 2
                        ? colors.semantic.warning
                        : colors.semantic.success,
                  }}
                >
                  {networkStats.packetLoss.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Latency:
                </span>
                <span style={{ fontSize: typography.fontSize.xs }}>{networkStats.latency} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                  Jitter:
                </span>
                <span style={{ fontSize: typography.fontSize.xs }}>{networkStats.jitter} ms</span>
              </div>
              {networkStats.resolution && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    Resolution:
                  </span>
                  <span style={{ fontSize: typography.fontSize.xs }}>{networkStats.resolution}</span>
                </div>
              )}
              {networkStats.fps && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                    FPS:
                  </span>
                  <span style={{ fontSize: typography.fontSize.xs }}>{networkStats.fps}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          padding: `${spacing[6]} ${spacing[4]}`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[4],
        }}
      >
        {/* Primary Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing[4],
            flexWrap: 'wrap',
          }}
        >
          <ControlButton
            icon={isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            onClick={toggleMute}
            variant={isMuted ? 'danger' : 'default'}
          />

          {callData.type === 'video' && (
            <ControlButton
              icon={isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
              label={isVideoOn ? 'Stop Video' : 'Start Video'}
              active={!isVideoOn}
              onClick={toggleVideo}
              variant={!isVideoOn ? 'danger' : 'default'}
            />
          )}

          <ControlButton
            icon={isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
            label={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
            active={!isSpeakerOn}
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          />

          {callData.type === 'video' && isVideoOn && (
            <>
              <ControlButton
                icon={<Camera size={24} />}
                label="Flip Camera"
                onClick={flipCamera}
              />

              <ControlButton
                icon={<Monitor size={24} />}
                label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                active={isScreenSharing}
                onClick={toggleScreenShare}
              />
            </>
          )}

          <ControlButton icon={<UserPlus size={24} />} label="Add" onClick={() => {}} />

          <ControlButton
            icon={showNetworkStats ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            label="Stats"
            active={showNetworkStats}
            onClick={() => setShowNetworkStats(!showNetworkStats)}
          />

          <ControlButton
            icon={isPictureInPicture ? <Minimize size={24} /> : <Maximize size={24} />}
            label="PiP"
            onClick={() => setIsPictureInPicture(!isPictureInPicture)}
          />
        </div>

        {/* End Call Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleEndCall}
            style={{
              padding: `${spacing[4]} ${spacing[8]}`,
              backgroundColor: colors.semantic.error,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: radii.full,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#CC2F2F';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.semantic.error;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <PhoneOff size={20} />
            End Call
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
  variant = 'default',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[1] }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: radii.full,
          border: 'none',
          backgroundColor:
            variant === 'danger' && active
              ? colors.semantic.error
              : active
              ? colors.brand.primary
              : isHovered
              ? colors.bg.hover
              : colors.bg.elevated,
          color: active || isHovered ? '#FFFFFF' : colors.text.secondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {icon}
      </button>
      <span
        style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default ActiveCallPage;
