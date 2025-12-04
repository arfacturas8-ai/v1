import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Image, Package } from 'lucide-react';
import { colors, spacing, radii, shadows, typography } from '../design-system/tokens';
import { Text } from '../design-system/atoms';

interface CreateOption {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  isLive: boolean;
}

export function CreateHubPage() {
  const navigate = useNavigate();

  const createOptions: CreateOption[] = [
    {
      title: 'New Post',
      description: 'Share updates with your followers',
      icon: <FileText size={32} />,
      route: '/create-post',
      isLive: true,
    },
    {
      title: 'Start Community',
      description: 'Build a space for your audience',
      icon: <Users size={32} />,
      route: '/create-community',
      isLive: true,
    },
    {
      title: 'Create NFT',
      description: 'Mint your creation on the blockchain',
      icon: <Image size={32} />,
      route: '/create-nft',
      isLive: false,
    },
    {
      title: 'Create Collection',
      description: 'Organize your NFTs into a collection',
      icon: <Package size={32} />,
      route: '/create-nft',
      isLive: false,
    },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
    padding: spacing[6],
  };

  const maxWidthStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing[8],
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing[4],
  };

  const cardStyle = (isLive: boolean): React.CSSProperties => ({
    backgroundColor: colors['bg-secondary'],
    border: `1px solid ${colors['border-default']}`,
    borderRadius: radii.lg,
    padding: spacing[6],
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
    position: 'relative',
    opacity: isLive ? 1 : 0.7,
  });

  const cardHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: shadows.md,
    borderColor: colors['brand-primary'],
  };

  const iconWrapperStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    backgroundColor: colors['bg-elevated'],
    borderRadius: radii.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    color: colors['brand-primary'],
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    padding: `${spacing[1]} ${spacing[2]}`,
    backgroundColor: colors['warning-bg'],
    color: colors['warning'],
    borderRadius: radii.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null);

  return (
    <div style={containerStyle}>
      <div style={maxWidthStyle}>
        <div style={headerStyle}>
          <Text size="3xl" weight="bold" style={{ marginBottom: spacing[2] }}>
            Create
          </Text>
          <Text size="lg" variant="secondary">
            Share your creativity with the world
          </Text>
        </div>

        <div style={gridStyle}>
          {createOptions.map((option, index) => (
            <div
              key={index}
              style={{
                ...cardStyle(option.isLive),
                ...(hoveredCard === index ? cardHoverStyle : {}),
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(option.route)}
            >
              {!option.isLive && (
                <div style={badgeStyle}>
                  Coming Soon
                </div>
              )}

              <div style={iconWrapperStyle}>
                {option.icon}
              </div>

              <Text size="xl" weight="bold" style={{ marginBottom: spacing[2] }}>
                {option.title}
              </Text>

              <Text variant="secondary" size="base">
                {option.description}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CreateHubPage;
