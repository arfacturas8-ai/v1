import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Check } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  hasVoted: boolean;
  votedOptionId?: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  createdAt: string;
}

const mockPoll: Poll = {
  id: '1',
  question: 'Which blockchain has the best potential for mass adoption in 2025?',
  options: [
    { id: '1', text: 'Ethereum', votes: 4523, percentage: 42.3 },
    { id: '2', text: 'Solana', votes: 3211, percentage: 30.0 },
    { id: '3', text: 'Polygon', votes: 1876, percentage: 17.5 },
    { id: '4', text: 'Avalanche', votes: 1090, percentage: 10.2 },
  ],
  totalVotes: 10700,
  endsAt: '2024-01-20T23:59:59Z',
  hasVoted: false,
  author: {
    username: 'cryptoanalyst',
    displayName: 'Crypto Analyst',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=cryptoanalyst',
    isVerified: true,
  },
  createdAt: '2024-01-15T10:00:00Z',
};

export default function PollDetailPage() {
  const navigate = useNavigate();
  const { pollId } = useParams<{ pollId: string }>();
  const [poll, setPoll] = useState<Poll>(mockPoll);
  const [selectedOption, setSelectedOption] = useState<string | null>(poll.votedOptionId || null);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeRemaining = (endsAt: string): string => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Poll ended';

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVote = () => {
    if (!selectedOption || poll.hasVoted) return;

    setPoll((prev) => {
      const newOptions = prev.options.map((opt) => {
        if (opt.id === selectedOption) {
          const newVotes = opt.votes + 1;
          const newTotal = prev.totalVotes + 1;
          return {
            ...opt,
            votes: newVotes,
            percentage: (newVotes / newTotal) * 100,
          };
        }
        return {
          ...opt,
          percentage: (opt.votes / (prev.totalVotes + 1)) * 100,
        };
      });

      return {
        ...prev,
        options: newOptions,
        totalVotes: prev.totalVotes + 1,
        hasVoted: true,
        votedOptionId: selectedOption,
      };
    });
  };

  const isPollEnded = new Date(poll.endsAt) <= new Date();
  const canVote = !poll.hasVoted && !isPollEnded && selectedOption !== null;

  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);
  const winningOption = sortedOptions[0];

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
              Poll
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Author info */}
        <div style={{ padding: spacing[4], borderBottom: `1px solid ${colors.border.default}` }}>
          <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[4] }}>
            <img
              src={poll.author.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${poll.author.username}`}
              alt={poll.author.displayName}
              onClick={() => navigate(`/user/${poll.author.username}`)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                <span
                  onClick={() => navigate(`/user/${poll.author.username}`)}
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    cursor: 'pointer',
                  }}
                >
                  {poll.author.displayName}
                </span>
                {poll.author.isVerified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: `0 ${spacing[1]}`,
                      backgroundColor: colors.semantic.success,
                      borderRadius: '2px',
                      fontSize: typography.fontSize.xs,
                      color: 'white',
                      fontWeight: typography.fontWeight.bold,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                @{poll.author.username}
              </div>
            </div>
          </div>

          {/* Question */}
          <h2
            style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
              marginBottom: spacing[4],
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {poll.question}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            {poll.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isVoted = poll.votedOptionId === option.id;
              const isWinning = poll.hasVoted && option.id === winningOption.id;
              const showResults = poll.hasVoted || isPollEnded;

              return (
                <div
                  key={option.id}
                  onClick={() => !poll.hasVoted && !isPollEnded && setSelectedOption(option.id)}
                  style={{
                    position: 'relative',
                    padding: spacing[3],
                    border: `2px solid ${
                      isSelected && !poll.hasVoted
                        ? colors.brand.primary
                        : isVoted
                        ? colors.brand.primary
                        : colors.border.default
                    }`,
                    borderRadius: '12px',
                    cursor: poll.hasVoted || isPollEnded ? 'default' : 'pointer',
                    overflow: 'hidden',
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    if (!poll.hasVoted && !isPollEnded) {
                      e.currentTarget.style.backgroundColor = colors.bg.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!poll.hasVoted && !isPollEnded) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Progress bar */}
                  {showResults && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${option.percentage}%`,
                        backgroundColor: isWinning
                          ? colors.brand.primary + '20'
                          : isVoted
                          ? colors.brand.primary + '10'
                          : colors.bg.secondary,
                        transition: 'width 300ms ease-out',
                      }}
                    />
                  )}

                  {/* Content */}
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: spacing[3],
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flex: 1 }}>
                      {isSelected && !poll.hasVoted && !isPollEnded && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: colors.brand.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={14} color="white" />
                        </div>
                      )}
                      {isVoted && (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: colors.brand.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={14} color="white" />
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: showResults ? typography.fontWeight.semibold : typography.fontWeight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        {option.text}
                      </span>
                    </div>

                    {showResults && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                        <span
                          style={{
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.bold,
                            color: isWinning ? colors.brand.primary : colors.text.primary,
                          }}
                        >
                          {option.percentage.toFixed(1)}%
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.tertiary,
                          }}
                        >
                          ({formatNumber(option.votes)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vote button */}
          {!poll.hasVoted && !isPollEnded && (
            <button
              onClick={handleVote}
              disabled={!canVote}
              style={{
                width: '100%',
                marginTop: spacing[4],
                padding: `${spacing[3]} ${spacing[4]}`,
                backgroundColor: canVote ? colors.brand.primary : colors.bg.secondary,
                color: canVote ? 'white' : colors.text.tertiary,
                border: 'none',
                borderRadius: '24px',
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: canVote ? 'pointer' : 'not-allowed',
                transition: 'all 150ms ease-out',
              }}
            >
              {selectedOption ? 'Submit vote' : 'Select an option'}
            </button>
          )}

          {/* Poll info */}
          <div
            style={{
              marginTop: spacing[4],
              padding: spacing[3],
              backgroundColor: colors.bg.secondary,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[4],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <BarChart3 size={16} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                {formatNumber(poll.totalVotes)} {poll.totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </div>

            <div
              style={{
                height: '20px',
                width: '1px',
                backgroundColor: colors.border.default,
              }}
            />

            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: isPollEnded ? colors.semantic.error : colors.text.tertiary,
                fontWeight: isPollEnded ? typography.fontWeight.semibold : typography.fontWeight.medium,
              }}
            >
              {formatTimeRemaining(poll.endsAt)}
            </span>
          </div>

          {/* Timestamps */}
          <div style={{ marginTop: spacing[3] }}>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
              Created: {formatDate(poll.createdAt)}
            </div>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
              Ends: {formatDate(poll.endsAt)}
            </div>
          </div>
        </div>

        {/* Results breakdown */}
        {(poll.hasVoted || isPollEnded) && (
          <div style={{ padding: spacing[4] }}>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}
            >
              Results
            </h3>

            {sortedOptions.map((option, index) => (
              <div
                key={option.id}
                style={{
                  marginBottom: spacing[3],
                  paddingBottom: spacing[3],
                  borderBottom: index < sortedOptions.length - 1 ? `1px solid ${colors.border.default}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? colors.brand.primary : colors.bg.secondary,
                        color: index === 0 ? 'white' : colors.text.tertiary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>
                      {option.text}
                    </span>
                    {poll.votedOptionId === option.id && (
                      <span
                        style={{
                          padding: `${spacing[1]} ${spacing[2]}`,
                          backgroundColor: colors.brand.primary + '20',
                          borderRadius: '4px',
                          fontSize: typography.fontSize.xs,
                          color: colors.brand.primary,
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        Your vote
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                    {option.percentage.toFixed(1)}%
                  </span>
                </div>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  {formatNumber(option.votes)} {option.votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
