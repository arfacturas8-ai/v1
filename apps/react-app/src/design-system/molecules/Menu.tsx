/**
 * Menu Molecule Component
 * Dropdown menu with items
 */

import React from 'react';
import { colors, radii, spacing, shadows, typography } from '../tokens';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  className?: string;
  style?: React.CSSProperties;
}

export const Menu: React.FC<MenuProps> = ({
  items,
  open,
  onClose,
  anchorEl,
  className,
  style,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const menuStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: colors['bg-elevated'],
    borderRadius: radii.md,
    boxShadow: shadows.xl,
    border: `1px solid ${colors['border-default']}`,
    minWidth: '200px',
    padding: spacing[2],
    ...style,
  };

  return (
    <div ref={menuRef} className={className} style={menuStyles}>
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          {item.divider && index > 0 && (
            <div
              style={{
                height: '1px',
                backgroundColor: colors['border-subtle'],
                margin: `${spacing[2]} 0`,
              }}
            />
          )}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              padding: `${spacing[2]} ${spacing[3]}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: radii.sm,
              color:
                item.variant === 'danger'
                  ? colors['error']
                  : colors['text-primary'],
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.sans,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = colors['bg-hover'];
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.icon && (
              <span style={{ display: 'flex', fontSize: '18px' }}>
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Menu;
