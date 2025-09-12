'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { VoteValue, PostState, CommentState } from './post-types';

interface VotingSystemProps {
  itemId: string;
  itemType: 'post' | 'comment';
  score: number;
  userVote?: VoteValue;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onVoteSuccess?: (newScore: number) => void;
}

interface VoteState {
  optimisticVote: VoteValue | null;
  optimisticScore: number;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastVoteAttempt: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RATE_LIMIT_MS = 500; // Prevent rapid clicking

export function VotingSystem({
  itemId,
  itemType,
  score,
  userVote = null,
  className,
  size = 'md',
  disabled = false,
  onVoteSuccess,
}: VotingSystemProps) {
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVoteRef = useRef<number>(0);
  
  const [state, setState] = useState<VoteState>({
    optimisticVote: userVote,
    optimisticScore: score,
    isLoading: false,
    error: null,
    retryCount: 0,
    lastVoteAttempt: 0,
  });

  // Sync with external vote changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      optimisticVote: userVote,
      optimisticScore: score,
    }));
  }, [userVote, score]);

  // Calculate score change for optimistic updates
  const calculateScoreChange = useCallback((currentVote: VoteValue | null, newVote: VoteValue | null): number => {
    const currentValue = currentVote || 0;
    const newValue = newVote || 0;
    return newValue - currentValue;
  }, []);

  // API vote handler
  const performVote = useCallback(async (voteValue: VoteValue): Promise<number> => {
    // Convert vote value: null = 0, 1 = upvote, -1 = downvote
    const apiVoteValue = voteValue === null ? 0 : voteValue;
    
    if (itemType === 'post') {
      const response = await api.votePost(itemId, apiVoteValue);
      if (!response.success) {
        throw new Error(response.error || 'Vote failed');
      }
      return response.data?.score !== undefined ? response.data.score : score + (apiVoteValue || 0);
    } else {
      const response = await api.voteComment(itemId, apiVoteValue);
      if (!response.success) {
        throw new Error(response.error || 'Vote failed');
      }
      return response.data?.score !== undefined ? response.data.score : score + (apiVoteValue || 0);
    }
  }, [itemId, itemType, score]);

  // Retry mechanism with exponential backoff
  const retryVote = useCallback((voteValue: VoteValue, attempt: number) => {
    if (attempt >= MAX_RETRIES) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to register vote after multiple attempts. Please refresh and try again.',
      }));
      return;
    }

    const delay = RETRY_DELAY * Math.pow(2, attempt);
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        const newScore = await performVote(voteValue);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          retryCount: 0,
          optimisticScore: newScore,
        }));
        onVoteSuccess?.(newScore);
      } catch (error) {
        console.error(`Vote retry ${attempt + 1} failed:`, error);
        retryVote(voteValue, attempt + 1);
      }
    }, delay);
  }, [performVote, onVoteSuccess]);

  // Main vote handler with comprehensive error handling
  const handleVote = useCallback(async (newVote: VoteValue) => {
    if (disabled || state.isLoading) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastVoteRef.current < RATE_LIMIT_MS) {
      return;
    }
    lastVoteRef.current = now;

    const currentVote = state.optimisticVote;
    const finalVote = currentVote === newVote ? null : newVote; // Toggle vote
    const scoreChange = calculateScoreChange(currentVote, finalVote);

    // Clear any existing retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Optimistic update
    setState(prev => ({
      ...prev,
      optimisticVote: finalVote,
      optimisticScore: Math.max(0, prev.optimisticScore + scoreChange),
      isLoading: true,
      error: null,
      lastVoteAttempt: now,
    }));

    try {
      const newScore = await performVote(finalVote); // Pass null for removing vote
      setState(prev => ({
        ...prev,
        isLoading: false,
        retryCount: 0,
        optimisticScore: newScore,
      }));
      onVoteSuccess?.(newScore);
    } catch (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        optimisticVote: currentVote,
        optimisticScore: Math.max(0, prev.optimisticScore - scoreChange),
        isLoading: false,
        error: 'Vote failed. Retrying...',
        retryCount: prev.retryCount + 1,
      }));

      console.error('Vote failed:', error);

      // Start retry process
      retryVote(finalVote, 0);
    }
  }, [
    disabled,
    state.isLoading,
    state.optimisticVote,
    calculateScoreChange,
    performVote,
    onVoteSuccess,
    retryVote,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Size variants
  const sizeClasses = {
    sm: {
      button: 'h-6 w-6 p-0',
      icon: 'h-3 w-3',
      text: 'text-xs',
      gap: 'gap-0.5',
    },
    md: {
      button: 'h-8 w-8 p-1',
      icon: 'h-4 w-4',
      text: 'text-sm',
      gap: 'gap-1',
    },
    lg: {
      button: 'h-10 w-10 p-2',
      icon: 'h-5 w-5',
      text: 'text-base',
      gap: 'gap-2',
    },
  };

  const sizes = sizeClasses[size];

  // Format score display
  const formatScore = (score: number): string => {
    if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  return (
    <div className={cn(
      "flex flex-col items-center relative",
      sizes.gap,
      className
    )}>
      {/* Upvote button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={disabled || state.isLoading}
        className={cn(
          sizes.button,
          "transition-all duration-200",
          state.optimisticVote === 1 && "text-orange-500 bg-orange-50 hover:bg-orange-100",
          state.isLoading && "opacity-50 cursor-not-allowed",
          "hover:text-orange-500 hover:bg-orange-50"
        )}
        aria-label={`Upvote ${itemType}`}
      >
        <ArrowUp className={sizes.icon} />
      </Button>

      {/* Score display */}
      <div className="flex flex-col items-center">
        <span className={cn(
          "font-medium tabular-nums",
          sizes.text,
          state.optimisticVote === 1 && "text-orange-500",
          state.optimisticVote === -1 && "text-blue-500",
          state.isLoading && "animate-pulse"
        )}>
          {formatScore(state.optimisticScore)}
        </span>

        {/* Error indicator */}
        {state.error && (
          <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
        )}
      </div>

      {/* Downvote button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={disabled || state.isLoading}
        className={cn(
          sizes.button,
          "transition-all duration-200",
          state.optimisticVote === -1 && "text-blue-500 bg-blue-50 hover:bg-blue-100",
          state.isLoading && "opacity-50 cursor-not-allowed",
          "hover:text-blue-500 hover:bg-blue-50"
        )}
        aria-label={`Downvote ${itemType}`}
      >
        <ArrowDown className={sizes.icon} />
      </Button>

      {/* Error message tooltip */}
      {state.error && (
        <div className="absolute z-10 mt-1 p-2 bg-red-50 border border-red-200 rounded-md shadow-lg top-full">
          <p className="text-xs text-red-600 max-w-40 text-center">
            {state.error}
          </p>
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="text-xs text-red-500 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact horizontal voting component
export function HorizontalVotingSystem({
  itemId,
  itemType,
  score,
  userVote = null,
  className,
  disabled = false,
  onVoteSuccess,
}: Omit<VotingSystemProps, 'size'>) {
  const [state, setState] = useState<VoteState>({
    optimisticVote: userVote,
    optimisticScore: score,
    isLoading: false,
    error: null,
    retryCount: 0,
    lastVoteAttempt: 0,
  });

  // API vote handler
  const performVote = useCallback(async (voteValue: VoteValue): Promise<number> => {
    // Convert vote value: null = 0, 1 = upvote, -1 = downvote
    const apiVoteValue = voteValue === null ? 0 : voteValue;
    
    if (itemType === 'post') {
      const response = await api.votePost(itemId, apiVoteValue);
      if (!response.success) {
        throw new Error(response.error || 'Vote failed');
      }
      return response.data?.score !== undefined ? response.data.score : score + (apiVoteValue || 0);
    } else {
      const response = await api.voteComment(itemId, apiVoteValue);
      if (!response.success) {
        throw new Error(response.error || 'Vote failed');
      }
      return response.data?.score !== undefined ? response.data.score : score + (apiVoteValue || 0);
    }
  }, [itemId, itemType, score]);

  const handleVote = useCallback(async (newVote: VoteValue) => {
    if (disabled || state.isLoading) return;

    const currentVote = state.optimisticVote;
    const finalVote = currentVote === newVote ? null : newVote;
    
    // Optimistic update
    setState(prev => ({
      ...prev,
      optimisticVote: finalVote,
      isLoading: true,
    }));

    try {
      const newScore = await performVote(finalVote);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        optimisticScore: newScore,
      }));
      onVoteSuccess?.(newScore);
    } catch (error) {
      // Rollback
      setState(prev => ({
        ...prev,
        optimisticVote: currentVote,
        isLoading: false,
        error: 'Vote failed',
      }));
      
      console.error('Vote failed:', error);
    }
  }, [disabled, state.isLoading, state.optimisticVote, performVote, onVoteSuccess]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={disabled || state.isLoading}
        className={cn(
          "h-6 w-6 p-0",
          state.optimisticVote === 1 && "text-orange-500 bg-orange-50"
        )}
      >
        <ArrowUp className="h-3 w-3" />
      </Button>

      <span className={cn(
        "text-xs font-medium min-w-[20px] text-center tabular-nums",
        state.optimisticVote === 1 && "text-orange-500",
        state.optimisticVote === -1 && "text-blue-500"
      )}>
        {state.optimisticScore}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={disabled || state.isLoading}
        className={cn(
          "h-6 w-6 p-0",
          state.optimisticVote === -1 && "text-blue-500 bg-blue-50"
        )}
      >
        <ArrowDown className="h-3 w-3" />
      </Button>
    </div>
  );
}