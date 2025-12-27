import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Video,
  PhoneOff,
  MessageSquare,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Avatar } from '../../design-system/atoms/Avatar';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export interface IncomingCall {
  id: string;
  caller: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    verified?: boolean;
  };
  type: 'voice' | 'video';
  timestamp: Date;
}

interface IncomingCallModalProps {
  call: IncomingCall | null;
  isOpen: boolean;
  onAccept: (withVideo: boolean) => void;
  onDecline: () => void;
  onDeclineWithMessage: () => void;
  onClose: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  isOpen,
  onAccept,
  onDecline,
  onDeclineWithMessage,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showQuickReplyOptions, setShowQuickReplyOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Simulate ringtone
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (isOpen && !isMuted) {
      // In production, use actual ringtone audio file
      // audio = new Audio('/sounds/ringtone.mp3');
      // audio.loop = true;
      // audio.play();
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [isOpen, isMuted]);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleDecline();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Track call duration for UI
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
        setCallDuration(0);
      };
    }
  }, [isOpen]);

  // Handle animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleAccept = useCallback(
    (withVideo: boolean) => {
      setIsAnimating(false);
      setTimeout(() => {
        onAccept(withVideo);
        navigate(`/calls/active/${call?.id}`, {
          state: {
            user: call?.caller,
            type: withVideo ? 'video' : 'voice',
            direction: 'incoming',
          },
        });
      }, 300);
    },
    [call, onAccept, navigate]
  );

  const handleDecline = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onDecline();
      onClose();
    }, 300);
  }, [onDecline, onClose]);

  const handleDeclineWithMessage = useCallback(() => {
    setShowQuickReplyOptions(true);
  }, []);

  const handleQuickReply = useCallback(
    (message: string) => {
      onDeclineWithMessage();
      // In production, send the quick reply message
      handleDecline();
    },
    [onDeclineWithMessage, handleDecline]
  );

  const quickReplyMessages = [
    "Can't talk now",
    "I'll call you back",
    "What's up?",
    "Text me instead",
  ];

  if (!isOpen && !isAnimating) return null;
  if (!call) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300, // Critical alert layer (incoming call)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={handleDecline}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--bg-tertiary)',
          backdropFilter: 'blur(20px)',
          animation: isOpen
            ? `fadeIn ${animation.duration.normal} ${animation.easing.easeOut}`
            : `fadeOut ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '450px',
          margin: spacing[4],
          animation: isOpen
            ? `slideUp ${animation.duration.normal} ${animation.easing.easeOut}`
            : `slideDown ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      >
        {/* Quick Reply Options */}
        {showQuickReplyOptions ? (
          <div
            style={{
              backgroundColor: colors.bg.elevated,
              borderRadius: radii.xl,
              padding: spacing[6],
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing[4],
              }}
            >
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                }}
              >
                Quick Reply
              </h3>
              <button
                onClick={() => setShowQuickReplyOptions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.secondary,
                  cursor: 'pointer',
                  padding: spacing[2],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.md,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
              {quickReplyMessages.map((message) => (
                <button
                  key={message}
                  onClick={() => handleQuickReply(message)}
                  style={{
                    padding: `${spacing[4]} ${spacing[4]}`,
                    backgroundColor: colors.bg.secondary,
                    border: 'none',
                    borderRadius: radii.lg,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }}
                >
                  {message}
                </button>
              ))}
            </div>

            <button
              onClick={handleDecline}
              style={{
                width: '100%',
                marginTop: spacing[4],
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.lg,
                color: colors.text.secondary,
                fontSize: typography.fontSize.base,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.secondary;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              Decline Without Message
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: colors.text.primary,
            }}
          >
            {/* Mute Button */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
              }}
            >
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: radii.full,
                  color: isMuted ? colors.semantic.error : colors.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            {/* Call Type Badge */}
            <div
              style={{
                marginBottom: spacing[6],
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: radii.full,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
              }}
            >
              {call.type === 'video' ? <Video size={16} /> : <Phone size={16} />}
              <span style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
                Incoming {call.type === 'video' ? 'Video' : 'Voice'} Call
              </span>
            </div>

            {/* Caller Avatar - Pulsing Animation */}
            <div
              style={{
                position: 'relative',
                marginBottom: spacing[6],
              }}
            >
              {/* Pulse rings */}
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '140px',
                    height: '140px',
                    borderRadius: radii.full,
                    border: '2px solid rgba(99, 102, 241, 0.3)',
                    animation: `ripple 2s ease-out infinite`,
                    animationDelay: `${index * 0.6}s`,
                  }}
                />
              ))}

              <Avatar
                src={call.caller.avatar}
                alt={call.caller.displayName}
                name={call.caller.displayName}
                size="2xl"
                verified={call.caller.verified}
              />
            </div>

            {/* Caller Info */}
            <h2
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[2],
                textAlign: 'center',
              }}
            >
              {call.caller.displayName}
            </h2>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                marginBottom: spacing[8],
              }}
            >
              @{call.caller.username}
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: spacing[8],
                marginBottom: spacing[4],
              }}
            >
              {/* Decline Button */}
              <button
                onClick={handleDecline}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: colors.semantic.error,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  boxShadow: '0 4px 12px rgba(255, 59, 59, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = '#CC2F2F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = colors.semantic.error;
                }}
              >
                <PhoneOff size={32} />
              </button>

              {/* Accept Button */}
              <button
                onClick={() => handleAccept(call.type === 'video')}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: colors.semantic.success,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  boxShadow: '0 4px 12px rgba(0, 210, 106, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = '#00B85C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = colors.semantic.success;
                }}
              >
                {call.type === 'video' ? <Video size={32} /> : <Phone size={32} />}
              </button>
            </div>

            {/* Secondary Actions */}
            <div
              style={{
                display: 'flex',
                gap: spacing[4],
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {call.type === 'video' && (
                <button
                  onClick={() => handleAccept(false)}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: radii.full,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.sm,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <Phone size={16} />
                  Accept as Voice
                </button>
              )}

              <button
                onClick={handleDeclineWithMessage}
                style={{
                  padding: `${spacing[2]} ${spacing[4]}`,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: radii.full,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <MessageSquare size={16} />
                Decline with Message
              </button>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(40px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(40px) scale(0.9);
            }
          }
          @keyframes ripple {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.6;
            }
            100% {
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default IncomingCallModal;
