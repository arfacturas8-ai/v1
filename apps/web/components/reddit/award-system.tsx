'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Award,
  Star,
  Crown,
  Heart,
  Zap,
  Shield,
  Trophy,
  Gift,
  Coins,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RedditErrorBoundary, useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

export interface AwardType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
  premium: boolean;
  animated: boolean;
  color: string;
  backgroundColor: string;
  category: 'basic' | 'premium' | 'community' | 'special';
  effects: AwardEffect[];
  available: boolean;
}

export interface AwardEffect {
  type: 'karma' | 'coins' | 'premium' | 'visibility';
  value: number;
  description: string;
}

export interface AwardInstance {
  id: string;
  awardTypeId: string;
  awardType: AwardType;
  count: number;
  totalValue: number;
  givenAt: string;
  givenBy?: {
    id: string;
    username: string;
    anonymous: boolean;
  };
}

interface AwardSystemProps {
  targetId: string;
  targetType: 'post' | 'comment';
  awards?: AwardInstance[];
  onGiveAward?: (awardTypeId: string, message?: string, anonymous?: boolean) => Promise<void>;
  userCoins?: number;
  className?: string;
}

interface AwardState {
  showSelector: boolean;
  selectedAward: AwardType | null;
  isGiving: boolean;
  error: string | null;
  success: string | null;
  message: string;
  anonymous: boolean;
  transactionId: string | null;
}

// Award types configuration with safety checks
const AWARD_TYPES: AwardType[] = [
  {
    id: 'silver',
    name: 'Silver',
    description: 'Shows appreciation',
    icon: <Award className="h-4 w-4" />,
    cost: 100,
    premium: false,
    animated: false,
    color: 'text-gray-600',
    backgroundColor: 'bg-gray-100',
    category: 'basic',
    effects: [{ type: 'karma', value: 1, description: '+1 karma to recipient' }],
    available: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'High quality content',
    icon: <Star className="h-4 w-4" />,
    cost: 500,
    premium: false,
    animated: true,
    color: 'text-yellow-600',
    backgroundColor: 'bg-yellow-100',
    category: 'basic',
    effects: [
      { type: 'karma', value: 5, description: '+5 karma to recipient' },
      { type: 'coins', value: 100, description: '100 coins to recipient' },
    ],
    available: true,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    description: 'Exceptional content',
    icon: <Crown className="h-4 w-4" />,
    cost: 1800,
    premium: true,
    animated: true,
    color: 'text-blue-600',
    backgroundColor: 'bg-blue-100',
    category: 'premium',
    effects: [
      { type: 'karma', value: 10, description: '+10 karma to recipient' },
      { type: 'coins', value: 700, description: '700 coins to recipient' },
      { type: 'premium', value: 30, description: '1 month premium' },
    ],
    available: true,
  },
  {
    id: 'helpful',
    name: 'Helpful',
    description: 'Very helpful answer',
    icon: <Heart className="h-4 w-4" />,
    cost: 250,
    premium: false,
    animated: false,
    color: 'text-red-500',
    backgroundColor: 'bg-red-100',
    category: 'basic',
    effects: [{ type: 'karma', value: 3, description: '+3 karma to recipient' }],
    available: true,
  },
  {
    id: 'wholesome',
    name: 'Wholesome',
    description: 'Heartwarming content',
    icon: <Shield className="h-4 w-4" />,
    cost: 125,
    premium: false,
    animated: false,
    color: 'text-green-500',
    backgroundColor: 'bg-green-100',
    category: 'basic',
    effects: [{ type: 'karma', value: 2, description: '+2 karma to recipient' }],
    available: true,
  },
  {
    id: 'legendary',
    name: 'Legendary',
    description: 'Once-in-a-lifetime content',
    icon: <Trophy className="h-4 w-4" />,
    cost: 5000,
    premium: true,
    animated: true,
    color: 'text-purple-600',
    backgroundColor: 'bg-purple-100',
    category: 'special',
    effects: [
      { type: 'karma', value: 50, description: '+50 karma to recipient' },
      { type: 'coins', value: 2500, description: '2500 coins to recipient' },
      { type: 'premium', value: 365, description: '1 year premium' },
      { type: 'visibility', value: 100, description: 'Boosted visibility' },
    ],
    available: true,
  },
];

export function AwardSystem({
  targetId,
  targetType,
  awards = [],
  onGiveAward,
  userCoins = 0,
  className
}: AwardSystemProps) {
  const { reportError } = useRedditErrorReporting('award-system');
  const [state, setState] = useState<AwardState>({
    showSelector: false,
    selectedAward: null,
    isGiving: false,
    error: null,
    success: null,
    message: '',
    anonymous: false,
    transactionId: null,
  });

  // Group awards by type
  const awardGroups = awards.reduce((acc, award) => {
    const key = award.awardTypeId;
    if (!acc[key]) {
      acc[key] = { awardType: award.awardType, count: 0, totalValue: 0 };
    }
    acc[key].count += award.count;
    acc[key].totalValue += award.totalValue;
    return acc;
  }, {} as Record<string, { awardType: AwardType; count: number; totalValue: number }>);

  // Handle award giving with comprehensive error handling
  const handleGiveAward = useCallback(async () => {
    if (!state.selectedAward || !onGiveAward) return;

    // Validation
    if (userCoins < state.selectedAward.cost) {
      setState(prev => ({ 
        ...prev, 
        error: `Insufficient coins. Need ${state.selectedAward!.cost} coins.` 
      }));
      return;
    }

    const transactionId = `award_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setState(prev => ({ 
      ...prev, 
      isGiving: true, 
      error: null, 
      success: null,
      transactionId 
    }));

    try {
      // Call the award giving function
      await onGiveAward(
        state.selectedAward.id,
        state.message.trim() || undefined,
        state.anonymous
      );

      // Success state
      setState(prev => ({
        ...prev,
        isGiving: false,
        success: `${state.selectedAward!.name} awarded successfully!`,
        showSelector: false,
        selectedAward: null,
        message: '',
        transactionId: null,
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to give award';
      
      setState(prev => ({
        ...prev,
        isGiving: false,
        error: errorMessage,
        transactionId: null,
      }));

      reportError(error as Error, {
        targetId,
        targetType,
        awardId: state.selectedAward.id,
        transactionId,
        userCoins,
        cost: state.selectedAward.cost,
      });
    }
  }, [
    state.selectedAward,
    state.message,
    state.anonymous,
    onGiveAward,
    userCoins,
    targetId,
    targetType,
    reportError,
  ]);

  // Clear error after timeout
  useEffect(() => {
    if (state.error) {
      const timeout = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [state.error]);

  return (
    <RedditErrorBoundary context="award-system" fallback={<AwardErrorFallback />}>
      <div className={cn("space-y-2", className)}>
        {/* Error/Success notifications */}
        {state.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {state.error}
            </div>
          </div>
        )}

        {state.success && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {state.success}
            </div>
          </div>
        )}

        {/* Awards display */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.values(awardGroups).map(({ awardType, count, totalValue }) => (
            <AwardDisplay
              key={awardType.id}
              awardType={awardType}
              count={count}
              totalValue={totalValue}
            />
          ))}

          {/* Give award button */}
          {onGiveAward && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setState(prev => ({ ...prev, showSelector: true }))}
              className="h-7 px-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              disabled={state.isGiving}
            >
              <Gift className="h-4 w-4 mr-1" />
              Give Award
            </Button>
          )}
        </div>

        {/* Award selector modal */}
        {state.showSelector && (
          <AwardSelector
            awards={AWARD_TYPES}
            userCoins={userCoins}
            onSelect={(award) => setState(prev => ({ ...prev, selectedAward: award }))}
            onClose={() => setState(prev => ({ 
              ...prev, 
              showSelector: false, 
              selectedAward: null, 
              message: '', 
              anonymous: false 
            }))}
            selectedAward={state.selectedAward}
            message={state.message}
            anonymous={state.anonymous}
            onMessageChange={(message) => setState(prev => ({ ...prev, message }))}
            onAnonymousChange={(anonymous) => setState(prev => ({ ...prev, anonymous }))}
            onGive={handleGiveAward}
            isGiving={state.isGiving}
          />
        )}
      </div>
    </RedditErrorBoundary>
  );
}

// Individual award display component
function AwardDisplay({ 
  awardType, 
  count, 
  totalValue 
}: { 
  awardType: AwardType; 
  count: number; 
  totalValue: number; 
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
        awardType.backgroundColor,
        awardType.color,
        awardType.animated && "animate-pulse"
      )}
      title={`${awardType.name}: ${awardType.description} (${count} awarded, ${totalValue} coins total)`}
    >
      {awardType.icon}
      <span className="font-medium">{count}</span>
    </div>
  );
}

// Award selector modal
function AwardSelector({
  awards,
  userCoins,
  onSelect,
  onClose,
  selectedAward,
  message,
  anonymous,
  onMessageChange,
  onAnonymousChange,
  onGive,
  isGiving
}: {
  awards: AwardType[];
  userCoins: number;
  onSelect: (award: AwardType) => void;
  onClose: () => void;
  selectedAward: AwardType | null;
  message: string;
  anonymous: boolean;
  onMessageChange: (message: string) => void;
  onAnonymousChange: (anonymous: boolean) => void;
  onGive: () => Promise<void>;
  isGiving: boolean;
}) {
  const availableAwards = awards.filter(award => award.available);
  const canAfford = (award: AwardType) => userCoins >= award.cost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Give Award</h3>
            <p className="text-sm text-gray-600">
              You have <Coins className="h-4 w-4 inline mx-1" />{userCoins} coins
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Award selection */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableAwards.map((award) => {
              const affordable = canAfford(award);
              const selected = selectedAward?.id === award.id;

              return (
                <button
                  key={award.id}
                  onClick={() => affordable && onSelect(award)}
                  disabled={!affordable || isGiving}
                  className={cn(
                    "p-3 border rounded-lg text-left transition-all",
                    selected && "border-blue-500 bg-blue-50",
                    !selected && affordable && "hover:border-gray-300 hover:bg-gray-50",
                    !affordable && "opacity-50 cursor-not-allowed bg-gray-100"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      award.backgroundColor
                    )}>
                      <div className={award.color}>
                        {award.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{award.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Coins className="h-3 w-3" />
                          {award.cost}
                        </div>
                        {award.premium && (
                          <Badge variant="secondary" className="text-xs">Premium</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{award.description}</p>
                      
                      <div className="space-y-1">
                        {award.effects.map((effect, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            • {effect.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Award giving form */}
        {selectedAward && (
          <div className="p-4 border-t bg-gray-50">
            <div className="space-y-3">
              {/* Optional message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Optional message (visible to recipient)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => onMessageChange(e.target.value)}
                  placeholder="Say something nice..."
                  className="w-full p-2 border rounded text-sm resize-none"
                  rows={2}
                  maxLength={500}
                  disabled={isGiving}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/500 characters
                </div>
              </div>

              {/* Anonymous option */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => onAnonymousChange(e.target.checked)}
                  disabled={isGiving}
                  className="rounded"
                />
                <span className="text-sm">Give anonymously</span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Cost: <span className="font-medium">{selectedAward.cost} coins</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={isGiving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onGive}
                    disabled={isGiving || userCoins < selectedAward.cost}
                    className="min-w-[80px]"
                  >
                    {isGiving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Give ${selectedAward.name}`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Error fallback component
function AwardErrorFallback() {
  return (
    <div className="p-2 border border-red-200 rounded bg-red-50">
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>Awards could not be loaded</span>
      </div>
    </div>
  );
}

// Hook for award management
export function useAwards(targetId: string, targetType: 'post' | 'comment') {
  const { reportError } = useRedditErrorReporting('awards-hook');
  const [awards, setAwards] = useState<AwardInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch awards
  const fetchAwards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${targetType}s/${targetId}/awards`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAwards(data.awards || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load awards';
      setError(errorMessage);
      reportError(error as Error, { targetId, targetType, action: 'fetch-awards' });
    } finally {
      setLoading(false);
    }
  }, [targetId, targetType, reportError]);

  // Give award
  const giveAward = useCallback(async (
    awardTypeId: string, 
    message?: string, 
    anonymous?: boolean
  ) => {
    const transactionId = `award_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await fetch(`/api/${targetType}s/${targetId}/awards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awardTypeId,
          message,
          anonymous,
          transactionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh awards list
      await fetchAwards();
      
      return result;
    } catch (error) {
      reportError(error as Error, { 
        targetId, 
        targetType, 
        awardTypeId, 
        transactionId,
        action: 'give-award' 
      });
      throw error;
    }
  }, [targetId, targetType, fetchAwards, reportError]);

  // Load awards on mount
  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  return {
    awards,
    loading,
    error,
    giveAward,
    refetch: fetchAwards,
  };
}