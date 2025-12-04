import React, { useState, useRef } from 'react';
import { colors, radii, spacing, typography, shadows } from '../tokens';
import { Input } from '../atoms/Input';
import { IconButton } from '../atoms/IconButton';
import { Search, X, Mic } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  onVoiceSearch?: () => void;
  placeholder?: string;
  loading?: boolean;
  showCancel?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
  recentSearches?: string[];
  onSelectRecent?: (search: string) => void;
  onClearRecent?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  onClear,
  onVoiceSearch,
  placeholder = 'Search',
  loading = false,
  showCancel = false,
  onCancel,
  autoFocus = false,
  recentSearches = [],
  onSelectRecent,
  onClearRecent,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit?.(value.trim());
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const showRecentSearches = isFocused && !value && recentSearches.length > 0;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: spacing[3], top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: colors.text.tertiary }}>
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: spacing[10],
              paddingRight: value || onVoiceSearch ? spacing[20] : spacing[3],
              borderRadius: radii.full,
              border: `1px solid ${isFocused ? colors.brand.primary : colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              outline: 'none',
              transition: 'all 150ms ease-out',
            }}
          />
          {(value || onVoiceSearch) && (
            <div style={{ position: 'absolute', right: spacing[2], top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: spacing[1] }}>
              {value && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </IconButton>
              )}
              {onVoiceSearch && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={onVoiceSearch}
                  aria-label="Voice search"
                >
                  <Mic size={16} />
                </IconButton>
              )}
            </div>
          )}
        </div>
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              cursor: 'pointer',
              padding: spacing[2],
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {showRecentSearches && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing[1],
            backgroundColor: colors.bg.elevated,
            borderRadius: radii.lg,
            boxShadow: shadows.lg,
            border: `1px solid ${colors.border.default}`,
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: spacing[2], display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border.subtle}` }}>
            <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, fontWeight: typography.fontWeight.semibold }}>
              Recent Searches
            </span>
            {onClearRecent && (
              <button
                onClick={onClearRecent}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  padding: spacing[1],
                }}
              >
                Clear
              </button>
            )}
          </div>
          {recentSearches.map((search, index) => (
            <div
              key={index}
              onClick={() => onSelectRecent?.(search)}
              style={{
                padding: spacing[3],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Search size={16} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.base, color: colors.text.primary }}>
                {search}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
