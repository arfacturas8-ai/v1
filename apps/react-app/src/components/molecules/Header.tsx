import React from 'react';
import { colors, spacing, typography, radii, animation, zIndex } from '../../design-system/tokens';

export type HeaderVariant = 'default' | 'large';

interface HeaderAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
}

interface HeaderProps {
  variant?: HeaderVariant;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  leftAction?: React.ReactNode;
  rightActions?: HeaderAction[];
  transparent?: boolean;
  sticky?: boolean;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  variant = 'default',
  title,
  subtitle,
  showBackButton = false,
  leftAction,
  rightActions = [],
  transparent = false,
  sticky = false,
  onBack,
}) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    if (!sticky) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sticky]);

  const isLarge = variant === 'large';

  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor:
          transparent && !scrolled ? 'transparent' : scrolled ? colors.bg.primary : colors.bg.secondary,
        borderBottom: scrolled || !transparent ? `1px solid ${colors.border.subtle}` : 'none',
        zIndex: zIndex.sticky,
        transition: `all ${animation.duration.normal} ${animation.easing.easeOut}`,
        backdropFilter: scrolled && transparent ? 'blur(10px)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          padding: isLarge ? `${spacing[6]} ${spacing[4]}` : `${spacing[3]} ${spacing[4]}`,
          transition: `padding ${animation.duration.normal} ${animation.easing.easeOut}`,
        }}
      >
        {/* Top Row - Back Button / Left Action + Right Actions */}
        {(showBackButton || leftAction || rightActions.length > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isLarge ? spacing[4] : spacing[2],
            }}
          >
            {/* Left Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              {showBackButton && (
                <button
                  type="button"
                  onClick={onBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.primary,
                    cursor: 'pointer',
                    padding: spacing[2],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.md,
                    transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Go back"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              {leftAction && <div>{leftAction}</div>}
            </div>

            {/* Right Actions */}
            {rightActions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                {rightActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    style={{
                      position: 'relative',
                      background: 'none',
                      border: 'none',
                      color: action.disabled ? colors.text.tertiary : colors.text.primary,
                      cursor: action.disabled ? 'not-allowed' : 'pointer',
                      padding: spacing[2],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radii.md,
                      transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
                      opacity: action.disabled ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!action.disabled) {
                        e.currentTarget.style.backgroundColor = colors.bg.hover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    aria-label={action.label}
                  >
                    {action.icon}
                    {action.badge !== undefined && action.badge > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: spacing[1],
                          right: spacing[1],
                          backgroundColor: colors.semantic.error,
                          color: colors.text.primary,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.bold,
                          fontFamily: typography.fontFamily.sans,
                          borderRadius: radii.full,
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 4px',
                        }}
                      >
                        {action.badge > 99 ? '99+' : action.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Title Section */}
        <div>
          <h1
            style={{
              fontSize: isLarge ? typography.fontSize['4xl'] : typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.sans,
              color: colors.text.primary,
              margin: 0,
              lineHeight: typography.lineHeight.tight,
              transition: `font-size ${animation.duration.normal} ${animation.easing.easeOut}`,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: isLarge ? typography.fontSize.lg : typography.fontSize.base,
                fontFamily: typography.fontFamily.sans,
                color: colors.text.secondary,
                margin: `${spacing[2]} 0 0 0`,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
