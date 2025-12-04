import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

interface SearchBarProps {
  value?: string;
  placeholder?: string;
  showCancel?: boolean;
  showVoice?: boolean;
  showRecentSearches?: boolean;
  recentSearches?: RecentSearch[];
  loading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  onCancel?: () => void;
  onVoiceInput?: () => void;
  onRecentSearchClick?: (search: RecentSearch) => void;
  onRemoveRecentSearch?: (id: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  placeholder = 'Search...',
  showCancel = false,
  showVoice = false,
  showRecentSearches = false,
  recentSearches = [],
  loading = false,
  disabled = false,
  autoFocus = false,
  onChange,
  onSearch,
  onClear,
  onCancel,
  onVoiceInput,
  onRecentSearchClick,
  onRemoveRecentSearch,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [showRecents, setShowRecents] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (onChange) onChange('');
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    if (onChange) onChange('');
    if (onCancel) onCancel();
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
      setShowRecents(false);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleRecentClick = (search: RecentSearch) => {
    if (onChange) onChange(search.query);
    if (onRecentSearchClick) onRecentSearchClick(search);
    setShowRecents(false);
  };

  const handleRemoveRecent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onRemoveRecentSearch) onRemoveRecentSearch(id);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        {/* Search Input Container */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Search Icon */}
          <div
            style={{
              position: 'absolute',
              left: spacing[3],
              color: colors.text.tertiary,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12.5 12.5L16 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (showRecentSearches && recentSearches.length > 0) {
                setShowRecents(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowRecents(false);
              }, 200);
            }}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: `calc(${spacing[3]} + 28px)`,
              paddingRight:
                loading || (value && !disabled) || showVoice
                  ? `calc(${spacing[3]} + 36px)`
                  : spacing[3],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${isFocused ? colors.brand.primary : colors.border.default}`,
              borderRadius: radii.full,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              outline: 'none',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />

          {/* Loading Indicator */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                right: spacing[3],
                color: colors.text.tertiary,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path
                  d="M9 2a7 7 0 0 1 7 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Clear Button */}
          {!loading && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: showVoice ? `calc(${spacing[3]} + 32px)` : spacing[3],
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.full,
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.text.primary;
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.tertiary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                <circle cx="9" cy="9" r="9" opacity="0.3" />
                <path
                  d="M12 6L6 12M6 6l6 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Voice Input Button */}
          {!loading && showVoice && !value && (
            <button
              type="button"
              onClick={onVoiceInput}
              disabled={disabled}
              style={{
                position: 'absolute',
                right: spacing[3],
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.full,
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.color = colors.brand.primary;
                  e.currentTarget.style.backgroundColor = colors.bg.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.text.tertiary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="6" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M9 12v4M5 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Cancel Button */}
        {showCancel && isFocused && (
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: colors.brand.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              fontFamily: typography.fontFamily.sans,
              cursor: 'pointer',
              padding: spacing[2],
              whiteSpace: 'nowrap',
              transition: `opacity ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showRecents && recentSearches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: `calc(100% + ${spacing[2]})`,
            left: 0,
            right: showCancel && isFocused ? '70px' : 0,
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border.default}`,
            borderRadius: radii.lg,
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Searches
          </div>
          {recentSearches.map((search) => (
            <div
              key={search.id}
              onClick={() => handleRecentClick(search)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing[3]} ${spacing[4]}`,
                cursor: 'pointer',
                transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 14a6 6 0 100-12 6 6 0 000 12z"
                    stroke={colors.text.tertiary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 4v4l2 2"
                    stroke={colors.text.tertiary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  {search.query}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleRemoveRecent(e, search.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.tertiary,
                  cursor: 'pointer',
                  padding: spacing[1],
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: radii.sm,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.tertiary;
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
