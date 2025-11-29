/**
 * CRYB Design System - Award System Component
 * Community-driven awards for posts and comments
 */

import React, { useState } from 'react';
import { Star, Heart, Zap, Crown, Trophy, Sparkles, Gift, X } from 'lucide-react'
import { cn } from '../../lib/utils';
import { Button, IconButton } from '../ui/button';
import { Card } from '../ui/card';
import * as Dialog from '@radix-ui/react-dialog';

export interface AwardType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  price: number;
  description: string;
}

export const AWARDS: AwardType[] = [
  {
    id: 'helpful',
    name: 'Helpful',
    icon: <Star style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-yellow-500',
    price: 50,
    description: 'This was really helpful!',
  },
  {
    id: 'love',
    name: 'Love',
    icon: <Heart style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-red-500',
    price: 100,
    description: 'I love this post!',
  },
  {
    id: 'genius',
    name: 'Genius',
    icon: <Zap style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-purple-500',
    price: 150,
    description: 'Pure genius!',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: <Crown style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-amber-500',
    price: 300,
    description: 'Premium quality content',
  },
  {
    id: 'legendary',
    name: 'Legendary',
    icon: <Trophy style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-orange-500',
    price: 500,
    description: 'Legendary post!',
  },
  {
    id: 'masterpiece',
    name: 'Masterpiece',
    icon: <Sparkles style={{
  width: '20px',
  height: '20px'
}} />,
    color: 'text-cyan-500',
    price: 1000,
    description: 'An absolute masterpiece',
  },
];

export interface PostAward {
  awardId: string;
  count: number;
}

export interface AwardDisplayProps {
  /** Awards received by the post */
  awards: PostAward[];
  /** Show award button */
  showAwardButton?: boolean;
  /** Callback when award is given */
  onAward?: (awardId: string) => void;
  /** Max awards to display before showing "+X" */
  maxDisplay?: number;
  /** Size variant */
  size?: 'sm' | 'default';
  /** User's available coins */
  userCoins?: number;
}

export const AwardDisplay: React.FC<AwardDisplayProps> = ({
  awards = [],
  showAwardButton = true,
  onAward,
  maxDisplay = 5,
  size = 'default',
  userCoins = 0,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState<string | null>(null);

  const totalAwards = awards.reduce((sum, award) => sum + award.count, 0);
  const displayAwards = awards.slice(0, maxDisplay);
  const remainingCount = totalAwards - displayAwards.reduce((sum, a) => sum + a.count, 0);

  const handleGiveAward = (awardId: string) => {
    const award = AWARDS.find(a => a.id === awardId);
    if (award && userCoins >= award.price) {
      setSelectedAward(awardId);
      setTimeout(() => {
        onAward?.(awardId);
        setSelectedAward(null);
        setIsDialogOpen(false);
      }, 500);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
      {/* Display Awards */}
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
        {displayAwards.map((award) => {
          const awardType = AWARDS.find((a) => a.id === award.awardId);
          if (!awardType) return null;

          return (
            <div
              key={award.awardId}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full',
                'bg-background/50 border border-border',
                'transition-colors hover:bg-accent/50'
              )}
              title={`${awardType.name} (${award.count})`}
            >
              <span className={cn(awardType.color, iconSize)}>
                {React.cloneElement(awardType.icon as React.ReactElement, {
                  className: iconSize,
                })}
              </span>
              {award.count > 1 && (
                <span style={{
  fontWeight: '600'
}}>
                  {award.count}
                </span>
              )}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <span style={{
  fontWeight: '500'
}}>
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Give Award Button */}
      {showAwardButton && (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <IconButton
              icon={<Gift className={iconSize} />}
              variant="ghost"
              size={size === 'sm' ? 'icon-sm' : 'icon'}
              aria-label="Give award"
              className="text-muted-foreground hover:text-amber-500"
            />
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay style={{
  position: 'fixed'
}} />
            <Dialog.Content style={{
  position: 'fixed',
  width: '100%'
}}>
              <Card variant="glass" style={{
  overflow: 'hidden'
}}>
                {/* Header */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px'
}}>
                  <div>
                    <Dialog.Title style={{
  fontWeight: 'bold'
}}>Give Award</Dialog.Title>
                    <Dialog.Description className="text-sm text-muted-foreground mt-1">
                      Show your appreciation with an award
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <IconButton
                      icon={<X style={{
  width: '16px',
  height: '16px'
}} />}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close"
                    />
                  </Dialog.Close>
                </div>

                {/* Coins Balance */}
                <div style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                    <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      <Sparkles style={{
  width: '16px',
  height: '16px'
}} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Your Balance</div>
                      <div style={{
  fontWeight: 'bold'
}}>{userCoins} coins</div>
                    </div>
                  </div>
                </div>

                {/* Awards Grid */}
                <div style={{
  padding: '24px'
}}>
                  <div style={{
  display: 'grid',
  gap: '12px'
}}>
                    {AWARDS.map((award) => {
                      const canAfford = userCoins >= award.price;
                      const isSelected = selectedAward === award.id;

                      return (
                        <button
                          key={award.id}
                          onClick={() => handleGiveAward(award.id)}
                          disabled={!canAfford}
                          className={cn(
                            'relative p-4 rounded-lg border transition-all',
                            'text-left hover:shadow-md',
                            canAfford
                              ? 'border-border hover:border-primary/50 cursor-pointer'
                              : 'border-border/50 opacity-50 cursor-not-allowed',
                            isSelected && 'border-primary ring-2 ring-primary/20'
                          )}
                        >
                          {/* Award Icon */}
                          <div
                            className={cn(
                              'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                              'bg-gradient-to-br from-background to-accent/20'
                            )}
                          >
                            <span className={award.color}>
                              {React.cloneElement(award.icon as React.ReactElement, {
                                className: 'w-6 h-6',
                              })}
                            </span>
                          </div>

                          {/* Award Info */}
                          <div>
                            <div style={{
  fontWeight: '600'
}}>{award.name}</div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {award.description}
                            </div>
                            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontWeight: 'bold'
}}>
                              <Sparkles style={{
  width: '12px',
  height: '12px'
}} />
                              {award.price}
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <div
                              style={{
  position: 'absolute'
}}
                            >
                              <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                                <svg
                                  style={{
  width: '16px',
  height: '16px'
}}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
                  <div style={{
  textAlign: 'center'
}}>
                    Awards help creators and show your appreciation
                  </div>
                </div>
              </Card>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};

AwardDisplay.displayName = 'AwardDisplay';
