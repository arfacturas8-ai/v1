import React from 'react';
import { ArrowLeft, MoreHorizontal, X } from 'lucide-react';
import { colors, spacing, typography, radii } from '../tokens';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
  };
  rightActions?: {
    icon: React.ReactNode;
    onClick: () => void;
    label?: string;
  }[];
  sticky?: boolean;
  transparent?: boolean;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
  leftAction,
  rightActions = [],
  sticky = false,
  transparent = false,
  children,
}) => {
  const hasDefaultLeftAction = onBack || onClose;
  const showLeftAction = hasDefaultLeftAction || leftAction;

  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100,
        backgroundColor: transparent ? 'transparent' : colors.bg.primary,
        borderBottom: transparent ? 'none' : `1px solid ${colors.border.default}`,
        backdropFilter: transparent ? 'blur(8px)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[4],
          gap: spacing[3],
        }}
      >
        {/* Left action */}
        {showLeftAction && (
          <div style={{ flexShrink: 0 }}>
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ArrowLeft size={20} color={colors.text.primary} />
              </button>
            )}
            {onClose && !onBack && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} color={colors.text.primary} />
              </button>
            )}
            {leftAction && !onBack && !onClose && (
              <button
                onClick={leftAction.onClick}
                aria-label={leftAction.label}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {leftAction.icon}
              </button>
            )}
          </div>
        )}

        {/* Title */}
        {(title || subtitle) && (
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <h1
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  margin: 0,
                  marginTop: spacing[1],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Custom content */}
        {children && (
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        )}

        {/* Right actions */}
        {rightActions.length > 0 && (
          <div style={{ display: 'flex', gap: spacing[2], flexShrink: 0 }}>
            {rightActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                aria-label={action.label}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: radii.full,
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
