import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../../design-system/atoms/Button';
import { colors, spacing, typography, radii } from '../../design-system/tokens';

interface SelectInterestsStepProps {
  onNext: () => void;
}

const interestCategories = [
  { id: 'art', name: 'Art', emoji: '🎨' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'photography', name: 'Photography', emoji: '📸' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'fashion', name: 'Fashion', emoji: '👗' },
  { id: 'tech', name: 'Technology', emoji: '💻' },
  { id: 'food', name: 'Food', emoji: '🍔' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'crypto', name: 'Crypto', emoji: '₿' },
  { id: 'nfts', name: 'NFTs', emoji: '🖼️' },
  { id: 'defi', name: 'DeFi', emoji: '💰' },
  { id: 'web3', name: 'Web3', emoji: '🌐' },
  { id: 'metaverse', name: 'Metaverse', emoji: '🥽' },
  { id: 'dao', name: 'DAOs', emoji: '🏛️' },
];

export const SelectInterestsStep: React.FC<SelectInterestsStepProps> = ({ onNext }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isValid = selectedInterests.length >= 3;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: spacing[8] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            marginBottom: spacing[6],
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={40} color={colors.brand.primary} />
        </div>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing[3],
          }}
        >
          What are you interested in?
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          Select at least 3 topics to personalize your feed
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: spacing[3],
          marginBottom: spacing[8],
        }}
      >
        {interestCategories.map((category) => {
          const isSelected = selectedInterests.includes(category.id);
          return (
            <button
              key={category.id}
              onClick={() => toggleInterest(category.id)}
              style={{
                padding: spacing[4],
                borderRadius: radii.lg,
                border: `2px solid ${isSelected ? colors.brand.primary : colors.border.default}`,
                backgroundColor: isSelected ? `${colors.brand.primary}20` : colors.bg.secondary,
                color: colors.text.primary,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: spacing[2],
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  e.currentTarget.style.borderColor = colors.border.default;
                }
              }}
            >
              <div style={{ fontSize: '48px' }}>{category.emoji}</div>
              <div
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  fontSize: typography.fontSize.base,
                  color: isSelected ? colors.brand.primary : colors.text.primary,
                }}
              >
                {category.name}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
          {selectedInterests.length} selected {selectedInterests.length < 3 && `(${3 - selectedInterests.length} more needed)`}
        </p>
        <Button onClick={onNext} disabled={!isValid} size="lg" style={{ minWidth: '200px' }}>
          Continue
        </Button>
      </div>
    </div>
  );
};
