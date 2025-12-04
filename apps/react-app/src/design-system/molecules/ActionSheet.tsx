import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { colors, spacing, typography, radii } from '../tokens';

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  showCancel?: boolean;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  actions,
  showCancel = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action: ActionSheetAction) => {
    action.onClick();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          animation: 'fadeIn 200ms ease-out',
        }}
      />

      {/* Action sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          backgroundColor: colors.bg.elevated,
          borderRadius: `${radii.xl} ${radii.xl} 0 0`,
          maxHeight: '80vh',
          overflow: 'auto',
          animation: 'slideUp 250ms ease-out',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: spacing[2],
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: radii.full,
              backgroundColor: colors.border.default,
            }}
          />
        </div>

        {/* Header */}
        {(title || description) && (
          <div
            style={{
              padding: `${spacing[4]} ${spacing[5]}`,
              borderBottom: `1px solid ${colors.border.default}`,
            }}
          >
            {title && (
              <h3
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  margin: 0,
                  marginBottom: description ? spacing[2] : 0,
                }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  margin: 0,
                  lineHeight: typography.lineHeight.relaxed,
                }}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: spacing[2] }}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action)}
              disabled={action.disabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[4],
                border: 'none',
                backgroundColor: 'transparent',
                borderRadius: radii.md,
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.5 : 1,
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                if (!action.disabled) {
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!action.disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {action.icon && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.destructive ? colors.semantic.error : colors.text.secondary,
                  }}
                >
                  {action.icon}
                </div>
              )}
              <span
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: action.destructive ? colors.semantic.error : colors.text.primary,
                  textAlign: 'left',
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        {showCancel && (
          <div
            style={{
              padding: spacing[2],
              borderTop: `1px solid ${colors.border.default}`,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: spacing[4],
                border: 'none',
                backgroundColor: 'transparent',
                borderRadius: radii.md,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
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
              Cancel
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};
