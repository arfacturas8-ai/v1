import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  submenu?: DropdownItem[];
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  selected?: string[];
  onSelect?: (itemId: string) => void;
  align?: 'left' | 'right';
  multiSelect?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  selected = [],
  onSelect,
  align = 'left',
  multiSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSubmenuOpen(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;

    if (item.submenu) {
      setSubmenuOpen(submenuOpen === item.id ? null : item.id);
      return;
    }

    onSelect?.(item.id);
    if (!multiSelect) {
      setIsOpen(false);
    }
  };

  const renderItems = (menuItems: DropdownItem[], isSubmenu = false) => {
    return menuItems.map((item, index) => {
      const isSelected = selected.includes(item.id);
      const hasSubmenu = item.submenu && item.submenu.length > 0;
      const isSubmenuOpen = submenuOpen === item.id;

      if (item.divider) {
        return (
          <div
            key={`divider-${index}`}
            style={{
              height: '1px',
              backgroundColor: colors.border.default,
              margin: `${spacing[1]} 0`,
            }}
          />
        );
      }

      return (
        <div key={item.id} style={{ position: 'relative' }}>
          <button
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => hasSubmenu && setSubmenuOpen(item.id)}
            disabled={item.disabled}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: `${spacing[2]} ${spacing[3]}`,
              border: 'none',
              backgroundColor: 'transparent',
              color: item.destructive ? colors.semantic.error : colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 150ms ease-out',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Icon or checkbox */}
            {item.icon ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
            ) : multiSelect ? (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: radii.sm,
                  border: `2px solid ${isSelected ? colors.brand.primary : colors.border.default}`,
                  backgroundColor: isSelected ? colors.brand.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && <Check size={12} color="white" />}
              </div>
            ) : null}

            {/* Label */}
            <span style={{ flex: 1 }}>{item.label}</span>

            {/* Selected indicator or submenu arrow */}
            {hasSubmenu ? (
              <ChevronRight size={16} color={colors.text.tertiary} />
            ) : (
              !multiSelect && isSelected && <Check size={16} color={colors.brand.primary} />
            )}
          </button>

          {/* Submenu */}
          {hasSubmenu && isSubmenuOpen && item.submenu && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: spacing[1],
                backgroundColor: colors.bg.elevated,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.md,
                boxShadow: shadows.lg,
                minWidth: '200px',
                zIndex: 10,
                padding: spacing[1],
              }}
            >
              {renderItems(item.submenu, true)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: spacing[2],
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.md,
            boxShadow: shadows.lg,
            minWidth: '200px',
            maxHeight: '400px',
            overflow: 'auto',
            zIndex: 1000,
            padding: spacing[1],
            animation: 'scaleIn 150ms ease-out',
          }}
        >
          {renderItems(items)}
        </div>
      )}

      <style>
        {`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};
