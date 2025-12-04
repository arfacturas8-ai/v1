import React from 'react';
import { Edit3, Users, Image as ImageIcon, FolderOpen, ArrowRight, Lock } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { Text } from '../design-system/atoms/Text';
import { colors, spacing, radii, typography, shadows } from '../design-system/tokens';

interface CreateHubPageProps {
  onNavigate?: (route: string, params?: any) => void;
}

interface CreateOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  comingSoon?: boolean;
  route: string;
  gradient: string;
}

export const CreateHubPage: React.FC<CreateHubPageProps> = ({ onNavigate }) => {
  const createOptions: CreateOption[] = [
    {
      id: 'post',
      icon: <Edit3 size={32} />,
      title: 'New Post',
      description: 'Share your thoughts, images, and updates with your followers',
      route: '/compose',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    },
    {
      id: 'community',
      icon: <Users size={32} />,
      title: 'Start Community',
      description: 'Create a space for your audience to connect and engage',
      route: '/create/community',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    },
    {
      id: 'nft',
      icon: <ImageIcon size={32} />,
      title: 'Create NFT',
      description: 'Mint your digital artwork or collectible on the blockchain',
      badge: 'Coming Soon',
      comingSoon: true,
      route: '/create/nft',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
    },
    {
      id: 'collection',
      icon: <FolderOpen size={32} />,
      title: 'Create Collection',
      description: 'Organize multiple NFTs into a curated collection',
      badge: 'Coming Soon',
      comingSoon: true,
      route: '/create/collection',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)',
    },
  ];

  const handleOptionClick = (option: CreateOption) => {
    if (option.comingSoon) {
      // Show coming soon toast
      alert('This feature is coming soon!');
      return;
    }
    onNavigate?.(option.route);
  };

  return (
    <AppLayout
      activeTab="create"
      onTabChange={(tab) => onNavigate?.(`/${tab}`)}
      onSearch={() => onNavigate?.('/search')}
      onNotifications={() => onNavigate?.('/notifications')}
      onWallet={() => onNavigate?.('/wallet')}
    >
      <div style={{ padding: spacing[6] }}>
        {/* Header */}
        <div style={{ marginBottom: spacing[8], textAlign: 'center' }}>
          <Text
            size="3xl"
            weight="bold"
            style={{
              marginBottom: spacing[3],
              background: colors.brand.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            What do you want to create?
          </Text>
          <Text variant="secondary" size="lg">
            Choose from multiple creation options to bring your ideas to life
          </Text>
        </div>

        {/* Create Options Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: spacing[4],
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {createOptions.map((option) => (
            <CreateOptionCard
              key={option.id}
              option={option}
              onClick={() => handleOptionClick(option)}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div
          style={{
            marginTop: spacing[12],
            padding: spacing[6],
            borderRadius: radii.xl,
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            maxWidth: '800px',
            margin: `${spacing[12]} auto 0`,
          }}
        >
          <Text size="lg" weight="semibold" style={{ marginBottom: spacing[4] }}>
            Quick Tips
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
            <TipItem
              icon="📝"
              text="Posts with images get 3x more engagement"
            />
            <TipItem
              icon="👥"
              text="Communities help you build a loyal audience"
            />
            <TipItem
              icon="💎"
              text="NFTs give your content permanent value"
            />
            <TipItem
              icon="📁"
              text="Collections make your work easier to discover"
            />
          </div>
        </div>

        {/* Recent Creations */}
        <div
          style={{
            marginTop: spacing[8],
            maxWidth: '800px',
            margin: `${spacing[8]} auto 0`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[4],
            }}
          >
            <Text size="xl" weight="bold">
              Your Recent Creations
            </Text>
            <button
              onClick={() => onNavigate?.('/profile?tab=posts')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.brand.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                padding: spacing[2],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
              }}
            >
              View All
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Empty State for Recent Creations */}
          <div
            style={{
              padding: spacing[12],
              textAlign: 'center',
              backgroundColor: colors.bg.secondary,
              borderRadius: radii.xl,
              border: `1px solid ${colors.border.subtle}`,
            }}
          >
            <div
              style={{
                fontSize: '48px',
                marginBottom: spacing[4],
                opacity: 0.5,
              }}
            >
              ✨
            </div>
            <Text size="lg" weight="semibold" style={{ marginBottom: spacing[2] }}>
              No creations yet
            </Text>
            <Text variant="secondary">
              Start creating to see your work here
            </Text>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

// Create Option Card Component
interface CreateOptionCardProps {
  option: CreateOption;
  onClick: () => void;
}

const CreateOptionCard: React.FC<CreateOptionCardProps> = ({ option, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        padding: spacing[6],
        borderRadius: radii.xl,
        border: `2px solid ${colors.border.default}`,
        backgroundColor: colors.bg.secondary,
        cursor: option.comingSoon ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 200ms ease-out',
        transform: isHovered && !option.comingSoon ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered && !option.comingSoon ? shadows.lg : 'none',
        opacity: option.comingSoon ? 0.7 : 1,
      }}
    >
      {/* Badge */}
      {option.badge && (
        <div
          style={{
            position: 'absolute',
            top: spacing[3],
            right: spacing[3],
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.secondary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          {option.comingSoon && <Lock size={10} />}
          {option.badge}
        </div>
      )}

      {/* Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: radii.lg,
          background: option.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.text.primary,
          marginBottom: spacing[4],
          boxShadow: shadows.md,
        }}
      >
        {option.icon}
      </div>

      {/* Content */}
      <Text size="xl" weight="bold" style={{ marginBottom: spacing[2] }}>
        {option.title}
      </Text>
      <Text variant="secondary" size="sm" style={{ lineHeight: typography.lineHeight.relaxed }}>
        {option.description}
      </Text>

      {/* Arrow Indicator */}
      {!option.comingSoon && (
        <div
          style={{
            marginTop: spacing[4],
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            color: colors.brand.primary,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            transition: 'transform 200ms ease-out',
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
          }}
        >
          Get Started
          <ArrowRight size={16} />
        </div>
      )}
    </button>
  );
};

// Tip Item Component
interface TipItemProps {
  icon: string;
  text: string;
}

const TipItem: React.FC<TipItemProps> = ({ icon, text }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[3],
        borderRadius: radii.md,
        backgroundColor: colors.bg.tertiary,
      }}
    >
      <span style={{ fontSize: typography.fontSize.xl }}>{icon}</span>
      <Text variant="secondary" size="sm">
        {text}
      </Text>
    </div>
  );
};

export default CreateHubPage;
