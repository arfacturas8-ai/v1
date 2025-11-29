/**
 * CRYB Design System - Vote Buttons Component
 * Community voting with animations and haptic feedback
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui/button';

export interface VoteButtonsProps {
  /** Current vote score */
  score: number;
  /** User's current vote: 'up', 'down', or null */
  userVote?: 'up' | 'down' | null;
  /** Callback when vote changes */
  onVote?: (voteType: 'up' | 'down' | null) => void;
  /** Orientation: vertical or horizontal */
  orientation?: 'vertical' | 'horizontal';
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show trending indicator for highly upvoted content */
  showTrending?: boolean;
  /** Threshold for trending indicator */
  trendingThreshold?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Compact mode (no score display) */
  compact?: boolean;
}

export const VoteButtons = React.forwardRef<HTMLDivElement, VoteButtonsProps>(
  (
    {
      score = 0,
      userVote = null,
      onVote,
      orientation = 'vertical',
      size = 'default',
      showTrending = true,
      trendingThreshold = 100,
      disabled = false,
      compact = false,
    },
    ref
  ) => {
    const [localVote, setLocalVote] = useState<'up' | 'down' | null>(userVote);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleVote = (voteType: 'up' | 'down') => {
      if (disabled || isAnimating) return;

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      const newVote = localVote === voteType ? null : voteType;
      setLocalVote(newVote);
      onVote?.(newVote);
    };

    const getDisplayScore = () => {
      let displayScore = score;

      // Adjust score based on local vote
      if (localVote === 'up' && userVote !== 'up') displayScore += userVote === 'down' ? 2 : 1;
      if (localVote === 'down' && userVote !== 'down') displayScore -= userVote === 'up' ? 2 : 1;
      if (localVote === null && userVote === 'up') displayScore -= 1;
      if (localVote === null && userVote === 'down') displayScore += 1;

      return displayScore;
    };

    const formatScore = (num: number): string => {
      const absNum = Math.abs(num);
      if (absNum >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (absNum >= 10000) return `${(num / 1000).toFixed(1)}K`;
      if (absNum >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    const displayScore = getDisplayScore();
    const isTrending = showTrending && displayScore >= trendingThreshold;

    const iconSize = {
      sm: 'w-4 h-4',
      default: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    const buttonSize = {
      sm: 'icon-sm' as const,
      default: 'icon' as const,
      lg: 'icon-lg' as const,
    }[size];

    const containerClasses = cn(
      'flex items-center gap-1',
      orientation === 'vertical' ? 'flex-col' : 'flex-row',
      disabled && 'opacity-50 pointer-events-none'
    );

    const scoreClasses = cn(
      'font-semibold tabular-nums transition-colors duration-200',
      size === 'sm' && 'text-xs',
      size === 'default' && 'text-sm',
      size === 'lg' && 'text-base',
      localVote === 'up' && 'text-orange-500',
      localVote === 'down' && 'text-blue-500',
      !localVote && displayScore > 0 && 'text-foreground',
      !localVote && displayScore === 0 && 'text-muted-foreground',
      !localVote && displayScore < 0 && 'text-muted-foreground'
    );

    return (
      <div ref={ref} className={containerClasses}>
        {/* Upvote Button */}
        <div>
          <IconButton
            icon={<ChevronUp className={iconSize} />}
            variant={localVote === 'up' ? 'ghost' : 'ghost'}
            size={buttonSize}
            onClick={() => handleVote('up')}
            disabled={disabled}
            aria-label="Upvote"
            className={cn(
              'transition-colors',
              localVote === 'up'
                ? 'text-orange-500 hover:text-orange-600 bg-orange-500/10 hover:bg-orange-500/20'
                : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'
            )}
          />
        </div>

        {/* Score Display */}
        {!compact && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  justifyContent: 'center'
}}>

              <span
                key={displayScore}
                className={scoreClasses}
              >
                {formatScore(displayScore)}
              </span>
            

            {/* Trending Indicator */}
            {isTrending && (
              <div
              >
                <TrendingUp style={{
  width: '12px',
  height: '12px'
}} />
              </div>
            )}
          </div>
        )}

        {/* Downvote Button */}
        <div>
          <IconButton
            icon={<ChevronDown className={iconSize} />}
            variant={localVote === 'down' ? 'ghost' : 'ghost'}
            size={buttonSize}
            onClick={() => handleVote('down')}
            disabled={disabled}
            aria-label="Downvote"
            className={cn(
              'transition-colors',
              localVote === 'down'
                ? 'text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20'
                : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'
            )}
          />
        </div>
      </div>
    );
  }
);

VoteButtons.displayName = 'VoteButtons';
