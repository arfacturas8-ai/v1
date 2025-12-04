import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  Video,
  MessageSquare,
  Star,
  AlertTriangle,
  Clock,
  Signal,
  User,
  RotateCcw,
  Home,
  ThumbsUp,
  ThumbsDown,
  Meh,
} from 'lucide-react';
import { Avatar } from '../../design-system/atoms/Avatar';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
type CallQualityRating = 1 | 2 | 3 | 4 | 5;

interface CallSummary {
  duration: number;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  type?: 'voice' | 'video';
  quality?: ConnectionQuality;
  participants?: string[];
}

interface FeedbackState {
  rating: CallQualityRating | null;
  issues: string[];
  comment: string;
}

const CallEndedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const callSummary = (location.state as CallSummary) || {};

  const [showFeedback, setShowFeedback] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>({
    rating: null,
    issues: [],
    comment: '',
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getQualityIcon = () => {
    switch (callSummary.quality) {
      case 'excellent':
      case 'good':
        return <Signal size={20} color={colors.semantic.success} />;
      case 'fair':
        return <Signal size={20} color={colors.semantic.warning} />;
      case 'poor':
      case 'disconnected':
        return <Signal size={20} color={colors.semantic.error} />;
      default:
        return <Signal size={20} color={colors.text.tertiary} />;
    }
  };

  const getQualityText = () => {
    switch (callSummary.quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getQualityColor = () => {
    switch (callSummary.quality) {
      case 'excellent':
      case 'good':
        return colors.semantic.success;
      case 'fair':
        return colors.semantic.warning;
      case 'poor':
      case 'disconnected':
        return colors.semantic.error;
      default:
        return colors.text.tertiary;
    }
  };

  const handleCallAgain = () => {
    navigate(`/calls/active/new`, {
      state: {
        user: callSummary.user,
        type: callSummary.type,
        direction: 'outgoing',
      },
    });
  };

  const handleSendMessage = () => {
    navigate(`/messages/${callSummary.user?.id}`);
  };

  const handleRatingSelect = (rating: CallQualityRating) => {
    setFeedback((prev) => ({ ...prev, rating }));
  };

  const handleIssueToggle = (issue: string) => {
    setFeedback((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter((i) => i !== issue)
        : [...prev.issues, issue],
    }));
  };

  const handleSubmitFeedback = () => {
    // In production, send feedback to backend
    console.log('Feedback submitted:', feedback);
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  const commonIssues = [
    { id: 'audio', label: 'Audio Quality', icon: <Phone size={16} /> },
    { id: 'video', label: 'Video Quality', icon: <Video size={16} /> },
    { id: 'lag', label: 'Lag/Delay', icon: <Clock size={16} /> },
    { id: 'connection', label: 'Connection Issues', icon: <Signal size={16} /> },
    { id: 'echo', label: 'Echo/Feedback', icon: <AlertTriangle size={16} /> },
  ];

  const ratingOptions = [
    { value: 5, icon: <ThumbsUp size={24} />, label: 'Excellent' },
    { value: 4, icon: <ThumbsUp size={24} />, label: 'Good' },
    { value: 3, icon: <Meh size={24} />, label: 'Fair' },
    { value: 2, icon: <ThumbsDown size={24} />, label: 'Poor' },
    { value: 1, icon: <ThumbsDown size={24} />, label: 'Very Poor' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
        color: colors.text.primary,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          animation: `slideUp ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      >
        {/* Call Summary */}
        <div
          style={{
            backgroundColor: colors.bg.secondary,
            borderRadius: radii.xl,
            padding: spacing[6],
            marginBottom: spacing[4],
            textAlign: 'center',
          }}
        >
          {/* Status Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              marginBottom: spacing[4],
              borderRadius: radii.full,
              backgroundColor: colors.bg.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {callSummary.type === 'video' ? (
              <Video size={40} color={colors.text.secondary} />
            ) : (
              <Phone size={40} color={colors.text.secondary} />
            )}
          </div>

          <h2
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[2],
            }}
          >
            Call Ended
          </h2>

          {callSummary.user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[3],
                marginBottom: spacing[4],
              }}
            >
              <Avatar
                src={callSummary.user.avatar}
                alt={callSummary.user.displayName}
                name={callSummary.user.displayName}
                size="md"
              />
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                >
                  {callSummary.user.displayName}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  @{callSummary.user.username}
                </div>
              </div>
            </div>
          )}

          {/* Call Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: spacing[4],
              padding: spacing[4],
              backgroundColor: colors.bg.tertiary,
              borderRadius: radii.lg,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginBottom: spacing[1],
                }}
              >
                Duration
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  justifyContent: 'center',
                }}
              >
                <Clock size={18} />
                {formatDuration(callSummary.duration || 0)}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  marginBottom: spacing[1],
                }}
              >
                Quality
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  justifyContent: 'center',
                  color: getQualityColor(),
                }}
              >
                {getQualityIcon()}
                {getQualityText()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              marginTop: spacing[5],
            }}
          >
            <button
              onClick={handleCallAgain}
              style={{
                flex: 1,
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: colors.brand.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: radii.lg,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.hover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <RotateCcw size={18} />
              Call Again
            </button>

            <button
              onClick={handleSendMessage}
              style={{
                flex: 1,
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: colors.bg.elevated,
                color: colors.text.primary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.lg,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.elevated;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <MessageSquare size={18} />
              Message
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && !feedbackSubmitted && (
          <div
            style={{
              backgroundColor: colors.bg.secondary,
              borderRadius: radii.xl,
              padding: spacing[6],
              marginBottom: spacing[4],
            }}
          >
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[1],
              }}
            >
              How was your call?
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing[4],
              }}
            >
              Your feedback helps us improve call quality
            </p>

            {/* Rating */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: spacing[2],
                marginBottom: spacing[5],
              }}
            >
              {ratingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRatingSelect(option.value as CallQualityRating)}
                  style={{
                    flex: 1,
                    padding: spacing[3],
                    backgroundColor:
                      feedback.rating === option.value ? colors.brand.primary : colors.bg.tertiary,
                    border: 'none',
                    borderRadius: radii.lg,
                    color:
                      feedback.rating === option.value ? '#FFFFFF' : colors.text.secondary,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: spacing[1],
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    if (feedback.rating !== option.value) {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (feedback.rating !== option.value) {
                      e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                    }
                  }}
                  title={option.label}
                >
                  {option.icon}
                  <span style={{ fontSize: typography.fontSize.xs }}>{option.value}</span>
                </button>
              ))}
            </div>

            {/* Issues */}
            {feedback.rating && feedback.rating < 4 && (
              <div style={{ marginBottom: spacing[4] }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    marginBottom: spacing[2],
                    color: colors.text.secondary,
                  }}
                >
                  Any issues? (Optional)
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing[2],
                  }}
                >
                  {commonIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => handleIssueToggle(issue.id)}
                      style={{
                        padding: `${spacing[2]} ${spacing[3]}`,
                        backgroundColor: feedback.issues.includes(issue.id)
                          ? colors.brand.primary
                          : colors.bg.tertiary,
                        border: 'none',
                        borderRadius: radii.full,
                        color: feedback.issues.includes(issue.id)
                          ? '#FFFFFF'
                          : colors.text.secondary,
                        fontSize: typography.fontSize.sm,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing[2],
                        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!feedback.issues.includes(issue.id)) {
                          e.currentTarget.style.backgroundColor = colors.bg.hover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!feedback.issues.includes(issue.id)) {
                          e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                        }
                      }}
                    >
                      {issue.icon}
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comment */}
            {feedback.rating && (
              <div style={{ marginBottom: spacing[4] }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    marginBottom: spacing[2],
                    color: colors.text.secondary,
                  }}
                >
                  Additional comments (Optional)
                </label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) =>
                    setFeedback((prev) => ({ ...prev, comment: e.target.value }))
                  }
                  placeholder="Tell us more about your experience..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: spacing[3],
                    backgroundColor: colors.bg.tertiary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: radii.lg,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    fontFamily: typography.fontFamily.sans,
                    resize: 'vertical',
                    outline: 'none',
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.default;
                    e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                  }}
                />
              </div>
            )}

            {/* Submit Button */}
            {feedback.rating && (
              <button
                onClick={handleSubmitFeedback}
                style={{
                  width: '100%',
                  padding: `${spacing[3]} ${spacing[4]}`,
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
                Submit Feedback
              </button>
            )}
          </div>
        )}

        {feedbackSubmitted && (
          <div
            style={{
              backgroundColor: colors.bg.secondary,
              borderRadius: radii.xl,
              padding: spacing[6],
              marginBottom: spacing[4],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto',
                marginBottom: spacing[3],
                borderRadius: radii.full,
                backgroundColor: colors.semantic.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ThumbsUp size={28} color="#FFFFFF" />
            </div>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[2],
              }}
            >
              Thank you for your feedback!
            </h3>
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
              }}
            >
              Your input helps us make calls better for everyone
            </p>
          </div>
        )}

        {/* Back to Calls */}
        <button
          onClick={() => navigate('/calls')}
          style={{
            width: '100%',
            padding: `${spacing[3]} ${spacing[4]}`,
            backgroundColor: 'transparent',
            color: colors.text.secondary,
            border: 'none',
            borderRadius: radii.lg,
            fontSize: typography.fontSize.base,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[2],
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.text.primary;
            e.currentTarget.style.backgroundColor = colors.bg.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.text.secondary;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Home size={18} />
          Back to Calls
        </button>
      </div>

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default CallEndedPage;
