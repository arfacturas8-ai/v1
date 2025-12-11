import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, AlertTriangle, Ban, CheckCircle } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ReportReason {
  id: string;
  label: string;
  description: string;
}

const reportReasons: ReportReason[] = [
  {
    id: 'spam',
    label: 'Spam',
    description: 'Excessive promotional content or repetitive posts',
  },
  {
    id: 'harassment',
    label: 'Harassment or bullying',
    description: 'Targeting someone with abusive behavior',
  },
  {
    id: 'hate_speech',
    label: 'Hate speech',
    description: 'Content that attacks or promotes hatred',
  },
  {
    id: 'violence',
    label: 'Violence or threats',
    description: 'Threatening, violent, or graphic content',
  },
  {
    id: 'misinformation',
    label: 'Misinformation',
    description: 'False or misleading information',
  },
  {
    id: 'illegal',
    label: 'Illegal activities',
    description: 'Content promoting illegal activities',
  },
  {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else',
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'Other issues not listed here',
  },
];

export default function BlockReportPage() {
  const navigate = useNavigate();
  const { username, type } = useParams<{ username: string; type?: string }>();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [blockUser, setBlockUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isReport = type === 'report';

  const handleSubmit = async () => {
    if (!selectedReason && isReport) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setSubmitted(true);

    // Navigate back after showing success
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: spacing[8] }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: colors.semantic.success + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              marginBottom: spacing[4],
            }}
          >
            <CheckCircle size={40} color={colors.semantic.success} />
          </div>
          <h2
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            {isReport ? 'Report submitted' : 'User blocked'}
          </h2>
          <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
            {isReport
              ? 'Thank you for helping keep our community safe. We\'ll review your report.'
              : `You've blocked @${username}. They won't be able to see your content or contact you.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[4],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Cancel"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} color={colors.text.primary} />
            </button>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              {isReport ? `Report @${username}` : `Block @${username}`}
            </h1>
          </div>

          <button
            onClick={handleSubmit}
            disabled={(!selectedReason && isReport) || isSubmitting}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: (selectedReason || !isReport) && !isSubmitting ? colors.semantic.error : colors.bg.tertiary,
              color: (selectedReason || !isReport) && !isSubmitting ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: (selectedReason || !isReport) && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
            }}
          >
            {isReport ? 'Report' : 'Block'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* Warning banner */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.warning + '10',
            borderRadius: '12px',
            border: `1px solid ${colors.semantic.warning}`,
            marginBottom: spacing[4],
            display: 'flex',
            gap: spacing[3],
          }}
        >
          <AlertTriangle size={20} color={colors.semantic.warning} style={{ flexShrink: 0, marginTop: spacing[1] }} />
          <div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: spacing[1],
              }}
            >
              {isReport ? 'Reporting this user' : 'Blocking this user'}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: typography.lineHeight.relaxed }}>
              {isReport
                ? 'Your report will be reviewed by our moderation team. False reports may result in action against your account.'
                : 'This user will not be able to see your posts, message you, or interact with your content. You can unblock them anytime from settings.'}
            </div>
          </div>
        </div>

        {/* Report reasons (only for reports) */}
        {isReport && (
          <div style={{ marginBottom: spacing[4] }}>
            <h2
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}
            >
              Why are you reporting @{username}?
            </h2>

            {reportReasons.map((reason) => (
              <div
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                style={{
                  padding: spacing[4],
                  backgroundColor: selectedReason === reason.id ? colors.brand.primary + '10' : colors.bg.secondary,
                  border: `2px solid ${selectedReason === reason.id ? colors.brand.primary : colors.border.default}`,
                  borderRadius: '12px',
                  marginBottom: spacing[3],
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        marginBottom: spacing[1],
                      }}
                    >
                      {reason.label}
                    </div>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                      {reason.description}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedReason === reason.id ? colors.brand.primary : colors.border.default}`,
                      backgroundColor: selectedReason === reason.id ? colors.brand.primary : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedReason === reason.id && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'white',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional information */}
        {isReport && (
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Additional information (optional)
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Provide any additional context that might help us review this report..."
              maxLength={500}
              rows={4}
              style={{
                width: '100%',
                padding: spacing[3],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[2] }}>
              {additionalInfo.length}/500 characters
            </div>
          </div>
        )}

        {/* Block user option (for reports) */}
        {isReport && (
          <div
            onClick={() => setBlockUser(!blockUser)}
            style={{
              padding: spacing[4],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <Ban size={20} color={colors.text.tertiary} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                }}
              >
                Also block @{username}
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                They won't be able to see your content or message you
              </div>
            </div>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: `2px solid ${blockUser ? colors.brand.primary : colors.border.default}`,
                backgroundColor: blockUser ? colors.brand.primary : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {blockUser && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
