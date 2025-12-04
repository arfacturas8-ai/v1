import React from 'react';
import { colors, spacing, typography, radii } from '../tokens';

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
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
}) => {
  if (variant === 'pills') {
    return (
      <div
        style={{
          display: 'flex',
          gap: spacing[2],
          padding: spacing[2],
          backgroundColor: colors.bg.secondary,
          borderRadius: radii.lg,
          overflow: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              style={{
                flex: fullWidth ? 1 : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: radii.md,
                border: 'none',
                backgroundColor: isActive ? colors.brand.primary : 'transparent',
                color: isActive ? 'white' : colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!tab.disabled && !isActive) {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                  e.currentTarget.style.color = colors.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.disabled && !isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.secondary;
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    padding: `0 ${spacing[2]}`,
                    borderRadius: radii.full,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : colors.brand.primary,
                    color: 'white',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div
        style={{
          display: 'flex',
          gap: spacing[4],
          borderBottom: `1px solid ${colors.border.default}`,
          overflow: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onChange(tab.id)}
              disabled={tab.disabled}
              style={{
                flex: fullWidth ? 1 : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                padding: `${spacing[3]} ${spacing[2]}`,
                border: 'none',
                backgroundColor: 'transparent',
                color: isActive ? colors.text.primary : colors.text.secondary,
                fontSize: typography.fontSize.base,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                position: 'relative',
                transition: 'color 150ms ease-out',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!tab.disabled && !isActive) {
                  e.currentTarget.style.color = colors.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!tab.disabled && !isActive) {
                  e.currentTarget.style.color = colors.text.secondary;
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  style={{
                    padding: `0 ${spacing[2]}`,
                    borderRadius: radii.full,
                    backgroundColor: colors.brand.primary,
                    color: 'white',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: colors.brand.primary,
                    borderRadius: `${radii.sm} ${radii.sm} 0 0`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing[1],
        backgroundColor: colors.bg.secondary,
        padding: spacing[1],
        borderRadius: radii.lg,
        overflow: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            style={{
              flex: fullWidth ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: `${spacing[3]} ${spacing[4]}`,
              borderRadius: radii.md,
              border: 'none',
              backgroundColor: isActive ? colors.bg.primary : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary,
              fontSize: typography.fontSize.base,
              fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              opacity: tab.disabled ? 0.5 : 1,
              transition: 'all 150ms ease-out',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!tab.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!tab.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  padding: `0 ${spacing[2]}`,
                  borderRadius: radii.full,
                  backgroundColor: colors.brand.primary,
                  color: 'white',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
