import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  size?: TextareaSize;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  fullWidth?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  readOnly?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  value = '',
  placeholder,
  disabled = false,
  error = false,
  errorMessage,
  label,
  helperText,
  size = 'md',
  rows = 4,
  maxLength,
  showCount = false,
  autoResize = false,
  minRows = 3,
  maxRows,
  onChange,
  onFocus,
  onBlur,
  fullWidth = true,
  autoFocus = false,
  required = false,
  readOnly = false,
  resize = 'vertical',
  className,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const getSizeStyles = (): React.CSSProperties => {
    const sizes = {
      sm: { padding: spacing[2], fontSize: typography.fontSize.sm },
      md: { padding: spacing[3], fontSize: typography.fontSize.base },
      lg: { padding: spacing[4], fontSize: typography.fontSize.lg },
    };
    return sizes[size];
  };

  const getBorderColor = () => {
    if (error) return colors.semantic.error;
    if (isFocused) return colors.brand.primary;
    if (isHovered) return colors.border.strong;
    return colors.border.default;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }

    if (autoResize && textareaRef.current) {
      adjustHeight();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows ? maxRows * lineHeight : Infinity;
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
  };

  React.useEffect(() => {
    if (autoResize) {
      adjustHeight();
    }
  }, [value, autoResize, minRows, maxRows]);

  const sizeStyles = getSizeStyles();

  return (
    <div className={className} style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: error ? colors.semantic.error : colors.text.secondary,
            marginBottom: spacing[2],
          }}
        >
          {label}
          {required && <span style={{ color: colors.semantic.error, marginLeft: spacing[1] }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          autoFocus={autoFocus}
          required={required}
          rows={autoResize ? minRows : rows}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: '100%',
            ...sizeStyles,
            backgroundColor: disabled ? colors.bg.tertiary : colors.bg.secondary,
            border: `1px solid ${getBorderColor()}`,
            borderRadius: radii.md,
            color: disabled ? colors.text.tertiary : colors.text.primary,
            fontFamily: typography.fontFamily.sans,
            fontSize: sizeStyles.fontSize,
            lineHeight: typography.lineHeight.relaxed,
            outline: 'none',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'text',
            resize: autoResize ? 'none' : resize,
            boxSizing: 'border-box',
            minHeight: autoResize ? `${minRows * 1.5}em` : undefined,
            maxHeight: autoResize && maxRows ? `${maxRows * 1.5}em` : undefined,
            overflow: autoResize ? 'hidden' : 'auto',
          }}
        />
      </div>

      {(helperText || errorMessage || showCount) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing[2],
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: error ? colors.semantic.error : colors.text.tertiary,
              flex: 1,
            }}
          >
            {error ? errorMessage : helperText}
          </span>
          {showCount && maxLength && (
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: value.length >= maxLength ? colors.semantic.warning : colors.text.tertiary,
                marginLeft: spacing[2],
              }}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Textarea;
