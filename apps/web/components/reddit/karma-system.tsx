'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, Award, Eye, Shield, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

export interface KarmaData {
  total: number;
  postKarma: number;
  commentKarma: number;
  awardeeKarma: number;
  awarderKarma: number;
  breakdown: KarmaBreakdown;
  trend: KarmaTrend;
  level: KarmaLevel;
}

export interface KarmaBreakdown {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  allTime: number;
}

export interface KarmaTrend {
  direction: 'up' | 'down' | 'stable';
  change: number;
  percentage: number;
}

export interface KarmaLevel {
  current: string;
  next?: string;
  progress: number; // 0-100 percentage to next level
  privileges: string[];
}

interface KarmaDisplayProps {
  karma: KarmaData | number;
  variant?: 'compact' | 'detailed' | 'badge' | 'profile';
  showTrend?: boolean;
  showBreakdown?: boolean;
  className?: string;
  animate?: boolean;
}

interface KarmaState {
  displayValue: number;
  isAnimating: boolean;
  error: string | null;
  lastUpdate: number;
}

// Karma levels configuration
const KARMA_LEVELS = [
  { name: 'New User', min: 0, max: 9, color: 'text-gray-600', privileges: ['Basic posting'] },
  { name: 'Active', min: 10, max: 49, color: 'text-blue-600', privileges: ['Basic posting', 'Image uploads'] },
  { name: 'Contributor', min: 50, max: 199, color: 'text-green-600', privileges: ['Basic posting', 'Image uploads', 'Create communities'] },
  { name: 'Regular', min: 200, max: 999, color: 'text-purple-600', privileges: ['All basic features', 'Mod applications'] },
  { name: 'Veteran', min: 1000, max: 4999, color: 'text-orange-600', privileges: ['All features', 'Priority support'] },
  { name: 'Elite', min: 5000, max: 19999, color: 'text-red-600', privileges: ['All features', 'Beta access', 'Special flair'] },
  { name: 'Legend', min: 20000, max: Infinity, color: 'text-gold-600', privileges: ['All features', 'VIP status', 'Custom awards'] },
];

export function KarmaDisplay({
  karma,
  variant = 'compact',
  showTrend = false,
  showBreakdown = false,
  className,
  animate = true
}: KarmaDisplayProps) {
  const { reportError } = useRedditErrorReporting('karma-system');
  const [state, setState] = useState<KarmaState>({
    displayValue: typeof karma === 'number' ? karma : karma.total,
    isAnimating: false,
    error: null,
    lastUpdate: Date.now(),
  });

  // Normalize karma data
  const karmaData: KarmaData = useMemo(() => {
    if (typeof karma === 'number') {
      return {
        total: karma,
        postKarma: Math.floor(karma * 0.6), // Estimated breakdown
        commentKarma: Math.floor(karma * 0.4),
        awardeeKarma: 0,
        awarderKarma: 0,
        breakdown: {
          today: 0,
          thisWeek: Math.floor(karma * 0.1),
          thisMonth: Math.floor(karma * 0.3),
          thisYear: Math.floor(karma * 0.7),
          allTime: karma,
        },
        trend: {
          direction: 'stable',
          change: 0,
          percentage: 0,
        },
        level: calculateKarmaLevel(karma),
      };
    }
    return karma;
  }, [karma]);

  // Animate karma changes
  useEffect(() => {
    if (!animate) return;

    const newValue = karmaData.total;
    if (newValue !== state.displayValue) {
      setState(prev => ({ ...prev, isAnimating: true }));
      
      const startValue = state.displayValue;
      const difference = newValue - startValue;
      const duration = 1000;
      const startTime = Date.now();

      const animateValue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + difference * easeOut);
        
        setState(prev => ({ 
          ...prev, 
          displayValue: currentValue,
          isAnimating: progress < 1,
        }));

        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };

      requestAnimationFrame(animateValue);
    }
  }, [karmaData.total, state.displayValue, animate]);

  // Format karma number
  const formatKarma = useCallback((value: number): string => {
    try {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return value.toLocaleString();
    } catch (error) {
      reportError(error as Error, { value, action: 'format-karma' });
      return value.toString();
    }
  }, [reportError]);

  // Error handling
  if (state.error) {
    return (
      <div className={cn("text-red-500 text-sm", className)}>
        <AlertTriangle className="h-4 w-4 inline mr-1" />
        Error loading karma
      </div>
    );
  }

  // Badge variant - minimal display
  if (variant === 'badge') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
        karmaData.level.color,
        "bg-gray-100 hover:bg-gray-200 transition-colors",
        className
      )}>
        <TrendingUp className="h-3 w-3" />
        {formatKarma(state.displayValue)}
      </span>
    );
  }

  // Compact variant - just the number with optional trend
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className={cn(
          "font-medium tabular-nums",
          karmaData.level.color,
          state.isAnimating && "animate-pulse"
        )}>
          {formatKarma(state.displayValue)}
        </span>
        
        {showTrend && karmaData.trend.direction !== 'stable' && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs",
            karmaData.trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
          )}>
            {karmaData.trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {karmaData.trend.percentage.toFixed(1)}%
          </div>
        )}
      </div>
    );
  }

  // Detailed variant - full breakdown
  if (variant === 'detailed') {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Main karma display */}
        <div className="flex items-center justify-between">
          <div>
            <div className={cn(
              "text-2xl font-bold tabular-nums",
              karmaData.level.color,
              state.isAnimating && "animate-pulse"
            )}>
              {formatKarma(state.displayValue)}
            </div>
            <div className="text-sm text-gray-600">Total Karma</div>
          </div>

          {/* Level badge */}
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border",
            karmaData.level.color,
            "bg-white"
          )}>
            {karmaData.level.current}
          </div>
        </div>

        {/* Progress to next level */}
        {karmaData.level.next && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{karmaData.level.current}</span>
              <span>{karmaData.level.next}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${karmaData.level.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Karma breakdown */}
        {showBreakdown && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Post Karma</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatKarma(karmaData.postKarma)}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Comment Karma</div>
              <div className="text-lg font-semibold text-green-600">
                {formatKarma(karmaData.commentKarma)}
              </div>
            </div>
            {karmaData.awardeeKarma > 0 && (
              <div>
                <div className="font-medium text-gray-700">Award Karma</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {formatKarma(karmaData.awardeeKarma)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trend */}
        {showTrend && (
          <div className="flex items-center gap-2 text-sm">
            {karmaData.trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : karmaData.trend.direction === 'down' ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
            <span className={cn(
              karmaData.trend.direction === 'up' && 'text-green-600',
              karmaData.trend.direction === 'down' && 'text-red-600',
              karmaData.trend.direction === 'stable' && 'text-gray-600'
            )}>
              {karmaData.trend.direction === 'up' && '+'}
              {karmaData.trend.change} karma this week
            </span>
          </div>
        )}
      </div>
    );
  }

  // Profile variant - comprehensive display
  if (variant === 'profile') {
    return (
      <div className={cn("bg-white rounded-lg border p-4 space-y-4", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Karma</h3>
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            karmaData.level.color,
            "bg-gray-100"
          )}>
            {karmaData.level.current}
          </div>
        </div>

        {/* Total karma */}
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold tabular-nums",
            karmaData.level.color,
            state.isAnimating && "animate-pulse"
          )}>
            {formatKarma(state.displayValue)}
          </div>
          <div className="text-gray-600">Total Karma</div>
        </div>

        {/* Breakdown grid */}
        <div className="grid grid-cols-2 gap-4">
          <KarmaBreakdownItem
            label="Posts"
            value={karmaData.postKarma}
            color="text-blue-600"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KarmaBreakdownItem
            label="Comments"
            value={karmaData.commentKarma}
            color="text-green-600"
            icon={<MessageSquare className="h-4 w-4" />}
          />
          {karmaData.awardeeKarma > 0 && (
            <KarmaBreakdownItem
              label="Awards Received"
              value={karmaData.awardeeKarma}
              color="text-yellow-600"
              icon={<Award className="h-4 w-4" />}
            />
          )}
          {karmaData.awarderKarma > 0 && (
            <KarmaBreakdownItem
              label="Awards Given"
              value={karmaData.awarderKarma}
              color="text-purple-600"
              icon={<Shield className="h-4 w-4" />}
            />
          )}
        </div>

        {/* Privileges */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Current Privileges</h4>
          <div className="flex flex-wrap gap-1">
            {karmaData.level.privileges.map((privilege, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {privilege}
              </span>
            ))}
          </div>
        </div>

        {/* Time breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Karma Over Time</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">This Week</span>
              <span className="font-medium">{formatKarma(karmaData.breakdown.thisWeek)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month</span>
              <span className="font-medium">{formatKarma(karmaData.breakdown.thisMonth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Year</span>
              <span className="font-medium">{formatKarma(karmaData.breakdown.thisYear)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Helper component for breakdown items
function KarmaBreakdownItem({ 
  label, 
  value, 
  color, 
  icon 
}: { 
  label: string; 
  value: number; 
  color: string; 
  icon: React.ReactNode; 
}) {
  return (
    <div className="text-center space-y-1">
      <div className={cn("flex items-center justify-center", color)}>
        {icon}
      </div>
      <div className={cn("text-lg font-semibold tabular-nums", color)}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

// Calculate karma level with safety checks
function calculateKarmaLevel(karma: number): KarmaLevel {
  try {
    const safeKarma = Math.max(0, Math.floor(karma || 0));
    
    const currentLevel = KARMA_LEVELS.find(level => 
      safeKarma >= level.min && safeKarma <= level.max
    ) || KARMA_LEVELS[0];

    const nextLevelIndex = KARMA_LEVELS.findIndex(level => level.min > safeKarma);
    const nextLevel = nextLevelIndex >= 0 ? KARMA_LEVELS[nextLevelIndex] : null;

    let progress = 0;
    if (nextLevel) {
      const rangeSize = nextLevel.min - currentLevel.min;
      const currentProgress = safeKarma - currentLevel.min;
      progress = Math.min(100, Math.max(0, (currentProgress / rangeSize) * 100));
    }

    return {
      current: currentLevel.name,
      next: nextLevel?.name,
      progress,
      privileges: currentLevel.privileges,
    };
  } catch (error) {
    console.error('Error calculating karma level:', error);
    return {
      current: 'New User',
      progress: 0,
      privileges: ['Basic posting'],
    };
  }
}

// Hook for managing karma state
export function useKarma(userId?: string) {
  const { reportError } = useRedditErrorReporting('karma-hook');
  const [karma, setKarma] = useState<KarmaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKarma = useCallback(async (id?: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}/karma`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setKarma(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load karma';
      setError(errorMessage);
      reportError(error as Error, { userId: id, action: 'fetch-karma' });
    } finally {
      setLoading(false);
    }
  }, [reportError]);

  useEffect(() => {
    if (userId) {
      fetchKarma(userId);
    }
  }, [userId, fetchKarma]);

  return {
    karma,
    loading,
    error,
    refetch: () => fetchKarma(userId),
  };
}