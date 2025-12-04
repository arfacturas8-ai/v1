import React from 'react';
import { colors, spacing, typography, radii, animation, zIndex } from '../../design-system/tokens';

export type TabBarPosition = 'top' | 'bottom';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  position?: TabBarPosition;
  onChange: (tabId: string) => void;
  showLabels?: boolean;
  hapticFeedback?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  position = 'bottom',
  onChange,
  showLabels = true,
  hapticFeedback = true,
}) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  const triggerHaptic = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTabClick = (tab: Tab) => {
    if (!tab.disabled && tab.id !== activeTab) {
      triggerHaptic();
      onChange(tab.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tab: Tab) => {
    if ((e.key === 'Enter' || e.key === ' ') && !tab.disabled) {
      e.preventDefault();
      handleTabClick(tab);
    }
  };

  return (
    <nav
      role="tablist"
      style={{
        position: 'fixed',
        [position]: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bg.elevated,
        borderTop: position === 'bottom' ? `1px solid ${colors.border.subtle}` : 'none',
        borderBottom: position === 'top' ? `1px solid ${colors.border.subtle}` : 'none',
        zIndex: zIndex.sticky,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          height: showLabels ? '72px' : '56px',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isHovered = hoveredTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
              tabIndex={tab.disabled ? -1 : 0}
              onClick={() => handleTabClick(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab)}
              onMouseEnter={() => !tab.disabled && setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[1],
                backgroundColor: isHovered && !isActive ? colors.bg.hover : 'transparent',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                position: 'relative',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                padding: `${spacing[2]} ${spacing[1]}`,
              }}
            >
              {/* Icon Container */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? colors.brand.primary : isHovered ? colors.text.primary : colors.text.secondary,
                  transition: `color ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
              >
                {tab.icon}

                {/* Badge */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
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
                      border: `2px solid ${colors.bg.elevated}`,
                    }}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              {showLabels && (
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                    fontFamily: typography.fontFamily.sans,
                    color: isActive ? colors.brand.primary : isHovered ? colors.text.primary : colors.text.secondary,
                    textAlign: 'center',
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                >
                  {tab.label}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    [position === 'bottom' ? 'top' : 'bottom']: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40%',
                    height: '3px',
                    backgroundColor: colors.brand.primary,
                    borderRadius: position === 'bottom' ? `0 0 ${radii.full} ${radii.full}` : `${radii.full} ${radii.full} 0 0`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
