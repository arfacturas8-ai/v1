import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface VoteOption {
  id: string;
  direction: 'up' | 'down';
  label: string;
  amount: number;
  voters: number;
  percentage: number;
}

const mockVoteData: VoteOption[] = [
  {
    id: 'up',
    direction: 'up',
    label: 'Price will go UP',
    amount: 12500,
    voters: 342,
    percentage: 68,
  },
  {
    id: 'down',
    direction: 'down',
    label: 'Price will go DOWN',
    amount: 5900,
    voters: 158,
    percentage: 32,
  },
];

export default function VotePage() {
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();
  const [voteData] = useState<VoteOption[]>(mockVoteData);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const assetName = 'Bitcoin';
  const currentPrice = '$42,156.78';
  const endTime = '2024-01-20T18:00:00Z';

  const handleVote = () => {
    if (!selectedVote || !stakeAmount || parseFloat(stakeAmount) <= 0) return;
    setHasVoted(true);
  };

  const formatTimeRemaining = (endTimeStr: string): string => {
    const now = new Date();
    const end = new Date(endTimeStr);
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    return 'Ending soon';
  };

  const canVote = selectedVote && stakeAmount && parseFloat(stakeAmount) > 0 && !hasVoted;

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
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
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
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Vote on {assetName}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              Current price: {currentPrice}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* Time remaining */}
        <div
          style={{
            padding: spacing[3],
            backgroundColor: colors.brand.primary + '10',
            border: `1px solid ${colors.brand.primary}`,
            borderRadius: '12px',
            marginBottom: spacing[4],
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <Calendar size={16} color={colors.brand.primary} />
          <span style={{ fontSize: typography.fontSize.sm, color: colors.brand.primary, fontWeight: typography.fontWeight.semibold }}>
            {formatTimeRemaining(endTime)}
          </span>
        </div>

        {/* Vote options */}
        <div style={{ marginBottom: spacing[4] }}>
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}
          >
            What's your prediction?
          </h2>

          {voteData.map((option) => (
            <div
              key={option.id}
              onClick={() => !hasVoted && setSelectedVote(option.id)}
              style={{
                padding: spacing[4],
                backgroundColor: selectedVote === option.id ? (option.direction === 'up' ? colors.semantic.success + '10' : colors.semantic.error + '10') : colors.bg.secondary,
                border: `2px solid ${selectedVote === option.id ? (option.direction === 'up' ? colors.semantic.success : colors.semantic.error) : colors.border.default}`,
                borderRadius: '12px',
                marginBottom: spacing[3],
                cursor: hasVoted ? 'default' : 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: option.direction === 'up' ? colors.semantic.success + '20' : colors.semantic.error + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {option.direction === 'up' ? (
                    <TrendingUp size={24} color={colors.semantic.success} />
                  ) : (
                    <TrendingDown size={24} color={colors.semantic.error} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    {option.label}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    {option.voters.toLocaleString()} voters • ${option.amount.toLocaleString()} staked
                  </div>
                </div>
                {!hasVoted && (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedVote === option.id ? (option.direction === 'up' ? colors.semantic.success : colors.semantic.error) : colors.border.default}`,
                      backgroundColor: selectedVote === option.id ? (option.direction === 'up' ? colors.semantic.success : colors.semantic.error) : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedVote === option.id && (
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
                )}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '8px',
                  backgroundColor: colors.bg.tertiary,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: spacing[2],
                }}
              >
                <div
                  style={{
                    width: `${option.percentage}%`,
                    height: '100%',
                    backgroundColor: option.direction === 'up' ? colors.semantic.success : colors.semantic.error,
                    transition: 'width 300ms ease-out',
                  }}
                />
              </div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.secondary }}>
                {option.percentage}% of votes
              </div>
            </div>
          ))}
        </div>

        {/* Stake amount */}
        {!hasVoted && (
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
              Stake amount (USD)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign
                size={20}
                color={colors.text.tertiary}
                style={{
                  position: 'absolute',
                  left: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: spacing[3],
                  paddingLeft: `calc(${spacing[3]} + 28px)`,
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '12px',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              />
            </div>
            <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[2], margin: 0 }}>
              Minimum stake: $10.00
            </p>
          </div>
        )}

        {/* Submit button */}
        {!hasVoted && (
          <button
            onClick={handleVote}
            disabled={!canVote}
            style={{
              width: '100%',
              padding: spacing[4],
              borderRadius: '12px',
              border: 'none',
              backgroundColor: canVote ? colors.brand.primary : colors.bg.tertiary,
              color: canVote ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: canVote ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (canVote) {
                e.currentTarget.style.backgroundColor = colors.brand.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (canVote) {
                e.currentTarget.style.backgroundColor = colors.brand.primary;
              }
            }}
          >
            Submit vote
          </button>
        )}

        {/* Success message */}
        {hasVoted && (
          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors.semantic.success + '10',
              border: `1px solid ${colors.semantic.success}`,
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.semantic.success,
                marginBottom: spacing[2],
              }}
            >
              Vote submitted successfully!
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              You staked ${parseFloat(stakeAmount).toFixed(2)} on {voteData.find(v => v.id === selectedVote)?.label.toLowerCase()}
            </div>
          </div>
        )}

        {/* Info */}
        <div
          style={{
            marginTop: spacing[4],
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            borderRadius: '12px',
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Vote with your stake on whether you think {assetName}'s price will go up or down. Winners split the losers' stakes proportionally. Voting ends {formatTimeRemaining(endTime).toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  );
}
